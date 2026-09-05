const state={sites:[],category:"الكل",tabs:[],activeTab:null};
const LS={fav:"myLibraryFavorites",history:"myLibraryHistory",theme:"myLibraryTheme",opens:"myLibraryOpens",lastPart:"myLibraryLastPart"};

function getBase(){return new URL(".",location.href)}
function resolve(p){return new URL(p,getBase()).href}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function getFav(){try{return JSON.parse(localStorage.getItem(LS.fav)||"[]")}catch{return[]}}
function saveFav(a){localStorage.setItem(LS.fav,JSON.stringify(a))}
function getHistory(){try{return JSON.parse(localStorage.getItem(LS.history)||"[]")}catch{return[]}}
function saveHistory(a){localStorage.setItem(LS.history,JSON.stringify(a.slice(0,30)))}
function isFav(id){return getFav().includes(id)}
function getOpens(){try{return JSON.parse(localStorage.getItem(LS.opens)||"{}")}catch{return{}}}
function bumpOpens(id){const o=getOpens();o[id]=(o[id]||0)+1;localStorage.setItem(LS.opens,JSON.stringify(o))}
function getLastPart(){try{return JSON.parse(localStorage.getItem(LS.lastPart)||"{}")}catch{return{}}}
function setLastPart(id,index){const o=getLastPart();o[id]=index;localStorage.setItem(LS.lastPart,JSON.stringify(o))}
function toggleFav(id,e){e?.stopPropagation();let a=getFav();a=a.includes(id)?a.filter(x=>x!==id):[...a,id];saveFav(a);renderAll();const tab=state.tabs.find(t=>t.id===state.activeTab);if(tab?.siteId===id)document.getElementById("favViewer").textContent=isFav(id)?"♥":"♡"}
function findTab(siteId){return state.tabs.find(t=>t.siteId===siteId)}
function getTabSite(tab){return tab.siteId?state.sites.find(s=>s.id===tab.siteId):null}

async function init(){
  const theme=localStorage.getItem(LS.theme);if(theme==="dark")document.body.classList.add("dark");
  updateThemeIcon();
  document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem(LS.theme,document.body.classList.contains("dark")?"dark":"light");updateThemeIcon()}
  document.getElementById("search").addEventListener("input",()=>{document.getElementById("clearSearch").classList.toggle("hidden",!document.getElementById("search").value);renderAll()});
  document.getElementById("clearSearch").onclick=()=>{const s=document.getElementById("search");s.value="";s.focus();document.getElementById("clearSearch").classList.add("hidden");renderAll()};
  document.getElementById("closeModal").onclick=closeCourse;
  document.querySelector("#courseModal .modal-backdrop").onclick=closeCourse;
  document.getElementById("closeHistory").onclick=()=>document.getElementById("historyModal").classList.add("hidden");
  document.querySelector("#historyModal .modal-backdrop").onclick=()=>document.getElementById("historyModal").classList.add("hidden");
  document.getElementById("historyBtn").onclick=showHistory;
  document.getElementById("closeViewer").onclick=closeViewer;
  document.getElementById("backCourse").onclick=()=>{const tab=state.tabs.find(t=>t.id===state.activeTab);const s=tab&&getTabSite(tab);if(s)openCourse(s)};
  document.getElementById("openNew").onclick=()=>{const f=document.querySelector(".tab-frames iframe.active");if(f)window.open(f.src,"_blank")};
  document.getElementById("fullscreen").onclick=()=>{document.querySelector(".tab-frames iframe.active")?.requestFullscreen?.()};
  document.getElementById("favViewer").onclick=()=>{const tab=state.tabs.find(t=>t.id===state.activeTab);if(tab?.siteId)toggleFav(tab.siteId)};
  document.getElementById("addTab").onclick=addEmptyTab;
  document.getElementById("prevPart").onclick=()=>stepPart(-1);
  document.getElementById("nextPart").onclick=()=>stepPart(1);
  document.getElementById("partsToggle").onclick=()=>{document.getElementById("lessonSidebar").classList.add("open");document.getElementById("sidebarBackdrop").classList.remove("hidden")};
  document.getElementById("sidebarBackdrop").onclick=()=>{document.getElementById("lessonSidebar").classList.remove("open");document.getElementById("sidebarBackdrop").classList.add("hidden")};
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCourse();closeViewer()}});
  try{
    const r=await fetch("sites.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error();
    const data=await r.json();state.sites=Array.isArray(data)?data:(data.sites||[]);
    renderCategories();renderAll();renderHistory();
  }catch(e){document.getElementById("cards").innerHTML='<div class="empty">تعذر تحميل المحتوى. تأكد من وجود sites.json.</div>'}
}
function allCategories(){return [...new Set(state.sites.flatMap(s=>s.category?[s.category]:[]))].filter(Boolean)}
function renderCategories(){
  const box=document.getElementById("categories");box.innerHTML="";
  ["الكل",...allCategories()].forEach(c=>{const b=document.createElement("button");b.className="chip "+(state.category===c?"active":"");b.textContent=c;b.onclick=()=>{state.category=c;renderCategories();renderAll()};box.appendChild(b)})
}
function matches(s,q){
  if(!q)return true;const text=[s.name,s.description,s.category,...(s.tags||[]),...(s.parts||[]).map(p=>p.title)].join(" ").toLowerCase();return text.includes(q.toLowerCase())
}
function filtered(){
  const q=document.getElementById("search").value.trim();
  return state.sites.filter(s=>(state.category==="الكل"||s.category===state.category)&&matches(s,q))
}
function cardHtml(s){
  const parts=s.parts||[];const multi=parts.length>1;
  return `<article class="card" data-id="${esc(s.id)}">
    <div class="cover">${s.image?`<img src="${esc(resolve(s.image))}" alt="">`:`<div class="cover-icon">${multi?"📂":"📄"}</div>`}
      ${s.featured?`<div class="stamp"><span>محتوى<br>مميز</span></div>`:""}
      <button class="fav" data-fav="${esc(s.id)}">${isFav(s.id)?"♥":"♡"}</button>
    </div>
    <div class="card-body"><div class="card-title"><h3>${esc(s.name)}</h3></div>
      <p class="card-desc">${esc(s.description||"")}</p>
      <div class="meta">${s.level?`<span class="tag">${esc(s.level)}</span>`:""}${s.duration?`<span class="tag">${esc(s.duration)}</span>`:""}${multi?`<span class="tag">${parts.length} أجزاء</span>`:""}${s.category?`<span class="tag">${esc(s.category)}</span>`:""}</div>
      ${s.tags?.length?`<div class="meta" style="margin-top:8px">${s.tags.slice(0,3).map(t=>`<span class="tag">#${esc(t)}</span>`).join("")}</div>`:""}
    </div></article>`
}
function bindCards(container){
  container.querySelectorAll(".card").forEach(c=>c.onclick=()=>{const s=state.sites.find(x=>x.id===c.dataset.id);openCourse(s)});
  container.querySelectorAll("[data-fav]").forEach(b=>b.onclick=e=>toggleFav(b.dataset.fav,e))
}
function renderAll(){
  const list=filtered();document.getElementById("countLabel").textContent=`${list.length} عنصر`;
  const cards=document.getElementById("cards");cards.innerHTML=list.map(cardHtml).join("");bindCards(cards);
  document.getElementById("empty").classList.toggle("hidden",!!list.length);
  const featured=state.sites.filter(s=>s.featured);const fg=document.getElementById("featuredGrid");fg.innerHTML=featured.map(cardHtml).join("");document.getElementById("featuredSection").classList.toggle("hidden",!featured.length);bindCards(fg);
  const opens=getOpens();const trending=[...state.sites].filter(s=>opens[s.id]>0).sort((a,b)=>(opens[b.id]||0)-(opens[a.id]||0)).slice(0,6);
  const tSec=document.getElementById("exploreSection"),tg=document.getElementById("trendingGrid");
  if(tSec)tSec.classList.toggle("hidden",!trending.length);
  tg.innerHTML=trending.map(cardHtml).join("");bindCards(tg);
  renderStats();
  renderHistory();
}
function renderStats(){
  const el1=document.getElementById("statCourses"),el2=document.getElementById("statCategories"),el3=document.getElementById("statFavorites");
  if(!el1)return;el1.textContent=state.sites.length;el2.textContent=allCategories().length;el3.textContent=getFav().length;
}
function openCourse(s){
  if(!s)return;document.getElementById("modalBadge").textContent=s.featured?"محتوى مميز":(s.category||"");
  document.getElementById("modalTitle").textContent=s.name||"";document.getElementById("modalDesc").textContent=s.description||"";
  document.getElementById("modalMeta").innerHTML=[s.level&&`<span class="tag">${esc(s.level)}</span>`,s.duration&&`<span class="tag">${esc(s.duration)}</span>`,...(s.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`)].filter(Boolean).join("");
  const parts=s.parts?.length?s.parts:[{title:s.name,file:s.file}];const box=document.getElementById("partsList");
  const lastIdx=getLastPart()[s.id];
  box.innerHTML=parts.map((p,i)=>`<div class="part" data-part="${i}"><span class="part-number">${i+1}</span><span class="part-title"><strong>${esc(p.title||`الدرس ${i+1}`)}</strong><br><small>${i===lastIdx?"▶️ آخر ما فتحته":(i===0?"الجزء الأول":`الجزء ${i+1}`)}</small></span><span>▶</span></div>`).join("");
  box.querySelectorAll(".part").forEach(x=>x.onclick=()=>openPart(s,+x.dataset.part));
  document.getElementById("courseModal").classList.remove("hidden");
}
function closeCourse(){document.getElementById("courseModal").classList.add("hidden")}

/* ---- Tabs ---- */
function openPart(s,index){
  if(!s)return;closeCourse();
  const parts=s.parts?.length?s.parts:[{title:s.name,file:s.file}];
  index=Math.max(0,Math.min(index,parts.length-1));
  let tab=findTab(s.id);
  if(!tab){
    tab={id:"t"+Date.now()+Math.random().toString(36).slice(2,6),siteId:s.id,partIndex:index};
    state.tabs.push(tab);
    const iframe=document.createElement("iframe");
    iframe.dataset.tab=tab.id;iframe.title="محتوى الدرس";iframe.allowFullscreen=true;
    document.getElementById("tabFrames").appendChild(iframe);
  }else{
    tab.partIndex=index;
  }
  state.activeTab=tab.id;
  const iframe=document.querySelector(`#tabFrames iframe[data-tab="${tab.id}"]`);
  const target=resolve(parts[index].file);if(iframe.src!==target)iframe.src=target;
  document.querySelectorAll("#tabFrames > [data-tab]").forEach(el=>el.classList.toggle("active",el===iframe));
  renderTabStrip();renderViewerChrome();
  document.getElementById("lessonSidebar").classList.remove("open");document.getElementById("sidebarBackdrop").classList.add("hidden");
  document.getElementById("viewer").classList.remove("hidden");document.body.style.overflow="hidden";
  bumpOpens(s.id);setLastPart(s.id,index);
  const h=getHistory();h.unshift({siteId:s.id,part:index,title:parts[index].title||s.name,at:Date.now()});saveHistory(uniqueHistory(h));renderHistory();
}
function addEmptyTab(){
  const tab={id:"t"+Date.now()+Math.random().toString(36).slice(2,6),siteId:null,partIndex:0};
  state.tabs.push(tab);
  const div=document.createElement("div");div.className="tab-picker";div.dataset.tab=tab.id;
  document.getElementById("tabFrames").appendChild(div);
  state.activeTab=tab.id;
  document.querySelectorAll("#tabFrames > [data-tab]").forEach(el=>el.classList.toggle("active",el===div));
  renderTabPicker(tab.id);
  renderTabStrip();renderViewerChrome();
  document.getElementById("lessonSidebar").classList.remove("open");document.getElementById("sidebarBackdrop").classList.add("hidden");
  document.getElementById("viewer").classList.remove("hidden");document.body.style.overflow="hidden";
}
function renderTabPicker(tabId){
  const div=document.querySelector(`#tabFrames [data-tab="${tabId}"]`);if(!div)return;
  div.innerHTML=`<div class="tab-picker-inner"><h2>تبويب جديد — اختر درسًا لفتحه</h2><div class="search-box"><span aria-hidden="true">🔎</span><input class="tab-search" placeholder="ابحث عن درس، مشروع، وسم أو تصنيف..."></div><div class="tab-picker-grid cards"></div></div>`;
  const grid=div.querySelector(".tab-picker-grid"),inp=div.querySelector(".tab-search");
  function update(){
    const q=inp.value.trim();const list=state.sites.filter(s=>matches(s,q));
    grid.innerHTML=list.map(cardHtml).join("")||'<div class="empty">لا نتائج مطابقة.</div>';
    grid.querySelectorAll(".card").forEach(c=>c.onclick=()=>{const s=state.sites.find(x=>x.id===c.dataset.id);selectCourseForTab(tabId,s)});
    grid.querySelectorAll("[data-fav]").forEach(b=>b.onclick=e=>toggleFav(b.dataset.fav,e));
  }
  inp.addEventListener("input",update);update();inp.focus();
}
function selectCourseForTab(tabId,s){
  if(!s)return;const tab=state.tabs.find(t=>t.id===tabId);if(!tab)return;
  document.querySelector(`#tabFrames [data-tab="${tabId}"]`)?.remove();
  const iframe=document.createElement("iframe");iframe.dataset.tab=tabId;iframe.title="محتوى الدرس";iframe.allowFullscreen=true;
  document.getElementById("tabFrames").appendChild(iframe);
  const parts=s.parts?.length?s.parts:[{title:s.name,file:s.file}];
  const lastIdx=getLastPart()[s.id];const index=(lastIdx!=null&&lastIdx<parts.length)?lastIdx:0;
  tab.siteId=s.id;tab.partIndex=index;
  iframe.src=resolve(parts[index].file);
  document.querySelectorAll("#tabFrames > [data-tab]").forEach(el=>el.classList.toggle("active",el===iframe));
  renderTabStrip();renderViewerChrome();
  bumpOpens(s.id);setLastPart(s.id,index);
  const h=getHistory();h.unshift({siteId:s.id,part:index,title:parts[index].title||s.name,at:Date.now()});saveHistory(uniqueHistory(h));renderHistory();
}
function renderViewerChrome(){
  const tab=state.tabs.find(t=>t.id===state.activeTab);if(!tab)return;
  if(!tab.siteId){
    document.getElementById("viewerTitle").textContent="تبويب جديد";document.getElementById("partCounter").textContent="";
    document.getElementById("backCourse").classList.add("hidden");document.getElementById("partsToggle").classList.add("hidden");
    document.getElementById("prevPart").disabled=true;document.getElementById("nextPart").disabled=true;
    document.getElementById("favViewer").textContent="♡";document.getElementById("lessonSidebar").innerHTML="";
    return;
  }
  const s=getTabSite(tab);if(!s)return;
  const parts=s.parts?.length?s.parts:[{title:s.name,file:s.file}];const index=tab.partIndex,p=parts[index];
  document.getElementById("viewerTitle").textContent=p.title||s.name;document.getElementById("partCounter").textContent=`${index+1} / ${parts.length}`;
  document.getElementById("backCourse").classList.toggle("hidden",parts.length<=1);
  document.getElementById("partsToggle").classList.toggle("hidden",parts.length<=1);
  document.getElementById("prevPart").disabled=index<=0;document.getElementById("nextPart").disabled=index>=parts.length-1;
  document.getElementById("favViewer").textContent=isFav(s.id)?"♥":"♡";
  renderSidebar(parts,index);
}
function renderTabStrip(){
  const box=document.getElementById("tabStrip");
  box.innerHTML=state.tabs.map(t=>{
    let label;if(!t.siteId){label="تبويب جديد"}else{const s=getTabSite(t);if(!s)return"";label=s.name}
    return `<div class="tab-item ${t.id===state.activeTab?"active":""}" data-tab="${t.id}"><span class="tab-title">${esc(label)}</span><button class="tab-close" data-tab="${t.id}" title="إغلاق التبويب">✕</button></div>`;
  }).join("");
  box.querySelectorAll(".tab-item").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest(".tab-close"))return;switchTab(el.dataset.tab)}));
  box.querySelectorAll(".tab-close").forEach(b=>b.addEventListener("click",e=>closeTab(b.dataset.tab,e)));
  box.querySelector(".tab-item.active")?.scrollIntoView({inline:"nearest",block:"nearest"});
}
function switchTab(tabId){
  const tab=state.tabs.find(t=>t.id===tabId);if(!tab)return;
  state.activeTab=tabId;
  document.querySelectorAll("#tabFrames > [data-tab]").forEach(el=>el.classList.toggle("active",el.dataset.tab===tabId));
  renderTabStrip();renderViewerChrome();
  document.getElementById("lessonSidebar").classList.remove("open");document.getElementById("sidebarBackdrop").classList.add("hidden");
}
function closeTab(tabId,evt){
  evt?.stopPropagation();
  const idx=state.tabs.findIndex(t=>t.id===tabId);if(idx<0)return;
  document.querySelector(`#tabFrames [data-tab="${tabId}"]`)?.remove();
  state.tabs.splice(idx,1);
  if(!state.tabs.length){closeViewer();return}
  if(state.activeTab===tabId){const next=state.tabs[idx]||state.tabs[idx-1];switchTab(next.id)}
  else renderTabStrip();
}
function stepPart(delta){
  const tab=state.tabs.find(t=>t.id===state.activeTab);if(!tab||!tab.siteId)return;
  const s=getTabSite(tab);if(!s)return;
  const parts=s.parts?.length?s.parts:[{title:s.name,file:s.file}];
  const next=tab.partIndex+delta;if(next<0||next>=parts.length)return;openPart(s,next);
}
function uniqueHistory(a){const seen=new Set();return a.filter(x=>{const k=x.siteId+"|"+x.part;if(seen.has(k))return false;seen.add(k);return true})}
function renderSidebar(parts,active){document.getElementById("lessonSidebar").innerHTML=parts.map((p,i)=>`<div class="side-part ${i===active?"active":""}" data-i="${i}"><b>${i+1}. ${esc(p.title||"الدرس")}</b></div>`).join("");document.querySelectorAll(".side-part").forEach(x=>x.onclick=()=>{const tab=state.tabs.find(t=>t.id===state.activeTab);const s=tab&&getTabSite(tab);if(s)openPart(s,+x.dataset.i)})}
function closeViewer(){document.getElementById("viewer").classList.add("hidden");document.getElementById("tabFrames").innerHTML="";state.tabs=[];state.activeTab=null;document.body.style.overflow=""}
function updateThemeIcon(){document.getElementById("themeBtn").textContent=document.body.classList.contains("dark")?"☀️":"🌙"}
function renderHistory(){
  const h=getHistory();const sec=document.getElementById("continueSection"),box=document.getElementById("continueList");if(!h.length){sec.classList.add("hidden");return}sec.classList.remove("hidden");
  box.innerHTML=h.slice(0,5).map(x=>{const s=state.sites.find(z=>z.id===x.siteId);return s?`<div class="mini" data-h="${esc(x.siteId)}" data-p="${x.part}"><strong>${esc(x.title)}</strong><small>${esc(s.name)} · ${new Date(x.at).toLocaleDateString("ar-EG")}</small></div>`:""}).join("");box.querySelectorAll(".mini").forEach(x=>x.onclick=()=>{const s=state.sites.find(z=>z.id===x.dataset.h);openPart(s,+x.dataset.p)})
}
function showHistory(){const h=getHistory(),box=document.getElementById("historyList");box.innerHTML=h.length?h.map(x=>{const s=state.sites.find(z=>z.id===x.siteId);return s?`<div class="history-row" data-id="${esc(x.siteId)}" data-p="${x.part}"><strong>${esc(s.name)} — ${esc(x.title)}</strong><small>${new Date(x.at).toLocaleString("ar-EG")}</small></div>`:""}).join(""):'<p class="empty">السجل فارغ.</p>';box.querySelectorAll(".history-row").forEach(x=>x.onclick=()=>{document.getElementById("historyModal").classList.add("hidden");openPart(state.sites.find(s=>s.id===x.dataset.id),+x.dataset.p)});document.getElementById("historyModal").classList.remove("hidden")}
let deferredInstall;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;document.getElementById("installBtn").hidden=false});document.getElementById("installBtn").onclick=async()=>{if(deferredInstall){deferredInstall.prompt();deferredInstall=null}};
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
init();
