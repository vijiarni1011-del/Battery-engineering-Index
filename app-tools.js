/* app-tools.js - Author, Calculator, Upskill */
(function() {
  function initAuthorCanvas() {
    var canvas = document.getElementById('author-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H, nodes, mouse = {x: 0, y: 0};

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function makeNodes() {
      nodes = [];
      var count = 80;
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - .5) * .4,
          vy: (Math.random() - .5) * .4,
          r: Math.random() * 2 + 1,
          pulse: Math.random() * Math.PI * 2,
          type: Math.random() > .7 ? 'teal' : 'dim'
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);

      // Dark gradient bg
      var grad = ctx.createRadialGradient(W*.4, H*.3, 0, W*.4, H*.3, W*.7);
      grad.addColorStop(0, 'rgba(10,30,50,.6)');
      grad.addColorStop(1, 'rgba(5,13,26,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Draw connections
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            var alpha = (1 - dist/120) * .15;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = 'rgba(29,158,117,' + alpha + ')';
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }

      // Mouse connections
      nodes.forEach(function(n) {
        var dx = n.x - mouse.x;
        var dy = n.y - mouse.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = 'rgba(29,158,117,' + ((1-dist/150)*.3) + ')';
          ctx.lineWidth = .8;
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(function(n) {
        n.pulse += .02;
        var glow = Math.sin(n.pulse) * .5 + .5;
        var isTeal = n.type === 'teal';
        var r = n.r + (isTeal ? glow * 1.5 : 0);

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        if (isTeal) {
          var ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r*3);
          ng.addColorStop(0, 'rgba(29,158,117,' + (.6 + glow*.4) + ')');
          ng.addColorStop(1, 'rgba(29,158,117,0)');
          ctx.fillStyle = ng;
        } else {
          ctx.fillStyle = 'rgba(255,255,255,.2)';
        }
        ctx.fill();

        // Move
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      // Floating battery icon
      var bx = W * .72, by = H * .28;
      var bt = t * .0008;
      var boff = Math.sin(bt) * 12;
      drawBattery(ctx, bx, by + boff, 60, bt);

      requestAnimationFrame(draw);
    }

    function drawBattery(ctx, x, y, size, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t*.3) * .05);
      var s = size;
      var alpha = .15 + Math.sin(t*.5) * .05;

      // Body
      ctx.strokeStyle = 'rgba(29,158,117,' + (alpha*4) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-s*.4, -s*.6, s*.8, s*1.2, s*.06);
      ctx.stroke();

      // Cap
      ctx.beginPath();
      ctx.roundRect(-s*.2, -s*.72, s*.4, s*.14, s*.04);
      ctx.stroke();

      // Fill level - animated
      var fillH = s * .9 * (.6 + Math.sin(t*.4) * .2);
      ctx.fillStyle = 'rgba(29,158,117,' + alpha + ')';
      ctx.beginPath();
      ctx.roundRect(-s*.35, -s*.55 + (s*.9 - fillH), s*.7, fillH, s*.04);
      ctx.fill();

      // Bolt
      ctx.strokeStyle = 'rgba(29,158,117,' + (alpha*5) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s*.05, -s*.25);
      ctx.lineTo(-s*.08, s*.05);
      ctx.lineTo(s*.02, s*.05);
      ctx.lineTo(-s*.05, s*.35);
      ctx.stroke();

      ctx.restore();
    }

    canvas.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('resize', function() { resize(); makeNodes(); });

    resize();
    makeNodes();
    requestAnimationFrame(draw);
  }

  // Init when panel becomes active
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.target.id === 'panel-author' && m.target.classList.contains('active')) {
        initAuthorCanvas();
        observer.disconnect();
      }
    });
  });
  var panel = document.getElementById('panel-author');
  if (panel) observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
  if (panel && panel.classList.contains('active')) initAuthorCanvas();
})();


/* ═══════════════════════════════════════════════════════════
   BatteryMIS — CALCULATOR PANEL  v1.0
   10 groups, 50+ calculators, all with real engineering math
   ═══════════════════════════════════════════════════════════ */

window.CALC_GROUPS = [
  { id:'hv',      label:'HV Safety',              icon:'⚡' },
  { id:'lv',      label:'LV System',               icon:'🔋' },
  { id:'thermal', label:'Thermal / Cooling',        icon:'🌡️' },
  { id:'perf',    label:'Performance',              icon:'🚀' },
  { id:'bms',     label:'BMS Testing',              icon:'🧠' },
  { id:'env',     label:'Environmental',            icon:'🌍' },
  { id:'life',    label:'Lifecycle / Aging',        icon:'📈' },
  { id:'abuse',   label:'Abuse',                    icon:'💥' },
  { id:'mech',    label:'Mechanical',               icon:'🔩' },
  { id:'emi',     label:'EMI / EMC',                icon:'📡' },
];

window.CALCS = {

/* ═══ 1. HV SAFETY ═══ */
hv: [
  {
    id:'precharge', title:'Pre-charge Resistor',
    formula:'R = V_bat / (I_limit × (1 − e^(−t/τ)))\nτ = R × C_load',
    inputs:[
      {id:'pc_vbat', label:'Battery Voltage (V)', unit:'V', def:400},
      {id:'pc_cload', label:'Load Capacitance (mF)', unit:'mF', def:2},
      {id:'pc_ilim', label:'Max Inrush Current (A)', unit:'A', def:10},
      {id:'pc_pct', label:'Target Charge (%)', unit:'%', def:95},
    ],
    calc: function(v) {
      var Vb=v.pc_vbat, C=v.pc_cload/1000, I=v.pc_ilim, pct=v.pc_pct/100;
      var tau = -Math.log(1-pct) * (1/1);
      var R = Vb / I;
      var tauRC = R * C;
      var t95 = -tauRC * Math.log(1-pct);
      var Ppeak = (Vb*Vb) / R;
      var E = 0.5 * C * Vb * Vb;
      return [
        {l:'Resistance R', v: R.toFixed(1), u:'Ω', ok: R>0},
        {l:'Time Constant τ', v: (tauRC*1000).toFixed(1), u:'ms'},
        {l:'Charge to '+Math.round(pct*100)+'%', v: (t95*1000).toFixed(0), u:'ms'},
        {l:'Peak Power', v: Ppeak.toFixed(0), u:'W', ok: Ppeak<5000},
        {l:'Capacitor Energy', v: (E*1000).toFixed(1), u:'mJ'},
      ];
    }
  },
  {
    id:'isolation', title:'Isolation Resistance Check',
    formula:'R_iso = V_bat / I_leak\nI_leak = V_bat / R_iso\nShock voltage = V_bat × R_body / (R_body + R_iso)',
    inputs:[
      {id:'iso_vbat', label:'System Voltage (V)', unit:'V', def:400},
      {id:'iso_riso', label:'Isolation Resistance (MΩ)', unit:'MΩ', def:100},
      {id:'iso_rbody', label:'Body Resistance (kΩ)', unit:'kΩ', def:1},
    ],
    calc: function(v) {
      var Vb=v.iso_vbat, Riso=v.iso_riso*1e6, Rb=v.iso_rbody*1e3;
      var Ileak = Vb / Riso * 1e6; // µA
      var Vshock = Vb * Rb / (Rb + Riso);
      var safe = Riso >= 100e3 && Vshock < 60;
      return [
        {l:'Leakage Current', v: Ileak.toFixed(2), u:'µA', ok: Ileak<10},
        {l:'Shock Voltage', v: Vshock.toFixed(1), u:'V', ok: Vshock<60},
        {l:'Safety Status', v: safe ? 'PASS - Safe' : 'FAIL - Hazardous', u:'', ok: safe},
        {l:'Min Required R_iso', v: (Vb*500/1e6).toFixed(0), u:'MΩ (500Ω/V rule)'},
      ];
    }
  },
  {
    id:'arcflash', title:'HV Arc Flash Energy',
    formula:'E = 0.0093 × F × V² × t\n(IEEE 1584 simplified)\nArc current Ia = 0.85 × Ibf',
    inputs:[
      {id:'af_vbat', label:'System Voltage (kV)', unit:'kV', def:0.4},
      {id:'af_ibf', label:'Bolted Fault Current (kA)', unit:'kA', def:5},
      {id:'af_t', label:'Arc Duration (s)', unit:'s', def:0.2},
      {id:'af_d', label:'Working Distance (mm)', unit:'mm', def:450},
    ],
    calc: function(v) {
      var V=v.af_vbat, Ibf=v.af_ibf, t=v.af_t, d=v.af_d;
      var Ia = 0.85 * Ibf;
      var E = 0.0093 * (Ibf*Ibf) * (V*V) * t * 1000;
      var Enorm = E * Math.pow(610/d, 2);
      var ppe = Enorm < 4 ? 'PPE Cat 1 (4 cal/cm²)' : Enorm < 8 ? 'PPE Cat 2 (8 cal/cm²)' : Enorm < 25 ? 'PPE Cat 3 (25 cal/cm²)' : 'PPE Cat 4 (40 cal/cm²)';
      return [
        {l:'Arc Current', v: Ia.toFixed(2), u:'kA'},
        {l:'Incident Energy (at 610mm)', v: Enorm.toFixed(2), u:'cal/cm²', ok: Enorm<8},
        {l:'Required PPE', v: ppe, u:''},
        {l:'Arc Flash Boundary', v: Math.sqrt(E*1000/1.2).toFixed(0), u:'mm'},
      ];
    }
  },
  {
    id:'hvil', title:'HVIL Circuit Current',
    formula:'I_hvil = V_supply / (R_pull + R_sense)\nDetect time = C_line / (I_hvil × duty)',
    inputs:[
      {id:'hvil_vsup', label:'Supply Voltage (V)', unit:'V', def:12},
      {id:'hvil_rpull', label:'Pull-up Resistor (kΩ)', unit:'kΩ', def:10},
      {id:'hvil_rsense', label:'Sense Resistor (kΩ)', unit:'kΩ', def:1},
      {id:'hvil_cline', label:'Line Capacitance (nF)', unit:'nF', def:100},
    ],
    calc: function(v) {
      var Vs=v.hvil_vsup, Rp=v.hvil_rpull*1e3, Rs=v.hvil_rsense*1e3, C=v.hvil_cline*1e-9;
      var I = Vs / (Rp + Rs) * 1e3; // mA
      var Vsense = Vs * Rs / (Rp + Rs);
      var tau = (Rp + Rs) * C * 1e6; // µs
      return [
        {l:'HVIL Current', v: I.toFixed(2), u:'mA', ok: I>1},
        {l:'Sense Voltage', v: Vsense.toFixed(2), u:'V'},
        {l:'RC Time Constant', v: tau.toFixed(1), u:'µs'},
        {l:'Open-circuit Voltage', v: Vs.toFixed(1), u:'V'},
      ];
    }
  },
  {
    id:'creepage', title:'Creepage & Clearance',
    formula:'Clearance = f(V_peak, pollution, altitude)\nCreepage = V_rms / CTI_material × safety_factor',
    inputs:[
      {id:'cr_vrms', label:'Working Voltage RMS (V)', unit:'V', def:400},
      {id:'cr_poll', label:'Pollution Degree (1-3)', unit:'', def:2},
      {id:'cr_cti', label:'CTI of Material (175/250/400/600)', unit:'', def:250},
      {id:'cr_alt', label:'Altitude (m)', unit:'m', def:2000},
    ],
    calc: function(v) {
      var Vrms=v.cr_vrms, poll=v.cr_poll, cti=v.cr_cti, alt=v.cr_alt;
      var Vpeak = Vrms * Math.sqrt(2);
      // Clearance per IEC 60664-1 (simplified)
      var baseClr = Vpeak < 150 ? 0.5 : Vpeak < 300 ? 1.5 : Vpeak < 600 ? 3 : 5.5;
      var pollFactor = poll === 1 ? 1 : poll === 2 ? 1.3 : 1.6;
      var altFactor = alt > 5000 ? 1.48 : alt > 3000 ? 1.29 : alt > 2000 ? 1.14 : 1.0;
      var clearance = baseClr * pollFactor * altFactor;
      // Creepage per IEC 60664 (simplified)
      var ctiGroup = cti >= 600 ? 1 : cti >= 400 ? 2 : cti >= 175 ? 3 : 3;
      var creepBase = Vrms < 150 ? 1.6 : Vrms < 300 ? 3.2 : Vrms < 600 ? 6.3 : 12.5;
      var creepFactor = ctiGroup === 1 ? 1.0 : ctiGroup === 2 ? 1.25 : 1.6;
      var creepage = creepBase * pollFactor * creepFactor;
      return [
        {l:'Required Clearance', v: clearance.toFixed(2), u:'mm'},
        {l:'Required Creepage', v: creepage.toFixed(2), u:'mm'},
        {l:'Peak Voltage', v: Vpeak.toFixed(0), u:'V'},
        {l:'CTI Group', v: 'Group '+ctiGroup, u:''},
      ];
    }
  },
],

/* ═══ 2. LV SYSTEM ═══ */
lv: [
  {
    id:'lvpower', title:'LV Power Budget',
    formula:'P_total = Σ(I_i × V_lv)\nI_total = P_total / V_lv\nRuntime = C_bat / I_total',
    inputs:[
      {id:'lv_vlv', label:'LV Bus Voltage (V)', unit:'V', def:12},
      {id:'lv_ibms', label:'BMS Current (mA)', unit:'mA', def:150},
      {id:'lv_icon', label:'Contactors (mA each × count)', unit:'mA', def:200},
      {id:'lv_icon_n', label:'Contactor Count', unit:'', def:3},
      {id:'lv_ican', label:'CAN/Comms (mA)', unit:'mA', def:80},
      {id:'lv_iaux', label:'Aux/Sensors (mA)', unit:'mA', def:120},
      {id:'lv_cbat', label:'LV Battery Capacity (Ah)', unit:'Ah', def:20},
    ],
    calc: function(v) {
      var Vlv=v.lv_vlv;
      var Itotal = v.lv_ibms + v.lv_icon*v.lv_icon_n + v.lv_ican + v.lv_iaux;
      var Ptotal = Itotal * Vlv / 1000;
      var runtime = v.lv_cbat * 1000 / Itotal;
      return [
        {l:'Total LV Current', v: Itotal.toFixed(0), u:'mA'},
        {l:'Total LV Power', v: Ptotal.toFixed(2), u:'W'},
        {l:'Quiescent Runtime', v: runtime.toFixed(1), u:'hrs (LV batt)'},
        {l:'Contactor Power', v: (v.lv_icon*v.lv_icon_n*Vlv/1000).toFixed(2), u:'W'},
      ];
    }
  },
  {
    id:'lvfuse', title:'LV Fuse Sizing',
    formula:'I_fuse = I_load × 1.25 (125% derating)\nVoltage drop = I × R_wire\nR_wire = ρ×L / A',
    inputs:[
      {id:'lvf_iload', label:'Max Load Current (A)', unit:'A', def:20},
      {id:'lvf_len', label:'Wire Length (m, one-way)', unit:'m', def:2},
      {id:'lvf_awg', label:'Wire Area (mm²)', unit:'mm²', def:2.5},
      {id:'lvf_vlv', label:'LV Voltage (V)', unit:'V', def:12},
    ],
    calc: function(v) {
      var Il=v.lvf_iload, L=v.lvf_len*2, A=v.lvf_awg, Vlv=v.lvf_vlv;
      var rho = 1.72e-8; // copper
      var Rwire = rho * L / (A*1e-6) * 1000; // mΩ
      var Vdrop = Il * Rwire / 1000;
      var Vdrop_pct = Vdrop / Vlv * 100;
      var Ifuse = Il * 1.25;
      var std_fuses = [5,7.5,10,15,20,25,30,40,50];
      var fuse = std_fuses.find(function(f){ return f >= Ifuse; }) || Ifuse*1.25;
      return [
        {l:'Recommended Fuse', v: fuse.toFixed(0), u:'A', ok: true},
        {l:'Wire Resistance', v: Rwire.toFixed(1), u:'mΩ (both ways)'},
        {l:'Voltage Drop', v: Vdrop.toFixed(2), u:'V ('+Vdrop_pct.toFixed(1)+'%)'},
        {l:'Wire Power Loss', v: (Il*Il*Rwire/1000).toFixed(2), u:'W'},
      ];
    }
  },
  {
    id:'canload', title:'CAN Bus Load',
    formula:'Bus load = (n_msgs × bit_length) / baudrate × 100%\nMax recommended: < 30%',
    inputs:[
      {id:'can_baud', label:'Baudrate (kbps)', unit:'kbps', def:500},
      {id:'can_n', label:'Number of Messages', unit:'', def:20},
      {id:'can_cycle', label:'Avg Cycle Time (ms)', unit:'ms', def:10},
      {id:'can_bits', label:'Bits per Frame (avg)', unit:'bits', def:108},
    ],
    calc: function(v) {
      var baud=v.can_baud*1000, n=v.can_n, cycle=v.can_cycle/1000, bits=v.can_bits;
      var load = (n * bits / cycle) / baud * 100;
      var latency = bits / baud * 1e6;
      return [
        {l:'Bus Load', v: load.toFixed(1), u:'%', ok: load<30},
        {l:'Frame Latency', v: latency.toFixed(0), u:'µs/frame'},
        {l:'Messages/sec', v: (n/cycle).toFixed(0), u:'msg/s'},
        {l:'Status', v: load<30 ? 'OK' : load<60 ? 'High Load' : 'Overloaded', u:'', ok: load<30},
      ];
    }
  },
  {
    id:'lv12v', title:'12V Battery Sizing',
    formula:'C_12v = (I_sleep × t_park + I_awake × t_awake) / DoD\nAccount for temperature derating',
    inputs:[
      {id:'v12_isleep', label:'Sleep Current (mA)', unit:'mA', def:15},
      {id:'v12_tpark', label:'Max Park Time (days)', unit:'days', def:30},
      {id:'v12_iawake', label:'Awake Current (A)', unit:'A', def:5},
      {id:'v12_tawake', label:'Awake Time/Day (min)', unit:'min', def:60},
      {id:'v12_dod', label:'Usable DoD (%)', unit:'%', def:60},
      {id:'v12_temp', label:'Min Temperature (°C)', unit:'°C', def:-10},
    ],
    calc: function(v) {
      var Isleep=v.v12_isleep/1000, tpark=v.v12_tpark*24,
          Iawake=v.v12_iawake, tawake=v.v12_tawake/60,
          dod=v.v12_dod/100, Tmin=v.v12_temp;
      var Ah_sleep = Isleep * tpark;
      var Ah_awake = Iawake * tawake * v.v12_tpark;
      var Ah_total = (Ah_sleep + Ah_awake) / dod;
      var tempFactor = Tmin < -10 ? 0.65 : Tmin < 0 ? 0.75 : Tmin < 10 ? 0.85 : 1.0;
      var Ah_sized = Ah_total / tempFactor;
      return [
        {l:'Sleep Discharge', v: Ah_sleep.toFixed(1), u:'Ah'},
        {l:'Awake Discharge', v: Ah_awake.toFixed(1), u:'Ah'},
        {l:'Min Battery Size', v: Ah_sized.toFixed(0), u:'Ah (with temp)', ok: true},
        {l:'Temp Derating', v: (tempFactor*100).toFixed(0), u:'% at '+Tmin+'°C'},
      ];
    }
  },
],

/* ═══ 3. THERMAL / COOLING ═══ */
thermal: [
  {
    id:'heatgen', title:'Cell Heat Generation',
    formula:'Q = I²×R + T×(dU/dT)×I\nJoule: I²R\nEntropic: T×dU/dT×I (cooling for LFP)',
    inputs:[
      {id:'th_I', label:'Current (A)', unit:'A', def:200},
      {id:'th_r', label:'Cell DC Resistance (mΩ)', unit:'mΩ', def:0.22},
      {id:'th_ss', label:'Series × Parallel (S×P)', unit:'', def:'128×1'},
      {id:'th_T', label:'Cell Temperature (°C)', unit:'°C', def:25},
      {id:'th_dudt', label:'dU/dT (mV/K, LFP≈-0.3)', unit:'mV/K', def:-0.3},
    ],
    calc: function(v) {
      var I=v.th_I, Rcell=v.th_r/1000, T=v.th_T+273.15, dudt=v.th_dudt/1000;
      var parts = (v.th_ss||'128×1').split(/[×x\*]/);
      var S=+(parts[0]||128), P=+(parts[1]||1);
      var Rpack = Rcell * S / P;
      var Qjoule = I*I * Rpack;
      var Qentropic = T * dudt * I;
      var Qtotal = Qjoule + Qentropic;
      var Qcell = Qtotal / (S*P);
      return [
        {l:'Joule Heat', v: Qjoule.toFixed(1), u:'W'},
        {l:'Entropic Heat', v: Qentropic.toFixed(1), u:'W (neg=cooling)'},
        {l:'Total Pack Heat', v: Qtotal.toFixed(1), u:'W', ok: Qtotal<2000},
        {l:'Heat per Cell', v: (Qcell*1000).toFixed(1), u:'mW/cell'},
        {l:'Pack Resistance', v: (Rpack*1000).toFixed(1), u:'mΩ'},
      ];
    }
  },
  {
    id:'coolant', title:'Coolant Flow Rate',
    formula:'ṁ = Q / (Cp × ΔT)\nQ_req = I²R + aux_loads\nΔP = f × (L/D) × ρv²/2',
    inputs:[
      {id:'cf_Q', label:'Heat Load (W)', unit:'W', def:800},
      {id:'cf_dt', label:'Max ΔT coolant (°C)', unit:'°C', def:5},
      {id:'cf_cp', label:'Coolant Cp (J/kg·K, water=4186)', unit:'J/kg·K', def:3600},
      {id:'cf_rho', label:'Coolant Density (kg/L)', unit:'kg/L', def:1.05},
    ],
    calc: function(v) {
      var Q=v.cf_Q, dT=v.cf_dt, Cp=v.cf_cp, rho=v.cf_rho;
      var mdot = Q / (Cp * dT); // kg/s
      var Ldot = mdot / rho * 60; // L/min
      return [
        {l:'Mass Flow Rate', v: (mdot*1000).toFixed(1), u:'g/s'},
        {l:'Volume Flow Rate', v: Ldot.toFixed(2), u:'L/min', ok: Ldot<10},
        {l:'Flow Rate', v: (Ldot*1000/60).toFixed(1), u:'mL/s'},
        {l:'Pump Power (est.)', v: (Ldot/60*rho*1000*0.3/1000).toFixed(2), u:'W (ΔP=0.3 bar)'},
      ];
    }
  },
  {
    id:'thermalres', title:'Thermal Resistance Network',
    formula:'R_th = ΔT / Q\nT_cell = T_coolant + Q×(R_cell2fluid + R_contact + R_plate)',
    inputs:[
      {id:'tr_Q', label:'Heat per Cell (W)', unit:'W', def:0.5},
      {id:'tr_rcell', label:'Cell thermal R (K/W)', unit:'K/W', def:3.0},
      {id:'tr_rtim', label:'TIM R (K/W)', unit:'K/W', def:0.5},
      {id:'tr_rplate', label:'Cooling Plate R (K/W)', unit:'K/W', def:0.2},
      {id:'tr_Tcoolant', label:'Coolant Inlet T (°C)', unit:'°C', def:25},
    ],
    calc: function(v) {
      var Q=v.tr_Q, Rcell=v.tr_rcell, Rtim=v.tr_rtim, Rpl=v.tr_rplate, Tc=v.tr_Tcoolant;
      var Rtotal = Rcell + Rtim + Rpl;
      var Tcell = Tc + Q * Rtotal;
      var dTtim = Q * Rtim;
      return [
        {l:'Total R_th', v: Rtotal.toFixed(2), u:'K/W'},
        {l:'Cell Surface Temp', v: Tcell.toFixed(1), u:'°C', ok: Tcell<55},
        {l:'ΔT across TIM', v: dTtim.toFixed(2), u:'°C'},
        {l:'ΔT cell-to-coolant', v: (Q*Rtotal).toFixed(2), u:'K'},
      ];
    }
  },
  {
    id:'preheat', title:'Preheating Power & Time',
    formula:'E_heat = m×Cp×ΔT\nP_heater = E_heat / t_target\nt = m×Cp×ΔT / P',
    inputs:[
      {id:'ph_mass', label:'Pack Mass (kg)', unit:'kg', def:250},
      {id:'ph_Tstart', label:'Start Temperature (°C)', unit:'°C', def:-20},
      {id:'ph_Ttarget', label:'Target Temperature (°C)', unit:'°C', def:10},
      {id:'ph_Pheater', label:'Heater Power (W)', unit:'W', def:2000},
      {id:'ph_cp', label:'Pack Avg Cp (J/kg·K)', unit:'J/kg·K', def:900},
    ],
    calc: function(v) {
      var m=v.ph_mass, Ts=v.ph_Tstart, Tt=v.ph_Ttarget, P=v.ph_Pheater, Cp=v.ph_cp;
      var dT = Tt - Ts;
      var E = m * Cp * dT; // J
      var t = E / P / 60; // min
      var Eah = E / 3600 / 1000; // kWh
      return [
        {l:'Energy Required', v: (E/1000).toFixed(2), u:'kJ ('+Eah.toFixed(3)+' kWh)'},
        {l:'Heat-up Time', v: t.toFixed(1), u:'min at '+P+'W', ok: t<60},
        {l:'Heater Current @12V', v: (P/12).toFixed(1), u:'A'},
        {l:'Heater Current @48V', v: (P/48).toFixed(1), u:'A'},
      ];
    }
  },
  {
    id:'nonuniform', title:'Pack ΔT Non-Uniformity',
    formula:'ΔT_pack = T_hotcell - T_coldcell\nSoC error from ΔT = ΔT × (dSoC/dT)\nRecommended: ΔT < 5°C',
    inputs:[
      {id:'nu_Thot', label:'Hottest Cell Temp (°C)', unit:'°C', def:35},
      {id:'nu_Tcold', label:'Coldest Cell Temp (°C)', unit:'°C', def:28},
      {id:'nu_Vslope', label:'dV/dT Cell (mV/°C)', unit:'mV/°C', def:0.3},
      {id:'nu_Vnom', label:'Cell Nominal Voltage (V)', unit:'V', def:3.2},
    ],
    calc: function(v) {
      var Th=v.nu_Thot, Tc=v.nu_Tcold, dVdT=v.nu_Vslope/1000, Vnom=v.nu_Vnom;
      var dT = Th - Tc;
      var dV = dT * dVdT;
      var socErr = dV / Vnom * 100;
      return [
        {l:'Pack ΔT', v: dT.toFixed(1), u:'°C', ok: dT<5},
        {l:'Voltage Spread from ΔT', v: (dV*1000).toFixed(1), u:'mV'},
        {l:'SoC Error', v: socErr.toFixed(2), u:'%'},
        {l:'Status', v: dT<5 ? 'Acceptable' : dT<10 ? 'Monitor' : 'Action Required', u:'', ok: dT<5},
      ];
    }
  },
],

/* ═══ 4. PERFORMANCE ═══ */
perf: [
  {
    id:'crate', title:'C-Rate Calculator',
    formula:'C-Rate = I / C_capacity\nI = C_rate × C_ah\nTime = 1 / C_rate × 60 min',
    inputs:[
      {id:'cr_ah', label:'Cell Capacity (Ah)', unit:'Ah', def:120},
      {id:'cr_I', label:'Current (A)', unit:'A', def:240},
      {id:'cr_S', label:'Series (S)', unit:'', def:128},
      {id:'cr_P', label:'Parallel (P)', unit:'', def:1},
    ],
    calc: function(v) {
      var Ah=v.cr_ah, I=v.cr_I, S=v.cr_S, P=v.cr_P;
      var Qpack = Ah * P;
      var Crate = I / Qpack;
      var t_hr = 1 / Crate;
      var Vnom_pack = 3.2 * S;
      var P_kW = I * Vnom_pack / 1000;
      var eta = 1 - 0.03 * Crate;
      return [
        {l:'C-Rate', v: Crate.toFixed(2), u:'C', ok: Crate<=3},
        {l:'Discharge Time', v: (t_hr*60).toFixed(0), u:'min'},
        {l:'Pack Power', v: P_kW.toFixed(1), u:'kW'},
        {l:'Est. Round-trip η', v: (eta*100).toFixed(1), u:'%'},
      ];
    }
  },
  {
    id:'energy', title:'Pack Energy & Range',
    formula:'E_pack = S × P × C_ah × V_nom / 1000\nRange = E_usable / consumption\nE_usable = E × DoD × η',
    inputs:[
      {id:'pe_S', label:'Series (S)', unit:'', def:128},
      {id:'pe_P', label:'Parallel (P)', unit:'', def:1},
      {id:'pe_ah', label:'Cell Capacity (Ah)', unit:'Ah', def:120},
      {id:'pe_vnom', label:'Cell V_nom (V)', unit:'V', def:3.2},
      {id:'pe_dod', label:'DoD (%)', unit:'%', def:90},
      {id:'pe_cons', label:'Consumption (Wh/km)', unit:'Wh/km', def:120},
    ],
    calc: function(v) {
      var S=v.pe_S, P=v.pe_P, Ah=v.pe_ah, Vnom=v.pe_vnom, dod=v.pe_dod/100, cons=v.pe_cons;
      var Egross = S * P * Ah * Vnom / 1000;
      var Eusable = Egross * dod * 0.97;
      var range = Eusable * 1000 / cons;
      var GED = Egross * 1000 / (S*P*0.3 + 50); // rough
      return [
        {l:'Gross Energy', v: Egross.toFixed(2), u:'kWh'},
        {l:'Usable Energy', v: Eusable.toFixed(2), u:'kWh'},
        {l:'Est. Range', v: range.toFixed(0), u:'km', ok: range>100},
        {l:'Pack Voltage (nom)', v: (S*Vnom).toFixed(1), u:'V'},
      ];
    }
  },
  {
    id:'power', title:'Power & Current Limits',
    formula:'P_cont = V_nom × I_cont\nP_peak = V_nom × I_peak\nI_max = P_target / V_min_sys',
    inputs:[
      {id:'pw_Vnom', label:'Pack V_nom (V)', unit:'V', def:409.6},
      {id:'pw_Vmin', label:'Pack V_min (V)', unit:'V', def:280},
      {id:'pw_Icont', label:'Cont. Current (A)', unit:'A', def:150},
      {id:'pw_Ipeak', label:'Peak Current (A)', unit:'A', def:250},
      {id:'pw_Ptarget', label:'Target Power (kW)', unit:'kW', def:80},
    ],
    calc: function(v) {
      var Vn=v.pw_Vnom, Vm=v.pw_Vmin, Ic=v.pw_Icont, Ip=v.pw_Ipeak, Pt=v.pw_Ptarget;
      var Pcont = Vn * Ic / 1000;
      var Ppeak = Vn * Ip / 1000;
      var Ireq = Pt*1000 / Vm;
      return [
        {l:'Continuous Power', v: Pcont.toFixed(1), u:'kW'},
        {l:'Peak Power', v: Ppeak.toFixed(1), u:'kW', ok: Ppeak>=Pt},
        {l:'I_req for target', v: Ireq.toFixed(0), u:'A at V_min'},
        {l:'Current Headroom', v: ((Ip-Ireq)/Ip*100).toFixed(1), u:'%', ok: Ip>=Ireq},
      ];
    }
  },
  {
    id:'sxp', title:'S×P Configuration Optimizer',
    formula:'Ss = V_nom_target / V_cell_nom\nPp = E_target / (Ss × V_cell × C_ah / 1000)\nMass = Ss × Pp × m_cell',
    inputs:[
      {id:'sp_Vtarget', label:'Target V_nom (V)', unit:'V', def:380},
      {id:'sp_Etarget', label:'Target Energy (kWh)', unit:'kWh', def:40},
      {id:'sp_Vcell', label:'Cell V_nom (V)', unit:'V', def:3.2},
      {id:'sp_Ah', label:'Cell Capacity (Ah)', unit:'Ah', def:120},
      {id:'sp_mass', label:'Cell Mass (g)', unit:'g', def:2800},
    ],
    calc: function(v) {
      var Vt=v.sp_Vtarget, Et=v.sp_Etarget, Vc=v.sp_Vcell, Ah=v.sp_Ah, m=v.sp_mass;
      var S = Math.round(Vt / Vc);
      var Vnom = S * Vc;
      var P = Math.ceil(Et / (Vnom * Ah / 1000));
      var E = S * P * Ah * Vc / 1000;
      var mass = S * P * m / 1e6; // tonnes? no, kg
      var massKg = S * P * m / 1000;
      return [
        {l:'Series (S)', v: S, u:'cells', ok: true},
        {l:'Parallel (P)', v: P, u:'strings'},
        {l:'Pack V_nom', v: Vnom.toFixed(1), u:'V'},
        {l:'Pack Energy', v: E.toFixed(2), u:'kWh', ok: E>=Et},
        {l:'Cell Count', v: S*P, u:'cells'},
        {l:'Est. Cell Mass', v: massKg.toFixed(1), u:'kg'},
      ];
    }
  },
  {
    id:'irdrop', title:'IR Voltage Drop',
    formula:'V_drop = I × R_pack\nR_pack = R_cell × S / P\nV_at_peak = V_nom - V_drop',
    inputs:[
      {id:'ir_Rcell', label:'Cell IR @ SoC (mΩ)', unit:'mΩ', def:0.22},
      {id:'ir_S', label:'Series (S)', unit:'', def:128},
      {id:'ir_P', label:'Parallel (P)', unit:'', def:1},
      {id:'ir_I', label:'Peak Current (A)', unit:'A', def:250},
      {id:'ir_Vnom', label:'Pack V_nom (V)', unit:'V', def:409.6},
    ],
    calc: function(v) {
      var Rc=v.ir_Rcell/1000, S=v.ir_S, P=v.ir_P, I=v.ir_I, Vn=v.ir_Vnom;
      var Rpack = Rc * S / P;
      var Vdrop = I * Rpack;
      var Vpeak = Vn - Vdrop;
      var pct = Vdrop / Vn * 100;
      return [
        {l:'Pack IR', v: (Rpack*1000).toFixed(2), u:'mΩ'},
        {l:'Voltage Drop', v: Vdrop.toFixed(1), u:'V ('+pct.toFixed(1)+'%)', ok: pct<5},
        {l:'Voltage at Peak I', v: Vpeak.toFixed(1), u:'V'},
        {l:'Power Lost to IR', v: (I*I*Rpack/1000).toFixed(2), u:'kW'},
      ];
    }
  },
],

/* ═══ 5. BMS TESTING ═══ */
bms: [
  {
    id:'ovp', title:'OVP / UVP Threshold',
    formula:'OVP_pack = S × V_cell_max\nUVP_pack = S × V_cell_min\nHysteresis = threshold × factor',
    inputs:[
      {id:'ovp_S', label:'Series (S)', unit:'', def:128},
      {id:'ovp_Vmax', label:'Cell V_max (V)', unit:'V', def:3.65},
      {id:'ovp_Vmin', label:'Cell V_min (V)', unit:'V', def:2.5},
      {id:'ovp_hyst', label:'Hysteresis (%)', unit:'%', def:1.5},
      {id:'ovp_delay', label:'Trip Delay (ms)', unit:'ms', def:500},
    ],
    calc: function(v) {
      var S=v.ovp_S, Vmax=v.ovp_Vmax, Vmin=v.ovp_Vmin, h=v.ovp_hyst/100;
      var OVP = S * Vmax;
      var UVP = S * Vmin;
      var OVP_reset = OVP * (1 - h);
      var UVP_reset = UVP * (1 + h);
      return [
        {l:'OVP Trip (pack)', v: OVP.toFixed(1), u:'V'},
        {l:'OVP Reset', v: OVP_reset.toFixed(1), u:'V'},
        {l:'UVP Trip (pack)', v: UVP.toFixed(1), u:'V'},
        {l:'UVP Reset', v: UVP_reset.toFixed(1), u:'V'},
        {l:'Voltage Window', v: (OVP-UVP).toFixed(1), u:'V'},
      ];
    }
  },
  {
    id:'baltime', title:'Cell Balancing Time',
    formula:'t_bal = ΔQ / I_bal\nΔQ = C_ah × ΔSoC\nEnergy wasted = I_bal² × R_bal × t_bal',
    inputs:[
      {id:'bal_ah', label:'Cell Capacity (Ah)', unit:'Ah', def:120},
      {id:'bal_dsoc', label:'Max SoC Imbalance (%)', unit:'%', def:5},
      {id:'bal_Ibal', label:'Balancing Current (mA)', unit:'mA', def:100},
      {id:'bal_Rbal', label:'Balancing Resistor (Ω)', unit:'Ω', def:120},
    ],
    calc: function(v) {
      var Ah=v.bal_ah, dSoC=v.bal_dsoc/100, Ibal=v.bal_Ibal/1000, Rbal=v.bal_Rbal;
      var dQ = Ah * dSoC;
      var t = dQ / Ibal / 3600; // hours
      var Pbal = Ibal*Ibal * Rbal;
      var Ewaste = Pbal * t; // Wh
      return [
        {l:'Balancing Time', v: t.toFixed(1), u:'hours', ok: t<24},
        {l:'Charge to Remove', v: (dQ*1000).toFixed(0), u:'mAh'},
        {l:'Balance Heat', v: (Pbal*1000).toFixed(1), u:'mW'},
        {l:'Energy Wasted', v: Ewaste.toFixed(3), u:'Wh'},
      ];
    }
  },
  {
    id:'socer', title:'SoC Coulomb Counting Error',
    formula:'ΔSoC = ΔI × t / C_ah\nAccumulated error over drive cycle\nCurrent sensor drift = I_offset × t',
    inputs:[
      {id:'soc_ah', label:'Pack Capacity (Ah)', unit:'Ah', def:120},
      {id:'soc_Ioff', label:'Current Sensor Offset (mA)', unit:'mA', def:50},
      {id:'soc_t', label:'Integration Time (h)', unit:'h', def:2},
      {id:'soc_gain', label:'Gain Error (%)', unit:'%', def:0.5},
      {id:'soc_Iavg', label:'Average Current (A)', unit:'A', def:50},
    ],
    calc: function(v) {
      var Ah=v.soc_ah, Ioff=v.soc_Ioff/1000, t=v.soc_t, gain=v.soc_gain/100, Iavg=v.soc_Iavg;
      var dSoC_offset = Ioff * t / Ah * 100;
      var dSoC_gain = gain * Iavg * t / Ah * 100;
      var dSoC_total = Math.sqrt(dSoC_offset*dSoC_offset + dSoC_gain*dSoC_gain);
      return [
        {l:'SoC Error (offset)', v: dSoC_offset.toFixed(2), u:'%'},
        {l:'SoC Error (gain)', v: dSoC_gain.toFixed(2), u:'%'},
        {l:'Combined SoC Error', v: dSoC_total.toFixed(2), u:'%', ok: dSoC_total<3},
        {l:'Charge Error', v: (dSoC_total/100*Ah*1000).toFixed(0), u:'mAh'},
      ];
    }
  },
  {
    id:'contweld', title:'Contactor Weld Check',
    formula:'I²t for weld risk\nWeld probability increases above I²t threshold\nDeriving peak energy into contactor',
    inputs:[
      {id:'cw_I', label:'Fault Current (A)', unit:'A', def:5000},
      {id:'cw_t', label:'Contact Time before trip (ms)', unit:'ms', def:10},
      {id:'cw_Irated', label:'Contactor I_rated (A)', unit:'A', def:250},
    ],
    calc: function(v) {
      var I=v.cw_I, t=v.cw_t/1000, Ir=v.cw_Irated;
      var I2t = I*I * t;
      var I2t_threshold = Ir*Ir * 0.01; // typical 10ms rated
      var weldRisk = I2t > I2t_threshold*10 ? 'High Risk' : I2t > I2t_threshold*3 ? 'Moderate' : 'Low Risk';
      return [
        {l:'I²t Energy', v: (I2t/1000).toFixed(1), u:'kA²·s'},
        {l:'I²t Threshold', v: (I2t_threshold/1000).toFixed(1), u:'kA²·s (est)'},
        {l:'Weld Risk', v: weldRisk, u:'', ok: weldRisk==='Low Risk'},
        {l:'Trip Recommendation', v: t*1000<5 ? '< 5ms trip required' : 'Reduce trip time', u:''},
      ];
    }
  },
],

/* ═══ 6. ENVIRONMENTAL ═══ */
env: [
  {
    id:'ip', title:'IP Rating Calculator',
    formula:'IP XY: X=solid (0-6), Y=liquid (0-9)\nTest conditions per IEC 60529\nIP67 = dust tight + 1m/30min immersion',
    inputs:[
      {id:'ip_solid', label:'Solid Protection (0-6)', unit:'', def:6},
      {id:'ip_liquid', label:'Liquid Protection (0-9K)', unit:'', def:7},
    ],
    calc: function(v) {
      var solid_desc = ['No protection','≥50mm objects','≥12.5mm','≥2.5mm','≥1mm','Dust protected','Dust tight'];
      var liquid_desc = ['No protection','Vertical drip','15° tilt drip','Spraying','Splashing','Water jets','Powerful jets','Temp immersion','Continuous immersion','High pressure/temp jets'];
      var s = Math.min(6, Math.max(0, Math.round(v.ip_solid)));
      var l = Math.min(9, Math.max(0, Math.round(v.ip_liquid)));
      var test_cond = l >= 7 ? '1m depth, 30min minimum' : l >= 6 ? 'Water jets 12.5 L/min' : l >= 4 ? 'Splash from all directions' : 'Spray test';
      return [
        {l:'IP Rating', v: 'IP'+s+l, u:'', ok: true},
        {l:'Solid Protection', v: solid_desc[s]||'IP'+s, u:''},
        {l:'Liquid Protection', v: liquid_desc[l]||'IP'+l, u:''},
        {l:'Test Condition', v: test_cond, u:''},
      ];
    }
  },
  {
    id:'altderate', title:'Altitude Derating',
    formula:'Clearance: D(h) = D_0 × (p_0/p_h)\nArc voltage: V_arc ∝ air density\np_h = 101325 × (1 - 2.26e-5×h)^5.256',
    inputs:[
      {id:'alt_h', label:'Altitude (m)', unit:'m', def:3000},
      {id:'alt_Vnom', label:'System Voltage (V)', unit:'V', def:400},
      {id:'alt_clr', label:'Sea Level Clearance (mm)', unit:'mm', def:6},
    ],
    calc: function(v) {
      var h=v.alt_h, Vn=v.alt_Vnom, Clr0=v.alt_clr;
      var p0=101325, ph=p0*Math.pow(1-2.26e-5*h, 5.256);
      var density_ratio = ph/p0;
      var Clr_h = Clr0 / density_ratio;
      var Vderate = Vn * density_ratio;
      var factor = h > 5000 ? 1.48 : h > 3000 ? 1.29 : h > 2000 ? 1.14 : 1.0;
      return [
        {l:'Air Pressure', v: (ph/100).toFixed(1), u:'kPa (vs 1013 sea level)'},
        {l:'Density Ratio', v: (density_ratio*100).toFixed(1), u:'%'},
        {l:'Required Clearance', v: Clr_h.toFixed(2), u:'mm (IEC 60664-1 factor: '+factor+')'},
        {l:'Effective V_arc', v: Vderate.toFixed(0), u:'V equivalent'},
      ];
    }
  },
  {
    id:'thermal_shock', title:'Thermal Shock ΔT',
    formula:'Thermal shock ΔT_rate = (Th - Tc) / t_transfer\nStress = E × α × ΔT\nCycles to failure (Coffin-Manson)',
    inputs:[
      {id:'ts_Th', label:'High Temperature (°C)', unit:'°C', def:85},
      {id:'ts_Tc', label:'Low Temperature (°C)', unit:'°C', def:-40},
      {id:'ts_tdwell', label:'Dwell Time (min)', unit:'min', def:30},
      {id:'ts_ttrans', label:'Transfer Time (s)', unit:'s', def:30},
    ],
    calc: function(v) {
      var Th=v.ts_Th, Tc=v.ts_Tc, tdwell=v.ts_tdwell, ttrans=v.ts_ttrans;
      var dT = Th - Tc;
      var rate = dT / (ttrans/60); // °C/min
      var cycleTime = (2*tdwell + 2*ttrans/60); // min
      var cyclesPerDay = 24*60 / cycleTime;
      return [
        {l:'Temperature Delta', v: dT.toFixed(0), u:'°C'},
        {l:'Ramp Rate', v: rate.toFixed(1), u:'°C/min'},
        {l:'Cycle Duration', v: cycleTime.toFixed(0), u:'min'},
        {l:'Cycles/Day', v: cyclesPerDay.toFixed(1), u:'cycles/day'},
      ];
    }
  },
  {
    id:'humidity', title:'Humidity & Condensation',
    formula:'Dew point (Magnus): Td = 243.04×(ln(RH/100)+17.625×T/(243.04+T))/(17.625-...)\nCondensation risk when T_surface < Td',
    inputs:[
      {id:'hum_T', label:'Ambient Temperature (°C)', unit:'°C', def:25},
      {id:'hum_RH', label:'Relative Humidity (%)', unit:'%', def:85},
      {id:'hum_Tsurface', label:'Pack Surface Temp (°C)', unit:'°C', def:20},
    ],
    calc: function(v) {
      var T=v.hum_T, RH=v.hum_RH, Ts=v.hum_Tsurface;
      var a=17.625, b=243.04;
      var alpha = Math.log(RH/100) + a*T/(b+T);
      var Td = b*alpha / (a - alpha);
      var risk = Ts < Td;
      return [
        {l:'Dew Point', v: Td.toFixed(1), u:'°C'},
        {l:'Surface Temp', v: Ts.toFixed(1), u:'°C'},
        {l:'Safety Margin', v: (Ts-Td).toFixed(1), u:'°C', ok: !risk},
        {l:'Condensation Risk', v: risk ? 'HIGH RISK - condensation likely' : 'Safe - no condensation', u:'', ok: !risk},
      ];
    }
  },
],

/* ═══ 7. LIFECYCLE / AGING ═══ */
life: [

  {
    id:'htoe', title:'HTOE Life Cycle — Arrhenius Acceleration ↗ (Full Calculator)',
    formula:'AT,i = exp(EA/k × (1/Ttest - 1/Ti))\nttest = T_op / Σ(pi/AT,i)\nn = ln(1-PA) / (LV^b × ln(R))',
    inputs:[
      {id:'htoe_Ttest', label:'Test Ambient Temp Ttest (°C)', unit:'°C', def:50},
      {id:'htoe_Tcool', label:'Test Coolant Temp (°C)', unit:'°C', def:45},
      {id:'htoe_Top', label:'Field Operating Hours', unit:'h', def:6500},
      {id:'htoe_EA', label:'Activation Energy EA (eV)', unit:'eV', def:0.45},
      {id:'htoe_PA', label:'Confidence Level PA', unit:'', def:0.9},
      {id:'htoe_b', label:'Weibull Shape b', unit:'', def:2},
      {id:'htoe_LV', label:'Lifetime Ratio LV,RAD', unit:'', def:2},
      {id:'htoe_R', label:'Target Reliability R', unit:'', def:0.9},
      {id:'htoe_n_plan', label:'Planned Sample Count #', unit:'pcs', def:6},
    ],
    calc: function(v) {
      var k=8.617e-5, EA=v.htoe_EA;
      var Tt=v.htoe_Ttest+273.15, Tc=v.htoe_Tcool+273.15, Top=v.htoe_Top;
      // Ambient distribution (fixed per Excel)
      var ambDist=[{T:-30,p:5},{T:-10,p:8},{T:0,p:10},{T:10,p:17},{T:25,p:45},{T:45,p:10},{T:55,p:5}];
      var coolDist=[{T:-40,p:6},{T:23,p:65},{T:50,p:20},{T:55,p:9}];
      // Ambient AF
      var sumAmb=0;
      ambDist.forEach(function(d){
        var Ti=d.T+273.15;
        var ATi=Math.exp(EA/k*(1/Tt-1/Ti));
        sumAmb += (d.p/100)/ATi;
      });
      var ttest_amb = Top * sumAmb;
      var AF_amb = 1/sumAmb;
      // Coolant AF
      var sumCool=0;
      coolDist.forEach(function(d){
        var Ti=d.T+273.15;
        var ATi=Math.exp(EA/k*(1/Tc-1/Ti));
        sumCool += (d.p/100)/ATi;
      });
      var ttest_cool = Top * sumCool;
      // Sample size (Weibull)
      var PA=v.htoe_PA, b=v.htoe_b, LV=v.htoe_LV, R=v.htoe_R;
      var n_req = Math.log(1-PA) / (Math.pow(LV,b)*Math.log(R));
      var n_plan = v.htoe_n_plan;
      var R_demo = Math.exp(Math.log(1-PA)/(n_plan*Math.pow(LV,b)));
      return [
        {l:'AF Ambient', v: AF_amb.toFixed(3), u:'×', ok: AF_amb>2},
        {l:'Test Duration (Ambient)', v: ttest_amb.toFixed(0), u:'h ('+( ttest_amb/24).toFixed(1)+' days)', ok: ttest_amb<5000},
        {l:'Test Duration (Coolant)', v: ttest_cool.toFixed(0), u:'h ('+(ttest_cool/24).toFixed(1)+' days)'},
        {l:'Required Samples n', v: Math.ceil(n_req), u:'pcs (min '+n_req.toFixed(2)+' calc)', ok: n_plan>=Math.ceil(n_req)},
        {l:'Demonstrable R ('+n_plan+' samples)', v: (R_demo*100).toFixed(2), u:'%', ok: R_demo>=R},
        {l:'Target Reliability', v: (R*100).toFixed(0), u:'% @ '+Math.round(PA*100)+'% confidence'},
      ];
    }
  },

  {
    id:'arrhenius', title:'Arrhenius Acceleration Factor',
    formula:'AF = exp(Ea/k × (1/T_use - 1/T_test))\nEa typical: 0.5-0.7 eV lithium cells\nk = 8.617×10⁻⁵ eV/K',
    inputs:[
      {id:'arr_Ttest', label:'Test Temperature (°C)', unit:'°C', def:60},
      {id:'arr_Tuse', label:'Use Temperature (°C)', unit:'°C', def:25},
      {id:'arr_Ea', label:'Activation Energy Ea (eV)', unit:'eV', def:0.6},
    ],
    calc: function(v) {
      var Tt=v.arr_Ttest+273.15, Tu=v.arr_Tuse+273.15, Ea=v.arr_Ea;
      var k=8.617e-5;
      var AF = Math.exp(Ea/k * (1/Tu - 1/Tt));
      var t_test = 1000 / AF; // hours to simulate 1000h use
      return [
        {l:'Acceleration Factor', v: AF.toFixed(1), u:'×', ok: AF>1},
        {l:'Test hours for 1000h use', v: t_test.toFixed(1), u:'h'},
        {l:'Test hours for 10yr use', v: (87600/AF).toFixed(0), u:'h (10yr@25°C)'},
        {l:'Test days', v: (87600/AF/24).toFixed(1), u:'days'},
      ];
    }
  },
  {
    id:'calendarlife', title:'Calendar Life Estimation',
    formula:'Q_loss = A × t^0.5 × exp(-Ea/RT)\nSoH = 1 - Q_loss\nEoL at SoH = 80%',
    inputs:[
      {id:'cal_T', label:'Storage Temperature (°C)', unit:'°C', def:25},
      {id:'cal_SoC', label:'Storage SoC (%)', unit:'%', def:50},
      {id:'cal_target_soh', label:'EoL SoH Target (%)', unit:'%', def:80},
      {id:'cal_A', label:'Pre-exponential factor A (per yr^0.5)', unit:'', def:0.02},
    ],
    calc: function(v) {
      var T=v.cal_T+273.15, SoC=v.cal_SoC/100, targetSoH=v.cal_target_soh/100;
      var Ea=0.6, k=8.617e-5, A=v.cal_A;
      // SoC factor (empirical)
      var SoCfactor = 1 + (SoC - 0.5) * 0.8;
      var rate = A * SoCfactor * Math.exp(-Ea/(k*T));
      var Qloss_target = 1 - targetSoH;
      var t_eol = Math.pow(Qloss_target/rate, 2); // years
      return [
        {l:'Fade Rate', v: (rate*100).toFixed(3), u:'%/yr^0.5'},
        {l:'EoL at '+Math.round(targetSoH*100)+'% SoH', v: t_eol.toFixed(1), u:'years', ok: t_eol>10},
        {l:'SoH at 5 years', v: ((1-rate*Math.sqrt(5))*100).toFixed(1), u:'%'},
        {l:'SoH at 10 years', v: ((1-rate*Math.sqrt(10))*100).toFixed(1), u:'%'},
      ];
    }
  },
  {
    id:'cyclelife', title:'Cycle Life from DoD',
    formula:'N_cycles = A × (DoD)^(-n)\nCommon: N = 3000 × (DoD/0.8)^-1.5 for LFP\nCalendar + cycle combined',
    inputs:[
      {id:'cl_N80', label:'Cycle life at 80% DoD (cycles)', unit:'', def:3000},
      {id:'cl_dod', label:'Actual DoD (%)', unit:'%', def:60},
      {id:'cl_kmcycle', label:'Range per Cycle (km)', unit:'km', def:150},
      {id:'cl_soh_eol', label:'EoL SoH (%)', unit:'%', def:80},
    ],
    calc: function(v) {
      var N80=v.cl_N80, dod=v.cl_dod/100, km=v.cl_kmcycle;
      // Power law: N = N80 × (0.8/dod)^1.5
      var N = N80 * Math.pow(0.8/dod, 1.5);
      var totalKm = N * km;
      var yearsAt1cycle = N / 365;
      return [
        {l:'Estimated Cycles', v: N.toFixed(0), u:'cycles', ok: N>2000},
        {l:'Total Range', v: (totalKm/1000).toFixed(0), u:'000 km'},
        {l:'Calendar Life', v: yearsAt1cycle.toFixed(1), u:'years @1 cycle/day'},
        {l:'vs 80% DoD baseline', v: (N/N80*100).toFixed(0), u:'% improvement'},
      ];
    }
  },
  {
    id:'coffin', title:'Coffin-Manson Mechanical Fatigue',
    formula:'Nf = C × (ΔT)^(-n)\nCommon: n=2 for solder, n=1.9 for copper\nAcceleration: AF = (ΔT_test/ΔT_use)^n',
    inputs:[
      {id:'cm_dT_use', label:'Use ΔT per Cycle (°C)', unit:'°C', def:20},
      {id:'cm_dT_test', label:'Test ΔT per Cycle (°C)', unit:'°C', def:60},
      {id:'cm_Nf_test', label:'Cycles to Failure in Test', unit:'', def:500},
      {id:'cm_n', label:'Coffin-Manson Exponent n', unit:'', def:2},
    ],
    calc: function(v) {
      var dTu=v.cm_dT_use, dTt=v.cm_dT_test, Nf_test=v.cm_Nf_test, n=v.cm_n;
      var AF = Math.pow(dTt/dTu, n);
      var Nf_use = Nf_test * AF;
      return [
        {l:'Acceleration Factor', v: AF.toFixed(1), u:'×'},
        {l:'Cycles to Failure (use)', v: Nf_use.toFixed(0), u:'cycles', ok: Nf_use>50000},
        {l:'Life at 2 cycles/day', v: (Nf_use/2/365).toFixed(1), u:'years'},
        {l:'Test efficiency', v: (1/AF*100).toFixed(1), u:'% of use life per test cycle'},
      ];
    }
  },
  {
    id:'warranty', title:'Warranty SoH Crossover',
    formula:'Q_fade(N) = Q_0 × (1 - k_cyc × sqrt(N) - k_cal × sqrt(t))\nWarranty: min 80% SoH at N cycles or T years',
    inputs:[
      {id:'war_ah', label:'Initial Capacity (Ah)', unit:'Ah', def:120},
      {id:'war_kcyc', label:'Cycle Fade Rate (%/sqrt(N))', unit:'', def:0.08},
      {id:'war_kcal', label:'Calendar Fade Rate (%/sqrt(yr))', unit:'', def:1.2},
      {id:'war_soh', label:'Warranty SoH Threshold (%)', unit:'%', def:80},
      {id:'war_ncyc', label:'Cycles per Year', unit:'', def:300},
    ],
    calc: function(v) {
      var Ah=v.war_ah, kc=v.war_kcyc/100, kal=v.war_kcal/100, soh=v.war_soh/100, Npy=v.war_ncyc;
      // Find crossover year
      var year_cross = null;
      for (var yr=1; yr<=15; yr++) {
        var N = yr * Npy;
        var fade = kc*Math.sqrt(N) + kal*Math.sqrt(yr);
        if (fade >= (1-soh)) { year_cross = yr; break; }
      }
      var N5 = 5*Npy;
      var soh5 = (1 - kc*Math.sqrt(N5) - kal*Math.sqrt(5))*100;
      var soh10 = (1 - kc*Math.sqrt(10*Npy) - kal*Math.sqrt(10))*100;
      return [
        {l:'EoL Year', v: year_cross ? year_cross : '>15', u:'years', ok: year_cross===null||year_cross>8},
        {l:'SoH at 5 years', v: soh5.toFixed(1), u:'%', ok: soh5>80},
        {l:'SoH at 10 years', v: soh10.toFixed(1), u:'%', ok: soh10>70},
        {l:'EoL Cycles', v: year_cross ? (year_cross*Npy).toFixed(0) : '>'+15*Npy, u:'cycles'},
      ];
    }
  },
],

/* ═══ 8. ABUSE ═══ */
abuse: [
  {
    id:'shortckt', title:'Short Circuit Current & Fuse I²t',
    formula:'I_sc = V_OC / (R_cell/S×P + R_external)\nI²t_fuse < I²t_cell\nΔT = I²×R×t / (m×Cp)',
    inputs:[
      {id:'sc_Voc', label:'Pack OCV (V)', unit:'V', def:420},
      {id:'sc_Rpack', label:'Pack IR (mΩ)', unit:'mΩ', def:30},
      {id:'sc_Rext', label:'External Resistance (mΩ)', unit:'mΩ', def:5},
      {id:'sc_tfuse', label:'Fuse Trip Time (ms)', unit:'ms', def:10},
      {id:'sc_mass', label:'Cell Mass (g)', unit:'g', def:2800},
    ],
    calc: function(v) {
      var Voc=v.sc_Voc, Rp=v.sc_Rpack/1000, Re=v.sc_Rext/1000, t=v.sc_tfuse/1000, m=v.sc_mass/1000;
      var Isc = Voc / (Rp + Re);
      var I2t = Isc*Isc * t;
      var Cp_cell = 900; // J/kg·K LFP approx
      var dT = Isc*Isc * Rp * t / (m * Cp_cell);
      return [
        {l:'Short Circuit Current', v: (Isc/1000).toFixed(2), u:'kA', ok: false},
        {l:'I²t', v: (I2t/1000).toFixed(1), u:'kA²·s'},
        {l:'Cell Temp Rise', v: dT.toFixed(1), u:'°C in '+v.sc_tfuse+'ms'},
        {l:'Power at Fault', v: (Isc*Isc*Rp/1000).toFixed(1), u:'kW into pack IR'},
      ];
    }
  },
  {
    id:'overcharge', title:'Overcharge Energy & Temperature',
    formula:'E_extra = I × (V_cutoff - V_max) × t\nΔT = E_extra / (m × Cp)\nLithium plating above 100% SoC',
    inputs:[
      {id:'oc_I', label:'Charge Current (A)', unit:'A', def:60},
      {id:'oc_Vcutoff', label:'Charger Cutoff Voltage (V)', unit:'V', def:430},
      {id:'oc_Vmax', label:'Normal Cutoff (V)', unit:'V', def:422},
      {id:'oc_t', label:'Overcharge Duration (min)', unit:'min', def:15},
      {id:'oc_mass', label:'Pack Mass (kg)', unit:'kg', def:250},
    ],
    calc: function(v) {
      var I=v.oc_I, Vco=v.oc_Vcutoff, Vmax=v.oc_Vmax, t=v.oc_t*60, m=v.oc_mass;
      var dV = Vco - Vmax;
      var Eavg = I * (Vmax + dV/2) * t / 3600;
      var dT = Eavg*3600 / (m * 900);
      var risk = dV > 10 ? 'CRITICAL' : dV > 5 ? 'HIGH' : 'MODERATE';
      return [
        {l:'Overcharge Voltage', v: dV.toFixed(1), u:'V above limit', ok: dV<2},
        {l:'Overcharge Energy', v: Eavg.toFixed(2), u:'Wh'},
        {l:'Temperature Rise', v: dT.toFixed(1), u:'°C', ok: dT<10},
        {l:'Risk Level', v: risk, u:'', ok: risk==='MODERATE'},
      ];
    }
  },
  {
    id:'nail', title:'Nail Penetration Heat Model',
    formula:'Q_isc = V²_short / R_nail\nT_rise = Q × t / (m_cell × Cp)\nThermal runaway threshold ~100-130°C for NMC',
    inputs:[
      {id:'nail_Vcell', label:'Cell OCV (V)', unit:'V', def:3.6},
      {id:'nail_Rnail', label:'Nail Resistance (mΩ)', unit:'mΩ', def:5},
      {id:'nail_mcell', label:'Cell Mass (g)', unit:'g', def:2800},
      {id:'nail_t', label:'Short Duration (s)', unit:'s', def:5},
    ],
    calc: function(v) {
      var Vc=v.nail_Vcell, Rn=v.nail_Rnail/1000, m=v.nail_mcell/1000, t=v.nail_t;
      var Isc = Vc / Rn;
      var P = Vc*Vc / Rn;
      var Cp=900;
      var dT = P * t / (m * Cp);
      var trRisk = dT > 60 ? 'TR likely' : dT > 30 ? 'TR possible' : 'TR unlikely';
      return [
        {l:'ISC Current', v: (Isc).toFixed(0), u:'A'},
        {l:'Short Power', v: P.toFixed(0), u:'W at nail'},
        {l:'Cell Temp Rise', v: dT.toFixed(1), u:'°C in '+t+'s', ok: dT<30},
        {l:'TR Risk', v: trRisk, u:'', ok: dT<30},
      ];
    }
  },
  {
    id:'crush', title:'Crush Force & Deformation',
    formula:'Stress = F / A_cross\nStrain energy = 0.5 × E × ε²\nSeparator failure at ~10% strain',
    inputs:[
      {id:'cr_F', label:'Crush Force (kN)', unit:'kN', def:50},
      {id:'cr_A', label:'Cell Cross-section Area (cm²)', unit:'cm²', def:200},
      {id:'cr_thick', label:'Cell Thickness (mm)', unit:'mm', def:32},
      {id:'cr_E', label:'Compression Modulus (MPa)', unit:'MPa', def:10},
    ],
    calc: function(v) {
      var F=v.cr_F*1000, A=v.cr_A*1e-4, thick=v.cr_thick/1000, E=v.cr_E*1e6;
      var stress = F / A / 1e6; // MPa
      var strain_sep = 0.10; // 10% failure strain
      var F_sep = E * strain_sep * A / 1000; // kN
      var def_fail = thick * strain_sep * 1000; // mm
      return [
        {l:'Applied Stress', v: stress.toFixed(2), u:'MPa'},
        {l:'Est. Separator Failure Force', v: F_sep.toFixed(1), u:'kN'},
        {l:'Deformation at Failure', v: def_fail.toFixed(1), u:'mm (10% strain)'},
        {l:'Safety Margin', v: ((F_sep*1000/F)).toFixed(2), u:'× margin', ok: F_sep*1000>F},
      ];
    }
  },
],

/* ═══ 9. MECHANICAL ═══ */
mech: [
  {
    id:'packged', title:'Pack GED & VED',
    formula:'GED = E_gross / m_total (Wh/kg)\nVED = E_gross / V_total (Wh/L)\nTarget: GED>150 Wh/kg, VED>250 Wh/L for BEV',
    inputs:[
      {id:'ged_Egross', label:'Gross Energy (kWh)', unit:'kWh', def:43},
      {id:'ged_mcells', label:'Cell Mass (kg)', unit:'kg', def:336},
      {id:'ged_mhousing', label:'Housing + BMS Mass (kg)', unit:'kg', def:80},
      {id:'ged_vol', label:'Pack Volume (L)', unit:'L', def:200},
    ],
    calc: function(v) {
      var E=v.ged_Egross, mc=v.ged_mcells, mh=v.ged_mhousing, Vol=v.ged_vol;
      var mtotal = mc + mh;
      var GED = E*1000 / mtotal;
      var VED = E*1000 / Vol;
      var packing = mc*1000/(E*1000) * GED; // cell packing efficiency
      return [
        {l:'GED', v: GED.toFixed(1), u:'Wh/kg', ok: GED>130},
        {l:'VED', v: VED.toFixed(1), u:'Wh/L', ok: VED>200},
        {l:'Total Pack Mass', v: mtotal.toFixed(0), u:'kg'},
        {l:'Housing Overhead', v: (mh/mtotal*100).toFixed(1), u:'% of mass'},
      ];
    }
  },
  {
    id:'busbar', title:'Busbar Cross-Section',
    formula:'A_min = I / J_max\nJ_max = 2.0-4.0 A/mm² (continuous)\nΔT = I²×ρ×L / (A×λ×k)',
    inputs:[
      {id:'bb_I', label:'Max Current (A)', unit:'A', def:250},
      {id:'bb_J', label:'Max Current Density (A/mm²)', unit:'A/mm²', def:3},
      {id:'bb_L', label:'Busbar Length (mm)', unit:'mm', def:200},
      {id:'bb_mat', label:'Material (Cu=1, Al=1.6)', unit:'', def:1},
    ],
    calc: function(v) {
      var I=v.bb_I, J=v.bb_J, L=v.bb_L/1000, mat=v.bb_mat;
      var rho_cu=1.72e-8, lambda_cu=400;
      var rho = rho_cu * mat; // Al is ~1.6× Cu resistivity
      var lambda = lambda_cu / mat;
      var A_min = I / J; // mm²
      var R = rho * L / (A_min*1e-6) * 1000; // mΩ
      var P = I*I * R/1000;
      var dT = P * L / (A_min*1e-6 * lambda); // very rough
      return [
        {l:'Min Cross-section', v: A_min.toFixed(1), u:'mm²', ok: true},
        {l:'Resistance', v: R.toFixed(2), u:'mΩ'},
        {l:'Power Loss', v: P.toFixed(2), u:'W'},
        {l:'Suggested Width×Thick', v: (A_min/4).toFixed(1)+'×4 or '+(A_min/3).toFixed(1)+'×3', u:'mm'},
      ];
    }
  },
  {
    id:'vibration', title:'Vibration Fatigue Assessment',
    formula:'Fatigue life: N_f = (S_ult/σ_a)^(1/b)\nTransmissibility: T = sqrt((1+(2ζr)²)/((1-r²)²+(2ζr)²))\nr = f_excite / f_natural',
    inputs:[
      {id:'vib_fn', label:'Natural Frequency (Hz)', unit:'Hz', def:50},
      {id:'vib_fe', label:'Excitation Frequency (Hz)', unit:'Hz', def:20},
      {id:'vib_z', label:'Damping Ratio ζ', unit:'', def:0.05},
      {id:'vib_g', label:'Input Acceleration (g)', unit:'g', def:5},
    ],
    calc: function(v) {
      var fn=v.vib_fn, fe=v.vib_fe, z=v.vib_z, g=v.vib_g;
      var r = fe/fn;
      var T = Math.sqrt((1+Math.pow(2*z*r,2)) / (Math.pow(1-r*r,2)+Math.pow(2*z*r,2)));
      var g_out = g * T;
      var resonance = Math.abs(r-1) < 0.1;
      return [
        {l:'Frequency Ratio r', v: r.toFixed(3), u:'', ok: r<0.7||r>1.3},
        {l:'Transmissibility', v: T.toFixed(2), u:'×'},
        {l:'Output Acceleration', v: g_out.toFixed(1), u:'g'},
        {l:'Resonance Risk', v: resonance ? 'WARNING: near resonance' : 'Safe margin', u:'', ok: !resonance},
      ];
    }
  },
  {
    id:'tabweld', title:'Tab Weld Pull Force',
    formula:'F_pull = τ_shear × A_weld\nA_weld = π/4 × d²_nugget × n_spots\nTab thickness effect on peel vs shear',
    inputs:[
      {id:'tw_d', label:'Weld Nugget Diameter (mm)', unit:'mm', def:4},
      {id:'tw_n', label:'Number of Weld Spots', unit:'', def:4},
      {id:'tw_tau', label:'Shear Strength (MPa, Al≈70)', unit:'MPa', def:70},
      {id:'tw_thick', label:'Tab Thickness (mm)', unit:'mm', def:0.3},
    ],
    calc: function(v) {
      var d=v.tw_d, n=v.tw_n, tau=v.tw_tau, thick=v.tw_thick;
      var A_spot = Math.PI/4 * d*d; // mm²
      var A_total = A_spot * n;
      var F = tau * A_total; // N
      var F_kN = F / 1000;
      return [
        {l:'Weld Area', v: A_total.toFixed(1), u:'mm²'},
        {l:'Pull Force', v: F.toFixed(0), u:'N ('+F_kN.toFixed(2)+' kN)', ok: F>200},
        {l:'Force per Spot', v: (F/n).toFixed(0), u:'N'},
        {l:'Min Required (IEC)', v: '> '+(thick*1000*200).toFixed(0), u:'N (guideline)'},
      ];
    }
  },
],

/* ═══ 10. EMI / EMC ═══ */
emi: [
  {
    id:'shielding', title:'Cable Shielding Effectiveness',
    formula:'SE = 20×log10(E_unshielded/E_shielded)\nTF = 1/(1+(R_shield/Z_source))\nOptimum: braided, >85% coverage',
    inputs:[
      {id:'sh_f', label:'Frequency (MHz)', unit:'MHz', def:30},
      {id:'sh_Rshield', label:'Shield Resistance (mΩ/m)', unit:'mΩ/m', def:15},
      {id:'sh_coverage', label:'Braid Coverage (%)', unit:'%', def:90},
      {id:'sh_L', label:'Cable Length (m)', unit:'m', def:2},
    ],
    calc: function(v) {
      var f=v.sh_f*1e6, Rs=v.sh_Rshield/1000*v.sh_L, cov=v.sh_coverage/100;
      var SE_transfer = -20*Math.log10(Rs/(50+Rs)); // vs 50Ω source
      var SE_coverage = 20*Math.log10(1/(1-cov));
      var SE_total = SE_transfer + SE_coverage;
      return [
        {l:'Transfer Impedance SE', v: SE_transfer.toFixed(1), u:'dB'},
        {l:'Coverage SE', v: SE_coverage.toFixed(1), u:'dB'},
        {l:'Total SE (estimate)', v: SE_total.toFixed(0), u:'dB', ok: SE_total>40},
        {l:'Shielding Class', v: SE_total>60?'Class A (>60dB)':SE_total>40?'Class B (40-60dB)':'Class C (<40dB)', u:''},
      ];
    }
  },
  {
    id:'emifilter', title:'EMI Filter Corner Frequency',
    formula:'f_c = 1 / (2π × sqrt(L × C))\nAttenuation = 40×log10(f/f_c) dB/decade\nInsertion loss at target frequency',
    inputs:[
      {id:'emf_L', label:'Inductance L (µH)', unit:'µH', def:10},
      {id:'emf_C', label:'Capacitance C (nF)', unit:'nF', def:100},
      {id:'emf_f', label:'Interference Frequency (MHz)', unit:'MHz', def:1},
    ],
    calc: function(v) {
      var L=v.emf_L*1e-6, C=v.emf_C*1e-9, f=v.emf_f*1e6;
      var fc = 1 / (2*Math.PI*Math.sqrt(L*C));
      var ratio = f/fc;
      var atten = ratio > 1 ? 40*Math.log10(ratio) : 0;
      return [
        {l:'Corner Frequency', v: (fc/1000).toFixed(2), u:'kHz', ok: fc<f},
        {l:'Attenuation at target f', v: atten.toFixed(1), u:'dB', ok: atten>40},
        {l:'Frequency Ratio f/fc', v: ratio.toFixed(1), u:'×'},
        {l:'Filter slope', v: '-40 dB/decade (LC)', u:'(2nd order)'},
      ];
    }
  },
  {
    id:'groundloop', title:'Ground Loop Impedance',
    formula:'Z_loop = sqrt(R² + (2πfL)²)\nV_noise = I_noise × Z_loop\nCMRR required = 20×log10(V_source/V_allowed)',
    inputs:[
      {id:'gl_R', label:'Loop Resistance (mΩ)', unit:'mΩ', def:5},
      {id:'gl_L', label:'Loop Inductance (µH)', unit:'µH', def:1},
      {id:'gl_f', label:'Noise Frequency (kHz)', unit:'kHz', def:150},
      {id:'gl_I', label:'Conducted Noise Current (mA)', unit:'mA', def:10},
    ],
    calc: function(v) {
      var R=v.gl_R/1000, L=v.gl_L*1e-6, f=v.gl_f*1e3, I=v.gl_I/1000;
      var XL = 2*Math.PI*f*L;
      var Z = Math.sqrt(R*R + XL*XL);
      var Vnoise = I * Z * 1000; // mV
      return [
        {l:'Inductive Reactance XL', v: (XL*1000).toFixed(2), u:'mΩ at '+v.gl_f+'kHz'},
        {l:'Loop Impedance Z', v: (Z*1000).toFixed(2), u:'mΩ'},
        {l:'Noise Voltage', v: Vnoise.toFixed(2), u:'mV', ok: Vnoise<10},
        {l:'Inductance dominates above', v: (R/(2*Math.PI*L)/1000).toFixed(1), u:'kHz'},
      ];
    }
  },
  {
    id:'conducted', title:'Conducted Emissions Limit',
    formula:'CISPR 25 Class 5 limit (30 MHz)\nMeasurement: 50µH/5Ω LISN\nSpread spectrum: reduces peak by ~10dB',
    inputs:[
      {id:'ce_I', label:'Switching Current (A)', unit:'A', def:50},
      {id:'ce_f', label:'Switching Frequency (kHz)', unit:'kHz', def:20},
      {id:'ce_tr', label:'Rise Time (ns)', unit:'ns', def:100},
      {id:'ce_L', label:'Cable Loop Area (cm²)', unit:'cm²', def:10},
    ],
    calc: function(v) {
      var I=v.ce_I, f=v.ce_f*1e3, tr=v.ce_tr*1e-9, A=v.ce_L*1e-4;
      var I_fundamental = 2*I/Math.PI;
      var dBuA = 20*Math.log10(I_fundamental*1e6);
      var f_knee = 1/(Math.PI*tr)/1e6; // MHz
      var V_emf = 2*Math.PI*f * I * A * 1e6; // µV/m (rough radiated)
      return [
        {l:'Fundamental Component', v: I_fundamental.toFixed(1), u:'A ('+dBuA.toFixed(0)+' dBµA)'},
        {l:'Spectrum Knee Frequency', v: f_knee.toFixed(1), u:'MHz'},
        {l:'Radiated EMF (1m est.)', v: V_emf.toFixed(2), u:'µV/m'},
        {l:'CISPR 25 Class5 Limit @30MHz', v: '40 dBµV', u:'(ref only)'},
      ];
    }
  },
],

}; // end window.CALCS

/* ═══════════════ RENDER ENGINE ═══════════════ */
window.renderCalcPanel = function() {
  var root = document.getElementById('calc-root');
  if (!root) return;
  var activeGroup = window._calcActiveGroup || 'hv';

  var tabsHTML = window.CALC_GROUPS.map(function(g) {
    var active = g.id === activeGroup;
    return '<div class="calc-tab'+(active?' active':'')+ '" onclick="calcSetGroup(\''+g.id+'\')">' +
      '<span class="calc-tab-icon">'+g.icon+'</span>' +
      '<span class="calc-tab-label">'+g.label+'</span>' +
      '</div>';
  }).join('');

  var calcs = window.CALCS[activeGroup] || [];
  var cardsHTML = calcs.map(function(calc) {
    var inputsHTML = calc.inputs.map(function(inp) {
      return '<div class="ci-field">' +
        '<label>'+inp.label+'</label>' +
        '<div class="ci-input-row">' +
        '<input type="'+(inp.unit===''?'number':'number')+'" id="ci_'+inp.id+'" value="'+(inp.def||0)+'" step="any" placeholder="'+inp.label+'">' +
        (inp.unit ? '<span class="ci-unit">'+inp.unit+'</span>' : '') +
        '</div></div>';
    }).join('');

    return '<div class="calc-card" id="cc_'+calc.id+'">' +
      '<div class="cc-header">' +
        '<div class="cc-title">'+calc.title+'</div>' +
        '<button class="cc-calc-btn" onclick="'+(calc.id==='htoe'?'openHTOE()':('runCalc('+String.fromCharCode(39)+calc.id+String.fromCharCode(39)+')'))+'">'+(calc.id==='htoe'?'Open Full Calculator':'Calculate')+'</button>' +
      '</div>' +
      '<div class="cc-formula">'+calc.formula+'</div>' +
      '<div class="cc-inputs">'+inputsHTML+'</div>' +
      '<div class="cc-results" id="cr_'+calc.id+'"></div>' +
    '</div>';
  }).join('');

  root.innerHTML =
    '<div class="calc-shell">' +
      '<div class="calc-sidebar">'+tabsHTML+'</div>' +
      '<div class="calc-content">' +
        '<div class="calc-group-title">' +
          (window.CALC_GROUPS.find(function(g){return g.id===activeGroup;})||{}).icon + ' ' +
          (window.CALC_GROUPS.find(function(g){return g.id===activeGroup;})||{}).label +
          ' Calculators' +
        '</div>' +
        '<div class="calc-cards">'+cardsHTML+'</div>' +
      '</div>' +
    '</div>';
};

window.calcSetGroup = function(id) {
  window._calcActiveGroup = id;
  window.renderCalcPanel();
};

window.runCalc = function(calcId) {
  var activeGroup = window._calcActiveGroup || 'hv';
  var calcs = window.CALCS[activeGroup] || [];
  var calc = calcs.find(function(c){return c.id===calcId;});
  if (!calc) return;

  // Read inputs
  var vals = {};
  calc.inputs.forEach(function(inp) {
    var el = document.getElementById('ci_'+inp.id);
    vals[inp.id] = el ? parseFloat(el.value)||0 : inp.def||0;
  });

  // Run calculation
  var results;
  try {
    results = calc.calc(vals);
  } catch(e) {
    results = [{l:'Error', v: e.message, u:'', ok: false}];
  }

  // Render results
  var resEl = document.getElementById('cr_'+calcId);
  if (!resEl) return;
  var html = '<div class="cc-results-grid">';
  results.forEach(function(r) {
    var ok = r.ok === undefined ? null : r.ok;
    var cls = ok === true ? 'cr-ok' : ok === false ? 'cr-fail' : '';
    html += '<div class="cr-item '+cls+'">' +
      '<div class="cr-val">'+r.v+'<span class="cr-unit"> '+r.u+'</span></div>' +
      '<div class="cr-label">'+r.l+'</div>' +
    '</div>';
  });
  html += '</div>';
  resEl.innerHTML = html;
};


// Init when panel becomes active
(function(){
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.target.id === 'panel-calculator' && m.target.classList.contains('active')) {
        if (typeof renderCalcPanel === 'function') renderCalcPanel();
      }
    });
  });
  var panel = document.getElementById('panel-calculator');
  if (panel) observer.observe(panel, { attributes:true, attributeFilter:['class'] });
  if (panel && panel.classList.contains('active')) renderCalcPanel();
})();

(function(){
  // Default ambient distribution
  var defAmb = [{T:-30,p:5},{T:-10,p:8},{T:0,p:10},{T:10,p:17},{T:25,p:45},{T:45,p:10},{T:55,p:5}];
  var defCool = [{T:-40,p:6},{T:23,p:65},{T:50,p:20},{T:55,p:9}];

  function buildRow(arr, tbody, type) {
    var el = document.getElementById(tbody);
    if (!el) return;
    el.innerHTML = '';
    for (var i=0; i<10; i++) {
      var d = arr[i] || {T:0, p:0};
      var tr = document.createElement('tr');
      var cols = type === 'amb'
        ? '<td style="color:#9ca3af;font-size:10px;padding:4px 8px">'+(i+1)+'</td>' +
          '<td><input type="number" id="ht_a_T'+i+'" value="'+d.T+'" step="5" oninput="runHTOE()"></td>' +
          '<td><input type="number" id="ht_a_p'+i+'" value="'+d.p+'" step="1" min="0" max="100" oninput="runHTOE()"></td>' +
          '<td class="calc-col" id="ht_a_AT'+i+'">-</td>' +
          '<td class="calc-col" id="ht_a_tf'+i+'">-</td>' +
          '<td class="calc-col" id="ht_a_tt'+i+'">-</td>'
        : '<td style="color:#9ca3af;font-size:10px;padding:4px 8px">'+(i+1)+'</td>' +
          '<td><input type="number" id="ht_c_T'+i+'" value="'+d.T+'" step="5" oninput="runHTOE()"></td>' +
          '<td><input type="number" id="ht_c_p'+i+'" value="'+d.p+'" step="1" min="0" max="100" oninput="runHTOE()"></td>' +
          '<td class="calc-col" id="ht_c_AT'+i+'">-</td>' +
          '<td class="calc-col" id="ht_c_rat'+i+'">-</td>';
      tr.innerHTML = cols;
      el.appendChild(tr);
    }
  }

  function gv(id) { var el=document.getElementById(id); return el?parseFloat(el.value)||0:0; }
  function sv(id,val) { var el=document.getElementById(id); if(el) el.textContent=val; }

  window.runHTOE = function() {
    var k=8.617e-5;
    var Tt=gv('ht_Ttest')+273.15, Tc=gv('ht_Tcool')+273.15;
    var Top=gv('ht_Top'), EA=gv('ht_EA');

    // Step 3a
    var sumAmb=0, sumTfield=0, sumTtest=0, sumPamb=0;
    for (var i=0;i<10;i++) {
      var Ti=gv('ht_a_T'+i)+273.15, pi=gv('ht_a_p'+i);
      sumPamb += pi;
      var ATi = Math.exp(EA/k*(1/Tt - 1/Ti));
      var tfi = Top*(pi/100);
      var tti = pi>0 ? tfi/ATi : 0;
      sumAmb += pi>0 ? (pi/100)/ATi : 0;
      sumTfield += tfi;
      sumTtest += tti;
      sv('ht_a_AT'+i, pi>0 ? ATi.toFixed(3) : '-');
      sv('ht_a_tf'+i, pi>0 ? tfi.toFixed(0)+' h' : '-');
      sv('ht_a_tt'+i, pi>0 ? tti.toFixed(1)+' h' : '-');
    }
    var pWarnAmb = Math.abs(sumPamb-100)>0.5;
    document.getElementById('ht-amb-sum').textContent = sumPamb.toFixed(0)+'%';
    document.getElementById('ht-amb-sum').className = pWarnAmb ? 'htoe-sum-warn' : 'htoe-sum-ok';
    sv('ht-amb-tfield', Top.toFixed(0)+' h');
    sv('ht-amb-ttest', sumTtest.toFixed(1)+' h');

    var ttest_amb = sumTtest;
    var AF_amb = sumAmb > 0 ? 1/sumAmb : 0;

    // Step 3b
    var sumCool=0, sumPcool=0;
    for (var j=0;j<10;j++) {
      var Tj=gv('ht_c_T'+j)+273.15, rj=gv('ht_c_p'+j);
      sumPcool += rj;
      var ATj = Math.exp(EA/k*(1/Tc - 1/Tj));
      var ratio = rj>0 ? (rj/100)/ATj : 0;
      sumCool += ratio;
      sv('ht_c_AT'+j, rj>0 ? ATj.toFixed(3) : '-');
      sv('ht_c_rat'+j, rj>0 ? ratio.toFixed(5) : '-');
    }
    var pWarnCool = Math.abs(sumPcool-100)>0.5;
    document.getElementById('ht-cool-sum').textContent = sumPcool.toFixed(0)+'%';
    document.getElementById('ht-cool-sum').className = pWarnCool ? 'htoe-sum-warn' : 'htoe-sum-ok';
    sv('ht-cool-ttest', sumCool.toFixed(6));

    var ttest_cool = sumCool > 0 ? Top * sumCool : 0;
    var AF_cool = sumCool > 0 ? 1/sumCool : 0;

    // Step 4
    var s4 = document.getElementById('htoe-step4-results');
    if (s4) s4.innerHTML = '<div class="htoe-results">' +
      res('AF Ambient', AF_amb.toFixed(3), '×', AF_amb>2?'ok':'warn') +
      res('Test Duration Ambient', ttest_amb.toFixed(0), 'h / '+(ttest_amb/24).toFixed(1)+' days', ttest_amb<3000?'ok':'warn') +
      res('AF Coolant', AF_cool.toFixed(3), '×', AF_cool>2?'ok':'warn') +
      res('Test Duration Coolant', ttest_cool.toFixed(0), 'h / '+(ttest_cool/24).toFixed(1)+' days', ttest_cool<5000?'ok':'warn') +
      '</div>';

    // Step 5
    var PA=gv('ht_PA'), b=gv('ht_b'), LV=gv('ht_LV'), R=gv('ht_R'), nplan=gv('ht_nplan');
    var n_req = Math.log(1-PA) / (Math.pow(LV,b)*Math.log(R));
    var R_demo = Math.exp(Math.log(1-PA)/(nplan*Math.pow(LV,b)));
    var s5 = document.getElementById('htoe-step5-results');
    if (s5) s5.innerHTML = '<div class="htoe-results">' +
      res('Required Samples n', Math.ceil(n_req).toFixed(0), 'pcs (calc: '+n_req.toFixed(2)+')', nplan>=Math.ceil(n_req)?'ok':'fail') +
      res('Demonstrable Reliability', (R_demo*100).toFixed(2), '% with '+nplan+' samples', R_demo>=R?'ok':'fail') +
      res('Target Reliability', (R*100).toFixed(0), '% @ '+(PA*100).toFixed(0)+'% confidence', 'ok') +
      res('Weibull b × LV^b', (Math.pow(LV,b)).toFixed(3), 'combined factor', 'ok') +
      '</div>';
  };

  function res(label, val, unit, cls) {
    return '<div class="htoe-result-card '+cls+'">' +
      '<div class="htoe-rv">'+val+'<span class="htoe-ru"> '+unit+'</span></div>' +
      '<div class="htoe-rl">'+label+'</div></div>';
  }

  // Open trigger
  window.openHTOE = function() {
    var panel = document.getElementById('htoe-panel');
    if (!panel) return;
    buildRow(defAmb, 'htoe-amb-body', 'amb');
    buildRow(defCool, 'htoe-cool-body', 'cool');
    panel.classList.add('open');
    setTimeout(runHTOE, 100);
  };

  // Close on backdrop click
  document.getElementById('htoe-panel').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open');
  });
})();

/* ── Upskill tab content ── */
var UPSKILL_CONTENT = {
  'cell-basics': {
    title: 'Cell Electrochemistry Basics',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">How a lithium-ion cell works</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px">A lithium-ion cell stores energy through the reversible movement of lithium ions between two electrodes. During discharge, lithium ions move from the anode (graphite) through the electrolyte to the cathode (NMC, LFP, NCA etc.), while electrons flow through the external circuit producing current.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Key components:</strong> Anode (graphite), Cathode (transition metal oxide), Electrolyte (LiPF6 in organic solvent), Separator (prevents short circuit), SEI layer (solid-electrolyte interphase - forms on anode first cycle).</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>Chemistry comparison:</strong> LFP offers best cycle life and thermal stability (no cobalt), lower energy density. NMC offers higher energy density. NCA has highest energy but lowest thermal stability. LTO has exceptional cycle life and fast charge but very low energy density.</p>'
  },
  'pack-architecture': {
    title: 'Pack Architecture and S×P Configuration',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Series and parallel connections</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Series (S):</strong> Each cell in series adds to pack voltage. V_pack = S x V_cell. Capacity stays the same as a single cell. All cells must be well-matched - any imbalance causes unequal aging.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Parallel (P):</strong> Each parallel string adds to pack capacity. Q_pack = P x Q_cell. Voltage stays the same. Current sharing depends on cell impedance matching.</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>Energy:</strong> E_gross (kWh) = S x P x Q_cell (Ah) x V_nom / 1000. Use the S×P Sizing sheet to explore configurations against your project constraints.</p>'
  },
  'bms-intro': {
    title: 'BMS Fundamentals',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">What the BMS does</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Protection:</strong> Overvoltage, undervoltage, overcurrent, overtemperature, undertemperature, short circuit. These are hard limits - the BMS opens contactors to disconnect the pack.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>SoC estimation:</strong> Coulomb counting (integrates current over time) combined with OCV lookup and Kalman filter corrections. Accuracy typically ±2-3% with a good EKF.</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>Cell balancing:</strong> Passive balancing dissipates excess energy as heat via resistors. Active balancing transfers energy between cells. Balancing is essential in series strings to prevent divergence over cycles.</p>'
  },
  'thermal-mgmt': {
    title: 'Thermal Management Systems',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Why thermal management matters</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px">Heat is generated by I²R losses in every cell. At higher C-rates or elevated temperatures, heat generation accelerates aging and can trigger thermal runaway above ~80-90°C for NMC cells.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Cooling strategies:</strong> Air cooling (simple, low cost, low effectiveness). Liquid cold plates (most common, glycol-water at 50:50, best thermal contact via TIM). Immersion cooling (highest performance, complex sealing). Bottom cooling vs side cooling affects temperature gradient.</p><p style="font-size:12px;color:#3a567a;line-height:1.7">Target: cell-to-cell delta-T below 5°C. Max cell surface temperature per chemistry datasheet limit.</p>'
  },
  'dvp-guide': {
    title: 'Design Validation Plan (DVP)',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Building a DVP</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px">A DVP defines every test needed to confirm that the battery system meets its design requirements. Each row is a test item with: test name, standard and clause, acceptance criteria, sample count, duration, responsible engineer, and pass/fail status.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Sample sizing:</strong> Use reliability and confidence targets (e.g. R=90%, C=90%) to calculate minimum samples. For n=3 samples, you get roughly R=63% at C=90%. The Battery Testing sheet auto-calculates this.</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>Test sequence:</strong> Start with non-destructive tests (electrical performance, DCIR) before destructive ones (abuse, vibration). Carry-over tests from previous validated designs reduce sample count.</p>'
  },
  'standards-guide': {
    title: 'EV Battery Standards Overview',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Key standards by market</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>UN 38.3:</strong> Mandatory for transport of lithium cells/batteries. 8 tests: altitude, thermal, vibration, shock, short circuit, impact, overcharge, forced discharge.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>IEC 62660:</strong> Cell-level performance and reliability for EV traction batteries. Parts 1 (performance), 2 (reliability), 3 (safety).</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>ISO 12405:</strong> Pack and system level. Parts 1-4 covering high power, high energy, lithium-titanate, performance tests.</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>GB/T 38031:</strong> China mandatory standard for EV battery safety. AIS-038: India mandatory for 2W/3W/4W EV batteries.</p>'
  },
  'dcir-testing': {
    title: 'DCIR and Impedance Testing',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">HPPC methodology</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px">DCIR is measured using the Hybrid Pulse Power Characterisation (HPPC) test. A current pulse (typically 1C or 2C) is applied for 10 seconds. DCIR = delta-V / delta-I. Measured across multiple SoC points (10%-90%) and temperatures (-20°C to 45°C) to build the full DCIR map.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px">DCIR at BoL (Beginning of Life) and EoL (End of Life) are both spec items. EoL DCIR is typically 1.5-2x BoL.</p><p style="font-size:12px;color:#3a567a;line-height:1.7">Use the DCIR Map sheet to upload your cell supplier data and visualise resistance across temperature and SoC.</p>'
  },
  'abuse-testing': {
    title: 'Abuse Testing',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Critical abuse tests for EV batteries</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Nail penetration:</strong> Simulates internal short circuit. A steel nail (dia 3-8mm) is driven through the cell at defined speed. Pass criterion: no fire, no explosion (venting allowed).</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Overcharge:</strong> Cell or pack charged to 1.5x rated voltage at specified C-rate. Tests against lithium plating and separator failure.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Thermal runaway propagation:</strong> For pack level, one cell is triggered (heater or nail) and the test verifies the pack design contains propagation or gives sufficient warning time.</p><p style="font-size:12px;color:#3a567a;line-height:1.7">Standards: SAE J2464, IEC 62619, GB/T 38031 (China), UN 38.3 Test T.6 (crush).</p>'
  },
  'sizing-guide': {
    title: 'Pack Sizing Calculations',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Worked example</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Given:</strong> Cell: LFP 3.2V nom, 120Ah, 2800g. Target: 350V nominal, 60kWh usable, DoD 90%.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Step 1 - Series count:</strong> S = V_pack / V_cell = 350 / 3.2 = 109.4 → round to 110 cells. V_nom = 110 x 3.2 = 352V.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Step 2 - Parallel count:</strong> E_per_string = 110 x 120Ah x 3.2V / 1000 = 42.2 kWh. Usable = 42.2 x 0.9 = 38kWh. Need 60kWh usable → P = ceil(60 / 38) = 2 strings. E_gross = 2 x 42.2 = 84.4 kWh.</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>Step 3 - Mass:</strong> 110 x 2 x 2800g = 616 kg cells. Add housing/BMS/cooling (+15%) = ~710 kg total pack.</p>'
  },
  'lifecycle-guide': {
    title: 'Lifecycle and Degradation',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Aging mechanisms</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Cycle aging:</strong> Each charge-discharge cycle causes SEI layer growth (capacity fade) and lithium plating at low temperatures (impedance rise). Higher C-rates and wider SoC windows accelerate degradation.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>Calendar aging:</strong> Time at high SoC and high temperature is the primary driver. Storing at 50% SoC and below 30°C significantly extends calendar life.</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>EoL criteria:</strong> Typically 80% retained capacity (SoH = 80%) and/or DCIR &lt; 2x BoL value. The Lifecycle sheet models SoH vs cycles and autonomy vs years using your project parameters.</p>'
  },
  'cost-guide': {
    title: 'Battery Cost Engineering',
    body: '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Cost breakdown</h3><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px">Cell cost is typically 60-70% of total pack cost. At scale (GWh), LFP cells are $60-80/kWh, NMC cells $80-100/kWh. Pack-level cost adds BMS, thermal system, housing, wiring, connectors, and assembly.</p><p style="font-size:12px;color:#3a567a;line-height:1.7;margin-bottom:10px"><strong>$/kWh targets (2025):</strong> Cell-level: $70-90/kWh. Pack-level: $100-130/kWh for high volume EV. Off-highway and low volume packs: $150-250/kWh.</p><p style="font-size:12px;color:#3a567a;line-height:1.7"><strong>TCO (Total Cost of Ownership)</strong> includes energy cost per km, maintenance savings vs ICE, battery replacement probability at vehicle EoL. Use the Business and Cost sheet for a full BOM and TCO breakdown.</p>'
  }
};

window.upskillOpen = function(id) {
  var data = UPSKILL_CONTENT[id];
  if (!data) return;
  var detail = document.getElementById('upskill-detail');
  var body   = document.getElementById('upskill-detail-body');
  if (!detail || !body) return;
  body.innerHTML = data.body;
  detail.style.display = 'block';
  detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
