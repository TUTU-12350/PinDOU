/* =========================================================================
   控件绑定
   ========================================================================= */
function setTool(t){
  S.tool=t;
  document.querySelectorAll("#tools .btn").forEach(function(b){ b.classList.toggle("on", b.dataset.tool===t); });
  updateStatus();
}
document.querySelectorAll("#tools .btn").forEach(function(b){
  b.addEventListener("click",function(){ setTool(b.dataset.tool); });
});
document.querySelectorAll("#modes .btn").forEach(function(b){
  b.addEventListener("click",function(){
    S.mode=b.dataset.mode;
    document.querySelectorAll("#modes .btn").forEach(function(x){x.classList.toggle("on",x===b);});
    spriteKey=""; drawPattern();
  });
});
document.querySelectorAll("#presets .btn").forEach(function(b){
  b.addEventListener("click",function(){
    const n=+b.dataset.n;
    $("inW").value=n; $("inH").value=n;
    applySize(n,n,true); pushHistory();
    toast("画布已设为 "+n+"×"+n);
  });
});
$("btnApplySize").addEventListener("click",function(){
  applySize(+$("inW").value,+$("inH").value,true); pushHistory();
  toast("画布尺寸已更新");
});
$("inW").addEventListener("keydown",function(e){ if(e.key==="Enter") $("btnApplySize").click(); });
$("inH").addEventListener("keydown",function(e){ if(e.key==="Enter") $("btnApplySize").click(); });

/* 开关 */
document.querySelectorAll(".sw[data-sw]").forEach(function(sw){
  const key=sw.dataset.sw, tg=sw.querySelector(".tg");
  sw.addEventListener("click",function(){
    const on=!tg.classList.contains("on");
    tg.classList.toggle("on",on);
    if(key==="grid"){ S.showGrid=on; drawPattern(); }
    else if(key==="ruler"){ S.showRuler=on; layoutRulers(); drawRulers(); applyZoom(); }
    else if(key==="code"){ S.showCode=on; spriteKey=""; drawPattern(); }
    else if(key==="showimg"){ S.showImg=on; drawBase(); }
    else if(key==="dither"){ S.dither=on; }
  });
});

$("btnUndo").addEventListener("click",undo);
$("btnRedo").addEventListener("click",redo);
$("btnUndo2").addEventListener("click",undo);
$("btnRedo2").addEventListener("click",redo);
$("btnFlipH").addEventListener("click",flipH);
$("btnFlipV").addEventListener("click",flipV);
$("btnRotR").addEventListener("click",function(){ rotate90(true); });
$("btnRotL").addEventListener("click",function(){ rotate90(false); });
$("btnClear").addEventListener("click",clearCanvas);

$("rgZoom").addEventListener("input",function(){ S.zoom=clampZ(this.value/100); applyZoom(); });
$("btnFit").addEventListener("click",fitToView);
$("selExportScale").addEventListener("change", updateExportHint);
$("rgAlpha").addEventListener("input",function(){
  S.alpha=this.value/100; $("lbAlpha").textContent=this.value+"%"; drawBase();
});
$("selFit").addEventListener("change",function(){ S.fit=this.value; drawBase(); });
$("btnConvert").addEventListener("click",convertImage);
$("btnDelImg").addEventListener("click",function(){
  S.img=null; $("fileImg").value=""; drawBase(); toast("已移除参考底图");
});
$("fileImg").addEventListener("change",function(e){
  const f=e.target.files&&e.target.files[0]; if(!f) return;
  const url=URL.createObjectURL(f);
  const im=new Image();
  im.onload=function(){
    S.img=im; drawBase();
    toast("底图已载入 "+im.width+"×"+im.height);
  };
  im.onerror=function(){ toast("图片载入失败"); };
  im.src=url;
});

