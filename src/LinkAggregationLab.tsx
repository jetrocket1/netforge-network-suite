import React, { useState, useEffect, useRef } from 'react';

interface LinkAggregationLabProps {
  isDarkMode?: boolean;
}

export const LinkAggregationLab: React.FC<LinkAggregationLabProps> = ({ isDarkMode = true }) => {
  const [protocol, setProtocol] = useState<'STP' | 'LACP'>('STP');
  const [numLinks, setNumLinks] = useState<number>(4);
  const [severedLinks, setSeveredLinks] = useState<number[]>([]);
  
  const [trafficFlowing, setTrafficFlowing] = useState<boolean>(false);
  const [stpState, setStpState] = useState<'STABLE' | 'CONVERGING'>('STABLE');
  const [stpActiveIndex, setStpActiveIndex] = useState<number>(0);
  
  const [log, setLog] = useState<string>('Standard STP topology active. 1 link forwarding, remaining links are BLOCKED to prevent loops.');

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    blk: '#f43f5e',
    lst: '#eab308',
    idl: '#cbd5e1'
  };

  // --- ACTIONS ---
  const handleProtocolSwitch = (type: 'STP' | 'LACP') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setProtocol(type);
    setSeveredLinks([]);
    setStpState('STABLE');
    setStpActiveIndex(0);
    setTrafficFlowing(false);
    
    if (type === 'STP') {
      setLog(`Reverted to Standard STP. 1 link is FORWARDING. The remaining ${numLinks - 1} links are BLOCKED to prevent loops. Total bandwidth: 1 Gbps.`);
    } else {
      setLog(`LACP EtherChannel formed! STP sees all ${numLinks} links as ONE logical Port-Channel. Total bandwidth: ${numLinks} Gbps. Hardware load balancing active.`);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setNumLinks(val);
    setSeveredLinks([]);
    setStpState('STABLE');
    setStpActiveIndex(0);
    setTrafficFlowing(false);
    setLog(`Topology updated to ${val} physical links. ${protocol === 'LACP' ? `Port-Channel bandwidth scaled to ${val} Gbps.` : 'STP blocking all but 1 link.'}`);
  };

  const handleToggleTraffic = () => {
    if (trafficFlowing) {
      setTrafficFlowing(false);
      setLog('Traffic transmission halted.');
    } else {
      const activeCount = numLinks - severedLinks.length;
      if (activeCount === 0) {
        setLog('Cannot send traffic. All physical links are completely severed.');
        return;
      }
      if (protocol === 'STP' && stpState === 'CONVERGING') {
        setLog('Cannot send traffic. Network is currently down while STP recalculates...');
        return;
      }
      setTrafficFlowing(true);
      setLog(protocol === 'LACP' 
        ? `Traffic flowing. Hardware ASIC is hashing packets and load-balancing across ${activeCount} active links.` 
        : `Traffic flowing entirely over Link ${stpActiveIndex + 1}. Remaining links are idle/blocked.`);
    }
  };

  const handleSeverLink = () => {
    let target = -1;
    if (protocol === 'STP') {
      target = stpActiveIndex; // In STP, it's most impactful to sever the active link
      if (severedLinks.includes(target)) {
        target = Array.from({length: numLinks}).findIndex((_, i) => !severedLinks.includes(i));
      }
    } else {
      target = Array.from({length: numLinks}).findIndex((_, i) => !severedLinks.includes(i));
    }

    if (target === -1) return; // All severed

    const newSevered = [...severedLinks, target];
    setSeveredLinks(newSevered);

    if (protocol === 'STP') {
      const nextActive = Array.from({length: numLinks}).findIndex((_, i) => !newSevered.includes(i));
      if (nextActive !== -1 && target === stpActiveIndex) {
        setTrafficFlowing(false);
        setStpState('CONVERGING');
        setLog(`⚠️ CRITICAL: Active Link ${target + 1} severed! Traffic DROPPED. STP requires ~50 seconds to transition Link ${nextActive + 1} from Blocking -> Forwarding.`);
        
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setStpActiveIndex(nextActive);
          setStpState('STABLE');
          setLog(`✅ STP Convergence Complete. Link ${nextActive + 1} is now FORWARDING. Traffic may resume.`);
        }, 4000);
      } else if (nextActive === -1) {
        setTrafficFlowing(false);
        setLog(`💥 FATAL: All links severed. Network is completely down.`);
      } else {
        setLog(`⚠️ Blocked Link ${target + 1} severed. STP ignores it as it was already blocking traffic.`);
      }
    } else {
      const remaining = numLinks - newSevered.length;
      if (remaining > 0) {
        setLog(`⚠️ Link ${target + 1} severed! LACP EtherChannel drops to ${remaining} Gbps, but traffic fails over to remaining links INSTANTLY with 0 downtime.`);
      } else {
        setTrafficFlowing(false);
        setLog(`💥 FATAL: All links severed. Port-Channel interface goes DOWN.`);
      }
    }
  };

  const handleRepairAll = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSeveredLinks([]);
    
    if (protocol === 'STP') {
      setStpActiveIndex(0);
      setStpState('STABLE');
      setLog(`All links restored. STP recalculates and forces Link 1 to FORWARD, blocking links 2-${numLinks}.`);
    } else {
      setLog(`All links restored. LACP dynamically bundles them back into the Port-Channel. Bandwidth restored to ${numLinks} Gbps.`);
    }
  };

  // --- DERIVED METRICS ---
  const activeBandwidth = protocol === 'LACP' 
    ? numLinks - severedLinks.length 
    : (severedLinks.length < numLinks && stpState === 'STABLE' ? 1 : 0);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      <style>
        {`
          @keyframes packetFlowTop { 0% { left: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { left: 100%; opacity: 0; } }
          .packet {
            position: absolute; top: -6px; width: 16px; height: 16px; border-radius: 4px;
            display: flex; align-items: center; justify-content: center; font-size: 0.5rem; color: #fff; font-weight: bold;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
            animation: packetFlowTop 1.2s linear infinite;
          }
        `}
      </style>

      {/* HEADER */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>⛓️ Link Aggregation (LACP) Scalability Engine</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Scale physical links up to 8x and witness the architectural difference between STP blocking and hardware load balancing.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* PROTOCOL SWITCHER */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: styles.setupBg, padding: '6px', borderRadius: '8px' }}>
          <button onClick={() => handleProtocolSwitch('STP')} style={{ flex: 1, padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: protocol === 'STP' ? styles.accent : 'transparent', color: protocol === 'STP' ? '#fff' : styles.textMuted }}>🌲 Standard STP</button>
          <button onClick={() => handleProtocolSwitch('LACP')} style={{ flex: 1, padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: protocol === 'LACP' ? '#8b5cf6' : 'transparent', color: protocol === 'LACP' ? '#fff' : styles.textMuted }}>⛓️ LACP Port-Channel</button>
        </div>

        {/* SLIDER CONTROLS */}
        <div style={{ backgroundColor: styles.setupBg, padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            <span>Physical Copper Links</span>
            <span style={{ color: protocol === 'LACP' ? '#8b5cf6' : styles.accent }}>{numLinks} Links</span>
          </div>
          <input type="range" min="2" max="8" value={numLinks} onChange={handleSliderChange} style={{ width: '100%', cursor: 'pointer', accentColor: protocol === 'LACP' ? '#8b5cf6' : styles.accent }} />
        </div>
      </div>

      {/* ANIMATION CANVAS */}
      <div style={{ backgroundColor: '#05070f', border: '1px solid #1e293b', padding: '2rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', position: 'relative', width: '100%', maxWidth: '750px', margin: '0 auto', minHeight: `${Math.max(150, numLinks * 35 + 40)}px`, transition: 'min-height 0.3s' }}>
          
          {/* SWITCH 1 */}
          <div style={{ zIndex: 2, padding: '20px', borderRadius: '8px', backgroundColor: '#0f172a', border: `2px solid ${styles.accent}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🎛️</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Core-1</div>
          </div>

          {/* PHYSICAL LINK CARRIER BAY */}
          <div style={{ flex: 1, position: 'relative', margin: '0 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '20px 0' }}>
            
            {/* LOGICAL LACP BOUNDARY BOX */}
            <div style={{ 
              position: 'absolute', top: '0px', bottom: '0px', left: '-10px', right: '-10px', 
              border: `2px dashed ${protocol === 'LACP' ? '#8b5cf6' : 'transparent'}`, 
              borderRadius: '8px', backgroundColor: protocol === 'LACP' ? 'rgba(139, 92, 246, 0.05)' : 'transparent', 
              transition: 'all 0.5s ease', zIndex: 0 
            }}>
              {protocol === 'LACP' && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#8b5cf6', color: '#fff', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', letterSpacing: '1px' }}>LOGICAL PORT-CHANNEL ({activeBandwidth} Gbps)</div>}
            </div>

            {/* DYNAMIC LINK GENERATION */}
            {Array.from({ length: numLinks }).map((_, i) => {
              const isSevered = severedLinks.includes(i);
              
              let linkState = 'UP';
              if (isSevered) {
                linkState = 'DOWN';
              } else if (protocol === 'STP') {
                if (i === stpActiveIndex && stpState === 'STABLE') linkState = 'FORWARDING';
                else if (i === stpActiveIndex && stpState === 'CONVERGING') linkState = 'LISTENING';
                else linkState = 'BLOCKED';
              } else {
                linkState = 'FORWARDING';
              }

              const getLineColor = () => {
                if (linkState === 'DOWN') return styles.blk;
                if (linkState === 'BLOCKED') return styles.blk;
                if (linkState === 'LISTENING') return styles.lst;
                return styles.fwd;
              };

              // Determine visual traffic flow
              const isTrafficForwarding = trafficFlowing && linkState === 'FORWARDING';
              
              // Seed pseudo-random offsets based on index for natural looking flow in LACP
              const delay1 = (i * 0.4) % 1.2;
              const delay2 = ((i * 0.4) + 0.6) % 1.2;
              const colorHex = protocol === 'LACP' ? '#8b5cf6' : '#06b6d4';

              return (
                <div key={i} style={{ position: 'relative', height: '4px', backgroundColor: getLineColor(), borderRadius: '2px', zIndex: 1, transition: 'background-color 0.3s' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '10px', fontSize: '0.55rem', color: '#64748b', fontFamily: 'monospace' }}>Gi0/{i + 1}</div>
                  <div style={{ position: 'absolute', top: '-14px', right: '10px', fontSize: '0.55rem', color: '#64748b', fontFamily: 'monospace' }}>Gi0/{i + 1}</div>
                  
                  {linkState === 'DOWN' && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', color: styles.blk, fontSize: '0.7rem', fontWeight: 'bold' }}>❌ SEVERED</div>}
                  {linkState === 'BLOCKED' && <div style={{ position: 'absolute', top: '-12px', right: '-10px', color: styles.blk, fontSize: '1.2rem', lineHeight: '10px' }} title="STP Blocked">⛔</div>}
                  {linkState === 'LISTENING' && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', color: styles.lst, fontSize: '0.6rem', fontWeight: 'bold' }}>⏳ LEARNING...</div>}
                  
                  {isTrafficForwarding && (
                    <>
                      <div className="packet" style={{ animationDelay: `${delay1}s`, backgroundColor: colorHex }}>📦</div>
                      <div className="packet" style={{ animationDelay: `${delay2}s`, backgroundColor: colorHex }}>📦</div>
                    </>
                  )}
                </div>
              );
            })}

          </div>

          {/* SWITCH 2 */}
          <div style={{ zIndex: 2, padding: '20px', borderRadius: '8px', backgroundColor: '#0f172a', border: `2px solid ${styles.accent}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>🎛️</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Dist-2</div>
          </div>

        </div>
      </div>

      {/* CONTROLS & LOG */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        <div style={{ backgroundColor: styles.setupBg, padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>Incident Simulation</span>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handleToggleTraffic} 
              style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: trafficFlowing ? styles.blk : styles.fwd, color: '#fff', transition: 'all 0.2s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              {trafficFlowing ? '🛑 Stop Traffic' : '▶️ Stream Data'}
            </button>
            
            <button 
              onClick={handleSeverLink}
              disabled={severedLinks.length === numLinks}
              style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: `1px solid ${styles.blk}`, cursor: severedLinks.length === numLinks ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: styles.blk, transition: 'all 0.2s ease', opacity: severedLinks.length === numLinks ? 0.5 : 1 }}
            >
              ✂️ Sever Active Link
            </button>
          </div>
          
          <button 
            onClick={handleRepairAll}
            disabled={severedLinks.length === 0}
            style={{ width: '100%', padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '6px', border: `1px dashed ${styles.lst}`, cursor: severedLinks.length === 0 ? 'not-allowed' : 'pointer', backgroundColor: 'transparent', color: styles.lst, transition: 'all 0.2s ease', opacity: severedLinks.length === 0 ? 0.5 : 1 }}
          >
            🔧 Repair All Damaged Cables
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: styles.chartBg, borderRadius: '6px', marginTop: '10px' }}>
            <div style={{ fontSize: '0.7rem', color: styles.textMuted, fontWeight: 'bold' }}>Active Throughput Limit:</div>
            <div style={{ fontSize: '0.85rem', color: protocol === 'LACP' && activeBandwidth > 0 ? '#8b5cf6' : (activeBandwidth > 0 ? styles.fwd : styles.blk), fontWeight: 'bold', fontFamily: 'monospace' }}>
              {activeBandwidth} Gbps
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: styles.terminalBg, padding: '1.2rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: styles.terminalText }}>
          <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>SYSTEM & STP CONVERGENCE LOG</span>
          <div style={{ color: stpState === 'CONVERGING' ? styles.lst : (severedLinks.length > 0 ? styles.blk : '#cbd5e1') }}>{log}</div>
        </div>

      </div>

      {/* THEORY CHEATSHEET */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#8b5cf6' }}>🤝 The 802.3ad LACP Standard</h4>
          <p style={{ margin: 0, color: styles.textMuted }}>
            LACP (Link Aggregation Control Protocol) allows engineers to bundle up to <strong>8 active physical links</strong> into a single logical interface. Spanning Tree Protocol (STP) looks at this bundle and sees only <em>one</em> cable. Because STP only sees one path, it doesn't apply any blocking, enabling all 8 cables to push data simultaneously.
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.fwd }}>⚖️ Hardware Load Balancing Algorithms</h4>
          <p style={{ margin: 0, color: styles.textMuted }}>
            Frames do not get split into pieces. The switch ASIC runs a hash algorithm (typically using Source/Destination IP or MAC addresses) to assign a specific network conversation to a specific wire in the bundle. If a cable is severed, the switch instantly recalculates the hash and moves that conversation to a surviving cable with <strong>zero STP convergence delay</strong>.
          </p>
        </div>
      </div>

    </div>
  );
};

export default LinkAggregationLab;