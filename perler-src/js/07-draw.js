/* =========================================================================
   绘图交互
   ========================================================================= */
let drawing=false, lastCell=null, strokeDirty=false, tempEraser=false;

function cellFromEvent(e){
  const r=patCv.getBoundingClientRect();
  const x=Math.floor((e.clientX-r.left)/r.width*S.w);
  const y=Math.floor((e.clientY-r.top)/r.height*S.h);
  if(x<0||y<0||x>=S.w||y>=S.h) return null;
  return {x:x,y:y};
}
function putCell(x,y,val){
  const i=y*S.w+x;
  if(S.grid[i]===val) return false;
  S.grid[i]=val; return true;
}
function line(x0,y0,x1,y1,val){
  let dirty=false;
  const dx=Math.abs(x1-x0), dy=Math.abs(y1-y0);
  const sx=x0<x1?1:-1, sy=y0<y1?1:-1;
  let err=dx-dy;
  for(;;){
    if(putCell(x0,y0,val)) dirty=true;
    if(x0===x1&&y0===y1) break;
    const e2=2*err;
    if(e2>-dy){ err-=dy; x0+=sx; }
    if(e2<dx){ err+=dx; y0+=sy; }
  }
  return dirty;
}

patCv.addEventListener("contextmenu",function(e){e.preventDefault();});
patCv.addEventListener("pointerdown",function(e){
  if(e.button===1) return;                 // 中键让位给平移
  const c=cellFromEvent(e); if(!c) return;
  try{ patCv.setPointerCapture(e.pointerId); }catch(err){}
  tempEraser = (e.button===2);
  const tool = tempEraser ? "eraser" : S.tool;
  if(tool==="picker"){
    const v=S.grid[c.y*S.w+c.x];
    if(v>=0){ selectColor(v); toast("已拾取 "+PALETTE[v].c+" "+PALETTE[v].gn); setTool("brush"); }
    else toast("该格为空");
    return;
  }
  drawing=true; strokeDirty=false;
  const val = tool==="eraser" ? -1 : S.color;
  if(line(c.x,c.y,c.x,c.y,val)) strokeDirty=true;
  lastCell=c;
  requestDraw(); requestStats();
});
patCv.addEventListener("pointermove",function(e){
  const c=cellFromEvent(e);
  updatePos(c);
  if(!drawing||!c) return;
  if(lastCell && (lastCell.x!==c.x||lastCell.y!==c.y)){
    const val = (tempEraser||S.tool==="eraser") ? -1 : S.color;
    if(line(lastCell.x,lastCell.y,c.x,c.y,val)) strokeDirty=true;
    requestDraw(); requestStats();
  }
  lastCell=c;
});
window.addEventListener("pointerup",function(){
  if(!drawing) return;
  drawing=false; lastCell=null; tempEraser=false;
  if(strokeDirty){ pushHistory(); updateStats(); }
});
patCv.addEventListener("pointerleave",function(){ updatePos(null); });

function updatePos(c){ $("stPos").textContent = c ? ((c.x+1)+" , "+(c.y+1)) : "—"; }

