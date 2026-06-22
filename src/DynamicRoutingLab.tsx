import React, { useState } from 'react';

interface DynamicRoutingLabProps {
  isDarkMode?: boolean;
}

export const DynamicRoutingLab: React.FC<DynamicRoutingLabProps> = ({ isDarkMode = true }) => {
  const [protocol, setProtocol] = useState<'static' | 'default' | 'rip' | 'ospf' | 'eigrp' | 'bgp'>('ospf');
  const [linkBCost, setLinkBCost] = useState<number>(10);
  const [convergedPath, setConvergedPath] = useState<string[]>(['R1', 'R3', 'R2']);
  const [routingLog, setRoutingLog] = useState<string[]>([
    "🔍 Core Routing Engine Ready. Choose a routing strategy and inject a packet stream."
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [packetProgress, setPacketProgress] = useState<number>(0);

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

  const runSimulation = () => {
    setIsSimulating(true);
    setPacketProgress(1);
    const logs = ["📦 Packet stream arriving at ingress interface on R1..."];
    setRoutingLog([...logs]);

    setTimeout(() => {
      if (protocol === 'static') {
        logs.push("🧮 RIB Evaluation: Explicit Admin Override detected.");
        logs.push("🏆 Winner: Static Route [ip route 10.0.0.0 255.0.0.0 via R3] matched.");
        logs.push("⚠️ Result: Bandwidth values and hop counts are completely bypassed.");
        setConvergedPath(['R1', 'R3', 'R2']);
      } else if (protocol === 'default') {
        logs.push("🧮 RIB Evaluation: Destination IP failed all specific subnet prefix matches.");
        logs.push("📡 Gateway of Last Resort engaged [ip route 0.0.0.0 0.0.0.0 via R3].");
        logs.push("🏆 Winner: Default Route drops packet down the internet gateway pipeline.");
        setConvergedPath(['R1', 'R3', 'R2']);
      } else if (protocol === 'rip') {
        logs.push("🧮 RIPv2 Metric: Path A = 1 Hop, Path B = 2 Hops.");
        logs.push("🏆 Winner: Path A selected based on lowest structural Hop Count.");
        setConvergedPath(['R1', 'R2']);
      } else if (protocol === 'ospf') {
        const totalBCost = 1 + linkBCost;
        logs.push(`🧮 OSPF Dijkstra LSA calculation: Path A Cost = 100, Path B Cost = ${totalBCost}.`);
        if (totalBCost < 100) {
          logs.push(`🏆 Winner: Path B chosen (${totalBCost} < 100 accumulative link cost).`);
          setConvergedPath(['R1', 'R3', 'R2']);
        } else {
          logs.push("🏆 Winner: Path A chosen (Direct link is lower cost).");
          setConvergedPath(['R1', 'R2']);
        }
      } else if (protocol === 'eigrp') {
        const eigrpPathA = 25600; 
        const eigrpPathB = 2560 * linkBCost; 
        logs.push(`🧮 EIGRP DUAL calculation: Path A Metric = ${eigrpPathA}, Path B Metric = ${eigrpPathB}.`);
        if (eigrpPathB < eigrpPathA) {
          logs.push(`🏆 Winner: Path B selected via Successor node R3.`);
          setConvergedPath(['R1', 'R3', 'R2']);
        } else {
          logs.push("🏆 Winner: Path A selected as prime Successor path.");
          setConvergedPath(['R1', 'R2']);
        }
      } else if (protocol === 'bgp') {
        logs.push("🧮 BGP Path Attributes check: AS path evaluation...");
        logs.push("📊 Path A AS_Path: [65002] (1 AS Hop).");
        logs.push("📊 Path B AS_Path: [65003, 65002] (2 AS Hops).");
        logs.push("🏆 Winner: Path A wins via Shortest AS_Path attribute rule!");
        setConvergedPath(['R1', 'R2']);
      }

      logs.push("⚡ Forwarding packet vectors out of interface fabric...");
      setRoutingLog([...logs]);
      setPacketProgress(2);
    }, 1000);

    setTimeout(() => {
      logs.push("🏁 Success! Packet processed cleanly at destination node R2.");
      setRoutingLog([...logs]);
      setPacketProgress(3);
      setIsSimulating(false);
    }, 2500);
  };

  const evaluateInstantRoute = (proto: typeof protocol, cost: number) => {
    setPacketProgress(0);
    if (proto === 'static' || proto === 'default' || proto === 'ospf' || proto === 'eigrp') {
      if (proto === 'static' || proto === 'default') {
        setConvergedPath(['R1', 'R3', 'R2']);
      } else if (proto === 'ospf') {
        setConvergedPath(1 + cost < 100 ? ['R1', 'R3', 'R2'] : ['R1', 'R2']);
      } else {
        setConvergedPath((2560 * cost) < 25600 ? ['R1', 'R3', 'R2'] : ['R1', 'R2']);
      }
    } else {
      setConvergedPath(['R1', 'R2']);
    }
  };

  const handleProtocolChange = (type: typeof protocol) => {
    setProtocol(type);
    evaluateInstantRoute(type, linkBCost);
  };

  const handleCostChange = (val: number) => {
    setLinkBCost(val);
    evaluateInstantRoute(protocol, val);
  };

  const usesPathB = convergedPath.length === 3;

  const protocolGuides = {
    static: {
      title: "Static Routing (Manual Administrator Configuration)",
      ad: "1",
      formula: "Command: ip route [network] [mask] [next-hop-ip]",
      explanation: "Hardcoded paths directly typed into the device configurations by engineers. Because Administrative Distance measures trustworthiness, a static path (AD: 1) completely overrides dynamically learned paths.",
      challenge: "Notice that Path B is selected immediately. Move the link attribute slider up and down—the route stays pinned to R3. Dynamic environment health metrics are completely ignored."
    },
    default: {
      title: "Default Routing (Gateway of Last Resort)",
      ad: "1 (Static-Derived)",
      formula: "Command: ip route 0.0.0.0 0.0.0.0 [exit-interface]",
      explanation: "The fallback wildcard path. When a frame arrives and matches nothing else in the primary lookup tables, this zero-prefix catcher passes it up to external edge networks.",
      challenge: "This route serves as the internet gatekeeper. It has the shortest prefix length match possible (/0). It handles all arbitrary traffic streams that don't belong to local corporate infrastructure subnets."
    },
    rip: {
      title: "Distance-Vector Protocol (Routing Information Protocol)",
      ad: "120",
      formula: "Metric = Hop Count",
      explanation: "RIP counts the total number of routers (hops) to find a path. It maxes out at 15 hops.",
      challenge: "RIP ignores link speed. It forces traffic down a slow connection over a lightning-fast data pipeline if that route has fewer individual routers."
    },
    ospf: {
      title: "Link-State Protocol (Open Shortest Path First)",
      ad: "110",
      formula: "Cost = Reference Bandwidth (100 Mbps) / Interface Bandwidth",
      explanation: "OSPF maps the network neighborhood and calculates paths using the Dijkstra SPF algorithm. Lower cumulative cost wins.",
      challenge: "Set the slider to 5 and inject a packet. It runs through R3. Now drag the slider past 100—Dijkstra instantly shifts traffic back to the direct line!"
    },
    eigrp: {
      title: "Advanced Distance-Vector / Hybrid (Enhanced Interior Gateway Routing Protocol)",
      ad: "90 (Internal)",
      formula: "Metric = [K1 * Bandwidth + K3 * Delay] * 256",
      explanation: "Cisco proprietary hybrid algorithm that calculates a composite metric using bandwidth and line delay parameters via the DUAL engine.",
      challenge: "Leave the slider low and it maps R3 as a Successor route. Drag the slider to 15, and the calculated metric of Path B overshoots Path A, flipping the path choice."
    },
    bgp: {
      title: "Path-Vector Protocol (Border Gateway Protocol)",
      ad: "20 (External)",
      formula: "Metric = Shortest AS_Path (and standard attribute matrix)",
      explanation: "BGP links autonomous corporate ecosystems together across the public internet backbone. It looks at Autonomous System crossings, not interface link speeds.",
      challenge: "BGP operates on policy rules rather than raw speed calculations. It firmly chooses Path A because it crosses fewer total corporate network numbers (AS networks)."
    }
  };

  const currentGuide = protocolGuides[protocol];

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary }}>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>🚦 Routing Fundamentals Matrix</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Deconstruct path preference from manual admin overrides down to dynamic protocols and gateways of last resort.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        
        {/* CONTROL DECK */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Selected Routing Strategy</label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '6px', marginBottom: '12px' }}>
              {(['static', 'default', 'rip', 'ospf', 'eigrp', 'bgp'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleProtocolChange(p)}
                  disabled={isSimulating}
                  style={{
                    padding: '8px 2px', border: 'none', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer',
                    backgroundColor: protocol === p ? styles.accent : 'transparent',
                    color: protocol === p ? '#fff' : styles.textMuted,
                    textTransform: 'uppercase'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
                Path B Interface Cost Multiplier: {linkBCost}
              </label>
              <input
                type="range" min="1" max="120" value={linkBCost}
                onChange={(e) => handleCostChange(parseInt(e.target.value) || 1)}
                disabled={protocol === 'rip' || protocol === 'bgp' || protocol === 'static' || protocol === 'default' || isSimulating}
                style={{ width: '100%', accentColor: styles.accent, opacity: (protocol === 'rip' || protocol === 'bgp' || protocol === 'static' || protocol === 'default') ? 0.3 : 1 }}
              />
            </div>
          </div>

          {/* SIMULATION SCHEMATIC GRID */}
          <div style={{ backgroundColor: '#070a13', border: '1px solid #1e293b', padding: '3.5rem 2rem 2.5rem 2rem', borderRadius: '12px', position: 'relative', minHeight: '220px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#475569', textTransform: 'uppercase', fontWeight: 'bold', position: 'absolute', top: '10px', left: '15px' }}>
              Live Routing Engine Topology
            </span>
            
            {/* PATH A */}
            <div style={{ position: 'absolute', top: '76px', left: '46px', right: '46px', height: '4px', backgroundColor: !usesPathB ? '#10b981' : '#1e293b', transition: 'all 0.3s ease', zIndex: 1 }}>
              <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.6rem', color: !usesPathB ? '#10b981' : '#4b5563', fontWeight: 'bold', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {protocol === 'static' && 'Path A: Blocked'}
                {protocol === 'default' && 'Path A: Local Subnet Match Only'}
                {protocol === 'rip' && 'Path A Metric: 1 Hop'}
                {protocol === 'ospf' && 'Path A Cost: 100'}
                {protocol === 'eigrp' && 'Path A Metric: 25600'}
                {protocol === 'bgp' && 'Path A: 1 AS_Hop'}
              </span>

              {packetProgress === 2 && !usesPathB && (
                <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: '0 0 10px #ffffff', top: '-4px', left: 0, animation: 'moveHorizontal 1.5s linear forwards' }} />
              )}
            </div>

            {/* PATH B TRACK CONTAINER */}
            <div style={{
              position: 'absolute', top: '76px', left: '41px', right: '41px', height: '75px',
              borderBottom: `4px ${usesPathB ? '#06b6d4' : '#1e293b'} ${usesPathB ? 'solid' : 'dashed'}`,
              borderLeft: `4px ${usesPathB ? '#06b6d4' : '#1e293b'} ${usesPathB ? 'solid' : 'dashed'}`,
              borderRight: `4px ${usesPathB ? '#06b6d4' : '#1e293b'} ${usesPathB ? 'solid' : 'dashed'}`,
              borderRadius: '0 0 8px 8px', zIndex: 0, transition: 'all 0.3s ease'
            }}>
              {/* FIXED: Moved lower with background shading context to avoid clashing with R3 node box */}
              <span style={{ 
                position: 'absolute', bottom: '-24px', left: '50%', transform: 'translateX(-50%)', 
                fontSize: '0.6rem', color: usesPathB ? '#06b6d4' : '#4b5563', fontWeight: 'bold', 
                fontFamily: 'monospace', whiteSpace: 'nowrap', backgroundColor: '#070a13', padding: '0 6px', borderRadius: '4px'
              }}>
                {protocol === 'static' && 'Path B: Enforced Admin Static Route'}
                {protocol === 'default' && 'Path B: Gateway of Last Resort Gateway'}
                {protocol === 'rip' && 'Path B: 2 Hops'}
                {protocol === 'ospf' && `Path B Cost: 1 + ${linkBCost} = ${1 + linkBCost}`}
                {protocol === 'eigrp' && `Path B Metric: ${2560 * linkBCost}`}
                {protocol === 'bgp' && 'Path B: 2 AS_Hops'}
              </span>

              {packetProgress === 2 && usesPathB && (
                <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: '0 0 10px #06b6d4', animation: 'moveAroundUTrack 1.5s linear forwards' }} />
              )}
            </div>

            <style>{`
              @keyframes moveHorizontal { 0% { left: 0%; } 100% { left: 100%; } }
              @keyframes moveAroundUTrack {
                0% { top: -6px; left: -6px; }
                40% { top: 69px; left: -6px; }
                50% { top: 69px; left: 50%; }
                60% { top: 69px; left: calc(100% - 2px); }
                100% { top: -6px; left: calc(100% - 2px); }
              }
            `}</style>

            {/* NODES */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: `2px solid ${packetProgress >= 1 ? styles.accent : '#374151'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>R1</span>
              </div>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: `2px solid ${packetProgress === 2 && usesPathB ? '#06b6d4' : '#374151'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', marginTop: '55px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>R3</span>
              </div>
              <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: `2px solid ${packetProgress === 3 ? '#10b981' : '#374151'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>R2</span>
              </div>
            </div>
          </div>

          <button type="button" onClick={runSimulation} disabled={isSimulating} style={{ padding: '0.75rem', border: 'none', borderRadius: '6px', backgroundColor: styles.accent, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
            {isSimulating ? '⌛ COMPUTING RIB TABLE LOOKUPS...' : '⚡ INJECT DATA PACKET'}
          </button>
        </div>

        {/* LOG TERMINAL */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: styles.terminalBg, borderRadius: '8px', padding: '1rem', border: '1px solid #1e293b', minHeight: '220px', fontFamily: 'monospace', fontSize: '0.7rem', color: styles.terminalText, lineHeight: '1.6' }}>
            <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '6px' }}>ROUTER SIMULATION MONITOR</span>
            {routingLog.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>

      </div>

      {/* DYNAMIC GUIDANCE PANEL */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: styles.accent }}>💡 {currentGuide.title}</h4>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: styles.setupBg, padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
            Administrative Distance (AD): {currentGuide.ad}
          </span>
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#10b981', backgroundColor: '#070a13', padding: '8px 12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          ⚙️ {currentGuide.formula}
        </div>

        <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5', color: styles.textMuted }}>
          {currentGuide.explanation}
        </p>

        <div style={{ backgroundColor: `${styles.accent}0a`, borderLeft: `3px solid ${styles.accent}`, padding: '0.75rem 1rem', borderRadius: '0 6px 6px 0', fontSize: '0.8rem', lineHeight: '1.5' }}>
          <strong>📝 Classroom Lab Objective:</strong>
          <p style={{ margin: '4px 0 0 0', color: isDarkMode ? '#cbd5e1' : '#334155' }}>{currentGuide.challenge}</p>
        </div>
      </div>

    </div>
  );
};