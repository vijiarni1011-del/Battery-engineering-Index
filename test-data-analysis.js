/* ═══════════════════════════════════════════════════════════════
   BatteryMIS — TEST DATA ANALYSIS  v3.0
   AVL Concerto-style:
   · Multi-sheet Excel browser (all sheets selectable)
   · Draggable X/Y axis assignment per pane
   · Resizable panes (drag handle)
   · Synchronized cursor across all panes
   · Per-pane statistics (min/max/avg/rms/std)
   · AI analysis vs project targets
   · Single scatter graph with free X/Y assignment
   ═══════════════════════════════════════════════════════════════ */

(function patchBTCats() {
  const add = () => { if(typeof BT_CATS!=='undefined'&&!BT_CATS.find(c=>c.id==='data_analysis')) BT_CATS.push({id:'data_analysis',icon:'🔬',label:'Test Data Analysis',color:'#e879f9'}); };
  add();
  const _o = window.renderBatteryTesting;
  window.renderBatteryTesting = function(catId) { add(); catId==='data_analysis'?renderDataAnalysis():(_o&&_o(catId)); };
})();

/* ══ GLOBAL STATE ══ */
window._tda = window._tda || {
  wb:null, sheets:[], activeSheet:'', data:null,
  panes:[], zoomX:{x0:0,x1:1}, cursor:null,
  aiResult:null, scatterX:null, scatterY:null,
  dragCol:null,
};

/* ══ COLOURS ══ */
const TC=['#4a9eff','#00d4aa','#ff7b35','#f5c518','#ef4444','#a78bfa','#34d399','#fb923c','#38bdf8','#e879f9','#fbbf24','#60a5fa','#f472b6','#4ade80','#facc15','#c084fc','#67e8f9','#fda4af'];
const tc=ci=>TC[ci%TC.length];

/* ══ MAIN RENDER ══ */
window.renderDataAnalysis = function() {
  const root = document.getElementById('bt_root');
  if(!root) return;
  const t = window._tda;
  const S = window.S||{};
  const has = t.data&&t.data.rows?.length>0;
  if(has&&!t.panes.length) tdaInitPanes();

  root.innerHTML = `
<style>
#tdaApp{display:flex;flex-direction:column;height:calc(100vh - 110px);min-height:400px;background:#06090f;font-family:'JetBrains Mono',monospace;overflow:hidden}
#tdaCatNav{display:flex;gap:2px;padding:6px 10px;background:#0a0f1e;border-bottom:1px solid #1a2640;overflow-x:auto;flex-shrink:0}
.tdaCatBtn{padding:5px 11px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:var(--sans);border:1px solid transparent;background:transparent;color:#5a7090;transition:all .12s}
.tdaCatBtn:hover{background:rgba(255,255,255,.04);color:#dde8f8}
.tdaCatBtn.active{border-color:#e879f950;background:#e879f915;color:#e879f9}
#tdaCtxBar{display:flex;flex-wrap:nowrap;gap:3px;padding:5px 12px;background:#080c18;border-bottom:1px solid #1a2640;overflow-x:auto;flex-shrink:0;align-items:center}
.tdaCC{display:flex;gap:3px;align-items:center;background:rgba(255,255,255,.03);border:1px solid #1a2640;border-radius:3px;padding:1px 6px;flex-shrink:0}
.tdaCCk{font-size:9px;color:#3a567a;text-transform:uppercase}
.tdaCCv{font-size:10px;color:#e879f9;font-weight:700}
#tdaToolbar{display:flex;align-items:center;gap:5px;padding:5px 10px;background:#080c18;border-bottom:1px solid #1a2640;flex-shrink:0;flex-wrap:wrap}
.tdaBtn{padding:3px 9px;background:#0e1828;border:1px solid #1a2640;border-radius:4px;font-size:11px;color:#8aaabb;cursor:pointer;font-family:'JetBrains Mono',monospace;transition:all .12s;white-space:nowrap}
.tdaBtn:hover{background:#162030;color:#dde8f8;border-color:#2a4060}
.tdaBtn:disabled{opacity:.35;cursor:default}
.tdaBtn.hi{border-color:#e879f950;color:#e879f9;background:#1a0d25}
.tdaSep{width:1px;height:18px;background:#1a2640;flex-shrink:0}
#tdaMain{display:flex;flex:1;min-height:0;overflow:hidden}
#tdaCharts{flex:1;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;min-width:0;position:relative}
.tdaPane{position:relative;flex-shrink:0;border-bottom:2px solid #162030;background:#06090f;min-height:80px}
.tdaPane.dragover{background:rgba(232,121,249,.04);border:1px dashed #e879f9}
.tdaPaneHdr{display:flex;align-items:center;gap:6px;padding:3px 8px;background:#080c18;border-bottom:1px solid #162030;font-size:10px;user-select:none}
.tdaPaneTitle{color:#dde8f8;font-weight:700;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tdaReadout{font-size:10px;color:#00d4aa;padding:1px 7px;background:rgba(0,212,170,.07);border-radius:3px;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tdaPaneBtn{cursor:pointer;color:#3a567a;padding:0 3px;font-size:11px;transition:color .1s}
.tdaPaneBtn:hover{color:#dde8f8}
.tdaPaneStats{display:flex;gap:8px;padding:2px 8px;background:#04070e;border-bottom:1px solid #0e1828;font-size:9px;overflow-x:auto;flex-shrink:0}
.tdaStat{display:flex;gap:3px;align-items:center;white-space:nowrap}
.tdaStatK{color:#3a567a}
.tdaStatV{font-weight:700}
.tdaAxisDrop{display:flex;align-items:center;gap:4px;padding:2px 8px;background:#04070e;font-size:9px;border-bottom:1px solid #0e1828;flex-shrink:0}
.tdaAxisChip{padding:2px 7px;border-radius:3px;cursor:default;border:1px dashed #2a4060;color:#5a7090;font-size:9px}
.tdaAxisChip.set{border-color:#e879f950;color:#e879f9;cursor:grab;background:#1a0d25}
.tdaResizeHandle{height:5px;background:#0e1828;cursor:ns-resize;flex-shrink:0;transition:background .15s}
.tdaResizeHandle:hover{background:#e879f9}
.tdaAddPane{display:flex;align-items:center;justify-content:center;min-height:40px;margin:6px;background:rgba(255,255,255,.01);border:1px dashed #1a2640;border-radius:6px;cursor:pointer;color:#3a567a;font-size:11px;transition:all .15s}
.tdaAddPane:hover{border-color:#e879f9;color:#e879f9;background:rgba(232,121,249,.03)}
#tdaBrowser{width:220px;min-width:160px;background:#050810;border-left:1px solid #1a2640;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden}
#tdaBrowserResize{width:4px;background:#1a2640;cursor:col-resize;transition:background .15s;flex-shrink:0}
#tdaBrowserResize:hover{background:#e879f9}
.tdaBrowserHdr{padding:6px 10px;border-bottom:1px solid #1a2640;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.tdaSheetTabs{display:flex;gap:2px;padding:4px 6px;border-bottom:1px solid #1a2640;overflow-x:auto;flex-shrink:0}
.tdaSheetTab{padding:3px 8px;border-radius:4px;font-size:10px;cursor:pointer;color:#3a567a;border:1px solid transparent;white-space:nowrap;transition:all .12s}
.tdaSheetTab:hover{background:#162030;color:#dde8f8}
.tdaSheetTab.active{border-color:#e879f950;background:#1a0d25;color:#e879f9}
#tdaChanList{flex:1;overflow-y:auto;padding:3px}
.tdaGrpHdr{padding:3px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#3a567a;background:rgba(255,255,255,.01);position:sticky;top:0;z-index:1}
.tdaChanItem{display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:4px;cursor:grab;border:1px solid transparent;transition:background .1s}
.tdaChanItem:hover{background:#162030;border-color:#1a2640}
.tdaChanItem.inUse{background:rgba(232,121,249,.04);border-color:#e879f920}
.tdaChanDot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.tdaChanName{font-size:10px;color:#8aaabb;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tdaChanStat{font-size:9px;color:#3a567a}
#tdaZoomBar{height:24px;background:#04070e;border-top:1px solid #1a2640;position:relative;cursor:default;flex-shrink:0}
#tdaZoomTrack{position:absolute;top:3px;bottom:3px;left:48px;right:8px;background:rgba(255,255,255,.03);border-radius:2px}
#tdaZoomWin{position:absolute;top:0;bottom:0;background:rgba(232,121,249,.15);border:1px solid rgba(232,121,249,.4);border-radius:2px;cursor:ew-resize;min-width:8px}
#tdaTimeLbl{position:absolute;left:3px;top:50%;transform:translateY(-50%);font-size:9px;color:#3a567a}
#tdaStatusBar{padding:3px 10px;background:#04070e;border-top:1px solid #1a2640;flex-shrink:0;display:flex;gap:10px;overflow-x:auto;font-size:9px;align-items:center}
.tdaStatChip{display:flex;gap:4px;align-items:center;white-space:nowrap}
.tdaStatChipK{color:#3a567a}
.tdaStatChipV{color:#00d4aa;font-weight:700}
#tdaAiBar{background:#04070e;border-top:2px solid #1a2640;flex-shrink:0;max-height:200px;overflow-y:auto;display:none}
#tdaAiBar.open{display:flex;flex-direction:column}
.tdaAiBody{padding:10px 14px;font-size:11px;color:#8aaabb;line-height:1.8}
.tdaAiBody h4{color:#e879f9;font-size:12px;font-weight:700;margin:8px 0 3px}
.tdaAiBody b{color:#dde8f8}
.tdaAiBody ul{margin:3px 0 8px;padding-left:16px}
.tdaAiBody li{margin-bottom:2px}
#tdaUpload{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;gap:14px;cursor:pointer;padding:20px}
#tdaUpload:hover #tdaDropBox{border-color:#e879f9;background:rgba(232,121,249,.04)}
#tdaDropBox{border:2px dashed #2a4060;border-radius:12px;padding:32px 28px;text-align:center;transition:all .2s;background:#06090f;min-width:300px;max-width:500px}
/* Scatter */
#tdaScatter{flex-shrink:0;border-bottom:2px solid #162030}
.tdaScHdr{display:flex;align-items:center;gap:8px;padding:4px 8px;background:#080c18;border-bottom:1px solid #162030;font-size:10px}
.tdaScDrop{padding:3px 10px;border:1px dashed #2a4060;border-radius:4px;font-size:10px;color:#3a567a;cursor:default;min-width:80px;text-align:center;transition:all .15s}
.tdaScDrop.dragover{border-color:#e879f9;color:#e879f9;background:rgba(232,121,249,.06)}
.tdaScDrop.set{border-color:#4a9eff80;color:#4a9eff;background:#0a1428;cursor:grab}
</style>

<div id="tdaApp">
  <!-- CATEGORY NAV -->
  <div id="tdaCatNav">
    ${(typeof BT_CATS!=='undefined'?BT_CATS:[]).map(c=>`<button class="tdaCatBtn ${c.id==='data_analysis'?'active':''}"
      style="${c.id==='data_analysis'?'border-color:#e879f950;background:#e879f915;color:#e879f9':''}"
      onclick="renderBatteryTesting('${c.id}')">${c.icon} ${c.label}</button>`).join('')}
  </div>

  <!-- PROJECT CONTEXT BAR -->
  <div id="tdaCtxBar">
    <span style="font-size:9px;color:#3a567a;flex-shrink:0">PROJECT →</span>
    ${tdaCtxChips(S)}
    <button onclick="try{switchTopTab('engineering',document.getElementById('ttab-engineering'));showSec('targets',document.querySelector('.nb'))}catch(e){}"
      style="margin-left:auto;padding:2px 8px;background:#1a0d25;border:1px solid #e879f950;color:#e879f9;border-radius:3px;font-size:9px;font-weight:700;cursor:pointer;flex-shrink:0">✏ Edit</button>
  </div>

  <!-- TOOLBAR -->
  <div id="tdaToolbar">
    <button class="tdaBtn hi" onclick="document.getElementById('tdaFileIn').click()">📂 Open</button>
    <input type="file" id="tdaFileIn" accept=".csv,.xlsx,.xls,.txt,.tsv" style="display:none" onchange="tdaLoad(this.files[0])">
    ${has?`<span style="font-size:10px;color:#5a7090">📊 ${t.data.fileName} · ${t.data.nRows.toLocaleString()} rows · ${t.data.headers.length} ch</span>`:''}
    <div class="tdaSep"></div>
    <button class="tdaBtn" onclick="tdaAddPane()" ${!has?'disabled':''}>+ Pane</button>
    <button class="tdaBtn" onclick="tdaAutoLayout()" ${!has?'disabled':''}>⊞ Auto</button>
    <button class="tdaBtn" onclick="tdaResetZoom()" ${!has?'disabled':''}>↔ Full</button>
    <div class="tdaSep"></div>
    <button class="tdaBtn" onclick="tdaRunAI(false)" ${!has?'disabled':''}>🤖 AI Analyse</button>
    <button class="tdaBtn" onclick="tdaRunAI(true)" ${!has?'disabled':''}>🤖 Deep</button>
    <div class="tdaSep"></div>
    <button class="tdaBtn" onclick="tdaExport()" ${!has?'disabled':''}>⬇ Export</button>
    ${has?`<button class="tdaBtn" style="color:#ef4444;margin-left:auto" onclick="tdaClear()">✕ Clear</button>`:''}
  </div>

  <!-- MAIN AREA -->
  <div id="tdaMain">
    <!-- CHARTS -->
    <div id="tdaCharts" onmouseleave="tdaLeaveCursor()">
      ${has ? tdaBuildScatter()+tdaBuildPanes()+`<div class="tdaAddPane" onclick="tdaAddPane()">+ Add Pane — drag channels from browser →</div>` : tdaUploadUI()}
    </div>

    ${has?`<div id="tdaBrowserResize" onmousedown="tdaResizeBrowser(event)"></div>
    <div id="tdaBrowser">
      <div class="tdaBrowserHdr">
        <span style="color:#dde8f8;font-size:11px;font-weight:700">Channel Browser</span>
        <span style="color:#3a567a;font-size:9px">${t.data.headers.length} ch · ${t.wb?t.sheets.length+' sheets':''}</span>
      </div>
      ${t.wb&&t.sheets.length>1?`<div class="tdaSheetTabs">${t.sheets.map(s=>`<div class="tdaSheetTab ${s===t.activeSheet?'active':''}" onclick="tdaSwitchSheet('${s}')">${s}</div>`).join('')}</div>`:''}
      <div id="tdaChanList">${tdaBuildBrowser()}</div>
    </div>`:''}
  </div>

  ${has?`
  <div id="tdaZoomBar" ondragover="event.preventDefault()" ondrop="event.preventDefault()">
    <span id="tdaTimeLbl">Time</span>
    <div id="tdaZoomTrack">
      <div id="tdaZoomWin" style="left:${t.zoomX.x0*100}%;width:${(t.zoomX.x1-t.zoomX.x0)*100}%"
        onmousedown="tdaDragZoom(event)"></div>
    </div>
  </div>
  <div id="tdaStatusBar">${tdaStatusChips()}</div>
  <div id="tdaAiBar" class="${t.aiResult?'open':''}">
    <div style="display:flex;align-items:center;gap:8px;padding:5px 12px;border-bottom:1px solid #1a2640;cursor:pointer;flex-shrink:0" onclick="this.parentElement.classList.toggle('open')">
      <span style="font-size:12px;font-weight:700;color:#e879f9">🤖 AI Analysis</span>
      <input id="tdaCtxIn" onclick="event.stopPropagation()" placeholder="Test context: e.g. cycle 450, 25°C, C/3 discharge…"
        style="flex:1;max-width:380px;padding:3px 8px;background:#0e1828;border:1px solid #1a2640;border-radius:4px;color:#dde8f8;font-size:11px;font-family:var(--mono)">
      <span style="font-size:10px;color:#3a567a;margin-left:auto">▲ collapse</span>
    </div>
    <div class="tdaAiBody" id="tdaAiBody">${t.aiResult||'<span style="color:#3a567a">Run AI Analyse to get engineering interpretation</span>'}</div>
  </div>
  `:''}
</div>`;

  requestAnimationFrame(()=>{ if(has){tdaDrawAll();tdaInitEvents();} });
};

/* ══ PROJECT CHIPS ══ */
function tdaCtxChips(S) {
  const g=id=>{const el=document.getElementById(id);return el?el.value:null;};
  const chip=(k,v)=>`<div class="tdaCC"><span class="tdaCCk">${k}</span><span class="tdaCCv">${v}</span></div>`;
  const chem=g('c_chem')||S.c_chem||'LFP';
  const Ss=S.S_total||112, Pp=S.c_pp||1;
  const vnom=(S.V_nom_pack||400).toFixed(0);
  const vmax=(S.V_max_pack||420).toFixed(0);
  const vmin=(S.V_min_pack||280).toFixed(0);
  const veffhi=(S.V_eff_max||S.V_max_pack||420).toFixed(0);
  const vefflo=(S.V_eff_min||S.V_min_pack||280).toFixed(0);
  const vchi=(S.V_eff_max_cell||S.c_vmax||3.65).toFixed(3);
  const vclo=(S.V_eff_min_cell||S.c_vmin||2.8).toFixed(3);
  const dod=(+(g('t_dod')||S.t_dod||1)*100).toFixed(0);
  const eg=(S.E_gross||43).toFixed(1);
  const eu=(S.E_usable||38).toFixed(1);
  const pp=g('t_ppeak')||S.t_ppeak||80;
  const pc=g('t_pcont')||S.t_pcont||50;
  const ip2=(S.t_ppeak?(S.t_ppeak*1000/(S.V_nom_pack||400)).toFixed(0):'—');
  const tc=g('t_tcell_max')||S.t_tcell_max||55;
  const ah=g('c_ah')||S.c_ah||120;
  const ir=g('c_ir_bol')||S.c_ir_bol||0.22;
  const cyc=g('t_cycles')||S.t_cycles||3000;
  const soh=g('t_soh_eol')||S.t_soh_eol||80;
  const ip=g('t_ip')||S.t_ip||'IP67';
  const mkt=(g('t_markets')||S.markets||'EU').toUpperCase();
  return [chip('Chem',chem),chip('Config',`${Ss}S/${Pp}P`),chip('V_nom',vnom+'V'),
    chip('V_max',vmax+'V'),chip('V_min',vmin+'V'),chip('V_eff_hi',veffhi+'V'),chip('V_eff_lo',vefflo+'V'),
    chip('Vc_eff_hi',vchi+'V'),chip('Vc_eff_lo',vclo+'V'),chip('DoD',dod+'%'),
    chip('E_gross',eg+'kWh'),chip('E_use',eu+'kWh'),chip('P_peak',pp+'kW'),chip('P_cont',pc+'kW'),
    chip('I_peak',ip2+'A'),chip('T_cell',tc+'°C'),chip('Cap',ah+'Ah'),chip('IR_BoL',ir+'mΩ'),
    chip('Cycles',cyc),chip('SoH_EoL',soh+'%'),chip('IP',ip),chip('Markets',mkt)].join('');
}

/* ══ SCATTER GRAPH (free X/Y) ══ */
function tdaBuildScatter() {
  const t=window._tda;
  const xLbl=t.scatterX!=null?(t.data.headers[t.scatterX]||'X'):'Drop X axis';
  const yLbl=t.scatterY!=null?(t.data.headers[t.scatterY]||'Y'):'Drop Y axis';
  return `<div id="tdaScatter" style="height:${t.scatterH||220}px">
    <div class="tdaScHdr">
      <span style="color:#dde8f8;font-weight:700">📊 XY Scatter / Curve</span>
      <span style="color:#3a567a;font-size:9px">Drag any channel from browser to X or Y axis below</span>
      <span class="tdaScDrop ${t.scatterX!=null?'set':''}" id="scX"
        ondragover="event.preventDefault();this.classList.add('dragover')"
        ondragleave="this.classList.remove('dragover')"
        ondrop="event.preventDefault();this.classList.remove('dragover');tdaSetAxis('x',+event.dataTransfer.getData('tdaCI'))"
        title="Drop channel here for X axis"
        ${t.scatterX!=null?`ondblclick="window._tda.scatterX=null;renderDataAnalysis()"`:''}>
        X: ${xLbl}${t.scatterX!=null?' ✕':''}
      </span>
      <span style="color:#3a567a">vs</span>
      <span class="tdaScDrop ${t.scatterY!=null?'set':''}" id="scY"
        ondragover="event.preventDefault();this.classList.add('dragover')"
        ondragleave="this.classList.remove('dragover')"
        ondrop="event.preventDefault();this.classList.remove('dragover');tdaSetAxis('y',+event.dataTransfer.getData('tdaCI'))"
        title="Drop channel here for Y axis"
        ${t.scatterY!=null?`ondblclick="window._tda.scatterY=null;renderDataAnalysis()"`:''}>
        Y: ${yLbl}${t.scatterY!=null?' ✕':''}
      </span>
      <button class="tdaBtn" onclick="window._tda.scatterX=null;window._tda.scatterY=null;renderDataAnalysis()" style="font-size:9px;padding:1px 6px">Clear</button>
      <button class="tdaBtn" onclick="tdaResizeScatter(30)" style="font-size:9px;padding:1px 6px">+</button>
      <button class="tdaBtn" onclick="tdaResizeScatter(-30)" style="font-size:9px;padding:1px 6px">−</button>
    </div>
    <div id="tdaScatterResizeHandle" class="tdaResizeHandle" onmousedown="tdaResizePane2('tdaScatter',event)"></div>
    <canvas id="tdaScCanvas" style="width:100%;height:${(t.scatterH||220)-52}px;display:block;background:#04070e;cursor:crosshair"></canvas>
  </div>`;
}

/* ══ BUILD PANES ══ */
function tdaBuildPanes() {
  const t=window._tda;
  return t.panes.map(p=>{
    const sigs=p.signals||[];
    const usedSet=new Set(t.panes.flatMap(p=>p.signals||[]));
    const statsHtml=tdaPaneStatsHtml(p);
    const sigLabels=sigs.map((ci,i)=>`<span style="color:${tc(ci)};font-size:9px;margin-right:6px">●${t.data.headers[ci]||ci}</span>`).join('');
    return `<div class="tdaPane" id="pane_${p.id}" style="height:${p.h||200}px"
      ondragover="event.preventDefault();this.classList.add('dragover')"
      ondragleave="this.classList.remove('dragover')"
      ondrop="event.preventDefault();this.classList.remove('dragover');tdaDropPane('${p.id}',event)">
      <div class="tdaPaneHdr">
        <span class="tdaPaneTitle">${p.label||'Pane'}</span>
        <span style="font-size:9px;color:#3a567a">${sigLabels}</span>
        <span class="tdaReadout" id="ro_${p.id}">—</span>
        <span class="tdaPaneBtn" onclick="tdaResizeH('${p.id}',-40)" title="Shrink">−</span>
        <span class="tdaPaneBtn" onclick="tdaResizeH('${p.id}',40)" title="Grow">+</span>
        <span class="tdaPaneBtn" style="color:#ef4444" onclick="tdaRemovePane('${p.id}')" title="Close">✕</span>
      </div>
      <div class="tdaResizeHandle" onmousedown="tdaResizePane2('pane_${p.id}',event)"></div>
      ${statsHtml}
      <canvas id="cv_${p.id}" style="width:100%;height:${(p.h||200)-52}px;display:block;cursor:crosshair"
        onmousemove="tdaMoveCursor(event,'${p.id}')"
        onmousedown="tdaPanStart(event,'${p.id}')"
        onwheel="tdaWheel(event,'${p.id}')"></canvas>
    </div>`;
  }).join('');
}

/* ══ PER-PANE STATS ══ */
function tdaPaneStatsHtml(p) {
  const t=window._tda;
  const rows=t.data?.rows||[];
  const {x0,x1}=t.zoomX;
  const N=rows.length;
  const i0=Math.floor(x0*N), i1=Math.ceil(x1*N);
  const slice=rows.slice(i0,i1);
  if(!slice.length||!p.signals?.length) return '<div class="tdaPaneStats"><span class="tdaStat"><span class="tdaStatK">no data</span></span></div>';
  const allStats=p.signals.map(ci=>{
    const vals=slice.map(r=>+r[ci]).filter(v=>!isNaN(v));
    if(!vals.length) return null;
    const mn=Math.min(...vals),mx=Math.max(...vals),mean=vals.reduce((a,b)=>a+b)/vals.length;
    const rms=Math.sqrt(vals.reduce((a,b)=>a+b*b,0)/vals.length);
    const std=Math.sqrt(vals.reduce((a,b)=>a+(b-mean)**2,0)/vals.length);
    const S2=window.S||{};
    // Check against project spec
    let specOk=null;
    const hl=(t.data.headers[ci]||'').toLowerCase();
    if(/volt|vpack|vcell/.test(hl)&&S2.V_max_pack) specOk=mx<=S2.V_max_pack;
    if(/temp|tc|cell_t/.test(hl)&&S2.t_tcell_max) specOk=mx<=S2.t_tcell_max;
    const specCol=specOk===null?'#5a7090':specOk?'#00d4aa':'#ef4444';
    return {ci,mn,mx,mean,rms,std,specOk,specCol,name:t.data.headers[ci]||'ch'+ci};
  }).filter(Boolean);

  if(!allStats.length) return '<div class="tdaPaneStats"></div>';
  const html=allStats.map(s=>`
    <span class="tdaStat" style="border-right:1px solid #0e1828;padding-right:8px;margin-right:2px">
      <span style="color:${tc(s.ci)};font-weight:700">${s.name.length>10?s.name.slice(0,10)+'…':s.name}</span>
      <span class="tdaStatK">min</span><span class="tdaStatV" style="color:${s.specOk===false&&s.mn<(window.S?.V_min_pack||0)?'#ef4444':'#00d4aa'}">${s.mn.toFixed(2)}</span>
      <span class="tdaStatK">max</span><span class="tdaStatV" style="color:${s.specCol}">${s.mx.toFixed(2)}</span>
      <span class="tdaStatK">avg</span><span class="tdaStatV" style="color:#f5c518">${s.mean.toFixed(2)}</span>
      <span class="tdaStatK">rms</span><span class="tdaStatV" style="color:#a78bfa">${s.rms.toFixed(2)}</span>
      <span class="tdaStatK">σ</span><span class="tdaStatV" style="color:#5a7090">${s.std.toFixed(3)}</span>
    </span>`).join('');
  return `<div class="tdaPaneStats">${html}</div>`;
}

/* ══ CHANNEL BROWSER ══ */
function tdaBuildBrowser() {
  const t=window._tda;
  if(!t.data) return '';
  const cm=t.data.colMap;
  const rows=t.data.rows;
  const usedCols=new Set(t.panes.flatMap(p=>p.signals||[]));
  const grps={Voltage:[],Current:[],Temperature:[],SOC_SOH:[],Power:[],Capacity:[],Other:[]};
  t.data.headers.forEach((h,ci)=>{
    if(ci===(cm?.t)) return;
    const hl=h.toLowerCase();
    const samp=rows.slice(0,50).map(r=>+r[ci]).filter(v=>!isNaN(v));
    const mn=samp.length?Math.min(...samp):0, mx=samp.length?Math.max(...samp):0;
    const ch={ci,h,mn,mx};
    if(/volt|vcell|vpack|v_/.test(hl)) grps.Voltage.push(ch);
    else if(/curr|amp|i_|ipack/.test(hl)) grps.Current.push(ch);
    else if(/temp|deg|tc|therm|cool|ambient/.test(hl)) grps.Temperature.push(ch);
    else if(/soc|soh|state/.test(hl)) grps.SOC_SOH.push(ch);
    else if(/power|watt|kw/.test(hl)) grps.Power.push(ch);
    else if(/cap|ah|charge|energy/.test(hl)) grps.Capacity.push(ch);
    else grps.Other.push(ch);
  });
  return Object.entries(grps).filter(([,v])=>v.length).map(([g,chs])=>`
    <div class="tdaGrpHdr">${g} (${chs.length})</div>
    ${chs.map(ch=>`<div class="tdaChanItem ${usedCols.has(ch.ci)?'inUse':''}" draggable="true"
      id="chi_${ch.ci}"
      ondragstart="event.dataTransfer.setData('tdaCI','${ch.ci}');this.style.opacity='.4'"
      ondragend="this.style.opacity='1'"
      ondblclick="tdaDblChan(${ch.ci})"
      title="Drag to pane or scatter axis · Double-click to add to first pane">
      <div class="tdaChanDot" style="background:${tc(ch.ci)}"></div>
      <div>
        <div class="tdaChanName" title="${ch.h}">${ch.h}</div>
        <div class="tdaChanStat">${ch.mn.toFixed(2)} → ${ch.mx.toFixed(2)}</div>
      </div>
    </div>`).join('')}`).join('');
}

/* ══ STATUS BAR ══ */
function tdaStatusChips() {
  const t=window._tda; if(!t.data) return '';
  const cm=t.data.colMap; const rows=t.data.rows; const N=rows.length;
  const col=ci=>ci!=null?rows.map(r=>+r[ci]).filter(v=>!isNaN(v)):[];
  const chips=[];
  if(cm.t!=null){const ts=col(cm.t);const d=ts[ts.length-1]-ts[0];chips.push(['Dur',d>3600?(d/3600).toFixed(2)+'h':(d/60).toFixed(0)+'min']);}
  if(cm.v_pack!=null){const v=col(cm.v_pack);chips.push(['V_pack',Math.min(...v).toFixed(1)+'–'+Math.max(...v).toFixed(1)+'V']);}
  if(cm.v_cells?.length>1){
    const spreads=rows.map((_,ri)=>{const vs=cm.v_cells.map(ci=>+rows[ri][ci]).filter(v=>!isNaN(v)&&v>0);return vs.length>1?Math.max(...vs)-Math.min(...vs):0;}).filter(v=>v>0);
    chips.push(['ΔV_cell',(Math.max(...spreads)*1000).toFixed(0)+'mV']);
  }
  if(cm.t_cells?.length>0){const ta=cm.t_cells.flatMap(ci=>col(ci));chips.push(['T_max',Math.max(...ta).toFixed(1)+'°C']);}
  if(cm.soc!=null){const s=col(cm.soc);chips.push(['SOC',Math.min(...s).toFixed(0)+'–'+Math.max(...s).toFixed(0)+'%']);}
  chips.push(['Rows',t.data.nRows.toLocaleString()],['Ch',t.data.headers.length]);
  return chips.map(([k,v])=>`<div class="tdaStatChip"><span class="tdaStatChipK">${k}</span><span class="tdaStatChipV">${v}</span></div>`).join('');
}

/* ══ UPLOAD UI ══ */
function tdaUploadUI() {
  return `<div id="tdaUpload"
    ondragover="event.preventDefault();document.getElementById('tdaDropBox').style.borderColor='#e879f9'"
    ondragleave="document.getElementById('tdaDropBox').style.borderColor='#2a4060'"
    ondrop="event.preventDefault();document.getElementById('tdaDropBox').style.borderColor='#2a4060';tdaLoad(event.dataTransfer.files[0])"
    onclick="document.getElementById('tdaFileIn').click()">
    <div id="tdaDropBox">
      <div style="font-size:40px;margin-bottom:10px">📊</div>
      <div style="font-size:14px;font-weight:700;color:#dde8f8;margin-bottom:6px">Drop test log here or click to open</div>
      <div style="font-size:11px;color:#3a567a;line-height:1.8">CSV · Excel (.xlsx — all sheets shown) · TSV · BMS log<br>Cycler: Arbin · Bitrode · Maccor · AVL · CAN log</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:480px">
      ${[['📈','Multi-Pane Charts','Synchronized cursors'],['🔀','Free X/Y Axis','Drag any channel'],['📋','All Excel Sheets','Sheet browser panel'],
         ['📊','Per-Pane Stats','Min/max/avg/rms/σ'],['🎯','Project Limits','Auto spec lines'],['🤖','AI Analysis','vs project targets']
      ].map(([i,t2,d])=>`<div style="background:rgba(255,255,255,.02);border:1px solid #1a2640;border-radius:7px;padding:10px;text-align:center">
        <div style="font-size:18px;margin-bottom:3px">${i}</div><div style="font-size:11px;font-weight:700;color:#8aaabb">${t2}</div>
        <div style="font-size:9px;color:#3a567a;margin-top:2px">${d}</div></div>`).join('')}
    </div>
  </div>`;
}

/* ══ INIT PANES ══ */
function tdaInitPanes() {
  const t=window._tda; const cm=t.data.colMap;
  t.panes=[]; t.zoomX={x0:0,x1:1}; t.cursor=null; t.scatterX=null; t.scatterY=null;
  const vSig=[cm.v_pack,...(cm.v_cells||[]).slice(0,4)].filter(v=>v!=null);
  if(vSig.length) t.panes.push({id:'pV',label:'Voltage (V)',signals:vSig,h:210});
  if(cm.i_pack!=null) t.panes.push({id:'pI',label:'Current (A)',signals:[cm.i_pack],h:170});
  const tSig=[...(cm.t_cells||[]).slice(0,6),cm.temp_amb,cm.temp_cool_in,cm.temp_cool_out].filter(v=>v!=null);
  if(tSig.length) t.panes.push({id:'pT',label:'Temperature (°C)',signals:tSig,h:190});
  if(cm.soc!=null) t.panes.push({id:'pS',label:'SOC (%)',signals:[cm.soc],h:150});
  else if(cm.p_pack!=null) t.panes.push({id:'pP',label:'Power (kW)',signals:[cm.p_pack],h:150});
  if(!t.panes.length&&t.data.headers.length>1) t.panes.push({id:'p0',label:t.data.headers[1],signals:[1],h:200});
  // Default scatter: Time vs Voltage
  if(cm.t!=null&&cm.v_pack!=null){t.scatterX=cm.t;t.scatterY=cm.v_pack;}
}

/* ══ CHART DRAWING ══ */
function tdaDrawAll() {
  window._tda.panes.forEach(p=>tdaDrawPane(p));
  tdaDrawScatter();
}

function tdaDrawPane(p) {
  const t=window._tda; const cv=document.getElementById('cv_'+p.id);
  if(!cv) return;
  const W=cv.parentElement?.offsetWidth||700;
  const H=Math.max(40, (p.h||200)-52);
  cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d');
  const pad={l:52,r:12,t:8,b:22};
  const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;
  const rows=t.data.rows; const N=rows.length;
  const {x0,x1}=t.zoomX;
  const i0=Math.floor(x0*N), i1=Math.ceil(x1*N);
  const slice=rows.slice(i0,i1);
  if(!slice.length||!p.signals?.length){ctx.fillStyle='#04070e';ctx.fillRect(0,0,W,H);return;}

  // Y range
  let ymin=Infinity,ymax=-Infinity;
  p.signals.forEach(ci=>slice.forEach(r=>{const v=+r[ci];if(!isNaN(v)){if(v<ymin)ymin=v;if(v>ymax)ymax=v;}}));
  if(!isFinite(ymin)||ymin===ymax){ymin=(ymin||0)-1;ymax=(ymax||1)+1;}
  const ypad=(ymax-ymin)*0.07; ymin-=ypad; ymax+=ypad;

  const mx=fi=>pad.l+(fi/(Math.max(1,slice.length-1)))*pw;
  const my=v=>pad.t+ph*(1-(v-ymin)/(ymax-ymin));
  const cm2=t.data.colMap;

  ctx.fillStyle='#04070e'; ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='rgba(255,255,255,.035)'; ctx.lineWidth=1;
  [0,.25,.5,.75,1].forEach(f=>{
    const y=pad.t+ph*f;
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    const val=ymax-(ymax-ymin)*f;
    ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';
    ctx.fillText(Math.abs(val)>=100?val.toFixed(1):val.toFixed(2),pad.l-2,y+3);
  });
  const xSteps=6;
  [0,...Array.from({length:xSteps-1},(_,i)=>(i+1)/xSteps),1].forEach(f=>{
    const x=pad.l+f*pw;
    ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();
    if(cm2.t!=null){const ri=Math.floor(f*(slice.length-1));const tv=+slice[ri]?.[cm2.t]||0;const lbl=tv>=3600?(tv/3600).toFixed(2)+'h':tv>=60?(tv/60).toFixed(1)+'m':tv.toFixed(0)+'s';ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='center';ctx.fillText(lbl,x,H-pad.b+12);}
  });

  // Spec lines from project
  tdaSpecLines(p,ymin,ymax).forEach(sl=>{
    const y=my(sl.v); if(y<pad.t||y>H-pad.b) return;
    ctx.strokeStyle=sl.c;ctx.lineWidth=1.2;ctx.setLineDash([4,4]);
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    ctx.setLineDash([]);ctx.fillStyle=sl.c;ctx.font='8px JetBrains Mono,monospace';ctx.textAlign='right';
    ctx.fillText(sl.lbl,W-pad.r-2,y-2);
  });

  // Signal lines
  const step=Math.max(1,Math.floor(slice.length/Math.min(pw*2,3000)));
  p.signals.forEach(ci=>{
    ctx.beginPath();ctx.strokeStyle=tc(ci);ctx.lineWidth=1.6;let fst=true;
    for(let i=0;i<slice.length;i+=step){
      const v=+slice[i][ci]; if(isNaN(v)){fst=true;continue;}
      const x=mx(i),y=my(v);
      fst?ctx.moveTo(x,y):ctx.lineTo(x,y);fst=false;
    }
    ctx.stroke();
    ctx.fillStyle=tc(ci);ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='left';
    ctx.fillText(t.data.headers[ci]?.slice(0,18)||'ch'+ci,pad.l+4,pad.t+12+p.signals.indexOf(ci)*12);
  });

  // Cursor
  if(t.cursor!=null){
    const cx=pad.l+t.cursor*pw;
    ctx.strokeStyle='rgba(232,121,249,.6)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(cx,pad.t);ctx.lineTo(cx,H-pad.b);ctx.stroke();ctx.setLineDash([]);
    const ri=Math.floor(t.cursor*(slice.length-1));
    const ro=p.signals.map(ci=>{const v=+slice[ri]?.[ci];return isNaN(v)?null:`${t.data.headers[ci]?.slice(0,12)||ci}=${v.toFixed(3)}`;}).filter(Boolean);
    const tVal=cm2.t!=null?(+slice[ri]?.[cm2.t]||0):ri;
    const tLbl=tVal>=3600?(tVal/3600).toFixed(3)+'h':tVal>=60?(tVal/60).toFixed(2)+'m':tVal.toFixed(1)+'s';
    const rdEl=document.getElementById('ro_'+p.id);
    if(rdEl) rdEl.textContent=`t=${tLbl}  ${ro.join('  ')}`;
  }
}

/* ══ SCATTER DRAW ══ */
function tdaDrawScatter() {
  const t=window._tda; const cv=document.getElementById('tdaScCanvas');
  if(!cv||!t.data) return;
  const W=cv.parentElement?.offsetWidth||700;
  const H=cv.offsetHeight||168;
  cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#04070e'; ctx.fillRect(0,0,W,H);
  if(t.scatterX==null||t.scatterY==null){
    ctx.fillStyle='#3a567a';ctx.font='12px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText('Drop channels on X and Y axis above to create scatter plot',W/2,H/2);
    return;
  }
  const rows=t.data.rows; const N=rows.length;
  const {x0,x1}=t.zoomX;
  const i0=Math.floor(x0*N),i1=Math.ceil(x1*N);
  const slice=rows.slice(i0,i1);
  const xs=slice.map(r=>+r[t.scatterX]).filter(v=>!isNaN(v));
  const ys=slice.map(r=>+r[t.scatterY]).filter(v=>!isNaN(v));
  if(!xs.length||!ys.length) return;
  const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const xp=(xmax-xmin)*0.05,yp=(ymax-ymin)*0.05;
  const pad={l:52,r:12,t:10,b:24};
  const pw=W-pad.l-pad.r,ph=H-pad.t-pad.b;
  const mx=v=>pad.l+(v-(xmin-xp))/((xmax+xp)-(xmin-xp))*pw;
  const my=v=>pad.t+ph*(1-(v-(ymin-yp))/((ymax+yp)-(ymin-yp)));

  // Grid
  ctx.strokeStyle='rgba(255,255,255,.03)';ctx.lineWidth=1;
  [0,.25,.5,.75,1].forEach(f=>{
    const y=pad.t+ph*f,x=pad.l+pw*f;
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();
  });

  // Spec lines
  const S2=window.S||{};
  const yHdr=(t.data.headers[t.scatterY]||'').toLowerCase();
  if(/volt/.test(yHdr)){
    [[S2.V_max_pack,'rgba(255,77,109,.4)','V_max'],[S2.V_min_pack,'rgba(245,197,24,.4)','V_min'],
     [S2.V_eff_max,'rgba(74,158,255,.3)','V_eff_hi'],[S2.V_eff_min,'rgba(74,158,255,.3)','V_eff_lo']].forEach(([v,c,l])=>{
      if(!v) return; const y=my(v); if(y<pad.t||y>H-pad.b) return;
      ctx.strokeStyle=c;ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=c;ctx.font='8px JetBrains Mono,monospace';ctx.textAlign='right';ctx.fillText(l+' '+v.toFixed(0)+'V',W-pad.r-2,y-2);
    });
  }

  // Points/line
  const step=Math.max(1,Math.floor(slice.length/2000));
  ctx.strokeStyle=tc(t.scatterY);ctx.lineWidth=1.5;ctx.beginPath();let fst=true;
  for(let i=0;i<slice.length;i+=step){
    const x=+slice[i][t.scatterX],y=+slice[i][t.scatterY];
    if(isNaN(x)||isNaN(y)){fst=true;continue;}
    fst?ctx.moveTo(mx(x),my(y)):ctx.lineTo(mx(x),my(y));fst=false;
  }
  ctx.stroke();

  // Axis labels
  ctx.fillStyle='#5a7090';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='center';
  ctx.fillText(t.data.headers[t.scatterX]||'X',pad.l+pw/2,H-3);
  ctx.save();ctx.translate(10,pad.t+ph/2);ctx.rotate(-Math.PI/2);ctx.textAlign='center';
  ctx.fillText(t.data.headers[t.scatterY]||'Y',0,0);ctx.restore();
}

/* ══ SPEC LINES ══ */
function tdaSpecLines(p,ymin,ymax) {
  const S2=window.S||{};
  const lb=p.label?.toLowerCase()||'';
  const lines=[];
  if(/volt/.test(lb)){
    if(S2.V_max_pack) lines.push({v:S2.V_max_pack,c:'rgba(255,77,109,.5)',lbl:'V_max '+S2.V_max_pack.toFixed(0)+'V'});
    if(S2.V_min_pack) lines.push({v:S2.V_min_pack,c:'rgba(245,197,24,.4)',lbl:'V_min '+S2.V_min_pack.toFixed(0)+'V'});
    if(S2.V_eff_max&&S2.V_eff_max!==S2.V_max_pack) lines.push({v:S2.V_eff_max,c:'rgba(74,158,255,.4)',lbl:'V_eff_hi'});
    if(S2.V_eff_min&&S2.V_eff_min!==S2.V_min_pack) lines.push({v:S2.V_eff_min,c:'rgba(74,158,255,.4)',lbl:'V_eff_lo'});
  }
  if(/temp/.test(lb)){
    if(S2.t_tcell_max) lines.push({v:S2.t_tcell_max,c:'rgba(255,77,109,.5)',lbl:'T_limit'});
    if(S2.t_tcell_max) lines.push({v:S2.t_tcell_max-10,c:'rgba(245,197,24,.4)',lbl:'T_derate'});
  }
  if(/soc/.test(lb)){
    lines.push({v:100,c:'rgba(74,158,255,.3)',lbl:'100%'});
    if(S2.t_dod) lines.push({v:(1-S2.t_dod)*100,c:'rgba(245,197,24,.4)',lbl:'SoC_floor'});
  }
  if(/curr/.test(lb)){
    lines.push({v:0,c:'rgba(255,255,255,.15)',lbl:'0A'});
    if(S2.t_ppeak&&S2.V_nom_pack) lines.push({v:S2.t_ppeak*1000/S2.V_nom_pack,c:'rgba(255,123,53,.4)',lbl:'I_peak'});
  }
  return lines.filter(l=>l.v>=ymin&&l.v<=ymax);
}

/* ══ INTERACTIONS ══ */
function tdaInitEvents() {
  // All events are inline — nothing extra needed
}

window.tdaMoveCursor = function(e,paneId) {
  const cv=document.getElementById('cv_'+paneId); if(!cv) return;
  const rect=cv.getBoundingClientRect();
  const frac=Math.max(0,Math.min(1,(e.clientX-rect.left-52)/(rect.width-64)));
  window._tda.cursor=frac;
  window._tda.panes.forEach(p=>tdaDrawPane(p));
};

window.tdaLeaveCursor = function() {
  window._tda.cursor=null;
  window._tda.panes.forEach(p=>{tdaDrawPane(p);const el=document.getElementById('ro_'+p.id);if(el)el.textContent='—';});
};

let _pan=null;
window.tdaPanStart = function(e,paneId) {
  if(e.button!==0) return;
  const cv=document.getElementById('cv_'+paneId);
  const rect=cv.getBoundingClientRect();
  const t=window._tda;
  _pan={sx:e.clientX,sz:{...t.zoomX},w:rect.width};
  const mm=e2=>{if(!_pan) return;const dx=(e2.clientX-_pan.sx)/_pan.w;const sp=_pan.sz.x1-_pan.sz.x0;let x0=_pan.sz.x0-dx,x1=_pan.sz.x1-dx;if(x0<0){x1-=x0;x0=0;}if(x1>1){x0-=x1-1;x1=1;}t.zoomX={x0,x1};tdaUpdateZoomBar();tdaDrawAll();};
  const mu=()=>{_pan=null;document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
};

window.tdaWheel = function(e,paneId) {
  e.preventDefault();
  const cv=document.getElementById('cv_'+paneId);
  const rect=cv.getBoundingClientRect();
  const frac=(e.clientX-rect.left-52)/(rect.width-64);
  const t=window._tda; const sp=t.zoomX.x1-t.zoomX.x0;
  const factor=e.deltaY>0?1.25:0.8;
  const ns=Math.max(0.01,Math.min(1,sp*factor));
  const c=t.zoomX.x0+frac*sp;
  let x0=c-frac*ns,x1=c+(1-frac)*ns;
  if(x0<0){x1-=x0;x0=0;}if(x1>1){x0-=x1-1;x1=1;}
  t.zoomX={x0,x1};tdaUpdateZoomBar();tdaDrawAll();
};

function tdaUpdateZoomBar() {
  const zw=document.getElementById('tdaZoomWin'); if(!zw) return;
  const {x0,x1}=window._tda.zoomX;
  zw.style.left=x0*100+'%'; zw.style.width=Math.max(0.5,(x1-x0)*100)+'%';
}

window.tdaDragZoom = function(e) {
  const t=window._tda; const track=document.getElementById('tdaZoomTrack'); if(!track) return;
  const rect=track.getBoundingClientRect(); const sp=t.zoomX.x1-t.zoomX.x0; const sx=e.clientX,sx0=t.zoomX.x0;
  const mm=e2=>{const dx=(e2.clientX-sx)/rect.width;let x0=sx0+dx,x1=x0+sp;if(x0<0){x0=0;x1=sp;}if(x1>1){x1=1;x0=1-sp;}t.zoomX={x0,x1};tdaUpdateZoomBar();tdaDrawAll();};
  const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
};

/* ══ PANE MANAGEMENT ══ */
window.tdaAddPane=function(){const id='p'+Date.now();window._tda.panes.push({id,label:'New Pane',signals:[],h:180});renderDataAnalysis();};
window.tdaRemovePane=function(id){window._tda.panes=window._tda.panes.filter(p=>p.id!==id);renderDataAnalysis();};
window.tdaResizeH=function(id,d){const p=window._tda.panes.find(p=>p.id===id);if(p){p.h=Math.max(80,Math.min(700,(p.h||200)+d));const el=document.getElementById('pane_'+id);if(el)el.style.height=p.h+'px';const cv=document.getElementById('cv_'+id);if(cv)cv.style.height=(p.h-52)+'px';tdaDrawPane(p);}};
window.tdaResizePane2=function(elId,e){
  const el=document.getElementById(elId); if(!el) return;
  const sy=e.clientY, sh=el.offsetHeight;
  const mm=e2=>{const h=Math.max(80,sh+(e2.clientY-sy));el.style.height=h+'px';const p=window._tda.panes.find(p=>'pane_'+p.id===elId);if(p){p.h=h;const cv=document.getElementById('cv_'+p.id);if(cv){cv.style.height=(h-52)+'px';tdaDrawPane(p);}}if(elId==='tdaScatter'){window._tda.scatterH=h;const cv=document.getElementById('tdaScCanvas');if(cv){cv.style.height=(h-52)+'px';tdaDrawScatter();}}};
  const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
};
window.tdaResizeScatter=function(d){const t=window._tda;t.scatterH=Math.max(120,Math.min(500,(t.scatterH||220)+d));renderDataAnalysis();};
window.tdaAutoLayout=function(){const t=window._tda;if(!t.data) return;tdaInitPanes();renderDataAnalysis();};
window.tdaResetZoom=function(){window._tda.zoomX={x0:0,x1:1};tdaUpdateZoomBar();tdaDrawAll();};
window.tdaDropPane=function(paneId,e){const ci=parseInt(e.dataTransfer.getData('tdaCI'));const p=window._tda.panes.find(p=>p.id===paneId);if(p&&!isNaN(ci)&&!p.signals.includes(ci)){p.signals.push(ci);p.label=window._tda.data.headers[p.signals[0]]||p.label;renderDataAnalysis();}};
window.tdaSetAxis=function(axis,ci){if(axis==='x')window._tda.scatterX=ci;else window._tda.scatterY=ci;renderDataAnalysis();};
window.tdaDblChan=function(ci){const t=window._tda;if(!t.panes.length){tdaAddPane();return;}const p=t.panes[0];if(!p.signals.includes(ci)){p.signals.push(ci);renderDataAnalysis();}};
window.tdaResizeBrowser=function(e){const b=document.getElementById('tdaBrowser');if(!b) return;const sx=e.clientX,sw=b.offsetWidth;const mm=e2=>{b.style.width=Math.max(160,Math.min(500,sw-(e2.clientX-sx)))+'px';};const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);};

/* ══ MULTI-SHEET EXCEL ══ */
window.tdaSwitchSheet=function(sheetName){
  const t=window._tda;
  if(!t.wb||!t.wb.Sheets[sheetName]) return;
  t.activeSheet=sheetName;
  const rows=XLSX.utils.sheet_to_json(t.wb.Sheets[sheetName],{header:1,defval:''});
  const hdr=rows[0]?rows[0].map((h,i)=>String(h).trim()||'Col'+i):[];
  const dataRows=rows.slice(1).filter(r=>r.some(v=>!isNaN(parseFloat(v))&&v!==''));
  const parsed=dataRows.map(r=>r.map(v=>{const n=parseFloat(v);return isNaN(n)?v:n;}));
  t.data={...t.data,headers:hdr,rows:parsed,nRows:parsed.length,colMap:tdaDetectCols(hdr)};
  t.panes=[]; t.scatterX=null; t.scatterY=null;
  tdaInitPanes();
  renderDataAnalysis();
};

/* ══ FILE LOADING ══ */
window.tdaLoad=function(file){
  if(!file) return;
  const ext=file.name.split('.').pop().toLowerCase();
  const run=()=>{
    if(ext==='csv'||ext==='txt'||ext==='tsv'){
      const r=new FileReader();
      r.onload=e=>tdaParseCSV(e.target.result,file.name);
      r.readAsText(file);
    } else {
      const r=new FileReader();
      r.onload=e=>{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
        window._tda.wb=wb;
        window._tda.sheets=wb.SheetNames;
        const first=wb.SheetNames[0];
        window._tda.activeSheet=first;
        const rows=XLSX.utils.sheet_to_json(wb.Sheets[first],{header:1,defval:''});
        const hdr=rows[0]?rows[0].map((h,i)=>String(h).trim()||'Col'+i):[];
        const dataRows=rows.slice(1).filter(r=>r.some(v=>!isNaN(parseFloat(v))&&v!==''));
        const parsed=dataRows.map(r=>r.map(v=>{const n=parseFloat(v);return isNaN(n)?v:n;}));
        const colMap=tdaDetectCols(hdr);
        window._tda.data={headers:hdr,rows:parsed,fileName:file.name,nRows:parsed.length,colMap};
        window._tda.panes=[]; window._tda.scatterX=null; window._tda.scatterY=null;
        tdaInitPanes(); renderDataAnalysis();
      };
      r.readAsArrayBuffer(file);
    }
  };
  if((ext==='xlsx'||ext==='xls')&&typeof XLSX==='undefined'){
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=run;document.head.appendChild(s);
  } else run();
};

function tdaParseCSV(text,fileName) {
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const delim=lines[0].includes('\t')?'\t':lines[0].includes(';')?';':',';
  const hasH=isNaN(parseFloat(lines[0].split(delim)[0].trim()));
  const hdr=hasH?lines[0].split(delim).map(h=>h.trim()):lines[0].split(delim).map((_,i)=>'Col'+i);
  const rows=lines.slice(hasH?1:0).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>l.split(delim).map(v=>{const n=parseFloat(v);return isNaN(n)?v:n;}));
  const colMap=tdaDetectCols(hdr);
  window._tda={...window._tda,wb:null,sheets:[],activeSheet:'',data:{headers:hdr,rows,fileName,nRows:rows.length,colMap},panes:[],scatterX:null,scatterY:null};
  tdaInitPanes(); renderDataAnalysis();
}

function tdaDetectCols(hdr) {
  const hl=hdr.map(h=>h.toLowerCase().replace(/[^a-z0-9_]/g,''));
  const f=(...keys)=>{for(const k of keys){const i=hl.findIndex(h=>h.includes(k));if(i>=0) return i;}return null;};
  const fAll=(...keys)=>hl.reduce((a,h,i)=>{if(keys.some(k=>h.includes(k))) a.push(i);return a;},[]);
  return {t:f('time','timestamp','elapsed','tsec','t_s'),v_pack:f('vpack','v_bat','packvolt','voltage','volt'),
    i_pack:f('ipack','current','ibat','amp'),p_pack:f('power','watt','kw'),soc:f('soc','stateofcharge'),
    temp_amb:f('tamb','ambient'),temp_cool_in:f('tcool_in','coolant_in','tinlet'),temp_cool_out:f('tcool_out','coolant_out','toutlet'),
    v_cells:fAll('vcell','cell_v','v_cell'),t_cells:fAll('tcell','cell_t','t_cell','temp_cell')};
}

/* ══ AI ANALYSIS ══ */
window.tdaRunAI=async function(deep=false){
  const t=window._tda; if(!t.data){alert('Upload data first');return;}
  const aiBar=document.getElementById('tdaAiBar'); const aiBody=document.getElementById('tdaAiBody');
  if(aiBar) aiBar.className='open';
  if(aiBody) aiBody.innerHTML='<span style="color:#3a567a">⚙️ Analysing all pane data vs project targets…</span>';
  const S2=window.S||{}; const g2=id=>{const el=document.getElementById(id);return el?el.value:null;};
  const cm=t.data.colMap; const rows=t.data.rows; const N=rows.length;
  const {x0,x1}=t.zoomX; const i0=Math.floor(x0*N),i1=Math.ceil(x1*N);
  const slice=rows.slice(i0,i1);
  const col=ci=>ci!=null?slice.map(r=>+r[ci]).filter(v=>!isNaN(v)):[];
  const st=arr=>{if(!arr.length) return null;const mn=Math.min(...arr),mx=Math.max(...arr),mean=arr.reduce((a,b)=>a+b)/arr.length;return{min:mn.toFixed(3),max:mx.toFixed(3),mean:mean.toFixed(3)}};
  // Build per-pane data
  const paneData=t.panes.map(p=>({pane:p.label,signals:p.signals.map(ci=>({ch:t.data.headers[ci],stats:st(col(ci))}))}));
  const prompt=`You are a senior EV battery data analysis engineer. Analyse this test data and compare against project targets.

PROJECT TARGETS:
Chem=${g2('c_chem')||S2.c_chem||'LFP'}, Config=${S2.S_total||112}S/${S2.c_pp||1}P
V_nom=${S2.V_nom_pack?.toFixed(0)||358}V, V_max=${S2.V_max_pack?.toFixed(0)||420}V, V_min=${S2.V_min_pack?.toFixed(0)||280}V
V_eff_max=${S2.V_eff_max?.toFixed(1)||'N/A'}V, V_eff_min=${S2.V_eff_min?.toFixed(1)||'N/A'}V (DoD-derived)
V_cell_max=${S2.c_vmax||3.65}V, V_cell_min=${S2.c_vmin||2.8}V, Cap=${S2.c_ah||120}Ah, IR_BoL=${S2.c_ir_bol||0.22}mΩ
T_cell_max=${S2.t_tcell_max||55}°C, T_op=${S2.t_top_lo||'-20'}→${S2.t_top_hi||'55'}°C
P_peak=${S2.t_ppeak||80}kW, P_cont=${S2.t_pcont||50}kW, Cycles=${S2.t_cycles||3000}, SoH_EoL=${S2.t_soh_eol||80}%
${document.getElementById('tdaCtxIn')?.value?'Test context: '+document.getElementById('tdaCtxIn').value:''}

DATA UNDER ANALYSIS (${slice.length} rows, zoom window ${(x0*100).toFixed(0)}%–${(x1*100).toFixed(0)}%):
Pack Voltage: ${JSON.stringify(st(col(cm.v_pack)))}
Pack Current: ${JSON.stringify(st(col(cm.i_pack)))}
SOC: ${JSON.stringify(st(col(cm.soc)))}
Cell channels: ${cm.v_cells?.length||0} voltage, ${cm.t_cells?.length||0} temperature
Cell V max across all cells: ${cm.v_cells?.length>0?Math.max(...cm.v_cells.flatMap(ci=>col(ci))).toFixed(3):'N/A'}
Cell V min across all cells: ${cm.v_cells?.length>0?Math.min(...cm.v_cells.flatMap(ci=>col(ci).filter(v=>v>0))).toFixed(3):'N/A'}
Temp max: ${cm.t_cells?.length>0?Math.max(...cm.t_cells.flatMap(ci=>col(ci))).toFixed(1)+'°C':'N/A'}

ACTIVE PANES:
${paneData.map(p=>`${p.pane}: ${p.signals.map(s=>`${s.ch}=[min=${s.stats?.min},max=${s.stats?.max},avg=${s.stats?.mean}]`).join(', ')}`).join('\n')}

${deep?`Provide:
<h4>1. Executive Summary</h4> (3 sentences: what was tested, overall health vs targets, critical finding)
<h4>2. Pass/Fail vs Project Targets</h4> (table-style: each target, measured value, PASS/WARN/FAIL)
<h4>3. Top Anomalies</h4> (top 5, each with root cause hypothesis and recommended action)
<h4>4. Cell Balance</h4> (V spread, weak cell, trending)
<h4>5. Thermal Assessment</h4> (vs T_cell_max, gradient, TMS)
<h4>6. DoD/V_eff Compliance</h4> (measured V range vs V_eff_min/V_eff_max)
<h4>7. Risk Rating</h4> (Low/Medium/High/Critical with justification)
<h4>8. Next Test Recommendations</h4>
Use <b>bold</b> for key values. Use <ul><li> for lists.`
:`Provide:
<h4>1. Executive Summary</h4> (3 sentences)
<h4>2. Pass/Fail vs Project Targets</h4> (measured vs spec, mark PASS/WARN/FAIL)
<h4>3. Top 3 Findings</h4>
<h4>4. Recommended Actions</h4>
Be specific with numbers from the data.`}`;

  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1600,messages:[{role:'user',content:prompt}]})});
    const data=await resp.json();
    const txt=data.content?.map(b=>b.text||'').join('')||'No response';
    t.aiResult=txt.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/^- (.+)/gm,'<li>$1</li>').replace(/(<li>[\s\S]+?<\/li>)+/g,m=>'<ul>'+m+'</ul>');
    if(aiBody) aiBody.innerHTML=t.aiResult+`<div style="font-size:9px;color:#3a567a;margin-top:6px;text-align:right">🤖 ${deep?'Deep':'Std'} · Claude Sonnet · ${new Date().toLocaleTimeString()}</div>`;
  } catch(err){if(aiBody) aiBody.innerHTML=`<span style="color:#ef4444">⚠ API Error: ${err.message}</span>`;}
};

/* ══ UTILS ══ */
window.tdaClear=function(){window._tda={wb:null,sheets:[],activeSheet:'',data:null,panes:[],zoomX:{x0:0,x1:1},cursor:null,aiResult:null,scatterX:null,scatterY:null};renderDataAnalysis();};
window.tdaExport=function(){
  const t=window._tda; if(!t.data) return;
  const S2=window.S||{};
  const lines=['BatteryMIS TDA Report',`File: ${t.data.fileName}`,`Date: ${new Date().toISOString().slice(0,16)}`,
    `Project: ${S2.proj||''} · ${S2.c_chem||''} ${S2.S_total||''}S/${S2.c_pp||''}P · V_eff ${S2.V_eff_min?.toFixed(0)||'?'}–${S2.V_eff_max?.toFixed(0)||'?'}V`,'',
    'AI Analysis:',t.aiResult?.replace(/<[^>]+>/g,'')||'(not run)'];
  const a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(lines.join('\n'));
  a.download=`TDA_${t.data.fileName.replace(/\.\w+$/,'')}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
};
