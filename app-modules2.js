/* app-modules2.js - Battery Testing, TDA, Drive Cycle, TVR */
/* inlined: battery-testing.js */
/* ═══════════════════════════════════════════════════════════════
   BatteryMIS - BATTERY TESTING  v4.0
   Complete UX overhaul: sticky nav, 2-col layout, clean hierarchy
   ═══════════════════════════════════════════════════════════════ */

const BT_CATS = [
  { id:'electrical',    icon:'⚡', label:'Electrical',        color:'#4a9eff' },
  { id:'thermal',       icon:'🌡️', label:'Thermal & Cooling',  color:'#ff7b35' },
  { id:'performance',   icon:'🚀', label:'Performance',        color:'#00d4aa' },
  { id:'environmental', icon:'🌍', label:'Environmental',      color:'#00b891' },
  { id:'mechanical',    icon:'🔩', label:'Mechanical',         color:'#6d8fba' },
  { id:'abuse',         icon:'💥', label:'Abuse & Safety',     color:'#ef4444' },
  { id:'emi_emc',       icon:'📡', label:'EMI / EMC',          color:'#a78bfa' },
  { id:'certification', icon:'🏅', label:'Certification',      color:'#fbbf24' },
  { id:'equipment',     icon:'🧰', label:'Equipment',          color:'#94a3b8' },
  { id:'data_analysis', icon:'🔬', label:'Test Data Analysis', color:'#e879f9' },
];

function bt_ctx() {
  // Read DOM directly for freshest values - S may lag if propagate hasn't run
  const g = id => { const el=document.getElementById(id); return el ? el.value : null; };
  const S = window.S || {};
  return {
    app:    g('t_app') || S.app || '4W',
    chem:   ((g('c_chem') || S.c_chem || 'LFP')).split(' ')[0].toUpperCase(),
    vnom:     +(S.V_nom_pack && S.S_total===((+(g('c_cps')||14))*(+(g('c_ss')||8))) 
               ? S.V_nom_pack 
               : ((+(g('c_cps')||14))*(+(g('c_ss')||8))*(+(g('c_vnom')||S.c_vnom||3.2)))),
    vmax:     +(S.V_max_pack || 420),
    vmin:     +(S.V_min_pack || 280),
    // DoD-based operative voltages (from OCV canvas + DoD)
    v_op_max: S.V_dod_hi_pack > 0 ? +S.V_dod_hi_pack.toFixed(1) : +(S.V_max_pack||420),
    v_op_min: S.V_dod_lo_pack > 0 ? +S.V_dod_lo_pack.toFixed(1) : +(S.V_min_pack||280),
    v_op_hi_cell: S.V_dod_hi_cell > 0 ? +S.V_dod_hi_cell.toFixed(3) : +(g('c_vmax')||S.c_vmax||3.65),
    v_op_lo_cell: S.V_dod_lo_cell > 0 ? +S.V_dod_lo_cell.toFixed(3) : +(g('c_vmin')||S.c_vmin||2.0),
    soc_lo:  S.soc_lo != null ? +S.soc_lo.toFixed(0) : Math.round((1-(+(g('t_dod')||S.t_dod||1)))*100/2),
    soc_hi:  S.soc_hi != null ? +S.soc_hi.toFixed(0) : Math.round(100-(1-(+(g('t_dod')||S.t_dod||1)))*100/2),
    vcell_max: +(g('c_vmax') || S.c_vmax || 3.65),
    vcell_min: +(g('c_vmin') || S.c_vmin || 2.8),
    egross: +(S.E_gross || +(g('t_emin')) || 43),
    euse:   +((S.E_gross||43)*(+(g('t_dod')||S.t_dod||0.9))),
    ppeak:  +(g('t_ppeak') || S.t_ppeak || 80),
    pcont:  +(g('t_pcont') || S.t_pcont || 50),
    imax:   S.t_ppeak ? +(S.t_ppeak*1000/(S.V_nom_pack||400)).toFixed(0) : 200,
    icont:  S.t_pcont ? +(S.t_pcont*1000/(S.V_nom_pack||400)).toFixed(0) : 130,
    ichg:   +(g('t_imax_chg') || S.t_imax_chg || 120),
        sxp:    S.config_label || ((+(document.getElementById('c_cps')?.value)||S.c_cps||14)*(+(document.getElementById('c_ss')?.value)||S.c_ss||8))+'S/'+(+(document.getElementById('c_pp')?.value)||S.c_pp||1)+'P',
    qpack:  +(S.Q_pack || +(g('c_ah')) || 120),
    top_lo: +(g('t_top_lo') ?? S.t_top_lo ?? -20),
    top_hi: +(g('t_top_hi') ?? S.t_top_hi ?? 55),
    tcell:  +(g('t_tcell_max') ?? S.t_tcell_max ?? 55),
    ip:     g('t_ip') || S.t_ip || 'IP67',
    markets:(g('t_markets') || S.markets || 'EU, US').toUpperCase(),
    cycles: +(S.t_cycles       || 3000),
    years:  +(S.t_years        || 10),
    soh_eol:+(S.t_soh_eol     || 80),
    ir_bol: +(S.c_ir_bol       || 0.22),
    S_total:+(S.S_total        || 112),
    c_pp:   +(S.c_pp           || 1),
    ah:     +(S.c_ah           || 120),
  };
}

window.renderBatteryTesting = function(catId) {
  const root = document.getElementById('bt_root');
  if (!root) return;
  // Reset to proper flex column (clears placeholder centering styles)
  root.style.cssText = 'flex:1;min-height:0;display:flex;flex-direction:column;';
  // Handle Test Data Analysis - delegate to TDA module
  catId = catId || window._bt_active_cat || 'electrical';
  window._bt_active_cat = catId;
  if (catId === 'data_analysis') {
    if (typeof window.renderDataAnalysis === 'function') { window.renderDataAnalysis(); return; }
    root.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3)">⏳ Loading Test Data Analysis...</div>';
    setTimeout(() => { if (typeof window.renderDataAnalysis === 'function') window.renderDataAnalysis(); }, 500);
    return;
  }
  // Always ensure S is fresh before rendering
  try { if (typeof propagate === 'function') propagate(); } catch(e) {}
  window._bt_active_cat = catId;
  console.log('[BT] rendering cat:', catId, '· S.c_chem:', (window.S||{}).c_chem, '· S.S_total:', (window.S||{}).S_total);
  const cat = BT_CATS.find(c => c.id === catId) || BT_CATS[0];
  const ctx = bt_ctx();

  /* ── Project context strip - ALL target fields ── */
  const g2=id=>{const el=document.getElementById(id);return el?el.value:null;};
  const S2=window.S||{};
  const ctxItems = [
    // Identity
    ['App',      ctx.app],
    ['Chem',     ctx.chem],
    ['Config',   ctx.sxp],
    // Energy
    ['E_gross',  (+ctx.egross).toFixed(1)+'kWh'],
    ['E_use',    (+ctx.euse).toFixed(1)+'kWh'],
    ['DoD',      (+(g2('t_dod')||S2.t_dod||1)*100).toFixed(0)+'%'],
    ['Autonomy', (+(g2('t_auto')||S2.t_auto||4)).toFixed(1)+'h'],
    // Voltage (absolute cell limits)
    ['V_nom',      (+ctx.vnom).toFixed(0)+'V'],
    ['V_max(abs)', (+ctx.vmax).toFixed(0)+'V'],
    ['V_min(abs)', (+ctx.vmin).toFixed(0)+'V'],
    // DoD-operative voltages (actual working range from OCV+DoD)
    ['Vop_hi',   ctx.v_op_max+'V'],
    ['Vop_lo',   ctx.v_op_min+'V'],
    ['Vc_hi',    ctx.v_op_hi_cell+'V'],
    ['Vc_lo',    ctx.v_op_lo_cell+'V'],
    ['SoC_rng',  ctx.soc_lo+'–'+ctx.soc_hi+'%'],
    // Power
    ['P_peak',   ctx.ppeak+'kW'],
    ['P_cont',   ctx.pcont+'kW'],
    ['I_peak',   ctx.imax+'A'],
    ['t_peak',   (+(g2('t_tpeak')||S2.t_tpeak||30))+'s'],
    ['C_peak',   (+(g2('t_cpeak')||S2.t_cpeak||2.0)).toFixed(1)+'C'],
    // Cell
    ['Cap',      ctx.qpack+'Ah'],
    ['IR_BoL',   ctx.ir_bol+'mΩ'],
    ['IR_EoL',   (+(g2('c_ir_eol')||S2.c_ir_eol||0.35)).toFixed(3)+'mΩ'],
    // Charging
    ['P_DC',     (+(g2('t_pdc')||S2.t_pdc||60))+'kW'],
    ['I_chg',    ctx.ichg+'A'],
    ['C_chg',    (+(g2('t_cchg')||S2.t_cchg||0.5)).toFixed(2)+'C'],
    // Thermal
    ['T_cell',   ctx.tcell+'°C'],
    ['T_op',     ctx.top_lo+'→'+ctx.top_hi+'°C'],
    ['T_chg',    (+(g2('t_tchg_lo')||S2.t_tchg_lo||-15))+'→'+(+(g2('t_tchg_hi')||S2.t_tchg_hi||45))+'°C'],
    // Lifetime
    ['Cycles',   ctx.cycles],
    ['SoH_EoL',  ctx.soh_eol+'%'],
    ['Life',     (+(g2('t_years')||S2.t_years||10))+'yr'],
    // Environmental
    ['IP',       ctx.ip],
    ['Alt',      (+(g2('t_alt')||S2.t_alt||3000))+'m'],
    ['Markets',  ctx.markets],
  ];

  root.innerHTML = `
<style>
#bt_shell{display:flex;flex-direction:column;height:100%;min-height:0}
#bt_topbar{background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0}
#bt_ctx_strip{display:flex;flex-wrap:wrap;gap:5px;padding:8px 16px;background:var(--bg3);border-bottom:1px solid var(--border);align-items:center}
#bt_subnav{display:flex;gap:2px;flex-wrap:wrap;padding:8px 12px;overflow-x:auto}
#bt_body{flex:1;overflow-y:auto;padding:20px 24px}
.bt-catbtn{display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:var(--sans);transition:all .12s;border:1px solid transparent;background:transparent;color:var(--text2)}
.bt-catbtn:hover{background:rgba(255,255,255,.04);color:var(--text)}
.bt-catbtn.active{border-color:${cat.color}50;background:${cat.color}15;color:${cat.color}}
.bt-hdr{display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border)}
.bt-hdr-icon{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:${cat.color}18;border:1px solid ${cat.color}40}
.bt-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:800px){.bt-cols{grid-template-columns:1fr}}
.bt-card{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}
.bt-card-title{font-size:13px;font-weight:700;color:var(--text);margin-bottom:6px}
.bt-std-badge{font-size:9px;font-family:var(--mono);color:var(--text3);padding:2px 7px;background:var(--bg4);border:1px solid var(--border);border-radius:4px;display:inline-block;margin-bottom:8px;white-space:nowrap}
.bt-body-text{font-size:12px;color:var(--text2);line-height:1.75}
.bt-tip{background:rgba(0,212,170,.06);border-left:3px solid var(--teal);padding:8px 12px;font-size:12px;color:var(--text2);border-radius:0 6px 6px 0;margin-top:8px}
.bt-warn{background:rgba(245,197,24,.06);border-left:3px solid var(--y);padding:8px 12px;font-size:12px;border-radius:0 6px 6px 0;margin-top:8px}
.bt-crit{background:rgba(255,77,109,.06);border-left:3px solid var(--r);padding:8px 12px;font-size:12px;border-radius:0 6px 6px 0;margin-top:8px}
.bt-formula{font-family:var(--mono);font-size:11px;background:var(--bg4);border-left:3px solid var(--teal);padding:6px 10px;border-radius:0 5px 5px 0;margin:5px 0;color:var(--text2)}
.bt-calc-row{display:flex;align-items:baseline;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)}
.bt-calc-row:last-child{border:none}
.bt-calc-label{font-size:12px;color:var(--text2);flex:1.3;min-width:0}
.bt-calc-formula{font-family:var(--mono);font-size:10px;color:var(--text3);flex:1.4;min-width:0}
.bt-calc-val{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--teal);white-space:nowrap}
.bt-calc-unit{font-size:10px;color:var(--text3);margin-left:2px}
.bt-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin:18px 0 8px;padding-bottom:5px;border-bottom:1px solid var(--border)}
.bt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}
</style>

<div id="bt_shell">
  <div id="bt_topbar">
    <!-- Category nav -->
    <div id="bt_subnav">
      ${BT_CATS.map(c => `<button class="bt-catbtn ${c.id===catId?'active':''}"
        style="${c.id===catId?`border-color:${c.color}50;background:${c.color}15;color:${c.color}`:''}"
        onclick="renderBatteryTesting('${c.id}')">
        <span style="font-size:13px">${c.icon}</span>${c.label}
      </button>`).join('')}
    </div>
    <!-- Project context -->
    <div id="bt_ctx_strip">
      <span style="font-size:9px;font-family:var(--mono);color:var(--text3);flex-shrink:0">PROJECT →</span>
      ${ctxItems.map(([k,v])=>`<div style="display:flex;gap:3px;align-items:center;background:var(--bg4);border:1px solid var(--border2);border-radius:4px;padding:2px 7px">
        <span style="font-size:9px;font-family:var(--mono);color:var(--text3)">${k}</span>
        <span style="font-size:11px;font-family:var(--mono);color:var(--teal);font-weight:700">${v}</span>
      </div>`).join('')}
      <button onclick="switchTopTab('engineering',document.getElementById('ttab-engineering'));showSec('targets',document.querySelector('.nb'))"
        style="margin-left:auto;padding:3px 9px;background:rgba(74,158,255,.1);border:1px solid rgba(74,158,255,.3);color:var(--b);border-radius:5px;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0">✏ Edit Targets</button>
    </div>
  </div>

  <div id="bt_body">
    <div class="bt-hdr">
      <div class="bt-hdr-icon">${cat.icon}</div>
      <div>
        <div style="font-family:var(--display);font-size:17px;font-weight:700;color:var(--text)">${cat.label} Testing</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">Calculated parameters · Test matrix · Standards · Equipment</div>
      </div>
    </div>
    ${bt_renderCat(catId, ctx)}
  </div>
</div>`;

  requestAnimationFrame(() => { try { bt_drawCharts(catId, ctx); } catch(e) {} });
};


function bt_renderCat(id, c) {
  switch(id) {
    case 'electrical':    return bt_electrical(c);
    case 'thermal':       return bt_thermal(c);
    case 'performance':   return bt_performance(c);
    case 'environmental': return bt_environmental(c);
    case 'mechanical':    return bt_mechanical(c);
    case 'abuse':         return bt_abuse(c);
    case 'emi_emc':       return bt_emi_emc(c);
    case 'certification': return bt_certification(c);
    case 'equipment':     return bt_equipment(c);
    default: return '<div>Select a category</div>';
  }
}

/* ── Helper: calc row ── */
function btr(label, formula, result, unit, note='') {
  return `<div class="bt-calc-row">
    <span class="bt-calc-label">${label}</span>
    <span class="bt-calc-formula">${formula}</span>
    <span class="bt-calc-val">${result}<span class="bt-calc-unit">${unit}</span></span>
    ${note?`<span style="font-size:10px;color:var(--text3)">${note}</span>`:''}
  </div>`;
}

function btCard(title, std, body, tip, warn, crit) {
  const stdBadge = `<span class="bt-std" style="cursor:pointer;color:var(--b);border-color:rgba(74,158,255,.25);background:rgba(74,158,255,.06)"
    onclick="switchTopTab('standards',document.getElementById('ttab-standards'))">📜 Standards ref</span>`;
  return `<div class="bt-card" style="height:100%;box-sizing:border-box">
    <div class="bt-card-title">${title}</div>
    ${stdBadge}
    <div style="font-size:12px;color:var(--text2);line-height:1.7">${body}</div>
    ${tip  ?`<div class="bt-tip">💡 ${tip}</div>`:''}
    ${warn ?`<div class="bt-warn">⚠ ${warn}</div>`:''}
    ${crit ?`<div class="bt-crit">🚨 ${crit}</div>`:''}
  </div>`;
}

/* ════════════════════════
   ⚡ ELECTRICAL
   ════════════════════════ */
function bt_electrical(c) {
  const R_pack = c.ir_bol * c.S_total / c.c_pp;
  const Vdrop  = R_pack * 1e-3 * c.imax;
  const Vdrop_pct = (Vdrop/c.vnom*100).toFixed(1);
  const Q_ir   = Math.pow(c.imax,2) * R_pack * 1e-3;
  const cap_ah = (c.egross*1000/c.vnom).toFixed(1);
  const Eout   = c.egross * 0.97;
  const eta    = (Eout/c.egross*100).toFixed(1);
  const IR_ins_min = c.vmax * 100;

  return `
<div class="bt-section-title">📐 Calculated Test Parameters</div>
<div class="card" style="margin-bottom:16px">
  ${btr('Pack capacity (test Ah)',         `${c.egross}kWh × 1000 ÷ ${c.vnom}V`,  cap_ah,       'Ah')}
  ${btr('Peak C-rate',                     `${c.imax}A ÷ ${cap_ah}Ah`,             (c.imax/+cap_ah).toFixed(3), 'C')}
  ${btr('Pack DCIR BoL (25°C/50%SoC)',     `${c.ir_bol}mΩ × ${c.S_total}/${c.c_pp}`, R_pack.toFixed(1), 'mΩ')}
  ${btr('Peak ΔV (I²R drop)',             `${R_pack.toFixed(0)}mΩ × ${c.imax}A`, `${Vdrop.toFixed(1)}V (${Vdrop_pct}%)`, '')}
  ${btr('I²R heat @ peak current',        `${c.imax}² × ${R_pack.toFixed(0)}mΩ`, (Q_ir/1000).toFixed(2), 'kW')}
  ${btr('Insulation resistance min',      `100 Ω/V × ${c.vmax}V`,                (IR_ins_min/1000).toFixed(0), 'kΩ', 'per applicable standard')}
  ${btr('Round-trip efficiency (est.)',   'E_out / E_in',                          eta, '%')}
</div>

<div class="bt-section-title">⚡ Key Formula Reference</div>
<div class="g2" style="margin-bottom:16px">
  <div>
    <div class="bt-formula">V = I × R &nbsp;·&nbsp; P = V × I &nbsp;·&nbsp; E = ∫V·I dt</div>
    <div class="bt-formula">DCIR = ΔV / ΔI &nbsp;(10s pulse at 50%SoC, 25°C)</div>
    <div class="bt-formula">η = E_out / E_in &nbsp;·&nbsp; SoC = ∫I dt / Q_nominal</div>
    <div class="bt-formula">R_pack = R_cell × S / P &nbsp;·&nbsp; ΔV = I × R_pack</div>
    <div class="bt-formula">Q_gen = I² × R_pack &nbsp;[Watts]</div>
  </div>
  <div>
    <div class="bt-formula">C_rate = I / C_nominal &nbsp;[h⁻¹]</div>
    <div class="bt-formula">SoH = C_actual / C_initial × 100%</div>
    <div class="bt-formula">per applicable standard = V_pack × 100 Ω/V &nbsp;(min ${IR_ins_min/1000}kΩ)</div>
    <div class="bt-formula">P_max = V × I_cell_max × n_cells</div>
    <div class="bt-formula">Hi-pot: V_test = 2×V_max + 1000 V AC (${(2*c.vmax+1000).toFixed(0)}V)</div>
  </div>
</div>

<div class="bt-section-title">🧪 Test Matrix</div>
<div class="bt-cols">
  ${btCard('Capacity & Energy (CC-CV discharge)', '',
    `Discharge at C/3 from ${c.vmax}V → ${c.vmin}V at 25°C, 0°C, 45°C. 3 stabilisation cycles. Target ≥ ${cap_ah} Ah, ${c.egross} kWh.`,
    'Use calibrated ±0.1% shunt. Log voltage, current, temperature at 1Hz minimum.',
    `${c.chem}: ≥ ${(+cap_ah*0.95).toFixed(0)} Ah at 0°C expected. Flag if <90% of 25°C capacity.`)}

  ${btCard('DCIR - 10s Pulse Method', '',
    `1C pulse (${c.imax.toFixed(0)}A) for 10s from 50%SoC. DCIR = ΔV/ΔI. Test at -20°C, -10°C, 0°C, 10°C, 25°C, 45°C, 55°C and SoC 0/20/50/80/100%.`,
    `Sample at 10ms resolution during pulse. Log pre-pulse OCV and post-pulse relaxation voltage.`,
    'Upload results to DCIR Map tab to generate full heatmap.')}

  ${btCard('Insulation Resistance (IR Test)', '',
    `500V DC insulation tester between all HV conductors and chassis. Min ${(IR_ins_min/1000).toFixed(0)} kΩ (100 Ω/V × ${c.vmax}V). Test before and after water ingress, vibration, thermal cycle.`,
    undefined,
    `Result < 50 Ω/V = CRITICAL FAIL - electrocution risk. Do not continue testing.`)}

  ${btCard('Dielectric Withstand (Hi-Pot)', '',
    `Apply ${(2*c.vmax+1000).toFixed(0)}V AC (or ${(1.4*(2*c.vmax+1000)).toFixed(0)}V DC) for 60s between HV and chassis. Zero breakdown allowed. Pre-condition at 40°C/93%RH for 24h.`,
    'Ramp voltage at 500V/s. Monitor leakage current - alarm at >1mA.`')}

  ${btCard('HV Interlock Loop (HVIL)', '',
    `Verify HVIL circuit opens within 200ms of connector separation. Contactors must de-energise. No HV access possible when HVIL open. Test all connector states.`)}

  ${btCard('BMS Overvoltage Protection', '',
    `Force cell to ${c.vcell_max+0.1}V. BMS must trip contactor within 500ms. No venting. Pack OVP threshold: ${(c.vcell_max+0.02).toFixed(3)}V/cell = ${((c.vcell_max+0.02)*c.S_total).toFixed(1)}V pack.`)}

  ${btCard('LV System Validation (12/24V)', '',
    `Normal: 9–16V (12V system). Cranking: 6V for 40ms. Load dump: 24V for 400ms. BMS must remain functional. Test at -40°C and +85°C.`,
    'Verify BMS wakeup at 6V cranking voltage - MCU brownout common failure mode.')}

  ${btCard('Self-Discharge', '',
    `Charge to 100%SoC. Rest 30 days at 25°C. Measure remaining SoC. Target <3%/month loss.`,
    'Log individual cell voltages via BMS - outlier cell (>2× average loss) indicates leakage path.')}
</div>

`;  // ACIR/EIS section removed
}

/* ════════════════════════
   🌡️ THERMAL
   ════════════════════════ */
function bt_thermal(c) {
  const Q_gen = Math.pow(c.imax,2) * c.ir_bol * c.S_total / c.c_pp * 1e-3;
  const R_pack = c.ir_bol * c.S_total / c.c_pp;
  const mass_est = c.ah * c.S_total * c.c_pp * 2.8 / 1000;  // rough kg
  const Cp_est   = 1000; // J/kg·K
  const dTdt_adiab = Q_gen / (mass_est * Cp_est) * 60; // °C/min
  const flow_est    = Q_gen / (3400 * 1.07 / 60 * 10); // ΔT=10°C, 1.07kg/L, Cp=3400

  return `
<div class="bt-section-title">📐 Thermal Calculations</div>
<div class="card" style="margin-bottom:16px">
  ${btr('I²R heat generation @ I_peak',    `${c.imax}² × ${R_pack.toFixed(0)}mΩ`,           (Q_gen/1000).toFixed(2),     'kW')}
  ${btr('Adiabatic T-rise rate (no TMS)',  `Q/(m×Cp) = ${(Q_gen).toFixed(0)}W÷(${mass_est.toFixed(0)}kg×${Cp_est}J/kg·K)`, dTdt_adiab.toFixed(2), '°C/min', 'no cooling')}
  ${btr('Coolant flow needed (ΔT=10°C)',   `Q/(ρ×Cp×ΔT) = ${(Q_gen/1000).toFixed(1)}kW`,     flow_est.toFixed(1),         'L/min')}
  ${btr('TMS activation threshold',        `T_cell > T_derate - 10°C`,                        `${c.tcell-10}°C`,            '')}
  ${btr('Thermal runaway onset (typical)', 'Chemistry dependent',                              `${c.chem==='LFP'?130:180}°C`, '', `${c.chem} cell`)}
  ${btr('Hi-pot pre-condition (humidity)', '40°C / 93% RH / 24h',                             '40°C + 93%RH',               '', 'per applicable standard')}
</div>

<div class="bt-section-title">📈 Key Thermal Formulae</div>
<div class="g2" style="margin-bottom:16px">
  <div>
    <div class="bt-formula">Q_gen = I² × R_pack &nbsp;[W]</div>
    <div class="bt-formula">Q_cooling = ṁ × Cp × ΔT &nbsp;[W]</div>
    <div class="bt-formula">ṁ = flow[L/min] × 1.07[kg/L] / 60</div>
    <div class="bt-formula">dT/dt = Q_gen / (m × Cp) &nbsp;[°C/s]</div>
  </div>
  <div>
    <div class="bt-formula">ΔT_pack = T_cell_max - T_ambient</div>
    <div class="bt-formula">Thermal resistance: R_th = ΔT / Q</div>
    <div class="bt-formula">TRP time = (T_tr - T_cell) × m × Cp / Q_excess</div>
    <div class="bt-formula">Cooling efficiency: η_cool = Q_removed / Q_gen</div>
  </div>
</div>

<div class="bt-section-title">🧪 Test Matrix</div>
<div class="bt-cols">
  ${btCard('Cell Temperature Distribution', '',
    `1C continuous discharge. Map T_cell via TC array (min 8 TCs: centre, edge, near inlet/outlet). ΔT_pack target ≤ ${c.tcell>55?5:8}°C. Identify hotspot location.`,
    'Place IR camera above pack for 2D thermal mapping. Log at 1Hz minimum.')}

  ${btCard('TMS Cooling Performance','',
    `At P_cont = ${c.pcont}kW, coolant inlet = ${c.top_hi}°C, verify T_cell_max < ${c.tcell}°C at steady state within 60min. Measure coolant ΔT across pack.`,
    `Coolant flow needed ≈ ${flow_est.toFixed(0)} L/min for this pack based on ${(Q_gen/1000).toFixed(1)}kW I²R heat.`)}

  ${btCard('Cold Soak Start-Up', '',
    `Soak at ${c.top_lo}°C for 8h. Immediate 1C discharge. Verify BMS cold-derating, TMS pre-heat. Monitor DCIR - expect ${c.top_lo<=-20?'4–8×':'2–3×'} nominal.`,
    `${c.chem === 'LFP' ? 'LFP: flat OCV at low T makes SoC estimation unreliable - use Ah-count only below 5°C.' : 'NMC: lithium plating risk below 0°C charge. Limit to C/10 below 0°C.'}`)}

  ${btCard('Thermal Runaway Propagation', '',
    `Trigger single-cell TR (nail or resistive heater). Monitor propagation. Pack must not explode. Occupant warning within 5 min. No sustained fire (GB 38031: 5min minimum).`,
    undefined, undefined,
    'Highest criticality test. Requires blast shield, gas monitoring, fire suppression standby. Notify lab minimum 2 weeks ahead.')}

  ${btCard('Cooling Plate Efficiency','',
    `Measure T_cell_in vs T_cell_out across cooling plate at 3 flow rates (50%, 100%, 150% of design). Verify ΔT < 5°C across plate at design flow. Map with TC grid.`)}

  ${btCard('Chiller / HVAC Integration','',
    `Full vehicle TMS test. Verify chiller duty cycle at ${c.top_hi}°C ambient, 100% pack load. Cell T_max < ${c.tcell}°C. Log compressor current, refrigerant P&T, cell T.`)}
</div>

<canvas id="bt_therm_canvas" height="200" style="width:100%;display:block;border-radius:8px;background:var(--bg);margin-top:12px"></canvas>`;
}

/* ════════════════════════
   🚀 PERFORMANCE
   ════════════════════════ */
function bt_performance(c) {
  const t10_80 = ((c.euse*0.7) / (c.ppeak*0.8) * 60).toFixed(0);
  const soc_est = (q, v) => ((v - c.vcell_min*c.S_total) / ((c.vcell_max - c.vcell_min)*c.S_total) * 100).toFixed(1);

  return `
<div class="bt-section-title">📐 Performance Calculations</div>
<div class="card" style="margin-bottom:16px">
  ${btr('10→80% charge time (est.)',  '0.7×E_use ÷ (0.8×P_peak)',      t10_80,                   'min')}
  ${btr('Specific energy (gross)',    `${c.egross}kWh × 1000 ÷ pack_mass`, '- (fill Cell mass)', 'Wh/kg')}
  ${btr('Peak C-rate discharge',      `${c.imax}A ÷ ${c.qpack}Ah`,      (c.imax/c.qpack).toFixed(3), 'C')}
  ${btr('Cont. C-rate discharge',     `${c.icont}A ÷ ${c.qpack}Ah`,     (c.icont/c.qpack).toFixed(3), 'C')}
  ${btr('Charge C-rate (DC)',         `${c.ichg}A ÷ ${c.qpack}Ah`,      (c.ichg/c.qpack).toFixed(3), 'C')}
  ${btr('Regen headroom @90%SoC',    `DoD × 10% head`,                  ((1-(window.S?.t_dod||0.9))*100+10).toFixed(0), '% SoC margin')}
</div>

<div class="bt-section-title">📈 SoC / SoH Formulae</div>
<div class="g2" style="margin-bottom:16px">
  <div>
    <div class="bt-formula">SoC(t) = SoC₀ - ∫₀ᵗ (I/Q_nom) dt</div>
    <div class="bt-formula">SoH = C_meas / C_rated × 100%</div>
    <div class="bt-formula">DoD = 1 - SoC_min &nbsp;[fraction]</div>
    <div class="bt-formula">HPPC: P_pulse = V × I_pulse &nbsp;[at 10s]</div>
  </div>
  <div>
    <div class="bt-formula">OCV → SoC via lookup table (cell-specific)</div>
    <div class="bt-formula">EoL: SoH ≤ ${c.soh_eol}% or IR ≥ 2× initial</div>
    <div class="bt-formula">Cycle life estimated via Arrhenius: T↑10°C → 2× ageing</div>
    <div class="bt-formula">Autonomy = E_usable × SoH / P_avg_net</div>
  </div>
</div>

<div class="bt-section-title">🧪 Test Matrix</div>
<div class="bt-cols">
  ${btCard('Peak Power (HPPC)', '',
    `10s pulse at ${c.imax}A from 80%SoC, 25°C. Measure V_term. P_avail = V_term × I. Must deliver ≥ ${(c.ppeak*0.95).toFixed(0)}kW. Repeat at -10°C.`,
    'Run at 10%, 20%, 50%, 80%, 90% SoC for full power-SoC map. Use for BMS power limit table.')}

  ${btCard('Usable Energy & Autonomy', '',
    `Drive application duty cycle until BMS cutoff. Record kWh discharged. E_usable ≥ ${c.euse} kWh. Calculate autonomy = E_usable ÷ P_avg.`)}

  ${btCard('OCV vs SoC Mapping','',
    `Charge fully. Discharge in C/25 steps (pseudo-OCV). Record V at 0/10/20/30/50/70/80/90/100% SoC. Use at -10°C, 25°C, 45°C. Upload to Cell tab OCV section.`)}

  ${btCard('DC Fast Charge Performance','',
    `10→80% SoC charge. Target ${t10_80} min. Record E_in, E_out, efficiency, max cell ΔT. Test at 25°C and 0°C. Log CC→CV transition point.`)}

  ${btCard('Regenerative Braking Acceptance', '',
    `Inject regen profile at 90%SoC. Verify no OVP trip. Max regen ≈ ${(c.ppeak*0.4).toFixed(0)}kW. Measure accepted energy fraction.`)}

  ${btCard('SoC Estimation Accuracy', '',
    `Drive WLTP/application cycle. Compare BMS-reported SoC vs Ah-count reference. Target: ±3% RMS over 10–90% SoC window. Test at 0°C and 40°C.`,
    'Inject step-change load at 50%SoC - BMS SoC jump indicates algorithm failure.')}
</div>`;
}

/* ════════════════════════
   🌍 ENVIRONMENTAL
   ════════════════════════ */
function bt_environmental(c) {
  return `
<div class="bt-section-title">🌍 Environmental Test Calculations</div>
<div class="card" style="margin-bottom:16px">
  ${btr('Thermal cycling range',    'T_op_lo → T_op_hi',         `${c.top_lo} → ${c.top_hi}°C`, '')}
  ${btr('IP Water jet (IPX5/6)',    'Flow rate per nozzle',       '12.5 L/min', '', `${c.ip}`)}
  ${btr('IP Immersion (IPX7)',      'Depth × duration',           '1m × 30min', '', 'per applicable standard')}
  ${btr('Alt. pressure (4000m)',    '101.3 × (1-0.0226×4)^5.256','61.6 kPa', '', 'per applicable standard.1')}
  ${btr('Salt fog concentration',   'NaCl in deionised water',    '5% ± 1%', '', 'per applicable standard')}
  ${btr('Humidity spec',           '40°C / 93% RH / 240h',       '40°C + 93%', '', 'per applicable standard')}
</div>

<div class="bt-section-title">🧪 Test Matrix</div>
<div class="bt-cols">
  ${btCard('Thermal Cycling (Storage)', '',
    `${c.top_lo}°C → ${c.top_hi}°C, 2°C/min ramp, 30min dwell each extreme. 500 cycles minimum. Post-test: capacity, IR, isolation. Inspect seal integrity.`,
    'Pause at cycle 100 for intermediate capacity check - early degradation visible.')}

  ${btCard('IP Rating Verification', '',
    `${c.ip} target: IP6X (dust) - 8h vacuum test; IPX7 - 1m immersion 30min. Post-test: isolation ≥ 100Ω/V (${(c.vmax*100/1000).toFixed(0)}kΩ min).`)}

  ${btCard('Humidity Endurance', '',
    `40°C / 93%RH, 240h (10 days). Post-test: isolation resistance, no corrosion on busbars, connectors dry. For tropical markets: extend to 500h.`,
    `Market: ${c.markets.includes('IN')||c.markets.includes('INDIA')?'IN confirmed - tropical class applicable.':'Check monsoon exposure for application.'}`)}

  ${btCard('Altitude Simulation', '',
    `Simulate 4000m (61.6 kPa) for 6h. No seal pop, no outgassing. HV arc gap increases at altitude - creepage distances must be verified for ${c.vmax}V at 4000m.`)}

  ${btCard('Salt Fog / Corrosion', '',
    `5% NaCl, 96h. Post-test: isolation ≥ 100Ω/V. No connector corrosion. Critical for ${['Bus','Truck','4W'].includes(c.app)?'road splash exposure':'exposed pack mounting'}.`)}

  ${btCard('Chemical Resistance', '',
    `Expose to: engine oil, brake fluid, battery acid, cleaning agents (24h contact). No seal compromise. Inspect labelling legibility.`)}
</div>`;
}

/* ════════════════════════
   🔩 MECHANICAL
   ════════════════════════ */
function bt_mechanical(c) {
  const vibProfile = ['Excavator','WheelLoader','AgTractor','Truck'].includes(c.app)
    ? 'per applicable standard Profile IV (off-highway)' : 'per applicable standard Profile I/II (road)';
  const crushForce = Math.max(100, c.egross * 3).toFixed(0);

  return `
<div class="bt-section-title">📐 Mechanical Calculations</div>
<div class="card" style="margin-bottom:16px">
  ${btr('Crush force',    `${c.egross?.toFixed?.(1)||43}kWh × 3 kN/kWh`,  crushForce,  'kN')}
  ${btr('Vibration profile',          'Application type',           vibProfile,  '')}
  ${btr('Shock severity',             'Half-sine 30g / 11ms',       '30g · 11ms','', 'per applicable standard')}
  ${btr('Drop height',                'per applicable standard',                '1.0m',      '', '6 faces + 2 edges')}
  ${btr('Post-test isolation min',    '100 Ω/V × V_max',           (c.vmax*100/1000).toFixed(0)+'kΩ','')}
</div>

<div class="bt-section-title">🧪 Test Matrix</div>
<div class="bt-cols">
  ${btCard('Random Vibration',vibProfile,
    `3-axis, 5–200Hz, 0.01–1.0g²/Hz, 8–21h per axis. Monitor for leakage, connectivity loss, BMS fault.`,
    'Post-test: full capacity check + IR + isolation. Any >3% capacity drop = FAIL.')}

  ${btCard('Mechanical Shock', '',
    `Half-sine 30g / 11ms, 3 axes ± (18 pulses total). No damage, no BMS fault, no leakage. Isolation ≥ 100Ω/V post-test.`)}

  ${btCard('Crush / Deformation', '',
    `${crushForce}kN or 30% deformation or 25% voltage drop - whichever first. Charged state (100%SoC). No fire, no explosion.`,
    undefined, undefined, 'Requires specialist crush rig. Blast-proof cell mandatory.')}

  ${btCard('Drop Test', '',
    `1.0m onto concrete: 6 faces + 2 edges. Inspect leakage, deformation. Isolation ≥ 100Ω/V. Full functional check post-drop.`)}

  ${btCard('Nail Penetration', '',
    `3mm steel nail at 80mm/s through largest cell face. 100%SoC. T_cell < 500°C at penetration point. No fire, no explosion.`,
    `${c.chem}LFP: typically passes without fire. NMC: thermal runaway risk - verify TRP propagation.`,undefined,
    `${c.chem.includes('NMC')?'⚠ NMC: Pre-alert lab. TRP propagation test may be required immediately after.':''}`)}

  ${btCard('Mounting & Fatigue','',
    `1.5× design torque on all mounting points. 10⁶ cycles at ±50% design load. No crack, no loosening, no BMS fault.`)}
</div>`;
}

/* ════════════════════════
   💥 ABUSE
   ════════════════════════ */
function bt_abuse(c) {
  return `
<div class="bt-section-title">💥 Abuse Test Calculations</div>
<div class="card" style="margin-bottom:16px">
  ${btr('Overcharge voltage',       `1.2 × V_max = 1.2 × ${c.vmax}V`, (1.2*c.vmax).toFixed(0), 'V pack')}
  ${btr('Short-circuit test R',     'External resistance',             '5 mΩ', '', 'per applicable standard')}
  ${btr('BMS interrupt time',       'From short detected to open',     '≤ 500 ms', '')}
  ${btr('TR warning time (GB38031)','Occupant evacuation time',        '≥ 5 min', '')}
  ${btr('Over-discharge voltage',   'Force to 0V per cell',           '0V', '', 'per applicable standard §7.3.3')}
</div>

<div class="bt-section-title">🧪 Test Matrix</div>
<div class="bt-cols">
  ${btCard('Overcharge', '',
    `Charge at 1C to 1.2×V_max (${(1.2*c.vmax).toFixed(0)}V). BMS must disconnect before venting. No fire, no explosion. Gas sensor monitoring.`,
    undefined, undefined, 'Highest thermal risk test. Fume extraction + fire suppression standby mandatory.')}

  ${btCard('Over-Discharge', '',
    `Force discharge to 0V/cell. BMS must trip at V_min (${c.vcell_min}V/cell). Post-test: charge to 50%SoC - no gas. ${c.chem} copper dissolution risk monitored.`)}

  ${btCard('External Short Circuit', '',
    `Short via 5mΩ at 100%SoC and 60°C. BMS must interrupt within 500ms. No fire, no explosion, no sustained arc. Fuse must clear I_sc.`,
    'Use fusible link + current clamp to verify peak short-circuit current ≤ fuse interrupt rating.')}

  ${btCard('Thermal Runaway Propagation', '',
    `Single-cell trigger. Monitor propagation. Warning to occupant within 5 min. No explosion for ≥ 5 min. Gas analysis during and after.`,
    undefined, undefined, 'Mandatory for EU/CN/US market approval. Test in explosion-proof facility.')}

  ${btCard('Forced Thermal Runaway (nail)', '',
    `Nail penetration per Mechanical test. Monitor propagation to adjacent cells. All certification markets require this or equivalent trigger method.`)}

  ${btCard('Fire Resistance (FMVSS 305)', '',
    `Expose pack to standardised fire (propane/fuel pool). Pack must not explode. Electrolyte containment required. US market only.`)}
</div>`;
}

/* ════════════════════════
   📡 EMI/EMC
   ════════════════════════ */
function bt_emi_emc(c) {
  return `
<div class="bt-section-title">📡 EMI/EMC Test Parameters
  <span style="font-size:10px;font-family:var(--mono);color:var(--text3);font-weight:400;margin-left:8px">
    Limits and severity levels are market-specific - link from
    <span onclick="try{switchTopTab('standards',document.getElementById('ttab-standards'))}catch(e){}"
      style="color:var(--b);cursor:pointer;text-decoration:underline">Standards tab</span>
  </span>
</div>
<div class="card" style="margin-bottom:16px">
  ${btr('Radiated emissions', 'Market: ' + c.markets, 'See Standards tab', '', 'class per market')}
  ${btr('ESD air discharge',   '', 'See Standards tab', '')}
  ${btr('ESD contact discharge','', 'See Standards tab', '')}
  ${btr('Load dump (LV bus)',   '', 'See Standards tab', '')}
  ${btr('BCI injection level',  '', 'See Standards tab', '')}
  ${btr('Conducted emissions',  '', 'See Standards tab', '')}
</div>

<div class="bt-section-title">🧪 Test Matrix</div>
<div class="bt-cols">
  ${btCard('Radiated Emissions', '',
    `Measure RF from BMS/DC-DC during discharge cycle at system level. Test in semi-anechoic chamber with vehicle harness simulator. Limits from Standards tab.`,
    'BMS PWM frequencies (20–200kHz) generate harmonics - EMI filter on BMS supply line recommended.')}

  ${btCard('Bulk Current Injection (BCI)', '',
    `RF injection onto HV cable harness over 1–400MHz. No false OVP/UVP trip, no CAN error frame during injection. Severity level per market standard.`)}

  ${btCard('ESD Immunity', '',
    `Test all exposed connectors and mounting points. No permanent damage, no BMS reset. Latch-up recovery &lt; 5s. Level per market standard.`)}

  ${btCard('Load Dump', '',
    `LV bus transient. No damage to BMS, BCM, LV circuits. Transient suppressor response &lt; 1μs. Voltage/duration per applicable standard.`)}

  ${btCard('Conducted Emissions (LV)', '',
    `Measure conducted noise on 12V LV bus from DC-DC converter. Add common-mode choke if over limit. Limits from Standards tab.`)}

  ${btCard('Surge Immunity', '',
    `Line-to-earth and line-to-line on power inputs. No damage, no functional failure. Pulse count and levels per applicable standard.`)}
</div>

<!-- Frequency sweep canvas -->
<div class="bt-section-title">📊 EMI Frequency Sweep Concept</div>
<canvas id="bt_emi_canvas" height="180" style="width:100%;display:block;border-radius:8px;background:var(--bg);margin-bottom:12px"></canvas>`;
}

/* ════════════════════════
   🏅 CERTIFICATION
   ════════════════════════ */
function bt_certification(c) {
  const mkts = c.markets;
  const eu = mkts.includes('EU');
  const us = mkts.includes('US');
  const cn = mkts.includes('CN') || mkts.includes('CHINA');
  const in_ = mkts.includes('IN') || mkts.includes('INDIA');
  const isOH = ['Excavator','WheelLoader','AgTractor','Truck'].includes(c.app);

  // Certification requirements - dynamic from project markets
  // Specific clause numbers and test levels link to Standards tab
  const reqs = [
    {reg:'Transport Safety',     body:'UN',    scope:'Transport (all markets)', mandatory:true,  note:'All markets. Cell + pack level. See Standards tab for test sequence.'},
    {reg:'Traction Battery Safety', body:'IEC', scope:'Safety for traction/stationary', mandatory:true, note:'Required for CE. See Standards tab for applicable version.'},
    eu ?{reg:'EU EV REESS',      body:'UNECE', scope:'EU market - EV REESS',     mandatory:true,  note:'Part I: electrical safety. Part II: isolation, TR. Standards tab.'}:null,
    us ?{reg:'EV Battery (US)',   body:'UL/NHTSA', scope:'US market',            mandatory:true,  note:'UL + FMVSS requirements. Standards tab for details.'}:null,
    cn ?{reg:'EV Battery (CN)',   body:'MIIT',  scope:'China mandatory',          mandatory:true,  note:'TR propagation requirements. GB standards - see Standards tab.'}:null,
    in_?{reg:'EV Battery (IN)',   body:'MoRTH', scope:'India - automotive EV',   mandatory:true,  note:'AIS standards. See Standards tab.'}:null,
    isOH?{reg:'Functional Safety', body:'ISO',  scope:'Off-highway FuSa',        mandatory:true,  note:`FuSa level: ${c.ip}. BMS safety function. Standards tab.`}:null,
    {reg:'Cell-level Safety',    body:'IEC',   scope:'Li cell safety',           mandatory:false, note:'Cell-level cert. Often required by OEM procurement.'},
    {reg:'Global Technical Reg', body:'UN',    scope:'EVS-GTR - global',         mandatory:eu,    note:'TR warning mandatory. Standards tab.'},
  ].filter(Boolean);

  const rows = reqs.map(r=>`<tr style="${r.mandatory?'background:rgba(0,212,170,.03)':''}">
    <td style="font-weight:700;font-size:12px;color:${r.mandatory?'var(--g)':'var(--text2)'}">${r.reg}</td>
    <td style="font-size:11px">${r.body}</td>
    <td style="font-size:11px">${r.scope}</td>
    <td style="text-align:center">${r.mandatory?'<span style="color:var(--g);font-weight:700">✓ REQ</span>':'<span style="color:var(--text3)">Optional</span>'}</td>
    <td style="font-size:11px;color:var(--text3)">${r.note}</td>
  </tr>`).join('');

  return `
<div class="bt-section-title">🏅 Required Certifications - ${mkts}
  <span style="font-size:10px;font-family:var(--mono);color:var(--text3);font-weight:400;margin-left:8px">
    Specific standards, revisions and test levels →
    <span onclick="try{switchTopTab('standards',document.getElementById('ttab-standards'))}catch(e){}"
      style="color:var(--b);cursor:pointer;text-decoration:underline">Standards tab</span>
  </span>
</div>
<div style="overflow-x:auto;margin-bottom:16px">
<table class="res-tbl">
  <thead><tr><th>Requirement</th><th>Body</th><th>Scope</th><th>Status</th><th>Notes</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
</div>

<div class="bt-section-title">📋 Transport Safety Test Sequence (Mandatory - All Markets)</div>
<div class="bt-cols">
  ${['T1: Altitude simulation','T2: Thermal cycling','T3: Vibration (3 axes)','T4: Shock (3 axes)','T5: External short circuit','T6: Impact/crush','T7: Overcharge','T8: Forced discharge'].map((t,i)=>`
    <div class="bt-card" style="padding:12px">
      <div style="font-size:11px;font-weight:700;color:var(--b)">${t}</div>
      <div style="font-size:10px;color:var(--text3);margin-top:4px">
        Sequential - must pass all 8. Cell + pack level separately.
        <span onclick="try{switchTopTab('standards',document.getElementById('ttab-standards'))}catch(e){}"
          style="color:var(--b);cursor:pointer">See Standards tab for limits.</span>
      </div>
    </div>`).join('')}
</div>

<div class="ico-banner" style="margin-top:14px">
  📌 Markets: ${mkts} · Certification path based on project targets.
  Full standard details, revision years and clause references are in the
  <span onclick="try{switchTopTab('standards',document.getElementById('ttab-standards'))}catch(e){}"
    style="color:var(--b);cursor:pointer;font-weight:700">Standards tab →</span>
</div>`;
}

/* ════════════════════════
   🧰 EQUIPMENT
   ════════════════════════ */
function bt_equipment(c) {
  const sections = [
    { title:'⚡ Electrical Test Equipment', color:'#4a9eff', items:[
      'Battery cycler - Arbin BT2000, Bitrode FTF, AVL E-Storage (4Q)',
      `HV power supply - 0–${Math.max(1000,c.vmax+100)}V DC, ${c.imax}A+ capability`,
      'Electronic load - programmable CC/CV/CR/CP modes',
      'Precision current shunt - ±0.1% accuracy, 4-wire Kelvin',
      'Oscilloscope - 4ch, ≥200MHz, isolated probes (1kV rated)',
      'Data acquisition (DAQ) - NI cDAQ or similar, ≥16ch, 1kHz min',
      'Insulation tester (Megger) - 500V / 1000V DC output',
      'Hi-pot tester - AC up to 5kV, DC up to 7kV',
      'CAN/LIN analyser - Vector CANalyzer, PEAK PCAN',
      'Calibration tools - INCA, CANoe for BMS calibration',
    ]},
    { title:'🔴 HV Safety Equipment', color:'#ef4444', items:[
      `HV insulated gloves - Class 00/0 (≤${c.vmax}V), leather protectors`,
      'Full face shield - arc flash rated ≥ 8 cal/cm²',
      'Lockout-Tagout (LOTO) - lockout hasps + lockout tags',
      'HV warning signs - EN per applicable standard W012 (lightning bolt)',
      'Rescue hook - non-conductive fibreglass, 1.2m minimum',
      'Portable HV voltmeter - CAT III 1000V rated',
      'Anti-static mat + wrist strap - ESD work area',
      'Emergency stop button - accessible from outside test cell',
    ]},
    { title:'🌡️ Thermal & Cooling Equipment', color:'#ff7b35', items:[
      `Thermal chamber - ${c.top_lo}°C to ${Math.max(c.top_hi,85)}°C, ±1°C accuracy`,
      'Coolant test loop - variable flow 0–30 L/min, glycol-water circuit',
      'Flow meters - Coriolis or turbine, ±0.5% accuracy',
      `Thermal imaging camera - FLIR T860 or A655, ≥0.05°C resolution`,
      'K-type thermocouples - ±1°C, min 8 channels per module',
      'Chiller unit - programmable T_in, −40°C to +80°C range',
      'Pressure sensors - coolant inlet/outlet, 0–5 bar absolute',
    ]},
    { title:'🔩 Mechanical & Environmental', color:'#6d8fba', items:[
      'Vibration shaker - 3-DOF or 6-DOF, 50kN+ force, 5–2000Hz',
      'Shock test machine - up to 150g, programmable pulse shape',
      'Drop test rig - guided fall from 1.0m, all face/edge configurations',
      `IP test chamber - IP6X dust, IPX7 water immersion (1m/30min)`,
      'Salt spray chamber - 5% NaCl, 35°C, programmable duration',
      'Humidity chamber - 10–95%RH, −40°C to +120°C',
      'Crush/nail penetration rig - 100kN hydraulic, blast shield',
    ]},
    { title:'💥 Abuse Testing Setup', color:'#ef4444', items:[
      'Explosion-proof test cell - blast-rated walls, pressure relief',
      'Gas analysis system - CO, CO₂, H₂, HF monitoring',
      'Fire suppression system - CO₂ or dry powder, auto-trigger',
      'High-speed camera - ≥1000fps for arc/venting capture',
      'Fume extraction - negative pressure, HF-rated scrubber',
      'Remote monitoring - all data logged via isolated DAQ',
    ]},
    { title:'📡 EMI/EMC Equipment', color:'#a78bfa', items:[
      'Semi-anechoic chamber - 3m or 10m range, 30MHz–1GHz min',
      'EMI receiver / spectrum analyser - R&S FSW or Keysight',
      'LISN - Line Impedance Stabilisation Network, 50μH',
      'ESD gun - Teseq NSG435, ±30kV, contact + air modes',
      'BCI clamp - Teseq CBA 400, 1–400MHz',
      'Antenna set - biconical, log-periodic, horn (30MHz–18GHz)',
      'EMI pre-compliance scanner - for lab pre-screening',
    ]},
  ];

  return sections.map(s=>`
    <div class="bt-sec-hdr" style="color:${s.color}">${s.title}</div>
    <div class="bt-card" style="margin-bottom:12px">
      <ul style="margin:0;padding-left:16px;line-height:2">
        ${s.items.map(i=>`<li style="font-size:12px;color:var(--text2)">${i}</li>`).join('')}
      </ul>
    </div>`).join('');
}

/* ════════════════════════
   📜 GLOBAL STANDARDS
   ════════════════════════ */


/* ── Canvas chart renderer ── */
function bt_drawCharts(catId, c) {
  if (catId === 'electrical') {
    const cv = document.getElementById('bt_elec_canvas');
    if (!cv) return;
    const W=cv.offsetWidth||700, H=180;
    cv.width=W; cv.height=H;
    const ctx=cv.getContext('2d');
    /* Nyquist sketch */
    const R0=c.ir_bol*0.55*c.S_total/c.c_pp;
    const Rct=c.ir_bol*0.38*c.S_total/c.c_pp;
    const pad={l:56,r:20,t:16,b:32};
    const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;
    const mx=x=>pad.l+(x/(R0+Rct)*1.8)*pw/2;
    const my=y=>pad.t+ph*(0.5+y/(Rct*0.6));
    ctx.fillStyle='#07080b'; ctx.fillRect(0,0,W,H);
    /* Grid */
    ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
    [0,.5,1].forEach(f=>{
      ctx.beginPath();ctx.moveTo(pad.l,pad.t+ph*f);ctx.lineTo(W-pad.r,pad.t+ph*f);ctx.stroke();
    });
    /* Nyquist curve */
    const pts2=[];
    pts2.push({x:R0+Rct*1.8,y:0});
    for(let k=20;k>=0;k--) {
      const a=Math.PI*k/20;
      pts2.push({x:R0+Rct/2+Math.cos(a)*Rct/2, y:Math.sin(a)*Rct*0.55});
    }
    for(let k=1;k<=10;k++) pts2.push({x:R0+Rct+k*Rct*0.15,y:k*Rct*0.15});
    ctx.beginPath();ctx.strokeStyle='#4a9eff';ctx.lineWidth=2.5;
    pts2.forEach((p,i)=>i===0?ctx.moveTo(mx(p.x),my(-p.y)):ctx.lineTo(mx(p.x),my(-p.y)));
    ctx.stroke();
    /* Labels */
    [[R0,0,'R0 (ACIR)','#00d4aa'],[R0+Rct,0,'DCIR 10s','#f5c518']].forEach(([x,y,l,col])=>{
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(mx(x),my(-y),4,0,Math.PI*2);ctx.fill();
      ctx.font='9px JetBrains Mono,monospace';ctx.fillText(l,mx(x)+6,my(-y)-4);
    });
    ctx.fillStyle='#4a6080';ctx.font='10px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText('Re(Z) - Pack Impedance (mΩ) · Nyquist EIS concept',pad.l+pw/2,H-4);
  }

  if (catId === 'thermal') {
    const cv=document.getElementById('bt_therm_canvas');
    if (!cv) return;
    const W=cv.offsetWidth||700, H=200;
    cv.width=W; cv.height=H;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#07080b';ctx.fillRect(0,0,W,H);
    const pad={l:50,r:20,t:16,b:32};
    const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;
    /* Simulated T rise */
    const R_pack=(c.ir_bol*c.S_total/c.c_pp)*1e-3;
    const Qgen=Math.pow(c.imax,2)*R_pack;
    const mass=c.qpack*c.S_total*c.c_pp*2.8/1000;
    const Cp=950;
    const ua_tms=580; // W/K typical liquid cooling
    const Tamb=c.top_hi;
    const Ts=[],Ts_no=[],times=[];
    let T=Tamb, Tno=Tamb;
    for(let t=0;t<=3600;t+=30){
      times.push(t);Ts.push(T);Ts_no.push(Tno);
      const dT_gen=Qgen/(mass*Cp)*30;
      const dT_cool=ua_tms*(T-Tamb)/(mass*Cp)*30;
      const dT_amb=(T-Tamb)*15/(mass*Cp)*30;
      T=T+dT_gen-dT_cool;
      Tno=Tno+dT_gen-dT_amb;
      if(T<Tamb)T=Tamb; if(Tno<Tamb)Tno=Tamb;
    }
    const Tmin=Tamb,Tmax=Math.max(...Ts_no,c.tcell+5);
    const mx=(t)=>pad.l+(t/3600)*pw;
    const my2=(T)=>pad.t+ph*(1-(T-Tmin)/(Tmax-Tmin));
    /* Grid */
    ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
    [0,.25,.5,.75,1].forEach(f=>{
      const y=pad.t+ph*f;
      ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
      ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';
      ctx.fillText((Tmin+(Tmax-Tmin)*(1-f)).toFixed(0)+'°C',pad.l-3,y+3);
    });
    /* Thresholds */
    [c.tcell-10,c.tcell].forEach((T,i)=>{
      const y=my2(T);
      ctx.strokeStyle=i===0?'rgba(245,197,24,.4)':'rgba(255,77,109,.4)';
      ctx.lineWidth=1;ctx.setLineDash([4,4]);
      ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=i===0?'#f5c518':'#ff4d6d';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='left';
      ctx.fillText(i===0?'Derate '+T+'°C':'Cutoff '+T+'°C',pad.l+4,y-3);
    });
    /* TMS off */
    ctx.beginPath();ctx.strokeStyle='#ff7b35';ctx.lineWidth=2;
    Ts_no.forEach((T,i)=>i===0?ctx.moveTo(mx(times[i]),my2(T)):ctx.lineTo(mx(times[i]),my2(T)));
    ctx.stroke();
    /* TMS on */
    ctx.beginPath();ctx.strokeStyle='#00d4aa';ctx.lineWidth=2;
    Ts.forEach((T,i)=>i===0?ctx.moveTo(mx(times[i]),my2(T)):ctx.lineTo(mx(times[i]),my2(T)));
    ctx.stroke();
    ctx.fillStyle='#4a6080';ctx.font='10px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText('T_cell vs Time · Green=liquid cooling · Orange=no cooling · I_peak='+c.imax+'A',pad.l+pw/2,H-4);
  }

  if (catId === 'emi_emc') {
    const cv=document.getElementById('bt_emi_canvas');
    if (!cv) return;
    const W=cv.offsetWidth||700, H=180;
    cv.width=W; cv.height=H;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#07080b';ctx.fillRect(0,0,W,H);
    const pad={l:52,r:20,t:16,b:32};
    const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;
    /* Log frequency axis: 100kHz to 1GHz */
    const fmin=5,fmax=9; // log10 of Hz
    const mx=f=>pad.l+(Math.log10(f)-fmin)/(fmax-fmin)*pw;
    const my3=v=>pad.t+ph*(1-Math.min(1,Math.max(0,(v-20)/60)));
    /* per applicable standard Class 5 limit line */
    const limit=[[150e3,66],[30e6,40],[300e6,33],[1e9,33]];
    ctx.beginPath();ctx.strokeStyle='rgba(255,77,109,.5)';ctx.lineWidth=1.5;ctx.setLineDash([5,3]);
    limit.forEach((p,i)=>i===0?ctx.moveTo(mx(p[0]),my3(p[1])):ctx.lineTo(mx(p[0]),my3(p[1])));
    ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,77,109,.5)';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='left';
    ctx.fillText('per applicable standard Class 5 limit',mx(1e6),my3(46));
    /* Simulated emissions */
    const drawEmissions=(col,noise,peaks)=>{
      ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=1.5;
      for(let k=0;k<=200;k++){
        const logf=fmin+(fmax-fmin)*k/200;
        const f=Math.pow(10,logf);
        let v=noise+Math.random()*3;
        peaks.forEach(([pf,pa])=>{if(Math.abs(logf-Math.log10(pf))<0.05) v=Math.max(v,pa+Math.random()*4);});
        k===0?ctx.moveTo(mx(f),my3(v)):ctx.lineTo(mx(f),my3(v));
      }
      ctx.stroke();
    };
    drawEmissions('rgba(74,158,255,.6)',22,[[20e3,38],[40e3,36],[100e3,42],[1e6,35]]);
    /* Freq labels */
    [1e5,1e6,1e7,1e8,1e9].forEach(f=>{
      const x=mx(f);
      ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='center';
      const lbl=f>=1e9?'1GHz':f>=1e6?(f/1e6).toFixed(0)+'M':f>=1e3?(f/1e3).toFixed(0)+'k':'';
      ctx.fillText(lbl,x,H-pad.b+12);
    });
    ctx.fillStyle='#4a6080';ctx.font='10px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText('EMI Scan - dBμV vs Frequency (Hz log scale) · Blue=measured · Red=per applicable standard limit',pad.l+pw/2,H-4);
  }
}

/* ── Hook switchTopTab and showSec ── */
(function() {
  const _st = window.switchTopTab;
  window.switchTopTab = function(tabId, btn) {
    if (typeof _st==='function') _st(tabId,btn);
    if (tabId==='testing') setTimeout(()=>{try{renderBatteryTesting(window._bt_active_cat);}catch(e){}},80);
  };
  const _pp = window.propagate;
  window.propagate = function() {
    if (typeof _pp==='function') _pp.apply(this,arguments);
    try { if(document.getElementById('panel-testing')?.classList.contains('active')) renderBatteryTesting(window._bt_active_cat); } catch(e) {}
  };
})();


/* inlined: test-data-analysis.js */
/* ═══════════════════════════════════════════════════════════════
   BatteryMIS - TEST DATA ANALYSIS  v3.0
   AVL Concerto-style analyser:
   • Multi-sheet Excel support (sheet browser tab bar)
   • Adjustable panes: drag resize height, drag resize width via browser
   • Drag any channel to X or Y axis of any pane
   • Per-pane stats bar (min/max/avg/rms/count)
   • Single flexible XY graph + multi-pane time-series
   • Synchronized cursor across all panes
   • Scroll-wheel zoom, mouse drag pan
   • AI analysis vs project targets
   ═══════════════════════════════════════════════════════════════ */

(function patchBTCats() {
  const add=()=>{ if(typeof BT_CATS!=='undefined'&&!BT_CATS.find(c=>c.id==='data_analysis')) BT_CATS.push({id:'data_analysis',icon:'🔬',label:'Test Data Analysis',color:'#e879f9'}); };
  add();
  const _orig=window.renderBatteryTesting;
  window.renderBatteryTesting=function(catId){ add(); if(catId==='data_analysis') renderDataAnalysis(); else if(typeof _orig==='function') _orig(catId); };
})();

/* ═══ STATE ═══ */
window._tda={
  sheets:[],          // [{name, headers, rows, colMap}]
  activeSheet:0,      // index into sheets
  panes:[],           // [{id,label,signals:[{ci,axis:'y'}],xAxis:null,height,type:'time'|'xy',stats:{}}]
  cursor:null,        // 0–1 normalised cursor position
  zoomX:{x0:0,x1:1}, // global time zoom
  aiResult:null,
  dragSig:null,       // {ci} currently dragging
  browserWidth:220,
};

function tda(){ return window._tda; }
function tdaSheet(){ return tda().sheets[tda().activeSheet]||null; }

/* ═══ MAIN RENDER ═══ */
window.renderDataAnalysis=function(){
  const root=document.getElementById('bt_root');
  if(!root) return;
  const t=tda(), S=window.S||{}, d=tdaSheet();
  const hasData=d&&d.rows?.length>0;
  if(hasData&&t.panes.length===0) tdaInitPanes();

  root.innerHTML=`
<style>
/* ─ Layout ─ */
#tda_app{display:flex;flex-direction:column;height:calc(100vh - 120px);min-height:500px;background:#07080b;font-family:'JetBrains Mono',monospace;font-size:11px;overflow:hidden}
/* ─ Topbar ─ */
#tda_topbar{background:#080d18;border-bottom:1px solid #182840;flex-shrink:0;display:flex;flex-direction:column}
#tda_catnav{display:flex;gap:2px;padding:5px 10px;overflow-x:auto;flex-shrink:0}
.tda-cb{display:flex;align-items:center;gap:4px;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:var(--sans);border:1px solid transparent;background:transparent;color:var(--text2);transition:all .12s}
.tda-cb:hover{background:rgba(255,255,255,.04);color:var(--text)}
.tda-cb.active{border-color:#e879f950;background:#e879f915;color:#e879f9}
/* ─ Context bar ─ */
#tda_ctx{display:flex;flex-wrap:wrap;gap:4px;padding:5px 12px;background:rgba(255,255,255,.02);border-bottom:1px solid #182840;align-items:center}
.ctx-chip{display:flex;gap:3px;align-items:center;background:rgba(255,255,255,.04);border:1px solid #182840;border-radius:3px;padding:2px 6px;cursor:default}
.ctx-k{font-size:8px;color:#3a567a;text-transform:uppercase}
.ctx-v{font-size:10px;font-weight:700}
/* ─ Sheet tabs ─ */
#tda_sheet_tabs{display:flex;gap:2px;padding:3px 10px;background:#050a14;border-bottom:1px solid #182840;overflow-x:auto;flex-shrink:0}
.tda-stab{padding:3px 12px;border-radius:4px 4px 0 0;font-size:10px;cursor:pointer;border:1px solid transparent;border-bottom:none;color:var(--text3);background:transparent;transition:all .12s;white-space:nowrap}
.tda-stab:hover{color:var(--text2);background:rgba(255,255,255,.03)}
.tda-stab.active{color:#e879f9;background:#e879f918;border-color:#e879f940}
/* ─ Toolbar ─ */
#tda_toolbar{display:flex;align-items:center;gap:5px;padding:5px 10px;background:#080d18;border-bottom:1px solid #182840;flex-shrink:0;flex-wrap:wrap}
.tb{padding:3px 9px;background:#0d1626;border:1px solid #182840;border-radius:4px;font-size:10px;color:var(--text2);cursor:pointer;font-family:var(--mono);transition:all .12s;white-space:nowrap}
.tb:hover{background:#152035;color:var(--text);border-color:#2a3f5e}
.tb:disabled{opacity:.35;cursor:not-allowed}
.tb.hi{background:#1a0d2b;border-color:#e879f940;color:#e879f9}
.tsep{width:1px;height:18px;background:#182840;flex-shrink:0}
/* ─ Main layout ─ */
#tda_main{display:flex;flex:1;min-height:0;overflow:hidden}
/* ─ Chart area ─ */
#tda_charts{flex:1;display:flex;flex-direction:column;overflow-y:auto;overflow-x:hidden;min-width:0;position:relative;background:#07080b;padding-bottom:4px}
/* ─ Pane ─ */
.tda-pane{position:relative;flex-shrink:0;border-bottom:2px solid #182840;background:#07080b;overflow:hidden;display:flex;flex-direction:column}
.tda-pane:last-child{border-bottom:none}
.tda-ph{display:flex;align-items:center;gap:6px;padding:3px 8px;background:rgba(255,255,255,.02);border-bottom:1px solid #182840;flex-shrink:0}
.tda-ph-title{font-weight:700;color:var(--text);font-size:11px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tda-readout{font-size:10px;color:#00d4aa;padding:1px 6px;background:rgba(0,212,170,.08);border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:400px}
.tda-ph-btn{cursor:pointer;color:var(--text3);padding:0 3px;font-size:11px;background:none;border:none;transition:color .1s}
.tda-ph-btn:hover{color:var(--text)}
.tda-pane canvas{display:block;cursor:crosshair}
/* ─ Pane stats bar ─ */
.tda-pstats{display:flex;gap:8px;padding:2px 8px;background:rgba(255,255,255,.01);border-top:1px solid #182840;overflow-x:auto;font-size:9px;white-space:nowrap;min-height:18px;flex-shrink:0;align-items:center}
.tda-stat{display:flex;gap:3px;align-items:center}
.tda-stat-k{color:#3a567a}
.tda-stat-v{font-weight:700}
/* ─ Resize handle ─ */
.pane-resize-h{height:4px;background:transparent;cursor:ns-resize;position:absolute;bottom:0;left:0;right:0;z-index:10;transition:background .15s}
.pane-resize-h:hover,.pane-resize-h.active{background:#e879f960}
/* ─ Drop zones ─ */
.drop-xaxis{position:absolute;bottom:22px;left:52px;right:12px;height:20px;border:2px dashed transparent;border-radius:3px;transition:all .15s;pointer-events:none}
.drop-yaxis{position:absolute;top:30px;bottom:22px;left:0;width:20px;border:2px dashed transparent;border-radius:3px;transition:all .15s;pointer-events:none}
.drop-active{border-color:#e879f9!important;background:rgba(232,121,249,.08)!important}
.tda-pane.drag-over{background:#e879f908!important}
/* ─ Add pane ─ */
.add-pane{display:flex;align-items:center;justify-content:center;height:40px;background:rgba(255,255,255,.01);border:2px dashed #182840;border-radius:5px;margin:6px 8px;cursor:pointer;color:#3a567a;font-size:11px;transition:all .15s}
.add-pane:hover{border-color:#e879f9;color:#e879f9;background:#e879f908}
/* ─ Channel browser ─ */
#tda_browser{background:#050a14;border-left:1px solid #182840;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden;transition:width .15s}
#tda_brz_resize{width:4px;background:#182840;cursor:col-resize;flex-shrink:0}
#tda_brz_resize:hover{background:#e879f9}
#tda_brz_hdr{padding:6px 10px;border-bottom:1px solid #182840;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
#tda_ch_list{flex:1;overflow-y:auto;padding:4px}
.ch-grp-hdr{padding:3px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#3a567a;background:rgba(255,255,255,.02);margin:2px 0}
.ch-item{display:flex;align-items:center;gap:5px;padding:4px 7px;border-radius:4px;cursor:grab;transition:background .1s;border:1px solid transparent}
.ch-item:hover{background:rgba(255,255,255,.05);border-color:#182840}
.ch-item.dragging{opacity:.4}
.ch-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.ch-name{font-size:10px;color:var(--text2);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-unit{font-size:9px;color:#3a567a}
.ch-range{font-size:8px;color:#3a567a;font-family:var(--mono)}
/* ─ Zoom bar ─ */
#tda_zoombar{height:26px;background:rgba(255,255,255,.02);border-top:1px solid #182840;position:relative;flex-shrink:0;display:${hasData?'block':'none'}}
#tda_zt{position:absolute;top:3px;bottom:3px;left:54px;right:8px;background:rgba(255,255,255,.03);border-radius:2px}
#tda_zw{position:absolute;top:0;bottom:0;background:rgba(232,121,249,.18);border:1px solid rgba(232,121,249,.5);border-radius:2px;cursor:ew-resize;min-width:8px}
#tda_ztl{position:absolute;left:3px;top:50%;transform:translateY(-50%);font-size:9px;color:#3a567a}
/* ─ AI panel ─ */
#tda_ai{background:#050a14;border-top:1px solid #182840;flex-shrink:0;overflow:hidden;transition:max-height .2s}
#tda_ai.open{max-height:260px}
#tda_ai.closed{max-height:28px}
#tda_ai_hdr{padding:4px 12px;display:flex;align-items:center;gap:8px;cursor:pointer;border-bottom:1px solid #182840;height:28px}
#tda_ai_body{padding:10px 14px;overflow-y:auto;max-height:220px;font-size:12px;color:var(--text2);line-height:1.75}
#tda_ai_body h4{color:#e879f9;font-size:12px;font-weight:700;margin:8px 0 3px}
#tda_ai_body ul{margin:4px 0;padding-left:16px}
#tda_ai_body li{margin-bottom:3px;font-size:12px}
/* ─ Upload overlay ─ */
#tda_upload{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#07080b;z-index:20;flex-direction:column;gap:14px;cursor:pointer}
</style>

<div id="tda_app">

  <!-- CATEGORY NAV -->
  <div id="tda_topbar">
    <div id="tda_catnav">
      ${(typeof BT_CATS!=='undefined'?BT_CATS:[]).map(c=>`
        <button class="tda-cb ${c.id==='data_analysis'?'active':''}"
          style="${c.id==='data_analysis'?'border-color:#e879f950;background:#e879f915;color:#e879f9':''}"
          onclick="renderBatteryTesting('${c.id}')">
          <span style="font-size:12px">${c.icon}</span>${c.label}
        </button>`).join('')}
    </div>

    <!-- PROJECT CONTEXT (all linked fields) -->
    <div id="tda_ctx">
      <span class="ctx-k" style="margin-right:2px">PROJECT →</span>
      ${tdaCtxChips(S)}
      <button onclick="switchTopTab('engineering',document.getElementById('ttab-engineering'));showSec('targets',document.querySelector('.nb'))"
        style="margin-left:auto;padding:2px 8px;background:#1a0d2b;border:1px solid #e879f940;color:#e879f9;border-radius:3px;font-size:10px;cursor:pointer">✏ Edit</button>
    </div>
  </div>

  <!-- TOOLBAR -->
  <div id="tda_toolbar">
    <button class="tb" onclick="tdaOpen()">📂 Open</button>
    <input type="file" id="tda_file" accept=".csv,.xlsx,.xls,.txt,.tsv" multiple style="display:none" onchange="tdaHandleFiles(this.files)">
    <div class="tsep"></div>
    <button class="tb ${hasData?'':'disabled'}" onclick="tdaAddPane('time')" ${!hasData?'disabled':''}>+ Time Pane</button>
    <button class="tb ${hasData?'':'disabled'}" onclick="tdaAddPane('xy')"   ${!hasData?'disabled':''}>+ X/Y Graph</button>
    <button class="tb ${hasData?'':'disabled'}" onclick="tdaAutoLayout()"   ${!hasData?'disabled':''}>⊞ Auto</button>
    <button class="tb ${hasData?'':'disabled'}" onclick="tdaResetZoom()"    ${!hasData?'disabled':''}>↕ Reset</button>
    <div class="tsep"></div>
    <button class="tb hi ${hasData?'':'disabled'}" onclick="tdaRunAI(false)" ${!hasData?'disabled':''}>🤖 AI Analyse</button>
    <button class="tb ${hasData?'':'disabled'}" onclick="tdaRunAI(true)"  ${!hasData?'disabled':''}>🤖 Deep</button>
    <div class="tsep"></div>
    <button class="tb ${hasData?'':'disabled'}" onclick="tdaExport()" ${!hasData?'disabled':''}>⬇ Export</button>
    ${hasData?`<div class="tsep"></div>
    <span style="color:#3a567a;font-size:10px">
        📄 <b style="color:var(--text2)">${d.fileName}</b>
        ${d.sheetName&&d.sheetName!==d.fileName?` · Sheet: <b style="color:#e879f9">${d.sheetName}</b>`:''}
        · ${d.nRows.toLocaleString()} rows · ${d.headers.length} ch
      </span>
    <button class="tb" onclick="tdaClear()" style="margin-left:auto;color:var(--r);border-color:rgba(255,77,109,.2)">✕ Clear</button>`:''}
  </div>

  <!-- SHEET TABS -->
  ${t.sheets.length>1?`<div id="tda_sheet_tabs">
    ${t.sheets.map((s,i)=>`<button class="tda-stab ${i===t.activeSheet?'active':''}" title="${s.fileName||''}" onclick="tdaSwitchSheet(${i})">${s.displayName||s.sheetName||s.fileName?.split('·')[1]||s.fileName||'Sheet '+(i+1)}</button>`).join('')}
  </div>`:''}

  <!-- MAIN: CHARTS + BROWSER -->
  <div id="tda_main">
    <!-- CHART AREA -->
    <div id="tda_charts" onmouseleave="tdaOnLeave()">
      ${hasData ? tdaBuildPanes() : `
      <div id="tda_upload"
        onclick="tdaOpen()"
        ondragover="event.preventDefault();this.style.background='#e879f908'"
        ondragleave="this.style.background=''"
        ondrop="event.preventDefault();this.style.background='';tdaHandleFiles(event.dataTransfer.files)">
        <div style="font-size:44px">📊</div>
        <div style="font-size:14px;font-weight:700;color:var(--text)">Drop test log or click to open</div>
        <div style="font-size:11px;color:#3a567a;text-align:center;max-width:360px;line-height:1.7">
          CSV · Excel (.xlsx) · TSV · BMS log · Cycler export<br>
          Multi-sheet Excel fully supported - all sheets loaded
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;max-width:420px;text-align:center">
          ${[['⚡','V/I/P','Pack + cell'],['🌡️','Temperature','Cell + coolant'],['📈','SOC/SOH','State + Ah'],
             ['🔄','Multi-sheet','All Excel sheets'],['↔️','Drag X/Y','Custom axes'],['🤖','AI Analysis','vs project targets']
          ].map(([ic,t,d])=>`<div style="background:rgba(255,255,255,.03);border:1px solid #182840;border-radius:7px;padding:9px">
            <div style="font-size:18px;margin-bottom:3px">${ic}</div>
            <div style="font-size:11px;font-weight:700;color:var(--text)">${t}</div>
            <div style="font-size:9px;color:#3a567a;margin-top:1px">${d}</div>
          </div>`).join('')}
        </div>
      </div>`}
    </div>

    <!-- BROWSER RESIZE -->
    ${hasData?'<div id="tda_brz_resize" onmousedown="tdaBrzResize(event)"></div>':''}

    <!-- CHANNEL BROWSER -->
    ${hasData?`
    <div id="tda_browser" style="width:${t.browserWidth}px">
      <div id="tda_brz_hdr">
        <span style="font-weight:700;color:var(--text);font-size:11px">Channels</span>
        <span style="font-size:9px;color:#3a567a">${d.headers.length} total</span>
      </div>
      <div id="tda_ch_list">${tdaBuildBrowser()}</div>
    </div>`:''}
  </div>

  <!-- ZOOM BAR -->
  <div id="tda_zoombar">
    <span id="tda_ztl">Time</span>
    <div id="tda_zt">
      <div id="tda_zw" style="left:${t.zoomX.x0*100}%;width:${(t.zoomX.x1-t.zoomX.x0)*100}%" onmousedown="tdaZoomDrag(event)"></div>
    </div>
  </div>

  <!-- AI PANEL -->
  <div id="tda_ai" class="${t.aiResult?'open':'closed'}">
    <div id="tda_ai_hdr" onclick="document.getElementById('tda_ai').classList.toggle('open');document.getElementById('tda_ai').classList.toggle('closed')">
      <span style="font-weight:700;color:#e879f9;font-size:11px">🤖 AI Analysis</span>
      <span style="color:#3a567a;font-size:9px">${t.aiResult?'Click to collapse':'Run AI Analyse above'}</span>
      <input id="tda_ctx_input" onclick="event.stopPropagation()" placeholder="Test context…"
        style="padding:2px 7px;background:#0d1626;border:1px solid #182840;border-radius:4px;color:var(--text);font-size:10px;width:260px;margin-left:auto">
    </div>
    <div id="tda_ai_body">${t.aiResult||'<span style="color:#3a567a">Run AI Analyse to see interpretation here</span>'}</div>
  </div>

</div>`;

  if(hasData){ requestAnimationFrame(()=>{ tdaDrawAll(); tdaInitDrag(); }); }
};

/* ═══ PROJECT CONTEXT CHIPS ═══ */
function tdaCtxChips(S){
  const g=id=>{const el=document.getElementById(id);return el?el.value:null;};
  const gn=id=>{const el=document.getElementById(id);return el&&el.value!==''?+el.value:null;};
  const chip=(k,v,c)=>`<div class="ctx-chip"><span class="ctx-k">${k}</span><span class="ctx-v" style="color:${c||'#e879f9'}">${v}</span></div>`;
  const S2=S||{};
  // Always compute fresh from DOM source fields
  const c_cps = gn('c_cps')||S2.c_cps||14;
  const c_ss  = gn('c_ss') ||S2.c_ss ||8;
  const c_pp  = gn('c_pp') ||S2.c_pp ||1;
  const c_vnom= gn('c_vnom')||S2.c_vnom||3.2;
  const Ss    = c_cps * c_ss;
  const Vnom  = S2.V_nom_pack||(Ss*c_vnom);
  return [
    chip('App',       g('t_app')||S2.app||'-',          '#60a5fa'),
    chip('Chem',      (g('c_chem')||S2.c_chem||'LFP').split(' ')[0].toUpperCase(), '#e879f9'),
    chip('Config',    `${c_cps}×${c_ss}=${Ss}S/${c_pp}P`, '#4a9eff'),
    chip('V_nom',     Vnom.toFixed(0)+'V', '#4a9eff'),
    chip('Vop_hi',    (S2.V_dod_hi_pack||S2.V_max_pack||420).toFixed(0)+'V', '#00d4aa'),
    chip('Vop_lo',    (S2.V_dod_lo_pack||S2.V_min_pack||280).toFixed(0)+'V', '#00d4aa'),
    chip('Vc_hi',     (S2.V_dod_hi_cell||S2.c_vmax||3.65).toFixed(3)+'V', '#f5c518'),
    chip('Vc_lo',     (S2.V_dod_lo_cell||S2.c_vmin||2.0).toFixed(3)+'V',  '#f5c518'),
    chip('SoC',       `${(S2.soc_lo||0).toFixed(0)}–${(S2.soc_hi||100).toFixed(0)}%`, '#94a3b8'),
    chip('E_gross',   (S2.E_gross||43).toFixed(1)+'kWh', '#00d4aa'),
    chip('E_use',     (S2.E_usable||38).toFixed(1)+'kWh','#00d4aa'),
    chip('P_peak',    (+(g('t_ppeak')||S2.t_ppeak||80))+'kW', '#ff7b35'),
    chip('P_cont',    (+(g('t_pcont')||S2.t_pcont||50))+'kW', '#ff7b35'),
    chip('Cap',       (+(g('c_ah')||S2.c_ah||120))+'Ah', '#f5c518'),
    chip('IR_BoL',    (+(g('c_ir_bol')||S2.c_ir_bol||0.22))+'mΩ', '#a78bfa'),
    chip('T_max',     (+(g('t_tcell_max')||S2.t_tcell_max||55))+'°C', '#ff4d6d'),
    chip('T_op',      (+(g('t_top_lo')||S2.t_top_lo||-20))+'→'+(+(g('t_top_hi')||S2.t_top_hi||55))+'°C', '#ff4d6d'),
    chip('Cycles',    (+(g('t_cycles')||S2.t_cycles||3000)), '#60a5fa'),
    chip('SoH_EoL',   (+(g('t_soh_eol')||S2.t_soh_eol||80))+'%', '#60a5fa'),
    chip('IP',        g('t_ip')||S2.t_ip||'IP67', '#94a3b8'),
    chip('Markets',   (g('t_markets')||S2.markets||'EU').toUpperCase(), '#94a3b8'),
  ].join('');
}

/* ═══ PANE HTML ═══ */
function tdaBuildPanes(){
  const t=tda();
  if(!t.panes.length) return '<div class="add-pane" onclick="tdaAddPane(\'time\')">+ Add Time Pane - drag channels from browser</div>';
  return t.panes.map((p,pi)=>`
    <div class="tda-pane" id="pane_${p.id}" style="height:${Math.max(p.height||220, p.rightAxisEnabled ? 240 : 200)}px"
      ondragover="event.preventDefault();document.getElementById('pane_${p.id}').classList.add('drag-over')"
      ondragleave="document.getElementById('pane_${p.id}').classList.remove('drag-over')"
      ondrop="tdaDrop(event,'${p.id}','y')">
      <div class="tda-ph" style="flex-wrap:wrap;height:auto;min-height:26px;gap:2px 6px;padding:4px 8px">
        <!-- Row 1: title + readout + buttons -->
        <span class="tda-ph-title" style="flex:1;min-width:80px">${p.label}</span>
        <span class="tda-readout" id="ro_${p.id}" style="max-width:340px;overflow:hidden;text-overflow:ellipsis">-</span>
        <button class="tda-ph-btn" onclick="tdaResizeP('${p.id}',-40)" title="Shrink pane">−</button>
        <button class="tda-ph-btn" onclick="tdaResizeP('${p.id}',40)" title="Grow pane">+</button>
        <button class="tda-ph-btn" onclick="tdaClearPaneSignals('${p.id}')" title="Clear signals">↺</button>
        <button class="tda-ph-btn" onclick="tdaDownloadPane('${p.id}','${p.label}')" title="Download JPEG" style="color:#60a5fa">⬇</button>
        <button class="tda-ph-btn" onclick="tdaRemoveP('${p.id}')" title="Remove" style="color:var(--r)">✕</button>
        <!-- Row 2: Y-axis controls -->
        ${p.type!=='xy'?`<div style="display:flex;align-items:center;gap:6px;width:100%;padding-top:3px;border-top:1px solid rgba(255,255,255,.05);flex-wrap:wrap">
          <!-- Left axis limits -->
          <span style="font-size:8px;color:#3a567a;font-weight:700">L-AXIS:</span>
          <input type="number" placeholder="auto" title="Left Y minimum"
            value="${p.yMin_L!=null?p.yMin_L:''}"
            onchange="tdaSetAxisLimit('${p.id}','yMin_L',this.value)"
            style="width:56px;padding:1px 4px;background:#0a1525;border:1px solid #1e3a5c;border-radius:3px;color:#3a567a;font-size:9px;font-family:var(--mono)">
          <span style="font-size:8px;color:#3a567a">to</span>
          <input type="number" placeholder="auto" title="Left Y maximum"
            value="${p.yMax_L!=null?p.yMax_L:''}"
            onchange="tdaSetAxisLimit('${p.id}','yMax_L',this.value)"
            style="width:56px;padding:1px 4px;background:#0a1525;border:1px solid #1e3a5c;border-radius:3px;color:#3a567a;font-size:9px;font-family:var(--mono)">
          <button onclick="tdaResetAxisLimits('${p.id}','L')"
            style="padding:1px 5px;background:none;border:1px solid #1e3a5c;border-radius:3px;color:#3a567a;font-size:8px;cursor:pointer" title="Auto-scale left axis">auto</button>
          <!-- Right axis toggle + limits -->
          <label style="display:flex;align-items:center;gap:3px;cursor:pointer;margin-left:8px">
            <input type="checkbox" ${p.rightAxisEnabled?'checked':''}
              onchange="tdaToggleRightAxis('${p.id}',this.checked)"
              style="cursor:pointer;width:11px;height:11px">
            <span style="font-size:8px;color:#f59e0b;font-weight:700">R-AXIS</span>
          </label>
          ${p.rightAxisEnabled?`
          <input type="number" placeholder="auto" title="Right Y minimum"
            value="${p.yMin_R!=null?p.yMin_R:''}"
            onchange="tdaSetAxisLimit('${p.id}','yMin_R',this.value)"
            style="width:56px;padding:1px 4px;background:#1a0d00;border:1px solid #f59e0b40;border-radius:3px;color:#f59e0b;font-size:9px;font-family:var(--mono)">
          <span style="font-size:8px;color:#f59e0b">to</span>
          <input type="number" placeholder="auto" title="Right Y maximum"
            value="${p.yMax_R!=null?p.yMax_R:''}"
            onchange="tdaSetAxisLimit('${p.id}','yMax_R',this.value)"
            style="width:56px;padding:1px 4px;background:#1a0d00;border:1px solid #f59e0b40;border-radius:3px;color:#f59e0b;font-size:9px;font-family:var(--mono)">
          <button onclick="tdaResetAxisLimits('${p.id}','R')"
            style="padding:1px 5px;background:none;border:1px solid #f59e0b40;border-radius:3px;color:#f59e0b;font-size:8px;cursor:pointer" title="Auto-scale right axis">auto</button>
          `:''}
          <!-- Signal axis assignment (show each signal with L/R toggle) -->
          ${p.signals.length>0?`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-left:6px;border-left:1px solid #1e3a5c;padding-left:8px">
            ${p.signals.map((s,si)=>{
              const col=tdaSignalColor(s, si); // axis-aware color
              const isR=s.yAxis==='R';
              const hdr=(tdaSheet()?.headers[s.ci]||'Ch'+s.ci);
              const off = (s.yOffset||0).toFixed(0);
              return `<span style="display:inline-flex;align-items:center;gap:1px;margin-right:2px">
                <button onclick="tdaToggleSignalAxis('${p.id}',${si})"
                  title="Move ${hdr} to ${isR?'Left':'Right'} axis"
                  style="padding:1px 5px;background:${isR?'rgba(245,158,11,.15)':'rgba(74,158,255,.12)'};border:1px solid ${isR?'#f59e0b60':'#4a9eff60'};border-radius:3px 0 0 3px;color:${col};font-size:8px;cursor:pointer;font-family:var(--mono);border-right:none">
                  ${isR?'R':'L'} ${hdr}
                </button>
                <button onclick="tdaShiftSignal('${p.id}',${si},10)" title="Shift ${hdr} up"
                  style="padding:1px 4px;background:#0a1525;border:1px solid #1e3a5c;border-right:none;color:${col};font-size:9px;cursor:pointer">▲</button>
                <span style="padding:1px 3px;background:#0a1525;border:1px solid #1e3a5c;border-right:none;color:${col};font-size:8px;min-width:24px;text-align:center" title="Vertical offset %">${off}%</span>
                <button onclick="tdaShiftSignal('${p.id}',${si},-10)" title="Shift ${hdr} down"
                  style="padding:1px 4px;background:#0a1525;border:1px solid #1e3a5c;border-right:none;color:${col};font-size:9px;cursor:pointer">▼</button>
                <button onclick="tdaShiftSignal('${p.id}',${si},0,true)" title="Reset offset"
                  style="padding:1px 4px;background:#0a1525;border:1px solid #1e3a5c;border-radius:0 3px 3px 0;color:#3a567a;font-size:8px;cursor:pointer">×</button>
              </span>`;
            }).join('')}
          </div>`:''}
        </div>`:''}
      </div>
      <canvas id="cv_${p.id}" style="width:100%;display:block;cursor:crosshair;flex:1;min-height:60px"
        height="200"
        onmousemove="tdaOnMove(event,'${p.id}')"
        onmouseleave="tdaOnPaneLeave('${p.id}')"
        onmousedown="tdaPanStart(event,'${p.id}')"
        onwheel="tdaWheel(event,'${p.id}')">
      </canvas>
      <!-- Drop zone indicators -->
      <div id="dz_x_${p.id}" class="drop-xaxis"></div>
      <div id="dz_y_${p.id}" class="drop-yaxis"></div>
      <!-- Stats bar -->
      <div class="tda-pstats" id="stats_${p.id}">
        ${tdaPaneStatsHTML(p)}
      </div>
      <!-- Resize handle -->
      <div class="pane-resize-h" id="rh_${p.id}" onmousedown="tdaPaneResize(event,'${p.id}')"></div>
    </div>`).join('')+
  `<div class="add-pane" onclick="tdaAddPane('time')">+ Add Pane - or drag channel from browser to existing pane</div>`;
}

/* ═══ PANE STATS ═══ */
function tdaPaneStatsHTML(p){
  const d=tdaSheet(); if(!d||!p.signals.length) return '<span style="color:#3a567a">No signals - drag from browser</span>';
  const rows=d.rows;
  const {x0,x1}=tda().zoomX;
  const N=rows.length;
  const i0=Math.floor(x0*N), i1=Math.ceil(x1*N);
  const slice=rows.slice(i0,i1);
  if(!slice.length) return '';
  return p.signals.map((s,si)=>{
    const vals=slice.map(r=>+r[s.ci]).filter(v=>!isNaN(v));
    if(!vals.length) return '';
    const mn=Math.min(...vals),mx=Math.max(...vals),mean=vals.reduce((a,b)=>a+b)/vals.length;
    const unit=tdaDetectUnit(d.headers[s.ci]);
    const fmt=v=>Math.abs(v)<10?v.toFixed(3):v.toFixed(1);
    const u=unit?' '+unit:'';
    const rms=Math.sqrt(vals.reduce((a,b)=>a+b*b,0)/vals.length);
    const col=tdaSignalColor(s, si);  // axis-aware color
    const fmt2=v=>Math.abs(v)>=1000?v.toFixed(0):Math.abs(v)>=10?v.toFixed(1):v.toFixed(3);
    return `<div class="tda-stat" style="border-left:3px solid ${col};padding-left:4px">
      <span style="color:${col};font-weight:700">${d.headers[s.ci]}${unit?' <small style="font-size:8px;opacity:.6">['+unit+']</small>':''}</span>
      <span class="tda-stat-k">min</span><span class="tda-stat-v" style="color:${col}">${fmt2(mn)}${u}</span>
      <span class="tda-stat-k">max</span><span class="tda-stat-v" style="color:${col}">${fmt2(mx)}${u}</span>
      <span class="tda-stat-k">avg</span><span class="tda-stat-v" style="color:${col}">${fmt2(mean)}</span>
      <span class="tda-stat-k">rms</span><span class="tda-stat-v" style="color:#3a567a">${rms.toFixed(3)}</span>
      <span class="tda-stat-k">n</span><span class="tda-stat-v" style="color:#3a567a">${vals.length.toLocaleString()}</span>
    </div>`;
  }).join('');
}

/* ═══ CHANNEL BROWSER ═══ */
// L-axis colors (cool: blue family) and R-axis colors (warm: amber/red family)
// Arranged for max contrast between adjacent signals
const TDA_COLS_L=['#4a9eff','#00d4aa','#a78bfa','#38bdf8','#4ade80','#e879f9','#06b6d4','#818cf8','#34d399','#60a5fa'];
const TDA_COLS_R=['#ff7b35','#f5c518','#ef4444','#fb923c','#fbbf24','#f472b6','#facc15','#f87171','#fca5a5','#fcd34d'];
// Fallback combined palette
const TDA_COLS=['#4a9eff','#ff7b35','#00d4aa','#f5c518','#a78bfa','#ef4444','#34d399','#fb923c','#38bdf8','#e879f9','#4ade80','#fbbf24','#06b6d4','#f472b6','#818cf8'];
function tdaBuildBrowser(){
  const d=tdaSheet(); if(!d) return '';
  const cm=d.colMap;
  const rows=d.rows;
  const groups={'Voltage':[],'Current':[],'Temperature':[],'SOC/SOH':[],'Power':[],'Other':[]};
  d.headers.forEach((h,ci)=>{
    if(ci===cm.t) return;
    const hl=h.toLowerCase();
    const vals=rows.slice(0,200).map(r=>+r[ci]).filter(v=>!isNaN(v));
    const mn=vals.length?Math.min(...vals):0,mx=vals.length?Math.max(...vals):0;
    const ch={ci,name:h,min:mn,max:mx};
    if(/volt|vcell|vpack|v_|oc_v/.test(hl)) groups['Voltage'].push(ch);
    else if(/curr|amp|i_|ipack/.test(hl)) groups['Current'].push(ch);
    else if(/temp|deg|celsius|therm|cool|ambient|tc/.test(hl)) groups['Temperature'].push(ch);
    else if(/soc|soh|state/.test(hl)) groups['SOC/SOH'].push(ch);
    else if(/power|watt|kw|pw/.test(hl)) groups['Power'].push(ch);
    else groups['Other'].push(ch);
  });
  return Object.entries(groups).filter(([,v])=>v.length).map(([grp,chs])=>`
    <div class="ch-grp-hdr">${grp} (${chs.length})</div>
    ${chs.map(ch=>`
      <div class="ch-item" id="ch_${ch.ci}" draggable="true"
        ondragstart="tdaChDrag(event,${ch.ci})" ondragend="tdaChDragEnd(${ch.ci})"
        ondblclick="tdaAddToBestPane(${ch.ci})" title="Drag to pane · Double-click to add · ${ch.name}">
        <div class="ch-dot" style="background:${TDA_COLS[ch.ci%TDA_COLS.length]}"></div>
        <div style="flex:1;min-width:0">
          <div class="ch-name">${ch.name}</div>
          <div class="ch-range">${ch.min.toFixed(2)} → ${ch.max.toFixed(2)}</div>
        </div>
      </div>`).join('')}`).join('');
}

/* ═══ INIT PANES ═══ */
function tdaInitPanes(){
  const t=tda(), d=tdaSheet(); if(!d) return;
  t.panes=[]; t.zoomX={x0:0,x1:1}; t.cursor=null;
  const cm=d.colMap;
  const vSigs=[cm.v_pack,...(cm.v_cells||[]).slice(0,3)].filter(v=>v!=null);
  if(vSigs.length) t.panes.push({id:'p_v',label:'Voltage [V]',signals:vSigs.map(ci=>({ci,yAxis:'L',yOffset:0})),height:260,type:'time',yMin_L:null,yMax_L:null,yMin_R:null,yMax_R:null,rightAxisEnabled:false});
  if(cm.i_pack!=null) t.panes.push({id:'p_i',label:'Current [A]',signals:[{ci:cm.i_pack}],height:160,type:'time'});
  const tSigs=[...(cm.t_cells||[]).slice(0,4),cm.temp_amb,cm.temp_cool_in,cm.temp_cool_out].filter(v=>v!=null);
  if(tSigs.length) t.panes.push({id:'p_t',label:'Temperature [°C]',signals:tSigs.map(ci=>({ci,yAxis:'L',yOffset:0})),height:180,type:'time'});
  if(cm.soc!=null) t.panes.push({id:'p_soc',label:'SOC [%]',signals:[{ci:cm.soc}],height:140,type:'time'});
  else if(cm.p_pack!=null) t.panes.push({id:'p_p',label:'Power [kW]',signals:[{ci:cm.p_pack}],height:140,type:'time'});
  if(!t.panes.length && d.headers.length>1) t.panes.push({id:'p0',label:d.headers[1],signals:[{ci:1}],height:260,type:'time',yMin_L:null,yMax_L:null,yMin_R:null,yMax_R:null,rightAxisEnabled:false});
}

/* ═══ DRAW ALL PANES ═══ */
function tdaDrawAll(){ tda().panes.forEach(p=>tdaDraw(p)); }

function tdaDraw(p){
  const t=tda(), d=tdaSheet(); if(!d||!p) return;
  const cv=document.getElementById('cv_'+p.id); if(!cv) return;
  const W=cv.parentElement?.clientWidth||700;
  // Use clientHeight (CSS layout height) not the canvas attribute height
  const H=cv.clientHeight||cv.height||172;
  cv.width=W;
  cv.height=H; // sync canvas buffer to CSS size
  const ctx=cv.getContext('2d');
  const pad={l:52,r:12,t:8,b:22};
  const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;
  const rows=d.rows, N=rows.length;
  const {x0,x1}=t.zoomX;
  const i0=Math.floor(x0*N), i1=Math.ceil(x1*N);
  const slice=rows.slice(i0,i1);
  if(!slice.length) return;

  ctx.fillStyle='#07080b'; ctx.fillRect(0,0,W,H);

  if(p.type==='xy' && p.xAxis!=null && p.signals.length>0){
    tdaDrawXY(ctx,p,slice,pad,pw,ph,W,H);
  } else {
    tdaDrawTime(ctx,p,slice,pad,pw,ph,W,H,d,N,i0,i1);
  }

  // Update stats
  const statsEl=document.getElementById('stats_'+p.id);
  if(statsEl) statsEl.innerHTML=tdaPaneStatsHTML(p);
}

function tdaDrawTime(ctx,p,slice,pad,pw,ph,W,H,d,N,i0,i1){
  const t=tda(), cm=d.colMap;
  const hasRight = p.rightAxisEnabled && p.signals.some(s=>s.yAxis==='R');
  // Adjust padding for right axis
  const padR = hasRight ? 54 : 12;
  pad = {...pad, r: padR};
  const pwR = W - pad.l - pad.r;

  // ── Compute Y ranges per axis ──
  const autoRange = (signals) => {
    let mn=Infinity,mx2=-Infinity;
    signals.forEach(s=>slice.forEach(r=>{const v=+r[s.ci];if(!isNaN(v)){if(v<mn)mn=v;if(v>mx2)mx2=v;}}));
    if(!isFinite(mn)||mn===mx2){mn=(mn||0)-1;mx2=(mx2||1)+1;}
    const pd=(mx2-mn)*0.07; return {mn:mn-pd, mx:mx2+pd};
  };
  const sigL = p.signals.filter(s=>s.yAxis!=='R');
  const sigR = p.signals.filter(s=>s.yAxis==='R');
  const rL = autoRange(sigL.length?sigL:p.signals);
  const rR = hasRight && sigR.length ? autoRange(sigR) : rL;

  // Apply manual overrides from editable inputs
  const yminL = p.yMin_L != null ? p.yMin_L : rL.mn;
  const ymaxL = p.yMax_L != null ? p.yMax_L : rL.mx;
  const yminR = p.yMin_R != null ? p.yMin_R : rR.mn;
  const ymaxR = p.yMax_R != null ? p.yMax_R : rR.mx;

  // myL/myR apply yOffset (% of range) per signal
  const myL = (v, offsetPct=0) => {
    const rangeL = ymaxL - yminL || 1;
    const shifted = v + rangeL * (offsetPct/100);
    return pad.t + ph*(1-(shifted-yminL)/rangeL);
  };
  const myR = (v, offsetPct=0) => {
    const rangeR = ymaxR - yminR || 1;
    const shifted = v + rangeR * (offsetPct/100);
    return pad.t + ph*(1-(shifted-yminR)/rangeR);
  };
  const my  = (s, v) => s.yAxis==='R' ? myR(v, s.yOffset||0) : myL(v, s.yOffset||0);
  const mx  = fi => pad.l+(fi/(slice.length-1||1))*pwR;

  // ── Grid lines ──
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  [0,.25,.5,.75,1].forEach(f=>{
    const y=pad.t+ph*f;
    ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    // Left Y labels
    const vL=ymaxL-(ymaxL-yminL)*f;
    ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';
    ctx.fillText(vL.toFixed(Math.abs(vL)<10?2:0),pad.l-2,y+3);
    // Right Y labels
    if(hasRight){
      const vR=ymaxR-(ymaxR-yminR)*f;
      ctx.fillStyle='#f59e0b';ctx.textAlign='left';
      ctx.fillText(vR.toFixed(Math.abs(vR)<10?2:0),W-pad.r+2,y+3);
    }
  });

  // ── Left axis label ──
  if(sigL.length){
    ctx.save();ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';
    ctx.translate(10,pad.t+ph/2);ctx.rotate(-Math.PI/2);
    ctx.textAlign='center';ctx.fillText('L axis',0,0);ctx.restore();
  }
  // ── Right axis label ──
  if(hasRight&&sigR.length){
    ctx.save();ctx.fillStyle='#f59e0b';ctx.font='9px JetBrains Mono,monospace';
    ctx.translate(W-8,pad.t+ph/2);ctx.rotate(Math.PI/2);
    ctx.textAlign='center';ctx.fillText('R axis',0,0);ctx.restore();
  }

  // ── X axis time labels ──
  [0,.25,.5,.75,1].forEach(f=>{
    const x=pad.l+f*pwR;
    ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();
    if(cm.t!=null){
      const ri=Math.floor(f*(slice.length-1));
      const tv=+slice[ri]?.[cm.t]||0;
      const lbl=tv>=3600?(tv/3600).toFixed(2)+'h':tv>=60?(tv/60).toFixed(1)+'m':tv.toFixed(0)+'s';
      ctx.fillStyle='#3a567a';ctx.textAlign='center';ctx.fillText(lbl,x,H-pad.b+11);
    }
  });

  // ── Spec lines (left axis) ──
  tdaDrawSpecLines(ctx,p,yminL,ymaxL,myL,pad,W);

  // ── Signal lines ──
  const step=Math.max(1,Math.floor(slice.length/Math.min(pwR*2,4000)));
  p.signals.forEach((s,si)=>{
    const col=tdaSignalColor(s, si);  // L=cool blue, R=warm amber, by position
    const isR=s.yAxis==='R';
    ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=1.6;
    if(isR) ctx.setLineDash([]);
    let first=true;
    for(let i=0;i<slice.length;i+=step){
      const v=+slice[i][s.ci];if(isNaN(v)){first=true;continue;}
      const x=mx(i),y=my(s,v);
      first?ctx.moveTo(x,y):ctx.lineTo(x,y);first=false;
    }
    ctx.stroke();ctx.setLineDash([]);
    // Signal legend
    const lx=pad.l+4+(si%4)*130, ly=pad.t+13+Math.floor(si/4)*14;
    ctx.fillStyle=col;ctx.font='bold 9px JetBrains Mono,monospace';ctx.textAlign='left';
    const axTag=isR?'[R]':'[L]';
    const sigUnit=tdaDetectUnit(d.headers[s.ci]);
    ctx.fillText(axTag+' '+d.headers[s.ci]+(sigUnit?' ['+sigUnit+']':''),lx,ly);
  });

  // ── Cursor ──
  if(t.cursor!=null){
    const cx=pad.l+t.cursor*pwR;
    ctx.strokeStyle='rgba(232,121,249,.8)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
    ctx.beginPath();ctx.moveTo(cx,pad.t);ctx.lineTo(cx,H-pad.b);ctx.stroke();ctx.setLineDash([]);
    const ri=Math.floor(t.cursor*(slice.length-1));
    const tval=cm.t!=null?(+slice[ri]?.[cm.t]||0):ri;
    const tlbl=tval>=3600?(tval/3600).toFixed(3)+'h':tval>=60?(tval/60).toFixed(2)+'m':tval.toFixed(1)+'s';
    const vals=p.signals.map((s,si)=>{const v=+slice[ri]?.[s.ci];if(isNaN(v))return null;const u=tdaDetectUnit(d.headers[s.ci]);return `${d.headers[s.ci]}=${v.toFixed(Math.abs(v)<10?3:1)}${u?'\u00a0'+u:''}`;}).filter(Boolean);
    const rdEl=document.getElementById('ro_'+p.id);
    if(rdEl) rdEl.textContent=`t=${tlbl}  ${vals.join('  ')}`;
  }
}

function tdaDrawXY(ctx,p,slice,pad,pw,ph,W,H){
  const t=tda(), d=tdaSheet();
  const xci=p.xAxis, yci=p.signals[0]?.ci;
  if(xci==null||yci==null) return;
  const xvals=slice.map(r=>+r[xci]).filter(v=>!isNaN(v));
  const yvals=slice.map(r=>+r[yci]).filter(v=>!isNaN(v));
  if(!xvals.length||!yvals.length) return;
  const xmin=Math.min(...xvals),xmax=Math.max(...xvals);
  const ymin=Math.min(...yvals),ymax=Math.max(...yvals);
  const xpad=(xmax-xmin)*0.05||1, ypad=(ymax-ymin)*0.05||1;
  const mx=v=>pad.l+(v-(xmin-xpad))/((xmax+xpad)-(xmin-xpad))*pw;
  const my=v=>pad.t+ph*(1-(v-(ymin-ypad))/((ymax+ypad)-(ymin-ypad)));
  // Grid
  ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
  [0,.25,.5,.75,1].forEach(f=>{
    const y=pad.t+ph*f;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
    const val=ymax-(ymax-ymin)*f;ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';
    ctx.fillText(val.toFixed(2),pad.l-2,y+3);
    const x=pad.l+f*pw;ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();
    ctx.fillStyle='#3a567a';ctx.textAlign='center';ctx.fillText((xmin+(xmax-xmin)*f).toFixed(2),x,H-pad.b+11);
  });
  // Points
  ctx.fillStyle=TDA_COLS[yci%TDA_COLS.length];
  const step=Math.max(1,Math.floor(slice.length/2000));
  for(let i=0;i<slice.length;i+=step){
    const xv=+slice[i][xci],yv=+slice[i][yci];if(isNaN(xv)||isNaN(yv)) continue;
    ctx.beginPath();ctx.arc(mx(xv),my(yv),1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='center';
  ctx.fillText('X: '+d.headers[xci],pad.l+pw/2,H-pad.b+11);
  ctx.textAlign='left';ctx.fillText('Y: '+d.headers[yci],pad.l+4,pad.t+13);
}

function tdaDrawSpecLines(ctx,p,ymin,ymax,my,pad,W){
  const S=window.S||{};
  const lb=p.label.toLowerCase();
  const lines=[];
  if(lb.includes('volt')){
    if(S.V_dod_hi_pack||S.V_max_pack) lines.push({v:S.V_dod_hi_pack||S.V_max_pack,col:'rgba(0,212,170,.5)',l:'Vop_hi'});
    if(S.V_dod_lo_pack||S.V_min_pack) lines.push({v:S.V_dod_lo_pack||S.V_min_pack,col:'rgba(245,197,24,.45)',l:'Vop_lo'});
    if(S.V_nom_pack) lines.push({v:S.V_nom_pack,col:'rgba(74,158,255,.3)',l:'V_nom'});
  }
  if(lb.includes('temp')||lb.includes('°c')){
    if(S.t_tcell_max) lines.push({v:S.t_tcell_max,col:'rgba(255,77,109,.5)',l:'T_limit'});
    if(S.t_tcell_max) lines.push({v:S.t_tcell_max-10,col:'rgba(245,197,24,.4)',l:'T_derate'});
  }
  if(lb.includes('soc')){
    if(S.soc_hi) lines.push({v:S.soc_hi,col:'rgba(0,212,170,.4)',l:'SoC_hi'});
    if(S.soc_lo||0) lines.push({v:S.soc_lo||0,col:'rgba(245,197,24,.4)',l:'SoC_lo'});
  }
  if(lb.includes('curr'))  lines.push({v:0,col:'rgba(255,255,255,.1)',l:'0A'});
  lines.filter(l=>l.v>=ymin&&l.v<=ymax).forEach(l=>{
    ctx.strokeStyle=l.col;ctx.lineWidth=1.2;ctx.setLineDash([5,4]);
    ctx.beginPath();ctx.moveTo(pad.l,my(l.v));ctx.lineTo(W-pad.r,my(l.v));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=l.col;ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';
    ctx.fillText(l.l+' '+l.v.toFixed(0),W-pad.r-2,my(l.v)-3);
  });
}

/* ═══ INTERACTIONS ═══ */
function tdaInitDrag(){
  tda().panes.forEach(p=>{
    const rh=document.getElementById('rh_'+p.id);
    if(rh) rh.onmousedown=e=>tdaPaneResize(e,p.id);
  });
}

window.tdaOnMove=function(e,paneId){
  const t=tda(), cv=document.getElementById('cv_'+paneId);if(!cv) return;
  const rect=cv.getBoundingClientRect();
  const frac=Math.max(0,Math.min(1,(e.clientX-rect.left-52)/(rect.width-64)));
  t.cursor=frac;
  tdaDrawAll();
};
window.tdaOnLeave=function(){tda().cursor=null;tdaDrawAll();};
window.tdaOnPaneLeave=function(id){
  const rdEl=document.getElementById('ro_'+id);if(rdEl) rdEl.textContent='-';
};

let _pan=null;
window.tdaPanStart=function(e,id){
  if(e.button!==0) return;
  const cv=document.getElementById('cv_'+id);if(!cv) return;
  const rect=cv.getBoundingClientRect();
  _pan={sx:e.clientX,sz:{...tda().zoomX},w:rect.width};
  const mm=e2=>{
    if(!_pan) return;
    const dx=(e2.clientX-_pan.sx)/_pan.w, span=_pan.sz.x1-_pan.sz.x0;
    let x0=_pan.sz.x0-dx,x1=_pan.sz.x1-dx;
    if(x0<0){x1-=x0;x0=0;} if(x1>1){x0-=x1-1;x1=1;}
    tda().zoomX={x0,x1};tdaUpdateZoomBar();tdaDrawAll();
  };
  const mu=()=>{_pan=null;document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
};

window.tdaWheel=function(e,id){
  e.preventDefault();
  const t=tda(),cv=document.getElementById('cv_'+id);if(!cv) return;
  const rect=cv.getBoundingClientRect();
  const frac=Math.max(0,Math.min(1,(e.clientX-rect.left-52)/(rect.width-64)));
  const span=t.zoomX.x1-t.zoomX.x0,factor=e.deltaY>0?1.25:0.8;
  const ns=Math.max(0.005,Math.min(1,span*factor));
  const c=t.zoomX.x0+frac*span;
  let x0=c-frac*ns,x1=c+(1-frac)*ns;
  if(x0<0){x1-=x0;x0=0;} if(x1>1){x0-=x1-1;x1=1;}
  t.zoomX={x0,x1};tdaUpdateZoomBar();tdaDrawAll();
};

function tdaUpdateZoomBar(){
  const zw=document.getElementById('tda_zw');if(!zw) return;
  const {x0,x1}=tda().zoomX;
  zw.style.left=x0*100+'%';zw.style.width=Math.max(0.5,(x1-x0)*100)+'%';
}

window.tdaZoomDrag=function(e){
  const t=tda(),track=document.getElementById('tda_zt');if(!track) return;
  const rect=track.getBoundingClientRect(),span=t.zoomX.x1-t.zoomX.x0,sx=e.clientX,sx0=t.zoomX.x0;
  const mm=e2=>{
    const dx=(e2.clientX-sx)/rect.width;
    let x0=sx0+dx,x1=x0+span;
    if(x0<0){x0=0;x1=span;} if(x1>1){x1=1;x0=1-span;}
    t.zoomX={x0,x1};tdaUpdateZoomBar();tdaDrawAll();
  };
  const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
};

/* ═══ PANE RESIZE ═══ */
window.tdaPaneResize=function(e,id){
  e.preventDefault();
  const p=tda().panes.find(p=>p.id===id);if(!p) return;
  const pEl=document.getElementById('pane_'+id);
  const rh=document.getElementById('rh_'+id);
  const sy=e.clientY,sh=p.height||200;
  if(rh) rh.classList.add('active');
  const mm=e2=>{
    p.height=Math.max(80,Math.min(700,sh+(e2.clientY-sy)));
    if(pEl){pEl.style.height=p.height+'px';const cv=document.getElementById('cv_'+id);if(cv){cv.height=Math.max(30,p.height-46);tdaDraw(p);}}
  };
  const mu=()=>{if(rh) rh.classList.remove('active');document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
};

window.tdaResizeP=function(id,delta){
  const p=tda().panes.find(p=>p.id===id);if(!p) return;
  p.height=Math.max(80,Math.min(700,(p.height||200)+delta));
  const pEl=document.getElementById('pane_'+id);
  if(pEl){pEl.style.height=p.height+'px';const cv=document.getElementById('cv_'+id);if(cv){cv.height=Math.max(30,p.height-46);tdaDraw(p);}}
};

/* ═══ BROWSER RESIZE ═══ */
window.tdaBrzResize=function(e){
  const t=tda(),br=document.getElementById('tda_browser');if(!br) return;
  const sx=e.clientX,sw=t.browserWidth||220;
  const mm=e2=>{t.browserWidth=Math.max(140,Math.min(400,sw-(e2.clientX-sx)));if(br) br.style.width=t.browserWidth+'px';};
  const mu=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('mouseup',mu);};
  document.addEventListener('mousemove',mm);document.addEventListener('mouseup',mu);
};

/* ═══ DRAG AND DROP ═══ */
window.tdaChDrag=function(e,ci){
  e.dataTransfer.setData('tda_ci',ci);
  tda().dragSig=ci;
  document.getElementById('ch_'+ci)?.classList.add('dragging');
  // Show drop zone hints on all panes
  tda().panes.forEach(p=>{
    const dzx=document.getElementById('dz_x_'+p.id);
    const dzy=document.getElementById('dz_y_'+p.id);
    if(dzx) dzx.classList.add('drop-active');
    if(dzy) dzy.classList.add('drop-active');
  });
};
window.tdaChDragEnd=function(ci){
  tda().dragSig=null;
  document.getElementById('ch_'+ci)?.classList.remove('dragging');
  tda().panes.forEach(p=>{
    document.getElementById('dz_x_'+p.id)?.classList.remove('drop-active');
    document.getElementById('dz_y_'+p.id)?.classList.remove('drop-active');
    document.getElementById('pane_'+p.id)?.classList.remove('drag-over');
  });
};

window.tdaDrop=function(e,paneId,axis){
  e.preventDefault();
  const ci=parseInt(e.dataTransfer.getData('tda_ci'));
  const p=tda().panes.find(p=>p.id===paneId);
  if(!p||isNaN(ci)) return;
  document.getElementById('pane_'+paneId)?.classList.remove('drag-over');
  document.getElementById('dz_x_'+paneId)?.classList.remove('drop-active');
  document.getElementById('dz_y_'+paneId)?.classList.remove('drop-active');
  const d=tdaSheet();
  // Detect drop zone based on position
  const cv=document.getElementById('cv_'+paneId);
  const rect=cv?.getBoundingClientRect();
  const fromBottom=rect?rect.bottom-e.clientY:999;
  const fromLeft=rect?e.clientX-rect.left:999;
  if(fromBottom<30&&p.type!=='xy'){
    // Drop near X axis → convert to XY and set as X axis
    p.type='xy'; p.xAxis=ci;
    p.label=`${d.headers[p.signals[0]?.ci||0]} vs ${d.headers[ci]}`;
  } else if(fromLeft<30){
    // Drop near Y axis → set as X axis in XY mode
    p.type='xy'; p.xAxis=ci;
  } else {
    // Drop in chart body → add as Y signal
    if(!p.signals.find(s=>s.ci===ci)){
      const yAxis = (p.signals.length > 0 && p.rightAxisEnabled) ? 'R' : 'L';
      p.signals.push({ci, yAxis, yOffset:0}); // yOffset: % of range to shift up (+) or down (-)
    }
    if(p.signals.length===1) p.label=d.headers[ci];
  }
  tdaDraw(p);
  // Update stats
  const statsEl=document.getElementById('stats_'+paneId);
  if(statsEl) statsEl.innerHTML=tdaPaneStatsHTML(p);
};

window.tdaAddToBestPane=function(ci){
  const t=tda(),d=tdaSheet();if(!d) return;
  if(!t.panes.length){tdaAddPane('time');}
  const p=t.panes[0];
  if(!p.signals.find(s=>s.ci===ci)){p.signals.push({ci});}
  if(p.signals.length===1) p.label=d.headers[ci];
  tdaDraw(p);
};

window.tdaClearPaneSignals=function(id){
  const p=tda().panes.find(p=>p.id===id);
  if(p){p.signals=[];p.xAxis=null;p.type='time';p.label='Empty Pane';}
  tdaDraw(p);
};

/* ═══ PANE MANAGEMENT ═══ */
window.tdaAddPane=function(type){
  const t=tda(),id='p_'+Date.now();
  t.panes.push({id,label:type==='xy'?'X/Y Graph':'New Pane',signals:[],xAxis:null,height:260,type:type||'time',yMin_L:null,yMax_L:null,yMin_R:null,yMax_R:null,rightAxisEnabled:false});
  renderDataAnalysis();
};
window.tdaRemoveP=function(id){
  tda().panes=tda().panes.filter(p=>p.id!==id);renderDataAnalysis();
};
window.tdaAutoLayout=function(){tdaInitPanes();renderDataAnalysis();};
window.tdaResetZoom=function(){tda().zoomX={x0:0,x1:1};tdaUpdateZoomBar();tdaDrawAll();};

/* ═══ SHEET SWITCHING ═══ */
window.tdaSwitchSheet=function(idx){
  const t=tda();
  t.activeSheet=idx;
  t.panes=[];t.zoomX={x0:0,x1:1};t.cursor=null;
  tdaInitPanes();renderDataAnalysis();
};

/* ═══ FILE HANDLING ═══ */
window.tdaOpen=function(){document.getElementById('tda_file')?.click();};

window.tdaHandleFiles=function(files){
  if(!files||!files.length) return;
  const t=tda();
  t.sheets=[];t.activeSheet=0;t.panes=[];t.aiResult=null;
  // Show loading
  const root=document.getElementById('bt_root');
  if(root){const ol=document.getElementById('tda_upload');if(ol) ol.innerHTML='<div style="font-size:24px">⏳</div><div style="color:var(--text2)">Loading files…</div>';}
  let pending=files.length;
  Array.from(files).forEach(file=>{
    const ext=file.name.split('.').pop().toLowerCase();
    if(ext==='xlsx'||ext==='xls'){
      const loadXlsx=()=>{
        const r=new FileReader();
        r.onload=e=>{
          const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});
          wb.SheetNames.forEach(name=>{
            const rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:''});
            if(rows.length<2) return;
            const parsed=tdaParseRows(rows,file.name,'\t');
            if(parsed){
              parsed.sheetName=name;  // Excel sheet tab name
              parsed.displayName=name; // shown in sheet tab
              t.sheets.push(parsed);
            }
          });
          if(!--pending){tdaInitPanes();renderDataAnalysis();}
        };
        r.readAsArrayBuffer(file);
      };
      if(typeof XLSX==='undefined'){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=loadXlsx;document.head.appendChild(s);}
      else loadXlsx();
    } else {
      const r=new FileReader();
      r.onload=e=>{
        const parsed=tdaParseText(e.target.result,file.name);
        if(parsed) t.sheets.push(parsed);
        if(!--pending){tdaInitPanes();renderDataAnalysis();}
      };
      r.readAsText(file);
    }
  });
};

function tdaParseText(text,fileName){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  const delim=lines[0].includes('\t')?'\t':lines[0].includes(';')?';':',';
  const rows=lines.map(l=>l.split(delim));
  return tdaParseRows(rows,fileName,delim);
}

function tdaParseRows(rawRows,fileName){
  if(!rawRows.length) return null;
  const hasHdr=isNaN(parseFloat(String(rawRows[0][0]).trim()));
  const hdr=hasHdr?rawRows[0].map(h=>String(h).trim()):rawRows[0].map((_,i)=>'Col'+i);
  const rows=[];
  for(let i=hasHdr?1:0;i<Math.min(rawRows.length,100001);i++){
    if(!rawRows[i]||!rawRows[i].some(v=>v!=='')) continue;
    rows.push(rawRows[i].map(v=>{const n=parseFloat(v);return isNaN(n)?v:n;}));
  }
  if(rows.length<2) return null;
  const colMap=tdaDetectCols(hdr);
  return {headers:hdr,rows,fileName,nRows:rows.length,colMap};
}

// Get signal color: L-axis = cool blue family, R-axis = warm amber family
function tdaSignalColor(signal, paneSignalIndex){
  const si = paneSignalIndex != null ? paneSignalIndex : 0;
  if(signal && signal.yAxis === 'R') return TDA_COLS_R[si % TDA_COLS_R.length];
  return TDA_COLS_L[si % TDA_COLS_L.length];
}

// Detect physical unit from column header name
function tdaDetectUnit(header){
  const h = String(header).toLowerCase();
  // Voltage
  if(/volt|_v$|^v_|_mv|vbat|vpack|vcell|vdc|vac|u_/.test(h)) return 'V';
  // Current
  if(/current|_i$|^i_|_ma$|ipack|ibat|amps?|_a$|ampere/.test(h)) return 'A';
  // Power
  if(/kw|power|watt|_p$|^p_|pwr/.test(h)) return 'kW';
  // Temperature
  if(/temp|celsius|_t$|^t_|degc|°c|thermal/.test(h)) return '°C';
  // Speed / RPM
  if(/rpm|speed|rotati/.test(h)) return 'rpm';
  // Torque
  if(/torque|nm|n\.m/.test(h)) return 'Nm';
  // SoC / Energy
  if(/soc|state.of.charge/.test(h)) return '%';
  if(/energy|kwh/.test(h)) return 'kWh';
  if(/ah|capacity/.test(h)) return 'Ah';
  // Pressure
  if(/press|bar|pascal|psi/.test(h)) return 'bar';
  // Flow
  if(/flow|lpm|l.min/.test(h)) return 'L/min';
  // Time
  if(/time|elapsed|timestamp|_t$/.test(h)) return 's';
  // Frequency
  if(/freq|hz/.test(h)) return 'Hz';
  // Efficiency
  if(/effic|eta|eff/.test(h)) return '%';
  return '';
}

function tdaDetectCols(hdr){
  const hl=hdr.map(h=>String(h).toLowerCase().replace(/[^a-z0-9_]/g,''));
  const f=(...keys)=>{for(const k of keys){const i=hl.findIndex(h=>h.includes(k));if(i>=0)return i;}return null;};
  const fAll=(...keys)=>hl.reduce((a,h,i)=>{if(keys.some(k=>h.includes(k)))a.push(i);return a;},[]);
  return{
    t:f('time','timestamp','elapsed','t_s','tsec','sec'),
    v_pack:f('vpack','packvolt','v_bat','vbat','packv','volt','voltage'),
    i_pack:f('ipack','current_pack','i_bat','ibat','current','amp'),
    p_pack:f('power_pack','p_pack','power','watt','kw'),
    soc:f('soc','stateofcharge','soc_pct'),
    temp_amb:f('tamb','ambient','t_ambient'),
    temp_cool_in:f('tcool_in','coolant_in','t_in','inlet'),
    temp_cool_out:f('tcool_out','coolant_out','t_out','outlet'),
    flow:f('flow','flowrate'),
    v_cells:fAll('vcell','cell_v','v_cell','cv'),
    t_cells:fAll('tcell','cell_t','t_cell','ct'),
    fault:f('fault','error','alarm'),
  };
}

/* ═══ AI ANALYSIS ═══ */
window.tdaRunAI=async function(deep){
  const t=tda(),d=tdaSheet(),S=window.S||{};
  if(!d){alert('Upload a file first.');return;}
  const aiPanel=document.getElementById('tda_ai');
  const aiBody=document.getElementById('tda_ai_body');
  if(aiPanel){aiPanel.classList.remove('closed');aiPanel.classList.add('open');}
  if(aiBody) aiBody.innerHTML='<span style="color:#3a567a">⚙️ Analysing all panes vs project targets…</span>';

  const g=id=>{const el=document.getElementById(id);return el?el.value:null;};
  const col=ci=>ci!=null?d.rows.map(r=>+r[ci]).filter(v=>!isNaN(v)):[];
  const stat=arr=>{if(!arr.length)return null;const mn=Math.min(...arr),mx=Math.max(...arr),mean=arr.reduce((a,b)=>a+b)/arr.length;return{min:mn.toFixed(3),max:mx.toFixed(3),mean:mean.toFixed(3)};};

  // Build per-pane summaries
  const paneSummaries=t.panes.map(p=>({
    pane:p.label,
    signals:p.signals.map(s=>({name:d.headers[s.ci],stats:stat(col(s.ci))}))
  }));

  const prompt=`You are a senior EV battery TEST DATA ANALYSIS ENGINEER. Critically analyse this battery test data against ALL project targets. Identify every limit violation, anomaly, and out-of-scope measurement.

## Project Targets:
Chem=${g('c_chem')||S.c_chem||'LFP'}, Config=${S.S_total||112}S/${S.c_pp||1}P
V_nom=${S.V_nom_pack?.toFixed(0)||358}V, V_op_hi=${(S.V_dod_hi_pack||S.V_max_pack||420).toFixed(0)}V, V_op_lo=${(S.V_dod_lo_pack||S.V_min_pack||280).toFixed(0)}V
T_cell_max=${S.t_tcell_max||55}°C, IR_BoL=${S.c_ir_bol||0.22}mΩ, P_peak=${S.t_ppeak||80}kW
SoC_range=${(S.soc_lo||0).toFixed(0)}–${(S.soc_hi||100).toFixed(0)}%, Cycles_target=${S.t_cycles||3000}
${document.getElementById('tda_ctx_input')?.value?'Test context: '+document.getElementById('tda_ctx_input').value:''}

## Data File: ${d.fileName} (${d.nRows.toLocaleString()} rows, ${d.headers.length} channels)
## Active Panes and Signal Statistics:
${JSON.stringify(paneSummaries,null,2)}

${deep?`Provide comprehensive analysis:
<h4>Executive Summary</h4> 3 sentences: test type, overall health, critical finding.
<h4>Signal-by-Signal Analysis</h4> Compare each signal's min/max/mean against project targets. Flag any exceedances.
<h4>Top 5 Anomalies</h4> Root cause hypothesis + recommended action for each.
<h4>Cell Balance Assessment</h4> If cell voltage channels detected.
<h4>Thermal Performance</h4> Temperature rise rate, TMS effectiveness.
<h4>Risk Rating</h4> Low/Medium/High/Critical with justification.
<h4>Next Test Recommendations</h4> What to run next based on findings.`
:`<h4>Executive Summary</h4> 3 sentences.
<h4>Key Findings</h4> Top 3 findings comparing signal values to project targets with specific numbers.
<h4>Actions</h4> 3 specific next steps.`}
Use <ul><li> for lists. Be specific with numbers. Reference project target values.`;

  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',
      headers:{
        'Content-Type':'application/json',
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:2000,messages:[{role:'user',content:prompt}]})});
    const data=await resp.json();
    const txt=data.content?.map(b=>b.text||'').join('')||'No response';
    t.aiResult=txt.replace(/\*\*(.+?)\*\*/g,'<b>?v=2</b>').replace(/^- (.+)/gm,'<li>?v=2</li>').replace(/(<li>[\s\S]+?<\/li>)+/g,m=>`<ul>${m}</ul>`);
    if(aiBody) aiBody.innerHTML=t.aiResult+`<div style="font-size:9px;color:#3a567a;margin-top:8px;text-align:right">🤖 ${deep?'Deep':'Standard'} · ${new Date().toLocaleTimeString()}</div>`;
  }catch(err){
    if(aiBody) aiBody.innerHTML=`<span style="color:var(--r)">⚠ API Error: ${err.message}</span>`;
  }
};

/* ═══ DUAL Y-AXIS CONTROLS ═══ */
window.tdaSetAxisLimit=function(paneId,field,val){
  const p=tda().panes.find(p=>p.id===paneId); if(!p) return;
  p[field] = val===''||val==null ? null : +val;
  tdaDraw(p);
};
window.tdaResetAxisLimits=function(paneId,side){
  const p=tda().panes.find(p=>p.id===paneId); if(!p) return;
  if(side==='L'||!side){p.yMin_L=null;p.yMax_L=null;}
  if(side==='R'||!side){p.yMin_R=null;p.yMax_R=null;}
  // Clear input fields
  const ph=document.querySelector(`#pane_${paneId} .tda-ph`)||document.querySelector(`.tda-ph`);
  renderDataAnalysis(); // re-render to clear inputs
};
window.tdaShiftSignal=function(paneId,sigIdx,delta,reset){
  const p=tda().panes.find(p=>p.id===paneId); if(!p) return;
  const s=p.signals[sigIdx]; if(!s) return;
  s.yOffset = reset ? 0 : ((s.yOffset||0) + delta);
  renderDataAnalysis(); // re-render to update % display and redraw
};
window.tdaToggleRightAxis=function(paneId,enabled){
  const p=tda().panes.find(p=>p.id===paneId); if(!p) return;
  p.rightAxisEnabled=enabled;
  // When enabling right axis, move last signal to right if there are multiple
  if(enabled && p.signals.length>1){
    p.signals[p.signals.length-1].yAxis='R';
  }
  if(!enabled){ p.signals.forEach(s=>s.yAxis='L'); }
  renderDataAnalysis();
};
window.tdaToggleSignalAxis=function(paneId,sigIdx){
  const p=tda().panes.find(p=>p.id===paneId); if(!p) return;
  const s=p.signals[sigIdx]; if(!s) return;
  s.yAxis = s.yAxis==='R' ? 'L' : 'R';
  if(s.yAxis==='R' && !p.rightAxisEnabled) p.rightAxisEnabled=true;
  renderDataAnalysis();
};

/* ═══ DOWNLOAD PANE AS JPEG ═══ */
window.tdaDownloadPane=function(paneId, label){
  const canvas=document.getElementById('cv_'+paneId);
  if(!canvas){alert('No chart found for this pane.');return;}
  // Create a temp canvas with white-ish dark background for JPEG (no transparency)
  const tmp=document.createElement('canvas');
  tmp.width=canvas.width;
  tmp.height=canvas.height;
  const ctx2=tmp.getContext('2d');
  // Fill dark background (JPEG doesn't support transparency)
  ctx2.fillStyle='#07080b';
  ctx2.fillRect(0,0,tmp.width,tmp.height);
  ctx2.drawImage(canvas,0,0);
  // Add label overlay
  ctx2.fillStyle='rgba(255,255,255,0.7)';
  ctx2.font='bold 11px JetBrains Mono, monospace';
  ctx2.fillText(label||'Chart', 8, 16);
  // Get the data file name for naming the download
  const d=tdaSheet();
  const fName=(d?d.fileName.replace(/\.[^.]+$/,''):'chart')+'_'+(label||paneId).replace(/[^a-zA-Z0-9_]/g,'_');
  const link=document.createElement('a');
  link.download=fName+'.jpg';
  link.href=tmp.toDataURL('image/jpeg',0.95);
  link.click();
};

/* ═══ EXPORT ═══ */
window.tdaExport=function(){
  const t=tda(),d=tdaSheet(),S=window.S||{};
  if(!d) return;
  const lines=['BatteryMIS Test Data Analysis',`File: ${d.fileName}`,`Date: ${new Date().toLocaleString()}`,
    `Project: ${S.c_chem||''} ${S.S_total||''}S/${S.c_pp||''}P V_nom=${S.V_nom_pack?.toFixed(0)||''}V`,'',
    'Pane Statistics:',
    ...tda().panes.map(p=>[`[${p.label}]`,
      ...p.signals.map(s=>{const vals=d.rows.map(r=>+r[s.ci]).filter(v=>!isNaN(v));const mn=Math.min(...vals),mx=Math.max(...vals),mean=vals.reduce((a,b)=>a+b)/vals.length;return `  ${d.headers[s.ci]}: min=${mn.toFixed(3)} max=${mx.toFixed(3)} avg=${mean.toFixed(3)}`})].join('\n')),
    '','AI Analysis:',t.aiResult?.replace(/<[^>]+>/g,'')||'(not run)'];
  const a=document.createElement('a');
  a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(lines.join('\n'));
  a.download=`TDA_${d.fileName.replace(/\.\w+$/,'')}_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
};
window.tdaClear=function(){window._tda={sheets:[],activeSheet:0,panes:[],cursor:null,zoomX:{x0:0,x1:1},aiResult:null,dragSig:null,browserWidth:220};renderDataAnalysis();};


/* inlined: drive-cycle-fix.js */
/* ═══════════════════════════════════════════════════════════════
   BatteryMIS - DRIVE CYCLE FIX  v3.0
   Fixes: P_avg unit detection (W vs kW), column detection,
   column override UI, clear file, submit/lock, chart reconnect,
   histogram, delete rows, thermal rise auto-link
   ═══════════════════════════════════════════════════════════════ */

window._dcCSV      = null;
window._dcMode     = 'manual';
window._dcRawCols  = null;   // raw header strings for override UI
window._dcColMap   = { t:0, p:1, v:null, i:null, pUnit:'kW' };

/* ─── File handler ─── */
window.dcHandleFile = function(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  const prog  = document.getElementById('dc_progress');
  const bar   = document.getElementById('dc_prog_bar');
  const lbl   = document.getElementById('dc_prog_label');
  if (prog) prog.style.display = 'block';
  if (bar)  bar.style.width   = '10%';
  if (lbl)  lbl.textContent   = `Reading ${file.name} (${(file.size/1024).toFixed(0)} KB)…`;

  const run = () => {
    if (ext === 'csv' || ext === 'txt') {
      const r = new FileReader();
      r.onprogress = e => { if (e.lengthComputable && bar) bar.style.width = (e.loaded/e.total*50)+'%'; };
      r.onload = e => dcParseText(e.target.result, file.name, lbl, bar, prog);
      r.readAsText(file);
    } else {
      const r = new FileReader();
      r.onload = e => {
        try {
          if (bar) bar.style.width = '40%';
          const wb = XLSX.read(new Uint8Array(e.target.result), { type:'array' });
          let best = null, bestN = 0;
          wb.SheetNames.forEach(name => {
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header:1, defval:'' });
            const n = rows.flat().filter(v => !isNaN(parseFloat(v)) && v !== '').length;
            if (n > bestN) { bestN = n; best = { name, rows }; }
          });
          if (!best) { if (lbl) lbl.textContent = '⚠ No numeric data found in Excel.'; return; }
          if (bar) bar.style.width = '60%';
          const text = best.rows.map(r => r.join('\t')).join('\n');
          dcParseText(text, file.name + ' [' + best.name + ']', lbl, bar, prog, '\t');
        } catch(err) { if (lbl) lbl.textContent = '⚠ Excel error: ' + err.message; }
      };
      r.readAsArrayBuffer(file);
    }
  };

  if ((ext==='xlsx'||ext==='xls') && typeof XLSX === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = run;
    s.onerror = () => { if (lbl) lbl.textContent = '⚠ Could not load Excel parser.'; };
    document.head.appendChild(s);
  } else { run(); }
};

function dcParseText(text, fileName, lbl, bar, prog, forceDelim) {
  const MAX = 21600;
  setTimeout(() => {
    try {
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const delim = forceDelim || (lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',');
      const hasHdr = isNaN(parseFloat(lines[0].split(delim)[0].trim()));
      const hdrRaw = hasHdr ? lines[0].split(delim).map(h => h.trim()) : null;
      const hdr    = hdrRaw ? hdrRaw.map(h => h.toLowerCase().replace(/[^a-z0-9]/g,'')) : null;

      /* Auto-detect columns */
      const colMap = dcDetectCols(hdr, hdrRaw);
      window._dcRawCols = hdrRaw || lines[0].split(delim).map((_,i)=>`Col ${i}`);
      window._dcColMap  = { ...colMap };

      /* Parse rows */
      const pts = [];
      const startIdx = hasHdr ? 1 : 0;
      let   warnUnit = false;

      for (let i = startIdx; i < Math.min(lines.length, startIdx+MAX+1); i++) {
        const l = lines[i].trim();
        if (!l || l.startsWith('#') || l.startsWith('//')) continue;
        const cols = l.split(delim);
        const t = parseFloat(cols[colMap.t]);
        let   p = parseFloat(cols[colMap.p]);
        if (isNaN(t)) continue;
        if (isNaN(p)) continue;
        /* Unit auto-detection: if values look like Watts (>500 typical) → convert */
        if (colMap.pUnit === 'W') p = p / 1000;
        const row = { t, p };
        if (colMap.v != null) { const v=parseFloat(cols[colMap.v]); if(!isNaN(v)) row.v=v; }
        if (colMap.i != null) { const iv=parseFloat(cols[colMap.i]); if(!isNaN(iv)) row.i=iv; }
        pts.push(row);
      }

      if (pts.length < 2) {
        if (lbl) lbl.textContent = `⚠ Only ${pts.length} valid rows. Check column headers or use manual override below.`;
        dcShowColDiag(hdrRaw, lines, delim, startIdx);
        return;
      }

      window._dcCSV  = pts;
      window._dcMode = 'csv';

      if (bar) bar.style.width = '100%';
      setTimeout(() => { if (prog) prog.style.display = 'none'; }, 1200);

      const badge = document.getElementById('dc_file_badge');
      const clearBtn = document.getElementById('dc_clear_btn');
      if (badge) {
        const dur = ((pts[pts.length-1].t - pts[0].t)/3600).toFixed(2);
        badge.style.display = 'block';
        badge.innerHTML = `✓ <b>${fileName}</b> · ${pts.length.toLocaleString()} rows · ${dur}h · power col: <b>${window._dcRawCols[colMap.p]||'#'+colMap.p}</b> (${colMap.pUnit})`;
      }
      if (clearBtn) clearBtn.style.display = 'inline-block';

      dcShowColDiag(hdrRaw, lines, delim, startIdx);
      dcRenderColOverride();
      if (lbl) lbl.textContent = `✓ ${pts.length.toLocaleString()} points · power: ${window._dcRawCols[colMap.p]||'col '+colMap.p} [${colMap.pUnit}]`;

      dcAnalyseAndUpdate(pts);
    } catch(err) {
      if (lbl) lbl.textContent = '⚠ Parse error: ' + err.message;
      console.error('[DC parse]', err);
    }
  }, 20);
}

/* ─── Column detection with unit inference ─── */
function dcDetectCols(hdr, hdrRaw) {
  const map = { t:0, p:1, v:null, i:null, pUnit:'kW' };
  if (!hdr || !hdr.length) return map;
  const f = (...keys) => {
    for (const k of keys) {
      const i = hdr.findIndex(h => h.includes(k));
      if (i >= 0) return i;
    }
    return null;
  };
  map.t = f('times','timesec','time','tsec','ts','timestamp','elapsed') ?? 0;
  map.p = f('powerkw','pkw','powerkwh') ?? f('power','pw','kw') ?? f('pwr','watt','kwatt') ?? 1;
  map.v = f('volt','voltage','vcell','vpack','vbus');
  map.i = f('current','amp','ia','ibat','ipack','currentamp');

  /* Unit detection: look at raw header for explicit unit label */
  const rawP = hdrRaw ? (hdrRaw[map.p] || '').toLowerCase() : '';
  if (rawP.includes('(w)') || rawP.includes('[w]') || rawP.endsWith(' w') || rawP === 'w') {
    map.pUnit = 'W';
  } else if (rawP.includes('(kw)') || rawP.includes('[kw]') || rawP.includes('kw')) {
    map.pUnit = 'kW';
  } else {
    /* Heuristic: sample first 10 data values - if median > 500, likely Watts */
    map.pUnit = 'auto'; /* resolved after sampling in caller */
  }
  return map;
}

/* ─── Show raw column diagnostic ─── */
function dcShowColDiag(hdrRaw, lines, delim, startIdx) {
  const diag = document.getElementById('dc_col_diag');
  const body = document.getElementById('dc_col_diag_body');
  if (!diag || !body) return;
  diag.style.display = 'block';
  const sampleLines = lines.slice(startIdx, startIdx+3);
  const cols = window._dcRawCols || [];
  const cm   = window._dcColMap  || {};
  let html = `<div style="color:var(--teal);margin-bottom:4px">Headers: ${cols.map((c,i)=>`<b style="color:${i===cm.t?'#4a9eff':i===cm.p?'#00d4aa':i===cm.v?'#f5c518':i===cm.i?'#ff7b35':'var(--text3)'}">[${i}]${c}</b>`).join(' ')}</div>`;
  html += `<div style="color:var(--text3)">Detected: Time=col[${cm.t}] Power=col[${cm.p}](${cm.pUnit}) ${cm.v!=null?'Voltage=col['+cm.v+']':''} ${cm.i!=null?'Current=col['+cm.i+']':''}</div>`;
  html += `<div style="margin-top:4px">Sample rows:</div>`;
  sampleLines.forEach((l,i) => { html += `<div style="color:var(--text2)">#${i+1}: ${l.split(delim).map((v,ci)=>`<span style="color:${ci===cm.p?'#00d4aa':ci===cm.t?'#4a9eff':'var(--text3)'}">${v.trim()}</span>`).join(' | ')}</div>`; });
  body.innerHTML = html;
}

/* ─── Column override UI ─── */
function dcRenderColOverride() {
  const wrap = document.getElementById('dc_col_map');
  const sel  = document.getElementById('dc_col_selects');
  if (!wrap || !sel || !window._dcRawCols) return;
  wrap.style.display = 'block';
  const cols = window._dcRawCols;
  const cm   = window._dcColMap;
  const opts = cols.map((c,i)=>`<option value="${i}">${i}: ${c}</option>`).join('');
  const noneOpt = '<option value="-1">- none -</option>';
  const mk = (label, key, val, hasNone=false) => `
    <div>
      <div style="font-size:9px;font-family:var(--mono);color:var(--text3);margin-bottom:3px">${label}</div>
      <select id="dc_col_${key}" style="width:100%;padding:4px 6px;background:var(--bg3);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:11px">
        ${hasNone?noneOpt:''}${opts}
      </select>
    </div>`;
  const unitSel = `
    <div>
      <div style="font-size:9px;font-family:var(--mono);color:var(--text3);margin-bottom:3px">POWER UNIT</div>
      <select id="dc_col_punit" style="width:100%;padding:4px 6px;background:var(--bg3);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:11px">
        <option value="kW" ${cm.pUnit==='kW'?'selected':''}>kW (kilowatts)</option>
        <option value="W"  ${cm.pUnit==='W'?'selected':''}>W (watts → ÷1000)</option>
        <option value="auto">Auto-detect</option>
      </select>
    </div>`;
  sel.innerHTML = mk('TIME column (s)','t',cm.t) + mk('POWER column','p',cm.p) + mk('VOLTAGE column (V)','v',cm.v,true) + mk('CURRENT column (A)','i',cm.i,true) + unitSel;
  sel.querySelector('#dc_col_t').value  = cm.t;
  sel.querySelector('#dc_col_p').value  = cm.p != null ? cm.p : 1;
  if (cm.v != null) sel.querySelector('#dc_col_v').value = cm.v;
  if (cm.i != null) sel.querySelector('#dc_col_i').value = cm.i;
}

window.dcReapplyColMap = function() {
  const gi = id => { const el=document.getElementById(id); return el ? parseInt(el.value) : null; };
  window._dcColMap.t     = gi('dc_col_t') ?? 0;
  window._dcColMap.p     = gi('dc_col_p') ?? 1;
  window._dcColMap.v     = gi('dc_col_v') === -1 ? null : gi('dc_col_v');
  window._dcColMap.i     = gi('dc_col_i') === -1 ? null : gi('dc_col_i');
  window._dcColMap.pUnit = document.getElementById('dc_col_punit')?.value || 'kW';
  /* Re-parse stored CSV with new column map */
  if (!window._dcCSV || !window._dcRawData) {
    alert('Re-upload file to apply new column mapping'); return;
  }
  dcParseText(window._dcRawData, window._dcRawFileName || 'file',
    document.getElementById('dc_prog_label'),
    document.getElementById('dc_prog_bar'),
    document.getElementById('dc_progress'));
};

/* ─── Clear file ─── */
window.dcClearFile = function() {
  window._dcCSV  = null;
  window._dcMode = 'manual';
  const badge = document.getElementById('dc_file_badge');
  const clearBtn = document.getElementById('dc_clear_btn');
  const diag = document.getElementById('dc_col_diag');
  const colMap = document.getElementById('dc_col_map');
  const fileInput = document.getElementById('dc_file');
  if (badge) badge.style.display   = 'none';
  if (clearBtn) clearBtn.style.display = 'none';
  if (diag) diag.style.display     = 'none';
  if (colMap) colMap.style.display  = 'none';
  if (fileInput) fileInput.value    = '';
  /* Unlock dc_pavg */
  const pavgEl = document.getElementById('dc_pavg');
  if (pavgEl) { pavgEl.readOnly=false; pavgEl.style.borderColor=''; pavgEl.style.background=''; }
  const lbl = document.getElementById('dc_prog_label');
  if (lbl) lbl.textContent = 'File cleared - using manual data';
  /* Re-analyse from manual rows */
  const pts = window.getDCPoints();
  if (pts.length >= 2) dcAnalyseAndUpdate(pts);
  try { drawDriveCycleCanvas && drawDriveCycleCanvas(); } catch(e) {}
};

/* ─── Submit / lock ─── */
window.dcSubmitAndLock = function() {
  const pts = window.getDCPoints();
  if (pts.length < 2) { alert('No drive cycle data. Upload a file or add manual points.'); return; }
  dcAnalyseAndUpdate(pts);
  /* Visual confirmation */
  const btn = document.querySelector('[onclick="dcSubmitAndLock()"]');
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = '✓ Submitted - All tabs updated';
    btn.style.background = 'rgba(0,212,170,.3)';
    setTimeout(() => { btn.textContent=orig; btn.style.background=''; }, 2500);
  }
  try { propagate && propagate(); } catch(e) {}
  try { runThermalRise && runThermalRise(); } catch(e) {}
};

/* ─── getDCPoints override ─── */
window.getDCPoints = function() {
  if (window._dcCSV && window._dcCSV.length >= 2 && window._dcMode === 'csv') return window._dcCSV;
  const pts = [];
  document.querySelectorAll('#dc_manual_rows .dc-row').forEach(r => {
    const t=parseFloat(r.querySelector('.dc-t')?.value);
    const p=parseFloat(r.querySelector('.dc-p')?.value);
    if (!isNaN(t) && !isNaN(p)) pts.push({t,p});
  });
  return pts.sort((a,b)=>a.t-b.t);
};

/* ─── Core analysis ─── */
window.dcAnalyseAndUpdate = function(pts) {
  if (!pts || pts.length < 2) return;
  const S   = window.S || {};
  const dur = pts[pts.length-1].t - pts[0].t;
  let E=0, Er=0, P2=0, Pmax=0, Pregen_max=0;

  /* Unit auto-detect on raw values if pUnit==='auto' */
  if (window._dcMode === 'csv' && window._dcColMap?.pUnit === 'auto') {
    const sample = pts.slice(0, Math.min(50,pts.length)).map(p=>Math.abs(p.p));
    const median = sample.sort((a,b)=>a-b)[Math.floor(sample.length/2)];
    if (median > 200) {
      /* Values look like Watts - convert entire array */
      pts.forEach(p => p.p /= 1000);
      window._dcColMap.pUnit = 'W→kW';
      const lbl = document.getElementById('dc_prog_label');
      if (lbl) lbl.textContent += ' · ⚠ Power detected in W → converted to kW (÷1000)';
    } else {
      window._dcColMap.pUnit = 'kW';
    }
  }

  for (let i=1; i<pts.length; i++) {
    const dt  = pts[i].t - pts[i-1].t;
    if (dt <= 0) continue;
    const Pav = (pts[i].p + pts[i-1].p) / 2;
    E   += Pav * dt / 3600;
    if (Pav < 0) { Er += Math.abs(Pav) * dt / 3600; if (Math.abs(Pav)>Pregen_max) Pregen_max=Math.abs(Pav); }
    P2  += Pav * Pav * dt;
    if (Pav > Pmax) Pmax = Pav;
  }

  /* True time-weighted average */
  const Pavg     = dur > 0 ? E * 3600 / dur : 0;
  const Pavg_dis = Math.max(0, Pavg);
  const Prms     = dur > 0 ? Math.sqrt(P2 / dur) : 0;
  const regenPct = E + Er > 0 ? Er/(E+Er)*100 : 0;
  const dur_h    = (dur/3600).toFixed(2);
  const autonomy = S.E_usable > 0 && Pavg_dis > 0.01 ? (S.E_usable/Pavg_dis).toFixed(1) : '-';

  /* Store in S */
  if (window.S) { window.S.dc_pavg=Pavg_dis; window.S.dc_ppeak=Pmax; window.S.dc_dur_h=+dur_h; }

  /* Update dc_pavg field */
  const pavgEl = document.getElementById('dc_pavg');
  if (pavgEl) {
    pavgEl.value    = Pavg_dis.toFixed(2);
    pavgEl.readOnly = window._dcMode === 'csv';
    pavgEl.style.borderColor = window._dcMode==='csv' ? 'rgba(0,212,170,.5)' : '';
    pavgEl.style.background  = window._dcMode==='csv' ? 'rgba(0,212,170,.05)' : '';
  }
  const srcEl = document.getElementById('dc_pavg_src');
  if (srcEl) srcEl.textContent = window._dcMode==='csv' ? `← ${Pavg_dis.toFixed(2)} kW from file` : '← calculated';

  /* Push to linked fields */
  if (typeof setField==='function') {
    setField('curr_phyd', Pavg_dis.toFixed(2));
    setField('lc_pavg',   Pavg_dis.toFixed(2));
    setField('dc_ppeak',  Pmax.toFixed(1));
    setField('dc_dur',    (dur/60).toFixed(0));
  }
  try { calcCurrent   && calcCurrent();   } catch(e) {}
  try { calcLifecycle && calcLifecycle(); } catch(e) {}

  /* Results */
  const ri2=(l,v,u,c='')=>`<div class="ri ${c}"><span>${l}</span><b>${v} <small>${u}</small></b></div>`;
  const rEl = document.getElementById('dc_results');
  if (rEl) rEl.innerHTML = `<div class="rg">
    ${ri2('Duration',        dur_h,              'h',  'blue')}
    ${ri2('P_avg (time-wtd)',Pavg_dis.toFixed(3),'kW', 'blue')}
    ${ri2('P_rms',           Prms.toFixed(3),    'kW')}
    ${ri2('P_peak',          Pmax.toFixed(2),    'kW', 'warn')}
    ${ri2('P_regen peak',    Pregen_max.toFixed(2),'kW','ok')}
    ${ri2('Energy demand',   E.toFixed(3),       'kWh','blue')}
    ${ri2('Regen energy',    Er.toFixed(3),      'kWh','ok')}
    ${ri2('Regen fraction',  regenPct.toFixed(1),'%',  'ok')}
    ${ri2('Data points',     pts.length.toLocaleString(),'')}
    ${ri2('Est. autonomy',   autonomy,           'h',  Pavg_dis>0?'blue':'')}
  </div>`;

  /* Energy budget */
  const bEl = document.getElementById('dc_energy_budget');
  if (bEl && typeof tbar==='function') {
    const mxE = Math.max(S.E_usable||43,E)*1.2;
    bEl.innerHTML =
      tbar('Pack usable energy', (S.E_usable||43).toFixed(1), mxE, 'kWh', 'var(--g)') +
      tbar('Cycle energy demand',E.toFixed(2), mxE, 'kWh', 'var(--b)') +
      tbar('Regen recovered',    Er.toFixed(2),mxE, 'kWh', 'var(--ok)') +
      `<div style="margin-top:8px;font-size:11px;color:var(--m)">
        Autonomy: <b style="color:var(--g)">${autonomy} h</b> @ P_avg ${Pavg_dis.toFixed(2)} kW
        &nbsp;·&nbsp; ${dur_h}h cycle · ${pts.length.toLocaleString()} pts
      </div>`;
  }

  /* Point count + sync badges */
  const ptEl = document.getElementById('dc_pt_count');
  if (ptEl) ptEl.textContent = `${pts.length.toLocaleString()} pts · ${dur_h}h`;
  const syncEl = document.getElementById('dc_thermal_sync');
  if (syncEl) syncEl.textContent = `✓ P_avg ${Pavg_dis.toFixed(2)} kW · P_peak ${Pmax.toFixed(2)} kW · ${dur_h}h`;

  /* Histogram */
  dcRenderHistogram(pts);

  /* Chart */
  try { drawDriveCycleCanvas && drawDriveCycleCanvas(); } catch(e) {}

  /* Thermal rise */
  setTimeout(() => { try { runThermalRise && runThermalRise(); } catch(e) {} }, 120);
};

/* ─── Power histogram ─── */
function dcRenderHistogram(pts) {
  const wrap = document.getElementById('dc_histogram');
  if (!wrap) return;
  const powers = pts.map(p=>p.p);
  const mn=Math.min(...powers), mx=Math.max(...powers);
  const bins=12, bw=(mx-mn)/bins||1;
  const counts=Array(bins).fill(0);
  powers.forEach(p=>{const b=Math.min(bins-1,Math.floor((p-mn)/bw));counts[b]++;});
  const maxC=Math.max(...counts,1);
  const H=40;
  const bars=counts.map((c,i)=>{
    const lo=(mn+i*bw).toFixed(1);
    const h=Math.max(c?2:0,Math.round(c/maxC*H));
    const col=+lo<0?'var(--g)':+lo>0?'var(--b)':'var(--text3)';
    return `<div title="${lo}kW: ${c}pts" style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:0">
      <div style="width:100%;background:${col};height:${h}px;border-radius:2px 2px 0 0"></div>
      <div style="font-size:8px;color:var(--text3);margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:36px">${lo}</div>
    </div>`;
  }).join('');
  wrap.innerHTML=`<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:8px">
    <div style="font-size:10px;color:var(--text3);font-family:var(--mono);margin-bottom:4px">Power distribution (kW) - ${pts.length.toLocaleString()} pts</div>
    <div style="display:flex;gap:2px;align-items:flex-end;height:${H+20}px">${bars}</div>
  </div>`;
}

/* ─── Manual row input listener ─── */
document.addEventListener('input', e => {
  if (window._dcMode==='csv') return;
  if (e.target.classList.contains('dc-t')||e.target.classList.contains('dc-p')) {
    clearTimeout(window._dcManualTimer);
    window._dcManualTimer=setTimeout(()=>{
      const pts=window.getDCPoints();
      if(pts.length>=2){window._dcMode='manual';dcAnalyseAndUpdate(pts);}
    },350);
  }
});

/* ─── dc_pavg manual edit ─── */
window.dcOnPavgEdit = function() {
  if (window._dcMode==='csv') return;
  const v=+(document.getElementById('dc_pavg')?.value||0);
  if(typeof setField==='function'){setField('curr_phyd',v.toFixed(2));setField('lc_pavg',v.toFixed(2));}
  if(window.S) window.S.dc_pavg=v;
};

/* ─── Thermal Rise pre-sync wrapper ─── */
(function(){
  const _orig=window.runThermalRise;
  window.runThermalRise=function(){
    const S=window.S||{};
    const sf=(id,v)=>{try{const el=document.getElementById(id);if(el&&v!=null&&!isNaN(+v))el.value=+v;}catch(e){}};
    sf('tr_Vnom', S.V_nom_pack||358);
    sf('tr_Qah',  S.Q_pack||120);
    if(S.t_tcell_max){sf('tr_T_limit',S.t_tcell_max);sf('tr_T_derate',S.t_tcell_max-10);}
    if(S.t_top_hi) sf('tr_Tamb',S.t_top_hi);
    const Cth=(S.pack_mass||0)*(S.c_cp_pack||1025)/1000;
    if(Cth>1) sf('tr_Cth',Cth.toFixed(1));
    const ir=S._packIR_bol||((S.c_ir_bol||0.22)*(S.S_total||112)/(S.c_pp||1));  // mΩ - NO ×1000
    if(ir>0) sf('tr_ir',ir.toFixed(2));
    const c=document.getElementById('tr_canvas');
    if(c){const W=c.parentElement?.clientWidth||900;if(W>200)c.width=W;c.height=480;}
    if(typeof _orig==='function') try{_orig();}catch(err){console.warn('[TR]',err);}
  };
})();

/* ─── Compat ─── */
window.analyzeDriveCycle=function(input){if(input?.files?.[0])dcHandleFile(input.files[0]);};

/* ─── Auto-analyse on load ─── */
window.addEventListener('load',()=>{
  setTimeout(()=>{
    if(window._dcMode!=='csv'){
      const pts=window.getDCPoints();
      if(pts.length>=2){window._dcMode='manual';dcAnalyseAndUpdate(pts);}
    }
  },2000);
});


/* inlined: tvr-upgrade.js */
/* ═══════════════════════════════════════════════════════════════
   BatteryMIS - TVR UPGRADE + TEMPERATURE DERATING  v1.0

   Part A: Extends runTVR() with 15 additional check rows:
     DCIR, BMS thresholds, IP, altitude, weight/GED, precharge,
     drive cycle P_avg, busbar, pack voltage class, HV safety,
     pack dimensions, charge temp window, regen, DCIR cold start

   Part B: Temperature Derating sheet (new Engineering sub-tab)
     - Discharge power derating vs cell temperature
     - Charge derating vs temperature + SoC
     - OCV sag at low SoC
     - Auto-links from S state (V_nom, I_max, T limits)
     - Canvas chart + results table
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════
   PART A - TVR EXTENDED CHECKS
   Patches runTVR() to append additional rows
   ════════════════════════════════════════════════════ */
(function patchTVR() {
  const _orig = window.runTVR;
  window.runTVR = function() {
    /* Run original first */
    if (typeof _orig === 'function') _orig();

    const tbody = document.getElementById('tvr_tbody');
    if (!tbody) return;

    const S   = window.S || {};
    // sv: DOM first → S object → fallback (ensures live values from source fields)
    const sv  = (k, fb=0) => {
      const el = document.getElementById(k);
      if (el && el.value !== '') return +el.value || fb;
      const v = S[k];
      return (v!==undefined && v!==null && v!=='') ? +v : fb;
    };
    const gv  = id => { const el=document.getElementById(id); return el ? (el.value||'') : ''; };
    const gvn = id => { const el=document.getElementById(id); return el && el.value!=='' ? +el.value : 0; };

    const badge = (pass, warn) =>
      pass  ? '<span style="display:inline-block;padding:3px 10px;background:rgba(0,212,170,.15);border:1px solid rgba(0,212,170,.4);border-radius:5px;color:#00d4aa;font-size:12px;font-weight:700">✓ PASS</span>'
      : warn? '<span style="display:inline-block;padding:3px 10px;background:rgba(245,197,24,.12);border:1px solid rgba(245,197,24,.4);border-radius:5px;color:#f5c518;font-size:12px;font-weight:700">⚠ CAUTION</span>'
      :       '<span style="display:inline-block;padding:3px 10px;background:rgba(255,77,109,.12);border:1px solid rgba(255,77,109,.4);border-radius:5px;color:#ff4d6d;font-size:12px;font-weight:700">✗ FAIL</span>';

    const mkRow = (param, mod, tgtVal, resVal, unit, pass, warn, note='') => {
      const fmt = v => (v===null||v===undefined||v==='') ? '-' : String(v)+unit;
      const mNum = (tgtVal!==null&&resVal!==null&&!isNaN(+resVal)&&!isNaN(+tgtVal)) ? (+resVal - +tgtVal) : null;
      const mStr = mNum!==null ? (mNum>=0?'+':'')+mNum.toFixed(2)+unit : '-';
      const mCol = mNum===null?'#6d8fba': pass?'#00d4aa': warn?'#f5c518':'#ff4d6d';
      const rowBg = pass?'' : warn?'background:rgba(245,197,24,.04)':'background:rgba(255,77,109,.04)';
      return `<tr style="border-bottom:1px solid var(--border);${rowBg}">
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:var(--text)">${param}</td>
        <td style="padding:10px 14px;text-align:center"><span style="font-size:11px;background:var(--bg3);border:1px solid var(--border);padding:2px 8px;border-radius:4px;color:var(--text2)">${mod}</span></td>
        <td style="padding:10px 14px;text-align:right;font-family:var(--mono);font-size:13px;color:#4a9eff">${fmt(tgtVal)}</td>
        <td style="padding:10px 14px;text-align:right;font-family:var(--mono);font-size:14px;font-weight:700;color:#f5c518">${fmt(resVal)}</td>
        <td style="padding:10px 14px;text-align:right;font-family:var(--mono);font-size:12px;color:${mCol}">${mStr}</td>
        <td style="padding:10px 14px;text-align:center">${badge(pass,warn)}</td>
        <td style="padding:10px 14px;font-size:12px;color:var(--text3)">${note}</td>
      </tr>`;
    };

    const addRows = [];
    let addPass=0, addWarn=0, addFail=0;
    const track = (html, p, w) => { addRows.push(html); if(p) addPass++; else if(w) addWarn++; else addFail++; };

    /* Shorthand values */
    // Always compute fresh from Cell Inputs DOM (sv reads DOM first → S → fallback)
    const c_cps_v= sv('c_cps', 14);
    const c_ss_v = sv('c_ss',  8);
    const Ss    = (c_cps_v * c_ss_v) || sv('S_total', 112);
    const Pp    = sv('c_pp', 1);
    const c_vn  = sv('c_vnom', 3.2);
    const Vnom  = (Ss * c_vn) || sv('V_nom_pack', 0);
    const Qpack = sv('c_ah', 120) * Pp;
    const Eg    = (Vnom * Qpack / 1000) || sv('E_gross', 43);
    const ir_bol= sv('c_ir_bol', 0.22);
    const ir_eol= sv('c_ir_eol', 0.35);
    const Ppeak = sv('t_ppeak', 80);
    const I_peak= Vnom>0 ? Ppeak*1000/Vnom : 300;
    const c_mass_v = sv('c_mass', 2800);
    const pm    = sv('pack_mass', 0) || (c_cps_v*c_ss_v*Pp*c_mass_v/1000 + sv('c_housing_mass',50));

    /* ── DCIR & Resistance ── */
    const pack_ir_bol = ir_bol * Ss / Pp; // mΩ pack level
    const pack_ir_eol = ir_eol * Ss / Pp;
    const ir_growth   = ir_bol > 0 ? (ir_eol / ir_bol) : 0;
    const ir_bol_max = sv('t_ir_bol_max', 500);
    const ir_bol_warn = ir_bol_max * 1.2;
    track(mkRow('Pack IR BoL @25°C/50%SoC', 'Resistance', '≤' + ir_bol_max.toFixed(0), pack_ir_bol.toFixed(1), ' mΩ',
      pack_ir_bol<=ir_bol_max, pack_ir_bol<=ir_bol_warn, `${Ss}S/${Pp}P × ${ir_bol} mΩ/cell → edit target in Project Targets → Extended Check Targets`), pack_ir_bol<=ir_bol_max, pack_ir_bol<=ir_bol_warn);
    const ir_growth_max = sv('t_ir_growth_max', 2.0);
    const ir_growth_warn = ir_growth_max * 1.25;
    track(mkRow('IR Growth BoL→EoL', 'DCIR', '≤' + ir_growth_max.toFixed(1) + '×', ir_growth>0?ir_growth.toFixed(2):'-', '×',
      ir_growth<=ir_growth_max||ir_growth===0, ir_growth<=ir_growth_warn||ir_growth===0, `${ir_bol}→${ir_eol} mΩ - edit target in Project Targets`), ir_growth<=ir_growth_max||ir_growth===0, ir_growth<=ir_growth_warn||ir_growth===0);

    /* ── DCIR cold-start voltage drop ── */
    const dcirCold = ir_bol * 4.5 * Ss / Pp; // ×4.5 at -10°C / 20%SoC (from DCIR model)
    const Vdrop_cold = dcirCold * 1e-3 * I_peak;
    const Vdrop_pct  = Vnom > 0 ? Vdrop_cold / Vnom * 100 : 0;
    const vdrop_max = sv('t_vdrop_cold_max', 5);
    const vdrop_warn = vdrop_max * 1.6;
    track(mkRow('Cold-start ΔV (−10°C, 20%SoC)', 'DCIR', '≤' + vdrop_max.toFixed(0) + '%', Vdrop_pct.toFixed(1), ' % V_nom',
      Vdrop_pct<=vdrop_max, Vdrop_pct<=vdrop_warn, `${Vdrop_cold.toFixed(1)}V drop at ${I_peak.toFixed(0)}A peak - edit in Project Targets`), Vdrop_pct<=vdrop_max, Vdrop_pct<=vdrop_warn);

    /* ── BMS thresholds ── */
    // BMS thresholds from Cell Inputs
    const c_vmax = sv('c_vmax', 3.65);  // LFP default
    const c_vmin = sv('c_vmin', 2.0);
    const c_vnom = sv('c_vnom', 3.2);
    const bms_ovp = c_vmax + 0.05;  // OVP = Vmax + 50mV
    const bms_uvp = c_vmin - 0.05;  // UVP = Vmin - 50mV
    const bms_window = c_vmax - c_vmin;
    const bms_ovp_target = (c_vmax + 0.02).toFixed(3) + ' V/cell (Vmax+20mV)';
    track(mkRow('BMS OVP threshold', 'BMS', bms_ovp_target, bms_ovp.toFixed(3), ' V/cell',
      bms_ovp > c_vmax && bms_ovp <= c_vmax+0.1, true, `Must be above Vmax (${c_vmax}V) with <100mV margin`), bms_ovp > c_vmax, true);
    const vwindow_min = sv('t_bms_vwindow_min', 1.0);
    const vwindow_warn = vwindow_min * 0.8;
    track(mkRow('Cell voltage window', 'BMS', '≥' + vwindow_min.toFixed(1), bms_window.toFixed(2), ' V',
      bms_window>=vwindow_min, bms_window>=vwindow_warn, `${c_vmin}V–${c_vmax}V = ${bms_window.toFixed(2)}V usable - edit in Project Targets`), bms_window>=vwindow_min, bms_window>=vwindow_warn);

    /* ── IP Rating ── */
    const ip_str = gv('t_ip') || S.t_ip || 'IP67';
    const ip_num = parseInt((String(ip_str).match(/\d+/)||['67'])[0]);
    const ip_ok  = ip_num >= 67;
    const ip_warn= ip_num >= 55;
    track(mkRow('IP Rating', 'Safety', 'IP67+', ip_str, '',
      ip_ok, ip_warn, ip_ok?'Meets IEC 60529 dust+immersion':'Check IP rating against application environment'), ip_ok, ip_warn);

    /* ── Altitude ── */
    const alt = sv('t_alt', 0);
    const alt_ok  = alt <= 5000;
    const alt_warn = alt <= 4000;
    track(mkRow('Operating altitude', 'Safety', '≤5000', alt>0?alt.toFixed(0):'N/S', ' m',
      alt_ok, alt_warn, alt>3000?'Above 3000m: HV creepage clearances must be recalculated (IEC 60664)':'Standard altitude range'), alt_ok, alt_warn);

    /* ── Precharge ── */
    const pc_R = gvn('pc_R') || sv('_pc_R', 0);
    const pc_t = gvn('pc_t_calc') || sv('_pc_t', 0);
    const pc_ok = pc_t > 0 ? pc_t <= 5 : null;
    const pc_time_max = sv('t_pc_time_max', 5);
    const pc_ok2 = pc_t > 0 ? pc_t <= pc_time_max : null;
    track(mkRow('Precharge time', 'Precharge', '≤' + pc_time_max.toFixed(0), pc_t>0?pc_t.toFixed(2):'Run tab', ' s',
      pc_ok2??true, pc_ok2??true, pc_R>0?`R=${pc_R}Ω - edit target in Project Targets`:'Open Precharge tab to calculate'), pc_ok2??true, pc_ok2??true);

    /* ── Drive Cycle P_avg ── */
    const dc_pavg = sv('dc_pavg', 0) || gvn('dc_pavg');
    const Pcont_t = sv('t_pcont', 50);
    const pavg_ok = dc_pavg>0 ? dc_pavg <= Pcont_t : null;
    track(mkRow('Cycle avg power vs P_cont', 'Drive Cycle', Pcont_t.toFixed(0), dc_pavg>0?dc_pavg.toFixed(1):'Upload cycle', ' kW',
      pavg_ok??true, pavg_ok??true, dc_pavg>0?`P_avg ${dc_pavg.toFixed(1)}kW from drive cycle`:'Upload work cycle CSV to check'), pavg_ok??true, pavg_ok??true);

    /* ── Gravimetric Energy Density (pack level) ── */
    const ged_t = sv('t_ged', 100);
    const ged_r = pm > 0 && Eg > 0 ? (Eg*1000/pm) : 0;
    track(mkRow('Pack Gravimetric ED', 'Cell', ged_t.toFixed(0), ged_r>0?ged_r.toFixed(0):'-', ' Wh/kg',
      ged_r>=ged_t||ged_r===0, ged_r>=ged_t*0.9||ged_r===0, pm>0?`${Eg.toFixed(1)}kWh ÷ ${pm.toFixed(0)}kg`:'Fill pack mass in Cell tab'), ged_r>=ged_t||ged_r===0, ged_r>=ged_t*0.9||ged_r===0);

    /* ── Voltage class (HV safety) ── */
    const Vmax_pack = sv('V_max_pack', 420);
    const voltClass  = Vmax_pack > 1000 ? 'Class C' : Vmax_pack > 60 ? 'Class B' : 'Class A';
    const hv_tgt     = gv('t_hv_class') || 'B';
    const hv_labels  = {A:'Class A (≤60V)', B:'Class B (≤1000V)', C:'Class C (>1000V)'};
    const hv_tgt_lbl = hv_labels[hv_tgt] || 'Class B (≤1000V)';
    const vclass_ok  = voltClass === ('Class ' + hv_tgt);
    track(mkRow('HV Voltage Class', 'HV Safety', hv_tgt_lbl, `${voltClass} (${Vmax_pack.toFixed(0)}V)`, '',
      vclass_ok, true, `IEC 6469-1: ${voltClass} - target class editable in Project Targets → Extended Check Targets`), vclass_ok, true);

    /* ── Charge temp window ── */
    const tchg_lo = sv('t_tchg_lo', -10);
    const tchg_hi = sv('t_tchg_hi', 45);
    const window_ok = tchg_hi - tchg_lo >= 40;
    const tchg_window_min = sv('t_tchg_window_min', 40);
    track(mkRow('Charge temp window width', 'Charging', '≥' + tchg_window_min.toFixed(0), (tchg_hi-tchg_lo).toFixed(0), ' °C',
      window_ok, tchg_hi-tchg_lo>=30, `${tchg_lo}°C → ${tchg_hi}°C. Min 40°C window for usability`), window_ok, tchg_hi-tchg_lo>=30);

    /* Regen headroom row removed - not required */

    /* ── Append new rows to table ── */
    if (addRows.length) {
      /* Section divider */
      const divider = `<tr><td colspan="7" style="padding:8px 14px;background:var(--bg3);font-size:10px;font-family:var(--mono);color:var(--teal);letter-spacing:.1em;font-weight:700;text-transform:uppercase">
        ── Extended Checks: DCIR · BMS · Safety · Drive Cycle ──
      </td></tr>`;
      tbody.insertAdjacentHTML('beforeend', divider + addRows.join(''));
    }

    /* Update KPI counts (add to existing) */
    const passEl = document.getElementById('tvr_pass_count');
    const warnEl = document.getElementById('tvr_warn_count');
    const failEl = document.getElementById('tvr_fail_count');
    if (passEl) passEl.textContent = (+passEl.textContent||0) + addPass;
    if (warnEl) warnEl.textContent = (+warnEl.textContent||0) + addWarn;
    if (failEl) failEl.textContent = (+failEl.textContent||0) + addFail;

    /* Update verdict */
    const totalFail = +(failEl?.textContent||0);
    const totalWarn = +(warnEl?.textContent||0);
    const verdict = totalFail > 0
      ? {t:'✗ NO-GO', c:'#ff4d6d', bg:'rgba(255,77,109,.12)', bc:'rgba(255,77,109,.4)'}
      : totalWarn > 0
      ? {t:'⚠ CAUTION', c:'#f5c518', bg:'rgba(245,197,24,.12)', bc:'rgba(245,197,24,.4)'}
      : {t:'✓ GO', c:'#00d4aa', bg:'rgba(0,212,170,.12)', bc:'rgba(0,212,170,.4)'};
    const vc=document.getElementById('tvr_verdict_card');
    const ve=document.getElementById('tvr_verdict');
    if(vc){vc.style.background=verdict.bg;vc.style.borderColor=verdict.bc;}
    if(ve){ve.textContent=verdict.t;ve.style.color=verdict.c;}

    /* ── Export button (add once) ── */
    if (!document.getElementById('tvr_export_btn')) {
      const btn = document.createElement('button');
      btn.id = 'tvr_export_btn';
      btn.textContent = '⬇ Export TVR CSV';
      btn.style.cssText = 'margin-left:12px;padding:9px 20px;background:rgba(74,158,255,.1);border:1px solid rgba(74,158,255,.3);color:var(--blue2);border-radius:7px;font-size:12px;font-weight:700;cursor:pointer';
      btn.onclick = tvrExportCSV;
      document.querySelector('#panel-engineering [onclick="runTVR()"]')?.insertAdjacentElement('afterend', btn);
    }
  };
})();

function tvrExportCSV() {
  const rows = document.querySelectorAll('#tvr_tbody tr');
  const lines = ['Parameter,Module,Target,Result,Margin,Status,Notes'];
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    if (cells.length >= 7) {
      const cols = Array.from(cells).map(c => '"' + c.textContent.trim().replace(/"/g,'""') + '"');
      lines.push(cols.join(','));
    }
  });
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
  a.download = 'BatteryMIS_TVR_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}

/* ════════════════════════════════════════════════════
   PART B - TEMPERATURE DERATING SHEET
   Renders into id="derating" section
   ════════════════════════════════════════════════════ */
window.renderDerating = function() {
  const root = document.getElementById('derating_root');
  if (!root) return;
  const S = window.S || {};
  const srcN = id => { const el=document.getElementById(id); return (el&&el.value!=='')?+el.value:null; };
  const srcS = id => { const el=document.getElementById(id); return el?el.value:null; };

  // ALL values: source DOM first, then S, then sensible fallback
  const chem      = (srcS('c_chem') || S.c_chem || 'LFP').split(' ')[0].toUpperCase();
  const P_peak    = srcN('t_ppeak')    ?? S.t_ppeak    ?? 80;
  const P_cont    = srcN('t_pcont')    ?? S.t_pcont    ?? 50;
  const T_cell_max= srcN('t_tcell_max')?? S.t_tcell_max?? 55;
  const T_derate  = T_cell_max - 10;
  const T_op_lo   = srcN('t_top_lo')   ?? S.t_top_lo   ?? -20;
  const T_op_hi   = srcN('t_top_hi')   ?? S.t_top_hi   ?? 45;
  const V_nom     = S.V_nom_pack || ((srcN('c_cps')||14)*(srcN('c_ss')||8)*(srcN('c_vnom')||S.c_vnom||3.2)) || 400;
  const V_max     = S.V_max_pack || 420;
  const V_min     = S.V_min_pack || 280;
  const ir_bol    = srcN('c_ir_bol')   ?? S.c_ir_bol   ?? 0.22;
  const c_ir_eol  = srcN('c_ir_eol')   ?? S.c_ir_eol   ?? 0.35;
  const S_total   = (srcN('c_cps')||S.c_cps||14)*(srcN('c_ss')||S.c_ss||8);
  const c_pp      = S.c_pp    || srcN('c_pp') || 1;
  const c_ah      = srcN('c_ah') ?? S.c_ah ?? 120;
  const config    = S.config_label || S_total+'S/'+c_pp+'P';
  const cycles    = S.t_cycles   || 3000;

  // DCIR-linked derating: IR growth affects available power at temperature
  const ir_pack_bol = ir_bol * S_total / c_pp;  // mΩ pack BoL
  const ir_pack_eol = c_ir_eol * S_total / c_pp;// mΩ pack EoL
  
  // I_peak at different life stages
  const I_peak_bol = V_nom > 0 ? P_peak * 1000 / V_nom : 0;
  const I_cont_bol = V_nom > 0 ? P_cont * 1000 / V_nom : 0;
  const V_drop_bol = ir_pack_bol * 1e-3 * I_peak_bol;
  const V_drop_eol = ir_pack_eol * 1e-3 * I_peak_bol;
  const V_drop_pct_bol = V_nom > 0 ? (V_drop_bol / V_nom * 100) : 0;
  const V_drop_pct_eol = V_nom > 0 ? (V_drop_eol / V_nom * 100) : 0;

  // Temperature derating profile (generic, chemistry-specific)
  // Based on DCIR map principle: IR increases at low T → power capability drops
  const tempPoints = [];
  for (let T = T_op_lo; T <= T_cell_max + 5; T += 5) {
    let factor = 1.0;
    // Below 0°C: IR roughly doubles per -10°C for Li-ion
    if (T < 0)    factor = Math.max(0.1, 1 - (0 - T) * (chem==='LFP'?0.025:0.035));
    // 0–T_derate: nominal
    if (T >= 0 && T <= T_derate) factor = 1.0;
    // T_derate → T_cell_max: linear derating to 0
    if (T > T_derate && T <= T_cell_max) factor = Math.max(0, 1 - (T - T_derate) / (T_cell_max - T_derate));
    // Above T_cell_max: 0 (cutoff)
    if (T > T_cell_max) factor = 0;
    // Cold temperature also affects charge
    let chg_factor = factor;
    if (T < 0)  chg_factor = Math.max(0, 0.3 + T * 0.03);   // charge severely limited below 0°C
    if (T < -10) chg_factor = 0;
    tempPoints.push({ T, factor, chg_factor,
      P_dis: P_peak * factor,
      P_chg: (S.t_pdc||60) * chg_factor,
      I_dis: (P_peak * factor * 1000) / V_nom,
      C_dis: c_ah > 0 ? (P_peak * factor * 1000) / (V_nom * c_ah * c_pp) : 0,
    });
  }

  // Build derating table rows
  const tableRows = tempPoints.map(p => {
    const inOpRange = p.T >= T_op_lo && p.T <= T_op_hi;
    const bg = p.T > T_cell_max ? 'rgba(255,77,109,.04)' :
               p.T > T_derate   ? 'rgba(245,197,24,.04)' :
               p.T < 0          ? 'rgba(74,158,255,.04)' : '';
    const pCol = p.factor>=1?'var(--g)':p.factor>=0.7?'var(--y)':p.factor>0?'var(--r)':'rgba(255,255,255,.2)';
    return `<tr style="background:${bg};border-bottom:1px solid var(--border)">
      <td style="padding:6px 10px;font-family:var(--mono);font-weight:700;color:${inOpRange?'var(--text)':'var(--text3)'}">${p.T > 0 ? '+' : ''}${p.T}°C${inOpRange?'':' ⚠'}</td>
      <td style="padding:6px 10px;font-family:var(--mono);color:${pCol}">${(p.factor*100).toFixed(0)}%</td>
      <td style="padding:6px 10px;font-family:var(--mono);color:${pCol}">${p.P_dis.toFixed(1)} kW</td>
      <td style="padding:6px 10px;font-family:var(--mono);color:${p.chg_factor<0.5?'var(--r)':'var(--text2)'}">${p.P_chg.toFixed(1)} kW</td>
      <td style="padding:6px 10px;font-family:var(--mono);color:${p.C_dis>2?'var(--r)':p.C_dis>1?'var(--y)':'var(--g)'}">${p.C_dis.toFixed(3)} C</td>
      <td style="padding:6px 10px;font-size:10px;color:var(--text3)">${p.T>T_cell_max?'BMS cutoff':p.T>T_derate?'Active derate':p.T<0?'Cold limit':'Nominal'}</td>
    </tr>`;
  }).join('');

  root.innerHTML = `
<div class="ico-banner" style="margin-bottom:12px">
  🔗 All values from Cell Inputs + Project Targets · ${chem} · ${config} · DCIR BoL ${ir_pack_bol.toFixed(1)}mΩ
</div>

<div class="g3" style="margin-bottom:16px">
  ${[
    {l:'P_peak (project)',   v:P_peak+' kW',          c:'var(--g)'},
    {l:'P_cont (project)',   v:P_cont+' kW',           c:'var(--b)'},
    {l:'T_cell_max (cutoff)',v:T_cell_max+'°C',        c:'var(--r)'},
    {l:'T_derate start',     v:T_derate+'°C',           c:'var(--y)'},
    {l:'T_op range',         v:T_op_lo+'→'+T_op_hi+'°C', c:'var(--text)'},
    {l:'Pack IR BoL',        v:ir_pack_bol.toFixed(1)+' mΩ', c:'var(--text)'},
    {l:'Pack IR EoL',        v:ir_pack_eol.toFixed(1)+' mΩ', c:'var(--y)'},
    {l:'V_drop @I_peak BoL', v:V_drop_pct_bol.toFixed(1)+'% V_nom', c:V_drop_pct_bol>5?'var(--r)':'var(--g)'},
    {l:'V_drop @I_peak EoL', v:V_drop_pct_eol.toFixed(1)+'% V_nom', c:V_drop_pct_eol>5?'var(--r)':'var(--y)'},
  ].map(k=>`<div class="kpi-card" style="border-color:${k.c}22">
    <div class="kpi-v" style="color:${k.c};font-size:14px">${k.v}</div>
    <div class="kpi-l">${k.l}</div>
  </div>`).join('')}
</div>

<div class="card" style="margin-bottom:14px">
  <div class="ch3">📉 Derating Curve - ${chem} · ${config} · Linked from Project Targets + Cell Inputs</div>
  <canvas id="derating_canvas" height="240" style="width:100%;display:block;border-radius:6px;background:var(--bg);margin-top:8px"></canvas>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;font-size:9px;font-family:var(--mono)">
    <span style="color:var(--g)">━ Discharge power (kW) at temperature</span>
    <span style="color:var(--b)">━ Charge power (kW) at temperature</span>
    <span style="color:rgba(255,77,109,.6)">┅ T_cell_max cutoff</span>
    <span style="color:rgba(245,197,24,.6)">┅ T_derate start</span>
  </div>
</div>

<div class="card" style="margin-bottom:14px">
  <div class="ch3">📋 Derating Table - Calculated from DCIR Map + Project Targets</div>
  <div style="font-size:11px;color:var(--text3);margin-bottom:8px">
    Based on: ${chem} cell · ${config} · DCIR BoL ${ir_bol}mΩ/cell · T_cell_max ${T_cell_max}°C · P_peak ${P_peak}kW from Project Targets
  </div>
  <div style="overflow-x:auto">
  <table style="border-collapse:collapse;width:100%;min-width:600px">
    <thead style="background:var(--bg3)"><tr>
      <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text3);border-bottom:2px solid var(--border2)">Cell Temp</th>
      <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text3);border-bottom:2px solid var(--border2)">Derating %</th>
      <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text3);border-bottom:2px solid var(--border2)">P_dis available</th>
      <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text3);border-bottom:2px solid var(--border2)">P_chg available</th>
      <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text3);border-bottom:2px solid var(--border2)">C-rate dis</th>
      <th style="padding:7px 10px;text-align:left;font-size:11px;color:var(--text3);border-bottom:2px solid var(--border2)">State</th>
    </tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  </div>
</div>

<div class="ico-banner">
  ⚠ Highlighted temperatures: Orange = outside project T_op range (${T_op_lo}→${T_op_hi}°C). 
  Red = above T_cell_max cutoff. Blue = cold region requiring heating.
  Derating factors are chemistry-generic estimates - upload DCIR map for cell-specific accuracy.
</div>

<div class="card" style="margin-top:14px">
  <div class="ch3">📋 Engineering Interpretation - Derating Curve Results</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:10px;font-size:12px;color:var(--text2);line-height:1.8">
    <div><b style="color:var(--text)">📊 Reading the Derating Curve</b><br>
      Green line = available discharge power at each cell temperature. Blue line = charge power (more conservative). Shaded region = project T_op window - pack should operate here.</div>
    <div><b style="color:var(--text)">⚠️ Critical Design Points</b><br>
      T_derate: BMS starts reducing power limits above this point.<br>
      T_cell_max: BMS cuts off completely. Design TMS so cell temperature never reaches T_cell_max during normal operation, including at end of life.</div>
    <div><b style="color:var(--text)">❄️ Cold Region</b><br>
      IR rises sharply at cold temps. Charge is severely limited below 0°C (Li plating risk). A cell heater may be needed for cold-climate charging. Size based on pack thermal mass and minimum ambient.</div>
    <div><b style="color:var(--text)">✅ Design Decision Checklist</b><br>
      • P_peak at T_op_hi still above P_cont → thermal margin OK<br>
      • Charge power at T_chg_lo &gt; 0 → charging possible without heater<br>
      • T_derate onset above T_op_hi → no derating in normal use<br>
      • EoL IR growth does not push T_derate below T_op range</div>
  </div>
</div>`;

  // Draw derating canvas
  requestAnimationFrame(() => {
    const cv = document.getElementById('derating_canvas');
    if (!cv) return;
    const W = cv.offsetWidth || 700, H = 240;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const pad = {l:52,r:20,t:16,b:36};
    const pw = W-pad.l-pad.r, ph = H-pad.t-pad.b;
    const T_all = tempPoints.map(p=>p.T);
    const Tmin = Math.min(...T_all), Tmax = Math.max(...T_all);
    const mx = T => pad.l + (T-Tmin)/(Tmax-Tmin)*pw;
    const my = P => pad.t + ph*(1 - P/P_peak);

    ctx.fillStyle = '#07080b'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
    [0,.25,.5,.75,1].forEach(f=>{
      const y=pad.t+ph*f,P=P_peak*(1-f);
      ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
      ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';
      ctx.fillText(P.toFixed(0),pad.l-2,y+3);
    });
    // Temperature tick labels
    [-20,-10,0,10,25,45,55,60,70].filter(T=>T>=Tmin&&T<=Tmax).forEach(T=>{
      const x=mx(T);
      ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();
      ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='center';
      ctx.fillText(T+'°C',x,H-pad.b+12);
    });
    // Threshold lines
    [[T_cell_max,'rgba(255,77,109,.5)','T_max'],[T_derate,'rgba(245,197,24,.5)','T_derate'],[0,'rgba(74,158,255,.3)','0°C']].forEach(([T,c,l])=>{
      if(T<Tmin||T>Tmax) return;
      const x=mx(T);
      ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);
      ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=c;ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='left';
      ctx.fillText(l,x+3,pad.t+10);
    });
    // Discharge curve
    ctx.beginPath();ctx.strokeStyle='#00d4aa';ctx.lineWidth=2.5;
    tempPoints.forEach((p,i)=>i===0?ctx.moveTo(mx(p.T),my(p.P_dis)):ctx.lineTo(mx(p.T),my(p.P_dis)));
    ctx.stroke();
    // Charge curve
    ctx.beginPath();ctx.strokeStyle='#4a9eff';ctx.lineWidth=2;
    tempPoints.forEach((p,i)=>i===0?ctx.moveTo(mx(p.T),my(p.P_chg)):ctx.lineTo(mx(p.T),my(p.P_chg)));
    ctx.stroke();
    // Operating range shading
    const x_lo=mx(T_op_lo),x_hi=mx(T_op_hi);
    ctx.fillStyle='rgba(0,212,170,.04)';
    ctx.fillRect(x_lo,pad.t,x_hi-x_lo,ph);
    ctx.fillStyle='#4a6080';ctx.font='10px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText('kW',pad.l-35,pad.t+ph/2);
  });
};


/* Hook showSec for derating tab */
(function() {
  const _orig = window.showSec;
  window.showSec = function(id, btn) {
    if (typeof _orig === 'function') _orig(id, btn);
    if (id === 'derating') {
      setTimeout(() => { try { renderDerating(); } catch(e) { console.warn('derating', e); }}, 60);
    }
  };
  /* Re-render on propagate if derating visible */
  const _origProp = window.propagate;
  window.propagate = function() {
    if (typeof _origProp === 'function') _origProp.apply(this, arguments);
    try {
      if (document.getElementById('derating')?.classList.contains('active')) renderDerating();
    } catch(e) {}
  };
})();

