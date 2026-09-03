/* =========================================================================
   右侧：色板 + 用料统计
   ========================================================================= */
// 展开状态：每类记录是否展开（false = 只显示前 VISIBLE_PER_GROUP 个）
const OPEN = Object.create(null);
GROUP_META.forEach(function(m){ OPEN[m.key] = false; });

function buildPalette(){
  const box=$("palBox"); box.innerHTML="";
  GROUP_META.forEach(function(m){
    const list = PALETTE.filter(function(p){return p.g===m.key;});

    // 标题行
    const t=document.createElement("div");
    t.className="grp"; t.dataset.grp=m.key;
    t.innerHTML='<span class="gdot" style="background:'+list[0].h+'"></span>'
              + '<span class="gname">'+m.label+'</span>'
              + '<span class="gnum">'+list.length+'色</span>'
              + '<span class="gline"></span>'
              + '<button class="gtog" type="button"></button>';
    box.appendChild(t);

    // 色块网格
    const grid=document.createElement("div");
    grid.className="pal"; grid.dataset.grpGrid=m.key;
    box.appendChild(grid);

    list.forEach(function(p,k){
      const el=document.createElement("div");
      el.className="pchip"; el.style.background=p.h;
      el.title=p.c+"  "+p.h; el.dataset.idx=p.i;
      el.dataset.key=(p.c+" "+m.label).toLowerCase();
      el.dataset.seq=k;                                  // 本类内序号
      el.dataset.grp=m.key;
      el.addEventListener("click",function(){ selectColor(p.i); });
      grid.appendChild(el);
    });

    t.querySelector(".gtog").addEventListener("click",function(){
      OPEN[m.key] = !OPEN[m.key];
      applyFold();
    });
  });
  applyFold();
  $("palCount").textContent = PALETTE.length+" 色 / "+GROUP_META.length+" 类";
}

// 按展开状态显示/隐藏第 9 个及以后的色块
function applyFold(){
  document.querySelectorAll(".pchip[data-grp]").forEach(function(el){
    const open = OPEN[el.dataset.grp];
    const hidden = !open && (+el.dataset.seq) >= VISIBLE_PER_GROUP;
    el.classList.toggle("folded", hidden);
    el.style.display = hidden ? "none" : "";
  });
  GROUP_META.forEach(function(m){
    const total = PALETTE.filter(function(p){return p.g===m.key;}).length;
    const rest  = Math.max(0, total - VISIBLE_PER_GROUP);
    const btn   = document.querySelector('.grp[data-grp="'+m.key+'"] .gtog');
    if(!btn) return;
    if(rest <= 0){ btn.hidden = true; return; }
    btn.hidden = false;
    btn.textContent = OPEN[m.key] ? "收起 ▲" : ("展开 +"+rest+" ▼");
  });
  // 搜索过滤仍然生效时重新套用
  const sv = $("palSearch").value.trim().toLowerCase();
  if(sv) applySearch(sv);
}

function selectColor(i){
  S.color=i; const p=PALETTE[i];
  $("curChip").style.background=p.h;
  $("curName").textContent=p.gn;
  $("curCode").textContent=p.c;
  $("curHex").textContent=p.h.toUpperCase();
  document.querySelectorAll(".pchip").forEach(function(el){
    el.classList.toggle("on", +el.dataset.idx===i);
  });
}

// 搜索时自动展开命中色所在的分组，结束后恢复原状态
function applySearch(k){
  // 搜索时临时忽略折叠状态，把命中的色块全部显示出来
  document.querySelectorAll(".pchip[data-grp]").forEach(function(el){
    const folded = !k && !OPEN[el.dataset.grp] && (+el.dataset.seq) >= VISIBLE_PER_GROUP;
    const miss   = !!k && el.dataset.key.indexOf(k) < 0;
    el.style.display = (folded || miss) ? "none" : "";
  });
  document.querySelectorAll(".grp[data-grp]").forEach(function(el){
    const g=el.dataset.grp;
    const hit=document.querySelector('.pchip[data-grp="'+g+'"]:not([style*="display: none"])');
    el.style.display = hit ? "" : "none";
  });
}
$("palSearch").addEventListener("input",function(){
  applySearch(this.value.trim().toLowerCase());
});

let statPending=false;
function requestStats(){ if(statPending) return; statPending=true; requestAnimationFrame(function(){ statPending=false; updateStats(); }); }
function updateStats(){
  const counts=new Map(); let total=0;
  for(let i=0;i<S.grid.length;i++){
    const v=S.grid[i]; if(v<0) continue;
    counts.set(v,(counts.get(v)||0)+1); total++;
  }
  const arr=[...counts.entries()].sort(function(a,b){return b[1]-a[1];});
  const max = arr.length?arr[0][1]:1;
  const list=$("statList");
  $("sumTotal").textContent=total;
  $("sumKinds").textContent=arr.length+" 种颜色";
  $("stCount").textContent=total;
  $("stColors").textContent=arr.length;
  if(!arr.length){ list.innerHTML='<div class="empty">画布是空的<br>开始绘制或一键转图纸吧</div>'; return; }
  let html="";
  arr.forEach(function(e){
    const p=PALETTE[e[0]];
    const wp=Math.max(4, Math.round(e[1]/max*46));
    html+='<div class="srow" title="'+p.c+' '+p.gn+' '+p.h+' × '+e[1]+'">'
        + '<i class="sw2" style="background:'+p.h+'"></i>'
        + '<span class="cd">'+p.c+'</span>'
        + '<span class="nm">'+p.gn+'</span>'
        + '<span class="bar" style="width:'+wp+'px"></span>'
        + '<span class="ct">'+e[1]+'</span></div>';
  });
  list.innerHTML=html;
}

/* =========================================================================
   状态栏 / 提示
   ========================================================================= */
function updateStatus(){
  $("stSize").textContent=S.w+" × "+S.h;
  $("stTool").textContent = S.tool==="brush"?"画笔":(S.tool==="eraser"?"橡皮":"取色器");
  $("stHist").textContent = hi+" / "+Math.max(0,hist.length-1);
  $("btnUndo").disabled = $("btnUndo2").disabled = hi<=0;
  $("btnRedo").disabled = $("btnRedo2").disabled = hi>=hist.length-1;
}
let toastT=null;
function toast(msg){
  const t=$("toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove("show");},1600);
}

