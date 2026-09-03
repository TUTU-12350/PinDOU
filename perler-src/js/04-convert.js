/* =========================================================================
   图片 → 拼豆图纸（RGB 欧式距离 + 可选 Floyd–Steinberg 误差扩散）
   ========================================================================= */
function nearestIdx(r,g,b){
  let best=0, bd=Infinity;
  for(let i=0;i<PALETTE.length;i++){
    const p=PALETTE[i].rgb;
    const dr=r-p[0], dg=g-p[1], db=b-p[2];
    const d=dr*dr+dg*dg+db*db;      // 欧式距离（平方比较，等价）
    if(d<bd){ bd=d; best=i; }
  }
  return best;
}

function convertImage(){
  if(!S.img){ toast("请先上传参考图片"); return; }
  const W=S.w, H=S.h;
  const off=document.createElement("canvas"); off.width=W; off.height=H;
  const octx=off.getContext("2d",{willReadFrequently:true});
  const r=fitRect(S.img.width,S.img.height,W,H,S.fit);
  octx.drawImage(S.img, r.dx, r.dy, r.dw, r.dh);
  const data=octx.getImageData(0,0,W,H).data;

  const buf=new Float32Array(W*H*3);
  const mask=new Uint8Array(W*H);
  for(let i=0;i<W*H;i++){
    const a=data[i*4+3];
    if(a<20){ mask[i]=0; continue; }
    mask[i]=1;
    buf[i*3]=data[i*4]; buf[i*3+1]=data[i*4+1]; buf[i*3+2]=data[i*4+2];
  }

  const out=new Int16Array(W*H).fill(-1);
  const clamp=function(v){return v<0?0:(v>255?255:v);};

  if(S.dither){
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const i=y*W+x; if(!mask[i]) continue;
        const r0=clamp(buf[i*3]), g0=clamp(buf[i*3+1]), b0=clamp(buf[i*3+2]);
        const pi=nearestIdx(r0,g0,b0), p=PALETTE[pi].rgb;
        out[i]=pi;
        const er=r0-p[0], eg=g0-p[1], eb=b0-p[2];
        const put=function(nx,ny,w){
          if(nx<0||ny<0||nx>=W||ny>=H) return;
          const j=ny*W+nx; if(!mask[j]) return;
          buf[j*3]+=er*w; buf[j*3+1]+=eg*w; buf[j*3+2]+=eb*w;
        };
        put(x+1,y,7/16); put(x-1,y+1,3/16); put(x,y+1,5/16); put(x+1,y+1,1/16);
      }
    }
  }else{
    for(let i=0;i<W*H;i++){
      if(!mask[i]) continue;
      out[i]=nearestIdx(clamp(buf[i*3]),clamp(buf[i*3+1]),clamp(buf[i*3+2]));
    }
  }

  S.grid=out;
  pushHistory();
  drawPattern(); updateStats(); updateStatus();
  toast("已转换为拼豆图纸");
}

