import { qs, showModal, closeModal } from "../core.js";
import { openVoicePicker } from "./voices.js";

export function renderCharacters(state){
  qs("#content").innerHTML=`<div class="card"><div class="cardHeader"><h2>Karakter Merkezi</h2><button class="btn" id="newChar">+ Karakter</button></div><div class="cardBody list" id="charList"></div></div>`;
  qs("#newChar").onclick=()=>openCharacterEditor(state,()=>renderCharacters(state));
  draw(state);
}
function draw(state){const el=qs("#charList"); if(!el)return; el.innerHTML=state.project.characters.map(c=>`<div class="listItem"><b>${c.name}</b><div class="muted">Ses: ${c.voiceName||c.voiceId||"seçilmedi"} · Dil: ${c.language||"TR"}</div></div>`).join("")||'<div class="muted">Karakter yok.</div>'}

export function openCharacterEditor(state,onDone=()=>{}){
  let selectedVoice=null;
  showModal("Karakter Oluştur",`
    <label>Karakter adı</label><input id="charName" placeholder="Dino, Robo, Anlatıcı...">
    <div class="grid2"><div><label>Dil</label><select id="charLang"><option value="tr">Türkçe</option><option value="en">English</option></select></div><div><label>Ton</label><input id="charTone" placeholder="neşeli, sakin, robotik..."></div></div>
    <label>Ses</label><div class="listItem"><span id="selectedVoice">Ses seçilmedi</span><button class="btn secondary" id="pickVoice" style="float:right">Ses Seç</button></div>
    <button class="btn" id="saveChar" style="margin-top:14px">Karakteri Kaydet</button>
  `);
  qs("#pickVoice").onclick=()=>openVoicePicker(state,(v)=>{selectedVoice=v;qs("#selectedVoice").textContent=v.name+" · "+v.provider;});
  qs("#saveChar").onclick=()=>{const name=qs("#charName").value.trim();if(!name)return alert("Karakter adı gir.");state.project.characters.push({id:"char-"+Date.now(),name,language:qs("#charLang").value,tone:qs("#charTone").value,voiceId:selectedVoice?.id||"alloy",voiceName:selectedVoice?.name||"Alloy"});closeModal();onDone();};
}
