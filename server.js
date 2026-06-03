import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE = process.env.DEFAULT_TTS_VOICE || "alloy";

const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");
const renderDir = path.join(__dirname, "renders");
const tempDir = path.join(__dirname, "tmp");
for (const dir of [dataDir, uploadDir, renderDir, tempDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(path.join(dataDir, "studio.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  config TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  output_url TEXT
);
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  type TEXT NOT NULL,
  original_name TEXT,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  meta TEXT,
  created_at TEXT NOT NULL
);
`);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(uploadDir, { setHeaders: res => res.setHeader("Access-Control-Allow-Origin", "*") }));
app.use("/renders", express.static(renderDir, { setHeaders: res => res.setHeader("Access-Control-Allow-Origin", "*") }));
app.use(express.static(path.join(__dirname, "public")));

const allowed = new Set([
  "video/mp4","video/webm","video/quicktime",
  "audio/mpeg","audio/mp3","audio/wav","audio/aac","audio/ogg","audio/x-wav",
  "image/png","image/jpeg","image/webp"
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext || ""}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024, files: 100 },
  fileFilter: (req, file, cb) => allowed.has(file.mimetype) ? cb(null, true) : cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`))
});

function now() { return new Date().toISOString(); }
function publicUrl(fileOrName, folder = "uploads") {
  const filename = typeof fileOrName === "string" ? fileOrName : fileOrName.filename;
  return `${PUBLIC_BASE_URL}/${folder}/${filename}`;
}
function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
    let stdout = "", stderr = "";
    p.stdout.on("data", d => stdout += d.toString());
    p.stderr.on("data", d => stderr += d.toString());
    p.on("close", code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${cmd} failed (${code})\n${stderr}`)));
  });
}
function quoteConcatPath(p) {
  return "file '" + p.replace(/'/g, "'\\''") + "'";
}

async function openaiTTS(text, voice, outPath) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY eksik.");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice: voice || DEFAULT_TTS_VOICE,
      input: text,
      format: "mp3"
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI TTS hata: ${res.status} ${t}`);
  }
  const arr = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, arr);
  return outPath;
}

function parseDialogBlocks(text) {
  const lines = (text || "").split(/\r?\n/);
  const blocks = [];
  let current = { speaker: "Anlatıcı", text: [] };
  for (const raw of lines) {
    const line = raw.trim();
    const match = line.match(/^\[(.+?)\]\s*$/);
    if (match) {
      if (current.text.join("\n").trim()) blocks.push({ speaker: current.speaker, text: current.text.join("\n").trim() });
      current = { speaker: match[1].trim(), text: [] };
    } else {
      current.text.push(raw);
    }
  }
  if (current.text.join("\n").trim()) blocks.push({ speaker: current.speaker, text: current.text.join("\n").trim() });
  return blocks;
}

function getVoiceForSpeaker(characters, speaker) {
  const found = (characters || []).find(c => (c.name || "").trim().toLowerCase() === (speaker || "").trim().toLowerCase());
  return found?.openaiVoice || found?.voice || DEFAULT_TTS_VOICE;
}

async function makeVoiceTrack(projectId, voiceText, characters) {
  const blocks = parseDialogBlocks(voiceText);
  if (!blocks.length) return null;
  const work = path.join(tempDir, projectId);
  fs.mkdirSync(work, { recursive: true });

  const parts = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const voice = getVoiceForSpeaker(characters, b.speaker);
    const out = path.join(work, `voice_${String(i).padStart(3, "0")}.mp3`);
    await openaiTTS(b.text, voice, out);
    parts.push(out);
  }

  const listFile = path.join(work, "voice_list.txt");
  fs.writeFileSync(listFile, parts.map(quoteConcatPath).join("\n"));
  const finalVoice = path.join(work, "voice_full.mp3");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", finalVoice]);
  return finalVoice;
}

async function renderProject(project) {
  const config = JSON.parse(project.config);
  const projectId = project.id;
  const work = path.join(tempDir, projectId);
  fs.mkdirSync(work, { recursive: true });

  const clips = config.clips || [];
  if (!clips.length) throw new Error("Render için en az 1 klip gerekli.");

  const processed = [];
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const src = path.join(uploadDir, clip.filename);
    if (!fs.existsSync(src)) throw new Error(`Klip bulunamadı: ${clip.filename}`);

    const out = path.join(work, `clip_${String(i).padStart(3, "0")}.mp4`);
    const trimStart = Math.max(0, Number(clip.trimStart || 0));
    const trimEnd = Math.max(0, Number(clip.trimEnd || 0));

    const args = ["-y"];
    if (trimStart > 0) args.push("-ss", String(trimStart));
    args.push("-i", src);
    if (trimEnd > 0) args.push("-t", String(trimEnd - trimStart));
    args.push(
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1",
      "-r", "30",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "20",
      "-an",
      out
    );
    await run("ffmpeg", args);
    processed.push(out);
  }

  const listFile = path.join(work, "clips.txt");
  fs.writeFileSync(listFile, processed.map(quoteConcatPath).join("\n"));
  const merged = path.join(work, "merged.mp4");
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", merged]);

  const voiceTrack = await makeVoiceTrack(projectId, config.voiceText || "", config.characters || []);
  const music = config.music?.filename ? path.join(uploadDir, config.music.filename) : null;

  const outputName = `${projectId}.mp4`;
  const outputPath = path.join(renderDir, outputName);

  if (voiceTrack && music && fs.existsSync(music)) {
    await run("ffmpeg", [
      "-y",
      "-i", merged,
      "-i", voiceTrack,
      "-stream_loop", "-1", "-i", music,
      "-filter_complex",
      `[1:a]volume=${config.voiceVolume || 1}[v];[2:a]volume=${config.musicVolume || 0.28}[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[a]`,
      "-map", "0:v",
      "-map", "[a]",
      "-shortest",
      "-c:v", "copy",
      "-c:a", "aac",
      "-b:a", "192k",
      outputPath
    ]);
  } else if (voiceTrack) {
    await run("ffmpeg", ["-y", "-i", merged, "-i", voiceTrack, "-map", "0:v", "-map", "1:a", "-shortest", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", outputPath]);
  } else if (music && fs.existsSync(music)) {
    await run("ffmpeg", ["-y", "-i", merged, "-stream_loop", "-1", "-i", music, "-filter_complex", `[1:a]volume=${config.musicVolume || 0.28}[m]`, "-map", "0:v", "-map", "[m]", "-shortest", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", outputPath]);
  } else {
    fs.copyFileSync(merged, outputPath);
  }

  const outputUrl = publicUrl(outputName, "renders");
  db.prepare("UPDATE projects SET status=?, output_url=?, updated_at=? WHERE id=?").run("done", outputUrl, now(), projectId);
  return outputUrl;
}

app.get("/api/projects", (req, res) => {
  const rows = db.prepare("SELECT id, name, status, created_at, updated_at, output_url FROM projects ORDER BY updated_at DESC").all();
  res.json({ projects: rows });
});

app.get("/api/projects/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM projects WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Proje bulunamadı." });
  res.json({ ...row, config: JSON.parse(row.config) });
});

app.post("/api/projects", upload.any(), async (req, res) => {
  try {
    const projectId = uuidv4();
    const created = now();
    const videos = req.files.filter(f => f.fieldname === "videos");
    const music = req.files.find(f => f.fieldname === "music");

    if (!videos.length) return res.status(400).json({ error: "En az 1 video klip yükle." });

    let characters = [];
    try { characters = JSON.parse(req.body.charactersJson || "[]"); } catch { characters = []; }

    const customVoiceFiles = {};
    for (const file of req.files) {
      if (file.fieldname.startsWith("customVoice_")) customVoiceFiles[file.fieldname] = file;
    }

    characters = characters.map(ch => {
      const file = customVoiceFiles[ch.customVoiceField];
      return { ...ch, customVoiceUrl: file ? publicUrl(file) : "", customVoiceFilename: file?.filename || "" };
    });

    const clips = videos.map((file, index) => ({
      id: uuidv4(),
      order: index,
      originalName: file.originalname,
      filename: file.filename,
      url: publicUrl(file),
      trimStart: Number(req.body[`trimStart_${index}`] || 0),
      trimEnd: Number(req.body[`trimEnd_${index}`] || 0),
      sceneVoiceText: req.body[`sceneVoice_${index}`] || "",
      subtitle: req.body[`subtitle_${index}`] || ""
    }));

    const config = {
      clips,
      characters,
      voiceText: req.body.voiceText || "",
      subtitles: req.body.subtitles || "",
      musicPrompt: req.body.musicPrompt || "",
      music: music ? { filename: music.filename, url: publicUrl(music), originalName: music.originalname } : null,
      ratio: req.body.ratio || "1280:720",
      transition: req.body.transition || "crossfade",
      voiceVolume: Number(req.body.voiceVolume || 1),
      musicVolume: Number(req.body.musicVolume || 0.28),
      lipSync: {
        enabled: req.body.lipSyncEnabled === "true",
        provider: req.body.lipSyncProvider || "none"
      }
    };

    const projectName = req.body.projectName || `Proje ${created}`;
    db.prepare("INSERT INTO projects (id, name, status, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(projectId, projectName, "uploaded", JSON.stringify(config), created, created);

    for (const file of req.files) {
      db.prepare("INSERT INTO assets (id, project_id, type, original_name, filename, url, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(uuidv4(), projectId, file.fieldname, file.originalname, file.filename, publicUrl(file), JSON.stringify({ mimetype: file.mimetype, size: file.size }), created);
    }

    res.json({ ok: true, projectId, projectName, clipCount: clips.length, characterCount: characters.length, projectUrl: `/api/projects/${projectId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/projects/:id/render", async (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM projects WHERE id=?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Proje bulunamadı." });

    db.prepare("UPDATE projects SET status=?, updated_at=? WHERE id=?").run("rendering", now(), req.params.id);
    const outputUrl = await renderProject(row);
    res.json({ ok: true, outputUrl });
  } catch (err) {
    db.prepare("UPDATE projects SET status=?, updated_at=? WHERE id=?").run("error", now(), req.params.id);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Video Studio çalışıyor: http://0.0.0.0:${PORT}`);
  console.log(`Public base URL: ${PUBLIC_BASE_URL}`);
});
