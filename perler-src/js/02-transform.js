/* =========================================================================
   画布尺寸 / 缩放 / 居中
   ========================================================================= */
function setCanvasSize(cv,ctx,w,h){
  const dpr = Math.min(window.devicePixelRatio||1, 2, 4096/Math.max(w,h,1));
  cv.width  = Math.max(1,Math.round(w*dpr));
  cv.height = Math.max(1,Math.round(h*dpr));
  cv.style.width  = w+"px";
  cv.style.height = h+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  cv._s = dpr;
}

function applySize(w,h,keep){
  w = Math.max(4,Math.min(100,w|0));
  h = Math.max(4,Math.min(100,h|0));
  let old = null, ow = S.w, oh = S.h;
  if(keep && S.grid){ old = S.grid.slice(); }
  S.w=w; S.h=h;
  S.grid = new Int16Array(w*h).fill(-1);
  if(keep && old){ // 保留重叠区域内容（左上角对齐）
    const cw=Math.min(ow,w), ch=Math.min(oh,h);
    for(let y=0;y<ch;y++) for(let x=0;x<cw;x++) S.grid[y*w+x] = old[y*ow+x];
  }
  holder.style.width  = (w*CELL)+"px";
  holder.style.height = (h*CELL)+"px";
  setCanvasSize(baseCv,baseCtx,w*CELL,h*CELL);
  setCanvasSize(patCv,patCtx,w*CELL,h*CELL);
  spriteKey = "";
  layoutRulers();
  applyZoom();
  drawBase(); drawPattern(); drawRulers(); updateStats(); updateStatus();
  updateExportHint();
}

const ZMIN=0.25, ZMAX=8;
function clampZ(z){ return Math.max(ZMIN, Math.min(ZMAX, Math.round(z*100)/100)); }

function applyZoom(){
  stack.style.setProperty("--z", S.zoom);
  const rs = S.showRuler ? RS : 0;
  const w = rs + S.w*CELL, h = rs + S.h*CELL;
  zoomwrap.style.width  = Math.round(w*S.zoom)+"px";
  zoomwrap.style.height = Math.round(h*S.zoom)+"px";
  $("lbZoom").textContent = Math.round(S.zoom*100)+"%";
  $("rgZoom").value = Math.round(S.zoom*100);
}

/* 以某个屏幕点为锚点缩放：该点在画布内容里的位置保持不动。
   zoomwrap 用 margin:auto 居中，缩放后其 offsetLeft/offsetTop 会变，
   所以必须先记旧位置算出内容坐标 u,v，applyZoom 之后再按新位置反解 scroll。 */
function zoomAt(z, clientX, clientY){
  const nz = clampZ(z);
  if(nz === S.zoom) return;
  const r = stage.getBoundingClientRect();
  const mx = clientX - r.left, my = clientY - r.top;   // 鼠标在 stage 视口内的位置
  const zr = zoomwrap;
  const Lx = zr.offsetLeft, Ly = zr.offsetTop;         // 缩放前 zoomwrap 在内容区的左上角
  const u = (stage.scrollLeft + mx - Lx) / S.zoom;     // 该点对应的 zoomwrap 内未缩放坐标
  const v = (stage.scrollTop  + my - Ly) / S.zoom;
  S.zoom = nz;
  applyZoom();
  const Lx2 = zr.offsetLeft, Ly2 = zr.offsetTop;       // 缩放后位置（居中会重算）
  stage.scrollLeft = Lx2 + u*nz - mx;
  stage.scrollTop  = Ly2 + v*nz - my;
}

/* 滚轮缩放：无修饰键 = 以光标为锚点缩放；Shift+滚轮 = 交还原生滚动 */
stage.addEventListener("wheel", function(e){
  if(e.shiftKey) return;
  e.preventDefault();
  const dir = e.deltaY < 0 ? 1 : -1;
  const step = e.deltaMode === 1 ? 0.25 : 0.12;        // 行滚动时步子大一点
  zoomAt(S.zoom * (dir > 0 ? 1+step : 1/(1+step)), e.clientX, e.clientY);
}, {passive:false});

/* 中键拖动平移（不影响画笔：画笔在 pointerdown 处直接让位给 pan） */
stage.addEventListener("pointerdown", function(e){
  if(e.button!==1) return;
  e.preventDefault();
  startPan(e);
});
let panning=false, panX=0, panY=0;
function startPan(e){
  panning=true; panX=e.clientX; panY=e.clientY;
  stage.classList.add("panning");
  try{ stage.setPointerCapture(e.pointerId); }catch(err){}
}
stage.addEventListener("pointermove", function(e){
  if(!panning) return;
  stage.scrollLeft -= (e.clientX - panX);
  stage.scrollTop  -= (e.clientY - panY);
  panX=e.clientX; panY=e.clientY;
});
function endPan(){ if(!panning) return; panning=false; stage.classList.remove("panning"); }
window.addEventListener("pointerup", endPan);
window.addEventListener("pointercancel", endPan);
stage.addEventListener("auxclick", function(e){ if(e.button===1) e.preventDefault(); });

function fitToView(){
  const rs = S.showRuler ? RS : 0;
  const w = rs + S.w*CELL, h = rs + S.h*CELL;
  const pad = 40;
  const z = Math.min((stage.clientWidth-pad)/w, (stage.clientHeight-pad)/h, ZMAX);
  S.zoom = clampZ(z);
  applyZoom();
}

function layoutRulers(){
  const on = S.showRuler;
  stack.classList.toggle("noruler", !on);
  document.documentElement.style.setProperty("--rs", on ? RS+"px" : "0px");
  if(!on) return;
  const w = S.w*CELL, h = S.h*CELL;
  rTop.style.width=w+"px";  rTop.style.height=RS+"px";
  rLeft.style.width=RS+"px"; rLeft.style.height=h+"px";
  setCanvasSize(rTop,rTopCtx,w,RS);
  setCanvasSize(rLeft,rLeftCtx,RS,h);
}

function drawRulers(){
  if(!S.showRuler) return;
  drawRulerX(); drawRulerY();
}
/* 刻度画在单元格边界上；每 10 格一个主刻度，数字写在该格中心（1 起算） */
function drawRulerX(){
  const c=rTopCtx, w=S.w*CELL, H=RS;
  c.clearRect(0,0,w,H);
  c.fillStyle=RC.bg; c.fillRect(0,0,w,H);
  c.font='9px Consolas,"Segoe UI",sans-serif'; c.textAlign="center"; c.textBaseline="middle";
  for(let i=0;i<=S.w;i++){
    const x=i*CELL+0.5, major=i%10===0, mid=i%5===0;
    c.strokeStyle = major?RC.major:(mid?RC.mid:RC.line);
    c.lineWidth = major?1:1;
    c.beginPath(); c.moveTo(x, major?0:H-(major?12:(mid?8:5))); c.lineTo(x,H); c.stroke();
  }
  for(let i=0;i<S.w;i++){
    if(i%10!==0) continue;
    c.fillStyle=RC.num;
    c.fillText(String(i+1), i*CELL+CELL/2, 7);
  }
  c.strokeStyle=RC.line; c.beginPath(); c.moveTo(0,H-.5); c.lineTo(w,H-.5); c.stroke();
}
function drawRulerY(){
  const c=rLeftCtx, W=RS, h=S.h*CELL;
  c.clearRect(0,0,W,h);
  c.fillStyle=RC.bg; c.fillRect(0,0,W,h);
  c.font='9px Consolas,"Segoe UI",sans-serif'; c.textAlign="center"; c.textBaseline="middle";
  for(let i=0;i<=S.h;i++){
    const y=i*CELL+0.5, major=i%10===0, mid=i%5===0;
    c.strokeStyle = major?RC.major:(mid?RC.mid:RC.line);
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(major?0:W-(major?12:(mid?8:5)), y); c.lineTo(W,y); c.stroke();
  }
  for(let i=0;i<S.h;i++){
    if(i%10!==0) continue;
    c.save(); c.translate(8, i*CELL+CELL/2); c.rotate(-Math.PI/2);
    c.fillStyle=RC.num; c.fillText(String(i+1),0,0); c.restore();
  }
  c.strokeStyle=RC.line; c.beginPath(); c.moveTo(W-.5,0); c.lineTo(W-.5,h); c.stroke();
}
/* 标尺配色跟随主题：切换主题后刷新一次即可 */
let RC={bg:"#1c2027",line:"rgba(255,255,255,.13)",mid:"rgba(255,255,255,.32)",
        major:"rgba(255,138,43,.85)",num:"#ffb066"};
function refreshRulerColors(){
  const cs=getComputedStyle(document.documentElement);
  const g=function(n){const v=cs.getPropertyValue(n).trim();return v||"";};
  RC={ bg:g("--rbg")||RC.bg, line:g("--rline")||RC.line, mid:g("--rmid")||RC.mid,
       major:g("--rmajor")||RC.major, num:g("--rnum")||RC.num };
  drawRulers();
}

