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

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const app=express();
const PORT=process.env.PORT||8080;

const dirs={
  data:path.join(__dirname,"data"),
  uploads:path.join(__dirname,"uploads"),
  renders:path.join(__dirname,"renders"),
  previews:path.join(__dirname,"voice-previews"),
  tmp:path.join(__dirname,"tmp")
};
Object.values(dirs).forEach(d=>fs.mkdirSync(d,{recursive:true}));

const db=new Database(path.join(dirs.data,"studio.sqlite"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,status TEXT NOT NULL,config TEXT NOT NULL,output_url TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assets(id TEXT PRIMARY KEY,project_id TEXT,type TEXT NOT NULL,filename TEXT NOT NULL,original_name TEXT,url TEXT,created_at TEXT NOT NULL);
`);

const now=()=>new Date().toISOString();
function setting(k,f=""){const r=db.prepare("SELECT value FROM settings WHERE key=?").get(k);return r?r.value:f}
function setSetting(k,v){db.prepare("INSERT INTO settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(k,String(v??""),now())}
function baseUrl(req){return(process.env.PUBLIC_BASE_URL||`${req.protocol}://${req.get("host")}`).replace(/\/$/,"")}
function pub(req,n,f="uploads"){return`${baseUrl(req)}/${f}/${n}`}
function rel(n,f){return`/${f}/${n}`}
function apiKey(name){return name==="openai"?setting("api.openai.key",process.env.OPENAI_API_KEY||""):setting(`api.${name}.key`,"")}
function q(p){return"file '"+p.replace(/'/g,"'\\''")+"'"}
function run(cmd,args){return new Promise((ok,bad)=>{const p=spawn(cmd,args,{stdio:["ignore","pipe","pipe"]});let err="";p.stderr.on("data",d=>err+=d.toString());p.on("close",c=>c===0?ok():bad(new Error(`${cmd} failed (${c})\n${err}`)))})}

app.set("trust proxy",true);
app.use(cors());
app.use(express.json({limit:"50mb"}));
app.use("/uploads",express.static(dirs.uploads,{setHeaders:r=>r.setHeader("Access-Control-Allow-Origin","*")}));
app.use("/renders",express.static(dirs.renders,{setHeaders:r=>r.setHeader("Access-Control-Allow-Origin","*")}));
app.use("/voice-previews",express.static(dirs.previews,{setHeaders:r=>r.setHeader("Access-Control-Allow-Origin","*")}));
app.use(express.static(path.join(__dirname,"public")));

const allowed=new Set(["video/mp4","video/webm","video/quicktime","audio/mpeg","audio/mp3","audio/wav","audio/aac","audio/ogg","audio/x-wav","image/png","image/jpeg","image/webp"]);
const upload=multer({
  storage:multer.diskStorage({
    destination:(req,file,cb)=>cb(null,dirs.uploads),
    filename:(req,file,cb)=>{const ext=path.extname(file.originalname||"").toLowerCase().replace(/[^a-z0-9.]/g,"");cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${ext||""}`)}
  }),
  limits:{fileSize:2*1024*1024*1024,files:120},
  fileFilter:(req,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(new Error("Desteklenmeyen dosya türü: "+file.mimetype))
});

async function openaiTts(text,voice,out){
  const key=apiKey("openai");
  if(!key)throw new Error("OpenAI API key eksik. API ayarlarından gir veya hazır MP3 kullan.");
  const r=await fetch("https://api.openai.com/v1/audio/speech",{
    method:"POST",
    headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
    body:JSON.stringify({model:setting("tts.model",process.env.OPENAI_TTS_MODEL||"gpt-4o-mini-tts"),voice:voice||"alloy",input:text,format:"mp3"})
  });
  if(!r.ok)throw new Error(`OpenAI TTS hata: ${r.status} ${await r.text()}`);
  fs.writeFileSync(out,Buffer.from(await r.arrayBuffer()));
}

function parseBlocks(t){
  const lines=(t||"").split(/\r?\n/), blocks=[]; let cur={speaker:"Narrator",text:[]};
  for(const raw of lines){
    const m=raw.trim().match(/^\[(.+?)\]\s*$/);
    if(m){if(cur.text.join("\n").trim())blocks.push({speaker:cur.speaker,text:cur.text.join("\n").trim()});cur={speaker:m[1].trim(),text:[]};}
    else cur.text.push(raw);
  }
  if(cur.text.join("\n").trim())blocks.push({speaker:cur.speaker,text:cur.text.join("\n").trim()});
  return blocks;
}
function voiceFor(chars,s){const f=(chars||[]).find(c=>(c.name||"").toLowerCase()===(s||"").toLowerCase());return f?.voiceId||f?.openaiVoice||"alloy"}

async function makeVoiceTrack(id,text,chars){
  const b=parseBlocks(text); if(!b.length)return null;
  const work=path.join(dirs.tmp,id); fs.mkdirSync(work,{recursive:true});
  const parts=[];
  for(let i=0;i<b.length;i++){
    const p=path.join(work,`voice_${String(i).padStart(3,"0")}.mp3`);
    await openaiTts(b[i].text,voiceFor(chars,b[i].speaker),p);
    parts.push(p);
  }
  const list=path.join(work,"voices.txt"); fs.writeFileSync(list,parts.map(q).join("\n"));
  const out=path.join(work,"voice_full.mp3");
  await run("ffmpeg",["-y","-f","concat","-safe","0","-i",list,"-c","copy",out]);
  return out;
}

async function renderProject(req,row){
  const cfg=JSON.parse(row.config), id=row.id, work=path.join(dirs.tmp,id); fs.mkdirSync(work,{recursive:true});
  if(!cfg.timeline?.clips?.length)throw new Error("Timeline'da video klip yok.");
  const processed=[];
  for(let i=0;i<cfg.timeline.clips.length;i++){
    const c=cfg.timeline.clips[i], src=path.join(dirs.uploads,c.filename), out=path.join(work,`clip_${String(i).padStart(3,"0")}.mp4`);
    const speed=Math.max(.25,Math.min(4,Number(c.speed||1)));
    const s=Math.max(0,Number(c.trimStart||0)), e=Math.max(0,Number(c.trimEnd||0));
    const args=["-y"]; if(s>0)args.push("-ss",String(s)); args.push("-i",src); if(e>s)args.push("-t",String(e-s));
    args.push("-filter_complex",`[0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,setpts=${(1/speed).toFixed(6)}*PTS[v]`,"-map","[v]","-r","30","-c:v","libx264","-preset","veryfast","-crf","20","-an",out);
    await run("ffmpeg",args); processed.push(out);
  }
  const list=path.join(work,"clips.txt"), merged=path.join(work,"merged.mp4");
  fs.writeFileSync(list,processed.map(q).join("\n"));
  await run("ffmpeg",["-y","-f","concat","-safe","0","-i",list,"-c","copy",merged]);

  const voice=cfg.script?.text?await makeVoiceTrack(id,cfg.script.text,cfg.characters||[]):null;
  const music=cfg.music?.filename?path.join(dirs.uploads,cfg.music.filename):null;
  const outName=`${id}.mp4`, outPath=path.join(dirs.renders,outName);

  if(voice&&music&&fs.existsSync(music)){
    await run("ffmpeg",["-y","-i",merged,"-i",voice,"-stream_loop","-1","-i",music,"-filter_complex",`[1:a]volume=${cfg.audio?.voiceVolume||1}[v];[2:a]volume=${cfg.audio?.musicVolume||.28}[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[a]`,"-map","0:v","-map","[a]","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
  }else if(voice){
    await run("ffmpeg",["-y","-i",merged,"-i",voice,"-map","0:v","-map","1:a","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
  }else if(music&&fs.existsSync(music)){
    await run("ffmpeg",["-y","-i",merged,"-stream_loop","-1","-i",music,"-filter_complex",`[1:a]volume=${cfg.audio?.musicVolume||.28}[m]`,"-map","0:v","-map","[m]","-shortest","-c:v","copy","-c:a","aac","-b:a","192k",outPath]);
  }else fs.copyFileSync(merged,outPath);

  const output=pub(req,outName,"renders");
  db.prepare("UPDATE projects SET status=?,output_url=?,updated_at=? WHERE id=?").run("done",output,now(),id);
  return output;
}

app.get("/api/settings",(req,res)=>{const rows=db.prepare("SELECT key,value FROM settings").all();const o={};rows.forEach(r=>o[r.key]=r.key.includes(".key")&&r.value?"********":r.value);res.json({settings:o})});
app.post("/api/settings",(req,res)=>{for(const[k,v]of Object.entries(req.body||{}))if(v!=="********")setSetting(k,v);res.json({ok:true})});
app.post("/api/providers/test/openai",async(req,res)=>{try{if(!apiKey("openai"))return res.status(400).json({ok:false,error:"OpenAI API key yok."});const r=await fetch("https://api.openai.com/v1/models",{headers:{Authorization:`Bearer ${apiKey("openai")}`}});res.status(r.ok?200:400).json({ok:r.ok,status:r.status,message:r.ok?"OpenAI bağlı.":await r.text()})}catch(e){res.status(500).json({ok:false,error:e.message})}});
app.post("/api/tts/preview",async(req,res)=>{try{const name=`preview-${req.body.voice||"alloy"}-${Date.now()}.mp3`;await openaiTts(req.body.text||"Merhaba. Bu ses önizlemesidir.",req.body.voice||"alloy",path.join(dirs.previews,name));res.json({ok:true,url:rel(name,"voice-previews")})}catch(e){res.status(500).json({ok:false,error:e.message})}});
app.get("/api/projects",(req,res)=>res.json({projects:db.prepare("SELECT id,name,status,created_at,updated_at,output_url FROM projects ORDER BY updated_at DESC").all()}));
app.post("/api/projects",upload.any(),(req,res)=>{
  try{
    const id=uuidv4(),created=now(),videos=req.files.filter(f=>f.fieldname==="videos"),music=req.files.find(f=>f.fieldname==="music");
    let cfg=JSON.parse(req.body.projectJson||"{}");
    if(!videos.length)throw new Error("En az 1 video yükle.");
    const clips=(cfg.timeline?.clips||[]).map((c,i)=>{const f=videos.find(v=>v.originalname===c.originalName)||videos[i];if(!f)throw new Error("Video eşleşmedi.");return{...c,filename:f.filename,url:pub(req,f.filename),originalName:f.originalname}});
    cfg.timeline={...(cfg.timeline||{}),clips};
    if(music)cfg.music={...(cfg.music||{}),filename:music.filename,url:pub(req,music.filename),originalName:music.originalname};
    db.prepare("INSERT INTO projects(id,name,status,config,created_at,updated_at) VALUES(?,?,?,?,?,?)").run(id,cfg.name||`Proje ${created}`,"uploaded",JSON.stringify(cfg),created,created);
    res.json({ok:true,projectId:id,clipCount:clips.length});
  }catch(e){res.status(500).json({error:e.message})}
});
app.post("/api/projects/:id/render",async(req,res)=>{try{const row=db.prepare("SELECT * FROM projects WHERE id=?").get(req.params.id);if(!row)return res.status(404).json({error:"Proje bulunamadı."});db.prepare("UPDATE projects SET status=?,updated_at=? WHERE id=?").run("rendering",now(),req.params.id);res.json({ok:true,outputUrl:await renderProject(req,row)})}catch(e){db.prepare("UPDATE projects SET status=?,updated_at=? WHERE id=?").run("error",now(),req.params.id);res.status(500).json({error:e.message})}});
app.listen(PORT,"0.0.0.0",()=>console.log(`AI Content Studio running on ${PORT}`));
