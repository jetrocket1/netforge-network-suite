import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';

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

  const pinouts = {
    '568B': [
      { pin: 1, name: 'White/Orange', role: 'Tx+', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#f97316 30%,#f97316 70%,#fff 70%)' },
      { pin: 2, name: 'Orange',       role: 'Tx−', bg: '#f97316' },
      { pin: 3, name: 'White/Green',  role: 'Rx+', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#22c55e 30%,#22c55e 70%,#fff 70%)' },
      { pin: 4, name: 'Blue',         role: 'PoE', bg: '#3b82f6' },
      { pin: 5, name: 'White/Blue',   role: 'PoE', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#3b82f6 30%,#3b82f6 70%,#fff 70%)' },
      { pin: 6, name: 'Green',        role: 'Rx−', bg: '#22c55e' },
      { pin: 7, name: 'White/Brown',  role: 'PoE', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#78350f 30%,#78350f 70%,#fff 70%)' },
      { pin: 8, name: 'Brown',        role: 'PoE', bg: '#78350f' },
    ],
    '568A': [
      { pin: 1, name: 'White/Green',  role: 'Tx+', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#22c55e 30%,#22c55e 70%,#fff 70%)' },
      { pin: 2, name: 'Green',        role: 'Tx−', bg: '#22c55e' },
      { pin: 3, name: 'White/Orange', role: 'Rx+', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#f97316 30%,#f97316 70%,#fff 70%)' },
      { pin: 4, name: 'Blue',         role: 'PoE', bg: '#3b82f6' },
      { pin: 5, name: 'White/Blue',   role: 'PoE', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#3b82f6 30%,#3b82f6 70%,#fff 70%)' },
      { pin: 6, name: 'Orange',       role: 'Rx−', bg: '#f97316' },
      { pin: 7, name: 'White/Brown',  role: 'PoE', bg: 'linear-gradient(90deg,#fff 0%,#fff 30%,#78350f 30%,#78350f 70%,#fff 70%)' },
      { pin: 8, name: 'Brown',        role: 'PoE', bg: '#78350f' },
    ],
  };

  const specs: Record<CableStandard, { title: string; desc: string; use: string }> = {
    '568B': {
      title: 'TIA-568B Straight-Through',
      desc: 'The standard wiring used in most enterprise networks today. Both ends of the cable use the same pin order — identical on each connector.',
      use: 'Connects unlike devices: host NIC to switch port, router to switch.',
    },
    '568A': {
      title: 'TIA-568A Straight-Through',
      desc: 'An alternative pin order that swaps the orange and green wire pairs. Electrically identical to 568B — just a different colour sequence.',
      use: 'Used in some residential or government installations for legacy compatibility.',
    },
    'crossover': {
      title: 'MDI/MDI-X Crossover',
      desc: 'One end follows 568A, the other follows 568B. This crosses the transmit pins on one side to the receive pins on the other, removing the need for a switch in between.',
      use: 'Directly connects like devices: switch to switch, or host to host. Gigabit ports with Auto-MDIX do this automatically in hardware.',
    },
    'SMF': {
      title: 'Single-Mode Fibre (SMF)',
      desc: 'A ~9 µm glass core that guides a single laser path with minimal dispersion. Identified by a yellow outer jacket.',
      use: 'Long-haul runs — ISP backbone, campus inter-building links, tens of kilometres without regeneration.',
    },
    'MMF': {
      title: 'Multi-Mode Fibre (MMF)',
      desc: 'A ~50 µm glass core that carries multiple light paths simultaneously. Identified by an aqua or orange jacket. Cheaper transceivers, shorter distances.',
      use: 'Intra-building data centre links, patch runs under 550 m at 10 Gbps (OM3/OM4).',
    },
  };

  const runTest = () => {
    setIsTesting(true);
    setTestResult('Sending test signal...');
    setTimeout(() => {
      setIsTesting(false);
      const results: Record<CableStandard, string> = {
        '568B': 'Pass — pins 1→1, 2→2, 3→3, 6→6 verified. Straight-through. Switch-to-host link confirmed.',
        '568A': 'Pass — pins 1→1, 2→2, 3→3, 6→6 verified. Straight-through (568A). Valid link.',
        'crossover': 'Pass — pin 1 crossed to pin 3, pin 2 crossed to pin 6. MDI/MDI-X crossover. Host-to-host link confirmed.',
        'SMF': 'Pass — 1310 nm laser signal received. Attenuation: −1.2 dBm. SMF long-haul path verified.',
        'MMF': 'Pass — 850 nm LED signal received. Modal dispersion within OM3 limits. MMF link confirmed at 10 Gbps.',
      };
      setTestResult(results[activeMedium]);
    }, 900);
  };

  const isCopper = activeMedium === '568B' || activeMedium === '568A' || activeMedium === 'crossover';
  const roleColor = (role: string) => role.startsWith('Tx') ? T.accent : role.startsWith('Rx') ? T.success : T.textMuted;

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Physical Media & Cabling</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
            Explore copper pinout diagrams, crossover wiring, and fibre optic propagation.
          </p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border, flexWrap: 'wrap', gap: '2px' }}>
          {(['568B','568A','crossover','SMF','MMF'] as CableStandard[]).map(s => (
            <button key={s} type="button" onClick={() => { setActiveMedium(s); setTestResult('Ready — run a test to verify this cable type.'); }}
              style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', backgroundColor: activeMedium === s ? T.accent : 'transparent', color: activeMedium === s ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Visual canvas */}
        <div style={{ flex: '1 1 360px', backgroundColor: T.insetBg, borderRadius: '12px', padding: '1.25rem', border: T.border, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 320 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {isCopper ? 'RJ45 Pin Map' : 'Optical waveguide cross-section'}
          </span>

          {isCopper && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(activeMedium === 'crossover' ? pinouts['568A'] : pinouts[activeMedium as '568B' | '568A']).map(w => (
                <div key={w.pin} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: T.textMuted, width: 38, fontWeight: 700 }}>Pin {w.pin}</span>
                  <div style={{ flex: 1, height: 18, background: w.bg, borderRadius: 3, border: `1px solid ${T.borderColor}`, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.85)', color: '#111', padding: '1px 4px', borderRadius: 2 }}>{w.name}</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700, color: roleColor(activeMedium === 'crossover' ? (w.pin === 1 || w.pin === 2 ? 'Rx' : w.pin === 3 || w.pin === 6 ? 'Tx' : 'PoE') : w.role), width: 40, textAlign: 'right' }}>
                    {activeMedium === 'crossover' ? (w.pin === 1 || w.pin === 2 ? 'Rx+/−' : w.pin === 3 || w.pin === 6 ? 'Tx+/−' : 'PoE') : w.role}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!isCopper && (
            <div style={{ position: 'relative', height: 170, backgroundColor: '#02040a', borderRadius: '8px', border: `1px solid ${T.borderColor}`, overflow: 'hidden' }}>
              <svg width="100%" height="100%">
                {/* Outer jacket */}
                <rect x="0" y="10" width="100%" height="150" fill={activeMedium === 'SMF' ? '#ca8a04' : '#0891b2'} opacity="0.12" />
                <text x="10" y="24" fill={activeMedium === 'SMF' ? '#ca8a04' : '#0891b2'} fontSize="9" fontFamily="monospace" fontWeight="700">
                  {activeMedium === 'SMF' ? 'Yellow jacket — OS2 Single-Mode' : 'Aqua jacket — OM3/OM4 Multi-Mode'}
                </text>

                {/* Cladding */}
                <rect x="0" y="35" width="100%" height="100" fill={isDarkMode ? '#1e293b' : '#e2e8f0'} opacity="0.4" />
                <line x1="0" y1="35" x2="100%" y2="35" stroke={T.borderColor} strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="135" x2="100%" y2="135" stroke={T.borderColor} strokeWidth="1" strokeDasharray="4 4" />
                <text x="10" y="48" fill={T.textMuted} fontSize="8" fontFamily="monospace">Glass cladding — 125 µm</text>

                {/* Core */}
                <rect x="0" y={activeMedium === 'SMF' ? 80 : 60} width="100%" height={activeMedium === 'SMF' ? 8 : 48} fill="rgba(255,255,255,0.06)" />
                <text x="10" y={activeMedium === 'SMF' ? 75 : 68} fill="#fff" fontSize="8" fontFamily="monospace" fontWeight="700">
                  {activeMedium === 'SMF' ? 'Core: 9 µm — single laser path' : 'Core: 50 µm — multiple light paths'}
                </text>

                {activeMedium === 'SMF' ? (
                  <g>
                    <line x1="0" y1="84" x2="100%" y2="84" stroke="#f43f5e" strokeWidth="2" />
                    <line x1="0" y1="84" x2="100%" y2="84" stroke="#fff" strokeWidth="0.6" opacity="0.7" />
                  </g>
                ) : (
                  <g fill="none" strokeWidth="1.5">
                    <path d={Array.from({ length: 12 }, (_,i) => `${i===0?'M':'L'} ${i*34} ${64+(i%2===0?0:42)}`).join(' ')} stroke="#ef4444" opacity="0.75" />
                    <path d={Array.from({ length: 10 }, (_,i) => `${i===0?'M':'L'} ${i*42} ${76+(i%2===0?30:-20)}`).join(' ')} stroke="#f59e0b" opacity="0.6" />
                    <path d={Array.from({ length: 15 }, (_,i) => `${i===0?'M':'L'} ${i*28} ${84+(Math.sin(i+wavePhase)*16)}`).join(' ')} stroke="#3b82f6" opacity="0.5" />
                  </g>
                )}
              </svg>
            </div>
          )}

          <button type="button" onClick={runTest} disabled={isTesting}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: 'none', backgroundColor: T.success, color: '#fff', fontWeight: 700, cursor: isTesting ? 'not-allowed' : 'pointer', opacity: isTesting ? 0.6 : 1, fontSize: '0.875rem', marginTop: 'auto' }}>
            {isTesting ? 'Testing...' : 'Run Continuity Test'}
          </button>
        </div>

        {/* Info panel */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: T.panelBg, padding: '1.25rem', borderRadius: '12px', border: T.border }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: T.accent }}>{specs[activeMedium].title}</h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: T.textSecondary, lineHeight: '1.6' }}>{specs[activeMedium].desc}</p>
            <div style={{ padding: '10px 12px', backgroundColor: T.accentSubtle, border: `1px solid ${T.borderColor}`, borderRadius: '4px', fontSize: '0.8rem', color: T.textSecondary, lineHeight: '1.5' }}>
              <strong style={{ color: T.accent }}>Typical use:</strong> {specs[activeMedium].use}
            </div>
          </div>

          <div style={{ backgroundColor: T.termBg, padding: '1rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, flexGrow: 1 }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.termMuted, display: 'block', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '8px', fontWeight: 700 }}>Test output</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: isTesting ? T.warning : testResult.startsWith('Pass') ? T.termText : T.textSecondary, lineHeight: '1.6' }}>
              {testResult}
            </div>
          </div>
        </div>

      </div>

      {/* Theory */}
      <div style={{ borderTop: T.border, paddingTop: '1.25rem', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.accent }}>Auto-MDIX</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>Gigabit Ethernet ports automatically detect whether a crossover is needed and reconfigure their TX/RX pairs in hardware — no special crossover cable required. On older 100 Mbps ports this had to be done manually with a physical crossover cable.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.success }}>Modal dispersion</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>In MMF, different light paths arrive at slightly different times, smearing the signal over distance — this is modal dispersion. SMF eliminates the problem by forcing all light down one path. That is why SMF can carry signals over 40 km while MMF tops out around 550 m at 10 Gbps.</p>
        </div>
      </div>

    </div>
  );
};

export default CableLab;
