import React, { useState, useEffect } from 'react';

interface CsmaLabProps {
  isDarkMode?: boolean;
}

type CdPhases = 'IDLE' | 'TRANSMITTING' | 'COLLISION' | 'JAMMING' | 'BACKOFF' | 'RETRANSMITTING' | 'SUCCESS';
type CaPhases = 'IDLE' | 'DIFS' | 'RTS' | 'CTS' | 'DATA' | 'ACK' | 'SUCCESS';

export const CsmaLab: React.FC<CsmaLabProps> = ({ isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState<'CD' | 'CA'>('CD');

  // Interactive Carrier Sense toggles
  const [isNode1Chatty, setIsNode1Chatty] = useState<boolean>(false);
  const [isNode2Chatty, setIsNode2Chatty] = useState<boolean>(false);

  // --- CSMA/CD MANUAL STEP TRACKING (Wired) ---
  const [cdPhase, setCdPhase] = useState<CdPhases>('IDLE');
  const [cdStepIndex, setCdStepIndex] = useState<number>(0);
  const [cdProgress, setCdProgress] = useState<number>(0);

  // --- CSMA/CA MANUAL STEP TRACKING (Wireless) ---
  const [caPhase, setCaPhase] = useState<CaPhases>('IDLE');
  const [caStepIndex, setCaStepIndex] = useState<number>(0);
  const [caProgress, setCaProgress] = useState<number>(0);
  const [navTimer, setNavTimer] = useState<number>(0);

  // ==========================================
  // STEP BLUEPRINTS & INSTRUCTIONAL MATERIAL
  // ==========================================
  const cdSteps = [
    { phase: 'IDLE', log: 'System idle. Both network interface cards (NICs) are listening to media line electrical parameters.' },
    { phase: 'TRANSMITTING', log: 'Step 1: CARRIER SENSE — The bus medium is clear. Both hosts lunge out frames simultaneously over the wire.' },
    { phase: 'COLLISION', log: 'Step 2: COLLISION — The electrical signals collide mid-wire! A critical Layer 1 voltage spike is generated.' },
    { phase: 'JAMMING', log: 'Step 3: JAM SIGNAL — Transmitters detect the voltage anomaly, abort current frames, and flood 32-bit JAM patterns across the line.' },
    { phase: 'BACKOFF', log: 'Step 4: RANDOM BACKOFF — NIC algorithms generate backoff blocks. Host 1 draws a 3ms delay; Host 2 draws a 9ms delay.' },
    { phase: 'RETRANSMITTING', log: 'Step 5: RETRANSMIT — Host 1 timer expires first. It senses clear media and injects its data payload safely down the line.' },
    { phase: 'SUCCESS', log: '✅ SUCCESS — Host 1 data frame completely delivered. Host 2 will wait to transparently re-sense the carrier later.' }
  ] as const;

  const caSteps = [
    { phase: 'IDLE', log: 'Airspace clear. Devices monitoring RF parameters.' },
    { phase: 'DIFS', log: 'Step 1: DCF INTER-FRAME SPACE — Laptop A senses free airspace and calculates its mandatory DIFS validation countdown.' },
    { phase: 'RTS', log: 'Step 2: REQUEST-TO-SEND — Laptop A casts an RTS frame out over the air to request exclusive access to the wireless channel.' },
    { phase: 'CTS', log: 'Step 3: CLEAR-TO-SEND — Access Point returns a CTS frame broadcast. Laptop B parses the frame and sets its internal NAV lockout.' },
    { phase: 'DATA', log: 'Step 4: DATA IN FLIGHT — Airspace reserved. Laptop A streams its complete un-fragmented unicast data frame blocks.' },
    { phase: 'ACK', log: 'Step 5: ACKNOWLEDGEMENT — Access Point runs a CRC check and transmits a Layer 2 ACK frame back to Laptop A.' },
    { phase: 'SUCCESS', log: '✅ SUCCESS — Spatial frame sequence securely closed out. Laptop B un-freezes its antenna as the medium drops back to clear.' }
  ] as const;

  // Fluid Vector Animation Tick Clock Loop
  useEffect(() => {
    let interval: any;
    if (['TRANSMITTING', 'JAMMING', 'RETRANSMITTING'].includes(cdPhase)) {
      setCdProgress(0);
      interval = setInterval(() => {
        setCdProgress(prev => (prev >= 100 ? 100 : prev + 4));
      }, 20);
    } else {
      setCdProgress(0);
    }
    return () => clearInterval(interval);
  }, [cdPhase]);

  useEffect(() => {
    let interval: any;
    if (['RTS', 'CTS', 'DATA', 'ACK'].includes(caPhase)) {
      setCaProgress(0);
      interval = setInterval(() => {
        setCaProgress(prev => (prev >= 100 ? 100 : prev + 5));
      }, 20);
    } else {
      setCaProgress(0);
    }
    return () => clearInterval(interval);
  }, [caPhase]);

  // Handle live navigation timer countdowns
  useEffect(() => {
    if (navTimer <= 0) return;
    const timeout = setTimeout(() => setNavTimer(prev => prev - 1), 100);
    return () => clearTimeout(timeout);
  }, [navTimer]);

  // ==========================================
  // STEPPERS IMPLEMENTATION ENGINE
  // ==========================================
  const handleNextCdStep = () => {
    if (cdStepIndex === 0 && (isNode1Chatty || isNode2Chatty)) {
      return; 
    }
    const nextIndex = (cdStepIndex + 1) % cdSteps.length;
    setCdStepIndex(nextIndex);
    setCdPhase(cdSteps[nextIndex].phase);
  };

  const handleNextCaStep = () => {
    const nextIndex = (caStepIndex + 1) % caSteps.length;
    setCaStepIndex(nextIndex);
    setCaPhase(caSteps[nextIndex].phase);
    
    if (caSteps[nextIndex].phase === 'CTS') {
      setNavTimer(55);
    } else if (caSteps[nextIndex].phase === 'IDLE' || caSteps[nextIndex].phase === 'SUCCESS') {
      setNavTimer(0);
    }
  };

  const resetCdEngine = () => {
    setCdStepIndex(0);
    setCdPhase('IDLE');
  };

  const resetCaEngine = () => {
    setCaStepIndex(0);
    setCaPhase('IDLE');
    setNavTimer(0);
  };

  const styles = {
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    accent: isDarkMode ? '#06b6d4' : '#0284c7',
    fwd: '#10b981',
    blk: '#ef4444',
    lst: '#eab308'
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SECTION HEADER */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>🚦 Media Access Control (MAC) Step Lab</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Contrast the physical collision detection of legacy Ethernet with the polite avoidance handshakes of 802.11 Wi-Fi.</p>
      </div>

      {/* FILTER BUTTON TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', backgroundColor: styles.setupBg, padding: '4px', borderRadius: '8px', border: styles.border }}>
        <button type="button" onClick={() => { setActiveTab('CD'); resetCdEngine(); }} style={{ flex: 1, padding: '10px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase', backgroundColor: activeTab === 'CD' ? styles.accent : 'transparent', color: activeTab === 'CD' ? '#fff' : styles.textMuted }}>💥 CSMA/CD (Wired)</button>
        <button type="button" onClick={() => { setActiveTab('CA'); resetCaEngine(); }} style={{ flex: 1, padding: '10px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', textTransform: 'uppercase', backgroundColor: activeTab === 'CA' ? styles.fwd : 'transparent', color: activeTab === 'CA' ? '#fff' : styles.textMuted }}>🛡️ CSMA/CA (Wireless)</button>
      </div>

      {/* ========================================== */}
      {/* VIEWPORT 1: CSMA/CD ENGINE                 */}
      {/* ========================================== */}
      {activeTab === 'CD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SCHEMATIC SCENE CANVAS */}
          <div style={{ backgroundColor: '#05070f', border: `1px solid ${['COLLISION', 'JAMMING'].includes(cdPhase) ? styles.blk : '#1e293b'}`, padding: '2.5rem 1rem', borderRadius: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
              
              {/* PC 1 ENDPOINT NODE */}
              <div 
                onClick={() => cdPhase === 'IDLE' && setIsNode1Chatty(!isNode1Chatty)}
                style={{ 
                  zIndex: 2, padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', cursor: cdPhase === 'IDLE' ? 'pointer' : 'not-allowed',
                  border: `2px solid ${cdPhase === 'BACKOFF' ? styles.lst : (isNode1Chatty ? styles.accent : '#334155')}`, textAlign: 'center', position: 'relative' 
                }}
              >
                <div style={{ fontSize: '2rem' }}>💻</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px' }}>Host 1 (Fa0/1)</div>
                <span style={{ fontSize: '0.55rem', display: 'block', color: isNode1Chatty ? styles.accent : styles.textMuted, fontWeight: 'bold' }}>
                  {isNode1Chatty ? '🔊 LINE_BUSY' : '💤 LINE_IDLE'}
                </span>
                {cdPhase === 'BACKOFF' && <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: styles.lst, color: '#000', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BACKOFF: 3ms</div>}
              </div>

              {/* SHARED COPPER LINE BUS */}
              <div style={{ flex: 1, position: 'relative', height: '6px', backgroundColor: ['COLLISION', 'JAMMING'].includes(cdPhase) ? styles.blk : (isNode1Chatty || isNode2Chatty ? styles.accent : '#27354a'), margin: '0 -4px', zIndex: 1 }}>
                
                {cdPhase === 'TRANSMITTING' && (
                  <>
                    <div style={{ position: 'absolute', left: `${cdProgress * 0.5}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: styles.accent }} />
                    <div style={{ position: 'absolute', left: `${100 - (cdProgress * 0.5)}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: styles.accent }} />
                  </>
                )}

                {['COLLISION', 'JAMMING'].includes(cdPhase) && (
                  <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.8rem', zIndex: 10 }}>💥</div>
                )}

                {cdPhase === 'JAMMING' && (
                  <>
                    <div style={{ position: 'absolute', left: `${cdProgress}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: styles.blk }} />
                    <div style={{ position: 'absolute', left: `${100 - cdProgress}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: styles.blk }} />
                  </>
                )}

                {['RETRANSMITTING', 'SUCCESS'].includes(cdPhase) && (
                  <div style={{ position: 'absolute', top: '-10px', width: '22px', height: '22px', backgroundColor: styles.fwd, borderRadius: '4px', left: cdPhase === 'RETRANSMITTING' ? `${cdProgress}%` : '100%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: '#fff', transition: cdPhase === 'SUCCESS' ? 'none' : 'left 0.4s linear' }}>DATA</div>
                )}
              </div>

              {/* PC 2 ENDPOINT NODE */}
              <div 
                onClick={() => cdPhase === 'IDLE' && setIsNode2Chatty(!isNode2Chatty)}
                style={{ 
                  zIndex: 2, padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', cursor: cdPhase === 'IDLE' ? 'pointer' : 'not-allowed',
                  border: `2px solid ${cdPhase === 'BACKOFF' ? styles.blk : (isNode2Chatty ? styles.accent : '#334155')}`, textAlign: 'center', position: 'relative' 
                }}
              >
                <div style={{ fontSize: '2rem' }}>🖥️</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px' }}>Host 2 (Fa0/2)</div>
                <span style={{ fontSize: '0.55rem', display: 'block', color: isNode2Chatty ? styles.accent : styles.textMuted, fontWeight: 'bold' }}>
                  {isNode2Chatty ? '🔊 LINE_BUSY' : '💤 LINE_IDLE'}
                </span>
                {cdPhase === 'BACKOFF' && <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: styles.blk, color: '#fff', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>BACKOFF: 9ms</div>}
                {cdPhase === 'SUCCESS' && <div style={{ position: 'absolute', top: '-15px', left: '-10px', fontSize: '1.5rem' }}>✅</div>}
              </div>

            </div>
          </div>

          {/* CONTROL STRATEGY INTERACTION DASHBOARD */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: styles.setupBg, padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="button" onClick={handleNextCdStep} disabled={isNode1Chatty || isNode2Chatty} style={{ flex: 2, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: isNode1Chatty || isNode2Chatty ? 'not-allowed' : 'pointer', backgroundColor: styles.accent, color: '#fff' }}>
                {cdStepIndex === 0 ? '🏁 Start Lab Sequence' : cdStepIndex === cdSteps.length - 1 ? '🔄 Reset Simulation' : '⏩ Next Blueprint Step'}
              </button>
              {cdStepIndex > 0 && (
                <button type="button" onClick={resetCdEngine} style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: `1px solid ${styles.blk}`, color: styles.blk, background: 'transparent', cursor: 'pointer' }}>Reset</button>
              )}
            </div>

            <div style={{ backgroundColor: styles.terminalBg, padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.5', color: styles.terminalText }}>
              <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>CSMA/CD MANUAL MONITOR [STEP {cdStepIndex} / 6]</span>
              <div style={{ color: ['COLLISION', 'JAMMING'].includes(cdPhase) ? styles.blk : '#cbd5e1' }}>{cdSteps[cdStepIndex].log}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* VIEWPORT 2: CSMA/CA INTERFACE              */}
      {/* ========================================== */}
      {activeTab === 'CA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: '#05070f', border: '1px solid #1e293b', padding: '2.5rem 1rem', borderRadius: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
              
              {/* LAPTOP A */}
              <div style={{ zIndex: 2, padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', border: `2px solid ${styles.fwd}`, textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: '2rem' }}>💻</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px', color: styles.fwd }}>Laptop A</div>
                {caPhase === 'DIFS' && <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2563eb', color: '#fff', fontSize: '0.55rem', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>IFS_DELAY</div>}
                {caPhase === 'SUCCESS' && <div style={{ position: 'absolute', top: '-15px', right: '-10px', fontSize: '1.3rem' }}>✅</div>}
              </div>

              {/* RF WAVE GAP */}
              <div style={{ flex: 1, position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#1e293b', fontSize: '1.2rem', letterSpacing: '6px', fontFamily: 'monospace' }}>~~~~~~~~</div>
                
                {caPhase === 'RTS' && (
                  <div style={{ position: 'absolute', padding: '3px 8px', backgroundColor: styles.lst, borderRadius: '10px', left: `${caProgress}%`, transform: 'translateX(-50%)', fontSize: '0.55rem', color: '#000', fontWeight: 'bold', fontFamily: 'monospace' }}>RTS</div>
                )}
                {caPhase === 'CTS' && (
                  <div style={{ position: 'absolute', padding: '3px 8px', backgroundColor: styles.fwd, borderRadius: '10px', right: `${caProgress}%`, transform: 'translateX(50%)', fontSize: '0.55rem', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>CTS</div>
                )}
                {caPhase === 'DATA' && (
                  <div style={{ position: 'absolute', padding: '4px 10px', backgroundColor: styles.accent, borderRadius: '4px', left: `${caProgress}%`, transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>802.11_DATA</div>
                )}
                {caPhase === 'ACK' && (
                  <div style={{ position: 'absolute', padding: '3px 8px', backgroundColor: styles.fwd, borderRadius: '10px', right: `${caProgress}%`, transform: 'translateX(50%)', fontSize: '0.55rem', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>ACK</div>
                )}
              </div>

              {/* ACCESS POINT */}
              <div style={{ zIndex: 2, padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', border: '2px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>📡</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px' }}>BSSID_AP_01</div>
              </div>

              {/* WIRELESS WAVE GAP B */}
              <div style={{ flex: 1, position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#1e293b', fontSize: '1.2rem', letterSpacing: '6px', fontFamily: 'monospace' }}>~~~~~~~~</div>
                {caPhase === 'CTS' && (
                  <div style={{ position: 'absolute', padding: '3px 8px', backgroundColor: styles.blk, borderRadius: '10px', left: `${caProgress}%`, transform: 'translateX(-50%)', fontSize: '0.55rem', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>CTS</div>
                )}
              </div>

              {/* LAPTOP B */}
              <div style={{ zIndex: 2, padding: '12px', borderRadius: '8px', backgroundColor: '#0f172a', border: `2px solid ${navTimer > 0 ? styles.blk : '#334155'}`, textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: '2rem' }}>📱</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginTop: '4px' }}>Laptop B (Hidden)</div>
                {navTimer > 0 && (
                  <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: styles.blk, color: '#fff', fontSize: '0.55rem', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                    Layout Blocked: {(navTimer * 0.1).toFixed(1)}s
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* CONTROLS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="button" onClick={handleNextCaStep} style={{ flex: 2, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: styles.fwd, color: '#fff' }}>
                {caStepIndex === 0 ? '🏁 Start Lab Sequence' : caStepIndex === caSteps.length - 1 ? '🔄 Reset Simulation' : '⏩ Next Blueprint Step'}
              </button>
              {caStepIndex > 0 && (
                <button type="button" onClick={resetCaEngine} style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: `1px solid ${styles.blk}`, color: styles.blk, background: 'transparent', cursor: 'pointer' }}>Reset</button>
              )}
            </div>

            <div style={{ backgroundColor: styles.terminalBg, padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.5', color: styles.fwd }}>
              <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>802.11 AIR_MEDIUM RADIO_MON [STEP {caStepIndex} / 6]</span>
              <div style={{ color: '#cbd5e1' }}>{caSteps[caStepIndex].log}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* THEORY CONTENT INSTRUCTIONAL CHIPS        */}
      {/* ========================================== */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        
        {activeTab === 'CD' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: styles.accent }}>💥 The Reactionary Approach</h4>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.78rem' }}>
                CSMA/CD is inherently reactive. It assumes the wire is clear, injecting electrical frequencies blindly and listening down the wire pins for reflections. When a voltage surge spike occurs, the <strong>JAM signal</strong> commands all stations to drop frames instantly and pause for randomized integer periods to prevent harmonic re-collisions.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: styles.blk }}>☠️ Half-Duplex Legacy Constraints</h4>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.78rem' }}>
                Because legacy network Hubs duplicated signals across all ports, lines were restricted to <em>Half-Duplex</em> loops where a device could not listen while transmitting. Modern switches provide isolated ASIC <em>Full-Duplex</em> lanes, segregating TX/RX wires to make media collisions physically impossible. This renders CSMA/CD permanently legacy and disabled on modern networks.
              </p>
            </div>
          </>
        )}

        {activeTab === 'CA' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: styles.fwd }}>🛡️ The Hidden Node Dilemma</h4>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.78rem' }}>
                Wireless antennas cannot transmit and listen at the same frequency simultaneously, making structural collision detection impossible. Furthermore, Laptop A and Laptop B might both hit the AP but remain completely blind to each other's presence (**Hidden Nodes**), rendering standard media listening blind without explicit handshakes.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: styles.lst }}>⏱️ The Virtual Carrier Sense (NAV)</h4>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.78rem' }}>
                To preemptively preserve local airspace corridors, the AP appends a precise payload timeline variable inside its broadcasted <strong>CTS (Clear-To-Send)</strong> packet. Every listener node inside the radio cell footprint reads this value and initializes a local **Network Allocation Vector (NAV) timer**, sealing its antenna transmitter loop until the current transmission clears out completely.
              </p>
            </div>
          </>
        )}
        
      </div>

    </div>
  );
};

export default CsmaLab;