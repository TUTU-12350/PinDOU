/* ---------------- 常量与状态 ---------------- */
const CELL = 16;            // 单元格固定 16px
const RS   = 24;            // 标尺厚度
const MAXHIST = 50;         // 最多 50 步历史
const TAU = Math.PI * 2;

const S = {
  w:60, h:60,
  grid:null,                 // Int16Array，-1 表示空
  tool:"brush",
  color:0,
  mode:"block",              // block | bead
  showGrid:true, showRuler:true, showCode:true,
  showImg:true, dither:false,
  fit:"contain", alpha:0.55,
  zoom:1,
  img:null
};

/* ---------------- DOM ---------------- */
const $ = function(id){return document.getElementById(id);};
const stage=$("stage"), zoomwrap=$("zoomwrap"), stack=$("stack"), holder=$("holder");
const baseCv=$("baseCanvas"), patCv=$("patCanvas");
const rTop=$("rulerTop"), rLeft=$("rulerLeft"), corner=$("corner");
const baseCtx=baseCv.getContext("2d"), patCtx=patCv.getContext("2d");
const rTopCtx=rTop.getContext("2d"), rLeftCtx=rLeft.getContext("2d");

/* ---------------- 初始化（放在脚本末尾执行，避免 TDZ） ---------------- */
function boot(){
  S.grid = new Int16Array(S.w*S.h).fill(-1);
  initTheme();
  buildPalette();
  applySize(S.w,S.h,false);
  pushHistory();
  selectColor(0);
  updateStatus();
  updateExportHint();
}

