/* app-ui.js - Sidebar Navigation + Ask AI */
/* ═══════════════════════════════════════════
   SIDEBAR INJECTION + NAV WIRING
═══════════════════════════════════════════ */
(function injectSidebar() {

  const ENG_ITEMS = [
    { id: 'targets',    label: 'Project Targets' },
    { id: 'cell',       label: 'Cell Inputs' },
    { id: 'cellqual',   label: 'Cell Qualification' },
    { id: 'sizing',     label: 'S×P Sizing' },
    { id: 'energy',     label: 'Energy' },
    { id: 'voltage',    label: 'Voltage' },
    { id: 'current',    label: 'Current & Power' },
    { id: 'powermap',   label: 'Power Map' },
    { id: 'resistance', label: 'Resistance' },
    { id: 'dcir',       label: 'DCIR Map' },
    { id: 'derating',   label: 'Temp Derating' },
    { id: 'busbar',     label: 'Busbar' },
    { id: 'precharge',  label: 'Precharge' },
    { id: 'fuse',       label: 'Fuse Selector' },
    { id: 'thermal',    label: 'Thermal / TMS' },
    { id: 'drive_cycle',label: 'Drive Cycle' },
    { id: 'charge',     label: 'Charging' },
    { id: 'bms',        label: 'BMS' },
    { id: 'lifecycle',  label: 'Lifecycle' },
    { id: 'bizcost',    label: 'Business & Cost' },
    { id: 'tvr',        label: 'Target vs Results' },
    { id: 'pack3d',     label: '3D Viewer' },
  ];

  const BT_ITEMS = [
    { id: 'electrical',    label: 'Electrical' },
    { id: 'thermal',       label: 'Thermal & Cooling' },
    { id: 'performance',   label: 'Performance' },
    { id: 'environmental', label: 'Environmental' },
    { id: 'mechanical',    label: 'Mechanical' },
    { id: 'abuse',         label: 'Abuse & Safety' },
    { id: 'emi_emc',       label: 'EMI / EMC' },
    { id: 'certification', label: 'Certification' },
    { id: 'equipment',     label: 'Equipment' },
    { id: 'data_analysis', label: 'Test Data Analysis' },
  ];

  const TOP_ITEMS = [
    { id: 'engineering',label: 'Battery Engineering', sub: ENG_ITEMS },
    { id: 'testing',    label: 'Battery Testing', sub: BT_ITEMS },
    { id: 'calculator', label: 'Calculator' },
    { id: 'standards',  label: 'Standards AI' },
    { id: 'reqmap',     label: 'Req Mapping' },
    { id: 'learning',   label: 'Simulate' },
    { id: 'upskill',    label: 'Upskill' },
    { id: 'dashboard',  label: 'Dashboard' },
    { id: 'askai',      label: 'Ask AI' },
  ];

  // State
  let activeTop = 'engineering';
  let activeEngSub = 'targets';
  let activeBtSub  = 'electrical';
  let engOpen = true;
  let btOpen  = false;
  let saveTime = '--:--:--';

  // Build sidebar HTML
  function buildNav() {
    return TOP_ITEMS.map(item => {
      const isActive = item.id === activeTop;
      const hasOpen  = item.id === 'engineering' ? engOpen : item.id === 'testing' ? btOpen : false;
      let html = `<div class="sb-item${isActive ? ' active' : ''}${hasOpen ? ' open' : ''}" data-top="${item.id}">
        <span class="sb-label">${item.label}</span>
        ${item.sub ? `<span class="sb-chevron">▾</span>` : ''}
      </div>`;
      if (item.sub) {
        const activeSub = item.id === 'engineering' ? activeEngSub : activeBtSub;
        html += `<div class="sb-sub${hasOpen ? ' open' : ''}" id="__sub_${item.id}">
          ${item.sub.map(s => `<div class="sb-sub-item${s.id === activeSub && isActive ? ' active' : ''}" data-top="${item.id}" data-sub="${s.id}">
            <span class="sb-sub-label">${s.label}</span>
          </div>`).join('')}
        </div>`;
      }
      return html;
    }).join('<div class="sb-divider"></div>');
  }

  function buildSidebar() {
    const el = document.createElement('div');
    el.id = '__bms_sidebar';
    el.innerHTML = `
      <div id="__bms_sb_logo">
        <div class="logo-mark" style="background:#0d1f10;border-radius:6px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="32" height="32" viewBox="88 105 90 105" xmlns="http://www.w3.org/2000/svg">
  <rect x="94" y="118" width="56" height="84" rx="6" fill="none" stroke="#1D9E75" stroke-width="2.5"/>
  <rect x="107" y="112" width="30" height="8" rx="3" fill="#1D9E75"/>
  <rect x="96" y="160" width="52" height="42" rx="4" fill="#1D9E75"/>
  <path d="M125 138 L118 158 L123 158 L119 178 L132 153 L126 153 Z" fill="#fff"/>
</svg></div>
        <div class="logo-text">
          <div class="t1">Battery<span style="color:#1D9E75">MIS</span></div>
          <div class="t2">AI Integrated Platform</div>
        </div>
      </div>
      <div id="__bms_sb_nav">${buildNav()}</div>
      <div id="__bms_sb_user">
        <div class="avatar">VV</div>
        <div class="uinfo">
          <div class="name">Viji V.</div>
          <div class="role">Engineer</div>
        </div>
      </div>
    `;
    return el;
  }

  function buildSaveBar() {
    const el = document.createElement('div');
    el.id = '__bms_savebar';
    el.innerHTML = `
      <div class="breadcrumb" id="__bms_bc">Battery Engineering / <strong>Project Targets</strong></div>
      <div id="__bms_savets" class="save-ts">Saved ${saveTime}</div>
      <button class="btn-save" onclick="if(typeof submitAndLock==='function')submitAndLock()">💾 Save &amp; Lock</button>
      <button class="btn-reset" onclick="if(typeof resetAndUnlock==='function')resetAndUnlock()">↺ Reset</button>
    `;
    return el;
  }

  function updateBreadcrumb(topLabel, subLabel) {
    const bc = document.getElementById('__bms_bc');
    if (bc) bc.innerHTML = subLabel
      ? `${topLabel} / <strong>${subLabel}</strong>`
      : `<strong>${topLabel}</strong>`;
  }

  function updateSaveTs() {
    const now = new Date();
    const ts = now.toTimeString().slice(0,8);
    const el = document.getElementById('__bms_savets');
    if (el) el.textContent = 'Saved ' + ts;
  }

  function refreshNav() {
    const nav = document.getElementById('__bms_sb_nav');
    if (nav) nav.innerHTML = buildNav();
    attachEvents();
  }

  function doTopSwitch(id) {
    activeTop = id;
    // Call existing function
    const btn = document.getElementById('ttab-' + id);
    if (typeof switchTopTab === 'function') {
      switchTopTab(id, btn || document.createElement('button'));
    }
    // Update breadcrumb
    const item = TOP_ITEMS.find(t => t.id === id);
    if (item && !item.sub) updateBreadcrumb(item.label, null);
    if (id === 'engineering') {
      engOpen = true;
      updateBreadcrumb('Battery Engineering', ENG_ITEMS.find(e=>e.id===activeEngSub)?.label);
      setTimeout(() => {
        const nb = document.querySelector(`button.nb[onclick*="showSec('${activeEngSub}'"]`);
        if (nb) nb.click();
      }, 100);
    }
    if (id === 'testing') {
      btOpen = true;
      updateBreadcrumb('Battery Testing', (BT_ITEMS.find(function(b){return b.id===activeBtSub;})||{}).label||'');
      setTimeout(function() {
        try {
          if (activeBtSub==='data_analysis'&&typeof renderDataAnalysis==='function') renderDataAnalysis();
          else if (typeof renderBatteryTesting==='function') renderBatteryTesting(activeBtSub);
        } catch(e) {}
      }, 100);
    }
    if (id === 'calculator') {
      updateBreadcrumb('Calculator', null);
      setTimeout(function(){ try { if(typeof renderCalcPanel==='function') renderCalcPanel(); } catch(e){} }, 100);
    }
    if (id === 'standards') {
      updateBreadcrumb('Standards AI', null);
      setTimeout(function(){try{if(typeof propagate==='function')propagate();if(typeof filterStandards==='function')filterStandards();if(typeof renderStdTable==='function')renderStdTable();}catch(e){}},100);
    }
    if (id === 'intake') {
      updateBreadcrumb('DVP Intake', null);
      setTimeout(function(){try{if(typeof propagate==='function')propagate();if(typeof pullEngToIntake==='function')pullEngToIntake();}catch(e){}},100);
    }
    if (id === 'reqmap') {
      updateBreadcrumb('Req Mapping', null);
      setTimeout(function(){try{if(!window._reqMapData||!window._reqMapData.length){if(typeof buildReqMapFromTargets==='function')buildReqMapFromTargets();}else if(typeof renderReqMap==='function')renderReqMap();if(typeof updateReqMapKPIs==='function')updateReqMapKPIs();}catch(e){}},100);
    }
    if (id === 'learning') {
      updateBreadcrumb('Simulate', null);
      setTimeout(function(){ try { if(typeof initLearningLab==='function') initLearningLab(); } catch(e){} }, 100);
    }
    if (id === 'askai') {
      updateBreadcrumb('Ask AI', null);
      setTimeout(function(){ var ta=document.getElementById('askai-textarea'); if(ta) ta.focus(); }, 150);
    }
    if (id === 'author') {
      updateBreadcrumb('Author', null);
    }
    if (id === 'upskill') {
      updateBreadcrumb('Upskill', null);
    }
    if (id === 'dashboard') {
      updateBreadcrumb('Dashboard', null);
      setTimeout(function(){try{if(typeof renderDemo==='function')renderDemo();}catch(e){}},100);
    }
    refreshNav();
  }

  const RENDER_MAP = {
    sizing:     () => typeof renderSizing==='function'       && (propagate(), setTimeout(renderSizing, 60)),
    dcir:       () => typeof renderDCIRMap==='function'      && renderDCIRMap(),
    cellqual:   () => typeof renderCellQual==='function'     && renderCellQual(),
    derating:   () => typeof renderDerating==='function'     && renderDerating(),
    fuse:       () => typeof renderFuseSelector==='function' && renderFuseSelector(),
    powermap:   () => typeof drawPowerMap==='function'       && drawPowerMap(),
    energy:     () => typeof calcEnergy==='function'         && (propagate(), null),
    voltage:    () => typeof calcVoltage==='function'        && (propagate(), null),
    current:    () => typeof calcCurrent==='function'        && (propagate(), null),
    resistance: () => typeof calcResistance==='function'     && (propagate(), null),
    thermal:    () => typeof calcThermal==='function'        && (propagate(), null),
    lifecycle:  () => typeof calcLifecycle==='function'      && (propagate(), null),
    charge:     () => typeof calcCharge==='function'         && (propagate(), null),
    bms:        () => typeof calcBMS==='function'            && (propagate(), null),
    busbar:     () => typeof calcBusbar==='function'         && (propagate(), null),
    precharge:  () => typeof calcPrecharge==='function'      && calcPrecharge(),
    drive_cycle:() => typeof drawDriveCycleCanvas==='function' && drawDriveCycleCanvas(),
    tvr:        () => typeof runTVR==='function'             && runTVR(),
    bizcost:    () => typeof calcBizCost==='function'        && (propagate(), null),
    targets:    () => typeof propagate==='function'          && propagate(),
    cell:       () => typeof propagate==='function'          && (propagate(), typeof updateCellTargets==='function' && updateCellTargets()),
    pack3d:     () => typeof initPack3D==='function'         && initPack3D(),
  };
  function doEngSub(id) {
    activeEngSub = id;
    // Call showSec directly - most reliable
    if (typeof showSec === 'function') {
      showSec(id, document.createElement('button'));
    }
    // Always propagate first so S state is fresh for all sub-sheets
    setTimeout(function() {
      try { if (typeof propagate==='function') propagate(); } catch(e){}
    }, 10);
    // Then trigger section-specific render with fresh S
    setTimeout(function() {
      if (RENDER_MAP[id]) {
        try { RENDER_MAP[id](); } catch(e){ console.warn('[render]',id,e); }
      }
      // Keep compliance panels in sync
      try { if (typeof updateTargetsCompliance==='function') updateTargetsCompliance(); } catch(e){}
      try { if (typeof updateCellTargets==='function') updateCellTargets(); } catch(e){}
    }, 130);
    updateBreadcrumb('Battery Engineering', (ENG_ITEMS.find(function(e){return e.id===id;})||{}).label||id);
    refreshNav();
  }

  function doBtSub(id) {
    activeBtSub = id;
    if (activeTop !== 'testing') {
      const btn = document.getElementById('ttab-testing');
      if (typeof switchTopTab==='function') switchTopTab('testing', btn||document.createElement('button'));
    }
    setTimeout(function() {
      try {
        if (id === 'data_analysis' && typeof renderDataAnalysis==='function') renderDataAnalysis();
        else if (typeof renderBatteryTesting==='function') renderBatteryTesting(id);
      } catch(e) { console.warn('[bt render]', e); }
    }, 80);
    updateBreadcrumb('Battery Testing', (BT_ITEMS.find(function(b){return b.id===id;})||{}).label||'');
    refreshNav();
  }

  function attachEvents() {
    const nav = document.getElementById('__bms_sb_nav');
    if (!nav) return;
    nav.querySelectorAll('.sb-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.top;
        const item = TOP_ITEMS.find(t=>t.id===id);
        if (id === 'engineering') { engOpen = !engOpen; if (!engOpen) { /* collapse only */ activeTop = 'engineering'; } else { doTopSwitch('engineering'); return; } }
        else if (id === 'testing') { btOpen = !btOpen; if (!btOpen) {} else { doTopSwitch('testing'); return; } }
        else { engOpen = false; btOpen = false; doTopSwitch(id); return; }
        refreshNav();
      });
    });
    nav.querySelectorAll('.sb-sub-item').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const top = el.dataset.top;
        const sub = el.dataset.sub;
        if (top !== activeTop) { doTopSwitch(top); }
        setTimeout(() => {
          if (top === 'engineering') doEngSub(sub);
          else if (top === 'testing') doBtSub(sub);
        }, top !== activeTop ? 150 : 0);
      });
    });
  }

  // Hook into existing updateSaveIndicator
  const _origSave = window.updateSaveIndicator;
  window.updateSaveIndicator = function() {
    if (_origSave) try { _origSave.apply(this, arguments); } catch(e) {}
    updateSaveTs();
  };

  // Mount
  function mount() {
    document.body.appendChild(buildSidebar());
    document.body.appendChild(buildSaveBar());
    attachEvents();
    // Keep eng panel active
    setTimeout(() => {
      doTopSwitch('engineering');
    }, 200);
    // Auto-update save time every 60s
    setInterval(updateSaveTs, 60000);
  }

  // ── Tweaks panel ──
  function buildTweaksPanel() {
    const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
      "sidebarWidth": 172,
      "density": "compact",
      "accentColor": "#7c3aed"
    }/*EDITMODE-END*/;
    const saved = (() => { try { return JSON.parse(localStorage.getItem('battmis_tweaks_v1') || '{}'); } catch(e) { return {}; } })();
    const vals = Object.assign({}, TWEAK_DEFAULTS, saved);

    function applyTweaks(v) {
      document.documentElement.style.setProperty('--sb-width', v.sidebarWidth + 'px');
      // Toggle icon-only mode below 80px
      const sidebar = document.getElementById('__bms_sidebar');
      if (sidebar) {
        if (v.sidebarWidth < 80) {
          sidebar.classList.add('icon-only');
        } else {
          sidebar.classList.remove('icon-only');
        }
      }
      document.documentElement.style.setProperty('--accent', v.accentColor);
      // density
      const spacing = v.density === 'compact' ? '8px 10px' : v.density === 'spacious' ? '20px 24px' : '14px 18px';
      document.documentElement.style.setProperty('--sec-padding', spacing);
      localStorage.setItem('battmis_tweaks_v1', JSON.stringify(v));
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: v }, '*');
    }

    applyTweaks(vals);

    const panel = document.createElement('div');
    panel.id = '__tweaks_panel';
    panel.style.cssText = 'display:none;position:fixed;bottom:24px;right:24px;z-index:9999;background:#fff;border:2px solid #0A1628;border-radius:10px;padding:18px;width:240px;box-shadow:4px 4px 0 #0A1628;font-family:DM Sans,sans-serif;';
    panel.innerHTML = `
      <div style="font-size:16px;font-weight:700;color:#0A1628;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center">
        Tweaks
        <span onclick="document.getElementById('__tweaks_panel').style.display='none'" style="cursor:pointer;font-size:14px;color:#aaa">✕</span>
      </div>
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Sidebar width: <strong id="__tw_sb_val">${vals.sidebarWidth}px</strong></label>
      <input type="range" id="__tw_sb" min="48" max="280" step="4" value="${vals.sidebarWidth}"
        style="width:100%;margin-bottom:14px;accent-color:#00C896">
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Density</label>
      <select id="__tw_density" style="width:100%;margin-bottom:14px;padding:5px 8px;border:1.5px solid #ddd;border-radius:5px;font-size:12px">
        <option value="compact"${vals.density==='compact'?' selected':''}>Compact</option>
        <option value="comfortable"${vals.density==='comfortable'?' selected':''}>Comfortable</option>
        <option value="spacious"${vals.density==='spacious'?' selected':''}>Spacious</option>
      </select>
      <label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Accent colour</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">
        ${[['#00C896','Teal'],['#2563eb','Blue'],['#7c3aed','Purple'],['#d97706','Amber']].map(([c,n])=>`
          <div onclick="document.getElementById('__tw_accent').value='${c}';document.getElementById('__tw_accent').dispatchEvent(new Event('input'))"
            title="${n}" style="width:24px;height:24px;border-radius:4px;background:${c};border:2px solid ${c===vals.accentColor?'#0A1628':'transparent'};cursor:pointer"></div>
        `).join('')}
        <input type="color" id="__tw_accent" value="${vals.accentColor}" style="width:24px;height:24px;border:none;padding:0;border-radius:4px;cursor:pointer">
      </div>
    `;
    document.body.appendChild(panel);

    // Events
    document.getElementById('__tw_sb').addEventListener('input', function() {
      vals.sidebarWidth = +this.value;
      document.getElementById('__tw_sb_val').textContent = this.value + 'px';
      applyTweaks(vals);
    });
    document.getElementById('__tw_density').addEventListener('change', function() {
      vals.density = this.value;
      applyTweaks(vals);
    });
    document.getElementById('__tw_accent').addEventListener('input', function() {
      vals.accentColor = this.value;
      // Update teal/00C896 references
      document.documentElement.style.setProperty('--accent', this.value);
      document.querySelectorAll('.sb-item.active').forEach(el => el.style.borderLeftColor = this.value);
      applyTweaks(vals);
    });
  }

  window.addEventListener('message', e => {
    if (e.data?.type === '__activate_edit_mode')   document.getElementById('__tweaks_panel').style.display = 'block';
    if (e.data?.type === '__deactivate_edit_mode') document.getElementById('__tweaks_panel').style.display = 'none';
  });
  window.parent.postMessage({ type: '__edit_mode_available' }, '*');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { mount(); buildTweaksPanel(); });
  } else {
    mount();
    buildTweaksPanel();
  }
})();


var BATTERY_KW=['battery','cell','pack','bms','soc','soh','sop','dcir','ocv','nmc','lfp','nca','lco','lto','lithium','anode','cathode','electrolyte','separator','sei','dendrite','plating','capacity','energy','voltage','current','charge','discharge','cycle','aging','thermal','temperature','cooling','heat','hvil','contactor','fuse','precharge','balancing','impedance','eis','hppc','peukert','ragone','cccv','c-rate','kwh','wh','resistance','entropy','arrhenius','thevenin','ecm','kalman','coulomb','isolation','arc','ev','hev','inverter','drivetrain','range','wltp','dvp','standard','iec','iso','un38','gb/t','ais','ul','safety','abuse','nail','crush','overcharge','overdischarge','short circuit','propagation','runaway','venting','formation','grading','parallel','series','module','busbar','tab','weld','gravimetric','volumetric','tco','calendar','degradation','fade','knee','rint','relaxation','hysteresis','plateau','dva','ica','differential','tms','btm','ptc','coolant','glycol','reynolds','pressure drop','solid state','electrode','intercalation','graphite'];

  var N8N_KEY = 'battmis_askai_n8n_v1';

  function loadCfg(){ try{ return JSON.parse(localStorage.getItem(N8N_KEY)||'{}'); }catch(e){return{};} }
  function saveCfg(c){ localStorage.setItem(N8N_KEY, JSON.stringify(c)); }

  function isBattery(q){ var l=q.toLowerCase(); return BATTERY_KW.some(function(k){ return l.indexOf(k)>-1; }); }

  function getWebhook(){
    var local=loadCfg().webhookUrl;
    if(local&&local.length>10&&local.indexOf('YOUR')===-1) return local;
    return (window.DVP_CONFIG||{}).askAiWebhookUrl||'';
  }

  function ts(){ return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }

  function setDot(state){
    var dot=document.getElementById('askai-status-dot');
    var prev=document.getElementById('askai-url-preview');
    if(!dot) return;
    var colors={ok:'#059669',warn:'#f59e0b',error:'#ef4444',off:'#94a3b8'};
    dot.style.background = colors[state]||colors.off;
    if(prev){
      var url=getWebhook();
      prev.textContent = url ? url.slice(0,60)+(url.length>60?'...':'') : 'Not configured';
    }
  }

  // Toggle settings panel
  window.askaiToggleSettings = function(){
    var panel=document.getElementById('askai-settings-panel');
    if(!panel) return;
    var open = panel.style.display !== 'none';
    panel.style.display = open ? 'none' : 'block';
    if(!open){
      var cfg=loadCfg();
      var u=document.getElementById('askai-n8n-url');
      var m=document.getElementById('askai-n8n-model');
      var h=document.getElementById('askai-n8n-header');
      if(u) u.value=cfg.webhookUrl||'';
      if(m) m.value=cfg.model||'';
      if(h) h.value=cfg.authHeader||'';
      setDot('off');
    }
  };

  window.askaiSaveSettings = function(){
    var url=(document.getElementById('askai-n8n-url')||{}).value||'';
    var model=(document.getElementById('askai-n8n-model')||{}).value||'';
    var auth=(document.getElementById('askai-n8n-header')||{}).value||'';
    saveCfg({webhookUrl:url, model:model, authHeader:auth});
    if(!window.DVP_CONFIG) window.DVP_CONFIG={};
    window.DVP_CONFIG.askAiWebhookUrl = url;
    var msg=document.getElementById('askai-settings-msg');
    if(msg){ msg.textContent='Saved.'; msg.style.color='#059669'; setTimeout(function(){msg.textContent='';},2500); }
    setDot(url ? 'warn' : 'off');
  };

  window.askaiTestConnection = function(){
    var url=getWebhook();
    var msg=document.getElementById('askai-settings-msg');
    if(!url){ if(msg){msg.textContent='Enter a webhook URL first.';msg.style.color='#ef4444';} return; }
    if(msg){ msg.textContent='Testing...'; msg.style.color='#94a3b8'; }
    var cfg=loadCfg();
    var headers={'Content-Type':'application/json'};
    if(cfg.authHeader) headers['Authorization']=cfg.authHeader;
    fetch(url,{method:'POST',headers:headers,body:JSON.stringify({test:true})})
      .then(function(r){
        var ok=r.ok;
        if(msg){ msg.textContent=ok?'Connected.':'Returned '+r.status; msg.style.color=ok?'#059669':'#f59e0b'; }
        setDot(ok?'ok':'warn');
      })
      .catch(function(e){
        if(msg){ msg.textContent='Cannot reach n8n: '+e.message; msg.style.color='#ef4444'; }
        setDot('error');
      });
  };

  // Init status dot on load
  setTimeout(function(){ setDot(getWebhook()?'warn':'off'); }, 500);

  function addMsg(content,type,meta){
    var chat=document.getElementById('askai-chat');
    var row=document.createElement('div');
    row.className='msg-row'+(type==='user'?' user':'');
    var av=type==='user'?'<div class="msg-avatar user">You</div>':'<div class="msg-avatar ai">AI</div>';
    var bbl='<div class="msg-bubble '+type+'">'+content+'</div>';
    var mt=meta?'<div class="msg-meta">'+meta+'</div>':'';
    row.innerHTML=av+'<div>'+bbl+mt+'</div>';
    chat.appendChild(row);
    chat.scrollTop=chat.scrollHeight;
    return row;
  }

  function addTyping(){
    var chat=document.getElementById('askai-chat');
    var row=document.createElement('div');
    row.className='msg-row'; row.id='askai-typing';
    row.innerHTML='<div class="msg-avatar ai">AI</div><div><div class="msg-bubble ai"><div class="typing-dots"><span></span><span></span><span></span></div></div></div>';
    chat.appendChild(row); chat.scrollTop=chat.scrollHeight;
  }
  function removeTyping(){ var t=document.getElementById('askai-typing'); if(t) t.remove(); }

  function fmt(text){
    if(!text) return '';
    var out=text;
    out=out.split('**').map(function(s,i){ return i%2===1?'<strong>'+s+'</strong>':s; }).join('');
    out=out.split('\n\n').join('<br><br>');
    out=out.split('\n').join('<br>');
    return out;
  }

  window.askaiSuggest=function(el){
    var ta=document.getElementById('askai-textarea');
    if(ta){ ta.value=el.textContent.trim(); ta.focus(); ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,120)+'px'; }
  };

  window.askaiSubmit=async function(){
    var ta=document.getElementById('askai-textarea');
    var btn=document.getElementById('askai-send');
    var q=(ta.value||'').trim();
    if(!q) return;
    addMsg(q,'user',ts());
    ta.value=''; ta.style.height='auto';
    btn.disabled=true;

    if(!isBattery(q)){
      addTyping();
      await new Promise(function(r){ setTimeout(r,700); });
      removeTyping();
      addMsg('That question is outside battery engineering scope. I can help with cell chemistry, BMS design, thermal management, pack sizing, charging, and EV battery systems.','rejected','Off-topic');
      btn.disabled=false;
      return;
    }

    addTyping();
    var webhookUrl=getWebhook();
    var cfg=loadCfg();
    var S=window.S||{};
    var ctx={question:q,timestamp:new Date().toISOString(),model:cfg.model||undefined,project_context:{chemistry:S.c_chem||'',pack_voltage:S.V_nom_pack||'',pack_energy:S.E_gross||'',application:S.app||'',s_total:S.S_total||''}};

    try{
      var answer=''; var sources=[];
      if(webhookUrl&&webhookUrl.indexOf('YOUR')===-1&&webhookUrl.length>10){
        var headers={'Content-Type':'application/json'};
        if(cfg.authHeader) headers['Authorization']=cfg.authHeader;
        var res=await fetch(webhookUrl,{method:'POST',headers:headers,body:JSON.stringify(ctx)});
        var data=await res.json();
        answer=data.answer||data.response||data.text||JSON.stringify(data);
        sources=data.sources||[];
        setDot('ok');
      } else {
        await new Promise(function(r){ setTimeout(r,800); });
        answer='No n8n backend connected. Click <strong>Settings</strong> at the top to enter your webhook URL.';
      }
      removeTyping();
      var html=fmt(answer);
      if(sources.length) html+='<div class="askai-sources">'+sources.map(function(s){ return '<span class="askai-source">'+s+'</span>'; }).join('')+'</div>';
      addMsg(html,'ai','BatteryMIS AI - '+ts());
    } catch(err){
      removeTyping();
      addMsg('Could not reach n8n. Error: '+err.message+'<br>Check your webhook URL in <strong>Settings</strong>.','error','Connection error');
      setDot('error');
    }
    btn.disabled=false;
    var taEl=document.getElementById('askai-textarea');
    if(taEl) taEl.focus();
  };

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){ var ta=document.getElementById('askai-textarea'); if(ta){ ta.value=''; ta.style.height='auto'; } }
  });
