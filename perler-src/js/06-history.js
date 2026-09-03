/* =========================================================================
   历史（撤销 / 重做，最多 50 步）
   ========================================================================= */
let hist=[], hi=-1;
function snapshot(){ return {w:S.w,h:S.h,d:new Int16Array(S.grid)}; }
function pushHistory(){
  hist = hist.slice(0, hi+1);
  hist.push(snapshot());
  while(hist.length > MAXHIST+1){ hist.shift(); }
  hi = hist.length-1;
  updateStatus();
}
function restore(){
  const s=hist[hi];
  if(s.w!==S.w || s.h!==S.h){
    S.w=s.w; S.h=s.h;
    $("inW").value=s.w; $("inH").value=s.h;
    holder.style.width=(s.w*CELL)+"px"; holder.style.height=(s.h*CELL)+"px";
    setCanvasSize(baseCv,baseCtx,s.w*CELL,s.h*CELL);
    setCanvasSize(patCv,patCtx,s.w*CELL,s.h*CELL);
    spriteKey=""; layoutRulers(); applyZoom(); drawBase(); drawRulers();
  }
  S.grid=new Int16Array(s.d);
  drawPattern(); updateStats(); updateStatus();
}
function undo(){ if(hi<=0){ toast("没有可撤销的操作"); return; } hi--; restore(); }
function redo(){ if(hi>=hist.length-1){ toast("没有可重做的操作"); return; } hi++; restore(); }
function commit(msg){ pushHistory(); drawPattern(); updateStats(); updateStatus(); if(msg) toast(msg); }

