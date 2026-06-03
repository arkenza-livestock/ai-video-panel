export const qs=(s,root=document)=>root.querySelector(s);
export const qsa=(s,root=document)=>[...root.querySelectorAll(s)];
export async function loadJson(url){const r=await fetch(url);if(!r.ok)throw new Error("JSON yüklenemedi: "+url);return r.json();}
export function setActive(items,predicate){items.forEach(i=>i.classList.toggle("active",predicate(i)));}
export function safeId(){return window.crypto?.randomUUID?crypto.randomUUID():"id-"+Date.now()+"-"+Math.round(Math.random()*1e9);}
export function showModal(title,bodyHtml){
  const root=qs("#modalRoot");
  root.classList.remove("hidden");
  root.innerHTML=`<div class="modal"><div class="modalHeader"><h2>${title}</h2><button class="btn secondary" id="modalClose">Kapat</button></div><div class="modalBody">${bodyHtml}</div></div>`;
  qs("#modalClose").onclick=()=>closeModal();
}
export function closeModal(){const root=qs("#modalRoot");root.classList.add("hidden");root.innerHTML="";}
export async function postJson(url,data){const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"İstek başarısız.");return d;}
