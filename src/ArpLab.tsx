import React, { useState } from 'react';

interface ArpLabProps {
  isDarkMode?: boolean;
}

type ArpPhases = 'idle' | 'pc1-to-switch' | 'broadcast-flood' | 'unicast-reply' | 'complete';

export const ArpLab: React.FC<ArpLabProps> = ({ isDarkMode = true }) => {
  const [currentFramePhase, setCurrentFramePhase] = useState<ArpPhases>('idle');
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Core instructional stepper database
  const arpSteps = [
    {
      phase: 'idle',
      log: '[STATUS] Line configuration operational. PC1 cache missing hardware entry for 192.168.1.20. Ready to initialize discovery lookup.'
    },
    {
      phase: 'pc1-to-switch',
      log: '➡️ [STAGE 1] PC1 generates an ARP Request frame with Dst MAC: FF:FF:FF:FF:FF:FF. As the frame hits the Switch, the Switch inspects the Source MAC and learns that 00:11:22:AA:BB:CC lives on port Fa0/1.'
    },
    {
      phase: 'broadcast-flood',
      log: '🚨 [STAGE 2] Switch parses Dst MAC: FF:FF:FF:FF:FF:FF (Broadcast) and floods the frame out all active interfaces. Fa0/2 (PC2) matches the target IP and accepts the payload. Fa0/3 (PC3) realizes the IP matches someone else and drops the frame.'
    },
    {
      phase: 'unicast-reply',
      log: '⬅️ [STAGE 3] Target PC2 responds directly with an ARP Reply Unicast frame. It plugs its own hardware address into the Source block. As the frame traverses port Fa0/2, the switch learns PC2\'s MAC mapping on the fly.'
    },
    {
      phase: 'complete',
      log: '✅ [COMPLETE] Switch checks its CAM cache table, notes that the destination host MAC (PC1) lives on port Fa0/1, and forwards the unicast packet directly. PC1 updates its ARP storage matrix.'
    }
  ] as const;

  // Compute dynamic cache mappings mapped directly to active step properties
  const getDynamicArpTable = () => {
    const baseTable = [{ ip: '192.168.1.1', mac: '00:0A:95:9D:68:16', type: 'Static (Gateway)' }];
    if (stepIndex === 4) {
      return [...baseTable, { ip: '192.168.1.20', mac: '5E:FF:56:A1:C2:88', type: 'Dynamic (Resolved)' }];
    }
    return [...baseTable, { ip: '192.168.1.20', mac: '📥 NOT FOUND', type: 'Cache Miss' }];
  };

  const getDynamicCamTable = () => {
    const baseCam = [{ mac: '00:0A:95:9D:68:16', port: 'Fa0/24' }];
    if (stepIndex === 1) return [...baseCam, { mac: '00:11:22:AA:BB:CC', port: 'Fa0/1' }];
    if (stepIndex >= 2 && stepIndex < 3) return [...baseCam, { mac: '00:11:22:AA:BB:CC', port: 'Fa0/1' }];
    if (stepIndex >= 3) {
      return [
        ...baseCam,
        { mac: '00:11:22:AA:BB:CC', port: 'Fa0/1' },
        { mac: '5E:FF:56:A1:C2:88', port: 'Fa0/2' }
      ];
    }
    return baseCam;
  };

  const handleNextStep = () => {
    const nextIdx = (stepIndex + 1) % arpSteps.length;
    setStepIndex(nextIdx);
    setCurrentFramePhase(arpSteps[nextIdx].phase);
  };

  const resetLabBench = () => {
    setStepIndex(0);
    setCurrentFramePhase('idle');
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
    accent: isDarkMode ? '#06b6d4' : '#0284c7'
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* COMPONENT HEADER DISPLAY */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>📡 ARP Resolution &amp; Switch CAM Table Lab</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Manually advance through frame propagation phases to watch the address cache and Layer 2 switch CAM mappings dynamically populate.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        
        {/* INTERACTIVE TOPOLOGY DIAGRAM AREA */}
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* FIXED: Replaced invalid relative layout param with valid position rule */}
          <div style={{ backgroundColor: '#070a13', border: '1px solid #1e293b', padding: '1rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', gap: '10px', minHeight: '220px', boxSizing: 'border-box', position: 'relative' }}>
            
            {/* SOURCE ENDPOINT SENDER NODE */}
            <div style={{ textAlign: 'center', border: `1px solid ${currentFramePhase === 'pc1-to-switch' ? styles.accent : '#1e293b'}`, padding: '10px', borderRadius: '8px', backgroundColor: currentFramePhase === 'pc1-to-switch' ? 'rgba(6,182,212,0.05)' : 'transparent', transition: 'all 0.2s ease' }}>
              <div style={{ fontSize: '1.5rem' }}>💻</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: styles.accent }}>PC1 (Sender)</div>
              <div style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#64748b', marginTop: '2px' }}>IP: 192.168.1.5<br />MAC: 00:11:22:AA:BB:CC<br />Port: Fa0/1</div>
              
              {currentFramePhase === 'pc1-to-switch' && (
                <div style={{ marginTop: '8px', padding: '3px', backgroundColor: '#eab308', color: '#000', fontSize: '0.52rem', fontWeight: 'bold', borderRadius: '3px', fontFamily: 'monospace' }}>📦 ARP REQ OUT</div>
              )}
              {currentFramePhase === 'complete' && (
                <div style={{ marginTop: '8px', padding: '3px', backgroundColor: '#10b981', color: '#fff', fontSize: '0.52rem', fontWeight: 'bold', borderRadius: '3px', fontFamily: 'monospace' }}>📥 UNICAST IN</div>
              )}
            </div>

            {/* MIDDLE HARDWARE SWITCH AGGREGATION BLOCK */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div style={{ padding: '12px 6px', backgroundColor: '#1e293b', border: '2px solid #475569', borderRadius: '6px', textAlign: 'center', width: '100%', boxSizing: 'border-box', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                <div style={{ fontSize: '1.2rem', margin: 0 }}>🎛️</div>
                <div style={{ fontSize: '0.55rem', fontWeight: 'extrabold', fontFamily: 'monospace', color: '#cbd5e1', marginTop: '2px' }}>SWITCH</div>
              </div>
            </div>

            {/* TARGET EDGE TERMINAL DEVICES LAYOUT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* TARGET MATCH NODE */}
              <div style={{ textAlign: 'center', border: `1px solid ${currentFramePhase === 'broadcast-flood' ? '#eab308' : currentFramePhase === 'unicast-reply' ? '#10b981' : '#1e293b'}`, padding: '8px', borderRadius: '8px', backgroundColor: currentFramePhase === 'broadcast-flood' ? 'rgba(234,179,8,0.04)' : currentFramePhase === 'unicast-reply' ? 'rgba(16,185,129,0.04)' : 'transparent', transition: 'all 0.2s ease' }}>
                <div style={{ fontSize: '1.2rem' }}>🖥️</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: currentFramePhase === 'unicast-reply' ? '#10b981' : styles.textPrimary }}>PC2 (Target IP)</div>
                <div style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#64748b' }}>IP: 192.168.1.20<br />Port: Fa0/2</div>
                
                {currentFramePhase === 'broadcast-flood' && (
                  <div style={{ marginTop: '4px', padding: '2px', backgroundColor: '#eab308', color: '#000', fontSize: '0.52rem', fontWeight: 'bold', borderRadius: '2px', fontFamily: 'monospace' }}>🚨 ACCEPT MATCH</div>
                )}
                {currentFramePhase === 'unicast-reply' && (
                  <div style={{ marginTop: '4px', padding: '2px', backgroundColor: '#10b981', color: '#fff', fontSize: '0.52rem', fontWeight: 'bold', borderRadius: '2px', fontFamily: 'monospace' }}>⚡ SENDING REPLY</div>
                )}
              </div>

              {/* NON-TARGET MISMATCH DROP STATION */}
              <div style={{ textAlign: 'center', border: `1px solid ${currentFramePhase === 'broadcast-flood' ? '#ef4444' : '#1e293b'}`, padding: '8px', borderRadius: '8px', backgroundColor: currentFramePhase === 'broadcast-flood' ? 'rgba(239,68,68,0.04)' : 'transparent', transition: 'all 0.2s ease', opacity: ['unicast-reply', 'complete'].includes(currentFramePhase) ? 0.3 : 1 }}>
                <div style={{ fontSize: '1.2rem' }}>🖥️</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: styles.textMuted }}>PC3 (Other Node)</div>
                <div style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: '#64748b' }}>IP: 192.168.1.30<br />Port: Fa0/3</div>
                
                {currentFramePhase === 'broadcast-flood' && (
                  <div style={{ marginTop: '4px', padding: '2px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.52rem', fontWeight: 'bold', borderRadius: '2px', fontFamily: 'monospace' }}>❌ FRAME DROPPED</div>
                )}
              </div>

            </div>

          </div>

          {/* STEP CONTROLLER ACTION BUTTON MATRIX BAR */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={handleNextStep} style={{ flex: 2, padding: '0.75rem', border: 'none', borderRadius: '6px', backgroundColor: stepIndex === arpSteps.length - 1 ? '#10b981' : styles.accent, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
              {stepIndex === 0 ? '🏁 Initialize Address Discovery' : stepIndex === arpSteps.length - 1 ? '🔄 Reset Lab Bench' : '⏩ Next Blueprint Step'}
            </button>
            {stepIndex > 0 && (
              <button type="button" onClick={resetLabBench} style={{ flex: 1, padding: '0.75rem', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Reset</button>
            )}
          </div>
        </div>

        {/* LOG TERMINAL DIAGNOSTIC INTERFACE */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: styles.terminalBg, borderRadius: '12px', padding: '1.25rem', border: '1px solid #1e293b', flexGrow: 1, minHeight: '180px', fontFamily: 'monospace', fontSize: '0.75rem', color: styles.terminalText, lineHeight: '1.6' }}>
            <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '8px', fontWeight: 'bold' }}>CS_FABRIC ARPS TERMINAL EXECUTION TRACKER [STEP {stepIndex} / 4]</span>
            <div style={{ color: currentFramePhase === 'broadcast-flood' ? '#eab308' : '#cbd5e1' }}>
              {arpSteps[stepIndex].log}
            </div>
          </div>
        </div>

      </div>

      {/* DYNAMIC COMPONENT CACHE MATRIX TABLES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
        
        {/* HOST CACHE MAP */}
        <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', border: styles.border }}>
          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>PC1 ARP Table (`arp -a`)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'monospace', fontSize: '0.65rem' }}>
            {getDynamicArpTable().map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', backgroundColor: styles.chartBg, borderRadius: '4px' }}>
                <span style={{ color: '#fff' }}>{entry.ip}</span>
                <span style={{ color: entry.type.includes('Miss') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{entry.mac}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SWITCH MAC TABLE */}
        <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', border: styles.border }}>
          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Switch CAM Table (`show mac address-table`)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'monospace', fontSize: '0.65rem' }}>
            {getDynamicCamTable().map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', backgroundColor: styles.chartBg, borderRadius: '4px', color: '#38bdf8' }}>
                <span>{entry.mac}</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{entry.port}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default ArpLab;