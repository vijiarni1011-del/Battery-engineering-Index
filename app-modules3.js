/* app-modules3.js - Sizing Calc, Fixes, Boot */
/* inlined: sizing-calc.js */
/* ═══════════════════════════════════════════════════════════════
   BatteryMIS - SIZING CALCULATOR  v1.0
   S×P Optimizer with full constraint matrix
   Renders into id="sizing" section
   Auto-reads from S state (Project Targets + Cell Inputs)
   ═══════════════════════════════════════════════════════════════ */

window.renderSizing = function() {
  const root = document.getElementById('sizing_root');
  if (!root) return;

  const S = window.S || {};

  /* ── Read from SOURCE fields (Cell Inputs / Project Targets DOM) ── */
  // Priority: source input > sz_* override input > S state > hardcoded fallback
  const src = id => { const el=document.getElementById(id); return el&&el.value!==''?+el.value:null; };
  const ovr = id => { const el=document.getElementById('sz_'+id); return el&&el.value!==''?+el.value:null; };

  const c_vnom  = ovr('c_vnom') ?? src('c_vnom') ?? S.c_vnom  ?? 3.2;
  const c_vmax  = ovr('c_vmax') ?? src('c_vmax') ?? S.c_vmax  ?? 3.65;
  const c_vmin  = ovr('c_vmin') ?? src('c_vmin') ?? S.c_vmin  ?? 2.0;
  const c_ah    = ovr('c_ah')   ?? src('c_ah')   ?? S.c_ah    ?? 120;
  const c_mass  = ovr('c_mass') ?? src('c_mass') ?? S.c_mass  ?? 2800;
  const c_ir    = ovr('c_ir')   ?? src('c_ir_bol') ?? S.c_ir_bol ?? 0.22;
  const c_cmax  = ovr('c_cmax') ?? src('t_cpeak') ?? S.t_cpeak ?? 3.0;

  const t_E_min = ovr('t_E')    ?? src('t_emin')     ?? S.t_emin     ?? 40;
  const t_V_min = ovr('t_Vmin') ?? src('t_vmin_sys') ?? S.t_vmin_sys ?? 280;
  const t_V_max = ovr('t_Vmax') ?? src('t_vmax_sys') ?? S.t_vmax_sys ?? 420;
  const t_P_peak= ovr('t_Ppeak')??src('t_ppeak')     ?? S.t_ppeak    ?? 80;
  const t_P_cont= ovr('t_Pcont')??src('t_pcont')     ?? S.t_pcont    ?? 50;
  const t_Ccont = ovr('t_Ccont')??1.5;
  const t_mass  = ovr('t_mass') ??src('t_pmass_max') ?? S.t_pmass_max ?? 0;
  const t_dod   = ovr('t_dod')  ??src('t_dod')       ?? S.t_dod      ?? 1.0;
  const t_ged   = ovr('t_ged')  ??src('t_ged')        ?? S.t_ged      ?? 100;

  // ── Current Cell Inputs configuration (always show + highlight) ──
  const curr_cps = src('c_cps') || S.c_cps || 16;
  const curr_ss  = src('c_ss')  || S.c_ss  || 8;
  const curr_Ss  = curr_cps * curr_ss;
  const curr_Pp  = src('c_pp')  || S.c_pp  || 1;

  /* ── S range: ±20% around current Cell Inputs config, bounded by Project Targets ── */
  // Parse req_s_range "96-128" from Project Targets (if set) as outer bound
  const _reqRange = (document.getElementById('req_s_range')?.value || '').replace('–','-');
  const _reqParts = _reqRange.split(/[-–]/);
  const req_s_min = _reqParts.length >= 2 ? +_reqParts[0] : 0;
  const req_s_max = _reqParts.length >= 2 ? +_reqParts[1] : 0;

  // Core range: ±20% around current config (curr_Ss from Cell Inputs)
  const pct20_lo = curr_Ss > 0 ? Math.floor(curr_Ss * 0.80) : 0;
  const pct20_hi = curr_Ss > 0 ? Math.ceil(curr_Ss  * 1.20) : 300;

  // If req_s_range is set, use intersection (most restrictive); else use ±20%
  const s_lo = Math.max(1,
    req_s_min > 0 ? Math.max(req_s_min, pct20_lo) : pct20_lo
  );
  const s_hi = Math.min(300,
    req_s_max > 0 ? Math.min(req_s_max, pct20_hi) : pct20_hi
  );

  const S_range = [];
  for (let s = s_lo; s <= s_hi; s++) S_range.push(s);
  // Always include the current config even if outside range
  if (curr_Ss > 0 && !S_range.includes(curr_Ss)) S_range.push(curr_Ss);
  S_range.sort((a,b)=>a-b);

  /* ── For each S, find valid P values ── */
  const results = [];

  for (const Ss of S_range) {
    const V_nom  = Ss * c_vnom;
    const V_max  = Ss * c_vmax;
    const V_min  = Ss * c_vmin;

    /* Voltage constraints */
    const v_nom_ok  = V_nom  >= t_V_min && V_nom  <= t_V_max;
    const v_max_ok  = V_max  <= t_V_max * 1.02;
    const v_min_ok  = V_min  >= t_V_min * 0.95;
    if (!v_nom_ok) continue;

    /* P range: how many parallel strings needed */
    const E_per_str  = c_ah * V_nom / 1000; // kWh per string (1P)
    const P_for_E    = Math.ceil(t_E_min / (E_per_str * t_dod));
    const P_max_mass = t_mass > 0 ? Math.floor((t_mass * 1000) / (Ss * c_mass / 1000)) : 99;

    for (let Pp = Math.max(1, P_for_E - 2); Pp <= Math.min(20, P_for_E + 4); Pp++) {
      const Q_pack   = c_ah * Pp;                    // Ah
      const E_gross  = Q_pack * V_nom / 1000;        // kWh
      const E_usable = E_gross * t_dod;              // kWh
      const pack_mass= Ss * Pp * c_mass / 1e6;       // tonnes → kg
      const pack_mass_kg = Ss * Pp * c_mass / 1000;  // g→kg

      /* Power checks */
      const I_peak   = V_nom > 0 ? t_P_peak * 1000 / V_nom : 0;
      const I_cont   = V_nom > 0 ? t_P_cont * 1000 / V_nom : 0;
      const C_peak   = Q_pack > 0 ? I_peak / Q_pack : 99;
      const C_cont   = Q_pack > 0 ? I_cont / Q_pack : 99;

      /* Pack IR */
      const R_pack   = c_ir * Ss / Pp;   // mΩ
      const V_drop   = R_pack * 1e-3 * I_peak; // V at peak
      const V_drop_pct = V_nom > 0 ? V_drop / V_nom * 100 : 0;

      /* Gravimetric ED */
      const GED      = pack_mass_kg > 0 ? E_gross * 1000 / pack_mass_kg : 0; // Wh/kg

      /* ── Constraint checks ── */
      const checks = {
        E_usable:  E_usable >= t_E_min,
        V_nom:     V_nom >= t_V_min && V_nom <= t_V_max,
        V_max:     V_max <= t_V_max * 1.02,
        V_min:     V_min >= t_V_min * 0.90,
        C_peak:    C_peak <= c_cmax,
        C_cont:    C_cont <= t_Ccont,
        mass:      pack_mass_kg <= t_mass || t_mass <= 0,
        GED:       GED >= t_ged || t_ged <= 0,
        Vdrop:     V_drop_pct <= 5,
      };

      const passAll  = Object.values(checks).every(Boolean);
      const failCount= Object.values(checks).filter(v => !v).length;
      const score    = passAll ? (E_usable / t_E_min + (t_ged > 0 ? GED / t_ged : 1) - C_peak / c_cmax) : -failCount;

      results.push({
        Ss, Pp, V_nom, V_max, V_min, Q_pack, E_gross, E_usable,
        C_peak, C_cont, R_pack, V_drop_pct, GED, pack_mass_kg,
        checks, passAll, failCount, score,
        label: `${Ss}S / ${Pp}P`,
      });
    }
  }

    // Tag current Cell Inputs config
  results.forEach(r => { r.isCurrent = r.Ss===curr_Ss && r.Pp===curr_Pp; });

  /* Sort: passing first by score, then by fail count ascending */
  results.sort((a, b) => b.score - a.score || a.failCount - b.failCount);

  const best    = results.find(r => r.passAll);
  const topRows = results.slice(0, 20); // show top 20

  /* ── Render ── */
  const fv = (v, dec=1) => (v===undefined||v===null||isNaN(v)) ? '-' : (+v).toFixed(dec);
  const ck = ok => ok
    ? '<span style="color:var(--g);font-size:11px">✓</span>'
    : '<span style="color:var(--r);font-size:11px">✗</span>';
  const statusBadge = r => r.passAll
    ? '<span style="padding:2px 8px;background:rgba(0,212,170,.15);border:1px solid rgba(0,212,170,.4);border-radius:4px;color:var(--g);font-size:10px;font-weight:700">✓ ALL PASS</span>'
    : r.failCount <= 2
    ? `<span style="padding:2px 8px;background:rgba(245,197,24,.12);border:1px solid rgba(245,197,24,.4);border-radius:4px;color:var(--y);font-size:10px;font-weight:700">⚠ ${r.failCount} FAIL</span>`
    : `<span style="padding:2px 8px;background:rgba(255,77,109,.1);border:1px solid rgba(255,77,109,.3);border-radius:4px;color:var(--r);font-size:10px;font-weight:700">✗ ${r.failCount} FAIL</span>`;

  const tableRows = topRows.map((r, i) => {
    const isOpt = r === best;
    const bg = isOpt ? 'background:rgba(0,212,170,.07)' : i%2===0 ? '' : 'background:rgba(255,255,255,.01)';
    const rowStyle = r.isCurrent ? "background:rgba(0,212,170,.1);border-left:3px solid var(--g);border-bottom:1px solid rgba(0,212,170,.2)" : `${bg};border-bottom:1px solid var(--border)`;
  return `<tr style="${rowStyle}" onclick="szApplyConfig(${r.Ss},${r.Pp})" style="cursor:pointer">
      <td style="padding:7px 12px;font-family:var(--mono);font-weight:700;color:${isOpt?'var(--g)':'var(--text)'};font-size:12px">
        ${isOpt?'⭐ ':''}${r.label}${r.isCurrent ? ' <span style="font-size:9px;background:rgba(0,212,170,.2);color:var(--g);border-radius:3px;padding:1px 5px;font-family:var(--mono)">✓ CURRENT</span>' : ''}
      </td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:var(--b)">${fv(r.V_nom,0)} V</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right">${fv(r.V_max,0)}/${fv(r.V_min,0)} V</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:var(--g)">${fv(r.E_gross,1)} kWh</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:${r.E_usable>=t_E_min?'var(--g)':'var(--r)'}">${fv(r.E_usable,1)} kWh</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:${r.C_peak>c_cmax?'var(--r)':r.C_peak>c_cmax*0.9?'var(--y)':'var(--text2)'}">${fv(r.C_peak,2)} C</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:${r.C_cont>t_Ccont?'var(--r)':'var(--text2)'}">${fv(r.C_cont,2)} C</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:${r.pack_mass_kg>t_mass&&t_mass>0?'var(--r)':'var(--text2)'}">${fv(r.pack_mass_kg,0)} kg</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:${r.GED<t_ged&&t_ged>0?'var(--r)':'var(--text2)'}">${fv(r.GED,0)} Wh/kg</td>
      <td style="padding:7px 10px;font-family:var(--mono);font-size:12px;text-align:right;color:${r.V_drop_pct>5?'var(--r)':'var(--text2)'}">${fv(r.V_drop_pct,1)}%</td>
      <td style="padding:7px 10px;text-align:center">${statusBadge(r)}</td>
    </tr>`;
  }).join('');

  /* ── Constraint summary for best config ── */
  const bestSummary = best ? `
<div class="g3" style="margin-bottom:16px">
  ${[
    {l:'Configuration',    v:`${best.Ss}S / ${best.Pp}P`,      c:'var(--g)'},
    {l:'Pack V_nom',       v:`${fv(best.V_nom,0)} V`,           c:'var(--b)'},
    {l:'V_max / V_min',    v:`${fv(best.V_max,0)} / ${fv(best.V_min,0)} V`, c:'var(--text)'},
    {l:'Gross Energy',     v:`${fv(best.E_gross,2)} kWh`,       c:'var(--g)'},
    {l:'Usable Energy',    v:`${fv(best.E_usable,2)} kWh`,      c:'var(--g)'},
    {l:'Pack Capacity',    v:`${fv(best.Q_pack,0)} Ah`,         c:'var(--text)'},
    {l:'Peak C-rate',      v:`${fv(best.C_peak,3)} C`,          c:best.C_peak>c_cmax?'var(--r)':'var(--g)'},
    {l:'Cont. C-rate',     v:`${fv(best.C_cont,3)} C`,          c:best.C_cont>t_Ccont?'var(--r)':'var(--g)'},
    {l:'Pack Mass (est.)', v:`${fv(best.pack_mass_kg,0)} kg`,   c:'var(--text)'},
    {l:'Grav. ED',         v:`${fv(best.GED,0)} Wh/kg`,         c:best.GED<t_ged&&t_ged>0?'var(--r)':'var(--g)'},
    {l:'Pack IR BoL',      v:`${fv(best.R_pack,1)} mΩ`,         c:'var(--text)'},
    {l:'Peak ΔV',          v:`${fv(best.V_drop_pct,1)}% V_nom`, c:best.V_drop_pct>5?'var(--r)':'var(--g)'},
  ].map(k=>`<div class="kpi-card" style="border-color:${k.c}22">
    <div class="kpi-v" style="color:${k.c};font-size:14px">${k.v}</div>
    <div class="kpi-l">${k.l}</div>
  </div>`).join('')}
</div>` : `<div class="ico-banner" style="border-color:rgba(255,77,109,.3);background:rgba(255,77,109,.06)">
  ⚠ No configuration meets all constraints. Relax constraints or adjust cell parameters.
</div>`;

  // Force sync from S before rendering
const gv = id => { const el=document.getElementById(id); return el ? el.value : null; };

root.innerHTML = `
<!-- SYNC BANNER -->
<div class="ico-banner" style="margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
  🔗 Auto-linked from Cell Inputs &amp; Project Targets ·
  Config: <b style="color:var(--teal)">${S.config_label||((+(document.getElementById('c_cps')?.value)||S.c_cps||14)+'×'+(+(document.getElementById('c_ss')?.value)||S.c_ss||8)+'='+(S.S_total||((+(document.getElementById('c_cps')?.value)||S.c_cps||14)*(+(document.getElementById('c_ss')?.value)||S.c_ss||8)))+'S/'+(+(document.getElementById('c_pp')?.value)||S.c_pp||1)+'P')}</b>
  · E_gross: <b style="color:var(--teal)">${S.E_gross?.toFixed(1)||'-'} kWh</b>
  · V_nom: <b style="color:var(--teal)">${S.V_nom_pack?.toFixed(0)||'-'} V</b>
  · Cell: <b style="color:var(--teal)">${c_vnom}V nom / ${c_ah}Ah / ${c_ir}mΩ</b>
  <button onclick="renderSizing()" style="margin-left:auto;padding:4px 12px;background:rgba(0,212,170,.12);border:1px solid rgba(0,212,170,.3);color:var(--g);border-radius:5px;font-size:11px;font-weight:700;cursor:pointer">↻ Refresh from Project</button>
</div>
<!-- CONTROLS -->
<div class="g2" style="margin-bottom:16px">

<!-- Left: Cell Parameters -->
<div class="card">
  <div class="ch3" style="display:flex;align-items:center;justify-content:space-between">
    🔬 Cell Parameters
    <span>
      <span style="font-size:9px;font-family:var(--mono);color:var(--teal)">← auto from Cell Inputs</span>
      <button onclick="szClearOverrides()" style="margin-left:8px;padding:2px 8px;background:rgba(0,212,170,.1);border:1px solid rgba(0,212,170,.3);color:var(--g);border-radius:4px;font-size:9px;font-family:var(--mono);cursor:pointer">↻ Re-sync from Cell Inputs</button>
    </span>
  </div>
  <div class="g2" style="margin-top:10px">
    <div class="field">
      <label>Cell V_nom (V) <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">← c_vnom</span></label>
      <input type="number" id="sz_c_vnom" value="${c_vnom}" step="0.01" oninput="renderSizing()">
      <div class="hint">Source: ${(src('c_vnom') ?? S.c_vnom ?? 3.2)} V from Cell Inputs</div></div>
    <div class="field">
      <label>Cell V_max (V) <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">← c_vmax</span></label>
      <input type="number" id="sz_c_vmax" value="${c_vmax}" step="0.01" oninput="renderSizing()">
      <div class="hint">Source: ${(src('c_vmax') ?? S.c_vmax ?? 3.65)} V from Cell Inputs</div></div>
    <div class="field">
      <label>Cell V_min (V) <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">← c_vmin</span></label>
      <input type="number" id="sz_c_vmin" value="${c_vmin}" step="0.01" oninput="renderSizing()">
      <div class="hint">Source: ${(src('c_vmin') ?? S.c_vmin ?? 2.0)} V from Cell Inputs</div></div>
    <div class="field">
      <label>Cell Capacity (Ah) <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">← c_ah</span></label>
      <input type="number" id="sz_c_ah" value="${c_ah}" step="1" oninput="renderSizing()">
      <div class="hint">Source: ${(src('c_ah') ?? S.c_ah ?? 120)} Ah from Cell Inputs</div></div>
    <div class="field">
      <label>Cell Mass (g) <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">← c_mass</span></label>
      <input type="number" id="sz_c_mass" value="${c_mass}" step="10" oninput="renderSizing()">
      <div class="hint">Source: ${(src('c_mass') ?? S.c_mass ?? 2800)} g from Cell Inputs</div></div>
    <div class="field">
      <label>Cell DCIR BoL (mΩ) <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">← c_ir_bol</span></label>
      <input type="number" id="sz_c_ir" value="${c_ir}" step="0.01" oninput="renderSizing()">
      <div class="hint">Source: ${(src('c_ir_bol') ?? S.c_ir_bol ?? 0.22)} mΩ from Cell Inputs</div></div>
    <div class="field">
      <label>Max cell C-rate <span style="font-size:8px;color:var(--teal);font-family:var(--mono)">← t_cpeak</span></label>
      <input type="number" id="sz_c_cmax" value="${c_cmax}" step="0.1" oninput="renderSizing()">
      <div class="hint">Source: ${(src('t_cpeak') ?? S.t_cpeak ?? 2.0)} C from Project Targets</div></div>
  </div>
</div>

<!-- Right: System Constraints -->
<div class="card">
  <div class="ch3">🎯 System Constraints <span style="font-size:9px;font-family:var(--mono);color:var(--teal)">← auto from Project Targets</span></div>
  <div class="g2" style="margin-top:10px">
    <div class="field"><label>Min usable energy (kWh)</label>
      <input type="number" id="sz_t_E" value="${t_E_min}" step="1" oninput="renderSizing()"></div>
    <div class="field"><label>V_min system (V)</label>
      <input type="number" id="sz_t_Vmin" value="${t_V_min}" step="5" oninput="renderSizing()"></div>
    <div class="field"><label>V_max system (V)</label>
      <input type="number" id="sz_t_Vmax" value="${t_V_max}" step="5" oninput="renderSizing()"></div>
    <div class="field"><label>Peak power target (kW)</label>
      <input type="number" id="sz_t_Ppeak" value="${t_P_peak}" step="5" oninput="renderSizing()"></div>
    <div class="field"><label>Cont. power target (kW)</label>
      <input type="number" id="sz_t_Pcont" value="${t_P_cont}" step="5" oninput="renderSizing()"></div>
    <div class="field"><label>Max cont. C-rate</label>
      <input type="number" id="sz_t_Ccont" value="${t_Ccont}" step="0.1" oninput="renderSizing()"></div>
    <div class="field"><label>Max pack mass (kg, 0=no limit)</label>
      <input type="number" id="sz_t_mass" value="${t_mass}" step="10" oninput="renderSizing()"></div>
    <div class="field"><label>DoD</label>
      <input type="number" id="sz_t_dod" value="${t_dod}" step="0.01" min="0.5" max="1" oninput="renderSizing()"></div>
    <div class="field"><label>Min GED (Wh/kg, 0=no limit)</label>
      <input type="number" id="sz_t_ged" value="${t_ged}" step="5" oninput="renderSizing()"></div>
  </div>
</div>
</div>

<!-- Optimal config summary -->
<div class="sh" style="margin-bottom:12px">
  <h3 style="font-size:14px;font-weight:700;margin-bottom:6px">
    ⭐ Optimal Configuration${best?` - ${best.Ss}S / ${best.Pp}P`:''}
  <span style="font-size:11px;font-weight:400;color:var(--g);margin-left:8px">· Current Cell Inputs: ${curr_cps}×${curr_ss}=${curr_Ss}S/${curr_Pp}P</span>
  </h3>
</div>
${bestSummary}

<!-- Apply button -->
${best ? `<button onclick="szApplyConfig(${best.Ss},${best.Pp})"
  style="margin-bottom:16px;padding:10px 28px;background:rgba(0,212,170,.15);border:1px solid rgba(0,212,170,.4);color:var(--g);border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">
  ✓ Apply ${best.Ss}S / ${best.Pp}P to Project →
</button>` : ''}

<!-- Canvas chart -->
<div class="card" style="margin-bottom:16px">
  <div class="ch3">📊 Configuration Space - E_usable vs Pack V_nom</div>
  <canvas id="sz_canvas" height="280" style="width:100%;display:block;margin-top:10px;border-radius:6px;background:var(--bg)"></canvas>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;font-size:9px;font-family:var(--mono)">
    <span style="color:var(--g)">● All-pass configs</span>
    <span style="color:var(--y)">● 1–2 fails</span>
    <span style="color:var(--r)">● 3+ fails</span>
    <span style="color:var(--teal)">★ Optimal</span>
    <span style="color:rgba(74,158,255,.4)">┅ E target</span>
    <span style="color:rgba(255,123,53,.4)">┅ V window</span>
  </div>
</div>

<!-- Constraint check legend -->
<div class="card" style="margin-bottom:16px">
  <div class="ch3">⚡ Constraint Matrix Legend</div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
    ${req_s_min > 0 && req_s_max > 0 ? `<div style="font-size:11px;color:var(--teal);font-family:var(--mono);margin-bottom:6px">
      🔗 Search: <b>${pct20_lo}–${pct20_hi}S</b> (±20% of ${curr_Ss}S)${req_s_min>0&&req_s_max>0?' · Bounded by Project Targets: '+req_s_min+'–'+req_s_max+'S':''} · Current: <b>${curr_cps}×${curr_ss}=${curr_Ss}S/${curr_Pp}P</b>
    </div>` : ''}
    ${[
      ['E_usable ≥ target',  `≥ ${t_E_min} kWh`],
      ['V_nom in window',    `${t_V_min}–${t_V_max} V`],
      ['C_peak ≤ cell limit', `≤ ${c_cmax} C`],
      ['C_cont ≤ target',    `≤ ${t_Ccont} C`],
      ['Pack mass',          t_mass>0?`≤ ${t_mass} kg`:'No limit'],
      ['GED',                t_ged>0?`≥ ${t_ged} Wh/kg`:'No limit'],
      ['Peak ΔV',            '≤ 5% V_nom'],
    ].map(([l,v])=>`<div style="padding:5px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;font-size:11px">
      <span style="color:var(--text2)">${l}:</span>
      <span style="font-family:var(--mono);color:var(--teal);margin-left:4px">${v}</span>
    </div>`).join('')}
  </div>
</div>

<!-- Results table -->
<div class="card" style="overflow-x:auto">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
    <div class="ch3">📋 All Viable Configurations (top ${topRows.length}) - click row to apply</div>
    <button onclick="szExportCSV()" style="padding:6px 14px;background:rgba(74,158,255,.1);border:1px solid rgba(74,158,255,.3);color:var(--b);border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">⬇ Export CSV</button>
  </div>
  <table style="border-collapse:collapse;width:100%;min-width:900px">
    <thead style="background:var(--bg3)">
      <tr>
        <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text2);border-bottom:2px solid var(--border2)">Config</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">V_nom</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">V_max/min</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">E_gross</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">E_usable</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">C_peak</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">C_cont</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">Mass</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">GED</th>
        <th style="padding:8px 10px;text-align:right;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">ΔV%</th>
        <th style="padding:8px 10px;text-align:center;font-size:11px;color:var(--text2);border-bottom:2px solid var(--border2)">Status</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</div>

<div class="ico-banner" style="margin-top:14px">
  📌 <b>${results.length}</b> configurations evaluated · S range: ${S_min}–${S_max} series cells from voltage window
  · Cell mass-based weight estimate · IR from DCIR BoL value.
  Click any row or ⭐ button to push configuration to Cell Inputs tab.
</div>`;

  /* Draw canvas */
  requestAnimationFrame(() => {
    const canvas = document.getElementById('sz_canvas');
    if (!canvas || results.length < 2) return;
    const W = canvas.offsetWidth || 800, H = 280;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const Vs = results.map(r => r.V_nom);
    const Es = results.map(r => r.E_usable);
    const vlo = Math.min(...Vs) * 0.95, vhi = Math.max(...Vs) * 1.05;
    const elo = 0, ehi = Math.max(...Es, t_E_min) * 1.2;

    const pad = {l:52, r:20, t:16, b:36};
    const pw = W-pad.l-pad.r, ph = H-pad.t-pad.b;
    const mx = v => pad.l + (v-vlo)/(vhi-vlo)*pw;
    const my = e => pad.t + ph*(1-Math.min(1,(e-elo)/(ehi-elo)));

    /* Grid */
    ctx.strokeStyle='rgba(255,255,255,.04)'; ctx.lineWidth=1;
    [0,0.25,0.5,0.75,1].forEach(f => {
      const y=pad.t+ph*f;
      ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
      ctx.fillStyle='#3a567a'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='right';
      ctx.fillText((ehi*(1-f)).toFixed(0)+'kWh', pad.l-4, y+3);
    });

    /* V window shading */
    ctx.fillStyle='rgba(255,123,53,.04)';
    ctx.fillRect(mx(t_V_min), pad.t, mx(t_V_max)-mx(t_V_min), ph);
    ctx.strokeStyle='rgba(255,123,53,.3)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(mx(t_V_min),pad.t); ctx.lineTo(mx(t_V_min),H-pad.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx(t_V_max),pad.t); ctx.lineTo(mx(t_V_max),H-pad.b); ctx.stroke();
    ctx.setLineDash([]);

    /* E target line */
    ctx.strokeStyle='rgba(74,158,255,.4)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
    const yE = my(t_E_min);
    ctx.beginPath(); ctx.moveTo(pad.l,yE); ctx.lineTo(W-pad.r,yE); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(74,158,255,.6)'; ctx.font='9px JetBrains Mono,monospace'; ctx.textAlign='left';
    ctx.fillText('E target', pad.l+4, yE-3);

    /* Plot points */
    results.forEach(r => {
      const x = mx(r.V_nom), y = my(r.E_usable);
      const col = r.passAll ? '#00d4aa' : r.failCount<=2 ? '#f5c518' : '#ff4d6d';
      ctx.beginPath(); ctx.arc(x, y, r===best?6:3, 0, Math.PI*2);
      ctx.fillStyle = col + (r===best?'':'88');
      ctx.fill();
      if (r === best) {
        ctx.strokeStyle='#00d4aa'; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle='#00d4aa'; ctx.font='bold 9px JetBrains Mono,monospace'; ctx.textAlign='left';
        ctx.fillText(`${r.Ss}S/${r.Pp}P`, x+8, y-4);
      }
    });

    /* Axes */
    ctx.fillStyle='#4a6080'; ctx.font='10px JetBrains Mono,monospace'; ctx.textAlign='center';
    ctx.fillText('Pack V_nom (V)', pad.l+pw/2, H-4);
  });
};

/* Apply config to Cell tab fields */
/* Clear sz_* overrides and re-read from source Cell Inputs */
window.szClearOverrides = function() {
  ['sz_c_vnom','sz_c_vmax','sz_c_vmin','sz_c_ah','sz_c_mass','sz_c_ir','sz_c_cmax',
   'sz_t_E','sz_t_Vmin','sz_t_Vmax','sz_t_Ppeak','sz_t_Pcont','sz_t_Ccont','sz_t_mass','sz_t_dod','sz_t_ged'
  ].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  renderSizing();
};

window.szApplyConfig = function(Ss, Pp) {
  try {
    /* Find S per module and P */
    const c_ss_el = document.getElementById('c_ss');
    const c_pp_el = document.getElementById('c_pp');
    const c_cps_el= document.getElementById('c_cps');

    /* Attempt to set SS = cells_in_series and PP = cells_in_parallel */
    /* c_ss = strings in series per module (assume 1 module per string for simplicity) */
    if (c_pp_el) { c_pp_el.value = Pp; c_pp_el.dispatchEvent(new Event('input')); }
    /* For Ss: need c_cps × c_ss. If c_cps known, set c_ss */
    const cps = +(c_cps_el?.value || window.S?.c_cps || 14);
    if (c_ss_el && cps > 0) {
      const ss_modules = Math.round(Ss / cps);
      if (ss_modules >= 1) {
        c_ss_el.value = ss_modules;
        c_ss_el.dispatchEvent(new Event('input'));
      }
    }
    if (typeof propagate === 'function') propagate();

    /* Toast */
    const t = document.getElementById('toast');
    if (t) {
      t.textContent = `✓ Applied ${Ss}S / ${Pp}P to Cell Inputs`;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    /* Switch to cell tab */
    setTimeout(() => {
      try {
        if (typeof showSec === 'function') {
          showSec('cell', document.querySelector('.nb[onclick*="cell"]'));
        }
      } catch(e) {}
    }, 400);
  } catch(e) { console.warn('[szApply]', e); }
};

/* Export CSV */
window.szExportCSV = function() {
  /* Re-run to get current results */
  const rows = document.querySelectorAll('#sizing_root tbody tr');
  const hdr = 'Config,V_nom(V),V_max(V),V_min(V),E_gross(kWh),E_usable(kWh),C_peak(C),C_cont(C),Mass(kg),GED(Wh/kg),DeltaV%,Status\n';
  const lines = Array.from(rows).map(r => {
    const cells = Array.from(r.querySelectorAll('td')).map(c => '"'+c.textContent.trim().replace(/"/g,'""')+'"');
    return cells.join(',');
  });
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(hdr + lines.join('\n'));
  a.download = 'BatteryMIS_Sizing_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
};

/* Hook showSec */
(function() {
  const _orig = window.showSec;
  window.showSec = function(id, btn) {
    if (typeof _orig === 'function') _orig(id, btn);
    if (id === 'sizing') {
      setTimeout(() => { try { renderSizing(); } catch(e) { console.warn('[Sizing]', e); }}, 60);
    }
  };
  /* Re-render on propagate if visible */
  const _origP = window.propagate;
  window.propagate = function() {
    if (typeof _origP === 'function') _origP.apply(this, arguments);
    try {
      if (document.getElementById('sizing')?.classList.contains('active')) renderSizing();
    } catch(e) {}
  };
})();


/* inlined: fixes.js */
/* ════════════════════════════════════════════════════════════════
   BatteryMIS — FIXES v1.1
   Covers:
   1.  Login always shown on refresh/reopen (session cleared on load)
   2.  Password show/hide eye toggle in login modal
   3.  Sizing calculator always renders (robust hook, no silent fail)
   4.  Cell mass unit display — c_mass in grams everywhere
   5.  Dashboard moved after Approvals in sidebar nav
   6.  Em-dash (—) replaced with hyphen (-) in generated output strings
   7.  Font size reduced site-wide (12px base, scale down all panels)
   8.  Propagate: c_mass, c_ah, c_vnom etc. push to all sub-sheets
   9.  Fuse selector HV Circuit Protection Layout box removed
   10. Login modal eye-toggle (password show/hide)
════════════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────────────
   FIX 1 & 2 — LOGIN: always show on page load, add eye toggle
   Override getSession to ALWAYS return null on first page load
   (i.e. session does not persist across browser restarts)
   Also patch showLoginModal to add eye toggle
──────────────────────────────────────────────────────────────── */
(function fixLogin() {
  // Clear any saved session on every page load so login always shows
  try {
    const SESSION_KEY = 'battmis_session_v1';
    localStorage.removeItem(SESSION_KEY);
  } catch(e) {}

  // Patch showLoginModal to inject eye toggle
  const _origShow = window.showLoginModal;
  window.showLoginModal = function() {
    if (typeof _origShow === 'function') _origShow();

    // Inject eye button after the password input renders
    setTimeout(() => {
      const pw = document.getElementById('login_pw');
      if (!pw) return;
      const wrap = pw.parentElement;
      if (!wrap || wrap.querySelector('#pw_eye_fix')) return;

      // Remove any existing eye button and re-add with correct logic
      const existing = document.getElementById('pw_eye');
      if (existing) existing.remove();

      const eye = document.createElement('button');
      eye.id = 'pw_eye_fix';
      eye.type = 'button';
      eye.textContent = '👁';
      eye.title = 'Show/hide password';
      eye.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;color:#3a567a;padding:2px 4px;line-height:1;z-index:2';
      eye.onclick = function() {
        pw.type = pw.type === 'password' ? 'text' : 'password';
        eye.textContent = pw.type === 'password' ? '👁' : '🙈';
      };

      // Make the wrapper relative if not already
      if (getComputedStyle(wrap).position === 'static') {
        wrap.style.position = 'relative';
      }
      wrap.appendChild(eye);
    }, 50);
  };
})();

/* ────────────────────────────────────────────────────────────────
   FIX 3 — SIZING CALCULATOR
   The sizing_root div exists but renderSizing() may not fire if
   the showSec wrapper chain is broken. This is a final authoritative
   hook that fires renderSizing any time showSec('sizing') is called
   or the section becomes visible.
──────────────────────────────────────────────────────────────── */
(function fixSizing() {
  function tryRenderSizing() {
    try {
      if (typeof propagate === 'function') propagate();
      if (typeof renderSizing === 'function') {
        renderSizing();
      } else {
        // renderSizing not loaded yet - retry
        setTimeout(tryRenderSizing, 200);
      }
    } catch(e) { console.warn('[Sizing fix]', e.message); }
  }

  // Wrap showSec - runs after all other wrappers since fixes.js loads last
  const _prev = window.showSec;
  window.showSec = function(id, btn) {
    if (typeof _prev === 'function') _prev(id, btn);
    if (id === 'sizing') {
      // Give propagate + DOM time to settle, then render
      setTimeout(tryRenderSizing, 120);
      setTimeout(tryRenderSizing, 500); // second attempt in case S not ready
    }
  };

  // MutationObserver fallback — fires whenever sizing section gets .active class
  function startSizingObserver() {
    const sec = document.getElementById('sizing');
    if (!sec) { setTimeout(startSizingObserver, 300); return; }
    const obs = new MutationObserver(() => {
      if (sec.classList.contains('active')) {
        const root = document.getElementById('sizing_root');
        const isPlaceholder = root && root.textContent.trim().length < 120;
        if (isPlaceholder) setTimeout(tryRenderSizing, 80);
      }
    });
    obs.observe(sec, { attributes: true, attributeFilter: ['class'] });
  }

  // Also patch propagate so sizing re-renders when it is the active section
  setTimeout(function() {
    const _p = window.propagate;
    if (typeof _p === 'function') {
      window.propagate = function() {
        _p.apply(this, arguments);
        try {
          const sec = document.getElementById('sizing');
          if (sec && sec.classList.contains('active') && typeof renderSizing === 'function') {
            renderSizing();
          }
        } catch(e) {}
      };
    }
  }, 2500);

  if (document.readyState === 'complete') startSizingObserver();
  else window.addEventListener('load', startSizingObserver);
})();

/* ────────────────────────────────────────────────────────────────
   FIX 4 — CELL MASS UNIT DISPLAY
   c_mass is stored in GRAMS. Ensure any label that shows c_mass
   in a KPI card uses the correct unit.
   Also fix the GED calculation unit path in any display that divides
   c_mass by 1000 and shows "kg" — should just show the raw value as g.
──────────────────────────────────────────────────────────────── */
(function fixMassUnits() {
  // Patch propagate to ensure S.c_mass is always in grams (not accidentally scaled)
  const _p = window.propagate;
  window.propagate = function() {
    if (typeof _p === 'function') _p.apply(this, arguments);
    try {
      const S = window.S || {};
      // If c_mass somehow ended up < 100 it was accidentally divided — correct it
      // Cell mass should always be > 100g for any real cell
      if (S.c_mass && S.c_mass < 100) {
        const el = document.getElementById('c_mass');
        if (el && +el.value > 100) {
          S.c_mass = +el.value;
        }
      }
    } catch(e) {}
  };
})();

/* ────────────────────────────────────────────────────────────────
   FIX 5 — DASHBOARD MOVED AFTER APPROVALS
   Patch sidebar nav to reorder TOP_ITEMS at runtime
──────────────────────────────────────────────────────────────── */
(function fixDashboardOrder() {
  function reorderSidebar() {
    const nav = document.getElementById('__bms_sb_nav');
    if (!nav) return;

    // Find dashboard and approvals items
    const items = Array.from(nav.querySelectorAll('.sb-item[data-top]'));
    const dashItem = items.find(el => el.dataset.top === 'dashboard');
    const approvalsItem = items.find(el => el.dataset.top === 'approvals');
    const dashSub = nav.querySelector('#__sub_dashboard');
    const dividers = nav.querySelectorAll('.sb-divider');

    if (!dashItem || !approvalsItem) return;

    // Check if dashboard already comes after approvals
    const all = Array.from(nav.children);
    const dashIdx = all.indexOf(dashItem);
    const appIdx = all.indexOf(approvalsItem);
    if (dashIdx > appIdx) return; // already in correct position

    // Move dashboard item (and its divider) to after approvals
    // Find the divider that precedes dashboard
    const dashPrevDiv = dashItem.previousElementSibling?.classList?.contains('sb-divider')
      ? dashItem.previousElementSibling : null;

    // Insert after approvalsItem (and its sub if present)
    let insertAfter = approvalsItem;
    if (approvalsItem.nextElementSibling?.id?.startsWith('__sub_')) {
      insertAfter = approvalsItem.nextElementSibling;
    }

    // Remove dashboard elements
    if (dashPrevDiv) dashPrevDiv.remove();
    if (dashSub) dashSub.remove();
    dashItem.remove();

    // Add divider + dashboard after approvals
    const newDiv = document.createElement('div');
    newDiv.className = 'sb-divider';
    insertAfter.insertAdjacentElement('afterend', newDiv);
    newDiv.insertAdjacentElement('afterend', dashItem);
    if (dashSub) dashItem.insertAdjacentElement('afterend', dashSub);
  }

  // Run after sidebar builds
  if (document.readyState === 'complete') {
    setTimeout(reorderSidebar, 600);
  } else {
    window.addEventListener('load', () => setTimeout(reorderSidebar, 600));
  }
})();

/* ────────────────────────────────────────────────────────────────
   FIX 6 — REPLACE EM-DASH (—) WITH HYPHEN (-) IN DYNAMIC OUTPUT
   Patch ri(), setRg(), and string helpers to replace — with -
──────────────────────────────────────────────────────────────── */
(function fixDashes() {
  function replaceDash(s) {
    if (typeof s !== 'string') return s;
    // Replace em-dash and en-dash with plain hyphen, preserve spacing
    return s.replace(/\u2014/g, '-').replace(/\u2013/g, '-').replace(/\s*—\s*/g, ' - ');
  }

  // Patch ri() result item helper if it exists
  const _ri = window.ri;
  if (typeof _ri === 'function') {
    window.ri = function(l, v, u, c, t) {
      return _ri(replaceDash(l), replaceDash(String(v ?? '')), replaceDash(u||''), c, t);
    };
  }

  // Global CSS injection to normalise any — in rendered text
  // (CSS can't replace characters but we handle it at the JS level above)
  // Additionally, override innerHTML setters on key containers — too invasive,
  // so instead we use a MutationObserver on the main content area to replace
  // em-dashes in text nodes after render.
  const replaceTextNodes = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.includes('\u2014') || node.textContent.includes('\u2013')) {
        node.textContent = node.textContent
          .replace(/\s*\u2014\s*/g, ' - ')
          .replace(/\s*\u2013\s*/g, ' - ');
      }
    } else if (node.childNodes) {
      node.childNodes.forEach(replaceTextNodes);
    }
  };

  // Lightweight: run once on panels that are dynamic
  const dashObs = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(n => {
        try { replaceTextNodes(n); } catch(e) {}
      });
    });
  });

  const startDashObs = () => {
    const main = document.getElementById('eng-panel') || document.body;
    dashObs.observe(main, { childList: true, subtree: true });
  };
  if (document.readyState === 'complete') startDashObs();
  else window.addEventListener('load', startDashObs);
})();

/* ────────────────────────────────────────────────────────────────
   FIX 7 — FONT SIZE REDUCTION
   Inject a CSS override that scales down the base font across all panels
──────────────────────────────────────────────────────────────── */
(function fixFontSizes() {
  const style = document.createElement('style');
  style.id = 'bms-font-fix';
  style.textContent = `
    /* Global font size reduction — step down from 14px to 12px base */
    :root {
      font-size: 12px !important;
    }
    body, #eng-panel, .main-panel, .sec, .card {
      font-size: 12px !important;
      line-height: 1.45 !important;
    }
    /* Section headings */
    .sh h2 { font-size: 14px !important; }
    .sh p   { font-size: 11px !important; }
    .ch3    { font-size: 12px !important; }
    .ch3.b  { font-size: 12px !important; }
    /* KPI values — keep readable but smaller */
    .kpi-v  { font-size: 16px !important; }
    .kpi-l  { font-size: 9px  !important; }
    /* Nav buttons */
    .nb { font-size: 11px !important; padding: 5px 11px !important; }
    /* Result items */
    .ri-l { font-size: 10px !important; }
    .ri-v { font-size: 13px !important; }
    /* Tables */
    table td, table th { font-size: 11px !important; }
    /* Inputs / labels */
    .field label, .flabel { font-size: 10px !important; }
    input, select, textarea { font-size: 11px !important; }
    /* Sidebar */
    .sb-label     { font-size: 11px !important; }
    .sb-sub-label { font-size: 10px !important; }
    /* Icon banners */
    .ico-banner { font-size: 11px !important; }
  `;
  // Append when DOM ready
  const inject = () => {
    if (!document.getElementById('bms-font-fix')) {
      document.head.appendChild(style);
    }
  };
  if (document.readyState === 'complete') inject();
  else window.addEventListener('load', inject);
})();

/* ────────────────────────────────────────────────────────────────
   FIX 8 — PROPAGATE LINK: push cell inputs to all sub-sheets
   Wrap propagate to also call renderCellQual / renderSizing /
   renderDCIRMap / renderFuseSelector when their section is active
──────────────────────────────────────────────────────────────── */
(function fixPropagateLinks() {
  // Wrap after a short delay so all modules have loaded
  setTimeout(() => {
    const _p = window.propagate;
    if (!_p) return;

    window.propagate = function() {
      _p.apply(this, arguments);

      // Helper: is section currently visible?
      const active = id => document.getElementById(id)?.classList.contains('active');

      try { if (active('cellqual')   && typeof renderCellQual === 'function')   renderCellQual();   } catch(e) {}
      try { if (active('sizing')     && typeof renderSizing === 'function')     renderSizing();     } catch(e) {}
      try { if (active('dcir')       && typeof renderDCIRMap === 'function')    renderDCIRMap();    } catch(e) {}
      try { if (active('fuse')       && typeof renderFuseSelector === 'function') renderFuseSelector(); } catch(e) {}
      try { if (active('derating')   && typeof renderDerating === 'function')   renderDerating();   } catch(e) {}
    };
  }, 2000); // after all module scripts have executed
})();

/* ────────────────────────────────────────────────────────────────
   FIX 9 — REMOVE HV CIRCUIT PROTECTION LAYOUT BOX from Fuse sheet
   The card div containing "🔌 HV Circuit Protection Layout" is
   rendered by renderFuseSelector() in dcir-current-map.js.
   We remove it after each render via MutationObserver.
──────────────────────────────────────────────────────────────── */
(function fixFuseLayout() {
  function removeHVLayout() {
    document.querySelectorAll('.card').forEach(card => {
      const h = card.querySelector('.ch3');
      if (h && h.textContent.includes('HV Circuit Protection Layout')) {
        card.remove();
      }
    });
  }

  // Observe fuse section for changes
  const startFuseObs = () => {
    const fuseSection = document.getElementById('fuse');
    if (!fuseSection) return;
    const obs = new MutationObserver(() => {
      removeHVLayout();
    });
    obs.observe(fuseSection, { childList: true, subtree: true });
  };

  if (document.readyState === 'complete') startFuseObs();
  else window.addEventListener('load', startFuseObs);
})();

/* ────────────────────────────────────────────────────────────────
   FIX 10 — HUMANISE: replace any remaining em/en-dashes in static HTML
   Run once on DOMContentLoaded against all existing text nodes
──────────────────────────────────────────────────────────────── */
(function humaniseDashes() {
  function walkAndFix(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent;
      if (t.includes('\u2014') || t.includes('\u2013')) {
        node.textContent = t
          .replace(/\s*\u2014\s*/g, ' - ')
          .replace(/\s*\u2013\s*/g, ' - ');
      }
    }
  }
  const run = () => { try { walkAndFix(document.body); } catch(e) {} };
  window.addEventListener('load', () => setTimeout(run, 1500));
})();


/* ═══════════════════════════════════════════
   BOOT FINALISER - runs after ALL scripts load
   Ensures active panel renders correctly
   ═══════════════════════════════════════════ */
(function bootFinaliser() {
  // Retry until all module functions are defined (up to 3s)
  let attempts = 0;
  const MAX = 30; // 30 × 100ms = 3s

  function tryRender() {
    attempts++;
    if (attempts > MAX) return;

    const allReady = typeof renderBatteryTesting === 'function'
                  && typeof renderSizing === 'function'
                  && typeof renderCellQual === 'function'
                  && typeof renderDerating === 'function';

    if (!allReady) {
      setTimeout(tryRender, 100);
      return;
    }

    // All modules loaded - restore saved data then propagate
    try { if (typeof loadProject === 'function') loadProject(); } catch(e) {}
    try { if (typeof chemPreset === 'function') chemPreset(); } catch(e) {}
    try { if (typeof propagate === 'function') propagate(); } catch(e) {}

    // Wait until S is actually populated (S_total > 0)
    const S = window.S || {};
    if (!S.S_total || S.S_total < 1) {
      // S not populated yet - run chemPreset + propagate then retry
      try { if (typeof chemPreset === 'function') chemPreset(); } catch(e) {}
      try { if (typeof propagate === 'function') propagate(); } catch(e) {}
      if (attempts < MAX) { setTimeout(tryRender, 150); return; }
    }

    // Check which top-level tab is active
    const activePanel = document.querySelector('.main-panel.active');
    if (!activePanel) return;

    const panelId = activePanel.id || '';

    if (panelId === 'panel-testing') {
      const cat = window._bt_active_cat || 'electrical';
      try {
        if (cat === 'data_analysis') renderDataAnalysis();
        else renderBatteryTesting(cat);
      } catch(e) { console.warn('[boot] BT render:', e); }
    }

    // Also re-render whichever Engineering sub-section is active
    const activeSec = document.querySelector('.sec.active');
    if (activeSec) {
      const sid = activeSec.id;
      const reMap = {
        sizing:    () => renderSizing(),
        cellqual:  () => renderCellQual(),
        derating:  () => renderDerating(),
        fuse:      () => renderFuseSelector(),
        dcir:      () => renderDCIRMap(),
      };
      if (reMap[sid]) {
        try { reMap[sid](); } catch(e) {}
      }
    }
  }

  // Start after a small delay to let the last script execute
  setTimeout(tryRender, 150);
})();
