/* app-modules1.js - Cell Qual, DCIR Maps */
/* inlined: cell-qual.js */
// Helper: build market-specific cert checkboxes
window._buildCertChecks = function(markets, certPrimary) {
  const mkts = (markets||'EU, US').toUpperCase();
  // Use generic project-target-driven categories — NO hardcoded standard names
  // Labels are based on the market region and functional category only
  const stds = [];
  if (certPrimary) {
    stds.push({id:'cert_primary_custom', label:certPrimary + ' (from Project Targets)', required:true});
  }
  // Build market categories without naming specific standards
  const mktList = mkts.split(/[,\s]+/).filter(Boolean);
  mktList.forEach(mkt => {
    if (mkt === 'EU' || mkt === 'CE') {
      stds.push({id:'cert_eu_safety',   label:'EU — Battery Safety Certification', required:true});
      stds.push({id:'cert_eu_vehicle',  label:'EU — EV Type Approval', required:false});
      stds.push({id:'cert_eu_emc',      label:'EU — EMC / Radio Emissions', required:false});
    } else if (mkt === 'US') {
      stds.push({id:'cert_us_safety',   label:'US — Battery Safety Certification', required:true});
      stds.push({id:'cert_us_vehicle',  label:'US — Federal Vehicle Safety', required:false});
    } else if (mkt === 'CN') {
      stds.push({id:'cert_cn_battery',  label:'China — EV Battery Certification', required:true});
    } else if (mkt === 'IN') {
      stds.push({id:'cert_in_battery',  label:'India — EV Battery Type Approval', required:true});
    } else if (mkt === 'JP') {
      stds.push({id:'cert_jp_battery',  label:'Japan — Battery Safety Approval', required:false});
    } else if (mkt) {
      stds.push({id:'cert_other_' + mkt.toLowerCase(), label:mkt + ' — Certification', required:false});
    }
  });
  if (!stds.length) {
    stds.push({id:'cert_general', label:'Enter target markets in Project Targets to see market-specific categories', required:false});
  }
  return stds.map(s => {
    const checked = document.getElementById(s.id)?.checked || false;
    const reqBadge = s.required
      ? '<span style="font-size:9px;background:rgba(255,77,109,.12);color:var(--r);border-radius:3px;padding:1px 5px;margin-left:5px">required</span>'
      : '';
    return '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer;padding:5px 8px;background:var(--bg);border:1px solid var(--border);border-radius:5px">'
      + '<input type="checkbox" id="' + s.id + '" ' + (checked?'checked':'') + ' onchange="renderCellQual()" style="width:14px;height:14px;cursor:pointer">'
      + '<span style="font-size:11px;color:var(--text2);flex:1">' + s.label + reqBadge + '</span></label>';
  }).join('');
};

/* ═══════════════════════════════════════════════════════════════
   BatteryMIS — CELL QUALIFICATION SCORECARD  v1.0
   OEM gate-check: supplier cell vs project targets
   Auto-reads from S (propagate). All inputs editable for override.
   ═══════════════════════════════════════════════════════════════ */

window.renderCellQual = function() {
  const root = document.getElementById('cellqual_root');
  if (!root) return;

  const S = window.S || {};

  /* ── Pull from S (auto-linked) ── */
  // Read source DOM fields directly (Cell Inputs sheet) as primary source
  const src = id => { const el=document.getElementById(id); return (el&&el.value!=='')?+el.value:null; };
  const ovr = id => { const el=document.getElementById('cq_'+id); return (el&&el.value!=='')?+el.value:null; };
  const strSrc = id => { const el=document.getElementById(id); return (el&&el.value)?el.value:null; };

  // ── Cell data: auto from Cell Inputs DOM → S → fallback ──
  // strOvr: overridden text input (cq_*), strSrc: source text field
  const strOvr = id => { const el=document.getElementById('cq_'+id); return (el&&el.value.trim())?el.value.trim():null; };

  const cell = {
    // Identity — from Cell Inputs sheet
    chem:     strOvr('chem')     || strSrc('c_chem')     || S.c_chem     || 'LFP',
    supplier: strOvr('supplier') || strSrc('c_supplier') || S.c_supplier || '',
    model:    strOvr('model')    || strSrc('c_model')    || S.c_model    || '',
    // Datasheet values — from Cell Inputs sheet
    vnom:     ovr('vnom')  ?? src('c_vnom')   ?? S.c_vnom   ?? 3.2,
    vmax:     ovr('vmax')  ?? src('c_vmax')   ?? S.c_vmax   ?? 3.65,
    vmin:     ovr('vmin')  ?? src('c_vmin')   ?? S.c_vmin   ?? 2.0,
    ah:       ovr('ah')    ?? src('c_ah')     ?? S.c_ah     ?? 120,
    ir_bol:   ovr('ir_bol')?? src('c_ir_bol') ?? S.c_ir_bol ?? 0.22,
    ir_eol:   ovr('ir_eol')?? src('c_ir_eol') ?? S.c_ir_eol ?? 0.35,
    mass_g:   ovr('mass')  ?? src('c_mass')   ?? S.c_mass   ?? 2800,
    // Thermal limits — T_min from Project Targets, T_max from Cell Inputs
    t_min:    ovr('t_min') ?? src('t_top_lo')    ?? S.t_top_lo    ?? -20,
    t_max:    ovr('t_max') ?? src('t_tcell_max') ?? S.t_tcell_max ?? 55,
    // C-rates — peak from Project Targets, chg from Project Targets
    c_max_dis:ovr('c_dis') ?? src('t_cpeak')  ?? S.t_cpeak  ?? 2.0,
    c_max_chg:ovr('c_chg') ?? src('t_cchg')   ?? S.t_cchg   ?? 0.5,
    // Lifetime — from Project Targets
    cycles:   ovr('cycles')  ?? src('t_cycles')  ?? S.t_cycles  ?? 3000,
    soh_eol:  ovr('soh_eol') ?? src('t_soh_eol') ?? S.t_soh_eol ?? 80,
    // Certifications — UN 38.3 always required; market-specific from Project Targets
    cert_un383: document.getElementById('cq_cert_un383')?.checked ?? false,
    // Market-specific cert notes from Project Targets
    cert_primary: strSrc('t_cert_primary') || S.t_cert_primary || '',
    cert_un383_note: strSrc('t_cert_un383') || S.t_cert_un383   || '',
    cert_emc:    strSrc('t_cert_emc')    || S.t_cert_emc    || '',
    cert_other:  strSrc('t_cert_other')  || S.t_cert_other  || '',
    markets:     (strSrc('t_markets') || S.markets || 'EU, US').toUpperCase(),
  };

  /* ── Project requirements — always from source DOM + S ── */
  const req = {
    vnom_min:  src('t_vmin_sys')  ?? S.t_vmin_sys  ?? 280,
    vnom_max:  src('t_vmax_sys')  ?? S.t_vmax_sys  ?? 450,
    e_min:     src('t_emin')      ?? S.t_emin      ?? 40,
    p_peak:    src('t_ppeak')     ?? S.t_ppeak     ?? 80,
    p_cont:    src('t_pcont')     ?? S.t_pcont     ?? 50,
    t_op_lo:   src('t_top_lo')    ?? S.t_top_lo    ?? -20,
    t_op_hi:   src('t_top_hi')    ?? S.t_top_hi    ?? 55,
    t_cell_max:src('t_tcell_max') ?? S.t_tcell_max ?? 55,
    c_peak:    src('t_cpeak')     ?? S.t_cpeak     ?? 2.0,
    c_chg:     src('t_cchg')      ?? S.t_cchg      ?? 0.5,
    cycles:    src('t_cycles')    ?? S.t_cycles    ?? 3000,
    soh_eol:   src('t_soh_eol')   ?? S.t_soh_eol   ?? 80,
    ged:       src('t_ged')       ?? S.t_ged        ?? 100,
    ip:        strSrc('t_ip')     || S.t_ip         || 'IP67',
    markets:   (strSrc('t_markets')|| S.markets || 'EU, US').toUpperCase(),
    Ss:        (src('c_cps')||S.c_cps||14)*(src('c_ss')||S.c_ss||8),
    Pp:        src('c_pp') || S.c_pp || 1,
    dod:       src('t_dod') ?? S.t_dod ?? 1.0,
  };

  /* ── Derived cell metrics ── */
  const V_pack_nom  = cell.vnom * req.Ss;
  const V_pack_max  = cell.vmax * req.Ss;
  const V_pack_min  = cell.vmin * req.Ss;
  const E_gross     = (cell.vnom * cell.ah * req.Ss * req.Pp) / 1000;
  const I_peak      = req.p_peak  * 1000 / V_pack_nom;
  const I_cont      = req.p_cont  * 1000 / V_pack_nom;
  const C_peak_req  = req.Pp > 0 ? I_peak  / (cell.ah * req.Pp) : 0;
  const C_cont_req  = req.Pp > 0 ? I_cont  / (cell.ah * req.Pp) : 0;
  const ged_cell    = cell.mass_g > 0 ? (cell.ah * cell.vnom * 1000) / cell.mass_g : 0; // Wh/kg cell level
  const ir_growth   = cell.ir_bol > 0 ? cell.ir_eol / cell.ir_bol : 0;
  const pack_ir_bol = cell.ir_bol * req.Ss / req.Pp;

  /* ══════════════════════════════════════
     CHECK ENGINE — each returns {ok, warn, val, target, note}
     ok=true=PASS, ok=false+warn=CAUTION, ok=false+!warn=FAIL
  ══════════════════════════════════════ */
  const checks = [

    /* ─ VOLTAGE ─ */
    {
      cat:'Voltage', name:'Cell V_nom',
      val: cell.vnom.toFixed(3)+'V',
      target: `${(req.vnom_min/req.Ss).toFixed(2)}–${(req.vnom_max/req.Ss).toFixed(2)} V/cell`,
      ok:  cell.vnom >= req.vnom_min/req.Ss*0.98 && cell.vnom <= req.vnom_max/req.Ss*1.02,
      warn:cell.vnom >= req.vnom_min/req.Ss*0.95 && cell.vnom <= req.vnom_max/req.Ss*1.05,
      note:`Pack V_nom = ${V_pack_nom.toFixed(0)}V at ${req.Ss}S`
    },
    {
      cat:'Voltage', name:'Pack V_max ≤ sys max',
      val: V_pack_max.toFixed(1)+'V',
      target: `≤ ${req.vnom_max}V`,
      ok:  V_pack_max <= req.vnom_max,
      warn:V_pack_max <= req.vnom_max * 1.02,
      note:`${req.Ss} × ${cell.vmax}V = ${V_pack_max.toFixed(1)}V`
    },
    {
      cat:'Voltage', name:'Pack V_min ≥ sys min',
      val: V_pack_min.toFixed(1)+'V',
      target: `≥ ${req.vnom_min}V`,
      ok:  V_pack_min >= req.vnom_min,
      warn:V_pack_min >= req.vnom_min * 0.95,
      note:`${req.Ss} × ${cell.vmin}V = ${V_pack_min.toFixed(1)}V`
    },

    /* ─ ENERGY ─ */
    {
      cat:'Energy', name:'Gross Energy',
      val: E_gross.toFixed(2)+' kWh',
      target: `≥ ${req.e_min} kWh`,
      ok:  E_gross >= req.e_min,
      warn:E_gross >= req.e_min * 0.95,
      note:`${req.Ss}S/${req.Pp}P × ${cell.ah}Ah × ${cell.vnom}V`
    },
    {
      cat:'Energy', name:'Cell GED',
      val: ged_cell.toFixed(1)+' Wh/kg',
      target: `≥ ${req.ged} Wh/kg`,
      ok:  ged_cell >= req.ged || req.ged <= 0,
      warn:ged_cell >= req.ged * 0.92 || req.ged <= 0,
      note:`${cell.ah}Ah × ${cell.vnom}V × 1000 ÷ ${cell.mass_g}g`
    },

    /* ─ CURRENT / C-RATE ─ */
    {
      cat:'C-Rate', name:'Peak discharge C-rate',
      val: C_peak_req.toFixed(3)+'C req',
      target: `Cell max ≥ ${C_peak_req.toFixed(2)}C (cell rated: ${cell.c_max_dis}C)`,
      ok:  cell.c_max_dis >= C_peak_req,
      warn:cell.c_max_dis >= C_peak_req * 0.9,
      note:`I_peak=${I_peak.toFixed(0)}A ÷ ${cell.ah*req.Pp}Ah pack`
    },
    {
      cat:'C-Rate', name:'Cont. discharge C-rate',
      val: C_cont_req.toFixed(3)+'C req',
      target: `Cell max ≥ ${C_cont_req.toFixed(2)}C`,
      ok:  cell.c_max_dis >= C_cont_req,
      warn:cell.c_max_dis >= C_cont_req * 0.9,
      note:`I_cont=${I_cont.toFixed(0)}A ÷ ${cell.ah*req.Pp}Ah`
    },
    {
      cat:'C-Rate', name:'Max charge C-rate',
      val: cell.c_max_chg.toFixed(2)+'C',
      target: `≥ ${req.c_chg}C`,
      ok:  cell.c_max_chg >= req.c_chg,
      warn:cell.c_max_chg >= req.c_chg * 0.9,
      note:`Required charge C-rate from Project Targets`
    },

    /* ─ IMPEDANCE ─ */
    {
      cat:'Impedance', name:'Cell DCIR BoL',
      val: cell.ir_bol.toFixed(3)+' mΩ',
      target: `Pack IR BoL = ${pack_ir_bol.toFixed(1)} mΩ`,
      ok:  pack_ir_bol <= 200,
      warn:pack_ir_bol <= 300,
      note:`${cell.ir_bol} × ${req.Ss}/${req.Pp} = ${pack_ir_bol.toFixed(1)} mΩ pack`
    },
    {
      cat:'Impedance', name:'IR growth BoL→EoL',
      val: `×${ir_growth.toFixed(2)}`,
      target: '≤ ×2.0',
      ok:  ir_growth <= 2.0,
      warn:ir_growth <= 2.5,
      note:`${cell.ir_bol.toFixed(3)}→${cell.ir_eol.toFixed(3)} mΩ EoL`
    },

    /* ─ THERMAL ─ */
    {
      cat:'Thermal', name:'Min operating temp',
      val: cell.t_min+'°C',
      target: `≤ ${req.t_op_lo}°C`,
      ok:  cell.t_min <= req.t_op_lo,
      warn:cell.t_min <= req.t_op_lo + 5,
      note:`Cell must operate down to project T_op_lo`
    },
    {
      cat:'Thermal', name:'Max operating temp',
      val: cell.t_max+'°C',
      target: `≥ ${req.t_cell_max}°C`,
      ok:  cell.t_max >= req.t_cell_max,
      warn:cell.t_max >= req.t_cell_max - 5,
      note:`Cell must survive to T_cell_max threshold`
    },

    /* ─ LIFETIME ─ */
    {
      cat:'Lifetime', name:'Cycle life (cell rated)',
      val: cell.cycles.toLocaleString()+' cycles',
      target: `≥ ${req.cycles.toLocaleString()} cycles`,
      ok:  cell.cycles >= req.cycles,
      warn:cell.cycles >= req.cycles * 0.9,
      note:`At EoL SoH ≥ ${cell.soh_eol}%`
    },
    {
      cat:'Lifetime', name:'EoL SoH (cell rated)',
      val: cell.soh_eol+'%',
      target: `≥ ${req.soh_eol}%`,
      ok:  cell.soh_eol >= req.soh_eol,
      warn:cell.soh_eol >= req.soh_eol - 2,
      note:'From cell supplier datasheet at rated cycle count'
    },

    /* ─ CERTIFICATION ─ */
    {
      cat:'Certification', name:'Battery Safety Certification',
      val: document.getElementById('cq_cert_battery_safety')?.checked ? 'Confirmed by supplier' : 'Not yet confirmed',
      target:'Required - tick to confirm supplier compliance',
      ok:  !!(document.getElementById('cq_cert_battery_safety')?.checked),
      warn:!(document.getElementById('cq_cert_battery_safety')?.checked),
      note:'Battery safety certification covering transport (UN 38.3), electrical safety, and market-specific requirements. Tick once supplier confirms.'
    },
  ];

  /* ── Score ── */
  const pass  = checks.filter(c => c.ok).length;
  const warn  = checks.filter(c => !c.ok && c.warn).length;
  const fail  = checks.filter(c => !c.ok && !c.warn).length;
  const total = checks.length;
  const score = Math.round((pass + warn * 0.5) / total * 100);

  const verdict = fail === 0 && warn === 0
    ? { t:'✓ QUALIFIED',     c:'var(--g)', bg:'rgba(0,212,170,.12)',  bc:'rgba(0,212,170,.4)'  }
    : fail === 0
    ? { t:'⚠ CONDITIONAL',  c:'var(--y)', bg:'rgba(245,197,24,.12)', bc:'rgba(245,197,24,.4)' }
    : fail <= 2
    ? { t:'✗ NOT QUALIFIED', c:'var(--r)', bg:'rgba(255,77,109,.10)', bc:'rgba(255,77,109,.35)'}
    : { t:'✗ REJECTED',      c:'var(--r)', bg:'rgba(255,77,109,.15)', bc:'rgba(255,77,109,.5)' };

  /* ── Build table rows grouped by category ── */
  const cats = [...new Set(checks.map(c => c.cat))];
  const tableRows = cats.map(cat => {
    const catChecks = checks.filter(c => c.cat === cat);
    const rows = catChecks.map(c => {
      const badge = c.ok
        ? `<span style="padding:2px 9px;background:rgba(0,212,170,.15);border:1px solid rgba(0,212,170,.4);border-radius:4px;color:var(--g);font-size:10px;font-weight:700">✓ PASS</span>`
        : c.warn
        ? `<span style="padding:2px 9px;background:rgba(245,197,24,.12);border:1px solid rgba(245,197,24,.4);border-radius:4px;color:var(--y);font-size:10px;font-weight:700">⚠ CAUTION</span>`
        : `<span style="padding:2px 9px;background:rgba(255,77,109,.12);border:1px solid rgba(255,77,109,.4);border-radius:4px;color:var(--r);font-size:10px;font-weight:700">✗ FAIL</span>`;
      const rowbg = c.ok ? '' : c.warn ? 'background:rgba(245,197,24,.03)' : 'background:rgba(255,77,109,.03)';
      return `<tr style="border-bottom:1px solid var(--border);${rowbg}">
        <td style="padding:8px 12px;font-size:12px;font-weight:600;color:var(--text)">${c.name}</td>
        <td style="padding:8px 10px;font-family:var(--mono);font-size:12px;color:${c.ok?'var(--g)':c.warn?'var(--y)':'var(--r)'};font-weight:700">${c.val}</td>
        <td style="padding:8px 10px;font-family:var(--mono);font-size:11px;color:var(--text3)">${c.target}</td>
        <td style="padding:8px 10px;text-align:center">${badge}</td>
        <td style="padding:8px 10px;font-size:11px;color:var(--text3)">${c.note}</td>
      </tr>`;
    }).join('');
    return `<tr style="background:var(--bg3)">
      <td colspan="5" style="padding:7px 12px;font-size:10px;font-weight:700;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--border2)">${cat}</td>
    </tr>${rows}`;
  }).join('');

  /* ── Radar chart data ── */
  const radarDims = [
    { label:'Voltage',     score: checks.filter(c=>c.cat==='Voltage').every(c=>c.ok) ? 100 : checks.filter(c=>c.cat==='Voltage').some(c=>c.warn) ? 60 : 20 },
    { label:'Energy',      score: checks.filter(c=>c.cat==='Energy').every(c=>c.ok) ? 100 : checks.filter(c=>c.cat==='Energy').some(c=>c.warn) ? 60 : 20 },
    { label:'C-Rate',      score: checks.filter(c=>c.cat==='C-Rate').every(c=>c.ok) ? 100 : checks.filter(c=>c.cat==='C-Rate').some(c=>c.ok) ? 65 : 20 },
    { label:'Impedance',   score: checks.filter(c=>c.cat==='Impedance').every(c=>c.ok) ? 100 : 50 },
    { label:'Thermal',     score: checks.filter(c=>c.cat==='Thermal').every(c=>c.ok) ? 100 : checks.filter(c=>c.cat==='Thermal').some(c=>c.warn) ? 60 : 20 },
    { label:'Lifetime',    score: checks.filter(c=>c.cat==='Lifetime').every(c=>c.ok) ? 100 : checks.filter(c=>c.cat==='Lifetime').some(c=>c.warn) ? 65 : 25 },
    { label:'Cert',        score: document.getElementById('cq_cert_battery_safety')?.checked ? 100 : 0 },
  ];

  root.innerHTML = `
<style>
.cq-inp{padding:5px 8px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:var(--mono);font-size:12px;width:100%;outline:none}
.cq-inp:focus{border-color:rgba(0,212,170,.4)}
.cq-chk{accent-color:var(--teal);width:14px;height:14px}
.cq-lbl{font-size:10px;color:var(--text3);font-family:var(--mono);text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:3px}
</style>

<!-- ══ HEADER: Supplier info + verdict ══ -->
<div class="g2" style="margin-bottom:16px;align-items:stretch">

  <!-- Cell identity -->
  <div class="card">
    <div class="ch3">🔬 Cell Identity <span style="font-size:9px;color:var(--teal);font-family:var(--mono)">← auto from Cell Inputs (editable)</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
      <div>
        <label class="cq-lbl">Supplier / Manufacturer
          <span style="font-size:9px;font-family:var(--mono);color:var(--teal)">← Cell Inputs</span>
        </label>
        <input class="cq-inp" id="cq_supplier" value="${cell.supplier}"
          placeholder="Auto from Cell Inputs (editable override)"
          oninput="renderCellQual()">
        ${cell.supplier ? '' : '<div style="font-size:9px;color:var(--text3);margin-top:2px">→ Enter in Cell Inputs tab · Cell Supplier field</div>'}
      </div>
      <div>
        <label class="cq-lbl">Cell Model / Part No.
          <span style="font-size:9px;font-family:var(--mono);color:var(--teal)">← Cell Inputs</span>
        </label>
        <input class="cq-inp" id="cq_model" value="${cell.model}"
          placeholder="Auto from Cell Inputs (editable override)"
          oninput="renderCellQual()">
        ${cell.model ? '' : '<div style="font-size:9px;color:var(--text3);margin-top:2px">→ Enter in Cell Inputs tab · Cell Model field</div>'}
      </div>
      <div><label class="cq-lbl">Chemistry (auto from Cell Inputs)</label>
        <div style="padding:6px 8px;background:var(--bg4);border:1px solid var(--border);border-radius:6px;font-family:var(--mono);font-size:12px;color:var(--teal)">${cell.chem}</div></div>
      <div><label class="cq-lbl">Pack Config (auto from Cell Inputs)</label>
        <div style="padding:6px 8px;background:var(--bg4);border:1px solid var(--border);border-radius:6px;font-family:var(--mono);font-size:12px;color:var(--blue2)">${(src('c_cps')||S.c_cps||14)}×${(src('c_ss')||S.c_ss||8)}=${req.Ss}S / ${req.Pp}P</div></div>
    </div>

    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
    <div class="ch3 b" style="margin-bottom:8px">Datasheet Values <span style="font-size:9px;font-family:var(--mono);color:var(--teal);font-weight:400">← auto from Cell Inputs + Project Targets (editable override)</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
      ${[
        ['cq_vnom',   'V_nom (V)',         cell.vnom,     '← Cell Inputs'],
        ['cq_vmax',   'V_max (V)',         cell.vmax,     '← Cell Inputs'],
        ['cq_vmin',   'V_min (V)',         cell.vmin,     '← Cell Inputs'],
        ['cq_ah',     'Capacity (Ah)',     cell.ah,       '← Cell Inputs'],
        ['cq_mass',   'Mass (g)',          cell.mass_g,   '← Cell Inputs'],
        ['cq_ir_bol', 'DCIR BoL (mΩ)',    cell.ir_bol,   '← Cell Inputs'],
        ['cq_ir_eol', 'DCIR EoL (mΩ)',    cell.ir_eol,   '← Cell Inputs'],
        ['cq_c_dis',  'Max C-rate dis',   cell.c_max_dis,'← Project Targets (C_peak)'],
        ['cq_c_chg',  'Max C-rate chg',   cell.c_max_chg,'← Project Targets (C_chg)'],
        ['cq_t_min',  'T_min op (°C)',     cell.t_min,    '← Project Targets (T_op_lo)'],
        ['cq_t_max',  'T_max op (°C)',     cell.t_max,    '← Cell Inputs (T_cell_max)'],
        ['cq_cycles', 'Cycle life',        cell.cycles,   '← Project Targets'],
        ['cq_soh_eol','EoL SoH (%)',       cell.soh_eol,  '← Project Targets'],
      ].map(([id,label,val,src_hint])=>`<div>
        <label class="cq-lbl">${label} <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">${src_hint}</span></label>
        <input class="cq-inp" id="${id}" value="${val}" type="number" step="any" oninput="renderCellQual()"></div>`).join('')}
    </div>
    </div>

    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">
    <div class="ch3 b" style="margin-bottom:8px">Certifications</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text2);background:var(--bg4);padding:10px 12px;border-radius:6px;border:1px solid var(--border);transition:border-color .15s"
        onmouseover="this.style.borderColor='rgba(0,212,170,.3)'" onmouseout="this.style.borderColor='var(--border)'">
        <input type="checkbox" class="cq-chk" id="cq_cert_battery_safety" ${document.getElementById('cq_cert_battery_safety')?.checked?'checked':''} onchange="renderCellQual()" style="width:16px;height:16px;cursor:pointer;flex-shrink:0;accent-color:var(--teal)">
        <div style="flex:1">
          <span style="font-weight:700;color:var(--text);font-size:12px">Battery Safety Certification</span><br>
          <span style="font-size:10px;color:var(--text3)">UN 38.3 transport, electrical safety, market-specific requirements - tick once supplier confirms compliance</span>
        </div>
      </label>
    </div>
    </div>
  </div>

  <!-- Verdict + radar -->
  <div class="card" style="display:flex;flex-direction:column;gap:12px">
    <!-- Verdict -->
    <div style="padding:20px;text-align:center;border-radius:10px;background:${verdict.bg};border:1px solid ${verdict.bc}">
      <div style="font-family:var(--display);font-size:28px;font-weight:800;color:${verdict.c}">${verdict.t}</div>
      <div style="font-size:13px;color:var(--text2);margin-top:6px">${cell.supplier||'Cell'} ${cell.model||''}</div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">${cell.chem} · ${V_pack_nom.toFixed(0)}V · ${E_gross.toFixed(1)}kWh</div>
    </div>
    <!-- Score strip -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
      ${[
        {l:'Score',   v:score+'%',         c:score>=90?'var(--g)':score>=70?'var(--y)':'var(--r)'},
        {l:'Pass',    v:pass+' / '+total,  c:'var(--g)'},
        {l:'Caution', v:warn,              c:'var(--y)'},
        {l:'Fail',    v:fail,              c:fail>0?'var(--r)':'var(--text3)'},
        {l:'Pack V',  v:V_pack_nom.toFixed(0)+'V', c:'var(--b)'},
        {l:'Energy',  v:E_gross.toFixed(1)+'kWh',  c:'var(--g)'},
      ].map(r=>`<div class="kpi-card" style="border-color:${r.c}22;padding:10px">
        <div class="kpi-v" style="color:${r.c};font-size:16px">${r.v}</div>
        <div class="kpi-l">${r.l}</div>
      </div>`).join('')}
    </div>
    <!-- Radar canvas -->
    <div>
      <div class="ch3 b" style="margin-bottom:6px">Qualification Radar</div>
      <canvas id="cq_radar" height="200" style="width:100%;display:block;background:var(--bg);border-radius:8px"></canvas>
    </div>
    <!-- Export button -->
    <button onclick="cqExport()" style="padding:9px;background:rgba(74,158,255,.1);border:1px solid rgba(74,158,255,.3);color:var(--b);border-radius:7px;font-size:12px;font-weight:700;cursor:pointer">
      ⬇ Export Qualification Report (CSV)
    </button>
  </div>
</div>

<!-- ══ SCORECARD TABLE ══ -->
<div class="card" style="overflow-x:auto;margin-bottom:16px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <div class="ch3">📋 Qualification Scorecard — ${total} checks · ${pass} pass · ${warn} caution · ${fail} fail</div>
    <span style="font-size:10px;font-family:var(--mono);color:var(--text3)">${cell.chem} · ${req.Ss}S/${req.Pp}P · ${req.markets}</span>
  </div>
  <table style="border-collapse:collapse;width:100%;min-width:700px">
    <thead style="background:var(--bg3)">
      <tr>
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">Check</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">Cell Value</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">Requirement</th>
        <th style="padding:8px 10px;text-align:center;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">Status</th>
        <th style="padding:8px 10px;text-align:left;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">Notes</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>

<!-- ══ FAIL/CAUTION SUMMARY ══ -->
${fail > 0 || warn > 0 ? `
<div class="card" style="margin-bottom:16px">
  <div class="ch3">⚠ Action Items</div>
  <div style="margin-top:8px">
  ${checks.filter(c=>!c.ok).map(c=>`
    <div style="padding:10px 14px;margin-bottom:6px;border-radius:8px;
      background:${c.warn?'rgba(245,197,24,.06)':'rgba(255,77,109,.06)'};
      border:1px solid ${c.warn?'rgba(245,197,24,.25)':'rgba(255,77,109,.25)'}">
      <div style="font-size:13px;font-weight:700;color:${c.warn?'var(--y)':'var(--r)'}">
        ${c.warn?'⚠':'✗'} ${c.cat} — ${c.name}
      </div>
      <div style="font-size:12px;color:var(--text2);margin-top:3px">
        Cell: <b>${c.val}</b> · Required: <b>${c.target}</b> · ${c.note}
      </div>
    </div>`).join('')}
  </div>
</div>` : `<div class="ico-banner">✓ All checks passed — cell meets project requirements. Ready for DVP planning.</div>`}

<div class="ico-banner">
  📌 Scorecard based on ${req.Ss}S/${req.Pp}P config · Market: ${req.markets} · App: ${S.app||'—'}.
  Update Project Targets and Cell Inputs to refresh. Export to CSV for DVP package.
</div>`;

  /* ── Draw radar ── */
  requestAnimationFrame(() => {
    const cv = document.getElementById('cq_radar');
    if (!cv) return;
    const W = cv.offsetWidth || 300, H = 200;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const cx = W/2, cy = H/2, r = Math.min(cx, cy) - 28;
    const n = radarDims.length;

    ctx.fillStyle = '#07080b'; ctx.fillRect(0, 0, W, H);

    /* Grid rings */
    [25,50,75,100].forEach(pct => {
      const rr = r * pct/100;
      ctx.beginPath();
      for (let i=0; i<=n; i++) {
        const a = (i/n)*Math.PI*2 - Math.PI/2;
        const x = cx + Math.cos(a)*rr, y = cy + Math.sin(a)*rr;
        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth=1; ctx.stroke();
      if (pct===100) { ctx.fillStyle='rgba(255,255,255,.04)'; ctx.fill(); }
    });

    /* Spokes */
    radarDims.forEach((d,i) => {
      const a = (i/n)*Math.PI*2 - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
      ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1; ctx.stroke();
      /* Labels */
      const lx = cx + Math.cos(a)*(r+16), ly = cy + Math.sin(a)*(r+16);
      ctx.fillStyle='#6d8fba'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='center';
      ctx.fillText(d.label, lx, ly+3);
    });

    /* Data polygon */
    ctx.beginPath();
    radarDims.forEach((d,i) => {
      const a = (i/n)*Math.PI*2 - Math.PI/2;
      const rr = r * d.score/100;
      const x = cx + Math.cos(a)*rr, y = cy + Math.sin(a)*rr;
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,212,170,.15)'; ctx.fill();
    ctx.strokeStyle='#00d4aa'; ctx.lineWidth=2; ctx.stroke();

    /* Dots */
    radarDims.forEach((d,i) => {
      const a = (i/n)*Math.PI*2 - Math.PI/2;
      const rr = r * d.score/100;
      ctx.beginPath(); ctx.arc(cx+Math.cos(a)*rr, cy+Math.sin(a)*rr, 3.5, 0, Math.PI*2);
      ctx.fillStyle = d.score>=90?'#00d4aa':d.score>=60?'#f5c518':'#ff4d6d'; ctx.fill();
    });
  });
};

/* ── Export CSV ── */
window.cqExport = function() {
  const S = window.S || {};
  const rows = document.querySelectorAll('#cellqual_root tbody tr');
  const lines = ['Category,Check,Cell Value,Requirement,Status,Notes'];
  let lastCat = '';
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    if (cells.length === 1) { lastCat = cells[0].textContent.trim(); return; }
    if (cells.length >= 5) {
      const status = cells[3].textContent.trim().replace(/[✓✗⚠]/g,'').trim();
      lines.push([lastCat, ...Array.from(cells).slice(0,5).map(c=>'"'+c.textContent.trim().replace(/"/g,'""')+'"')].join(','));
    }
  });
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
  a.download = `CellQual_${(S.c_chem||'cell').replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

/* ── Hook showSec + propagate ── */
(function(){
  const _ss = window.showSec;
  window.showSec = function(id, btn) {
    if (typeof _ss === 'function') _ss(id, btn);
    if (id === 'cellqual') setTimeout(() => { try { renderCellQual(); } catch(e) { console.warn('[CellQual]',e); }}, 60);
  };
  const _pp = window.propagate;
  window.propagate = function() {
    if (typeof _pp === 'function') _pp.apply(this, arguments);
    try {
      if (document.getElementById('cellqual')?.classList.contains('active')) renderCellQual();
    } catch(e) {}
  };
})();


/* inlined: dcir-map.js */
/* ═══════════════════════════════════════════════════════════════
   BatteryMIS - DCIR MAP  v2.0
   REAL INPUT SYSTEM - no hardcoded model
   Modes: A) Excel upload  B) Manual table entry
   Outputs: Cell + Pack heatmap, key op points, EoL projection
   ═══════════════════════════════════════════════════════════════ */

window._dcirData     = null;
window._dcirMode     = 'none';
window._dcirShowPack = false;
window._dcirManualSoCs  = [0,10,20,30,50,70,80,90,100];
window._dcirManualTemps = [-20,-10,0,10,25,35,45,55];
window._dcirManualVals  = {};

function dcirHeatCol(val, mn, mx) {
  if (mx <= mn) return 'rgba(0,212,170,.5)';
  const n = (val - mn) / (mx - mn);
  if (n <= 0.25) return `hsl(165,80%,${40+20*(1-n*4)}%)`;
  if (n <= 0.5)  return `hsl(${165-100*(n-0.25)*4},80%,48%)`;
  if (n <= 0.75) return `hsl(${65-50*(n-0.5)*4},85%,48%)`;
  return `hsl(${15-15*(n-0.75)*4},88%,44%)`;
}
function dcirTextCol(v,mn,mx){return (v-mn)/(mx-mn||1)>0.6?'#fff':'#000c08';}

function dcirInterp(soc, temp) {
  const d = window._dcirData;
  if (!d||!d.matrix||!d.matrix.length) return null;
  const {socs,temps,matrix} = d;
  const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const fi=(arr,v)=>{let i=arr.findIndex(x=>x>v)-1;return cl(i<0?0:i,0,arr.length-2);};
  const si=fi(socs,soc), ti=fi(temps,temp);
  if(socs.length<2||temps.length<2) return matrix[si]?.[ti]??null;
  const ss=(soc-socs[si])/((socs[si+1]||socs[si])-socs[si]||1);
  const ts=(temp-temps[ti])/((temps[ti+1]||temps[ti])-temps[ti]||1);
  const r00=matrix[si]?.[ti]??0, r10=matrix[si+1]?.[ti]??r00;
  const r01=matrix[si]?.[ti+1]??r00, r11=matrix[si+1]?.[ti+1]??r00;
  return r00*(1-ss)*(1-ts)+r10*ss*(1-ts)+r01*(1-ss)*ts+r11*ss*ts;
}

window.renderDCIRMap = function() {
  const root = document.getElementById('dcir_root');
  if (!root) return;
  const S=window.S||{};
  // Always read from source DOM fields as primary source
  const srcN = id => { const el=document.getElementById(id); return (el&&el.value!=='')?+el.value:null; };
  const srcS = id => { const el=document.getElementById(id); return el?el.value:null; };
  const Ss   = (+(document.getElementById('c_cps')?.value)||S.c_cps||14)*(+(document.getElementById('c_ss')?.value)||S.c_ss||8);
  const Pp   = S.c_pp || 1;
  const chem = (srcS('c_chem') || S.c_chem || 'LFP').split(' ')[0].toUpperCase();
  const ir_bol = srcN('c_ir_bol') ?? S.c_ir_bol ?? 0.22;
  const ir_eol = srcN('c_ir_eol') ?? S.c_ir_eol ?? 0.35;
  const hasData = window._dcirData && window._dcirData.matrix?.length>0;

  root.innerHTML = `
<div class="ico-banner" style="margin-bottom:10px">
  🔗 Cell: <b>${chem}</b> · ${Ss}S/${Pp}P · IR_BoL: <b>${ir_bol} mΩ/cell</b> (${(ir_bol*Ss/Pp).toFixed(1)} mΩ pack) · 
  IR_EoL: <b>${ir_eol} mΩ/cell</b> · From Cell Inputs - 
  <a onclick="showSec('cell',document.querySelector('.nb'))" style="color:var(--b);cursor:pointer;text-decoration:underline">Edit in Cell Inputs</a>
</div>
<style>
.dcir-tbl td,.dcir-tbl th{padding:6px 8px;text-align:center;font-family:var(--mono);font-size:11px;border:1px solid rgba(255,255,255,.05)}
.dcir-tbl th{background:var(--bg3);color:var(--text2);font-size:10px;font-weight:700}
.dcir-inp{width:54px;padding:3px 4px;background:var(--bg);border:1px solid var(--border2);border-radius:4px;color:var(--text);font-family:var(--mono);font-size:11px;text-align:center}
.dcir-inp:focus{outline:none;border-color:var(--teal)}
</style>

<div class="g2" style="margin-bottom:16px">
  <div class="card">
    <div class="ch3">📊 Upload Cell DCIR Datasheet</div>
    <div class="fbox" style="margin-bottom:10px">
      <b>Expected Excel layout:</b><br>
      • Row 1: Temperature labels (°C) - e.g. -20, -10, 0, 10, 25, 35, 45, 55<br>
      • Col A: SoC values (%) - e.g. 0, 10, 20 … 100<br>
      • Body: actual DCIR values in <b>mΩ</b><br>
      Supports .xlsx · .xls · .csv
    </div>
    <div id="dcir_dropzone" onclick="document.getElementById('dcir_file').click()"
      ondragover="event.preventDefault();this.style.borderColor='var(--teal)'"
      ondragleave="this.style.borderColor='var(--border2)'"
      ondrop="event.preventDefault();this.style.borderColor='var(--border2)';dcirHandleFile(event.dataTransfer.files[0])"
      style="border:2px dashed var(--border2);border-radius:10px;padding:24px;text-align:center;cursor:pointer;background:var(--bg3)">
      <div style="font-size:28px;margin-bottom:8px">📋</div>
      <div style="font-size:13px;font-weight:700;color:var(--text)">Drop Excel / CSV here or click to browse</div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">.xlsx · .xls · .csv</div>
      <input type="file" id="dcir_file" accept=".xlsx,.xls,.csv" style="display:none" onchange="dcirHandleFile(this.files[0])">
    </div>
    <div id="dcir_file_status" style="margin-top:8px;font-size:11px;font-family:var(--mono);color:var(--text3)"></div>
  </div>

  <div class="card">
    <div class="ch3">✏️ Manual DCIR Entry (mΩ)</div>
    <div class="fbox" style="margin-bottom:8px">Enter DCIR (mΩ) for each SoC × Temperature. Min: 25°C column. Click <b>Apply</b> to calculate.</div>
    <div id="dcir_manual_wrap">${dcirBuildManualTable()}</div>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button onclick="dcirAddSoC()" style="padding:5px 10px;background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.3);color:var(--g);border-radius:5px;font-size:10px;font-weight:700;cursor:pointer">+ SoC Row</button>
      <button onclick="dcirAddTemp()" style="padding:5px 10px;background:rgba(74,158,255,.1);border:1px solid rgba(74,158,255,.3);color:var(--b);border-radius:5px;font-size:10px;font-weight:700;cursor:pointer">+ Temp Col</button>
      <button onclick="dcirApplyManual()" style="padding:5px 16px;background:rgba(0,212,170,.18);border:1px solid rgba(0,212,170,.5);color:var(--g);border-radius:5px;font-size:11px;font-weight:700;cursor:pointer">▶ Apply & Calculate</button>
      <button onclick="dcirReset()" style="padding:5px 10px;background:rgba(255,77,109,.08);border:1px solid rgba(255,77,109,.25);color:var(--r);border-radius:5px;font-size:10px;cursor:pointer">✕ Reset</button>
    </div>
  </div>
</div>

<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;font-size:11px">
  <span style="font-family:var(--mono);color:var(--teal);font-weight:700">${Ss}S / ${Pp}P</span>
  <span style="color:var(--text3)">·</span>
  <span style="font-family:var(--mono);color:var(--blue2)">${chem}</span>
  <span style="color:var(--text3)">·</span>
  <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
    <input type="checkbox" id="dcir_show_pack" onchange="window._dcirShowPack=this.checked;renderDCIRMap()" style="accent-color:var(--teal)" ${window._dcirShowPack?'checked':''}>
    <span style="color:var(--text2)">Show Pack IR in heatmap</span>
  </label>
</div>

${hasData ? dcirRenderResults(Ss,Pp,S) : `<div style="padding:48px;text-align:center;border:1px dashed var(--border2);border-radius:10px;background:var(--bg3)">
  <div style="font-size:32px;margin-bottom:12px">📋</div>
  <div style="font-size:14px;font-weight:700;color:var(--text2);margin-bottom:6px">No DCIR Data</div>
  <div style="font-size:12px;color:var(--text3)">Upload your cell supplier Excel/CSV datasheet above,<br>or fill in the manual table and click <b>▶ Apply & Calculate</b>.</div>
</div>`}`;
};

function dcirBuildManualTable() {
  const socs=window._dcirManualSoCs, temps=window._dcirManualTemps, vals=window._dcirManualVals;
  let h='<div style="overflow-x:auto"><table class="dcir-tbl" id="dcir_mtbl">';
  h+=`<tr><th style="background:var(--bg2)">SoC \\ T°C</th>`;
  temps.forEach((t,ti)=>h+=`<th><input class="dcir-inp" value="${t}" style="width:46px" onchange="window._dcirManualTemps[${ti}]=+this.value"><button onclick="window._dcirManualTemps.splice(${ti},1);document.getElementById('dcir_manual_wrap').innerHTML=dcirBuildManualTable()" style="background:none;border:none;color:var(--r);cursor:pointer;font-size:9px"> ✕</button></th>`);
  h+='</tr>';
  socs.forEach((soc,si)=>{
    h+=`<tr><th><input class="dcir-inp" value="${soc}" style="width:32px" onchange="window._dcirManualSoCs[${si}]=+this.value">%<button onclick="window._dcirManualSoCs.splice(${si},1);document.getElementById('dcir_manual_wrap').innerHTML=dcirBuildManualTable()" style="background:none;border:none;color:var(--r);cursor:pointer;font-size:9px"> ✕</button></th>`;
    temps.forEach((t,ti)=>{
      const k=`${si}_${ti}`, v=vals[k]??'';
      h+=`<td><input class="dcir-inp" id="dcir_v_${k}" value="${v}" placeholder="mΩ" oninput="window._dcirManualVals['${k}']=parseFloat(this.value)||undefined"></td>`;
    });
    h+='</tr>';
  });
  return h+'</table></div>';
}

window.dcirAddSoC=function(){window._dcirManualSoCs.push(Math.min(100,(window._dcirManualSoCs.slice(-1)[0]||90)+10));document.getElementById('dcir_manual_wrap').innerHTML=dcirBuildManualTable();};
window.dcirAddTemp=function(){window._dcirManualTemps.push((window._dcirManualTemps.slice(-1)[0]||45)+10);document.getElementById('dcir_manual_wrap').innerHTML=dcirBuildManualTable();};
window.dcirApplyManual=function(){
  const socs=window._dcirManualSoCs, temps=window._dcirManualTemps;
  const matrix=socs.map((s,si)=>temps.map((t,ti)=>{
    const el=document.getElementById(`dcir_v_${si}_${ti}`);
    const v=el?parseFloat(el.value):window._dcirManualVals[`${si}_${ti}`];
    return isNaN(v)?null:v;
  }));
  if(!matrix.flat().some(v=>v!==null)){alert('Enter at least some DCIR values (mΩ) first.');return;}
  window._dcirData={socs:[...socs],temps:[...temps],matrix};
  window._dcirMode='manual';
  const b=dcirInterp(50,25);
  if(b&&typeof setField==='function'){setField('c_ir_bol',b.toFixed(3));try{propagate&&propagate();}catch(e){}}
  renderDCIRMap();
};
window.dcirReset=function(){
  window._dcirData=null; window._dcirMode='none';
  window._dcirManualVals={};
  window._dcirManualSoCs=[0,10,20,30,50,70,80,90,100];
  window._dcirManualTemps=[-20,-10,0,10,25,35,45,55];
  renderDCIRMap();
};

window.dcirHandleFile=function(file){
  if(!file) return;
  const st=document.getElementById('dcir_file_status');
  if(st) st.textContent=`⏳ Reading ${file.name}…`;
  const run=()=>dcirParseExcel(file,st);
  if(typeof XLSX==='undefined'){
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload=run; s.onerror=()=>{if(st)st.textContent='⚠ Could not load Excel parser.';};
    document.head.appendChild(s);
  } else run();
};

function dcirParseExcel(file,statusEl){
  const ext=file.name.split('.').pop().toLowerCase();
  const proc=wb=>{
    let best=null,bestN=0;
    wb.SheetNames.forEach(n=>{
      const d=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:''});
      const c=d.flat().filter(v=>!isNaN(parseFloat(v))&&v!=='').length;
      if(c>bestN){bestN=c;best={n,d};}
    });
    if(!best){if(statusEl)statusEl.textContent='⚠ No numeric data found.';return;}
    parseRawDCIR(best.d,file.name,best.n,statusEl);
  };
  const reader=new FileReader();
  if(ext==='csv'){
    reader.onload=e=>{try{proc(XLSX.read(e.target.result,{type:'string'}));}catch(err){if(statusEl)statusEl.textContent='⚠ '+err.message;}};
    reader.readAsText(file);
  } else {
    reader.onload=e=>{try{proc(XLSX.read(new Uint8Array(e.target.result),{type:'array'}));}catch(err){if(statusEl)statusEl.textContent='⚠ '+err.message;}};
    reader.readAsArrayBuffer(file);
  }
}

function parseRawDCIR(raw,fileName,sheetName,statusEl){
  let hRow=-1;
  for(let r=0;r<Math.min(raw.length,10);r++){
    if(raw[r].filter(v=>!isNaN(parseFloat(v))&&String(v).trim()!=='').length>=2){hRow=r;break;}
  }
  if(hRow<0){if(statusEl)statusEl.textContent='⚠ Cannot find temperature header row.';return;}
  const temps=[],tCols=[];
  raw[hRow].forEach((v,ci)=>{const n=parseFloat(v);if(!isNaN(n)&&n>=-60&&n<=120){temps.push(n);tCols.push(ci);}});
  const socs=[],matrix=[];
  for(let r=hRow+1;r<raw.length;r++){
    const row=raw[r],soc=parseFloat(row[0]);
    if(isNaN(soc)||soc<0||soc>100) continue;
    const irRow=tCols.map(ci=>{const v=parseFloat(row[ci]);return isNaN(v)?null:v;});
    if(!irRow.some(v=>v!==null)) continue;
    socs.push(soc); matrix.push(irRow);
  }
  if(socs.length<2||temps.length<2){if(statusEl)statusEl.textContent=`⚠ Only ${socs.length} SoC × ${temps.length} temps - need ≥2 each.`;return;}
  window._dcirData={socs,temps,matrix};
  window._dcirMode='excel';
  window._dcirManualSoCs=[...socs]; window._dcirManualTemps=[...temps]; window._dcirManualVals={};
  socs.forEach((s,si)=>temps.forEach((t,ti)=>{if(matrix[si]?.[ti]!==null)window._dcirManualVals[`${si}_${ti}`]=matrix[si][ti];}));
  const b=dcirInterp(50,25);
  if(b&&typeof setField==='function'){setField('c_ir_bol',b.toFixed(3));try{propagate&&propagate();}catch(e){}}
  const filled=matrix.flat().filter(v=>v!==null).length;
  if(statusEl)statusEl.textContent=`✓ ${sheetName} · ${socs.length}×${temps.length} = ${filled} values · ${b?'Baseline @25°C/50%SoC: '+b.toFixed(3)+' mΩ → pushed to Cell tab':''}`;
  renderDCIRMap();
}

function dcirRenderResults(Ss,Pp,S){
  const d=window._dcirData;
  const allV=d.matrix.flat().filter(v=>v!==null);
  const mn=Math.min(...allV),mx=Math.max(...allV);
  const showPack=window._dcirShowPack;
  const scMn=showPack?mn*Ss/Pp:mn, scMx=showPack?mx*Ss/Pp:mx;
  const ir_nom=dcirInterp(50,25)??allV[0];
  const Ipeak=S.t_ppeak?(S.t_ppeak*1000/(S.V_nom_pack||400)):300;

  // Heatmap
  let tH=`<tr><th style="background:var(--bg2);font-size:10px;color:var(--text3)">SoC\\T°C</th>`;
  d.temps.forEach(t=>tH+=`<th>${t}°C</th>`);
  tH+='</tr>';
  const tB=d.socs.map((soc,si)=>{
    let row=`<tr><td style="font-family:var(--mono);font-size:11px;font-weight:700;color:var(--text2);background:var(--bg2)">${soc}%</td>`;
    d.temps.forEach((temp,ti)=>{
      const cv=d.matrix[si]?.[ti];
      if(cv===null||cv===undefined){row+=`<td style="background:var(--bg4);color:var(--text3)">-</td>`;return;}
      const dv=showPack?(cv*Ss/Pp):cv;
      row+=`<td style="background:${dcirHeatCol(dv,scMn,scMx)};color:${dcirTextCol(dv,scMn,scMx)};font-family:var(--mono);font-size:11px;font-weight:600;padding:6px 4px;cursor:default"
        title="SoC ${soc}% | ${temp}°C&#10;Cell: ${cv.toFixed(3)} mΩ&#10;Pack: ${(cv*Ss/Pp).toFixed(2)} mΩ"
        onmouseenter="this.style.outline='2px solid var(--teal)'" onmouseleave="this.style.outline=''">
        ${dv.toFixed(showPack?1:3)}</td>`;
    });
    return row+'</tr>';
  }).join('');

  // Key operating points
  const ops=[
    {label:'Cold start discharge', soc:20, temp:d.temps[0],                    note:`${d.temps[0]}°C worst-case`},
    {label:'Nominal (BoL ref)',    soc:50, temp:25,                              note:'Datasheet baseline'},
    {label:'Peak discharge',       soc:80, temp:25,                              note:'High SoC, 25°C'},
    {label:'Regen braking',        soc:90, temp:25,                              note:'High SoC regen pulse'},
    {label:'Hot ambient',          soc:50, temp:d.temps[d.temps.length-1],      note:`${d.temps[d.temps.length-1]}°C hot`},
    {label:'Cold charge start',    soc:10, temp:Math.max(d.temps[0],d.temps[1]),note:'BMS charge gate risk'},
  ];
  const opRows=ops.map(op=>{
    const ir=dcirInterp(op.soc,op.temp); if(!ir) return '';
    const pIR=ir*Ss/Pp, fac=ir_nom>0?ir/ir_nom:1;
    const Vd=pIR*1e-3*Ipeak, Vdp=(S.V_nom_pack||400)>0?Vd/(S.V_nom_pack||400)*100:0;
    const st=fac>4?'<span style="color:var(--r)">⚠ CRITICAL</span>':fac>2?'<span style="color:var(--o)">HIGH</span>':fac>1.3?'<span style="color:var(--y)">ELEVATED</span>':'<span style="color:var(--g)">NOMINAL</span>';
    return `<tr><td>${op.label}</td><td style="font-family:var(--mono)">${op.soc}%</td><td style="font-family:var(--mono)">${op.temp}°C</td>
      <td style="font-family:var(--mono);font-weight:700">${ir.toFixed(3)} mΩ</td><td style="font-family:var(--mono)">${pIR.toFixed(1)} mΩ</td>
      <td style="font-family:var(--mono);color:${fac>2?'var(--r)':fac>1.2?'var(--o)':'var(--g)'}">×${fac.toFixed(2)}</td>
      <td style="font-family:var(--mono);color:${Vdp>5?'var(--r)':Vdp>3?'var(--o)':'var(--g)'}">${Vd.toFixed(1)}V (${Vdp.toFixed(1)}%)</td>
      <td>${st}</td><td style="color:var(--text3);font-size:11px">${op.note}</td></tr>`;
  }).join('');

  const ir_eol=S.c_ir_eol||ir_nom*1.6, grow=ir_nom>0?ir_eol/ir_nom:1.6;
  const coldIR=dcirInterp(20,d.temps[0]);

  return `
<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
  <span style="font-size:10px;color:var(--text3);font-family:var(--mono)">Scale (${showPack?'Pack':'Cell'} mΩ):</span>
  <span style="background:linear-gradient(90deg,hsl(165,80%,45%),hsl(65,85%,48%),hsl(0,88%,44%));border-radius:4px;width:120px;height:10px;display:inline-block"></span>
  <span style="font-size:10px;color:var(--text3)">${scMn.toFixed(1)} → ${scMx.toFixed(1)} mΩ · ${d.socs.length}SoC × ${d.temps.length}T · source: <b>${window._dcirMode}</b></span>
</div>

<div class="card" style="overflow-x:auto;margin-bottom:16px;padding:0">
  <div style="padding:12px 16px 8px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
    <div class="ch3" style="margin:0">🌡️ DCIR Heatmap - ${showPack?`Pack (${Ss}S/${Pp}P)`:'Cell'} IR (mΩ) · hover for details</div>
    <span style="font-size:10px;font-family:var(--mono);color:var(--text3)">Baseline ${ir_nom.toFixed(3)} mΩ @ 25°C / 50%SoC</span>
  </div>
  <table class="dcir-tbl" style="width:100%;min-width:500px"><thead>${tH}</thead><tbody>${tB}</tbody></table>
</div>

<div class="card" style="margin-bottom:16px">
  <div class="ch3">⚡ Key Operating Points - I_peak = ${Ipeak.toFixed(0)} A</div>
  <div style="overflow-x:auto"><table class="res-tbl" style="font-size:12px">
    <thead><tr><th>Condition</th><th>SoC</th><th>Temp</th><th>Cell IR</th><th>Pack IR</th><th>vs Nom</th><th>Pack ΔV</th><th>Status</th><th>Note</th></tr></thead>
    <tbody>${opRows}</tbody>
  </table></div>
</div>

<div class="card">
  <div class="ch3">📊 BoL → EoL Projection</div>
  <div class="g3" style="margin-top:12px">
    ${[
      {l:'Cell IR BoL (25°C/50%SoC)', v:ir_nom.toFixed(3)+' mΩ', c:'var(--g)'},
      {l:'Cell IR EoL (Cell tab)',     v:ir_eol.toFixed(3)+' mΩ', c:'var(--o)'},
      {l:'Growth factor',              v:'×'+grow.toFixed(2),      c:'var(--y)'},
      {l:'Pack IR BoL',               v:(ir_nom*Ss/Pp).toFixed(1)+' mΩ', c:'var(--b)'},
      {l:'Pack IR EoL',               v:(ir_eol*Ss/Pp).toFixed(1)+' mΩ', c:'var(--o)'},
      {l:`Pack IR EoL (${d.temps[0]}°C/20%SoC)`, v:coldIR?(coldIR*grow*Ss/Pp).toFixed(1)+' mΩ':'-', c:'var(--r)'},
    ].map(r=>`<div class="kpi-card" style="border-color:${r.c}22"><div class="kpi-v" style="color:${r.c};font-size:13px">${r.v}</div><div class="kpi-l">${r.l}</div></div>`).join('')}
  </div>
</div>
<div class="ico-banner" style="margin-top:12px">
  📌 All values from ${window._dcirMode==='excel'?'uploaded cell supplier datasheet':'manual entry'}.
  Pack = Cell × ${Ss}/${Pp}. EoL growth = c_ir_eol ÷ c_ir_bol (Cell Inputs tab).
</div>`;
}

(function(){
  const _ss=window.showSec;
  window.showSec=function(id,btn){
    if(typeof _ss==='function') _ss(id,btn);
    if(id==='dcir') setTimeout(()=>{try{renderDCIRMap();}catch(e){}},60);
  };
})();


/* inlined: dcir-current-map.js */
/* ═══════════════════════════════════════════════════════════════
   BatteryMIS - DCIR CURRENT MAP + FUSE SELECTOR  v1.0
   Adds to DCIR sheet:
   - Charge vs Discharge DCIR comparison
   - Current mapping: pulse, continuous, peak vs DCIR
   - I²R heat map at each operating point
   - Fuse selection & recommendation engine
   ═══════════════════════════════════════════════════════════════ */

/* ════════════════════════════════
   DCIR CURRENT MAP - appended below main DCIR heatmap
   Called by renderDCIRMap after it builds root.innerHTML
   ════════════════════════════════ */
(function patchDCIRMap() {
  const _orig = window.renderDCIRMap;
  window.renderDCIRMap = function() {
    if (typeof _orig === 'function') _orig();
    /* Append current mapping section */
    const root = document.getElementById('dcir_root');
    if (!root) return;
    const extra = document.getElementById('dcir_current_section');
    if (!extra) {
      const div = document.createElement('div');
      div.id = 'dcir_current_section';
      root.appendChild(div);
    }
    renderDCIRCurrentMap();
  };
})();

window.renderDCIRCurrentMap = function() {
  const wrap = document.getElementById('dcir_current_section');
  if (!wrap) return;
  const S   = window.S || {};
  const srcN = id => { const el=document.getElementById(id); return (el&&el.value!=='')?+el.value:null; };
  const Ss  = (srcN('c_cps')||S.c_cps||14)*(srcN('c_ss')||S.c_ss||8);
  const Pp  = S.c_pp    || srcN('c_pp') || 1;
  const Vnom= S.V_nom_pack || (Ss*(srcN('c_vnom')||S.c_vnom||3.2)) || 400;
  const Qpack= S.Q_pack   || (srcN('c_ah')||S.c_ah||120)*Pp;

  /* Current levels from project */
  const I_peak = S.t_ppeak ? S.t_ppeak*1000/Vnom : 300;
  const I_cont = S.t_pcont ? S.t_pcont*1000/Vnom : 150;
  const I_chg  = S.t_imax_chg || 120;
  const I_regen= I_peak * 0.4;
  const I_pulse_10s = I_peak;
  const I_pulse_30s = I_peak * 0.85;

  /* DCIR at key conditions - use uploaded data if available, else placeholder */
  const hasDCIR = window._dcirData && window._dcirData.matrix?.length > 0;
  const getIR = (soc, temp) => hasDCIR ? (dcirInterp(soc, temp) ?? null) : null;

  /* Current operating matrix */
  const scenarios = [
    { label:'Peak Discharge (10s)',  I: I_peak,     soc:80, temp:25,  type:'dis', dur:'10s'  },
    { label:'Peak Discharge (30s)',  I: I_pulse_30s,soc:80, temp:25,  type:'dis', dur:'30s'  },
    { label:'Cont. Discharge',       I: I_cont,     soc:50, temp:25,  type:'dis', dur:'∞'    },
    { label:'DC Fast Charge',        I: I_chg,      soc:20, temp:25,  type:'chg', dur:'∞'    },
    { label:'Regen Braking (peak)',  I: I_regen,    soc:90, temp:25,  type:'chg', dur:'5s'   },
    { label:'Cold Start (−10°C)',    I: I_cont,     soc:20, temp:-10, type:'dis', dur:'∞'    },
    { label:'Hot Discharge (45°C)',  I: I_cont,     soc:50, temp:45,  type:'dis', dur:'∞'    },
    { label:'Cold Charge (0°C)',     I: I_chg*0.2,  soc:10, temp:0,   type:'chg', dur:'∞'    },
  ];

  const rows = scenarios.map(sc => {
    const ir_cell  = getIR(sc.soc, sc.temp);
    const ir_pack  = ir_cell != null ? ir_cell * Ss / Pp : null;  // mΩ
    const Vdrop    = ir_pack != null ? ir_pack * 1e-3 * sc.I : null;
    const Pir      = ir_pack != null ? Math.pow(sc.I, 2) * ir_pack * 1e-3 : null; // W heat
    const Crate    = Qpack > 0 ? sc.I / Qpack : null;
    const col_type = sc.type === 'chg' ? 'var(--b)' : 'var(--o)';
    const status   = Crate != null
      ? (Crate > 3 ? '<span style="color:var(--r)">⚠ HIGH</span>'
        : Crate > 2 ? '<span style="color:var(--y)">ELEVATED</span>'
        : '<span style="color:var(--g)">OK</span>')
      : '-';
    return `<tr>
      <td style="font-size:12px">${sc.label}</td>
      <td style="font-family:var(--mono);color:${col_type}">${sc.type==='chg'?'CHG':'DIS'} ${sc.dur}</td>
      <td style="font-family:var(--mono);font-weight:700;font-size:13px">${sc.I.toFixed(0)} A</td>
      <td style="font-family:var(--mono)">${Crate!=null?Crate.toFixed(3)+'C':'-'}</td>
      <td style="font-family:var(--mono)">${sc.soc}%</td>
      <td style="font-family:var(--mono)">${sc.temp}°C</td>
      <td style="font-family:var(--mono);color:var(--text2)">${ir_cell!=null?ir_cell.toFixed(3)+' mΩ':'Upload DCIR data ↑'}</td>
      <td style="font-family:var(--mono);color:var(--text2)">${ir_pack!=null?ir_pack.toFixed(1)+' mΩ':'-'}</td>
      <td style="font-family:var(--mono);color:${Vdrop&&Vdrop/Vnom>0.05?'var(--r)':'var(--text2)'}">${Vdrop!=null?Vdrop.toFixed(1)+' V ('+((Vdrop/Vnom)*100).toFixed(1)+'%)':'-'}</td>
      <td style="font-family:var(--mono);color:${Pir&&Pir>500?'var(--r)':Pir&&Pir>200?'var(--y)':'var(--g)'}">${Pir!=null?(Pir/1000).toFixed(2)+' kW':'-'}</td>
      <td>${status}</td>
    </tr>`;
  }).join('');

  /* PSD / frequency domain section */
  const psdCanvas = `<canvas id="dcir_psd_canvas" height="180" style="width:100%;display:block;border-radius:6px;background:var(--bg);margin-top:10px"></canvas>`;

  wrap.innerHTML = `
<hr style="border:none;border-top:1px solid var(--border);margin:20px 0">

<!-- CHARGE vs DISCHARGE DCIR note -->
<div class="card" style="margin-bottom:16px">
  <div class="ch3">⚡ Charge vs Discharge DCIR - What Engineers Need to Know</div>
  <div class="fbox" style="margin-top:8px;line-height:1.8">
    <b>Discharge DCIR</b> = resistance during energy release. Drives pack voltage drop (ΔV = I × R_pack), heat generation (Q = I²R), and power capability limit.<br>
    <b>Charge DCIR</b> = resistance during charging. Higher at low SoC and cold temp - limits fast-charge current acceptance. Charge DCIR ≈ discharge DCIR for most Li-ion chemistries (within ±10%).<br>
    <b>Pulse vs Continuous:</b> 10s pulse IR is typically 10–20% higher than DC value (inductive + electrochemical transient). Always use 10s pulse value for peak current calculations.<br>
    <b>Temperature effect:</b> DCIR increases exponentially below 10°C - cold-start voltage drop is the primary constraint for EV winter performance.<br>
    <span style="color:var(--teal)">→ Upload your cell DCIR datasheet (charge + discharge columns) in the DCIR Map tab above for actual values.</span>
  </div>
</div>

<!-- CURRENT MAPPING TABLE -->
<div class="card" style="margin-bottom:16px">
  <div class="ch3">📊 Current × DCIR Operating Point Matrix</div>
  <div style="font-size:11px;color:var(--text3);margin-bottom:10px">
    Auto-linked: I_peak from P_peak/V_nom · I_cont from P_cont/V_nom · I_chg from Cell tab max charge current
    ${!hasDCIR?'<span style="color:var(--y)"> · Upload DCIR data in tab above to see IR and ΔV values</span>':''}
  </div>
  <div style="overflow-x:auto">
  <table class="res-tbl" style="font-size:12px;min-width:900px">
    <thead><tr>
      <th>Scenario</th><th>Type/Duration</th><th>Current</th><th>C-rate</th>
      <th>SoC</th><th>Temp</th><th>Cell DCIR</th><th>Pack DCIR</th>
      <th>Pack ΔV</th><th>I²R Heat</th><th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </div>
  <div class="ico-banner" style="margin-top:10px">
    I_peak = ${I_peak.toFixed(0)} A · I_cont = ${I_cont.toFixed(0)} A · I_chg = ${I_chg.toFixed(0)} A · Pack: ${Ss}S/${Pp}P · V_nom = ${Vnom.toFixed(0)} V
  </div>
</div>

<!-- PULSE POWER vs DCIR CHART -->

`;

  /* Draw V-I envelope canvas */
  requestAnimationFrame(() => {
    const canvas = document.getElementById('dcir_vi_canvas');
    if (!canvas) return;
    const W = canvas.offsetWidth || 700, H = 220;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const pad = {l:56,r:20,t:20,b:36};
    const pw=W-pad.l-pad.r, ph=H-pad.t-pad.b;

    const Imin=0, Imax=I_peak*1.3;
    const Vmin_plot=Vnom*0.7, Vmax_plot=Vnom*1.1;
    const mx=I=>pad.l+(I-Imin)/(Imax-Imin)*pw;
    const my=V=>pad.t+ph*(1-(V-Vmin_plot)/(Vmax_plot-Vmin_plot));

    /* Grid */
    ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
    [0,.25,.5,.75,1].forEach(f=>{
      const y=pad.t+ph*f;
      ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(W-pad.r,y);ctx.stroke();
      ctx.fillStyle='#3a567a';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='right';
      ctx.fillText(((Vmax_plot-(Vmax_plot-Vmin_plot)*f)).toFixed(0)+'V',pad.l-3,y+3);
    });

    /* V_min line */
    const Vmin_sys = S.V_min_pack || Vnom*0.7;
    ctx.strokeStyle='rgba(255,77,109,.4)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
    const yVmin=my(Vmin_sys);
    ctx.beginPath();ctx.moveTo(pad.l,yVmin);ctx.lineTo(W-pad.r,yVmin);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,77,109,.6)';ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='left';
    ctx.fillText('V_min '+Vmin_sys.toFixed(0)+'V',pad.l+4,yVmin-3);

    /* V-I lines for different conditions */
    const curves = [
      { soc:80, temp:25,  col:'#00d4aa', label:'80%/25°C' },
      { soc:50, temp:25,  col:'#f5c518', label:'50%/25°C' },
      { soc:20, temp:25,  col:'#4a9eff', label:'20%/25°C' },
      { soc:20, temp:-10, col:'#ff4d6d', label:'20%/−10°C' },
    ];
    curves.forEach(cv => {
      const ir_cell = getIR(cv.soc, cv.temp) ?? (S.c_ir_bol||0.22)*2.5;
      const ir_pack = ir_cell * Ss / Pp;
      /* V_oc at this SoC - approximate from cell Vnom */
      const ocv_soc = (S.c_vmin||2.8) + ((S.c_vmax||4.2)-(S.c_vmin||2.8)) * (cv.soc/100) * Ss;
      ctx.beginPath();ctx.strokeStyle=cv.col;ctx.lineWidth=2;
      for(let k=0;k<=60;k++){
        const I=Imin+(Imax-Imin)*k/60;
        const V=ocv_soc - I*ir_pack*1e-3;
        const x=mx(I), y=my(V);
        k===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
      }
      ctx.stroke();
    });

    /* I_peak, I_cont markers */
    [
      {I:I_peak, label:'I_peak', col:'rgba(255,123,53,.7)'},
      {I:I_cont, label:'I_cont', col:'rgba(0,212,170,.7)'},
      {I:I_chg,  label:'I_chg',  col:'rgba(74,158,255,.7)'},
    ].forEach(m=>{
      const x=mx(m.I);
      ctx.strokeStyle=m.col;ctx.lineWidth=1;ctx.setLineDash([3,4]);
      ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,H-pad.b);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=m.col;ctx.font='9px JetBrains Mono,monospace';ctx.textAlign='center';
      ctx.fillText(m.label,x,pad.t+8);
    });

    ctx.fillStyle='#4a6080';ctx.font='10px JetBrains Mono,monospace';ctx.textAlign='center';
    ctx.fillText('Pack Current (A)',pad.l+pw/2,H-4);
  });

};

/* ════════════════════════════════
   FUSE SELECTOR
   ════════════════════════════════ */
window.renderFuseSelector = function() {
  const root = document.getElementById('fuse_root');
  if (!root) return;
  const S = window.S || {};
  const srcN = id => { const el=document.getElementById(id); return (el&&el.value!=='')?+el.value:null; };

  /* Derived pack values - read from source Cell Inputs / Project Targets */
  const Ss = S.S_total || (srcN('c_cps')||14)*(srcN('c_ss')||8);
  const Pp = S.c_pp    || srcN('c_pp') || 1;
  const c_vnom = srcN('c_vnom') ?? S.c_vnom ?? 3.2;
  const c_vmax = srcN('c_vmax') ?? S.c_vmax ?? 3.65;
  const V_nom  = S.V_nom_pack || (Ss * c_vnom);
  const t_ppeak= srcN('t_ppeak') ?? S.t_ppeak ?? 80;
  const t_pcont= srcN('t_pcont') ?? S.t_pcont ?? 50;

  /* Fuse inputs - prefer fuse_* override, else calculate from project */
  const I_peak = +(document.getElementById('fuse_ipeak')?.value || (V_nom>0?(t_ppeak*1000/V_nom).toFixed(0):300));
  const I_cont = +(document.getElementById('fuse_icont')?.value || (V_nom>0?(t_pcont*1000/V_nom).toFixed(0):150));
  const V_max  = +(document.getElementById('fuse_vmax')?.value  || S.V_max_pack || (Ss*c_vmax));

  /* Pack IR in Ω for short-circuit estimate */
  const pack_ir_ohm = ((S._packIR_bol || (S.c_ir_bol||0.22)*Ss/Pp)) * 1e-3; // mΩ→Ω
  const wire_r_ohm  = 0.005; // ~5mΩ typical HV harness
  const I_sc_raw   = Math.min(10000, Math.round(V_max / Math.max(pack_ir_ohm + wire_r_ohm, 0.001)));
  const I_sc_est   = +(document.getElementById('fuse_isc')?.value || I_sc_raw);

  /* Fuse rating rule: 1.3–1.5× I_cont, must interrupt I_sc, voltage rating ≥ V_max */
  const I_fuse_min = I_cont * 1.25;
  const I_fuse_max = I_cont * 2.0;

  /* Standard fuse ratings */
  const FUSE_RATINGS = [100,125,160,200,250,315,400,500,630,800,1000,1250,1600];
  const best_fuse = FUSE_RATINGS.find(r => r >= I_fuse_min && r <= I_fuse_max) ||
                    FUSE_RATINGS.find(r => r >= I_fuse_min) || 1000;

  /* Fuse types */
  const fuseTypes = [
    { type:'Bussman MIDI/AMI', range:'30–200A', volt:'58–100V', note:'LV packs <100V, 2W/4W', ok: V_max<=100 },
    { type:'Littelfuse MEGA',  range:'40–500A', volt:'32V/58V/125V', note:'Mid-voltage packs', ok: V_max<=150 },
    { type:'Schurter NH/DIN',  range:'100–630A', volt:'up to 1000V DC', note:'HV EV packs, Class B', ok: V_max>150 && V_max<=1000 },
    { type:'Bussmann HVL-SP',  range:'100–500A', volt:'900V DC', note:'HV automotive, IEC 60269', ok: V_max>400 },
    { type:'Littelfuse JLLS',  range:'50–600A', volt:'700V DC', note:'IEC certified HV', ok: V_max>300 && V_max<=700 },
    { type:'Eaton Bussmann KleinGlass', range:'1–30A', volt:'1000V DC', note:'BMS logic fuses', ok: true },
  ];

  const fuseRows = fuseTypes.map(f => `
    <tr style="${f.ok?'background:rgba(0,212,170,.04)':''}">
      <td style="font-weight:700;font-size:12px;color:${f.ok?'var(--g)':'var(--text3)'}">${f.ok?'⭐ ':''} ${f.type}</td>
      <td style="font-family:var(--mono);font-size:12px">${f.range}</td>
      <td style="font-family:var(--mono);font-size:12px">${f.volt}</td>
      <td style="font-size:11px;color:var(--text2)">${f.note}</td>
    </tr>`).join('');

  /* MSD sizing */
  const msd_rating = Math.ceil(I_peak / 50) * 50;

  root.innerHTML = `
<div class="g2" style="margin-bottom:16px">
  <div class="card">
    <div class="ch3">⚡ Pack Parameters</div>
    <div style="font-size:10px;font-family:var(--mono);color:var(--text3);margin-bottom:8px">
      🔗 Auto-linked: I_peak=P_peak÷V_nom · I_cont=P_cont÷V_nom · V_max from Cell Inputs · Config: ${S.config_label||'not set'}
    </div>
    <div class="g2" style="margin-top:10px">
      <div class="field"><label>Peak Current I_peak (A)</label>
        <input type="number" id="fuse_ipeak" value="${I_peak.toFixed(0)}" step="10" oninput="renderFuseSelector()">
        <div class="hint">P_peak (${S.t_ppeak||0}kW) ÷ V_nom (${(S.V_nom_pack||400).toFixed(0)}V) from Project Targets</div></div>
      <div class="field"><label>Cont. Current I_cont (A)</label>
        <input type="number" id="fuse_icont" value="${I_cont.toFixed(0)}" step="10" oninput="renderFuseSelector()">
        <div class="hint">P_cont ÷ V_nom</div></div>
      <div class="field"><label>Pack V_max (V)</label>
        <input type="number" id="fuse_vmax" value="${V_max.toFixed(0)}" step="10" oninput="renderFuseSelector()">
        <div class="hint">From Cell tab - sets fuse voltage class</div></div>
      <div class="field"><label>Est. Short-circuit Current (A)</label>
        <input type="number" id="fuse_isc" value="${I_sc_est.toFixed(0)}" step="100" oninput="renderFuseSelector()">
        <div class="hint">V_max ÷ R_pack (from DCIR). Fuse must interrupt this.</div></div>
    </div>
  </div>

  <div class="card">
    <div class="ch3">🎯 Fuse Recommendation</div>
    <div class="g2" style="margin-top:12px">
      ${[
        {l:'Recommended Main Fuse', v:best_fuse+' A', c:'var(--g)'},
        {l:'Min fuse (1.25×I_cont)', v:I_fuse_min.toFixed(0)+' A', c:'var(--text)'},
        {l:'Max fuse (2.0×I_cont)', v:I_fuse_max.toFixed(0)+' A', c:'var(--text)'},
        {l:'Fuse voltage class', v:(V_max>400?'1000V DC class':V_max>150?'700V DC class':'125V class'), c:'var(--b)'},
        {l:'MSD rating', v:msd_rating+' A', c:'var(--y)'},
        {l:'Interrupt capacity ≥', v:I_sc_est.toFixed(0)+' A', c:'var(--r)'},
      ].map(r=>`<div class="kpi-card" style="border-color:${r.c}22"><div class="kpi-v" style="color:${r.c}">${r.v}</div><div class="kpi-l">${r.l}</div></div>`).join('')}
    </div>
    <div class="ico-banner" style="margin-top:12px">
      ⚙ Fuse sizing: 1.25×I_cont ≤ I_fuse ≤ 2.0×I_cont. Voltage rating ≥ V_max.
      Interrupt capacity ≥ I_sc. Standard: IEC 60269-4, SAE J1495, ISO 8820.
    </div>
  </div>
</div>

<!-- FUSE TYPE TABLE -->
<div class="card" style="margin-bottom:16px">
  <div class="ch3">📋 Fuse Type Selection - for ${V_max.toFixed(0)}V / ${I_peak.toFixed(0)}A pack</div>
  <table class="res-tbl" style="font-size:12px;margin-top:10px">
    <thead><tr><th>Fuse Type</th><th>Current Range</th><th>Voltage Rating</th><th>Application</th></tr></thead>
    <tbody>${fuseRows}</tbody>
  </table>
</div>

<!-- FUSE CIRCUIT DIAGRAM (SVG) -->
<div class="card" style="margin-bottom:16px">
  <div class="ch3">🔌 HV Circuit Protection Layout</div>
  <svg viewBox="0 0 700 160" style="width:100%;max-width:700px;display:block;margin-top:12px;font-family:JetBrains Mono,monospace">
    <!-- Bus -->
    <line x1="30" y1="80" x2="670" y2="80" stroke="rgba(255,255,255,.1)" stroke-width="2"/>
    <!-- Battery block -->
    <rect x="30" y="55" width="100" height="50" rx="6" fill="rgba(0,212,170,.1)" stroke="rgba(0,212,170,.4)" stroke-width="1.5"/>
    <text x="80" y="78" fill="#00d4aa" font-size="10" text-anchor="middle">BATTERY</text>
    <text x="80" y="92" fill="#3a567a" font-size="9" text-anchor="middle">${Ss}S·${Pp}P</text>
    <!-- MSD -->
    <rect x="155" y="62" width="60" height="36" rx="4" fill="rgba(245,197,24,.1)" stroke="rgba(245,197,24,.4)" stroke-width="1.5"/>
    <text x="185" y="80" fill="#f5c518" font-size="9" text-anchor="middle">MSD</text>
    <text x="185" y="92" fill="#3a567a" font-size="8" text-anchor="middle">${msd_rating}A</text>
    <!-- Main fuse -->
    <rect x="240" y="62" width="70" height="36" rx="4" fill="rgba(255,123,53,.1)" stroke="rgba(255,123,53,.4)" stroke-width="1.5"/>
    <text x="275" y="78" fill="#ff7b35" font-size="9" text-anchor="middle">FUSE</text>
    <text x="275" y="91" fill="#3a567a" font-size="8" text-anchor="middle">${best_fuse}A</text>
    <!-- Precharge -->
    <rect x="335" y="55" width="80" height="50" rx="4" fill="rgba(139,92,246,.1)" stroke="rgba(139,92,246,.4)" stroke-width="1.5"/>
    <text x="375" y="77" fill="#8b5cf6" font-size="9" text-anchor="middle">PRE-CHG</text>
    <text x="375" y="89" fill="#3a567a" font-size="8" text-anchor="middle">relay+R</text>
    <!-- Main contactor -->
    <rect x="440" y="62" width="70" height="36" rx="4" fill="rgba(74,158,255,.1)" stroke="rgba(74,158,255,.4)" stroke-width="1.5"/>
    <text x="475" y="78" fill="#4a9eff" font-size="9" text-anchor="middle">CONT.</text>
    <text x="475" y="91" fill="#3a567a" font-size="8" text-anchor="middle">main</text>
    <!-- Load -->
    <rect x="540" y="55" width="80" height="50" rx="6" fill="rgba(0,212,170,.08)" stroke="rgba(0,212,170,.3)" stroke-width="1.5"/>
    <text x="580" y="77" fill="#dde8f8" font-size="9" text-anchor="middle">INVERTER</text>
    <text x="580" y="91" fill="#3a567a" font-size="8" text-anchor="middle">/LOAD</text>
    <!-- Connectors -->
    <line x1="130" y1="80" x2="155" y2="80" stroke="rgba(0,212,170,.5)" stroke-width="2"/>
    <line x1="215" y1="80" x2="240" y2="80" stroke="rgba(0,212,170,.5)" stroke-width="2"/>
    <line x1="310" y1="80" x2="335" y2="80" stroke="rgba(0,212,170,.5)" stroke-width="2"/>
    <line x1="415" y1="80" x2="440" y2="80" stroke="rgba(0,212,170,.5)" stroke-width="2"/>
    <line x1="510" y1="80" x2="540" y2="80" stroke="rgba(0,212,170,.5)" stroke-width="2"/>
    <!-- Labels -->
    <text x="80" y="140" fill="#3a567a" font-size="9" text-anchor="middle">Pack</text>
    <text x="185" y="140" fill="#f5c518" font-size="9" text-anchor="middle">Manual SD</text>
    <text x="275" y="140" fill="#ff7b35" font-size="9" text-anchor="middle">Main Fuse</text>
    <text x="375" y="140" fill="#8b5cf6" font-size="9" text-anchor="middle">Precharge</text>
    <text x="475" y="140" fill="#4a9eff" font-size="9" text-anchor="middle">Contactor</text>
    <text x="580" y="140" fill="#dde8f8" font-size="9" text-anchor="middle">Load</text>
  </svg>
</div>

<div class="ico-banner">
  📌 Standards: IEC 60269-4 (DC fuses) · SAE J1495 (EV fuses) · ISO 8820-3 (automotive) · IEC 62619 §7.3.1 (short circuit protection).
  Fuse must clear I_sc ≥ ${I_sc_est.toFixed(0)} A. Always verify with fuse manufacturer's I²t characteristic.
</div>`;
};

/* Hook showSec for fuse tab */
(function(){
  const _ss = window.showSec;
  window.showSec = function(id, btn) {
    if (typeof _ss==='function') _ss(id, btn);
    if (id==='fuse') setTimeout(()=>{try{renderFuseSelector();}catch(e){}},60);
    if (id==='dcir') setTimeout(()=>{try{renderDCIRCurrentMap();}catch(e){}},200);
  };
  const _pp = window.propagate;
  window.propagate = function() {
    if (typeof _pp==='function') _pp.apply(this,arguments);
    try { if(document.getElementById('fuse')?.classList.contains('active')) renderFuseSelector(); } catch(e) {}
    try {
      const dcirSec = document.getElementById('dcir');
      if (dcirSec?.classList.contains('active')) {
        setTimeout(()=>renderDCIRCurrentMap(),100);
      }
    } catch(e) {}
  };
})();

