import { loadJson, qs, qsa, setActive } from "./core.js";
import { renderDashboard } from "./screens/dashboard.js";
import { renderProjects } from "./screens/projects.js";
import { renderStudio } from "./screens/studio.js";
import { renderCharacters } from "./screens/characters.js";
import { renderVoices } from "./screens/voices.js";
import { renderMusic } from "./screens/music.js";
import { renderAiTools } from "./screens/aiTools.js";
import { renderSettings } from "./screens/settings.js";

const state={
  tabs:[],
  activeTab:"dashboard",
  project:{
    name:"Yeni Proje",
    timeline:{clips:[]},
    characters:[],
    script:{text:""},
    music:null,
    audio:{voiceVolume:1,musicVolume:.28}
  },
  selectedClipIndex:-1,
  voiceLibrary:[],
  providers:[],
  features:[],
  studioSchema:null
};

const renderers={
  dashboard:renderDashboard,
  projects:renderProjects,
  studio:renderStudio,
  characters:renderCharacters,
  voices:renderVoices,
  music:renderMusic,
  "ai-tools":renderAiTools,
  settings:renderSettings
};

async function boot(){
  state.tabs=await loadJson("/config/tabs/main.json");
  state.voiceLibrary=await loadJson("/config/features/voice-library.json");
  state.providers=await loadJson("/config/providers/providers.json");
  state.features=await loadJson("/config/features/features.json");
  state.studioSchema=await loadJson("/config/features/studio-schema.json");

  qs("#app").innerHTML=`
    <div class="appShell">
      <aside class="sidebar">
        <div class="logo"><div class="logoMark">AI</div><div class="logoText"><b>Content Studio</b><span>Modular JSON</span></div></div>
        <nav class="nav" id="nav"></nav>
        <div class="sidebarFooter"><span class="statusDot"></span><span>API opsiyonel · Yerel render aktif</span></div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="pageTitle"><h1 id="pageTitle"></h1><p id="pageDesc"></p></div>
          <div class="actions" id="topActions"></div>
        </header>
        <section class="content" id="content"></section>
      </main>
    </div>
  `;
  renderNav();
  navigate("dashboard");
}

function renderNav(){
  qs("#nav").innerHTML=state.tabs.map(t=>`<button data-tab="${t.id}">${t.icon}<span>${t.label}</span></button>`).join("");
  qsa("#nav button").forEach(btn=>btn.onclick=()=>navigate(btn.dataset.tab));
}

export function navigate(tabId){
  state.activeTab=tabId;
  const tab=state.tabs.find(t=>t.id===tabId);
  setActive(qsa("#nav button"), b=>b.dataset.tab===tabId);
  qs("#pageTitle").textContent=tab?.title||tabId;
  qs("#pageDesc").textContent=tab?.description||"";
  qs("#topActions").innerHTML="";
  const renderer=renderers[tabId]||renderDashboard;
  renderer(state,navigate);
}

boot();
