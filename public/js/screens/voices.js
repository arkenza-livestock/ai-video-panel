import { qs, showModal, closeModal } from "../core.js";

let currentAudio=null;

export function renderVoices(state){
  qs("#content").innerHTML=`<div class="card"><div class="cardHeader"><h2>Ses Merkezi</h2><button class="btn" id="openVoicePicker">Ses Seç</button></div><div class="cardBody"><p class="muted">Ana ekranda tüm sesler görünmez. Ses seçici tıklanınca açılır.</p></div></div>`;
  qs("#openVoicePicker").onclick=()=>openVoicePicker(state);
}

export function openVoicePicker(state,onSelect=()=>{}){
  showModal("Ses Seç",`
    <div class="grid2"><input id="voiceSearch" placeholder="Ses ara..."><select id="voiceProvider"><option value="">Tüm sağlayıcılar</option><option value="openai">OpenAI</option><option value="elevenlabs">ElevenLabs</option></select></div>
    <div class="modalGrid" id="voiceGrid" style="margin-top:12px"></div>
  `);
  const draw=()=>{
    const q=(qs("#voiceSearch").value||"").toLowerCase(), p=qs("#voiceProvider").value;
    const items=state.voiceLibrary.filter(v=>(!p||v.provider===p)&&(!q||v.name.toLowerCase().includes(q)||v.tags.join(" ").toLowerCase().includes(q)));
    qs("#voiceGrid").innerHTML=items.map(v=>`<div class="voiceCard"><button class="playBtn" data-play="${v.id}">▶</button><div><b>${v.name}</b><div class="muted">${v.provider} · ${v.tags.join(", ")}</div><div class="wave"></div></div><button class="btn secondary" data-select="${v.id}">Seç</button></div>`).join("");
    qs("#voiceGrid").querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>previewVoice(b.dataset.play));
    qs("#voiceGrid").querySelectorAll("[data-select]").forEach(b=>{b.onclick=()=>{const voice=state.voiceLibrary.find(v=>v.id===b.dataset.select);onSelect(voice);closeModal();}});
  };
  qs("#voiceSearch").oninput=draw; qs("#voiceProvider").onchange=draw; draw();
}

async function previewVoice(voice){
  try{
    const r=await fetch("/api/tts/preview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({voice,text:"Merhaba. Bu sesi AI Content Studio için önizliyorsunuz."})});
    const d=await r.json(); if(!r.ok)throw new Error(d.error);
    if(currentAudio){currentAudio.pause();currentAudio.currentTime=0}
    currentAudio=new Audio(d.url+"?t="+Date.now()); await currentAudio.play();
  }catch(e){alert("Ses önizleme hatası: "+e.message)}
}
