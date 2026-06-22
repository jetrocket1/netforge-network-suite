import React, { useState } from 'react';

interface Layer2SecurityLabProps {
  isDarkMode?: boolean;
}

export const Layer2SecurityLab: React.FC<Layer2SecurityLabProps> = ({ isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState<'PORT_SEC' | 'SNOOPING'>('PORT_SEC');

  // --- PORT SECURITY STATES ---
  const [pluggedDevice, setPluggedDevice] = useState<'LEGIT' | 'ROGUE'>('LEGIT');
  const [violationMode, setViolationMode] = useState<'protect' | 'restrict' | 'shutdown'>('shutdown');
  const [portStatus, setPortStatus] = useState<'UP' | 'ERR_DISABLED'>('UP');
  const [securityCount, setSecurityCount] = useState<number>(0);
  
  // Port Sec Animation States
  const [psAnimState, setPsAnimState] = useState<'IDLE' | 'MOVING' | 'DROPPED' | 'SUCCESS'>('IDLE');
  const [psLog, setPsLog] = useState<string>('System ready. Awaiting traffic.');

  // --- DHCP SNOOPING STATES ---
  const [port1Trusted, setPort1Trusted] = useState<boolean>(false);
  const [port2Trusted, setPort2Trusted] = useState<boolean>(false);
  const [port24Trusted, setPort24Trusted] = useState<boolean>(true);
  
  // Snooping Animation States
  const [snoopSender, setSnoopSender] = useState<'NONE' | 'LEGIT' | 'ROGUE'>('NONE');
  const [snoopAnimPhase, setSnoopAnimPhase] = useState<'IDLE' | 'TO_SWITCH' | 'TO_PC' | 'DROPPED'>('IDLE');
  const [victimIp, setVictimIp] = useState<string>('0.0.0.0');
  const [snoopLog, setSnoopLog] = useState<string>('DHCP Snooping Active. All untrusted ports blocked from sending OFFERS.');

  const styles = {
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    accent: isDarkMode ? '#06b6d4' : '#0284c7'
  };

  // ==========================================
  // PORT SECURITY ANIMATION ENGINE
  // ==========================================
  const triggerPortSecurityTraffic = () => {
    if (portStatus === 'ERR_DISABLED' || psAnimState !== 'IDLE') return;

    setPsAnimState('MOVING');
    setPsLog(`[${pluggedDevice}] Device transmitting Ethernet frame...`);

    setTimeout(() => {
      if (pluggedDevice === 'LEGIT') {
        setPsAnimState('SUCCESS');
        setPsLog('✅ Source MAC AA:BB:CC:11:22 matches Sticky MAC. Frame forwarded.');
        setTimeout(() => setPsAnimState('IDLE'), 1500);
      } else {
        // Rogue Device Logic
        if (violationMode === 'shutdown') {
          setPsAnimState('DROPPED');
          setPortStatus('ERR_DISABLED');
          setSecurityCount(c => c + 1);
          setPsLog('❌ CRITICAL: Unknown MAC detected. Violation mode SHUTDOWN triggered. Port err-disabled.');
        } else if (violationMode === 'restrict') {
          setPsAnimState('DROPPED');
          setSecurityCount(c => c + 1);
          setPsLog('⚠️ WARNING: Unknown MAC detected. Frame dropped. Security counter incremented.');
        } else if (violationMode === 'protect') {
          setPsAnimState('DROPPED');
          setPsLog('🛡️ PROTECT: Unknown MAC detected. Frame dropped silently.');
        }
        setTimeout(() => setPsAnimState('IDLE'), 2000);
      }
    }, 800);
  };

  const resetPort = () => {
    setPortStatus('UP');
    setPluggedDevice('LEGIT');
    setPsLog('Admin executed: shutdown -> no shutdown. Port restored.');
  };

  // ==========================================
  // DHCP SNOOPING ANIMATION ENGINE
  // ==========================================
  const triggerDhcpOffer = (sender: 'LEGIT' | 'ROGUE') => {
    if (snoopAnimPhase !== 'IDLE') return;
    
    setSnoopSender(sender);
    setSnoopAnimPhase('TO_SWITCH');
    setSnoopLog(`[${sender} SERVER] Generating DHCP_OFFER packet...`);

    setTimeout(() => {
      // Packet has hit the switch. Evaluate Trust.
      const isTrusted = sender === 'LEGIT' ? port24Trusted : port2Trusted;
      
      if (isTrusted) {
        setSnoopLog(`⚠️ Switch evaluated Port: TRUSTED. Forwarding payload to Victim PC!`);
        setSnoopAnimPhase('TO_PC');
        
        setTimeout(() => {
          setVictimIp(sender === 'LEGIT' ? '10.0.0.50' : '192.168.99.50');
          setSnoopAnimPhase('IDLE');
          setSnoopLog(sender === 'LEGIT' 
            ? `✅ PC successfully configured with Corporate IP.` 
            : `💀 MITM SUCCESS: PC Gateway hijacked by Rogue Server!`);
        }, 800);

      } else {
        setSnoopLog(`🛡️ Switch evaluated Port: UNTRUSTED. Malicious DHCP_OFFER dropped!`);
        setSnoopAnimPhase('DROPPED');
        setTimeout(() => setSnoopAnimPhase('IDLE'), 1500);
      }
    }, 800);
  };


  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>🛡️ Layer 2 Switch Threat Mitigation</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Secure the physical infrastructure against rogue internal hardware and unauthorized MITM configuration servers.</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', backgroundColor: styles.setupBg, padding: '6px', borderRadius: '8px' }}>
        <button onClick={() => setActiveTab('PORT_SEC')} style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'PORT_SEC' ? styles.accent : 'transparent', color: activeTab === 'PORT_SEC' ? '#fff' : styles.textMuted }}>🔌 MAC Port Security</button>
        <button onClick={() => setActiveTab('SNOOPING')} style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeTab === 'SNOOPING' ? '#10b981' : 'transparent', color: activeTab === 'SNOOPING' ? '#fff' : styles.textMuted }}>🕵️ DHCP Snooping</button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: PORT SECURITY */}
      {/* ========================================== */}
      {activeTab === 'PORT_SEC' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ANIMATION CANVAS */}
          <div style={{ backgroundColor: '#05070f', border: `1px solid ${portStatus === 'ERR_DISABLED' ? '#f43f5e' : '#1e293b'}`, padding: '3rem 1rem', borderRadius: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0', position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
              
              {/* PC NODE */}
              <div style={{ zIndex: 2, padding: '15px', borderRadius: '8px', backgroundColor: pluggedDevice === 'LEGIT' ? '#0f172a' : '#2a0f15', border: `2px solid ${pluggedDevice === 'LEGIT' ? styles.accent : '#f43f5e'}` }}>
                <div style={{ fontSize: '2.5rem' }}>{pluggedDevice === 'LEGIT' ? '💻' : '🦹‍♂️'}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px', color: pluggedDevice === 'LEGIT' ? styles.accent : '#f43f5e', textAlign: 'center' }}>
                  {pluggedDevice === 'LEGIT' ? 'Legit PC' : 'Rogue Laptop'}
                </div>
              </div>

              {/* WIRE LANE */}
              <div style={{ flex: 1, position: 'relative', height: '6px', backgroundColor: portStatus === 'UP' ? '#334155' : '#4a0f15', margin: '0 -10px', zIndex: 1 }}>
                {portStatus === 'ERR_DISABLED' && (
                  <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#f43f5e', color: '#fff', fontSize: '0.65rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>ERR-DISABLED</div>
                )}

                {/* ANIMATED PACKET */}
                {(psAnimState !== 'IDLE') && (
                  <div style={{
                    position: 'absolute', top: '-10px', width: '26px', height: '26px', backgroundColor: pluggedDevice === 'LEGIT' ? '#06b6d4' : '#f43f5e', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: 'bold',
                    transition: 'all 0.8s linear',
                    left: psAnimState === 'MOVING' ? '100%' : (psAnimState === 'DROPPED' || psAnimState === 'SUCCESS' ? '100%' : '0%'),
                    opacity: psAnimState === 'DROPPED' ? 0 : 1,
                    transform: psAnimState === 'DROPPED' ? 'scale(2)' : 'scale(1)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                  }}>📦</div>
                )}

                {/* DROPPED EXPLOSION INDICATOR */}
                {psAnimState === 'DROPPED' && (
                  <div style={{ position: 'absolute', top: '-20px', right: '-10px', fontSize: '2rem' }}>💥</div>
                )}
              </div>

              {/* SWITCH NODE */}
              <div style={{ zIndex: 2, padding: '15px', borderRadius: '8px', backgroundColor: '#0f172a', border: '2px solid #334155', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>🎛️</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>Fa0/1</div>
                {psAnimState === 'SUCCESS' && <div style={{ position: 'absolute', top: '-20px', right: '0', fontSize: '2rem' }}>✅</div>}
              </div>

            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: styles.setupBg, padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>1. Config & Actions</span>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => setViolationMode('protect')} style={{ flex: 1, padding: '8px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: violationMode === 'protect' ? styles.accent : styles.chartBg, color: violationMode === 'protect' ? '#fff' : styles.textMuted }}>Protect</button>
                <button onClick={() => setViolationMode('restrict')} style={{ flex: 1, padding: '8px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: violationMode === 'restrict' ? '#eab308' : styles.chartBg, color: violationMode === 'restrict' ? '#000' : styles.textMuted }}>Restrict</button>
                <button onClick={() => setViolationMode('shutdown')} style={{ flex: 1, padding: '8px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: violationMode === 'shutdown' ? '#f43f5e' : styles.chartBg, color: violationMode === 'shutdown' ? '#fff' : styles.textMuted }}>Shutdown</button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => setPluggedDevice(p => p === 'LEGIT' ? 'ROGUE' : 'LEGIT')} disabled={portStatus === 'ERR_DISABLED' || psAnimState !== 'IDLE'} style={{ flex: 1, padding: '10px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: portStatus === 'ERR_DISABLED' ? 'not-allowed' : 'pointer', backgroundColor: pluggedDevice === 'LEGIT' ? '#f43f5e' : styles.accent, color: '#fff', opacity: portStatus === 'ERR_DISABLED' ? 0.5 : 1 }}>
                  {pluggedDevice === 'LEGIT' ? '🔌 Swap to Rogue' : '🔌 Revert to Legit'}
                </button>
                <button onClick={triggerPortSecurityTraffic} disabled={portStatus === 'ERR_DISABLED' || psAnimState !== 'IDLE'} style={{ flex: 1, padding: '10px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: portStatus === 'ERR_DISABLED' ? 'not-allowed' : 'pointer', backgroundColor: '#10b981', color: '#fff', opacity: portStatus === 'ERR_DISABLED' ? 0.5 : 1 }}>
                  ⚡ Send Frame
                </button>
              </div>

              {portStatus === 'ERR_DISABLED' && (
                <button onClick={resetPort} style={{ padding: '8px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '4px', border: '1px dashed #eab308', backgroundColor: 'transparent', color: '#eab308', cursor: 'pointer' }}>
                  🔄 Admin Reset (no shutdown)
                </button>
              )}
            </div>

            <div style={{ backgroundColor: styles.terminalBg, padding: '1.2rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: styles.terminalText }}>
              <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>SECURITY CONSOLE</span>
              <div style={{ color: '#cbd5e1', marginBottom: '15px' }}>{psLog}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: '#64748b', fontSize: '0.65rem' }}>
                <div>Secure MAC: <span style={{ color: '#10b981' }}>AA:BB:CC:11:22</span></div>
                <div>Status: <span style={{ color: portStatus === 'UP' ? '#10b981' : '#f43f5e' }}>{portStatus}</span></div>
                <div>Violations: <span style={{ color: '#f43f5e' }}>{securityCount}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: DHCP SNOOPING */}
      {/* ========================================== */}
      {activeTab === 'SNOOPING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* ANIMATION CANVAS */}
          <div style={{ backgroundColor: '#05070f', border: `1px solid #1e293b`, padding: '2rem 1rem', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', justifyContent: 'center', margin: '0 auto', maxWidth: '600px', position: 'relative' }}>
              
              {/* ROGUE SERVER (Top Left) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#2a0f15', border: '2px solid #f43f5e', textAlign: 'center', position: 'relative' }}>
                  <div style={{ fontSize: '2rem' }}>🦹‍♂️</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#f43f5e' }}>Rogue DHCP</div>
                  <span style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: port2Trusted ? '#10b981' : '#f43f5e', color: '#fff' }}>{port2Trusted ? 'TRUSTED' : 'UNTRUSTED'}</span>
                </div>
              </div>

              {/* LEGIT SERVER (Top Right) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#0f2a1a', border: '2px solid #10b981', textAlign: 'center', position: 'relative' }}>
                  <div style={{ fontSize: '2rem' }}>🗄️</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#10b981' }}>Corp DHCP</div>
                  <span style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: port24Trusted ? '#10b981' : '#f43f5e', color: '#fff' }}>{port24Trusted ? 'TRUSTED' : 'UNTRUSTED'}</span>
                </div>
              </div>

              {/* CENTRAL SWITCH (Middle Center) */}
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center', margin: '30px 0', zIndex: 2 }}>
                <div style={{ padding: '20px 40px', borderRadius: '8px', backgroundColor: '#0f172a', border: '2px solid #334155', textAlign: 'center', position: 'relative' }}>
                  <div style={{ fontSize: '2rem' }}>🎛️</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Core Switch (Snooping ON)</div>
                  
                  {/* Packet from Rogue to Switch */}
                  {snoopSender === 'ROGUE' && snoopAnimPhase !== 'IDLE' && (
                    <div style={{
                      position: 'absolute', top: '-50px', left: '-50px', width: '20px', height: '20px', backgroundColor: '#f43f5e', borderRadius: '50%',
                      transition: 'all 0.8s ease',
                      transform: snoopAnimPhase === 'TO_SWITCH' ? 'translate(0, 0)' : 'translate(90px, 40px)',
                      opacity: snoopAnimPhase === 'DROPPED' ? 0 : 1
                    }}></div>
                  )}

                  {/* Packet from Legit to Switch */}
                  {snoopSender === 'LEGIT' && snoopAnimPhase !== 'IDLE' && (
                    <div style={{
                      position: 'absolute', top: '-50px', right: '-50px', width: '20px', height: '20px', backgroundColor: '#10b981', borderRadius: '50%',
                      transition: 'all 0.8s ease',
                      transform: snoopAnimPhase === 'TO_SWITCH' ? 'translate(0, 0)' : 'translate(-90px, 40px)'
                    }}></div>
                  )}

                  {/* Packet from Switch to PC */}
                  {snoopAnimPhase === 'TO_PC' && (
                    <div style={{
                      position: 'absolute', bottom: '-20px', left: '50%', width: '20px', height: '20px', backgroundColor: snoopSender === 'ROGUE' ? '#f43f5e' : '#10b981', borderRadius: '50%',
                      transition: 'all 0.8s ease',
                      transform: 'translate(-50%, 60px)'
                    }}></div>
                  )}

                  {snoopAnimPhase === 'DROPPED' && <div style={{ position: 'absolute', top: '-10px', left: '20px', fontSize: '2rem' }}>🛡️💥</div>}
                </div>
              </div>

              {/* VICTIM PC (Bottom Center) */}
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div style={{ padding: '15px 30px', borderRadius: '8px', backgroundColor: '#0f172a', border: `2px solid ${styles.accent}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem' }}>💻</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: styles.accent }}>Victim PC</div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: victimIp !== '0.0.0.0' ? (victimIp.startsWith('192') ? '#f43f5e' : '#10b981') : '#cbd5e1', marginTop: '4px' }}>
                    IP: {victimIp}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: styles.setupBg, padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>1. Set Port Trust</span>
              
              <div style={{ display: 'grid', gap: '6px' }}>
                 <button onClick={() => setPort2Trusted(!port2Trusted)} style={{ padding: '8px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: `1px solid ${port2Trusted ? '#f43f5e' : styles.border}`, cursor: 'pointer', backgroundColor: port2Trusted ? 'rgba(244,63,94,0.1)' : styles.chartBg, color: port2Trusted ? '#f43f5e' : styles.textMuted }}>Toggle Rogue Port (Fa0/2)</button>
                 <button onClick={() => setPort24Trusted(!port24Trusted)} style={{ padding: '8px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: `1px solid ${port24Trusted ? '#10b981' : styles.border}`, cursor: 'pointer', backgroundColor: port24Trusted ? 'rgba(16,185,129,0.1)' : styles.chartBg, color: port24Trusted ? '#10b981' : styles.textMuted }}>Toggle Corp Port (Fa0/24)</button>
              </div>

              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginTop: '10px' }}>2. Fire Payloads</span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => triggerDhcpOffer('LEGIT')} disabled={snoopAnimPhase !== 'IDLE'} style={{ flex: 1, padding: '10px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#10b981', color: '#fff', opacity: snoopAnimPhase !== 'IDLE' ? 0.5 : 1 }}>📨 Send Legit</button>
                <button onClick={() => triggerDhcpOffer('ROGUE')} disabled={snoopAnimPhase !== 'IDLE'} style={{ flex: 1, padding: '10px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: '#f43f5e', color: '#fff', opacity: snoopAnimPhase !== 'IDLE' ? 0.5 : 1 }}>🏴‍☠️ Send Rogue</button>
              </div>
            </div>

            <div style={{ backgroundColor: styles.terminalBg, padding: '1.2rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: styles.terminalText }}>
              <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>SNOOPING LOG</span>
              <div style={{ color: '#cbd5e1' }}>{snoopLog}</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DETAILED LESSON CHEATSHEET ACCORDION */}
      {/* ========================================== */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        
        {activeTab === 'PORT_SEC' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.accent }}>🔒 The "Sticky" MAC Advantage</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                Typing hundreds of MAC addresses manually into a switch is impossible. The <strong>Sticky MAC</strong> feature tells the switch to dynamically learn the <em>first</em> MAC address it sees on a port, and instantly lock it into the running configuration. Any subsequent unknown MAC addresses trigger the configured violation.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f43f5e' }}>🛑 The Err-Disabled State</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                When a port hits a <strong>Shutdown</strong> violation, it doesn't just block the traffic—it physically brings the port down into an <code>err-disabled</code> state. The port will stay completely dead, even if the legitimate PC is plugged back in, until a network administrator explicitly issues a <code>shutdown</code> followed by a <code>no shutdown</code> command.
              </p>
            </div>
          </>
        )}

        {activeTab === 'SNOOPING' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>🛡️ The Trust Boundary Concept</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                DHCP Snooping operates on a strict zero-trust default. By default, <strong>every</strong> port is considered <em>Untrusted</em> and is forbidden from sending <code>DHCP_OFFER</code> or <code>DHCP_ACK</code> packets. Administrators must manually configure uplink ports (leading to legitimate servers or core routers) as <em>Trusted</em> to allow IPs to be assigned.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#eab308' }}>🏴‍☠️ Man-in-the-Middle (MITM)</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                If a rogue server is allowed to offer IPs, it will assign itself as the <strong>Default Gateway</strong> for the victim PC. The PC will then blindly forward all its internet traffic (including unencrypted passwords) straight to the attacker's laptop, which logs the data before quietly routing it out to the real internet.
              </p>
            </div>
          </>
        )}
        
      </div>

    </div>
  );
};

export default Layer2SecurityLab;