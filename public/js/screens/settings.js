import { qs } from "../core.js";
export function renderSettings(state){
  qs("#content").innerHTML=`<div class="grid2">
    <div class="card"><div class="cardHeader"><h2>API Ayarları</h2></div><div class="cardBody">
      ${state.providers.map(p=>`<div class="provider"><div><b>${p.name}</b><div class="muted">${p.type.join(", ")} · opsiyonel</div></div><input data-key="${p.keyField}" type="password" placeholder="API key"></div>`).join("")}
      <button class="btn" id="saveApi">API Anahtarlarını Kaydet</button>
      <button class="btn secondary" id="testOpenAi">OpenAI Test Et</button>
      <div class="status" id="apiStatus"></div>
    </div></div>
    <div class="card"><div class="cardHeader"><h2>Genel Ayarlar</h2></div><div class="cardBody">
      <label>Marka / Kanal</label><input id="brandName">
      <label>Varsayılan Oran</label><select id="defaultRatio"><option>16:9</option><option>9:16</option></select>
      <button class="btn" id="saveGeneral" style="margin-top:12px">Kaydet</button>
    </div></div>
  </div>`;
  qs("#saveApi").onclick=async()=>{const obj={};document.querySelectorAll("[data-key]").forEach(i=>{if(i.value)obj[i.dataset.key]=i.value});await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(obj)});alert("API ayarları kaydedildi.");};
  qs("#testOpenAi").onclick=async()=>{const r=await fetch("/api/providers/test/openai",{method:"POST"});qs("#apiStatus").textContent=JSON.stringify(await r.json(),null,2);};
  qs("#saveGeneral").onclick=async()=>{await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({"brand.name":qs("#brandName").value,"default.ratio":qs("#defaultRatio").value})});alert("Kaydedildi.");};
}
