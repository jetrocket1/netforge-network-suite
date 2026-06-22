import React, { useState, useEffect } from 'react';

interface WifiBeamformingProps {
  isDarkMode?: boolean;
}

export const WifiBeamforming: React.FC<WifiBeamformingProps> = ({ isDarkMode = true }) => {
  const [mode, setMode] = useState<'omni' | 'implicit' | 'explicit'>('omni');
  const [clientPos, setClientPos] = useState<{ x: number; y: number }>({ x: 380, y: 120 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [wavePhase, setWavePhase] = useState<number>(0);

  // Animate RF signal propagation ripples smoothly across the active grid bounds
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase(prev => (prev + 0.15) % (Math.PI * 2));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Center position of the fixed three-element MIMO Access Point tower
  const apPos = { x: 80, y: 120 };

  // Calculate Euclidean physics vectors relative to drag boundaries
  const dx = clientPos.x - apPos.x;
  const dy = clientPos.y - apPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Dynamic Signal Math: Explicit feedback gives maximum array gain (+9dBm)
  const baseLoss = Math.min(50, Math.round(distance / 6));
  const effectiveSignal = mode === 'omni' 
    ? -30 - baseLoss 
    : mode === 'implicit' 
      ? -30 - Math.round(baseLoss * 0.65)
      : -30 - Math.round(baseLoss * 0.45); // Explicit beamforming provides optimal phase tracking gain

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nextX = Math.max(160, Math.min(520, e.clientX - rect.left));
    const nextY = Math.max(20, Math.min(220, e.clientY - rect.top));
    setClientPos({ x: nextX, y: nextY });
  };

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    accent: isDarkMode ? '#06b6d4' : '#0284c7',
    fwd: '#10b981',
    blk: '#f43f5e',
    lst: '#eab308'
  };

  // Angular translation for SVG beam rotation coordinates
  const rotationRad = Math.atan2(dy, dx);
  const rotationDeg = (rotationRad * 180) / Math.PI;

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.panelBg, borderRadius: '12px', border: styles.panelBorder, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER CONTROLS SECTION */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>🎯 Phase-Shifted Wi-Fi Beamforming Visualizer</h3>
          <p style={{ color: styles.descText, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Model constructive RF wave interference envelopes and localized directional antenna gain vectors.</p>
        </div>
        
        {/* ANTENNA INJECTION MODE CONTROLLER TABS */}
        <div style={{ display: 'flex', backgroundColor: styles.setupBg, padding: '4px', borderRadius: '8px', border: styles.panelBorder }}>
          <button type="button" onClick={() => setMode('omni')} style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: mode === 'omni' ? styles.accent : 'transparent', color: mode === 'omni' ? '#fff' : styles.descText }}>🌐 Omni</button>
          <button type="button" onClick={() => setMode('implicit')} style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: mode === 'implicit' ? styles.accent : 'transparent', color: mode === 'implicit' ? '#fff' : styles.descText }}>🚀 Implicit</button>
          <button type="button" onClick={() => setMode('explicit')} style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: mode === 'explicit' ? styles.accent : 'transparent', color: mode === 'explicit' ? '#fff' : styles.descText }}>🎯 Explicit (VHT)</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* LEFT COLUMN: ACTIVE INTERACTIVE RF MATRIX MAP */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div 
            onMouseMove={handleContainerMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            style={{
              height: '240px',
              backgroundColor: styles.chartBg,
              border: '1px solid #1e293b',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none'
            }}
          >
            {/* BACKGROUND CALIBRATION VECTOR COMPASS RINGS */}
            <div style={{ position: 'absolute', left: `${apPos.x}px`, top: `${apPos.y}px`, width: '100px', height: '100px', border: '1px dashed rgba(255,255,255,0.02)', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
            <div style={{ position: 'absolute', left: `${apPos.x}px`, top: `${apPos.y}px`, width: '250px', height: '250px', border: '1px dashed rgba(255,255,255,0.02)', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />

            {/* DYNAMIC RADIO WAVEFRONT WAVE SHAPES SVG LAYER */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {mode === 'omni' ? (
                <>
                  <circle cx={apPos.x} cy={apPos.y} r={(30 + (wavePhase * 12)) % 110} fill="none" stroke={styles.accent} strokeWidth="1" strokeOpacity={1 - ((30 + (wavePhase * 12)) % 110) / 110} />
                  <circle cx={apPos.x} cy={apPos.y} r={(60 + (wavePhase * 12)) % 110} fill="none" stroke={styles.accent} strokeWidth="1" strokeOpacity={1 - ((60 + (wavePhase * 12)) % 110) / 110} />
                  <circle cx={apPos.x} cy={apPos.y} r={(90 + (wavePhase * 12)) % 110} fill="none" stroke={styles.accent} strokeWidth="1" strokeOpacity={1 - ((90 + (wavePhase * 12)) % 110) / 110} />
                </>
              ) : (
                <g transform={`translate(${apPos.x}, ${apPos.y}) rotate(${rotationDeg})`}>
                  <path 
                    d={`M 0,-15 Q ${distance * 0.4},-40 ${distance},0 Q ${distance * 0.4},40 0,15 Z`}
                    fill={mode === 'explicit' ? 'url(#explicitGlow)' : 'url(#implicitGlow)'}
                    stroke={mode === 'explicit' ? styles.fwd : styles.lst}
                    strokeWidth="1.5"
                    strokeDasharray={mode === 'implicit' ? '4 2' : 'none'}
                    style={{ opacity: 0.85 }}
                  />
                  <circle cx={(wavePhase * (distance / (Math.PI * 2))) % distance} cy="0" r="4" fill="#ffffff" filter="blur(1px)" />
                </g>
              )}
            </svg>

            {/* STATIC ACCESS POINT ANTENNA TOWER ARRAY ELEMENTS */}
            <div style={{ position: 'absolute', left: `${apPos.x}px`, top: `${apPos.y}px`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', zIndex: 10 }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: styles.accent, boxShadow: `0 0 8px ${styles.accent}` }} title="Antenna Element A" />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: styles.accent, boxShadow: `0 0 8px ${styles.accent}` }} title="Antenna Element B" />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: styles.accent, boxShadow: `0 0 8px ${styles.accent}` }} title="Antenna Element C" />
              <span style={{ fontSize: '0.55rem', fontWeight: 'bold', color: styles.accent, fontFamily: 'monospace', marginTop: '3px', backgroundColor: '#05070f', padding: '1px 4px', borderRadius: '3px' }}>3x3 MIMO</span>
            </div>

            {/* DRAGGABLE USER CLIENT HARDWARE DEVICE PROBE ELEMENT */}
            <div
              onMouseDown={() => setIsDragging(true)}
              style={{
                position: 'absolute', left: `${clientPos.x}px`, top: `${clientPos.y}px`, transform: 'translate(-50%, -50%)',
                padding: '6px 10px', backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '6px',
                fontSize: '0.65rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: `2px solid ${mode === 'omni' ? styles.accent : (mode === 'implicit' ? styles.lst : styles.fwd)}`,
                cursor: 'grab', zIndex: 20, transition: 'border 0.2s ease, left 0.05s linear'
              }}
            >
              📱 Client ({mode.toUpperCase()})
            </div>

            {/* GRADIENT MAP DEFINITIONS */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <linearGradient id="explicitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={styles.fwd} stopOpacity="0.4" />
                  <stop offset="70%" stopColor={styles.fwd} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={styles.fwd} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="implicitGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={styles.lst} stopOpacity="0.3" />
                  <stop offset="70%" stopColor={styles.lst} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={styles.lst} stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* TELEMETRY ANALYTICS METER PANEL */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '10px', border: styles.panelBorder, display: 'grid', gridTemplateColumns: '1fr 100px', alignItems: 'center', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '0.6rem', color: styles.descText, fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Signal Attenuation Level</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'monospace', color: effectiveSignal >= -62 ? styles.fwd : (effectiveSignal >= -72 ? styles.lst : styles.blk) }}>
                {effectiveSignal} <span style={{ fontSize: '0.9rem' }}>dBm</span>
              </div>
            </div>
            <div style={{ fontSize: '0.65rem', color: styles.textPrimary, backgroundColor: styles.chartBg, padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)', fontWeight: 'bold' }}>
              {effectiveSignal >= -58 ? '🟢 EXCELLENT' : (effectiveSignal >= -70 ? '🟡 MARGINAL' : '🔴 DEGRADED')}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE SINE-WAVE PLOT */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ flexGrow: 1, backgroundColor: '#05070f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
            <span style={{ fontSize: '0.6rem', color: styles.accent, fontWeight: 'bold', fontFamily: 'monospace' }}>CLIENT-SIDE ANTENNA PHASE SUMMATION LAYER</span>
            
            {/* WAVE PLOT CANVAS AREA */}
            <div style={{ position: 'relative', height: '110px', borderBottom: '1px dashed #27354a', borderTop: '1px dashed #27354a', margin: '15px 0', overflow: 'hidden' }}>
              <svg style={{ width: '100%', height: '100%' }}>
                <path
                  d={Array.from({ length: 100 }, (_, i) => {
                    const x = (i / 99) * 280;
                    const amp = mode === 'explicit' ? 38 : (mode === 'implicit' ? 24 : 12);
                    const freq = 0.15;
                    const y = 55 + Math.sin(i * freq - wavePhase * 2) * amp;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke={mode === 'omni' ? styles.accent : (mode === 'implicit' ? styles.lst : styles.fwd)}
                  strokeWidth="2"
                  style={{ transition: 'stroke 0.2s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dotted rgba(255,255,255,0.08)', transform: 'translateY(-50%)' }} />
            </div>

            <div style={{ fontSize: '0.65rem', color: styles.descText, lineHeight: '1.4' }}>
              {mode === 'omni' && '❌ No phase adjustment active. Antennas radiate out-of-sync cycles, yielding a standard low-amplitude scattering signature.'}
              {mode === 'implicit' && '⚠️ Implicit sounding active. Antenna matrix estimates mathematical coordinates from legacy frames, focusing intermediate directional gain loops.'}
              {mode === 'explicit' && '✅ Explicit Compressed VHT matrix active! Client feeds back exact calibration data, enabling 100% constructive phase-aligned crest combinations.'}
            </div>
          </div>

          {/* COMPLIANCE TERMINAL STATUS HUD */}
          <div style={{ backgroundColor: styles.terminalBg, padding: '0.75rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.7rem', color: styles.terminalText }}>
            <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '3px', marginBottom: '6px', fontWeight: 'bold' }}>MIMO SPATIAL MULTIPLEXING HUB</span>
            <div>RF Channel Sounding: <span style={{ color: '#fff' }}>{mode === 'omni' ? 'DISABLED' : 'BEAMFORMING_MATRIX_UP'}</span></div>
            <div>Estimated Multipath Array Gain: <span style={{ color: styles.fwd }}>{mode === 'omni' ? '+0 dB' : (mode === 'implicit' ? '+5.5 dB' : '+9.0 dB')}</span></div>
          </div>
        </div>

      </div>

      {/* CORE CURRICULUM THEORY CONTENT */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.accent }}>🌊 Constructive vs. Destructive Wave Physics</h4>
          <p style={{ margin: 0, color: styles.descText, fontSize: '0.78rem' }}>
            When multiple radio streams bounce through walls, they hit antennas at staggered intervals. If two crests arrive exactly out-of-phase (180 degree shift), they flatten each other out completely (**destructive interference**). Beamforming alters the launch timing of transmitter signals so that the waves arrive exactly locked together (**constructive interference**), compounding their electrical power heights.
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.fwd }}>📡 Implicit vs. Explicit Transmit Beamforming (TxBF)</h4>
          <p style={{ margin: 0, color: styles.descText, fontSize: '0.78rem' }}>
            * **Implicit TxBF:** The AP attempts to guess client coordinates by measuring incoming data parameters on its own ports. It is resource-light but vulnerable to path imbalances.
            * **Explicit TxBF:** Introduced in **802.11ac**, the AP sends a **Null Data Packet (NDP)** probe frame. The client measures the frame distortion directly and returns a comprehensive **Compressed VHT Steering Matrix** report, granting optimal directional precision.
          </p>
        </div>
      </div>

    </div>
  );
};

export default WifiBeamforming;