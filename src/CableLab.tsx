import React, { useState, useEffect } from 'react';

interface CableLabProps {
  isDarkMode?: boolean;
}

type CableStandard = '568B' | '568A' | 'crossover' | 'SMF' | 'MMF';

export const CableLab: React.FC<CableLabProps> = ({ isDarkMode = true }) => {
  const [activeMedium, setActiveMedium] = useState<CableStandard>('568B');
  const [wavePhase, setWavePhase] = useState<number>(0);
  const [testResult, setTestResult] = useState<string>("Bench clear. Initialize cable infrastructure continuity test.");
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Animate optical laser wave propagation down fiber guides smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase(prev => (prev + 0.2) % (Math.PI * 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    toggleActiveBg: '#0284c7',
    terminalBg: '#05050a',
    terminalText: '#34d399',
    fwd: '#10b981',
    blk: '#ef4444',
    lst: '#eab308',
    accent: isDarkMode ? '#06b6d4' : '#0284c7'
  };

  const pinouts = {
    '568B': [
      { pin: 1, name: 'White/Orange', role: 'Tx+', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #ff6b00 25%, #ff6b00 50%, #fff 50%, #fff 75%, #ff6b00 75%)' },
      { pin: 2, name: 'Orange', role: 'Tx-', bg: '#ff6b00' },
      { pin: 3, name: 'White/Green', role: 'Rx+', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #10b981 25%, #10b981 50%, #fff 50%, #fff 75%, #10b981 75%)' },
      { pin: 4, name: 'Blue', role: 'PoE', bg: '#2563eb' },
      { pin: 5, name: 'White/Blue', role: 'PoE', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #2563eb 25%, #2563eb 50%, #fff 50%, #fff 75%, #2563eb 75%)' },
      { pin: 6, name: 'Green', role: 'Rx-', bg: '#10b981' },
      { pin: 7, name: 'White/Brown', role: 'PoE', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #78350f 25%, #78350f 50%, #fff 50%, #fff 75%, #78350f 75%)' },
      { pin: 8, name: 'Brown', role: 'PoE', bg: '#78350f' },
    ],
    '568A': [
      { pin: 1, name: 'White/Green', role: 'Tx+', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #10b981 25%, #10b981 50%, #fff 50%, #fff 75%, #10b981 75%)' },
      { pin: 2, name: 'Green', role: 'Tx-', bg: '#10b981' },
      { pin: 3, name: 'White/Orange', role: 'Rx+', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #ff6b00 25%, #ff6b00 50%, #fff 50%, #fff 75%, #ff6b00 75%)' },
      { pin: 4, name: 'Blue', role: 'PoE', bg: '#2563eb' },
      { pin: 5, name: 'White/Blue', role: 'PoE', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #2563eb 25%, #2563eb 50%, #fff 50%, #fff 75%, #2563eb 75%)' },
      { pin: 6, name: 'Orange', role: 'Rx-', bg: '#ff6b00' },
      { pin: 7, name: 'White/Brown', role: 'PoE', bg: 'linear-gradient(90deg, #fff 0%, #fff 25%, #78350f 25%, #78350f 50%, #fff 50%, #fff 75%, #78350f 75%)' },
      { pin: 8, name: 'Brown', role: 'PoE', bg: '#78350f' },
    ]
  };

  const mediumSpecs = {
    '568B': {
      title: 'TIA-568B Standard (Straight-Through)',
      desc: 'The industry-standard default mapping configuration for enterprise Local Area Networks. A straight-through patch cable runs identical pin terminations on both endpoints.',
      useCase: 'Connects devices operating at different layer boundaries, such as a workstation host NIC directly to an access switchport layer entry.'
    },
    '568A': {
      title: 'TIA-568A Standard (Straight-Through Alternative)',
      desc: 'An alternative standard pinout pattern favoring legacy residential infrastructure installations. It provides the exact same operational bandwidth as 568B but swaps the green and orange wire positions.',
      useCase: 'Used primarily to retain legacy telecom layout uniformities or older structured horizontal wiring fields.'
    },
    'crossover': {
      title: 'MDI / MDI-X Crossover Configuration',
      desc: 'A custom alignment where endpoint Side A uses TIA-568A rules and Side B maps to TIA-568B specifications. This directly links one side\'s Transmit (Tx) path onto the opposing Receive (Rx) interface.',
      useCase: 'Bridges identical layer infrastructure components together directly without a middle switch—such as Switch-to-Switch cascading or PC-to-PC setups.'
    },
    'SMF': {
      title: 'Single-mode Fiber Optic (SMF)',
      desc: 'Features a tiny optical core (~9 microns) wrapped in a standard yellow jacket built to guide a single, direct laser pathway straight down the line axis, wiping out modal dispersion bottlenecks entirely.',
      useCase: 'Long-haul core backplane campus uplinks, internet service provider trunk lines, and multi-kilometer high-speed runs.'
    },
    'MMF': {
      title: 'Multi-mode Fiber Optic (MMF)',
      desc: 'Employs a wide core diameter (~50 microns) inside a distinct aqua jacket along which light from lower-cost LED sources bounces in multi-angle reflective paths down the internal cladding borders.',
      useCase: 'Intra-building equipment rack patch networks, localized server farm configurations, and distances under 550 meters.'
    }
  };

  const runContinuityTest = () => {
    setIsTesting(true);
    setTestResult("⚡ TRANSMITTING PIN CONTINUITY PULSE: Reading layer media transmission limits... ");
    
    setTimeout(() => {
      setIsTesting(false);
      switch(activeMedium) {
        case '568B':
          setTestResult("SUCCESS: Pins [1➔1, 2➔2, 3➔3, 6➔6] verify fully locked. Type: TIA-568B Straight-Through. Valid link for Switch-to-Host pipelines.");
          break;
        case '568A':
          setTestResult("SUCCESS: Pins [1➔1, 2➔2, 3➔3, 6➔6] verify fully locked. Type: TIA-568A Straight-Through Alternative. Valid residential continuity path.");
          break;
        case 'crossover':
          setTestResult("SUCCESS: Pin 1 mapped onto Pin 3, Pin 2 mapped onto Pin 6. Type: MDI/MDI-X Hardware Crossover. Signal paths verified for direct host-to-host links.");
          break;
        case 'SMF':
          setTestResult("OPTICAL FEEDBACK: Coherent narrow 1310nm laser beam verified at transceiver target core. Signal attenuation level: -1.2 dBm (Excellent long-haul SMF metric).");
          break;
        case 'MMF':
          setTestResult("OPTICAL FEEDBACK: Refractive 850nm LED multiple light rays detected at receptor diode. Modal dispersion inside constraints. Total MMF bandwidth: 10 Gbps (Under 300 meters).");
          break;
      }
    }, 1000);
  };

  const isCopper = activeMedium === '568B' || activeMedium === '568A' || activeMedium === 'crossover';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', backgroundColor: styles.panelBg, borderRadius: '16px', border: styles.panelBorder, color: styles.textPrimary }}>
      
      {/* Top Header Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>🔌 Layer 1 Cable Termination &amp; Physical Media Lab</h3>
          <p style={{ color: styles.descText, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Deconstruct copper twisted-pair color-code pinouts, parse internal core specifications, and analyze structural fiber optics.</p>
        </div>

        {/* Media Selector Toggles */}
        <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '8px', border: styles.panelBorder, flexWrap: 'wrap', gap: '2px' }}>
          {(Object.keys(mediumSpecs) as CableStandard[]).map(std => (
            <button key={std} type="button" onClick={() => { setActiveMedium(std); setTestResult("Bench clear. Initialize cable infrastructure continuity test."); }} style={{ padding: '6px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: activeMedium === std ? styles.toggleActiveBg : 'transparent', color: activeMedium === std ? '#ffffff' : styles.descText }}>{std}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        
        {/* LEFT COLUMN: VISUAL ENGINE CANVAS */}
        <div style={{ flex: '1 1 380px', backgroundColor: '#070a13', borderRadius: '12px', padding: '1.5rem', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '340px' }}>
          
          {isCopper ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.6rem', fontFamily: 'monospace', color: '#475569', fontWeight: 'bold' }}>
                <span>RJ45 CRIMP PLUG CONTEXT</span>
                <span>{activeMedium === 'crossover' ? '568A (Side A) ➔ 568B (Side B)' : '8-CONDUCTOR COLOR SCHEME'}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#111827', padding: '10px', borderRadius: '8px', border: '1px solid #1e293b', gap: '5px' }}>
                {(activeMedium === 'crossover' ? pinouts['568A'] : pinouts[activeMedium as keyof typeof pinouts]).map((w) => (
                  <div key={w.pin} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#475569', width: '36px', fontWeight: 'bold' }}>Pin {w.pin}</span>
                    <div style={{ flexGrow: 1, height: '18px', background: w.bg, borderRadius: '4px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center', paddingLeft: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#000', backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '1px 4px', borderRadius: '2px' }}>{w.name}</span>
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: w.pin === 1 || w.pin === 2 ? styles.accent : (w.pin === 3 || w.pin === 6 ? styles.fwd : '#475569'), width: '45px', textAlign: 'right', fontWeight: 'bold' }}>
                      {activeMedium === 'crossover' 
                        ? (w.pin === 1 || w.pin === 2 ? 'Rx' : (w.pin === 3 || w.pin === 6 ? 'Tx' : 'PoE'))
                        : (w.pin === 1 || w.pin === 2 ? 'Tx' : (w.pin === 3 || w.pin === 6 ? 'Rx' : 'PoE'))
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#475569', fontWeight: 'bold' }}>OPTICAL WAVEGUIDE INTERNAL PROPAGATION WAVEFORM</span>
              
              {/* HIGH ACCURACY REALISTIC OPTICAL BENCH */}
              <div style={{ position: 'relative', height: '150px', backgroundColor: '#02040a', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden' }}>
                <svg width="100%" height="100%">
                  {/* Outer Outer Cable Jacket Protective Layer Shield */}
                  <rect x="0" y="15" width="100%" height="120" fill={activeMedium === 'SMF' ? '#eab308' : '#06b6d4'} opacity="0.15" />
                  <text x="10" y="26" fill={activeMedium === 'SMF' ? '#eab308' : '#06b6d4'} fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {activeMedium === 'SMF' ? '🟡 OS2 SMF Yellow Outer Jacket' : '🔵 OM3/OM4 MMF Aqua Outer Jacket'}
                  </text>

                  {/* Glass Cladding Boundary Matrix */}
                  <rect x="0" y="35" width="100%" height="80" fill="#1e293b" opacity="0.4" />
                  <line x1="0" y1="35" x2="100%" y2="35" stroke="#233247" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="115" x2="100%" y2="115" stroke="#233247" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="10" y="44" fill="#475569" fontSize="7" fontFamily="monospace">Glass Cladding Refractive Boundary (125µm Profile)</text>

                  {/* Core Corridor Realism Scaling */}
                  <rect x="0" y={activeMedium === 'SMF' ? '72' : '50'} width="100%" height={activeMedium === 'SMF' ? '6' : '50'} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.02)" />
                  <text x="10" y={activeMedium === 'SMF' ? '68' : '59'} fill="#fff" fontSize="8" fontFamily="monospace" fontWeight="bold">
                    {activeMedium === 'SMF' ? 'Glass Core Core Corridor: Ultra-Narrow 9µm' : 'Glass Core Core Corridor: Wide 50µm'}
                  </text>

                  {activeMedium === 'SMF' ? (
                    // Realistic Coherent Laser Stream for SMF
                    <g>
                      <line x1="0" y1="75" x2="100%" y2="75" stroke="#f43f5e" strokeWidth="2" style={{ boxShadow: '0 0 10px #f43f5e' }} />
                      <line x1="0" y1="75" x2="100%" y2="75" stroke="#ffffff" strokeWidth="0.5" />
                    </g>
                  ) : (
                    // Realistic Modal Dispersion Reflection Array Paths for MMF
                    <g fill="none" strokeWidth="1.5">
                      <path d={Array.from({ length: 12 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${i * 35} ${55 + (i % 2 === 0 ? 0 : 40)}`).join(' ')} stroke="#ef4444" opacity="0.8" />
                      <path d={Array.from({ length: 10 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${i * 42} ${65 + (i % 2 === 0 ? 30 : -20)}`).join(' ')} stroke="#f59e0b" opacity="0.6" />
                      <path d={Array.from({ length: 15 }, (_, i) => `${i === 0 ? 'M' : 'L'} ${i * 28} ${75 + (Math.sin(i + wavePhase) * 18)}`).join(' ')} stroke="#3b82f6" opacity="0.5" />
                    </g>
                  )}
                </svg>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={runContinuityTest}
            disabled={isTesting}
            style={{ width: '100%', padding: '0.65rem', marginTop: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 800, cursor: isTesting ? 'not-allowed' : 'pointer', opacity: isTesting ? 0.6 : 1 }}
          >
            {isTesting ? 'ANALYZING LINK OPTICS...' : '⚡ FIRE BENCH CONTINUITY TEST'}
          </button>
        </div>

        {/* RIGHT COLUMN: SPECS DETAILS */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ backgroundColor: styles.setupBg, padding: '1.25rem', borderRadius: '12px', border: styles.panelBorder }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{mediumSpecs[activeMedium].title}</h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: styles.descText, lineHeight: '1.5' }}>{mediumSpecs[activeMedium].desc}</p>
            
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>🎯 Production Deployment Field</span>
            <div style={{ backgroundColor: styles.chartBg, padding: '8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, color: styles.textPrimary, lineHeight: '1.4' }}>
              {mediumSpecs[activeMedium].useCase}
            </div>
          </div>

          <div style={{ backgroundColor: styles.terminalBg, padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#475569', display: 'block', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '4px', fontWeight: 'bold' }}>LAYER 1 PASSIVE BUS DIAGNOSTIC ANALYSER</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: isTesting ? styles.lst : styles.terminalText, lineHeight: '1.4' }}>
              {testResult}
            </div>
          </div>

        </div>

      </div>

      {/* CORE THEORY FLOOR PANEL */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: styles.accent }}>📐 Auto-MDIX vs. Traditional Pin Crossover</h4>
          <p style={{ margin: 0, color: styles.descText, fontSize: '0.78rem' }}>
            In legacy 10BASE-T or 100BASE-TX infrastructure, linking identical components (Switch-to-Switch) required a dedicated crossover cable to map the physical Tx copper pinout path onto the opposing Rx terminals. Modern Gigabit (1000BASE-T) architectures require **Auto-MDIX** integrated circuit controllers on the chipsets to automatically manage this cross-over mapping in software loops.
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: styles.fwd }}>🌊 Modal Dispersion Physics Constraints</h4>
          <p style={{ margin: 0, color: styles.descText, fontSize: '0.78rem' }}>
            * **MMF Infrastructure:** Wide core bounds (50 microns) mean light rays from inexpensive LED arrays scatter along multiple bouncing reflective flight angles, leading to **modal dispersion** blurring over multi-hundred meter spans.
            * **SMF Infrastructure:** A narrow core aperture (~9 microns) forces light down a single straight line path using precise spatial laser arrays, minimizing light attenuation and enabling data transmission across tens of kilometers without distortion.
          </p>
        </div>
      </div>

    </div>
  );
};

export default CableLab;