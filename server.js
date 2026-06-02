import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://72.62.186.96:5678/webhook/video-uret";
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const allowed = new Set(["video/mp4","video/webm","video/quicktime","audio/mpeg","audio/mp3","audio/wav","audio/aac","audio/ogg","audio/x-wav"]);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase().replace(/[^a-z0-9.]/g,"");
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext || ""}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024, files: 30 },
  fileFilter: (req, file, cb) => allowed.has(file.mimetype) ? cb(null,true) : cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`))
});
app.use(cors());
app.use("/uploads", express.static(uploadDir, { setHeaders: res => res.setHeader("Access-Control-Allow-Origin","*") }));
app.use(express.static(path.join(__dirname, "public")));
const publicUrl = (file) => file ? `${PUBLIC_BASE_URL}/uploads/${file.filename}` : "";

app.post("/api/create-video", upload.fields([{ name: "videos", maxCount: 25 }, { name: "music", maxCount: 1 }]), async (req, res) => {
  try {
    const videos = req.files?.videos || [];
    const music = req.files?.music?.[0];
    if (!videos.length) return res.status(400).json({ error: "En az 1 video yükle." });
    const videoUrls = videos.map(publicUrl);
    const musicUrl = publicUrl(music);
    const payload = {
      ...req.body,
      sourceType: "uploaded_videos",
      useRunwayApi: false,
      renderMode: "merge_uploaded_videos",
      ttsProvider: "openai",
      voiceMode: "openai_tts",
      videoUrls,
      musicUrl,
      musicMode: musicUrl ? "upload" : "prompt",
      voiceText: req.body.voiceText || "",
      musicPrompt: req.body.musicPrompt || "",
      dinoVoice: req.body.dinoVoice || "alloy",
      roboVoice: req.body.roboVoice || "echo",
      voiceVolume: Number(req.body.voiceVolume || 1),
      musicVolume: Number(req.body.musicVolume || 0.28),
      transition: req.body.transition || "fade",
      ratio: req.body.ratio || "1280:720"
    };
    const n8nRes = await fetch(N8N_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const text = await n8nRes.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(n8nRes.ok ? 200 : 502).json({
      ok: n8nRes.ok,
      message: "Panel video klipleri n8n'e gönderdi.",
      uploaded: { videoUrls, musicUrl },
      request: { sourceType: payload.sourceType, useRunwayApi: payload.useRunwayApi, ttsProvider: payload.ttsProvider, clipCount: videoUrls.length, musicMode: payload.musicMode },
      n8n: data
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Video Birleştirici çalışıyor: http://0.0.0.0:${PORT}`);
  console.log(`Public base URL: ${PUBLIC_BASE_URL}`);
  console.log(`n8n webhook: ${N8N_WEBHOOK_URL}`);
});