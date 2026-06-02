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
const allowed = new Set(["image/jpeg","image/png","image/webp","image/gif","audio/mpeg","audio/wav","audio/mp4","audio/aac","audio/ogg","audio/x-wav"]);
const storage = multer.diskStorage({ destination: (req,file,cb)=>cb(null,uploadDir), filename: (req,file,cb)=>{ const ext=path.extname(file.originalname||"").toLowerCase().replace(/[^a-z0-9.]/g,""); cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext||""}`); }});
const upload = multer({ storage, limits:{ fileSize:250*1024*1024, files:30 }, fileFilter:(req,file,cb)=> allowed.has(file.mimetype) ? cb(null,true) : cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`)) });
app.use(cors());
app.use("/uploads", express.static(uploadDir, { setHeaders: res => res.setHeader("Access-Control-Allow-Origin", "*") }));
app.use(express.static(path.join(__dirname, "public")));
const asBool = v => v === "on" || v === true || v === "true";
const publicUrl = file => file ? `${PUBLIC_BASE_URL}/uploads/${file.filename}` : "";
app.post("/api/create-video", upload.fields([{name:"images",maxCount:20},{name:"music",maxCount:1},{name:"logo",maxCount:1}]), async (req,res)=>{
  try{
    const images = req.files?.images || [];
    const imageUrls = images.map(publicUrl);
    const payload = { ...req.body, imageUrls, imageUrl:imageUrls[0]||"", musicUrl:publicUrl(req.files?.music?.[0]), logoUrl:publicUrl(req.files?.logo?.[0]), autoGenerateScenes:asBool(req.body.autoGenerateScenes), autoGenerateImages:asBool(req.body.autoGenerateImages), autoRender:asBool(req.body.autoRender), loopMode:asBool(req.body.loopMode), youtubeMeta:asBool(req.body.youtubeMeta), safeKidsMode:asBool(req.body.safeKidsMode) };
    if(!imageUrls.length && !payload.autoGenerateImages) return res.status(400).json({error:"Görsel yükle veya Otomatik görsel üret seçeneğini aç."});
    const n8nRes = await fetch(N8N_WEBHOOK_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const text = await n8nRes.text(); let data; try{ data=JSON.parse(text); }catch{ data={raw:text}; }
    res.status(n8nRes.ok?200:502).json({ ok:n8nRes.ok, message:"Panel isteği n8n'e gönderdi.", sentToN8n:N8N_WEBHOOK_URL, uploaded:{imageUrls, musicUrl:payload.musicUrl, logoUrl:payload.logoUrl}, request:{totalMinutes:req.body.totalMinutes, clipSeconds:req.body.clipSeconds, clipCount:req.body.clipCount, autoGenerateScenes:payload.autoGenerateScenes, autoGenerateImages:payload.autoGenerateImages, musicMode:req.body.musicMode}, n8n:data });
  }catch(err){ res.status(500).json({error:err.message}); }
});
app.listen(PORT,"0.0.0.0",()=>{ console.log(`AI Video Panel v2 çalışıyor: http://0.0.0.0:${PORT}`); console.log(`Public base URL: ${PUBLIC_BASE_URL}`); console.log(`n8n webhook: ${N8N_WEBHOOK_URL}`); });
