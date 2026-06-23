import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';

interface TopologyLabProps { isDarkMode?: boolean; }
type TopologyType = 'star' | 'mesh' | 'ring' | 'bus' | 'hybrid' | 'spineLeaf';

export const TopologyLab: React.FC<TopologyLabProps> = ({ isDarkMode = true }) => {
  const [activeTopology, setActiveTopology] = useState<TopologyType>('star');
  const [brokenNode, setBrokenNode] = useState<number | null>(null);
  const [simStatus, setSimStatus] = useState<string>('Select a topology and click "Run Test" to simulate packet delivery.');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [packetProgress, setPacketProgress] = useState<number>(0);
  const T = getLabTheme(isDarkMode);

  useEffect(() => {
    if (!isSimulating) { setPacketProgress(0); return; }
    const interval = setInterval(() => {
      setPacketProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsSimulating(false); evaluateTestResult(); return 100; }
        return prev + 4;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const topologies: Record<TopologyType, { name: string; desc: string; vulnerability: string }> = {
    star: {
      name: 'Star',
      desc: 'All devices connect to a central switch. The most common design in modern LANs — easy to manage and isolate faults.',
      vulnerability: 'If the central switch fails, the entire segment goes down. Individual host failures only affect that one device.'
    },
    mesh: {
      name: 'Full Mesh',
      desc: 'Every device has a direct link to every other device. Extremely resilient — used in core network backbones.',
      vulnerability: 'No single point of failure. However, the number of links grows exponentially with each new device added.'
    },
    ring: {
      name: 'Ring',
      desc: 'Devices form a closed loop, each connected to its two neighbours. Data travels in one direction around the ring.',
      vulnerability: 'A single link break halts all traffic unless a dual-ring failover is in place.'
    },
    bus: {
      name: 'Bus',
      desc: 'All devices share one backbone cable. A legacy design from early Ethernet that is rarely used today.',
      vulnerability: 'A fault or missing terminator on the backbone causes signal reflection and total network collapse.'
    },
    hybrid: {
      name: 'Star-Bus Hybrid',
      desc: 'Multiple star clusters connected via a backbone bus. Common in campus networks built in stages.',
      vulnerability: 'A local switch failure takes down one cluster. A backbone failure disconnects all clusters from each other.'
    },
    spineLeaf: {
      name: 'Spine-Leaf',
      desc: 'A modern data centre fabric. Every leaf switch connects to every spine switch, enabling predictable low-latency east-west traffic.',
      vulnerability: 'Losing one spine reduces total bandwidth by 50%, but no paths are fully cut. All leaf-to-leaf routes remain reachable.'
    }
  };

  const evaluateTestResult = () => {
    if (brokenNode === null) { setSimStatus('Success — 64 bytes received. All paths verified. Latency < 1 ms.'); return; }
    switch (activeTopology) {
      case 'star':
        if (brokenNode === 5) setSimStatus('Critical failure — the central switch is down. 100% packet loss across the entire segment.');
        else setSimStatus(`Partial loss — Host ${brokenNode} is unreachable, but the switch routed successfully to all other active hosts.`);
        break;
      case 'mesh':
        setSimStatus(`Rerouted — the direct path to Host ${brokenNode} failed, but the full mesh found an alternate route automatically.`);
        break;
      case 'ring':
        setSimStatus('Ring broken — token loop interrupted. All traffic halts until the break is repaired.');
        break;
      case 'bus':
        setSimStatus('Backbone fault — signal reflections caused collisions. Complete network outage on this segment.');
        break;
      case 'hybrid':
        if (brokenNode === 1 || brokenNode === 2) setSimStatus(`Local switch ${brokenNode} failed. Its cluster is isolated, but the other cluster continues normally.`);
        else setSimStatus('Single host disconnected. The rest of the hybrid topology is unaffected.');
        break;
      case 'spineLeaf':
        if (brokenNode === 1 || brokenNode === 2) setSimStatus(`Spine ${brokenNode === 1 ? 'A' : 'B'} offline — bandwidth reduced by 50%, but all leaf nodes remain fully interconnected.`);
        else setSimStatus(`Leaf ${brokenNode} offline — devices on that rack are isolated. All other leaves unaffected.`);
        break;
    }
  };

  const runPacketTraceTest = () => { if (isSimulating) return; setIsSimulating(true); setSimStatus('Sending echo request...'); };

  const getNodeCoords = (id: number) => {
    if (activeTopology === 'star') {
      if (id === 5) return { cx: 200, cy: 110 };
      if (id === 1) return { cx: 70, cy: 40 }; if (id === 2) return { cx: 330, cy: 40 };
      if (id === 3) return { cx: 330, cy: 180 }; if (id === 4) return { cx: 70, cy: 180 };
    }
    if (activeTopology === 'ring' || activeTopology === 'mesh') {
      if (id === 1) return { cx: 200, cy: 35 }; if (id === 2) return { cx: 320, cy: 110 };
      if (id === 3) return { cx: 200, cy: 185 }; if (id === 4) return { cx: 80, cy: 110 };
    }
    if (activeTopology === 'bus') {
      if (id === 1) return { cx: 60, cy: 45 }; if (id === 2) return { cx: 150, cy: 45 };
      if (id === 3) return { cx: 240, cy: 175 }; if (id === 4) return { cx: 330, cy: 175 };
    }
    if (activeTopology === 'hybrid') {
      if (id === 1) return { cx: 100, cy: 60 }; if (id === 2) return { cx: 300, cy: 60 };
      if (id === 3) return { cx: 60, cy: 150 }; if (id === 4) return { cx: 140, cy: 150 };
      if (id === 5) return { cx: 260, cy: 150 }; if (id === 6) return { cx: 340, cy: 150 };
    }
    if (activeTopology === 'spineLeaf') {
      if (id === 1) return { cx: 130, cy: 50 }; if (id === 2) return { cx: 270, cy: 50 };
      if (id === 3) return { cx: 80, cy: 160 }; if (id === 4) return { cx: 200, cy: 160 }; if (id === 5) return { cx: 320, cy: 160 };
    }
    return { cx: 0, cy: 0 };
  };

  const pulse = (x1: number, y1: number, x2: number, y2: number) => ({
    x: x1 + (x2 - x1) * (packetProgress / 100),
    y: y1 + (y2 - y1) * (packetProgress / 100),
  });

  const linkColor = (broken: boolean) => broken ? T.danger : T.success;
  const nodeBase = { rx: 14, fill: T.panelBg, stroke: T.accent };

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Network Topologies</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
            Click nodes to break links, then run a test to see how each topology responds to failure.
          </p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border, flexWrap: 'wrap', gap: '2px' }}>
          {(Object.keys(topologies) as TopologyType[]).map(t => (
            <button key={t} type="button" onClick={() => { setActiveTopology(t); setBrokenNode(null); setSimStatus('Select a topology and click "Run Test" to simulate packet delivery.'); }}
              style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', backgroundColor: activeTopology === t ? T.accent : 'transparent', color: activeTopology === t ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
              {topologies[t].name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Canvas */}
        <div style={{ flex: '1 1 380px', backgroundColor: T.insetBg, borderRadius: '12px', padding: '1.5rem', border: T.border, display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Topology diagram — click nodes to toggle failures
          </span>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="100%" height="220" viewBox="0 0 400 220" style={{ overflow: 'visible' }}>

              {activeTopology === 'star' && [1,2,3,4].map(id => {
                const broken = brokenNode === id || brokenNode === 5;
                const p1 = getNodeCoords(id), p2 = getNodeCoords(5);
                const p = pulse(p1.cx, p1.cy, p2.cx, p2.cy);
                return <g key={id}>
                  <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={linkColor(broken)} strokeWidth={broken ? 2 : 1.5} strokeDasharray={broken ? '5 4' : 'none'} opacity={broken ? 0.5 : 0.8} />
                  {isSimulating && !broken && <circle cx={p.x} cy={p.y} r="5" fill={T.accent} opacity="0.9" />}
                </g>;
              })}

              {activeTopology === 'ring' && [1,2,3,4].map(id => {
                const nextId = id === 4 ? 1 : id + 1;
                const broken = brokenNode === id || brokenNode === nextId;
                const p1 = getNodeCoords(id), p2 = getNodeCoords(nextId);
                const p = pulse(p1.cx, p1.cy, p2.cx, p2.cy);
                return <g key={id}>
                  <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={linkColor(broken)} strokeWidth={1.5} strokeDasharray={broken ? '5 4' : 'none'} opacity={0.8} />
                  {isSimulating && !broken && <circle cx={p.x} cy={p.y} r="5" fill={T.accent} />}
                </g>;
              })}

              {activeTopology === 'bus' && <>
                <line x1="30" y1="110" x2="370" y2="110" stroke={brokenNode !== null ? T.danger : T.success} strokeWidth="3" opacity="0.8" />
                {[1,2].map(id => <line key={id} x1={getNodeCoords(id).cx} y1={getNodeCoords(id).cy} x2={getNodeCoords(id).cx} y2="110" stroke={brokenNode === id ? T.danger : T.success} strokeWidth="1.5" />)}
                {[3,4].map(id => <line key={id} x1={getNodeCoords(id).cx} y1={getNodeCoords(id).cy} x2={getNodeCoords(id).cx} y2="110" stroke={brokenNode === id ? T.danger : T.success} strokeWidth="1.5" />)}
                {isSimulating && <circle cx={30 + packetProgress * 3.4} cy="110" r="5" fill={brokenNode !== null ? T.danger : T.accent} />}
              </>}

              {activeTopology === 'mesh' && [1,2,3,4].map(start => [1,2,3,4].map(end => {
                if (start >= end) return null;
                const broken = brokenNode === start || brokenNode === end;
                const p1 = getNodeCoords(start), p2 = getNodeCoords(end);
                const p = pulse(p1.cx, p1.cy, p2.cx, p2.cy);
                return <g key={`${start}-${end}`}>
                  <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={linkColor(broken)} strokeWidth="1.5" opacity={broken ? 0.2 : 0.6} strokeDasharray={broken ? '4 3' : 'none'} />
                  {isSimulating && !broken && <circle cx={p.x} cy={p.y} r="4" fill={T.accent} />}
                </g>;
              }))}

              {activeTopology === 'hybrid' && <>
                <line x1="100" y1="60" x2="300" y2="60" stroke={brokenNode === 1 || brokenNode === 2 ? T.danger : T.success} strokeWidth="2.5" opacity="0.8" />
                <line x1="100" y1="60" x2="60" y2="150" stroke={brokenNode === 1 || brokenNode === 3 ? T.danger : T.success} strokeWidth="1.5" opacity="0.8" />
                <line x1="100" y1="60" x2="140" y2="150" stroke={brokenNode === 1 || brokenNode === 4 ? T.danger : T.success} strokeWidth="1.5" opacity="0.8" />
                <line x1="300" y1="60" x2="260" y2="150" stroke={brokenNode === 2 || brokenNode === 5 ? T.danger : T.success} strokeWidth="1.5" opacity="0.8" />
                <line x1="300" y1="60" x2="340" y2="150" stroke={brokenNode === 2 || brokenNode === 6 ? T.danger : T.success} strokeWidth="1.5" opacity="0.8" />
                {isSimulating && <circle cx={100 + packetProgress * 2} cy="60" r="5" fill={T.accent} />}
              </>}

              {activeTopology === 'spineLeaf' && [1,2].map(spineId => [3,4,5].map(leafId => {
                const broken = brokenNode === spineId || brokenNode === leafId;
                const p1 = getNodeCoords(spineId), p2 = getNodeCoords(leafId);
                const p = pulse(p1.cx, p1.cy, p2.cx, p2.cy);
                return <g key={`${spineId}-${leafId}`}>
                  <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={linkColor(broken)} strokeWidth="1.5" opacity={broken ? 0.3 : 0.7} strokeDasharray={broken ? '4 3' : 'none'} />
                  {isSimulating && !broken && <circle cx={p.x} cy={p.y} r="4" fill={T.accent} />}
                </g>;
              }))}

              {/* Generic host nodes */}
              {activeTopology !== 'hybrid' && activeTopology !== 'spineLeaf' && [1,2,3,4].map(id => (
                <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                  <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r={nodeBase.rx} fill={brokenNode === id ? T.dangerSubtle : T.panelBg} stroke={brokenNode === id ? T.danger : T.accent} strokeWidth="1.5" />
                  <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill={T.textPrimary} style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>H{id}</text>
                </g>
              ))}

              {activeTopology === 'star' && (
                <g onClick={() => setBrokenNode(brokenNode === 5 ? null : 5)} style={{ cursor: 'pointer' }}>
                  <circle cx={getNodeCoords(5).cx} cy={getNodeCoords(5).cy} r="18" fill={brokenNode === 5 ? T.dangerSubtle : T.accentSubtle} stroke={brokenNode === 5 ? T.danger : T.accent} strokeWidth="2" />
                  <text x={getNodeCoords(5).cx} y={getNodeCoords(5).cy + 4} textAnchor="middle" fill={T.textPrimary} style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>SW</text>
                </g>
              )}

              {activeTopology === 'hybrid' && <>
                {[1,2].map(id => (
                  <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                    <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="16" fill={brokenNode === id ? T.dangerSubtle : T.accentSubtle} stroke={brokenNode === id ? T.danger : T.accent} strokeWidth="2" />
                    <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill={T.textPrimary} style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>SW{id}</text>
                  </g>
                ))}
                {[3,4,5,6].map(id => (
                  <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                    <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="13" fill={brokenNode === id ? T.dangerSubtle : T.panelBg} stroke={brokenNode === id ? T.danger : T.borderColor} strokeWidth="1.5" />
                    <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill={T.textPrimary} style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>H{id}</text>
                  </g>
                ))}
              </>}

              {activeTopology === 'spineLeaf' && <>
                {[1,2].map(id => (
                  <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                    <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="16" fill={brokenNode === id ? T.dangerSubtle : 'rgba(163,113,247,0.15)'} stroke={brokenNode === id ? T.danger : '#a371f7'} strokeWidth="2" />
                    <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill={T.textPrimary} style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>SP{id === 1 ? 'A' : 'B'}</text>
                  </g>
                ))}
                {[3,4,5].map(id => (
                  <g key={id} onClick={() => setBrokenNode(brokenNode === id ? null : id)} style={{ cursor: 'pointer' }}>
                    <circle cx={getNodeCoords(id).cx} cy={getNodeCoords(id).cy} r="14" fill={brokenNode === id ? T.dangerSubtle : T.successSubtle} stroke={brokenNode === id ? T.danger : T.success} strokeWidth="1.5" />
                    <text x={getNodeCoords(id).cx} y={getNodeCoords(id).cy + 4} textAnchor="middle" fill={T.textPrimary} style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'monospace' }}>LF{id - 2}</text>
                  </g>
                ))}
              </>}

            </svg>
          </div>

          <button type="button" onClick={runPacketTraceTest} disabled={isSimulating}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: 'none', backgroundColor: T.success, color: '#fff', fontWeight: 700, cursor: isSimulating ? 'not-allowed' : 'pointer', opacity: isSimulating ? 0.6 : 1, fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {isSimulating ? 'Sending...' : 'Run Packet Test'}
          </button>
        </div>

        {/* Info panel */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: T.panelBg, padding: '1.25rem', borderRadius: '12px', border: T.border }}>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 700, color: T.accent }}>{topologies[activeTopology].name} Topology</h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: T.textSecondary, lineHeight: '1.6' }}>{topologies[activeTopology].desc}</p>
            <div style={{ padding: '10px 12px', backgroundColor: T.warningSubtle, borderLeft: `3px solid ${T.warning}`, borderRadius: '4px', fontSize: '0.8rem', lineHeight: '1.5', color: T.textSecondary }}>
              <strong style={{ color: T.warning }}>Failure impact:</strong> {topologies[activeTopology].vulnerability}
            </div>
          </div>

          <div style={{ backgroundColor: T.termBg, padding: '1rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, flexGrow: 1 }}>
            <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.termMuted, display: 'block', marginBottom: '0.5rem', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', fontWeight: 700 }}>Test output</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: simStatus.startsWith('Success') ? T.termText : simStatus.startsWith('Sending') ? T.warning : T.danger, lineHeight: '1.6' }}>
              {simStatus}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TopologyLab;
