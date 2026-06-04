import { qs, safeId, showModal, closeModal } from "../core.js";
import { openVoicePicker } from "./voices.js";
import { openMusicPicker } from "./music.js";
import { openCharacterEditor } from "./characters.js";

let previewAudio = null, previewMusic = null;
let sequencePlaying = false;

// Çift Katmanlı Oynatıcı Motor Değişkenleri
let playerA = null;
let playerB = null;
let activePlayerSign = 'A'; // 'A' veya 'B'

export function renderStudio(state, navigate) {
  qs("#topActions").innerHTML = `
    <button class="btn secondary" id="addVideo">+ Video</button>
    <button class="btn secondary" id="addCharacter">+ Karakter</button>
    <button class="btn secondary" id="addMusic">+ Müzik</button>
    <button class="btn secondary" id="chooseVoice">Ses Seç</button>
    <button class="btn" id="saveProject">Kaydet</button>
    <button class="btn" id="renderProject" disabled>Render</button>
  `;
  qs("#content").innerHTML = `
    <div class="studioLayout">
      <section>
        <div class="card previewCard">
          <div class="previewArea" id="previewArea" style="position: relative; background: #020617; overflow: hidden; aspect-ratio: 16/9;">
            <div class="previewHint" id="initialPreviewHint" style="z-index: 10;">Video seçilmedi</div>
          </div>
          <div class="controlBar">
            <button class="btn secondary" id="playPreview">▶</button>
            <button class="btn secondary" id="stopPreview">■</button>
            <div class="timebar" id="engineStatusLabel" style="font-size: 11px; font-family: monospace; color: #888; padding-left: 10px; display: flex; align-items: center;"></div>
          </div>
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

  playerA = document.getElementById('player-buffer-a');
  playerB = document.getElementById('player-buffer-b');

  if (playerA && playerB) {
    playerA.pause();
    playerB.pause();
    playerA.style.opacity = '0';
    playerB.style.opacity = '0';
  }

  bindTop(state, navigate);
  renderTools(state);
  renderTimeline(state);
  renderInspector(state);
}

function bindTop(state, navigate) {
  qs("#addVideo").onclick = () => openVideoModal(state);
  qs("#addCharacter").onclick = () => openCharacterEditor(state, () => renderStudio(state, navigate));
  qs("#addMusic").onclick = () => openMusicPicker(state, () => renderStudio(state, navigate));
  qs("#chooseVoice").onclick = () => openVoicePicker(state, (voice) => { alert("Seçilen ses: " + voice.name); });
  qs("#saveProject").onclick = () => saveProject(state);
  qs("#renderProject").onclick = () => renderProject(state);
  qs("#playPreview").onclick = () => togglePreview(state);
  qs("#stopPreview").onclick = () => {
    sequencePlaying = false;
    if (playerA) { playerA.pause(); playerA.currentTime = 0; playerA.style.opacity = "0"; }
    if (playerB) { playerB.pause(); playerB.currentTime = 0; playerB.style.opacity = "0"; }
    if (qs("#initialPreviewHint")) qs("#initialPreviewHint").style.display = "block";
    updateEngineStatusLabel(state);
  };
}

function openVideoModal(state) {
  showModal("Video Ekle", `
    <label>MP4 / WEBM seçin</label>
    <input id="videoPicker" type="file" accept="video/mp4,video/webm" multiple>
    <button class="btn" id="addSelectedVideos" style="margin-top:12px">Timeline'a Ekle</button>
  `);
  qs("#addSelectedVideos").onclick = () => {
    const files = [...qs("#videoPicker").files];
    if (!files.length) return alert("Video seç.");
    files.forEach(file => state.project.timeline.clips.push({ id: safeId(), file, originalName: file.name, trimStart: 0, trimEnd: 0, speed: 1, volume: 1, subtitle: '', sceneVoiceText: '' }));
    state.selectedClipIndex = state.project.timeline.clips.length - 1;
    closeModal();
    renderStudio(state, () => {});
  };
}

// ... (Buradaki standart runAction, renderTools ve renderTimeline fonksiyonları yapınızı korur)
function renderTools(state) {
  const actions = state.studioSchema.clipActions;
  qs("#toolRow").innerHTML = actions.map(a => `<button data-action="${a.id}">${a.icon} ${a.label}</button>`).join("");
  qs("#toolRow").querySelectorAll("button").forEach(btn => btn.onclick = () => runAction(state, btn.dataset.action));
}

function runAction(state, action) {
  const i = state.selectedClipIndex, clips = state.project.timeline.clips;
  if (i < 0 || !clips[i]) return alert("Önce timeline'dan klip seç.");
  const c = clips[i];
  if (action === "delete") { clips.splice(i, 1); state.selectedClipIndex = Math.min(i, clips.length - 1); }
  if (action === "moveLeft" && i > 0) { [clips[i - 1], clips[i]] = [clips[i], clips[i - 1]]; state.selectedClipIndex = i - 1; }
  if (action === "moveRight" && i < clips.length - 1) { [clips[i + 1], clips[i]] = [clips[i], clips[i + 1]]; state.selectedClipIndex = i + 1; }
  if (action === "slow") { c.speed = 0.5; }
  if (action === "fast") { c.speed = 1.5; }
  renderTimeline(state); renderInspector(state); renderPreview(state);
}

function renderTimeline(state) {
  const schema = state.studioSchema.tracks;
  const clips = state.project.timeline.clips;
  qs("#timeline").innerHTML = schema.map(t => `<div class="track"><div class="trackLabel">${t.label}</div><div class="trackLane" id="track-${t.id}"></div></div>`).join("");
  const videoLane = qs("#track-video");
  videoLane.innerHTML = clips.map((c, i) => `<div class="clip ${i === state.selectedClipIndex ? 'selected' : ''}" data-idx="${i}" draggable="true"><small>${i + 1}. ${c.originalName}</small></div>`).join("") || '<div class="muted">+ Video ekle</div>';
  
  videoLane.querySelectorAll(".clip").forEach(el => {
    el.onclick = () => { sequencePlaying = false; state.selectedClipIndex = Number(el.dataset.idx); renderTimeline(state); renderInspector(state); renderPreview(state, false); };
  });
  renderPreview(state, false);
}

// SARSINTISIZ OYNATICI MOTORU
function renderPreview(state, autoplay = false) {
  const clips = state.project.timeline.clips;
  const c = clips[state.selectedClipIndex];

  if (!c) {
    if (qs("#initialPreviewHint")) qs("#initialPreviewHint").style.display = "block";
    if (playerA) playerA.style.opacity = "0";
    if (playerB) playerB.style.opacity = "0";
    return;
  }

  if (qs("#initialPreviewHint")) qs("#initialPreviewHint").style.display = "none";
  const previewArea = qs("#previewArea");
  if (playerA && playerA.parentElement !== previewArea) previewArea.appendChild(playerA);
  if (playerB && playerB.parentElement !== previewArea) previewArea.appendChild(playerB);

  const currentVideoDom = activePlayerSign === 'A' ? playerA : playerB;
  const passiveVideoDom = activePlayerSign === 'A' ? playerB : playerA;

  if (currentVideoDom.dataset.clipId !== c.id) {
    currentVideoDom.src = URL.createObjectURL(c.file);
    currentVideoDom.dataset.clipId = c.id;
    currentVideoDom.load();
  }

  currentVideoDom.playbackRate = Number(c.speed || 1);
  currentVideoDom.muted = true;
  currentVideoDom.ontimeupdate = null;

  if (autoplay) {
    currentVideoDom.style.zIndex = "3";
    passiveVideoDom.style.zIndex = "2";
    currentVideoDom.ontimeupdate = () => {
      if (currentVideoDom.currentTime > 0) {
        currentVideoDom.style.opacity = "1";
        passiveVideoDom.style.opacity = "0";
        passiveVideoDom.style.zIndex = "1";
        passiveVideoDom.pause();
        currentVideoDom.ontimeupdate = null;
      }
    };
    currentVideoDom.play().catch(e => console.log(e.message));
  } else {
    currentVideoDom.style.opacity = "1";
    currentVideoDom.style.zIndex = "3";
    passiveVideoDom.style.opacity = "0";
    passiveVideoDom.pause();
  }

  preloadNextClip(state);

  currentVideoDom.onended = () => {
    if (!sequencePlaying) return;
    const next = state.selectedClipIndex + 1;
    if (next < clips.length) {
      activePlayerSign = activePlayerSign === 'A' ? 'B' : 'A';
      state.selectedClipIndex = next;
      renderTimeline(state);
      renderInspector(state);
      renderPreview(state, true);
    } else {
      sequencePlaying = false;
      state.selectedClipIndex = 0;
      activePlayerSign = 'A';
      renderTimeline(state);
      renderPreview(state, false);
    }
  };
  updateEngineStatusLabel(state);
}

function preloadNextClip(state) {
  const clips = state.project.timeline.clips;
  const nextIndex = state.selectedClipIndex + 1;
  if (nextIndex < clips.length && playerA && playerB) {
    const nextClip = clips[nextIndex];
    const passiveVideoDom = activePlayerSign === 'A' ? playerB : playerA;
    if (passiveVideoDom.dataset.clipId !== nextClip.id) {
      passiveVideoDom.src = URL.createObjectURL(nextClip.file);
      passiveVideoDom.dataset.clipId = nextClip.id;
      passiveVideoDom.load();
    }
  }
}

function togglePreview(state) {
  if (!state.project.timeline.clips.length) return;
  const currentVideoDom = activePlayerSign === 'A' ? playerA : playerB;
  if (currentVideoDom.paused) { sequencePlaying = true; currentVideoDom.play(); } 
  else { sequencePlaying = false; currentVideoDom.pause(); }
  updateEngineStatusLabel(state);
}

function updateEngineStatusLabel(state) {
  const label = qs("#engineStatusLabel");
  if (label) label.innerText = `SAHNE: ${(state.project.timeline.clips.length > 0 ? state.selectedClipIndex + 1 : 0)}/${state.project.timeline.clips.length} | KATMAN: ${activePlayerSign}`;
}

function renderInspector(state) {
  const c = state.project.timeline.clips[state.selectedClipIndex];
  if (!c) { qs("#inspector").innerHTML = '<div class="emptyState">Klip seçilmedi</div>'; return; }
  qs("#inspector").innerHTML = `<label>Altyazı</label><input id="subtitle" value="${c.subtitle || ""}">`;
  qs("#subtitle").oninput = (e) => { c.subtitle = e.target.value; };
}

// ASENKRON CELERY TAKİPLİ RENDER BAĞLANTILARI
async function saveProject(state) {
  const clips = state.project.timeline.clips;
  if (!clips.length) return alert("Önce video ekle.");
  const fd = new FormData();
  
  const projectJson = {
    id: state.currentProjectId || null,
    transition: { type: "fade", duration: 0.8 },
    timeline: { clips: clips.map((c, i) => ({ id: c.id, index: i, originalName: c.originalName, trimStart: c.trimStart || 0, trimEnd: c.trimEnd || 0, speed: c.speed || 1 })) }
  };

  fd.append("projectJson", JSON.stringify(projectJson));
  clips.forEach(c => { if (c.file instanceof File) fd.append("videos", c.file, c.originalName); });

  try {
    const r = await fetch("/api/projects", { method: "POST", body: fd });
    const d = await r.json();
    state.currentProjectId = d.projectId || d.id;
    qs("#renderProject").disabled = false;
    alert("Proje Buluta Kaydedildi!");
  } catch (e) { alert("Kaydetme hatası: " + e.message); }
}

async function renderProject(state) {
  if (!state.currentProjectId) return alert("Önce kaydet.");
  const previewArea = qs("#previewArea");
  const renderBtn = qs("#renderProject");
  
  renderBtn.disabled = true;
  previewArea.innerHTML = `<div style="color:white; text-align:center; padding-top:20%;"><h3>FFmpeg Kuyrukta...</h3><p id="progressTxt">İşlem başlatılıyor...</p></div>`;

  try {
    const r = await fetch(`/api/projects/${state.currentProjectId}/render`, { method: "POST" });
    const d = await r.json();
    const jobId = d.jobId || d.id;

    // Celery Polling Döngüsü (Her 2 saniyede bir durumu kontrol et)
    const checkStatus = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const job = await res.json();

      if (job.status === "SUCCESS" || job.status === "completed") {
        clearInterval(checkStatus);
        previewArea.innerHTML = `<video src="${job.outputUrl}" controls style="width:100%;height:100%;object-fit:contain;"></video>`;
        renderBtn.disabled = false;
        alert("Render Bitti!");
      } else if (job.status === "FAILURE" || job.status === "failed") {
        clearInterval(checkStatus);
        previewArea.innerHTML = `<div style="color:red;">Render Çöktü!</div>`;
        renderBtn.disabled = false;
      } else {
        qs("#progressTxt").innerText = `Video İşleniyor... Durum: ${job.status}`;
      }
    }, 2000);

  } catch (e) {
    alert("Render Hatası: " + e.message);
    renderBtn.disabled = false;
  }
}
