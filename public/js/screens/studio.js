import { qs, safeId, showModal, closeModal } from "../core.js";
import { openVoicePicker } from "./voices.js";
import { openMusicPicker } from "./music.js";
import { openCharacterEditor } from "./characters.js";

let previewAudio=null, previewMusic=null;
let sequencePlaying=false;

export function renderStudio(state,navigate){
  qs("#topActions").innerHTML=`
    <button class="btn secondary" id="addVideo">+ Video</button>
    <button class="btn secondary" id="addCharacter">+ Karakter</button>
    <button class="btn secondary" id="addMusic">+ Müzik</button>
    <button class="btn secondary" id="chooseVoice">Ses Seç</button>
    <button class="btn" id="saveProject">Kaydet</button>
    <button class="btn" id="renderProject" disabled>Render</button>
  `;
  qs("#content").innerHTML=`
    <div class="studioLayout">
      <section>
        <div class="card previewCard">
          <div class="previewArea" id="previewArea"><div class="previewHint">Video seçilmedi</div></div>
          <div class="controlBar"><button class="btn secondary" id="playPreview">▶</button><button class="btn secondary" id="stopPreview">■</button><div class="timebar"></div></div>
          <div class="toolRow" id="toolRow"></div>
        </div>
        <div class="timeline" id="timeline"></div>
      </section>
      <aside class="card inspector">
        <div class="cardHeader"><h2>Seçili Öğe</h2></div>
        <div class="cardBody" id="inspector"></div>
      </aside>
    </div>
  `;
  bindTop(state,navigate);
  renderTools(state);
  renderTimeline(state);
  renderInspector(state);
}

function bindTop(state,navigate){
  qs("#addVideo").onclick=()=>openVideoModal(state);
  qs("#addCharacter").onclick=()=>openCharacterEditor(state,()=>renderStudio(state,navigate));
  qs("#addMusic").onclick=()=>openMusicPicker(state,()=>renderStudio(state,navigate));
  qs("#chooseVoice").onclick=()=>openVoicePicker(state,(voice)=>{alert("Seçilen ses: "+voice.name+" — Karakter ekranından karaktere bağlayabilirsin.");});
  qs("#saveProject").onclick=()=>saveProject(state);
  qs("#renderProject").onclick=()=>renderProject(state);
  qs("#playPreview").onclick=()=>togglePreview(state);
  qs("#stopPreview").onclick=()=>{
    sequencePlaying=false;
    const v=qs("#mainPreview");
    if(v){v.pause();v.currentTime=0;}
  };
}

function openVideoModal(state){
  showModal("Video Ekle",`
    <label>MP4 / WEBM / MOV seç</label>
    <input id="videoPicker" type="file" accept="video/mp4,video/webm,video/quicktime" multiple>
    <div class="muted" style="margin-top:10px">API yoksa sistem bu dosyalarla çalışır. API varsa ileride Runway/Kling ile üretim eklenir.</div>
    <button class="btn" id="addSelectedVideos" style="margin-top:12px">Timeline'a Ekle</button>
  `);
  qs("#addSelectedVideos").onclick=()=>{
    const files=[...qs("#videoPicker").files];
    if(!files.length)return alert("Video seç.");
    files.forEach(file=>state.project.timeline.clips.push({id:safeId(),file,originalName:file.name,trimStart:0,trimEnd:0,speed:1,volume:1,subtitle:"",sceneVoiceText:""}));
    state.selectedClipIndex=state.project.timeline.clips.length-1;
    closeModal();
    renderStudio(state,()=>{});
  };
}

function renderTools(state){
  const actions=state.studioSchema.clipActions;
  qs("#toolRow").innerHTML=actions.map(a=>`<button data-action="${a.id}">${a.icon} ${a.label}</button>`).join("");
  qs("#toolRow").querySelectorAll("button").forEach(btn=>btn.onclick=()=>runAction(state,btn.dataset.action));
}

function runAction(state,action){
  const i=state.selectedClipIndex, clips=state.project.timeline.clips;
  if(i<0||!clips[i])return alert("Önce timeline'dan klip seç.");
  const c=clips[i];
  if(action==="delete"){clips.splice(i,1);state.selectedClipIndex=Math.min(i,clips.length-1);}
  if(action==="moveLeft"&&i>0){[clips[i-1],clips[i]]=[clips[i],clips[i-1]];state.selectedClipIndex=i-1;}
  if(action==="moveRight"&&i<clips.length-1){[clips[i+1],clips[i]]=[clips[i],clips[i+1]];state.selectedClipIndex=i+1;}
  if(action==="slow"){
    const v=prompt("Yavaşlatma değeri gir. Örn: 0.25, 0.5, 0.75", c.speed && c.speed < 1 ? c.speed : 0.5);
    if(v===null)return;
    const speed=Number(v);
    if(!isFinite(speed)||speed<0.25||speed>4)return alert("Hız 0.25x ile 4x arasında olmalı.");
    c.speed=speed;
  }
  if(action==="fast"){
    const v=prompt("Hızlandırma değeri gir. Örn: 1.25, 1.5, 2, 4", c.speed && c.speed > 1 ? c.speed : 1.5);
    if(v===null)return;
    const speed=Number(v);
    if(!isFinite(speed)||speed<0.25||speed>4)return alert("Hız 0.25x ile 4x arasında olmalı.");
    c.speed=speed;
  }
  if(action==="trim"){const s=prompt("Başlangıç saniyesi:",c.trimStart||0);if(s===null)return;const e=prompt("Bitiş saniyesi:",c.trimEnd||0);if(e===null)return;c.trimStart=Number(s||0);c.trimEnd=Number(e||0);}
  if(action==="split"){let p=Number(prompt("Kaçıncı saniyeden bölünsün?","5"));if(!isFinite(p)||p<=0)return alert("Geçerli saniye gir.");clips.splice(i,1,{...c,id:safeId(),trimEnd:p},{...c,id:safeId(),trimStart:p});}
  renderTimeline(state);renderInspector(state);renderPreview(state);
}

function renderTimeline(state){
  const schema=state.studioSchema.tracks;
  const clips=state.project.timeline.clips;

  qs("#timeline").innerHTML=schema.map(t=>`
    <div class="track">
      <div class="trackLabel">${t.label}</div>
      <div class="trackLane" id="track-${t.id}"></div>
    </div>
  `).join("");

  const videoLane=qs("#track-video");

  videoLane.innerHTML=clips.map((c,i)=>`
    <div class="clip ${i===state.selectedClipIndex?'selected':''}" data-idx="${i}" draggable="true">
      <video src="${URL.createObjectURL(c.file)}" muted playsinline></video>
      <small>${i+1}. ${c.originalName} · ${c.speed||1}x</small>
    </div>
  `).join("")||'<div class="muted">+ Video ile klip ekle</div>';

  videoLane.querySelectorAll(".clip").forEach(el=>{
    el.onclick=()=>{
      sequencePlaying=false;
      state.selectedClipIndex=Number(el.dataset.idx);
      renderTimeline(state);
      renderInspector(state);
      renderPreview(state,false);
    };

    el.ondragstart=(ev)=>{
      ev.dataTransfer.setData("text/plain", el.dataset.idx);
      ev.dataTransfer.effectAllowed="move";
    };

    el.ondragover=(ev)=>{
      ev.preventDefault();
      ev.dataTransfer.dropEffect="move";
    };

    el.ondrop=(ev)=>{
      ev.preventDefault();
      const from=Number(ev.dataTransfer.getData("text/plain"));
      const to=Number(el.dataset.idx);
      if(!Number.isInteger(from)||!Number.isInteger(to)||from===to)return;

      const moved=clips.splice(from,1)[0];
      clips.splice(to,0,moved);
      state.selectedClipIndex=to;

      sequencePlaying=false;
      renderTimeline(state);
      renderInspector(state);
      renderPreview(state,false);
    };
  });

  qs("#track-voice").innerHTML=state.project.script.text?`<div class="clip audioClip"><small>Genel TTS Script</small></div>`:'';
  qs("#track-music").innerHTML=state.project.music?`<div class="clip musicClip"><small>${state.project.music.name||"Müzik"}</small></div>`:'';
  qs("#track-subtitles").innerHTML=clips.map((c,i)=>c.subtitle?`<div class="clip subClip"><small>${c.subtitle}</small></div>`:"").join("");

  renderPreview(state,false);
}

function renderPreview(state, autoplay=false){
  const c=state.project.timeline.clips[state.selectedClipIndex];
  if(!c){
    qs("#previewArea").innerHTML='<div class="previewHint">Video seçilmedi</div>';
    return;
  }

  qs("#previewArea").innerHTML=`
    <video id="mainPreview" src="${URL.createObjectURL(c.file)}" muted playsinline webkit-playsinline preload="metadata"></video>
    <div class="previewHint">${state.selectedClipIndex+1}. klip · ${c.speed||1}x</div>
  `;

  const v=qs("#mainPreview");
  v.playbackRate=Number(c.speed||1);
  v.playsInline=true;
  v.muted=true;

  v.onended=()=>{
    if(!sequencePlaying)return;

    const next=state.selectedClipIndex+1;
    if(next<state.project.timeline.clips.length){
      state.selectedClipIndex=next;
      renderTimeline(state);
      renderInspector(state);
      renderPreview(state,true);
    }else{
      sequencePlaying=false;
      state.selectedClipIndex=0;
      renderTimeline(state);
      renderInspector(state);
      renderPreview(state,false);
    }
  };

  if(autoplay){
    v.play().catch(e=>{
      sequencePlaying=false;
      alert("Önizleme oynatılamadı: "+e.message);
    });
  }
}

function togglePreview(state){
  if(!state.project.timeline.clips.length)return;

  const v=qs("#mainPreview");
  if(!v){
    renderPreview(state,true);
    sequencePlaying=true;
    return;
  }

  v.playsInline=true;
  v.muted=true;
  v.playbackRate=Number(state.project.timeline.clips[state.selectedClipIndex]?.speed||1);

  if(v.paused){
    sequencePlaying=true;
    v.play().catch(e=>{
      sequencePlaying=false;
      alert(e.message);
    });
  }else{
    sequencePlaying=false;
    v.pause();
  }
}

function renderInspector(state){
  const c=state.project.timeline.clips[state.selectedClipIndex];
  if(!c){qs("#inspector").innerHTML='<div class="emptyState">Timeline’dan klip seç</div>';return;}
  qs("#inspector").innerHTML=`
    <label>Klip adı</label><input id="clipName" value="${c.originalName}">
    <div class="grid2"><div><label>Başlangıç</label><input id="trimStart" type="number" step="0.1" value="${c.trimStart||0}"></div><div><label>Bitiş</label><input id="trimEnd" type="number" step="0.1" value="${c.trimEnd||0}"></div></div>
    <label>Hız</label>
    <div class="grid2">
      <select id="clipSpeedPreset">
        <option value="0.25">0.25x Çok yavaş</option>
        <option value="0.5">0.5x Yavaş</option>
        <option value="0.75">0.75x Hafif yavaş</option>
        <option value="1">1x Normal</option>
        <option value="1.25">1.25x Hafif hızlı</option>
        <option value="1.5">1.5x Hızlı</option>
        <option value="2">2x Çok hızlı</option>
        <option value="3">3x</option>
        <option value="4">4x Maksimum</option>
        <option value="custom">Manuel</option>
      </select>
      <input id="clipSpeedManual" type="number" min="0.25" max="4" step="0.05" value="${c.speed||1}" placeholder="Manuel hız">
    </div>
    <div class="muted">Render’da aynı hız değeri FFmpeg ile uygulanır. Aralık: 0.25x - 4x.</div>
    <label>Sahne Konuşması</label><textarea id="sceneVoice">${c.sceneVoiceText||""}</textarea>
    <label>Altyazı</label><input id="subtitle" value="${c.subtitle||""}">
    <label>Genel Script</label><textarea id="scriptText">${state.project.script.text||""}</textarea>
  `;
  const presets=["0.25","0.5","0.75","1","1.25","1.5","2","3","4"];
  const currentSpeed=String(c.speed||1);
  qs("#clipSpeedPreset").value=presets.includes(currentSpeed)?currentSpeed:"custom";
  qs("#clipSpeedManual").value=Number(c.speed||1);

  function applyInspectorChanges(){
    c.trimStart=Number(qs("#trimStart").value||0);
    c.trimEnd=Number(qs("#trimEnd").value||0);

    let speed=qs("#clipSpeedPreset").value==="custom"
      ? Number(qs("#clipSpeedManual").value||1)
      : Number(qs("#clipSpeedPreset").value||1);

    if(!isFinite(speed))speed=1;
    speed=Math.max(0.25,Math.min(4,speed));
    c.speed=speed;
    qs("#clipSpeedManual").value=speed;

    c.sceneVoiceText=qs("#sceneVoice").value;
    c.subtitle=qs("#subtitle").value;
    state.project.script.text=qs("#scriptText").value;
    renderTimeline(state);
    renderPreview(state);
  }

  qs("#clipSpeedPreset").onchange=()=>{
    if(qs("#clipSpeedPreset").value!=="custom")qs("#clipSpeedManual").value=qs("#clipSpeedPreset").value;
    applyInspectorChanges();
  };
  ["trimStart","trimEnd","clipSpeedManual","sceneVoice","subtitle","scriptText"].forEach(id=>qs("#"+id).oninput=applyInspectorChanges);
}

async function saveProject(state){
  const clips=state.project.timeline.clips;
  if(!clips.length)return alert("Önce video ekle.");
  const fd=new FormData();
  const projectJson={...state.project,timeline:{...state.project.timeline,clips:clips.map(c=>({id:c.id,originalName:c.originalName,trimStart:c.trimStart,trimEnd:c.trimEnd,speed:c.speed,sceneVoiceText:c.sceneVoiceText,subtitle:c.subtitle}))}};
  fd.append("projectJson",JSON.stringify(projectJson));
  clips.forEach(c=>fd.append("videos",c.file,c.originalName));
  if(state.project.music?.file)fd.append("music",state.project.music.file,state.project.music.name);
  qs("#topActions").insertAdjacentHTML("beforeend",`<span class="muted" id="savingNote">Yükleniyor...</span>`);
  try{
    const r=await fetch("/api/projects",{method:"POST",body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error);
    state.currentProjectId=d.projectId;qs("#renderProject").disabled=false;alert("Proje kaydedildi. Render aktif.");
  }catch(e){alert("Kaydetme hatası: "+e.message)}
  qs("#savingNote")?.remove();
}

async function renderProject(state){
  if(!state.currentProjectId)return alert("Önce kaydet.");
  try{const r=await fetch(`/api/projects/${state.currentProjectId}/render`,{method:"POST"});const d=await r.json();if(!r.ok)throw new Error(d.error);qs("#previewArea").innerHTML=`<video id="mainPreview" src="${d.outputUrl}" playsinline controls style="width:100%;height:100%;object-fit:contain"></video>`;alert("Render tamamlandı.");}
  catch(e){alert("Render hatası: "+e.message)}
}
