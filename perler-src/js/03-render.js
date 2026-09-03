/* =========================================================================
   绘制：精灵缓存 + 图纸渲染
   ========================================================================= */
let spriteKey="", spriteMap=new Map();
function sprite(idx){
  const key = S.mode+"|"+(S.showCode?1:0)+"|"+patCv._s+"|"+CELL;
  if(key!==spriteKey){ spriteKey=key; spriteMap=new Map(); }
  let sp = spriteMap.get(idx);
  if(sp) return sp;
  const dpr = patCv._s;
  sp = document.createElement("canvas");
  sp.width = Math.ceil(CELL*dpr); sp.height = Math.ceil(CELL*dpr);
  const c = sp.getContext("2d"); c.setTransform(dpr,0,0,dpr,0,0);
  drawCell(c, 0, 0, CELL, PALETTE[idx], S.mode, S.showCode, false);
  spriteMap.set(idx, sp);
  return sp;
}

function textOn(hex){
  const [r,g,b]=hex2rgb(hex);
  const l=(0.299*r+0.587*g+0.114*b)/255;
  return l>0.56 ? "rgba(0,0,0,.78)" : "rgba(255,255,255,.88)";
}

/* 色号文字配色。strong=true 用于导出图纸：提高不透明度 + 加重描边，
   在大图（4K）上笔画更实、更锐利。返回 {fill, halo}。 */
function codeInk(hex,strong){
  const [r,g,b]=hex2rgb(hex);
  const l=(0.299*r+0.587*g+0.114*b)/255;
  return l>0.56
    ? { fill: strong?"rgba(0,0,0,.94)"      :"rgba(0,0,0,.78)",
        halo: strong?"rgba(255,255,255,.85)":"rgba(255,255,255,.55)" }
    : { fill: strong?"rgba(255,255,255,.98)":"rgba(255,255,255,.88)",
        halo: strong?"rgba(0,0,0,.85)"      :"rgba(0,0,0,.55)" };
}

/** 绘制单个单元格（x,y 为左上角，尺寸 cell） */
function drawCell(c,x,y,cell,p,mode,withCode,print){
  const cx=x+cell/2, cy=y+cell/2;
  if(mode==="bead"){
    const r = cell*0.44;
    c.beginPath(); c.arc(cx,cy,r,0,TAU);
    c.fillStyle = p.h; c.fill();
    if(!print){
      c.beginPath(); c.arc(cx-r*0.26,cy-r*0.28,r*0.30,0,TAU); c.fillStyle="rgba(255,255,255,.25)"; c.fill();
      c.beginPath(); c.arc(cx+r*0.18,cy+r*0.24,r*0.34,0,TAU); c.fillStyle="rgba(0,0,0,.13)"; c.fill();
    }else{
      c.beginPath(); c.arc(cx-r*0.26,cy-r*0.28,r*0.30,0,TAU); c.fillStyle="rgba(255,255,255,.35)"; c.fill();
    }
    c.beginPath(); c.arc(cx,cy,r*0.30,0,TAU);
    c.fillStyle = print ? "#ffffff" : "rgba(0,0,0,.42)"; c.fill();
    if(print){ c.strokeStyle="rgba(0,0,0,.28)"; c.lineWidth=Math.max(.5,cell/32); c.stroke(); }
  }else{
    c.fillStyle = p.h; c.fillRect(x,y,cell,cell);
    if(!print){ // 轻微立体感
      c.fillStyle="rgba(255,255,255,.07)"; c.fillRect(x,y,cell,Math.max(1,cell*0.16));
      c.fillStyle="rgba(0,0,0,.10)"; c.fillRect(x,y+cell-Math.max(1,cell*0.14),cell,Math.max(1,cell*0.14));
    }
  }
  if(withCode){
    // 导出时字号放大到 0.36 倍格宽（4K 下约 23px），并加粗描边，保证清晰可辨
    const ratio = print ? 0.36 : 0.32;
    const f = Math.max(5, Math.round(cell*ratio));
    c.font = '700 '+f+'px Consolas,"Segoe UI",sans-serif';
    c.textAlign="center"; c.textBaseline="middle";
    // 主字 + 反色描边：在中色（黄/粉/玫红）上更可读
    const ink = codeInk(p.h, print);
    c.strokeStyle = ink.halo;
    c.lineWidth = Math.max(1, print ? cell*0.075 : Math.round(cell*0.06));
    c.lineJoin = "round"; c.miterLimit = 2;
    c.strokeText(p.c, cx, cy+0.5);
    c.fillStyle = ink.fill;
    c.fillText(p.c, cx, cy+0.5);
  }
}

let pending=false;
function requestDraw(){ if(pending) return; pending=true; requestAnimationFrame(function(){pending=false; drawPattern();}); }

function drawPattern(){
  const c=patCtx, W=S.w, H=S.h;
  c.clearRect(0,0,W*CELL,H*CELL);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const v=S.grid[y*W+x];
      if(v<0) continue;
      c.drawImage(sprite(v), x*CELL, y*CELL, CELL, CELL);
    }
  }
  if(S.showGrid) drawGridLines(c,W,H,CELL,false);
}

/* 网格线粗细随格子尺寸走：屏幕 16px 格仍是 1px 细线，
   4K 导出（格子 64px 以上）自动加粗，否则线会被"稀释"到几乎看不见。 */
function drawGridLines(c,W,H,cell,print){
  const thin = Math.max(1, cell/24);
  const bold = Math.max(1, cell/12);
  const snap = function(v,w){ return w%2===0 ? Math.round(v) : Math.round(v)+0.5; };
  for(let x=0;x<=W;x++){
    const major = x%10===0, lw = major?bold:thin;
    c.lineWidth = lw;
    c.strokeStyle = print ? (major?"rgba(0,0,0,.46)":"rgba(0,0,0,.17)")
                          : (major?"rgba(255,255,255,.22)":"rgba(255,255,255,.09)");
    const px = snap(x*cell, lw);
    c.beginPath(); c.moveTo(px,0); c.lineTo(px,H*cell); c.stroke();
  }
  for(let y=0;y<=H;y++){
    const major = y%10===0, lw = major?bold:thin;
    c.lineWidth = lw;
    c.strokeStyle = print ? (major?"rgba(0,0,0,.46)":"rgba(0,0,0,.17)")
                          : (major?"rgba(255,255,255,.22)":"rgba(255,255,255,.09)");
    const py = snap(y*cell, lw);
    c.beginPath(); c.moveTo(0,py); c.lineTo(W*cell,py); c.stroke();
  }
}

/* =========================================================================
   底层参考图
   ========================================================================= */
function fitRect(iw,ih,cw,ch,mode){
  if(mode==="stretch") return {dx:0,dy:0,dw:cw,dh:ch};
  const s=Math.min(cw/iw, ch/ih), dw=iw*s, dh=ih*s;
  return {dx:(cw-dw)/2, dy:(ch-dh)/2, dw, dh};
}
function drawBase(){
  const c=baseCtx;
  c.clearRect(0,0,S.w*CELL,S.h*CELL);
  if(!S.img || !S.showImg) return;
  const r=fitRect(S.img.width,S.img.height,S.w,S.h,S.fit);
  c.save();
  c.globalAlpha=S.alpha;
  c.imageSmoothingEnabled=true;
  c.imageSmoothingQuality="high";
  c.drawImage(S.img, r.dx*CELL, r.dy*CELL, r.dw*CELL, r.dh*CELL);
  c.restore();
}

