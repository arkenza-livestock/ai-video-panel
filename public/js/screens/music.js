import { qs, showModal, closeModal } from "../core.js";
let currentMusic=null;

export function renderMusic(state){
  qs("#content").innerHTML=`<div class="card"><div class="cardHeader"><h2>Müzik Merkezi</h2><button class="btn" id="openMusic">Müzik Ekle</button></div><div class="cardBody"><p class="muted">Hazır MP3 ile sistem API olmadan çalışır. Suno/Mubert API varsa üretim açılır.</p></div></div>`;
  qs("#openMusic").onclick=()=>openMusicPicker(state);
}

export function openMusicPicker(state,onDone=()=>{}){
  showModal("Müzik Ekle",`
    <div class="grid2">
      <div class="featureCard"><h3>Hazır MP3</h3><label>Dosya</label><input id="musicFile" type="file" accept="audio/*"><button class="btn secondary" id="previewMusic" style="margin-top:10px">▶ Dinle</button><button class="btn" id="selectMusic" style="margin-top:10px">Seç</button></div>
      <div class="featureCard"><h3>Prompt ile Üret</h3><label>Prompt</label><textarea id="musicPrompt" placeholder="Magical children's adventure soundtrack..."></textarea><button class="btn secondary" disabled style="margin-top:10px">Suno API bağlanınca aktif</button></div>
    </div>
  `);
  qs("#previewMusic").onclick=()=>{const f=qs("#musicFile").files[0];if(!f)return alert("MP3 seç.");if(currentMusic){currentMusic.pause();currentMusic.currentTime=0}currentMusic=new Audio(URL.createObjectURL(f));currentMusic.play();};
  qs("#selectMusic").onclick=()=>{const f=qs("#musicFile").files[0];if(!f)return alert("MP3 seç.");state.project.music={file:f,name:f.name,source:"upload"};closeModal();onDone();};
}
