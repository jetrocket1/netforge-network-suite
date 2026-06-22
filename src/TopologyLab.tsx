import React, { useState, useEffect } from 'react';

interface TopologyLabProps {
  isDarkMode?: boolean;
}

type TopologyType = 'star' | 'mesh' | 'ring' | 'bus' | 'hybrid' | 'spineLeaf';

export const TopologyLab: React.FC<TopologyLabProps> = ({ isDarkMode = true }) => {
  const [activeTopology, setActiveTopology] = useState<TopologyType>('star');
  const [brokenNode, setBrokenNode] = useState<number | null>(null);
  const [simStatus, setSimStatus] = useState<string>("System nominal. Select an infrastructure architecture topology and initialize link tests.");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [packetProgress, setPacketProgress] = useState<number>(0);

  // Animate the active packet tracer pulse along path vectors when triggered
  useEffect(() => {
    if (!isSimulating) {
      setPacketProgress(0);
      return;
    }
    
    const interval = setInterval(() => {
      setPacketProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          evaluateTestResult();
          return 100;
        }
        return prev + 4;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isSimulating]);

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
    accent: isDarkMode ? '#06b6d4' : '#0284c7', // Correctly uniform across the scope
    fwd: '#10b981',
    blk: '#ef4444',
    lst: '#eab308'
  };

  const topologies = {
    star: {
      name: 'Star Topology',
      desc: 'All endpoint devices attach directly to a central multiport switch node. The most ubiquitous modern design paradigm.',
      vulnerability: 'High dependency on the central switch. Individual line breaks kill single nodes, but a switch failure brings down the absolute entire segment.'
    },
    mesh: {
      name: 'Full Mesh Topology',
      desc: 'Every network host maintains individual physical connection paths to every single alternate host node on the system layout.',
      vulnerability: 'Extremely high design redundancy. Zero single points of failure, but highly expensive and complex to engineer physically.'
    },
    ring: {
      name: 'Token Ring Topology',
      desc: 'Hosts couple sequentially down a closed circular loop. Packets travel token-style in one continuous direction.',
      vulnerability: 'A single link fracture completely halts all token ring data traffic unless an expensive dual-ring fallback array is present.'
    },
    bus: {
      name: 'Linear Bus Topology',
      desc: 'Legacy backbone trunk routing system. Nodes clip directly along a single running transmission medium wire.',
      vulnerability: 'If the physical backbone trunk drops or loses its terminating end resistor blocks, all packet data collides and drops instantly.'
    },
    hybrid: {
      name: 'Star-Bus Hybrid Topology',
      desc: 'Combines multiple distinct topology types. Here, multiple star clusters are multiplexed together across a central linear backbone trunk wire.',
      vulnerability: 'If a local star node switch fails, only that specific room drops. If the central backbone cable breaks, the clusters are cut off from communicating with each other.'
    },
    spineLeaf: {
      name: 'Spine-and-Leaf Architecture',
      desc: 'Modern non-blocking Data Center fabric network layout. Every single lower-tier Leaf switch hooks directly to every upper-tier Spine switch.',
      vulnerability: 'Engineered for high east-west traffic flow. Dropping a single Spine switch reduces total throughput capacity, but zero link paths break down completely.'
    }
  };

  const evaluateTestResult = () => {
    if (brokenNode === null) {
      setSimStatus("SUCCESS: [Reply from target]: 64 bytes received. Latency <1ms. All pathways optimal and verified.");
      return;
    }

    switch (activeTopology) {
      case 'star':
        if (brokenNode === 5) setSimStatus("CRITICAL CRASH: Central Core Switch Node dropped! Total segment isolation detected. 100% packet loss.");
        else setSimStatus(`PARTIAL ALERT: Host ${brokenNode} link broken, but Central Switch routed packet successfully to remaining active hosts.`);
        break;
      case 'mesh':
        setSimStatus(`REDUNDANCY SUCCESS: Direct path to Host ${brokenNode} failed, but full mesh topology auto-rerouted packet vectors through secondary alternative paths effortlessly.`);
        break;
      case 'ring':
        setSimStatus("CRITICAL FAILURE: Token loop circuit broken! Loop data flow interrupted. Complete ring framework drops offline instantly due to loss of ring continuity.");
        break;
      case 'bus':
        setSimStatus("BACKBONE COLLAPSE: Trunk cable fault split the main broadcast path. Signals reflected, causing total packet collisions across the entire bus channel.");
        break;
      case 'hybrid':
        if (brokenNode === 1 || brokenNode === 2) setSimStatus(`LOCALIZED ALERT: Star Switch ${brokenNode} dropped. Its local host clusters are down, but the alternate cluster remains completely nominal.`);
        else setSimStatus("LINK ALERT: Endpoint node disconnected. Remaining hybrid cluster structure unaffected.");
        break;
      case 'spineLeaf':
        if (brokenNode === 1 || brokenNode === 2) {
          setSimStatus(`FABRIC WARNING: Spine Switch ${brokenNode === 1 ? 'A' : 'B'} went offline. Total cross-fabric backplane bandwidth capacity cut by 50%, but all Leaf nodes remain fully cross-connected.`);
        } else {
          setSimStatus(`NODE ALERT: Leaf Switch ${brokenNode} interface link changed status to DOWN. Downstream servers attached to this rack entry are isolated.`);
        }
        break;
    }
  };

  const runPacketTraceTest = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStatus("PING IN FLIGHT: Emitting echo broadcast stream vectors from host interface down the physical media layer...");
  };

  const getNodeCoords = (id: number) => {
    if (activeTopology === 'star') {
      if (id === 5) return { cx: 200, cy: 110 };
      if (id === 1) return { cx: 70,  cy: 40 };
      if (id === 2) return { cx: 330, cy: 40 };
      if (id === 3) return { cx: 330, cy: 180 };
      if (id === 4) return { cx: 70,  cy: 180 };
    }
    if (activeTopology === 'ring' || activeTopology === 'mesh') {
      if (id === 1) return { cx: 200, cy: 35 };
      if (id === 2) return { cx: 320, cy: 110 };
      if (id === 3) return { cx: 200, cy: 185 };
      if (id === 4) return { cx: 80,  cy: 110 };
    }
    if (activeTopology === 'bus') {
      if (id === 1) return { cx: 60,  cy: 45 };
      if (id === 2) return { cx: 150, cy: 45 };
      if (id === 3) return { cx: 240, cy: 175 };
      if (id === 4) return { cx: 330, cy: 175 };
    }
    if (activeTopology === 'hybrid') {
      if (id === 1) return { cx: 100, cy: 60 };  
      if (id === 2) return { cx: 300, cy: 60 };  
      if (id === 3) return { cx: 60,  cy: 150 }; 
      if (id === 4) return { cx: 140, cy: 150 }; 
      if (id === 5) return { cx: 260, cy: 150 }; 
      if (id === 6) return { cx: 340, cy: 150 }; 
    }
    if (activeTopology === 'spineLeaf') {
      if (id === 1) return { cx: 130, cy: 50 };  
      if (id === 2) return { cx: 270, cy: 50 };
      if (id === 3) return { cx: 80,  cy: 160 }; 
      if (id === 4) return { cx: 200, cy: 160 }; 
      if (id === 5) return { cx: 320, cy: 160 }; 
    }
    return { cx: 0, cy: 0 };
  };

  const getPacketPulsePos = (x1: number, y1: number, x2: number, y2: number) => {
    const pct = packetProgress / 100;
    return {
      x: x1 + (x2 - x1) * pct,
      y: y1 + (y2 - y1) * pct
    };
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.panelBg, borderRadius: '12px', border: styles.panelBorder, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER SECTION CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>🕸️ Interactive Layer 1 Network Topologies Laboratory</h3>
          <p style={{ color: styles.descText, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Simulate pathing routes, break critical link interfaces, and study structural single points of failure in real time.</p>
        </div>

        <div style={{ display: 'flex', backgroundColor: styles.setupBg, padding: '4px', borderRadius: '8px', border: styles.panelBorder, flexWrap: 'wrap', gap: '2px' }}>
          {(Object.keys(topologies) as TopologyType[]).map((t) => (
            <button key={t} type="button" onClick={() => { setActiveTopology(t); setBrokenNode(null); }} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', backgroundColor: activeTopology === t ? styles.toggleActiveBg : 'transparent', color: activeTopology === t ? '#ffffff' : styles.descText }}>{topologies[t].name.split(' ')[0]}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* INTERACTIVE SCHEMATIC CANVAS LAYOUT MAP */}
        <div style={{ flex: '1 1 380px', backgroundColor: '#070a13', borderRadius: '12px', padding: '1.5rem', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', minHeight: '320px', position: 'relative' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '1rem', fontFamily: 'monospace' }}>LIVE SCHEMATIC TOPOLOGY CANVAS</span>
          
          <div style={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100%" height="220" viewBox="0 0 400 220" style={{ overflow: 'visible' }}>
              
              {/* STAR MATRIX VECTOR SYSTEM */}
              {activeTopology === 'star' && [1, 2, 3, 4].map(id => {
                const broken = brokenNode === id || brokenNode === 5;
                const p1 = getNodeCoords(id);
                const p2 = getNodeCoords(5);
                const pulse = getPacketPulsePos(p1.cx, p1.cy, p2.cx, p2.cy);
                return (
                  <g key={id}>
                    <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={broken ? styles.blk : styles.fwd} strokeWidth={broken ? '3' : '2'} strokeDasharray={broken ? '4' : 'none'} />
                    {isSimulating && !broken && <circle cx={pulse.x} cy={pulse.y} r="5" fill="#ffffff" filter="blur(1px)" />}
                  </g>
                );
              })}

              {/* RING MATRIX VECTOR SYSTEM */}
              {activeTopology === 'ring' && [1, 2, 3, 4].map(id => {
                const nextId = id === 4 ? 1 : id + 1;
                const broken = brokenNode === id || brokenNode === nextId;
                const p1 = getNodeCoords(id);
                const p2 = getNodeCoords(nextId);
                const pulse = getPacketPulsePos(p1.cx, p1.cy, p2.cx, p2.cy);
                return (
                  <g key={id}>
                    <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={broken ? styles.blk : styles.fwd} strokeWidth={broken ? '3' : '2'} />
                    {isSimulating && !broken && <circle cx={pulse.x} cy={pulse.y} r="5" fill="#ffffff" />}
                  </g>
                );
              })}

              {/* BUS MATRIX LINEAR CABLE BACKBONE */}
              {activeTopology === 'bus' && (
                <>
                  <line x1="30" y1="110" x2="370" y2="110" stroke={brokenNode !== null ? styles.blk : styles.fwd} strokeWidth="4" />
                  {[1, 2].map(id => <line key={id} x1={getNodeCoords(id).cx} y1={getNodeCoords(id).cy} x2={getNodeCoords(id).cx} y2="110" stroke={brokenNode === id ? styles.blk : styles.fwd} strokeWidth="2" />)}
                  {[3, 4].map(id => <line key={id} x1={getNodeCoords(id).cx} y1={getNodeCoords(id).cy} x2={getNodeCoords(id).cx} y2="110" stroke={brokenNode === id ? styles.blk : styles.fwd} strokeWidth="2" />)}
                  {isSimulating && (
                    <circle cx={30 + (packetProgress * 3.4)} cy="110" r="6" fill={brokenNode !== null ? styles.blk : '#ffffff'} />
                  )}
                </>
              )}

              {/* FULL MESH REDUNDANT VECTOR INTERFACES */}
              {activeTopology === 'mesh' && [1, 2, 3, 4].map(start => 
                [1, 2, 3, 4].map(end => {
                  if (start >= end) return null;
                  const broken = brokenNode === start || brokenNode === end;
                  const p1 = getNodeCoords(start);
                  const p2 = getNodeCoords(end);
                  const pulse = getPacketPulsePos(p1.cx, p1.cy, p2.cx, p2.cy);
                  return (
                    <g key={`${start}-${end}`}>
                      <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={broken ? styles.blk : styles.fwd} strokeWidth="1.5" opacity={broken ? 0.3 : 0.7} />
                      {isSimulating && !broken && <circle cx={pulse.x} cy={pulse.y} r="4" fill="#ffffff" />}
                    </g>
                  );
                })
              )}

              {/* STAR-BUS HYBRID CONNECTOR SHAPES */}
              {activeTopology === 'hybrid' && (
                <>
                  <line x1="100" y1="60" x2="300" y2="60" stroke={brokenNode === 1 || brokenNode === 2 ? styles.blk : styles.fwd} strokeWidth="3" />
                  <line x1="100" y1="60" x2="60" y2="150" stroke={brokenNode === 1 || brokenNode === 3 ? styles.blk : styles.fwd} strokeWidth="2" />
                  <line x1="100" y1="60" x2="140" y2="150" stroke={brokenNode === 1 || brokenNode === 4 ? styles.blk : styles.fwd} strokeWidth="2" />
                  <line x1="300" y1="60" x2="260" y2="150" stroke={brokenNode === 2 || brokenNode === 5 ? styles.blk : styles.fwd} strokeWidth="2" />
                  <line x1="300" y1="60" x2="340" y2="150" stroke={brokenNode === 2 || brokenNode === 6 ? styles.blk : styles.fwd} strokeWidth="2" />
                  {isSimulating && <circle cx={100 + (packetProgress * 2)} cy="60" r="5" fill="#ffffff" />}
                </>
              )}

              {/* DC CLOS SPINE AND LEAF DATA FABRIC NETWORK */}
              {activeTopology === 'spineLeaf' && [1, 2].map(spineId => 
                [3, 4, 5].map(leafId => {
                  const broken = brokenNode === spineId || brokenNode === leafId;
                  const p1 = getNodeCoords(spineId);
                  const p2 = getNodeCoords(leafId);
                  const pulse = getPacketPulsePos(p1.cx, p1.cy, p2.cx, p2.cy);
                  return (
                    <g key={`${spineId}-${leafId}`}>
                      <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={broken ? styles.blk : styles.fwd} strokeWidth="1.5" opacity={broken ? 0.4 : 0.8} />
                      {isSimulating && !broken && <circle cx={pulse.x} cy={pulse.y} r="4" fill="#ffffff" />}
                    </g>
                  );
                })
              )}

              {/* RENDER GENERIC END NODES MAP */}
              {activeTopology !== 'hybrid' && activeTopology !== 'spineLeaf' && [1, 2, 3, 4].map(id => (
                <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                  <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="16" fill={brokenNode === id ? styles.blk : '#1e293b'} stroke={brokenNode === id ? '#b91c1c' : styles.accent} strokeWidth="2" />
                  <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill="#ffffff" style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>H{id}</text>
                </g>
              ))}

              {activeTopology === 'star' && (
                <g onClick={() => setBrokenNode(brokenNode === 5 ? null : 5)} style={{ cursor: 'pointer' }}>
                  <circle cx={getNodeCoords(5).cx} cy={getNodeCoords(5).cy} r="20" fill={brokenNode === 5 ? styles.blk : '#0284c7'} stroke={brokenNode === 5 ? '#b91c1c' : '#ffffff'} strokeWidth="2" />
                  <text x={getNodeCoords(5).cx} y={getNodeCoords(5).cy + 4} textAnchor="middle" fill="#ffffff" style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>SW</text>
                </g>
              )}

              {/* RENDER HYBRID NETWORK MATRIX HOUSES */}
              {activeTopology === 'hybrid' && (
                <>
                  {[1, 2].map(id => (
                    <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                      <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="18" fill={brokenNode === id ? styles.blk : '#0284c7'} stroke="#ffffff" strokeWidth="2" />
                      <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill="#ffffff" style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>SW{id}</text>
                    </g>
                  ))}
                  {[3, 4, 5, 6].map(id => (
                    <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                      <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="14" fill={brokenNode === id ? styles.blk : '#1e293b'} stroke={styles.accent} strokeWidth="1.5" />
                      <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill="#ffffff" style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>H{id}</text>
                    </g>
                  ))}
                </>
              )}

              {/* RENDER SPINE-LEAF FABRIC HOUSES */}
              {activeTopology === 'spineLeaf' && (
                <>
                  {[1, 2].map(id => (
                    <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                      <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="18" fill={brokenNode === id ? styles.blk : '#7c3aed'} stroke="#ffffff" strokeWidth="2" />
                      <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill="#ffffff" style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>SP{id === 1 ? 'A' : 'B'}</text>
                    </g>
                  ))}
                  {[3, 4, 5].map(id => (
                    <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                      <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="16" fill={brokenNode === id ? styles.blk : '#0d9488'} stroke="#ffffff" strokeWidth="1.5" />
                      <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill="#ffffff" style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>LF{id - 2}</text>
                    </g>
                  ))}
                </>
              )}

            </svg>
          </div>

          <button
            type="button"
            onClick={runPacketTraceTest}
            disabled={isSimulating}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 800, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.5 : 1 }}
          >
            {isSimulating ? 'TRANSMITTING SIMULATION...' : '⚡ FIRE PACKET INJECTION TEST'}
          </button>
        </div>

        {/* RIGHT COLUMN: SYSTEMS TELEMETRY DETAILS */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: styles.setupBg, padding: '1.25rem', borderRadius: '12px', border: styles.panelBorder }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{topologies[activeTopology].name}</h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: styles.descText, lineHeight: '1.5' }}>{topologies[activeTopology].desc}</p>
            
            <div style={{ padding: '10px', backgroundColor: 'rgba(234,179,8,0.1)', borderLeft: '4px solid #eab308', borderRadius: '4px', fontSize: '0.8rem', lineHeight: '1.4' }}>
              ⚠️ <strong>Fault Threshold:</strong> {topologies[activeTopology].vulnerability}
            </div>
          </div>

          <div style={{ backgroundColor: styles.terminalBg, padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#64748b', display: 'block', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>CONSOLE LOG OUTPUT MONITOR</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: styles.terminalText, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {simStatus}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TopologyLab;