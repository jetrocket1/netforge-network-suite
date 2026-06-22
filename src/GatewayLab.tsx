import React, { useState } from 'react';

interface GatewayLabProps {
  isDarkMode?: boolean;
}

export const GatewayLab: React.FC<GatewayLabProps> = ({ isDarkMode = true }) => {
  const [primaryLinkUp, setPrimaryLinkUp] = useState<boolean>(true);
  const [floatingAd, setFloatingAd] = useState<number>(10); // Standard backup route AD
  const [simStatus, setSimStatus] = useState<string>("System normal. Traffic is actively forwarding out of the primary Fiber trunk path.");
  const [packetTrace, setPacketTrace] = useState<string[]>([]);
  const [isTracing, setIsTracing] = useState<boolean>(false);

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    setupBg: isDarkMode ? '#1e293b' : '#f8fafc',
    chartBg: isDarkMode ? '#0f172a' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    activeLine: '#10b981',
    deadLine: '#ef4444'
  };

  const triggerPacketTrace = () => {
    setIsTracing(true);
    setPacketTrace([]);
    
    setTimeout(() => {
      const logs = ["CORE-R1 Ingress: Packet parsed heading to 8.8.8.8."];
      
      if (primaryLinkUp) {
        logs.push("RIB Lookup: Checking routing table sources...");
        logs.push("AD Comparison: OSPF Route (AD 110) beats Floating Static (AD " + floatingAd + ").");
        logs.push("SUCCESS: Packet successfully dispatched out Gi0/1 via Primary Fiber Trunk Link!");
        setSimStatus("Active Path: Fiber Link (Gi0/1) hosting traffic profile conversations.");
      } else {
        logs.push("RIB Lookup: Primary OSPF Route is DEAD (Interface Gi0/1 Down).");
        
        if (floatingAd > 110) {
          logs.push("AD Evaluation: Floating Static (AD " + floatingAd + ") is greater than OSPF. Successfully floating into routing table!");
          logs.push("FAILOVER SUCCESS: Packet safely rerouted out Se0/0/0 via Backup Slow Broadband Line!");
          setSimStatus("Failover Active: Backup Slow Broadband (Se0/0/0) carrying production weights.");
        } else {
          logs.push("CRITICAL ROUTING ERROR: Your backup route AD (" + floatingAd + ") is less than or equal to OSPF (110).");
          logs.push("ROUTING LOOP CAUGHT: Backup route overrode primary state prematurely! Interface blackholing bits.");
          setSimStatus("Routing Conflict: Incorrect administrative distance assignment has isolated the branch network!");
        }
      }
      setPacketTrace(logs);
      setIsTracing(false);
    }, 600);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: styles.panelBg, borderRadius: '16px', border: `1px solid ${styles.panelBorder}`, color: styles.titleText }}>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: `2px solid ${styles.panelBorder}`, paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>🚦 Administrative Distance & Floating Static Gateway Lab</h3>
        <p style={{ color: styles.descText, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Manipulate AD parameters to orchestrate automated circuit failovers on backup interfaces.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* LEFT CANVAS: GRAPHICAL CIRCUITS LINK RENDER */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* CONTROL BOX */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', marginBottom: '4px' }}>Primary Trunk State</label>
              <button type="button" onClick={() => setPrimaryLinkUp(!primaryLinkUp)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: 'bold', color: '#fff', cursor: 'pointer', backgroundColor: primaryLinkUp ? '#10b981' : '#ef4444' }}>
                {primaryLinkUp ? '🟢 PRIMARY LINK: UP' : '🔴 PRIMARY LINK: DOWN'}
              </button>
            </div>

            <div style={{ flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', marginBottom: '4px' }}>Backup Route Static AD value (Default: 10)</label>
              <input type="number" value={floatingAd} onChange={(e) => setFloatingAd(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: `1px solid ${styles.panelBorder}`, backgroundColor: styles.chartBg, color: styles.titleText, fontWeight: 'bold', outline: 'none' }} />
            </div>
          </div>

          {/* VISUAL LAYOUT SCHEMATIC MAP */}
          <div style={{ backgroundColor: '#070a13', border: '1px solid #1e293b', padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#475569', textTransform: 'uppercase', fontWeight: 'bold' }}>Gateway Route Traces</span>
            
            {/* Top Path: Fiber Line */}
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', opacity: primaryLinkUp ? 1 : 0.4 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '110px' }}>Gi0/1 (OSPF / AD 110)</div>
              <div style={{ flexGrow: 1, height: '4px', backgroundColor: primaryLinkUp ? styles.activeLine : '#4b5563', position: 'relative', margin: '0 10px' }} />
              <div style={{ fontSize: '0.7rem', color: primaryLinkUp ? '#10b981' : '#64748b' }}>🚀 Primary Fiber Path</div>
            </div>

            {/* Bottom Path: Serial Line (Fixed line 99 style error below) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', opacity: !primaryLinkUp ? 1 : 0.5 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '110px' }}>Se0/0/0 (Static / AD {floatingAd})</div>
              <div style={{ flexGrow: 1, height: '0px', borderTop: `4px dashed ${!primaryLinkUp && floatingAd > 110 ? '#38bdf8' : '#4b5563'}`, position: 'relative', margin: '0 10px' }} />
              <div style={{ fontSize: '0.7rem', color: !primaryLinkUp && floatingAd > 110 ? '#38bdf8' : '#64748b' }}>🛰️ Backup Broadband Path</div>
            </div>

            <button type="button" onClick={triggerPacketTrace} disabled={isTracing} style={{ padding: '0.75rem', border: 'none', borderRadius: '6px', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>
              {isTracing ? 'SHIPPING ICMP PROBE...' : '⚡ INJECT CONVERSATION PATH PROBE'}
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: ANALYTICS CONSOLE TERMINAL AND LAB SCENARIOS */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ backgroundColor: styles.terminalBg, borderRadius: '12px', padding: '1rem', border: '1px solid #1e293b', minHeight: '180px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#475569', display: 'block', marginBottom: '0.5rem', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>ROUTER ROUTING ENGINE RIB TELEMETRY</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: styles.terminalText, lineHeight: '1.5' }}>
              {packetTrace.length > 0 ? (
                packetTrace.map((log, i) => <div key={i} style={{ marginBottom: '4px' }}>{log}</div>)
              ) : (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>Click "Inject Conversation Path Probe" to witness administrative preference evaluation in real time.</div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: styles.chartBg, padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', fontSize: '0.8rem', color: styles.descText, lineHeight: '1.5' }}>
            <strong>💡 Lesson Challenge: Floating Static Routes</strong>
            <p style={{ margin: '4px 0 0 0' }}>By default, static routes have an AD of **1**. If you leave this backup route at `10`, the router will prefer it over OSPF (110) even when the fiber link is fully operational—causing your backup line to grab your primary traffic profiles prematurely.</p>
            <p style={{ margin: '6px 0 0 0' }}><strong>The Fix:</strong> Change the value to **`120`** (making it a *floating* static route). Now pull the primary link down; it will dynamically slide into the routing table as an automated fallback!</p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default GatewayLab;