import { qs } from "../core.js";
export async function renderDashboard(state,navigate){
  const projects=await fetch("/api/projects").then(r=>r.json()).catch(()=>({projects:[]}));
  qs("#topActions").innerHTML=`<button class="btn" id="newProject">Yeni Proje</button>`;
  qs("#content").innerHTML=`
    <div class="grid3">
      <div class="card kpi"><span>Projeler</span><b>${projects.projects?.length||0}</b></div>
      <div class="card kpi"><span>Yerel Render</span><b>FFmpeg</b></div>
      <div class="card kpi"><span>API Durumu</span><b>Opsiyonel</b></div>
    </div>
    <div class="card" style="margin-top:14px"><div class="cardHeader"><h2>Son Projeler</h2><span class="badge">Database</span></div><div class="cardBody list">
      ${(projects.projects||[]).map(p=>`<div class="listItem"><b>${p.name}</b><div class="muted">${p.status} · ${p.created_at}</div>${p.output_url?`<a style="color:#67e8f9" href="${p.output_url}" target="_blank">Finali aç</a>`:""}</div>`).join("")||'<div class="muted">Henüz proje yok.</div>'}
    </div></div>
  `;
  qs("#newProject").onclick=()=>navigate("studio");
}
