import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface GatewayLabProps {
  isDarkMode?: boolean;
}

type LabState = 'normal' | 'failover' | 'conflict';

export const GatewayLab: React.FC<GatewayLabProps> = ({ isDarkMode = true }) => {
  const [primaryLinkUp, setPrimaryLinkUp] = useState<boolean>(true);
  const [floatingAd, setFloatingAd] = useState<number>(10);
  const [healthState, setHealthState] = useState<LabState>('normal');
  const [simStatus, setSimStatus] = useState<string>("System normal. Traffic is actively forwarding out of the primary Fiber trunk path.");
  const [packetTrace, setPacketTrace] = useState<string[]>([]);
  const [isTracing, setIsTracing] = useState<boolean>(false);

  const T = getLabTheme(isDarkMode);

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
        setHealthState('normal');
      } else {
        logs.push("RIB Lookup: Primary OSPF Route is DEAD (Interface Gi0/1 Down).");
        if (floatingAd > 110) {
          logs.push("AD Evaluation: Floating Static (AD " + floatingAd + ") is greater than OSPF. Successfully floating into routing table!");
          logs.push("FAILOVER SUCCESS: Packet safely rerouted out Se0/0/0 via Backup Slow Broadband Line!");
          setSimStatus("Failover Active: Backup Slow Broadband (Se0/0/0) carrying production weights.");
          setHealthState('failover');
        } else {
          logs.push("CRITICAL ROUTING ERROR: Your backup route AD (" + floatingAd + ") is less than or equal to OSPF (110).");
          logs.push("ROUTING LOOP CAUGHT: Backup route overrode primary state prematurely! Interface blackholing bits.");
          setSimStatus("Routing Conflict: Incorrect administrative distance assignment has isolated the branch network!");
          setHealthState('conflict');
        }
      }
      setPacketTrace(logs);
      setIsTracing(false);
    }, 600);
  };

  const getStatusColor = () => {
    if (healthState === 'conflict') return T.danger;
    if (healthState === 'failover') return T.accent;
    return T.success;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', fontFamily: 'system-ui, sans-serif', backgroundColor: T.cardBg, borderRadius: '16px', border: `1px solid ${T.borderColor}`, color: T.textPrimary }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: `2px solid ${T.borderColor}`, paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Administrative Distance &amp; Floating Static Gateway Lab</h3>
        <p style={{ color: T.textSecondary, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Manipulate AD parameters to orchestrate automated circuit failovers on backup interfaces.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: T.panelBg, padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '4px' }}>Primary Trunk State</label>
              <button type="button" onClick={() => setPrimaryLinkUp(!primaryLinkUp)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: 'bold', color: '#fff', cursor: 'pointer', backgroundColor: primaryLinkUp ? T.success : T.danger }}>
                {primaryLinkUp ? 'PRIMARY LINK: UP' : 'PRIMARY LINK: DOWN'}
              </button>
            </div>
            <div style={{ flexGrow: 1 }}>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '4px' }}>Backup Route Static AD value (OSPF is 110)</label>
              <input type="number" value={floatingAd} onChange={(e) => setFloatingAd(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: `1px solid ${T.borderColor}`, backgroundColor: T.insetBg, color: T.textPrimary, fontWeight: 'bold', outline: 'none' }} />
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: T.insetBg, border: `1px solid ${T.borderColor}`, borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: getStatusColor() }}>
            STATUS: {simStatus}
          </div>

          <div style={{ backgroundColor: T.insetBg, border: T.border, padding: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: T.textMuted, textTransform: 'uppercase', fontWeight: 'bold' }}>Gateway Route Traces</span>
            <div style={{ display: 'flex', alignItems: 'center', opacity: primaryLinkUp ? 1 : 0.4 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '110px' }}>Gi0/1 (OSPF)</div>
              <div style={{ flexGrow: 1, height: '4px', backgroundColor: primaryLinkUp ? T.success : T.borderColor, margin: '0 10px' }} />
              <div style={{ fontSize: '0.7rem', color: primaryLinkUp ? T.success : T.textMuted }}>Fiber Path</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', opacity: !primaryLinkUp ? 1 : 0.5 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '110px' }}>Se0/0/0 (Static)</div>
              <div style={{ flexGrow: 1, height: '0px', borderTop: `4px dashed ${!primaryLinkUp && floatingAd > 110 ? T.accent : T.borderColor}`, margin: '0 10px' }} />
              <div style={{ fontSize: '0.7rem', color: !primaryLinkUp && floatingAd > 110 ? T.accent : T.textMuted }}>Broadband</div>
            </div>
            <button type="button" onClick={triggerPacketTrace} disabled={isTracing} style={{ padding: '0.75rem', border: 'none', borderRadius: '6px', backgroundColor: T.accent, color: '#fff', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>
              {isTracing ? 'SHIPPING ICMP PROBE...' : 'INJECT CONVERSATION PATH PROBE'}
            </button>
          </div>
        </div>

        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: T.termBg, borderRadius: '12px', padding: '1rem', border: `1px solid ${T.termBorder}`, minHeight: '180px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: T.termMuted, display: 'block', marginBottom: '0.5rem', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px' }}>ROUTER ROUTING ENGINE RIB TELEMETRY</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: T.termText, lineHeight: '1.5' }}>
              {packetTrace.map((log, i) => <div key={i} style={{ marginBottom: '4px' }}>{log}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewayLab;
