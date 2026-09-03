/* 导出 */
/* 下载文件。
   注意：页面被嵌在预览面板的 iframe 里时，a[download] 会被浏览器静默忽略
   （点了没反应、也不报错）。这里检测到 iframe 就直接新窗口打开，
   用户右键「另存为」即可。返回 true 表示已直接下载。 */
function download(name,url,revoke){
  const clean=function(){ if(revoke) setTimeout(function(){ URL.revokeObjectURL(url); },4000); };
  try{
    if(window.self!==window.top) throw new Error("in-iframe");
    const a=document.createElement("a");
    a.href=url; a.download=name; a.rel="noopener";
    document.body.appendChild(a); a.click(); a.remove();
    clean(); return true;
  }catch(e){
    let w=null;
    try{ w=window.open(url,"_blank"); }catch(e2){}
    clean(); return !!w;
  }
}
/* 导出倍数：auto = 长边凑到 3840px（4K），倍率 1~40（每格 16~640px）。
   倍率上限 40 是为了让 8×8、16×16 这类小画布也能真正给到 3840 长边；
   再受浏览器 canvas 上限保护（单边 ≤16384、总面积 ≤1.2 亿像素），超了就自动降档。 */
function exportScale(){
  const v=$("selExportScale").value;
  let sc = (v==="auto")
    ? Math.max(1, Math.min(40, Math.ceil(3840/(Math.max(S.w,S.h)*CELL))))
    : (+v || 1);
  const MAXSIDE=16384, MAXAREA=120e6;
  while(sc>1){
    const pw=S.w*CELL*sc, ph=S.h*CELL*sc;
    if(pw<=MAXSIDE && ph<=MAXSIDE && pw*ph<=MAXAREA) break;
    sc--;
  }
  return sc;
}
function updateExportHint(){
  const sc=exportScale(), pw=S.w*CELL*sc, ph=S.h*CELL*sc;
  $("hintExport").textContent =
    "当前："+pw+" × "+ph+" px（"+S.w+"×"+S.h+" 格 / 每格 "+Math.round(CELL*sc)+"px）";
}
function exportPNG(){
  const scale=exportScale(), cell=CELL*scale, W=S.w, H=S.h;
  const cv=document.createElement("canvas");
  cv.width=W*cell; cv.height=H*cell;
  const c=cv.getContext("2d");
  c.fillStyle="#ffffff"; c.fillRect(0,0,cv.width,cv.height);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const v=S.grid[y*W+x]; if(v<0) continue;
    // 图纸导出时强制画色号 —— 用户要的是“图纸生成时标注色号”，与屏幕开关无关
    drawCell(c, x*cell, y*cell, cell, PALETTE[v], S.mode, true, true);
  }
  if(S.showGrid) drawGridLines(c,W,H,cell,true);
  const fname="perler-"+W+"x"+H+"-"+cv.width+"px.png";
  const big = cv.width>=3000 || cv.height>=3000;
  if(big) toast("正在生成 "+cv.width+"×"+cv.height+" 图纸…");
  // 用 toBlob 而不是 toDataURL：blob 更省内存，且不受 data: URL 的长度/下载限制
  if(cv.toBlob){
    cv.toBlob(function(blob){
      if(!blob){ toast("导出失败，请重试"); return; }
      const saved=download(fname, URL.createObjectURL(blob), true);
      toast(saved ? ("图纸 PNG 已导出："+fname) : "已新窗口打开，右键「图片另存为」");
    },"image/png");
  }else{
    const saved=download(fname, cv.toDataURL("image/png"), false);
    toast(saved ? ("图纸 PNG 已导出："+fname) : "已新窗口打开，右键「图片另存为」");
  }
}
function statLines(){
  const counts=new Map();
  for(let i=0;i<S.grid.length;i++){ const v=S.grid[i]; if(v<0) continue; counts.set(v,(counts.get(v)||0)+1); }
  return [...counts.entries()].sort(function(a,b){return b[1]-a[1];});
}
function exportCSV(){
  const arr=statLines();
  if(!arr.length){ toast("画布为空，无法导出"); return; }
  let csv="\ufeff色号,名称,HEX,数量\n";
  arr.forEach(function(e){ const p=PALETTE[e[0]]; csv+=p.c+","+p.gn+","+p.h+","+e[1]+"\n"; });
  const total=arr.reduce(function(s,e){return s+e[1];},0);
  csv+="合计,,,,"+total+"\n";
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const saved=download("perler-bom.csv", url, true);
  toast(saved ? "用料 CSV 已导出：perler-bom.csv" : "已新窗口打开 CSV，请手动保存");
}
function copyList(){
  const arr=statLines();
  if(!arr.length){ toast("画布为空"); return; }
  const txt=arr.map(function(e){return PALETTE[e[0]].c+" "+PALETTE[e[0]].gn+" × "+e[1];}).join("\n");
  const done=function(){ toast("清单已复制"); };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done,function(){ fallbackCopy(txt,done); });
  } else fallbackCopy(txt,done);
}
function fallbackCopy(txt,cb){
  const ta=document.createElement("textarea"); ta.value=txt; ta.style.position="fixed"; ta.style.opacity="0";
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); cb(); }catch(e){ toast("复制失败，请手动选择"); }
  ta.remove();
}
function saveProject(){
  const obj={v:1,w:S.w,h:S.h,mode:S.mode,d:Array.from(S.grid)};
  const url=URL.createObjectURL(new Blob([JSON.stringify(obj)],{type:"application/json"}));
  const saved=download("perler-project.json",url,true);
  toast(saved ? "项目已保存：perler-project.json" : "已新窗口打开项目文件，请手动保存");
}
$("fileProj").addEventListener("change",function(e){
  const f=e.target.files&&e.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=function(){
    try{
      const o=JSON.parse(rd.result);
      if(!o||!o.w||!o.h||!Array.isArray(o.d)) throw 0;
      applySize(o.w,o.h,false);
      S.grid=Int16Array.from(o.d.slice(0,o.w*o.h));
      S.mode=o.mode==="bead"?"bead":"block";
      document.querySelectorAll("#modes .btn").forEach(function(x){x.classList.toggle("on",x.dataset.mode===S.mode);});
      $("inW").value=S.w; $("inH").value=S.h;
      spriteKey="";
      pushHistory(); drawPattern(); updateStats(); updateStatus();
      toast("项目已载入");
    }catch(err){ toast("项目文件格式错误"); }
    e.target.value="";
  };
  rd.readAsText(f);
});
$("btnExportPng").addEventListener("click",exportPNG);
$("btnExportPng2").addEventListener("click",exportPNG);
$("btnExportCsv").addEventListener("click",exportCSV);
$("btnExportCsv2").addEventListener("click",exportCSV);
$("btnCopyList").addEventListener("click",copyList);
$("btnSave").addEventListener("click",saveProject);

/* 键盘快捷键 */
window.addEventListener("keydown",function(e){
  const t=e.target.tagName;
  if(t==="INPUT"||t==="SELECT"||t==="TEXTAREA") return;
  const ctrl=e.ctrlKey||e.metaKey;
  if(ctrl && e.key.toLowerCase()==="z"){ e.preventDefault(); e.shiftKey?redo():undo(); return; }
  if(ctrl && e.key.toLowerCase()==="y"){ e.preventDefault(); redo(); return; }
  if(ctrl) return;
  switch(e.key.toLowerCase()){
    case "b": setTool("brush"); break;
    case "e": setTool("eraser"); break;
    case "i": setTool("picker"); break;
    case "g": document.querySelector('.sw[data-sw="grid"]').click(); break;
    case "r": document.querySelector('.sw[data-sw="ruler"]').click(); break;
    case "n": document.querySelector('.sw[data-sw="code"]').click(); break;
  }
});

/* 窗口变化时保持居中 */
let rt=null;
window.addEventListener("resize",function(){ clearTimeout(rt); rt=setTimeout(function(){ applyZoom(); },120); });

