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
const __filename=fileURLToPath(import.meta.url), __dirname=path.dirname(__filename);
const app=express(), PORT=process.env.PORT||8080;
const PUBLIC_BASE_URL=(process.env.PUBLIC_BASE_URL||`http://localhost:${PORT}`).replace(/\/$/,"");
const OPENAI_TTS_MODEL=process.env.OPENAI_TTS_MODEL||"gpt-4o-mini-tts";
const DEFAULT_TTS_VOICE=process.env.DEFAULT_TTS_VOICE||"alloy";
const dirs={data:path.join(__dirname,"data"),uploads:path.join(__dirname,"uploads"),renders:path.join(__dirname,"renders"),previews:path.join(__dirname,"voice-previews"),tmp:path.join(__dirname,"tmp")};
Object.values(dirs).forEach(d=>fs.mkdirSync(d,{recursive:true}));

const db=new Database(path.join(dirs.data,"studio.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,status TEXT NOT NULL,config TEXT NOT NULL,output_url TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,project_id TEXT,type TEXT NOT NULL,original_name TEXT,filename TEXT NOT NULL,url TEXT NOT NULL,meta TEXT,created_at TEXT NOT NULL);`);

const now=()=>new Date().toISOString();
function setting(k,f=""){const r=db.prepare("SELECT value FROM settings WHERE key=?").get(k);return r?r.value:f}
function setSetting(k,v){db.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(k,String(v??""),now())}
function apiKey(n){return n==="openai"?setting("api.openai.key",process.env.OPENAI_API_KEY||""):setting("api."+n+".key","")}
function pub(name,folder="uploads"){return `${PUBLIC_BASE_URL}/${folder}/${name}`}
function q(p){return "file '"+p.replace(/'/g,"'\\''")+"'"}
function run(cmd,args){return new Promise((ok,bad)=>{const p=spawn(cmd,args,{stdio:["ignore","pipe","pipe"]});let err="";p.stderr.on("data",d=>err+=d.toString());p.on("close",c=>c===0?ok():bad(new Error(`${cmd} failed (${c})\n${err}`)))})}

app.use(cors());
app.use(express.json({limit:"50mb"}));
app.use("/uploads",express.static(dirs.uploads,{setHeaders:r=>r.setHeader("Access-Control-Allow-Origin","*")}));
app.use("/renders",express.static(dirs.renders,{setHeaders:r=>r.setHeader("Access-Control-Allow-Origin","*")}));
app.use("/voice-previews",express.static(dirs.previews,{setHeaders:r=>r.setHeader("Access-Control-Allow-Origin","*")}));
app.use(express.static(path.join(__dirname,"public")));

const allowed=new Set(["video/mp4","video/webm","video/quicktime","audio/mpeg","audio/mp3","audio/wav","audio/aac","audio/ogg","audio/x-wav","image/png","image/jpeg","image/webp"]);
const upload=multer({storage:multer.diskStorage({destination:(req,file,cb)=>cb(null,dirs.uploads),filename:(req,file,cb)=>{const ext=path.extname(file.originalname||"").toLowerCase().replace(/[^a-z0-9.]/g,"");cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${ext||""}`)}}),limits:{fileSize:2*1024*1024*1024,files:120},fileFilter:(req,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`))});

async function openaiTTS(text,voice,out){
 const key=apiKey("openai");
 if(!key)throw new Error("OpenAI API key eksik. API Ayarları bölümünden ekle.");
 const res=await fetch("https://api.openai.com/v1/audio/speech",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:setting("tts.model",OPENAI_TTS_MODEL),voice:voice||DEFAULT_TTS_VOICE,input:text,format:"mp3"})});
 if(!res.ok)throw new Error(`OpenAI TTS hata: ${res.status} ${await res.text()}`);
 fs.writeFileSync(out,Buffer.from(await res.arrayBuffer()));
}
function parseBlocks(t){
 const lines=(t||"").split(/\r?\n/), blocks=[]; let cur={speaker:"Anlatıcı",text:[]};
 for(const raw of lines){const m=raw.trim().match(/^\[(.+?)\]\s*$/); if(m){if(cur.text.join("\n").trim())blocks.push({speaker:cur.speaker,text:cur.text.join("\n").trim()}); cur={speaker:m[1].trim(),text:[]};}else cur.text.push(raw)}
 if(cur.text.join("\n").trim())blocks.push({speaker:cur.speaker,text:cur.text.join("\n").trim()});
 return blocks;
}
function voiceFor(chars,speaker){const f=(chars||[]).find(c=>(c.name||"").toLowerCase()===(speaker||"").toLowerCase());return f?.openaiVoice||DEFAULT_TTS_VOICE}
async function voiceTrack(id,text,chars){
 const b=parseBlocks(text); if(!b.length)return null;
 const w=path.join(dirs.tmp,id); fs.mkdirSync(w,{recursive:true});
 const parts=[];
 for(let i=0;i<b.length;i++){const p=path.join(w,`voice_${String(i).padStart(3,"0")}.mp3`);await openaiTTS(b[i].text,voiceFor(chars,b[i].speaker),p);parts.push(p)}
 const list=path.join(w,"voice_list.txt"); fs.writeFileSync(list,parts.map(q).join("\n"));
 const out=path.join(w,"voice_full.mp3"); await run("ffmpeg",["-y","-f","concat","-safe","0","-i",list,"-c","copy",out]); return out;
}
async function renderProject(row){
 const cfg=JSON.parse(row.config), id=row.id, w=path.join(dirs.tmp,id); fs.mkdirSync(w,{recursive:true});
 if(!cfg.clips?.length)throw new Error("Render için klip yok.");
 const processed=[];
 for(let i=0;i<cfg.clips.length;i++){
  const c=cfg.clips[i], src=path.join(dirs.uploads,c.filename), out=path.join(w,`clip_${String(i).padStart(3,"0")}.mp4`);
  const args=["-y"]; const s=+c.trimStart||0, e=+c.trimEnd||0;
  if(s>0)args.push("-ss",String(s)); args.push("-i",src); if(e>s)args.push("-t",String(e-s));
  args.push("-vf","scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1","-r","30","-c:v","libx264","-preset","veryfast","-crf","20","-an",out);
  await run("ffmpeg",args); processed.push(out);
 }
 const list=path.join(w,"clips.txt"); fs.writeFileSync(list,processed.map(q).join("\n"));
 const merged=path.join(w,"merged.mp4"); await run("ffmpeg",["-y","-f","concat","-safe","0","-i",list,"-c","copy",merged]);
 const voice=await voiceTrack(id,cfg.voiceText||"",cfg.characters||[]);
 const music=cfg.music?.filename?path.join(dirs.uploads,cfg.music.filename):null;
 const outName=`${id}.mp4`, outPath=path.join(dirs.renders,outName);
 if(voice&&music&&fs.existsSync(music))await run("ffmpeg",["-y","-i",merged,"-i",voice,"-stream_loop","-1","-i",music,"-filter_complex",`[1:a]volume=${cfg.voiceVolume||1}[v];[2:a]volume=${cfg.musicVolume||0.28}[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[a]`,"-map","0:v","-map","[a]","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
 else if(voice)await run("ffmpeg",["-y","-i",merged,"-i",voice,"-map","0:v","-map","1:a","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
 else if(music&&fs.existsSync(music))await run("ffmpeg",["-y","-i",merged,"-stream_loop","-1","-i",music,"-filter_complex",`[1:a]volume=${cfg.musicVolume||0.28}[m]`,"-map","0:v","-map","[m]","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
 else fs.copyFileSync(merged,outPath);
 const output=pub(outName,"renders"); db.prepare("UPDATE projects SET status=?,output_url=?,updated_at=? WHERE id=?").run("done",output,now(),id); return output;
}

app.post("/api/settings",(req,res)=>{const valid=["api.openai.key","api.elevenlabs.key","api.runway.key","api.syncso.key","api.hedra.key","api.suno.key","api.mubert.key","tts.model","default.ratio","default.transition","default.musicProvider","default.lipSyncProvider","brand.name","language"];for(const [k,v]of Object.entries(req.body||{}))if(valid.includes(k)&&v!=="********")setSetting(k,v);res.json({ok:true})});
app.get("/api/settings",(req,res)=>{const rows=db.prepare("SELECT key,value FROM settings").all();const o={};rows.forEach(r=>o[r.key]=r.key.includes(".key")&&r.value?"********":r.value);res.json({settings:o,env:{openai:!!process.env.OPENAI_API_KEY}})});
app.post("/api/test/openai",async(req,res)=>{try{const k=apiKey("openai");if(!k)return res.status(400).json({ok:false,error:"OpenAI API key yok."});const r=await fetch("https://api.openai.com/v1/models",{headers:{Authorization:`Bearer ${k}`}});res.status(r.ok?200:400).json({ok:r.ok,status:r.status,message:r.ok?"OpenAI bağlantısı başarılı.":await r.text()})}catch(e){res.status(500).json({ok:false,error:e.message})}});
app.post("/api/tts/preview",async(req,res)=>{try{const name=`preview-${req.body.voice||DEFAULT_TTS_VOICE}-${Date.now()}.mp3`;await openaiTTS(req.body.text||"Merhaba. Bu ses önizlemesidir.",req.body.voice||DEFAULT_TTS_VOICE,path.join(dirs.previews,name));res.json({ok:true,url:pub(name,"voice-previews")})}catch(e){res.status(500).json({ok:false,error:e.message})}});
app.get("/api/projects",(req,res)=>res.json({projects:db.prepare("SELECT id,name,status,created_at,updated_at,output_url FROM projects ORDER BY updated_at DESC").all()}));
app.post("/api/projects",upload.any(),(req,res)=>{try{const id=uuidv4(),created=now(),videos=req.files.filter(f=>f.fieldname==="videos"),music=req.files.find(f=>f.fieldname==="music");if(!videos.length)return res.status(400).json({error:"En az 1 video klip yükle."});let chars=[];try{chars=JSON.parse(req.body.charactersJson||"[]")}catch{};const clips=videos.map((f,i)=>({id:uuidv4(),order:i,originalName:f.originalname,filename:f.filename,url:pub(f.filename),trimStart:+req.body[`trimStart_${i}`]||0,trimEnd:+req.body[`trimEnd_${i}`]||0,sceneVoiceText:req.body[`sceneVoice_${i}`]||"",subtitle:req.body[`subtitle_${i}`]||""}));const cfg={clips,characters:chars,voiceText:req.body.voiceText||"",subtitles:req.body.subtitles||"",musicPrompt:req.body.musicPrompt||"",music:music?{filename:music.filename,url:pub(music.filename),originalName:music.originalname}:null,ratio:req.body.ratio||"1280:720",transition:req.body.transition||"crossfade",voiceVolume:+req.body.voiceVolume||1,musicVolume:+req.body.musicVolume||0.28,lipSync:{enabled:req.body.lipSyncEnabled==="true",provider:req.body.lipSyncProvider||"none"}};db.prepare("INSERT INTO projects(id,name,status,config,created_at,updated_at) VALUES(?,?,?,?,?,?)").run(id,req.body.projectName||`Proje ${created}`,"uploaded",JSON.stringify(cfg),created,created);res.json({ok:true,projectId:id,clipCount:clips.length,characterCount:chars.length})}catch(e){res.status(500).json({error:e.message})}});
app.post("/api/projects/:id/render",async(req,res)=>{try{const row=db.prepare("SELECT * FROM projects WHERE id=?").get(req.params.id);if(!row)return res.status(404).json({error:"Proje bulunamadı."});db.prepare("UPDATE projects SET status=?,updated_at=? WHERE id=?").run("rendering",now(),req.params.id);res.json({ok:true,outputUrl:await renderProject(row)})}catch(e){db.prepare("UPDATE projects SET status=?,updated_at=? WHERE id=?").run("error",now(),req.params.id);res.status(500).json({error:e.message})}});
app.listen(PORT,"0.0.0.0",()=>console.log(`AI Video Studio Editor UI v2: http://0.0.0.0:${PORT}`));
