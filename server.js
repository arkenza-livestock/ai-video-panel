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
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE = process.env.DEFAULT_TTS_VOICE || "alloy";

const dirs = {
  data: path.join(__dirname, "data"),
  uploads: path.join(__dirname, "uploads"),
  renders: path.join(__dirname, "renders"),
  previews: path.join(__dirname, "voice-previews"),
  tmp: path.join(__dirname, "tmp")
};
for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true });

const db = new Database(path.join(dirs.data, "studio.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL, config TEXT NOT NULL, output_url TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, project_id TEXT, type TEXT NOT NULL, original_name TEXT, filename TEXT NOT NULL, url TEXT NOT NULL, meta TEXT, created_at TEXT NOT NULL);
`);

function now(){ return new Date().toISOString(); }
function setting(k, fallback=""){ const r = db.prepare("SELECT value FROM settings WHERE key=?").get(k); return r ? r.value : fallback; }
function setSetting(k,v){ db.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").run(k, String(v ?? ""), now()); }
function key(name){ if(name==="openai") return setting("api.openai.key", process.env.OPENAI_API_KEY || ""); return setting("api."+name+".key", ""); }
function url(filename, folder="uploads"){ return `${PUBLIC_BASE_URL}/${folder}/${filename}`; }
function quote(p){ return "file '" + p.replace(/'/g, "'\\''") + "'"; }
function run(cmd,args){ return new Promise((resolve,reject)=>{ const p=spawn(cmd,args,{stdio:["ignore","pipe","pipe"]}); let out="",err=""; p.stdout.on("data",d=>out+=d.toString()); p.stderr.on("data",d=>err+=d.toString()); p.on("close",c=>c===0?resolve({out,err}):reject(new Error(`${cmd} failed (${c})\n${err}`))); }); }

app.use(cors());
app.use(express.json({limit:"50mb"}));
app.use("/uploads", express.static(dirs.uploads, { setHeaders: r => r.setHeader("Access-Control-Allow-Origin", "*") }));
app.use("/renders", express.static(dirs.renders, { setHeaders: r => r.setHeader("Access-Control-Allow-Origin", "*") }));
app.use("/voice-previews", express.static(dirs.previews, { setHeaders: r => r.setHeader("Access-Control-Allow-Origin", "*") }));
app.use(express.static(path.join(__dirname, "public")));

const allowed = new Set(["video/mp4","video/webm","video/quicktime","audio/mpeg","audio/mp3","audio/wav","audio/aac","audio/ogg","audio/x-wav","image/png","image/jpeg","image/webp"]);
const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null, dirs.uploads),
  filename:(req,file,cb)=>{ const ext=path.extname(file.originalname||"").toLowerCase().replace(/[^a-z0-9.]/g,""); cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext||""}`); }
});
const upload = multer({
  storage,
  limits:{fileSize:2*1024*1024*1024, files:120},
  fileFilter:(req,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`))
});

async function openaiTTS(text, voice, outPath){
  const apiKey = key("openai");
  if(!apiKey) throw new Error("OpenAI API key eksik. API Ayarları bölümünden ekle.");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
    body:JSON.stringify({ model: setting("tts.model", OPENAI_TTS_MODEL), voice: voice || DEFAULT_TTS_VOICE, input:text, format:"mp3" })
  });
  if(!res.ok) throw new Error(`OpenAI TTS hata: ${res.status} ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
  return outPath;
}
function parseBlocks(text){
  const lines=(text||"").split(/\r?\n/), blocks=[]; let cur={speaker:"Anlatıcı", text:[]};
  for(const raw of lines){ const m=raw.trim().match(/^\[(.+?)\]\s*$/); if(m){ if(cur.text.join("\n").trim()) blocks.push({speaker:cur.speaker,text:cur.text.join("\n").trim()}); cur={speaker:m[1].trim(),text:[]}; } else cur.text.push(raw); }
  if(cur.text.join("\n").trim()) blocks.push({speaker:cur.speaker,text:cur.text.join("\n").trim()});
  return blocks;
}
function speakerVoice(chars, speaker){
  const found=(chars||[]).find(c=>(c.name||"").toLowerCase()===(speaker||"").toLowerCase());
  return found?.openaiVoice || DEFAULT_TTS_VOICE;
}
async function voiceTrack(projectId, text, chars){
  const blocks=parseBlocks(text); if(!blocks.length) return null;
  const work=path.join(dirs.tmp, projectId); fs.mkdirSync(work,{recursive:true});
  const parts=[];
  for(let i=0;i<blocks.length;i++){ const p=path.join(work,`voice_${String(i).padStart(3,"0")}.mp3`); await openaiTTS(blocks[i].text, speakerVoice(chars, blocks[i].speaker), p); parts.push(p); }
  const list=path.join(work,"voice_list.txt"); fs.writeFileSync(list, parts.map(quote).join("\n"));
  const out=path.join(work,"voice_full.mp3");
  await run("ffmpeg",["-y","-f","concat","-safe","0","-i",list,"-c","copy",out]);
  return out;
}
async function render(row){
  const config=JSON.parse(row.config), id=row.id, work=path.join(dirs.tmp,id); fs.mkdirSync(work,{recursive:true});
  const clips=config.clips||[]; if(!clips.length) throw new Error("Klip yok.");
  const processed=[];
  for(let i=0;i<clips.length;i++){
    const c=clips[i], src=path.join(dirs.uploads,c.filename), out=path.join(work,`clip_${String(i).padStart(3,"0")}.mp4`);
    const args=["-y"]; const s=Number(c.trimStart||0), e=Number(c.trimEnd||0);
    if(s>0) args.push("-ss", String(s));
    args.push("-i", src);
    if(e>s) args.push("-t", String(e-s));
    args.push("-vf","scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1","-r","30","-c:v","libx264","-preset","veryfast","-crf","20","-an",out);
    await run("ffmpeg", args); processed.push(out);
  }
  const list=path.join(work,"clips.txt"); fs.writeFileSync(list, processed.map(quote).join("\n"));
  const merged=path.join(work,"merged.mp4");
  await run("ffmpeg",["-y","-f","concat","-safe","0","-i",list,"-c","copy",merged]);
  const voice=await voiceTrack(id, config.voiceText||"", config.characters||[]);
  const music=config.music?.filename ? path.join(dirs.uploads, config.music.filename) : null;
  const outName=`${id}.mp4`, outPath=path.join(dirs.renders,outName);
  if(voice && music && fs.existsSync(music)){
    await run("ffmpeg",["-y","-i",merged,"-i",voice,"-stream_loop","-1","-i",music,"-filter_complex",`[1:a]volume=${config.voiceVolume||1}[v];[2:a]volume=${config.musicVolume||0.28}[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[a]`,"-map","0:v","-map","[a]","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
  } else if(voice){
    await run("ffmpeg",["-y","-i",merged,"-i",voice,"-map","0:v","-map","1:a","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
  } else if(music && fs.existsSync(music)){
    await run("ffmpeg",["-y","-i",merged,"-stream_loop","-1","-i",music,"-filter_complex",`[1:a]volume=${config.musicVolume||0.28}[m]`,"-map","0:v","-map","[m]","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
  } else fs.copyFileSync(merged, outPath);
  const output=url(outName,"renders");
  db.prepare("UPDATE projects SET status=?, output_url=?, updated_at=? WHERE id=?").run("done", output, now(), id);
  return output;
}

app.get("/api/settings",(req,res)=>{ const rows=db.prepare("SELECT key,value FROM settings").all(); const obj={}; rows.forEach(r=>obj[r.key]=r.key.includes(".key")&&r.value?"********":r.value); res.json({settings:obj, env:{openai:!!process.env.OPENAI_API_KEY}}); });
app.post("/api/settings",(req,res)=>{ const valid=["api.openai.key","api.elevenlabs.key","api.runway.key","api.syncso.key","api.hedra.key","api.suno.key","api.mubert.key","tts.model","default.ratio","default.transition","default.musicProvider","default.lipSyncProvider","brand.name","language"]; for(const [k,v] of Object.entries(req.body||{})){ if(valid.includes(k) && v!=="********") setSetting(k,v); } res.json({ok:true}); });
app.post("/api/test/openai", async (req,res)=>{ try{ const k=key("openai"); if(!k) return res.status(400).json({ok:false,error:"OpenAI API key yok."}); const r=await fetch("https://api.openai.com/v1/models",{headers:{Authorization:`Bearer ${k}`}}); res.status(r.ok?200:400).json({ok:r.ok,status:r.status,message:r.ok?"OpenAI bağlantısı başarılı.":await r.text()}); }catch(e){res.status(500).json({ok:false,error:e.message});} });
app.post("/api/tts/preview", async (req,res)=>{ try{ const name=`preview-${req.body.voice||DEFAULT_TTS_VOICE}-${Date.now()}.mp3`; const out=path.join(dirs.previews,name); await openaiTTS(req.body.text||"Merhaba. Bu ses önizlemesi AI Video Studio tarafından oluşturuldu.", req.body.voice||DEFAULT_TTS_VOICE, out); res.json({ok:true,url:url(name,"voice-previews")}); }catch(e){res.status(500).json({ok:false,error:e.message});} });
app.get("/api/projects",(req,res)=>res.json({projects:db.prepare("SELECT id,name,status,created_at,updated_at,output_url FROM projects ORDER BY updated_at DESC").all()}));
app.post("/api/projects", upload.any(), (req,res)=>{
  try{
    const id=uuidv4(), created=now(), videos=req.files.filter(f=>f.fieldname==="videos"), music=req.files.find(f=>f.fieldname==="music");
    if(!videos.length) return res.status(400).json({error:"En az 1 video klip yükle."});
    let chars=[]; try{chars=JSON.parse(req.body.charactersJson||"[]")}catch{}
    const custom={}; req.files.forEach(f=>{if(f.fieldname.startsWith("customVoice_")) custom[f.fieldname]=f;});
    chars=chars.map(c=>({...c,customVoiceUrl:custom[c.customVoiceField]?url(custom[c.customVoiceField].filename):"",customVoiceFilename:custom[c.customVoiceField]?.filename||""}));
    const clips=videos.map((f,i)=>({id:uuidv4(),order:i,originalName:f.originalname,filename:f.filename,url:url(f.filename),trimStart:Number(req.body[`trimStart_${i}`]||0),trimEnd:Number(req.body[`trimEnd_${i}`]||0),sceneVoiceText:req.body[`sceneVoice_${i}`]||"",subtitle:req.body[`subtitle_${i}`]||""}));
    const config={clips,characters:chars,voiceText:req.body.voiceText||"",subtitles:req.body.subtitles||"",musicPrompt:req.body.musicPrompt||"",music:music?{filename:music.filename,url:url(music.filename),originalName:music.originalname}:null,ratio:req.body.ratio||"1280:720",transition:req.body.transition||"crossfade",voiceVolume:Number(req.body.voiceVolume||1),musicVolume:Number(req.body.musicVolume||0.28),lipSync:{enabled:req.body.lipSyncEnabled==="true",provider:req.body.lipSyncProvider||"none"}};
    db.prepare("INSERT INTO projects(id,name,status,config,created_at,updated_at) VALUES(?,?,?,?,?,?)").run(id, req.body.projectName||`Proje ${created}`,"uploaded",JSON.stringify(config),created,created);
    req.files.forEach(f=>db.prepare("INSERT INTO assets(id,project_id,type,original_name,filename,url,meta,created_at) VALUES(?,?,?,?,?,?,?,?)").run(uuidv4(),id,f.fieldname,f.originalname,f.filename,url(f.filename),JSON.stringify({mimetype:f.mimetype,size:f.size}),created));
    res.json({ok:true,projectId:id,clipCount:clips.length,characterCount:chars.length});
  }catch(e){res.status(500).json({error:e.message});}
});
app.post("/api/projects/:id/render", async (req,res)=>{ try{ const row=db.prepare("SELECT * FROM projects WHERE id=?").get(req.params.id); if(!row) return res.status(404).json({error:"Proje bulunamadı."}); db.prepare("UPDATE projects SET status=?,updated_at=? WHERE id=?").run("rendering",now(),req.params.id); const outputUrl=await render(row); res.json({ok:true,outputUrl}); }catch(e){ db.prepare("UPDATE projects SET status=?,updated_at=? WHERE id=?").run("error",now(),req.params.id); res.status(500).json({error:e.message}); }});

app.listen(PORT,"0.0.0.0",()=>console.log(`AI Video Studio Pro: http://0.0.0.0:${PORT}`));
