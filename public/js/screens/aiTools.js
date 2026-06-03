import { qs } from "../core.js";
export function renderAiTools(state){
  qs("#content").innerHTML=`<div class="grid2">${state.features.map(f=>`<div class="card"><div class="cardHeader"><h2>${f.title}</h2><span class="badge">${f.requiresApi?"API":"Yerel"}</span></div><div class="cardBody"><div class="muted">Kategori: ${f.category}</div><div class="muted">Fallback: ${f.fallback||"gerekmez"}</div></div></div>`).join("")}</div>`;
}
