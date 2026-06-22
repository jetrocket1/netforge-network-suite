import React, { useState } from 'react';

interface WifiRoamingLabProps {
  isDarkMode?: boolean;
}

export const WifiRoamingLab: React.FC<WifiRoamingLabProps> = ({ isDarkMode = true }) => {
  const [clientPos, setClientPos] = useState<number>(30); // Percent across the cell footprint (0 to 100)
  const [roamLog, setRoamLog] = useState<string[]>([
    "📶 Client connected to AP-Primary. Signal strength is optimal."
  ]);
  const [currentAP, setCurrentAP] = useState<'Primary' | 'Secondary'>('Primary');

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

  // Calculate dynamic RSSI decibel values based on slider positioning relative to AP focal points
  const rssiAP1 = Math.max(-90, Math.min(-30, -30 - Math.abs(clientPos - 25) * 1.2));
  const rssiAP2 = Math.max(-90, Math.min(-30, -30 - Math.abs(clientPos - 75) * 1.2));

  const handlePositionChange = (val: number) => {
    setClientPos(val);
    
    // Roaming Threshold evaluation logic loop (-72 dBm threshold standard)
    if (currentAP === 'Primary' && rssiAP1 < -72 && rssiAP2 > rssiAP1) {
      setCurrentAP('Secondary');
      setRoamLog([
        `⚠️ RSSI dropped to ${Math.floor(rssiAP1)} dBm (Below -72 dBm roaming trigger).`,
        "📡 802.11k neighboring BSSID report requested.",
        "⚡ 802.11v BSS Transition Management frame evaluated.",
        "🤝 802.11r Fast Transition key cache verified via WLC.",
        `🚀 Roam Seamlessly Complete! Switched to AP-Secondary (RSSI: ${Math.floor(rssiAP2)} dBm) [~5ms delay].`
      ]);
    } else if (currentAP === 'Secondary' && rssiAP2 < -72 && rssiAP1 > rssiAP2) {
      setCurrentAP('Primary');
      setRoamLog([
        `⚠️ RSSI dropped to ${Math.floor(rssiAP2)} dBm (Below -72 dBm roaming trigger).`,
        "📡 802.11k neighboring BSSID report requested.",
        "⚡ 802.11v BSS Transition Management frame evaluated.",
        "🤝 802.11r Fast Transition key cache verified via WLC.",
        `🚀 Roam Seamlessly Complete! Switched to AP-Primary (RSSI: ${Math.floor(rssiAP1)} dBm) [~5ms delay].`
      ]);
    }
  };

  // Determine boundary colors to visually demonstrate cell coverage overlaps
  const isOverlapZone = clientPos >= 45 && clientPos <= 55;

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>📶 Wi-Fi Roaming & Overlap Laboratory</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Visualize how client devices shift associations between wireless cells based on signal thresholds and boundary overlap zones.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        
        {/* TOPOLOGY GRAPHIC CONTROLLER TRACK */}
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>
              Drag Client Position Through Cells: {clientPos}% Across Footprint
            </label>
            <input type="range" min="5" max="95" value={clientPos} onChange={(e) => handlePositionChange(parseInt(e.target.value) || 30)} style={{ width: '100%', accentColor: styles.accent, cursor: 'pointer' }} />
          </div>

          {/* SIGNAL COVERAGE BLUEPRINT FIELD */}
          <div style={{ backgroundColor: '#070a13', border: '1px solid #1e293b', padding: '2rem 1.5rem', borderRadius: '12px', position: 'relative', height: '180px', display: 'flex', alignItems: 'center', boxSizing: 'border-box', overflow: 'hidden' }}>
            
            {/* CELL 1 RADIAL HALO FADE (AP PRIMARY) */}
            <div style={{ position: 'absolute', left: '25%', top: '50%', transform: 'translate(-50%, -50%)', width: '55%', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 75%)', border: `1px solid ${currentAP === 'Primary' ? '#06b6d488' : 'rgba(255,255,255,0.02)'}`, transition: 'all 0.2s ease' }}>
              <div style={{ position: 'absolute', top: '20%', bottom: '20%', left: '20%', right: '20%', borderRadius: '50%', border: '1px dashed rgba(6,182,212,0.2)' }} />
            </div>
            
            {/* CELL 2 RADIAL HALO FADE (AP SECONDARY) */}
            <div style={{ position: 'absolute', left: '75%', top: '50%', transform: 'translate(-50%, -50%)', width: '55%', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 75%)', border: `1px solid ${currentAP === 'Secondary' ? '#a855f788' : 'rgba(255,255,255,0.02)'}`, transition: 'all 0.2s ease' }}>
              <div style={{ position: 'absolute', top: '20%', bottom: '20%', left: '20%', right: '20%', borderRadius: '50%', border: '1px dashed rgba(168,85,247,0.15)' }} />
            </div>

            {/* OVERLAP REGION RECTANGLE INDICATOR */}
            <div style={{ position: 'absolute', left: '45%', width: '10%', top: '10px', bottom: '10px', borderLeft: `1px dashed ${isOverlapZone ? '#10b981' : 'rgba(71,85,105,0.3)'}`, borderRight: `1px dashed ${isOverlapZone ? '#10b981' : 'rgba(71,85,105,0.3)'}`, backgroundColor: isOverlapZone ? 'rgba(16,185,129,0.06)' : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, transition: 'all 0.2s ease' }}>
              <span style={{ fontSize: '0.55rem', color: isOverlapZone ? '#10b981' : '#475569', fontWeight: 'bold', textTransform: 'uppercase', writingMode: 'vertical-lr', letterSpacing: '1px' }}>Overlap Zone</span>
              {isOverlapZone && <span style={{ position: 'absolute', bottom: '6px', fontSize: '0.45rem', backgroundColor: '#10b981', color: '#fff', padding: '1px 3px', borderRadius: '2px', fontWeight: 'bold', whiteSpace: 'nowrap', transform: 'scale(0.85)' }}>15-20% OK</span>}
            </div>

            {/* ACTIVE VECTOR TETHER LINE */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
              <line 
                x1={currentAP === 'Primary' ? '25%' : '75%'} y1='50%' 
                x2={`${clientPos}%`} y2='50%' 
                stroke={currentAP === 'Primary' ? '#06b6d4' : '#a855f7'} 
                strokeWidth='2' 
                strokeDasharray='4 4'
                style={{ opacity: 0.6 }}
              />
            </svg>

            {/* BASESTATION AP INTERFACES */}
            <div style={{ position: 'absolute', left: '25%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 3 }}>
              <div style={{ fontSize: '1.2rem', textShadow: currentAP === 'Primary' ? '0 0 10px #06b6d4' : 'none' }}>📡</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: currentAP === 'Primary' ? '#06b6d4' : styles.textMuted }}>AP-Primary (Ch 1)</div>
              <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: currentAP === 'Primary' ? '#06b6d4' : '#64748b', fontWeight: 'bold' }}>{Math.floor(rssiAP1)} dBm</div>
            </div>

            <div style={{ position: 'absolute', left: '75%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 3 }}>
              <div style={{ fontSize: '1.2rem', textShadow: currentAP === 'Secondary' ? '0 0 10px #a855f7' : 'none' }}>📡</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: currentAP === 'Secondary' ? '#a855f7' : styles.textMuted }}>AP-Secondary (Ch 6)</div>
              <div style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: currentAP === 'Secondary' ? '#a855f7' : '#64748b', fontWeight: 'bold' }}>{Math.floor(rssiAP2)} dBm</div>
            </div>

            {/* USER CLIENT HARDWARE DEVICE PROBE */}
            <div style={{ 
              position: 'absolute', left: `${clientPos}%`, top: '50%', transform: 'translate(-50%, -50%)', 
              padding: '6px 10px', backgroundColor: '#ffffff', color: '#0f172a', borderRadius: '6px', 
              fontSize: '0.65rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', 
              border: `2px solid ${currentAP === 'Primary' ? '#06b6d4' : '#a855f7'}`,
              zIndex: 10, transition: 'border 0.2s ease, left 0.1s linear'
            }}>
              📱 Client ({currentAP === 'Primary' ? 'AP-1' : 'AP-2'})
            </div>

          </div>
        </div>

        {/* TELEMETRY WINDOW */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: styles.terminalBg, borderRadius: '8px', padding: '1rem', border: '1px solid #1e293b', minHeight: '150px', flexGrow: 1, fontFamily: 'monospace', fontSize: '0.7rem', color: styles.terminalText, lineHeight: '1.5' }}>
            <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold' }}>802.11 FT HANDSHAKE SUBSYSTEM LOG</span>
            {roamLog.map((log, i) => <div key={i} style={{ marginBottom: '3px', color: log.startsWith('🚀') ? '#10b981' : (log.startsWith('⚠️') ? '#f43f5e' : styles.terminalText) }}>{log}</div>)}
          </div>
        </div>

      </div>

      {/* ENTERPRISE STUDY MATERIAL BLOCK */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.accent }}>📐 The Rule of Overlap (15% to 20%)</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: '1.5', color: styles.textMuted }}>
              If adjacent access points don't overlap enough, devices will enter a <strong>dead zone</strong> where the signal drops completely before the new connection can map its handshake. If they overlap too much, devices will waste energy bouncing between links repeatedly, causing a bug known as <strong>channel flapping</strong>.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: isDarkMode ? '#a855f7' : '#7c3aed' }}>🎯 The Roaming Threshold (-72 dBm)</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: '1.5', color: styles.textMuted }}>
              Smartphones and computers do not hold onto an AP down to zero power. When a client tracking profile senses its current baseline drop below approximately <strong>-72 dBm</strong>, it triggers background scanning protocols to transition to a closer antenna node seamlessly.
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '8px', border: styles.border }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 700, color: styles.accent }}>🧬 Enterprise Roaming Optimization Suite</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: '#06b6d4' }}>📡 802.11k — Radio Resource Management</h5>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.75rem', lineHeight: '1.5' }}>
                Speeds up cell discovery. Instead of a client stalling traffic to blindly probe all available channels, <strong>802.11k</strong> allows the device to request a structured <strong>Neighbor Report</strong> from its active AP. This provides a clean list of nearby candidate BSSIDs and their target channels beforehand.
              </p>
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: '#a855f7' }}>⚡ 802.11v — BSS Transition Management</h5>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.75rem', lineHeight: '1.5' }}>
                Enforces network steering controls. If a client device holds onto a distant AP layout stubbornly (acting as a "sticky client"), <strong>802.11v</strong> allows the infrastructure controller to send an explicit directive telling the endpoint exactly which closer AP node to associate with next.
              </p>
            </div>
            <div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>🤝 802.11r — Fast BSS Transition (FT)</h5>
              <p style={{ margin: 0, color: styles.textMuted, fontSize: '0.75rem', lineHeight: '1.5' }}>
                Eliminates multi-step standard authentication delays. By pre-caching decryption handshake keys across adjacent AP profiles using the Wireless LAN Controller (WLC), <strong>802.11r</strong> slashes handoff times from ~100ms down to **under 10ms**, keeping voice over IP calls from clipping.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default WifiRoamingLab;