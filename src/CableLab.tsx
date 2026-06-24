import React, { useState, useEffect, useMemo } from 'react';
import { getLabTheme } from './labTheme';

const FW = 560, FH = 180, FCY = 90;

// Triangle wave — simulates light reflecting off fiber core/cladding boundary
function triWave(x: number, amp: number, period: number): number {
  const t = (((x % period) + period) % period) / period;
  if (t < 0.25) return amp * t * 4;
  if (t < 0.75) return amp * (2 - t * 4);
  return amp * (t * 4 - 4);
}

function makePath(amp: number, period: number, n = 320): string {
  return Array.from({ length: n }, (_, i) => {
    const x = (i / (n - 1)) * FW;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(FCY + triWave(x, amp, period)).toFixed(1)}`;
  }).join(' ');
}

interface CableLabProps { isDarkMode?: boolean; }
type CableStandard = '568B' | '568A' | 'crossover' | 'SMF' | 'MMF';

export const CableLab: React.FC<CableLabProps> = ({ isDarkMode = true }) => {
  const [activeMedium, setActiveMedium] = useState<CableStandard>('568B');
  const [wavePhase, setWavePhase] = useState(0);
  const [testResult, setTestResult] = useState('Ready — select a cable type and run a test.');
  const [isTesting, setIsTesting] = useState(false);
  const T = getLabTheme(isDarkMode);

  useEffect(() => {
    const id = setInterval(() => setWavePhase(p => (p + 0.2) % (Math.PI * 2)), 40);
    return () => clearInterval(id);
  }, []);

  // Static fiber ray paths — computed once, never change
  const fiberPaths = useMemo(() => ({
    axial: `M 0 ${FCY} L ${FW} ${FCY}`,
    mode1: makePath(14, 220),
    mode2: makePath(22, 130),
  }), []);

  const pinouts = {
    '568B': [
      { pin:1, name:'White/Orange', role:'Tx+', bg:'linear-gradient(90deg,#fff 30%,#f97316 30%,#f97316 70%,#fff 70%)' },
      { pin:2, name:'Orange',       role:'Tx−', bg:'#f97316' },
      { pin:3, name:'White/Green',  role:'Rx+', bg:'linear-gradient(90deg,#fff 30%,#22c55e 30%,#22c55e 70%,#fff 70%)' },
      { pin:4, name:'Blue',         role:'PoE', bg:'#3b82f6' },
      { pin:5, name:'White/Blue',   role:'PoE', bg:'linear-gradient(90deg,#fff 30%,#3b82f6 30%,#3b82f6 70%,#fff 70%)' },
      { pin:6, name:'Green',        role:'Rx−', bg:'#22c55e' },
      { pin:7, name:'White/Brown',  role:'PoE', bg:'linear-gradient(90deg,#fff 30%,#78350f 30%,#78350f 70%,#fff 70%)' },
      { pin:8, name:'Brown',        role:'PoE', bg:'#78350f' },
    ],
    '568A': [
      { pin:1, name:'White/Green',  role:'Tx+', bg:'linear-gradient(90deg,#fff 30%,#22c55e 30%,#22c55e 70%,#fff 70%)' },
      { pin:2, name:'Green',        role:'Tx−', bg:'#22c55e' },
      { pin:3, name:'White/Orange', role:'Rx+', bg:'linear-gradient(90deg,#fff 30%,#f97316 30%,#f97316 70%,#fff 70%)' },
      { pin:4, name:'Blue',         role:'PoE', bg:'#3b82f6' },
      { pin:5, name:'White/Blue',   role:'PoE', bg:'linear-gradient(90deg,#fff 30%,#3b82f6 30%,#3b82f6 70%,#fff 70%)' },
      { pin:6, name:'Orange',       role:'Rx−', bg:'#f97316' },
      { pin:7, name:'White/Brown',  role:'PoE', bg:'linear-gradient(90deg,#fff 30%,#78350f 30%,#78350f 70%,#fff 70%)' },
      { pin:8, name:'Brown',        role:'PoE', bg:'#78350f' },
    ],
  };

  const specs: Record<CableStandard, { title:string; desc:string; use:string }> = {
    '568B': { title:'TIA-568B Straight-Through', desc:'The standard wiring used in most enterprise networks today. Both ends use the same pin order — identical on each connector.', use:'Connects unlike devices: host NIC to switch port, router to switch.' },
    '568A': { title:'TIA-568A Straight-Through', desc:'An alternative pin order that swaps the orange and green wire pairs. Electrically identical to 568B — just a different colour sequence.', use:'Used in some residential or government installations for legacy compatibility.' },
    'crossover': { title:'MDI/MDI-X Crossover', desc:'One end follows 568A, the other 568B. This crosses the transmit pins on one side to the receive pins on the other, removing the need for a switch between two alike devices.', use:'Directly connects like devices: switch to switch, or host to host. Gigabit ports with Auto-MDIX do this automatically in hardware.' },
    'SMF': { title:'Single-Mode Fibre (SMF)', desc:'A 9 µm glass core that guides a single laser path with minimal dispersion. Identified by a yellow (OS2) outer jacket. Light wavelengths are 1310 nm or 1550 nm, launched by a coherent laser diode.', use:'Long-haul runs — ISP backbone, campus inter-building links, tens of kilometres without regeneration.' },
    'MMF': { title:'Multi-Mode Fibre (MMF)', desc:'A 50 µm glass core that carries multiple light paths simultaneously, each bouncing at a slightly different angle. Identified by an aqua (OM3/OM4) or orange (OM1/OM2) jacket. Cheaper transceivers, shorter distances.', use:'Intra-building data centre links, patch runs under 300–550 m at 10–40 Gbps (OM3/OM4).' },
  };

  const runTest = () => {
    setIsTesting(true);
    setTestResult('Sending test signal...');
    setTimeout(() => {
      setIsTesting(false);
      const results: Record<CableStandard, string> = {
        '568B':     'PASS — pins 1→1, 2→2, 3→3, 6→6 verified. Straight-through. Switch-to-host link confirmed.',
        '568A':     'PASS — pins 1→1, 2→2, 3→3, 6→6 verified. Straight-through (568A). Valid link.',
        'crossover':'PASS — pin 1 crossed to pin 3, pin 2 crossed to pin 6. MDI/MDI-X crossover. Host-to-host link confirmed.',
        'SMF':      'PASS — 1310 nm laser signal received. Attenuation: −0.9 dBm over 8 km. No modal dispersion. SMF link verified.',
        'MMF':      'PASS — 850 nm VCSEL signal received. Modal dispersion within OM4 limits (< 0.1 ps/nm·km). Link confirmed at 25 Gbps / 100 m.',
      };
      setTestResult(results[activeMedium]);
    }, 900);
  };

  const isCopper = activeMedium === '568B' || activeMedium === '568A' || activeMedium === 'crossover';
  const roleColor = (role: string) => role.startsWith('Tx') ? T.accent : role.startsWith('Rx') ? T.success : T.textMuted;

  // Animated dot positions for fiber (recomputed every frame)
  const prog = (speed: number, add = 0) =>
    (((wavePhase * speed / (Math.PI * 2)) + add) % 1 + 1) % 1;

  // SMF: 2 pulses, same speed, offset by 0.5 (always one entering as other exits)
  const s1x = prog(1.0, 0.0) * FW, s2x = prog(1.0, 0.5) * FW;

  // MMF: 2 pulses per ray at slightly different speeds (mode 2 travels longer path)
  const ax1x = prog(1.00, 0.0) * FW, ax2x = prog(1.00, 0.5) * FW;
  const m1ax = prog(0.87, 0.0) * FW, m1bx = prog(0.87, 0.5) * FW;
  const m2ax = prog(0.73, 0.0) * FW, m2bx = prog(0.73, 0.5) * FW;
  const m1ay = FCY + triWave(m1ax, 14, 220), m1by = FCY + triWave(m1bx, 14, 220);
  const m2ay = FCY + triWave(m2ax, 22, 130), m2by = FCY + triWave(m2bx, 22, 130);

  const coreGlowR = 0.5 + Math.abs(Math.sin(wavePhase)) * 0.5;

  const renderFiber = () => {
    const isSMF = activeMedium === 'SMF';
    const jacketColor = isSMF ? '#ca8a04' : '#0e7490';
    const coreColor   = isSMF ? '#fbbf24' : '#22d3ee';
    const coreY = isSMF ? 86 : 65;
    const coreH = isSMF ? 8 : 50;
    const cladFill = isDarkMode ? '#1e2a3a' : '#cbd5e1';

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

        {/* ── Side propagation view ── */}
        <div style={{ backgroundColor:'#010409', borderRadius:'8px', border:`1px solid ${T.borderColor}`, overflow:'hidden', lineHeight:0 }}>
          <svg viewBox={`0 0 ${FW} ${FH}`} style={{ width:'100%', display:'block' }}>

            {/* Jacket tint */}
            <rect x={0} y={0} width={FW} height={FH} fill={jacketColor} opacity={0.07} />

            {/* Cladding region */}
            <rect x={0} y={20} width={FW} height={FH-40} fill={cladFill} opacity={isDarkMode?0.28:0.22} />
            <line x1={0} y1={20}    x2={FW} y2={20}    stroke={T.borderColor} strokeWidth={1} strokeDasharray="5 4" />
            <line x1={0} y1={FH-20} x2={FW} y2={FH-20} stroke={T.borderColor} strokeWidth={1} strokeDasharray="5 4" />

            {/* Core region */}
            <rect x={0} y={coreY} width={FW} height={coreH} fill={coreColor} opacity={0.1} />
            <line x1={0} y1={coreY}        x2={FW} y2={coreY}        stroke={coreColor} strokeWidth={1.5} opacity={0.65} />
            <line x1={0} y1={coreY+coreH}  x2={FW} y2={coreY+coreH} stroke={coreColor} strokeWidth={1.5} opacity={0.65} />

            {/* Labels */}
            <text x={6} y={14}       fill={jacketColor} fontSize={9} fontFamily="monospace" fontWeight="700" opacity={0.85}>{isSMF ? 'OS2 · Yellow jacket · 9/125 µm' : 'OM4 · Aqua jacket · 50/125 µm'}</text>
            <text x={6} y={34}       fill={isDarkMode?'#475569':'#94a3b8'} fontSize={8} fontFamily="monospace">125 µm glass cladding</text>
            <text x={6} y={coreY-4}  fill={coreColor} fontSize={8} fontFamily="monospace" fontWeight="700">{isSMF ? '9 µm core — single transverse mode' : '50 µm core — multiple propagation modes'}</text>
            <text x={6} y={FH-7}     fill={isDarkMode?'#475569':'#94a3b8'} fontSize={8} fontFamily="monospace">125 µm glass cladding</text>

            {/* ── Light ── */}
            {isSMF ? (
              <>
                {/* Static dim centerline */}
                <line x1={0} y1={FCY} x2={FW} y2={FCY} stroke={coreColor} strokeWidth={1} opacity={0.15} />
                {/* Pulse 1 */}
                <ellipse cx={s1x} cy={FCY} rx={22} ry={3.5} fill={coreColor} opacity={0.2} />
                <ellipse cx={s1x} cy={FCY} rx={10} ry={2.5} fill={coreColor} opacity={0.5} />
                <circle  cx={s1x} cy={FCY} r={2.5} fill="#ffffff" />
                {/* Pulse 2 */}
                <ellipse cx={s2x} cy={FCY} rx={22} ry={3.5} fill={coreColor} opacity={0.2} />
                <ellipse cx={s2x} cy={FCY} rx={10} ry={2.5} fill={coreColor} opacity={0.5} />
                <circle  cx={s2x} cy={FCY} r={2.5} fill="#ffffff" />
              </>
            ) : (
              <>
                {/* Axial mode (cyan) */}
                <path d={fiberPaths.axial} stroke="#22d3ee" strokeWidth={4} opacity={0.1} fill="none" />
                <path d={fiberPaths.axial} stroke="#22d3ee" strokeWidth={1.5} opacity={0.5} fill="none" />
                <ellipse cx={ax1x} cy={FCY} rx={14} ry={2.5} fill="#22d3ee" opacity={0.3} />
                <circle  cx={ax1x} cy={FCY} r={3} fill="#22d3ee" />
                <ellipse cx={ax2x} cy={FCY} rx={14} ry={2.5} fill="#22d3ee" opacity={0.3} />
                <circle  cx={ax2x} cy={FCY} r={3} fill="#22d3ee" />

                {/* Low-order mode (amber) */}
                <path d={fiberPaths.mode1} stroke="#f59e0b" strokeWidth={4} opacity={0.1} fill="none" />
                <path d={fiberPaths.mode1} stroke="#f59e0b" strokeWidth={1.5} opacity={0.48} fill="none" />
                <ellipse cx={m1ax} cy={m1ay} rx={12} ry={2.5} fill="#f59e0b" opacity={0.3} />
                <circle  cx={m1ax} cy={m1ay} r={3} fill="#f59e0b" />
                <ellipse cx={m1bx} cy={m1by} rx={12} ry={2.5} fill="#f59e0b" opacity={0.3} />
                <circle  cx={m1bx} cy={m1by} r={3} fill="#f59e0b" />

                {/* High-order mode (rose) */}
                <path d={fiberPaths.mode2} stroke="#f43f5e" strokeWidth={4} opacity={0.1} fill="none" />
                <path d={fiberPaths.mode2} stroke="#f43f5e" strokeWidth={1.5} opacity={0.45} fill="none" />
                <ellipse cx={m2ax} cy={m2ay} rx={12} ry={2.5} fill="#f43f5e" opacity={0.3} />
                <circle  cx={m2ax} cy={m2ay} r={3} fill="#f43f5e" />
                <ellipse cx={m2bx} cy={m2by} rx={12} ry={2.5} fill="#f43f5e" opacity={0.3} />
                <circle  cx={m2bx} cy={m2by} r={3} fill="#f43f5e" />

                {/* Legend box */}
                <rect x={FW-178} y={8} width={172} height={50} fill="rgba(0,0,0,0.55)" rx={4} />
                <circle cx={FW-165} cy={21} r={3.5} fill="#22d3ee" />
                <text x={FW-158} y={25} fill="#22d3ee" fontSize={8} fontFamily="monospace">Axial mode (fastest · 0° reflection)</text>
                <circle cx={FW-165} cy={33} r={3.5} fill="#f59e0b" />
                <text x={FW-158} y={37} fill="#f59e0b" fontSize={8} fontFamily="monospace">Low-order mode (~5° · −13% path)</text>
                <circle cx={FW-165} cy={45} r={3.5} fill="#f43f5e" />
                <text x={FW-158} y={49} fill="#f43f5e" fontSize={8} fontFamily="monospace">High-order mode (~9° · −27% · slowest)</text>
              </>
            )}
          </svg>
        </div>

        {/* ── Bottom row: end-on cross section + specs ── */}
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-start' }}>

          {/* End-on cross section */}
          <div style={{ backgroundColor:'#010409', borderRadius:'8px', border:`1px solid ${T.borderColor}`, padding:'0.7rem', flexShrink:0, textAlign:'center' }}>
            <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted, fontWeight:700, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.06em' }}>End-on view</div>
            <svg viewBox="0 0 120 120" width={110} height={110} style={{ display:'block' }}>
              {/* Jacket */}
              <circle cx={60} cy={60} r={54} fill={jacketColor} opacity={0.18} />
              <circle cx={60} cy={60} r={54} fill="none" stroke={jacketColor} strokeWidth={2} opacity={0.7} />
              {/* Buffer coating */}
              <circle cx={60} cy={60} r={48} fill="none" stroke={isDarkMode?'#334155':'#94a3b8'} strokeWidth={1} opacity={0.4} />
              {/* Cladding */}
              <circle cx={60} cy={60} r={44} fill={cladFill} opacity={isDarkMode?0.5:0.4} />
              <circle cx={60} cy={60} r={44} fill="none" stroke={isDarkMode?'#334155':'#94a3b8'} strokeWidth={1} opacity={0.5} />
              {/* Core */}
              {(() => {
                const cr = isSMF ? 3.2 : 17.6;
                return (
                  <>
                    <circle cx={60} cy={60} r={cr} fill={coreColor} opacity={0.35} />
                    <circle cx={60} cy={60} r={cr * coreGlowR} fill={coreColor} opacity={0.55} />
                    <circle cx={60} cy={60} r={cr} fill="none" stroke={coreColor} strokeWidth={1.5} />
                    <text x={60} y={60} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={isSMF?6:9} fontFamily="monospace" fontWeight="700">{isSMF?'9':'50'}µm</text>
                  </>
                );
              })()}
              {/* Diameter labels */}
              <line x1={14} y1={60} x2={46} y2={60} stroke={isDarkMode?'#334155':'#94a3b8'} strokeWidth={1} opacity={0.6} />
              <text x={6} y={63} fill={isDarkMode?'#475569':'#94a3b8'} fontSize={7} fontFamily="monospace">125</text>
              <text x={60} y={114} textAnchor="middle" fill={jacketColor} fontSize={7} fontFamily="monospace" fontWeight="700" opacity={0.85}>{isSMF?'OS2 yellow':'OM4 aqua'}</text>
            </svg>
          </div>

          {/* Specs grid */}
          <div style={{ flex:'1 1 200px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px', alignContent:'start' }}>
            {(isSMF ? [
              ['Core / Cladding',  '9 / 125 µm'],
              ['Wavelengths',      '1310 nm · 1550 nm'],
              ['Light source',     'Laser diode (coherent)'],
              ['Attenuation',      '< 0.4 dB/km'],
              ['Max distance',     '40 – 100+ km'],
              ['Connectors',       'LC, SC, MTP/MPO'],
              ['Dispersion',       'None (single mode)'],
              ['Standard',         'ITU-T G.652 / OS2'],
            ] : [
              ['Core / Cladding',  '50 / 125 µm'],
              ['Wavelengths',      '850 nm · 1300 nm'],
              ['Light source',     'VCSEL / LED'],
              ['Attenuation',      '< 3.0 dB/km'],
              ['Max dist (10G)',   '300 m OM3 · 550 m OM4'],
              ['Connectors',       'LC, SC, MPO'],
              ['Dispersion',       'Modal (limits distance)'],
              ['Standard',         'OM3 = TIA-492AAAC'],
            ] as [string,string][]).map(([label,value]) => (
              <div key={label} style={{ backgroundColor:T.insetBg, padding:'5px 8px', borderRadius:'5px', border:T.border }}>
                <div style={{ fontSize:'0.58rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', marginBottom:2, letterSpacing:'0.04em' }}>{label}</div>
                <div style={{ fontSize:'0.7rem', fontFamily:'monospace', color:T.textPrimary, fontWeight:600 }}>{value}</div>
              </div>
            ))}
          </div>

        </div>

        {/* Dispersion note (MMF only) */}
        {!isSMF && (
          <div style={{ backgroundColor:T.dangerSubtle, border:`1px solid ${T.borderColor}`, borderLeft:`4px solid ${T.warning}`, borderRadius:'6px', padding:'0.75rem 1rem', fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.5 }}>
            <strong style={{ color:T.warning }}>Modal dispersion:</strong> The three ray paths above travel different total distances. High-order modes (rose) bounce more steeply and cover more path length, arriving later than the axial mode (cyan). Over distance, this time smear widens the received pulse — this is modal dispersion, and it is why MMF is limited to short runs. OM4 uses a graded-index core (denser glass at centre) to partially compensate.
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding:'2rem', backgroundColor:T.cardBg, borderRadius:'12px', border:T.border, color:T.textPrimary, fontFamily:'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:T.border, flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h3 style={{ fontSize:'1.25rem', fontWeight:700, margin:0 }}>Physical Media & Cabling</h3>
          <p style={{ color:T.textSecondary, margin:'4px 0 0', fontSize:'0.875rem' }}>
            Copper pinout diagrams, crossover wiring, and animated fibre optic propagation.
          </p>
        </div>
        <div style={{ display:'flex', backgroundColor:T.panelBg, padding:'3px', borderRadius:'8px', border:T.border, flexWrap:'wrap', gap:'2px' }}>
          {(['568B','568A','crossover','SMF','MMF'] as CableStandard[]).map(s => (
            <button key={s} type="button" onClick={() => { setActiveMedium(s); setTestResult('Ready — run a test to verify this cable type.'); }}
              style={{ padding:'6px 10px', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:600, fontSize:'0.78rem', backgroundColor:activeMedium===s?T.accent:'transparent', color:activeMedium===s?'#fff':T.textSecondary, transition:'all 0.12s' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>

        {/* Visual canvas */}
        <div style={{ flex:'1 1 420px', backgroundColor:T.insetBg, borderRadius:'12px', padding:'1.25rem', border:T.border, display:'flex', flexDirection:'column', gap:'1rem' }}>
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {isCopper ? 'RJ45 Pin Map' : activeMedium === 'SMF' ? 'SMF — single-mode propagation' : 'MMF — multi-mode propagation (modal dispersion)'}
          </span>

          {isCopper && (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {(activeMedium === 'crossover' ? pinouts['568A'] : pinouts[activeMedium as '568B'|'568A']).map(w => (
                <div key={w.pin} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:'monospace', fontSize:'0.7rem', color:T.textMuted, width:38, fontWeight:700 }}>Pin {w.pin}</span>
                  <div style={{ flex:1, height:18, background:w.bg, borderRadius:3, border:`1px solid ${T.borderColor}`, display:'flex', alignItems:'center', paddingLeft:8 }}>
                    <span style={{ fontSize:'0.6rem', fontWeight:700, backgroundColor:'rgba(255,255,255,0.85)', color:'#111', padding:'1px 4px', borderRadius:2 }}>{w.name}</span>
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:'0.65rem', fontWeight:700, color:roleColor(activeMedium==='crossover'?(w.pin===1||w.pin===2?'Rx':w.pin===3||w.pin===6?'Tx':'PoE'):w.role), width:40, textAlign:'right' }}>
                    {activeMedium==='crossover'?(w.pin===1||w.pin===2?'Rx+/−':w.pin===3||w.pin===6?'Tx+/−':'PoE'):w.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isCopper && renderFiber()}

          <button type="button" onClick={runTest} disabled={isTesting}
            style={{ width:'100%', padding:'0.7rem', borderRadius:'6px', border:'none', backgroundColor:T.success, color:'#fff', fontWeight:700, cursor:isTesting?'not-allowed':'pointer', opacity:isTesting?0.6:1, fontSize:'0.875rem', marginTop:'auto', flexShrink:0 }}>
            {isTesting ? 'Testing...' : 'Run Continuity Test'}
          </button>
        </div>

        {/* Info panel */}
        <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div style={{ backgroundColor:T.panelBg, padding:'1.25rem', borderRadius:'12px', border:T.border }}>
            <h4 style={{ margin:'0 0 8px', fontSize:'1rem', fontWeight:700, color:T.accent }}>{specs[activeMedium].title}</h4>
            <p style={{ margin:'0 0 1rem', fontSize:'0.85rem', color:T.textSecondary, lineHeight:'1.6' }}>{specs[activeMedium].desc}</p>
            <div style={{ padding:'10px 12px', backgroundColor:T.accentSubtle, border:`1px solid ${T.borderColor}`, borderRadius:'4px', fontSize:'0.8rem', color:T.textSecondary, lineHeight:'1.5' }}>
              <strong style={{ color:T.accent }}>Typical use:</strong> {specs[activeMedium].use}
            </div>
          </div>

          <div style={{ backgroundColor:T.termBg, padding:'1rem', borderRadius:'8px', border:`1px solid ${T.termBorder}`, flexGrow:1 }}>
            <span style={{ fontSize:'0.7rem', fontFamily:'monospace', color:T.termMuted, display:'block', borderBottom:`1px solid ${T.termBorder}`, paddingBottom:'4px', marginBottom:'8px', fontWeight:700 }}>Test output</span>
            <div style={{ fontFamily:'monospace', fontSize:'0.82rem', color:isTesting?T.warning:testResult.startsWith('PASS')?T.termText:T.textSecondary, lineHeight:'1.6' }}>
              {testResult}
            </div>
          </div>
        </div>

      </div>

      {/* Theory */}
      <div style={{ borderTop:T.border, paddingTop:'1.25rem', marginTop:'1.5rem', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1rem' }}>
        <div>
          <h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.accent }}>Auto-MDIX</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.82rem', lineHeight:'1.6' }}>Gigabit Ethernet ports automatically detect whether a crossover is needed and reconfigure their TX/RX pairs in hardware — no special crossover cable required. On older 100 Mbps ports this had to be done manually.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.success }}>Modal dispersion</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.82rem', lineHeight:'1.6' }}>In MMF, different light paths arrive at slightly different times, smearing the signal — this is modal dispersion. SMF eliminates it by forcing all light down a single path (9 µm core too narrow for higher-order modes). That is why SMF spans 40–100 km while OM4 MMF tops out at ~550 m at 10 Gbps.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.warning }}>Wavelengths & transceivers</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.82rem', lineHeight:'1.6' }}>SMF uses 1310 nm (short-range) or 1550 nm (long-haul) laser light — chosen because silica glass has attenuation dips at those wavelengths. MMF uses 850 nm VCSELs (cheap, fast to modulate) or 1300 nm LEDs. Transceivers must match the fiber type: SFP+ SR for MMF, LR for SMF.</p>
        </div>
      </div>

    </div>
  );
};

export default CableLab;
