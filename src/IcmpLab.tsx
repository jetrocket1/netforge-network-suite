import React, { useState } from 'react';

interface IcmpLabProps {
  isDarkMode?: boolean;
}

type ModeType = 'ping' | 'traceroute';

export const IcmpLab: React.FC<IcmpLabProps> = ({ isDarkMode = true }) => {
  const [activeMode, setActiveMode] = useState<ModeType>('ping');
  const [targetAddress, setTargetAddress] = useState<string>('8.8.8.8');
  const [currentHop, setCurrentHop] = useState<number>(0);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "ICMP Diagnostic Shell Active. Enter an IP target parameter and initialize test packet injection streams."
  ]);

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    setupBg: isDarkMode ? '#1e293b' : '#f8fafc',
    chartBg: isDarkMode ? '#0f172a' : '#f8fafc',
    toggleActiveBg: '#0284c7',
    terminalBg: '#05050a',
    terminalText: '#34d399'
  };

  const hopsData = [
    { hop: 1, type: 'Default Gateway Router', ip: '192.168.1.1', location: 'Local Edge Lan' },
    { hop: 2, type: 'ISP Edge Aggregator', ip: '10.254.12.89', location: 'Regional Core Node' },
    { hop: 3, type: 'Transit Core Backbone Switch', ip: '64.233.174.45', location: 'Internet Exchange Point' },
    { hop: 4, type: 'Target DNS Host Node', ip: '8.8.8.8', location: 'Cloud Edge Infrastructure' }
  ];

  const handleDiagnosticRun = () => {
    setIsTracing(true);
    setCurrentHop(0);
    
    if (activeMode === 'ping') {
      setConsoleLogs([`Pinging ${targetAddress} with 32 bytes of packet payload data:`]);
      
      let attempt = 1;
      const interval = setInterval(() => {
        if (attempt <= 4) {
          setCurrentHop(4); // Instant hop link matching target for ping illustration
          setConsoleLogs(prev => [
            ...prev,
            `Reply from ${targetAddress}: bytes=32 time=${12 + attempt}ms TTL=56 (ICMP Type 0: Echo Reply)`
          ]);
          attempt++;
        } else {
          clearInterval(interval);
          setIsTracing(false);
          setCurrentHop(0);
        }
      }, 500);
    } else {
      // Traceroute execution model tracking gradual TTL incremental hops
      setConsoleLogs([`Tracing route to ${targetAddress} over a maximum of 30 hops:`]);
      
      let currentTtl = 1;
      const interval = setInterval(() => {
        if (currentTtl <= 4) {
          const activeNode = hopsData[currentTtl - 1];
          setCurrentHop(currentTtl);
          
          setConsoleLogs(prev => [
            ...prev,
            `hop ${currentTtl}:  ${4 * currentTtl}ms   ${5 * currentTtl}ms   ${3 * currentTtl}ms   ${activeNode.ip}  [TTL=${currentTtl} expired ➔ ICMP Type 11]`
          ]);
          
          if (activeNode.ip === targetAddress || currentTtl === 4) {
            setConsoleLogs(prev => [...prev, `\nTrace complete. Target node reached successfully.`]);
            clearInterval(interval);
            setIsTracing(false);
          }
          currentTtl++;
        } else {
          clearInterval(interval);
          setIsTracing(false);
        }
      }, 900);
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: styles.panelBg,
      borderRadius: '16px',
      border: `1px solid ${styles.panelBorder}`,
      color: styles.titleText
    }}>
      
      {/* Header Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `2px solid ${styles.panelBorder}`, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            🛰️ ICMP Engine Diagnostic Labs (Ping & Traceroute)
          </h3>
          <p style={{ color: styles.descText, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Analyze Layer 3 TTL decrement mechanics, monitor ICMP packet control behavior, and map network hops.
          </p>
        </div>

        {/* Operating Control Toggles */}
        <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '8px', border: `1px solid ${styles.panelBorder}` }}>
          <button type="button" onClick={() => { setActiveMode('ping'); setConsoleLogs(["Ready to execute ICMP Ping test vectors."]); }} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeMode === 'ping' ? styles.toggleActiveBg : 'transparent', color: activeMode === 'ping' ? '#ffffff' : styles.descText }}>ICMP Ping</button>
          <button type="button" onClick={() => { setActiveMode('traceroute'); setConsoleLogs(["Ready to execute incremental TTL route trace vectors."]); }} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeMode === 'traceroute' ? styles.toggleActiveBg : 'transparent', color: activeMode === 'traceroute' ? '#ffffff' : styles.descText }}>Traceroute</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        
        {/* LEFT COLUMN: INTERACTIVE INPUT & PACKET SCHEMATIC MAP CONTAINER */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Target Host IP Destination</label>
              <input 
                type="text" 
                value={targetAddress} 
                onChange={(e) => setTargetAddress(e.target.value)}
                disabled={isTracing}
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '4px', border: `1px solid ${styles.panelBorder}`, backgroundColor: styles.chartBg, color: styles.titleText, fontFamily: 'monospace', fontWeight: 700 }}
              />
            </div>
            <button 
              onClick={handleDiagnosticRun}
              disabled={isTracing}
              style={{ padding: '0.55rem 1rem', border: 'none', borderRadius: '4px', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 800, cursor: 'pointer', opacity: isTracing ? 0.5 : 1 }}
            >
              EXECUTE
            </button>
          </div>

          {/* DYNAMIC HOP CORRIDOR CANVAS GRAPHIC */}
          <div style={{ backgroundColor: '#070a13', border: '1px solid #1e293b', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#475569', fontWeight: 'bold', textTransform: 'uppercase' }}>Active Packet Route Hop Progress</span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hopsData.map((node) => {
                const isActiveHop = currentHop === node.hop;
                return (
                  <div 
                    key={node.hop} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      backgroundColor: isActiveHop ? 'rgba(2,132,199,0.15)' : '#111827', 
                      border: isActiveHop ? '2px solid #38bdf8' : '1px solid #1e293b',
                      transition: 'all 0.2s ease',
                      transform: isActiveHop ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', width: '45px', color: isActiveHop ? '#38bdf8' : '#64748b', fontWeight: 'bold' }}>
                      Hop {node.hop}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isActiveHop ? '#38bdf8' : styles.titleText }}>{node.type}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace' }}>IP: {node.ip} | {node.location}</div>
                    </div>
                    {isActiveHop && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, backgroundColor: activeMode === 'ping' ? '#10b981' : '#f59e0b', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        {activeMode === 'ping' ? 'ECHO' : `TTL=${node.hop}`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CISCO SHELL MONITOR TERMINAL & THEORY MATRIX */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* TERMINAL CONSOLE EMULATOR */}
          <div style={{ 
            backgroundColor: styles.terminalBg, 
            borderRadius: '12px', 
            padding: '1.25rem', 
            border: '2px solid #334155',
            minHeight: '200px',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>
                NETFORGE VIRTUAL IOS COMMAND CONSOLE
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              </div>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: styles.terminalText, lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, overflowY: 'auto' }}>
              {consoleLogs.map((log, idx) => (
                <div key={idx} style={{ whiteSpace: 'pre-wrap' }}>{log}</div>
              ))}
            </div>
          </div>

          {/* QUICK REFERENCE TRIVIA SHEET */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', fontSize: '0.8rem', lineHeight: '1.5', color: styles.descText }}>
            <strong>Theoretical Mechanics Breakdown:</strong>
            <ul style={{ margin: '4px 0 0 0', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Ping</strong> emits an <code>ICMP Type 8 (Echo Request)</code> packet. The destination host fields this and maps back an <code>ICMP Type 0 (Echo Reply)</code> response.</li>
              <li><strong>Traceroute</strong> intentionally cascades outward using an initial <code>TTL=1</code> value. Every layer-3 router path boundary decrements this value by 1. When it hits 0, that router discards the packet and transmits an <code>ICMP Type 11 (Time Exceeded)</code> message back, logging its address.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};