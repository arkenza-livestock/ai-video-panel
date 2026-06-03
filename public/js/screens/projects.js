import { qs } from "../core.js";
export async function renderProjects(state){
  const data=await fetch("/api/projects").then(r=>r.json()).catch(()=>({projects:[]}));
  qs("#content").innerHTML=`<div class="card"><div class="cardHeader"><h2>Projeler</h2></div><div class="cardBody list">
  ${(data.projects||[]).map(p=>`<div class="listItem"><b>${p.name}</b><div class="muted">${p.status} · ${p.created_at}</div>${p.output_url?`<a style="color:#67e8f9" href="${p.output_url}" target="_blank">Final MP4</a>`:""}</div>`).join("")||'<div class="muted">Proje yok.</div>'}
  </div></div>`;
}
