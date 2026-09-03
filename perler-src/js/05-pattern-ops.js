/* =========================================================================
   图案变换
   ========================================================================= */
function flipH(){
  const W=S.w,H=S.h,g=new Int16Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) g[y*W+x]=S.grid[y*W+(W-1-x)];
  S.grid=g; commit("水平镜像完成");
}
function flipV(){
  const W=S.w,H=S.h,g=new Int16Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) g[y*W+x]=S.grid[(H-1-y)*W+x];
  S.grid=g; commit("垂直镜像完成");
}
function rotate90(cw){
  const W=S.w,H=S.h,g=new Int16Array(W*H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const v=S.grid[y*W+x];
    if(cw) g[x*H+(H-1-y)]=v;      // 顺时针
    else   g[(W-1-x)*H+y]=v;      // 逆时针
  }
  // 必须先重建画布，再把旋转结果写回，否则会被 applySize 清空
  S.w=H; S.h=W;
  applySize(S.w,S.h,false);
  S.grid=g;
  $("inW").value=S.w; $("inH").value=S.h;
  pushHistory(); drawPattern(); updateStats(); updateStatus();
  toast(cw?"顺时针旋转 90°":"逆时针旋转 90°");
}
function clearCanvas(){
  S.grid=new Int16Array(S.w*S.h).fill(-1);
  commit("画布已清空");
}

