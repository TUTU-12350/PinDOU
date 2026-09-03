/* =========================================================================
   外观主题切换（顶栏色点 + 浮层，选择写入 localStorage）
   ========================================================================= */
const THEME_KEY = "pbs.theme";
// sw = 浮层里的双色预览 [面板色, 画布棋盘格色]
const THEMES = [
  {id:"graphite", name:"石墨灰",   sw:["#262c33","#525861"]},
  {id:"neutral",  name:"中性灰",   sw:["#333940","#5a5f65"]},
  {id:"paper",    name:"浅色纸感", sw:["#fbfaf7","#8e9298"]},
  {id:"midnight", name:"深夜",     sw:["#191c21","#4a4f55"]}
];

function buildThemeList(){
  const box=$("themeList"); box.innerHTML="";
  THEMES.forEach(function(t){
    const el=document.createElement("div");
    el.className="tp-item"; el.dataset.theme=t.id;
    el.innerHTML='<span class="tp-sw"><i style="background:'+t.sw[0]+'"></i>'
               + '<i style="background:'+t.sw[1]+'"></i></span>'
               + '<span class="tp-name">'+t.name+'</span>'
               + '<span class="tp-chk"></span>';
    el.addEventListener("click",function(){ applyTheme(t.id); closeThemePop(); });
    box.appendChild(el);
  });
}
function applyTheme(id){
  const t=THEMES.filter(function(x){return x.id===id;})[0];
  if(!t) id="graphite";
  document.documentElement.setAttribute("data-theme", id);
  try{ localStorage.setItem(THEME_KEY, id); }catch(e){}
  document.querySelectorAll(".tp-item").forEach(function(el){
    const on = el.dataset.theme===id;
    el.classList.toggle("on", on);
    el.querySelector(".tp-chk").textContent = on ? "✓" : "";
  });
  $("themePop").querySelector(".tp-t").textContent = "外观主题 · "+t.name;
  refreshRulerColors();
}
function initTheme(){
  let id=null;
  try{ id=localStorage.getItem(THEME_KEY); }catch(e){}
  if(!id || !THEMES.some(function(t){return t.id===id;})) id="graphite";
  buildThemeList();
  applyTheme(id);
}
function openThemePop(){
  $("themePop").hidden=false;
  $("btnTheme").classList.add("open");
  $("btnTheme").setAttribute("aria-expanded","true");
}
function closeThemePop(){
  $("themePop").hidden=true;
  $("btnTheme").classList.remove("open");
  $("btnTheme").setAttribute("aria-expanded","false");
}
$("btnTheme").addEventListener("click",function(e){
  e.stopPropagation();
  $("themePop").hidden ? openThemePop() : closeThemePop();
});
$("themePop").addEventListener("click",function(e){ e.stopPropagation(); });
document.addEventListener("click",function(){ if(!$("themePop").hidden) closeThemePop(); });
window.addEventListener("keydown",function(e){ if(e.key==="Escape") closeThemePop(); });

/* ---------------- 启动 ---------------- */
boot();
