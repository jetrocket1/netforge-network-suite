import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface StpLabProps {
  isDarkMode?: boolean;
}

export const StpLab: React.FC<StpLabProps> = ({ isDarkMode = true }) => {
  const [networkSize, setNetworkSize] = useState<'BASIC' | 'ENTERPRISE'>('BASIC');
  const [stpPhase, setStpPhase] = useState<'IDLE' | 'BPDU_ELECT' | 'ROLES' | 'CONVERGED' | 'LINK_FLAP' | 'RE_CONVERGE' | 'CONVERGED_ALT'>('IDLE');

  const T = getLabTheme(isDarkMode);
  const fwd = T.success;
  const blk = T.danger;
  const lst = T.warning;
  const idl = T.textMuted;

  const handleTopologyChange = (size: 'BASIC' | 'ENTERPRISE') => {
    setNetworkSize(size);
    setStpPhase('IDLE');
  };

  const handleNextStep = () => {
    switch(stpPhase) {
      case 'IDLE': setStpPhase('BPDU_ELECT'); break;
      case 'BPDU_ELECT': setStpPhase('ROLES'); break;
      case 'ROLES': setStpPhase('CONVERGED'); break;
      case 'CONVERGED': setStpPhase('LINK_FLAP'); break;
      case 'LINK_FLAP': setStpPhase('RE_CONVERGE'); break;
      case 'RE_CONVERGE': setStpPhase('CONVERGED_ALT'); break;
      case 'CONVERGED_ALT': setStpPhase('IDLE'); break;
    }
  };

  const getStepButtonUI = () => {
    switch(stpPhase) {
      case 'IDLE': return { text: "Step 1: Broadcast BPDUs", color: T.accent };
      case 'BPDU_ELECT': return { text: "Step 2: Map Roles & Path Costs", color: T.accent };
      case 'ROLES': return { text: "Step 3: Prevent Switching Loops", color: fwd };
      case 'CONVERGED': return { text: "Step 4: Simulate Uplink Sever", color: blk };
      case 'LINK_FLAP': return { text: "Step 5: TCN & Re-Calculate", color: lst };
      case 'RE_CONVERGE': return { text: "Step 6: Finalize Loop-Free Path", color: fwd };
      case 'CONVERGED_ALT': return { text: "Reset Simulator", color: T.textSecondary };
    }
  };

  const getLogText = () => {
    if (networkSize === 'BASIC') {
      switch(stpPhase) {
        case 'IDLE': return "System Ready. 3-Switch Triangle initialized. STP is dormant. Click Next for election.";
        case 'BPDU_ELECT': return "1. ELECTION: BPDUs flooded. SW-A claims Root Bridge (lowest MAC).";
        case 'ROLES': return "2. ROLE MAP: SW-B and SW-C calculate their shortest path costs to SW-A.";
        case 'CONVERGED': return "3. CONVERGED: Layer 2 switching loop detected. SW-C blocks its cross-link to SW-B. Network is loop-free and stable.";
        case 'LINK_FLAP': return "CRITICAL: Primary Core uplink (SW-A to SW-B) severed! A potential loop exists if STP fails to recalculate.";
        case 'RE_CONVERGE': return "4. RE-CONVERGENCE: SW-B detects failure, sends TCN. SW-C shifts blocked port to listening/learning.";
        case 'CONVERGED_ALT': return "TRAFFIC RESTORED: Backup path via SW-C forwarding. Network is loop-free and stable.";
      }
    } else {
      switch(stpPhase) {
        case 'IDLE': return "System Ready. 4-Switch Enterprise Diamond loop topology initialized. Spanning Tree dormant.";
        case 'BPDU_ELECT': return "1. ELECTION: BPDUs flooded. SW-1 claims Root Bridge with Priority 4096 (manually set lowest).";
        case 'ROLES': return "2. ROLE MAP: Dist-1, Dist-2 map paths to SW-1. Access-1 maps path to Dist-1.";
        case 'CONVERGED': return "3. CONVERGED: Layer 2 switching loops detected. Dist-2 blocks cross-link. Access-1 blocks D2 uplink. Network is loop-free.";
        case 'LINK_FLAP': return "CRITICAL: Primary Core uplink (SW-1 to Dist-1) severed! TCN generated.";
        case 'RE_CONVERGE': return "4. RE-CONVERGENCE: Dist-1 loses Root access, unblocks cross-link. Access-1 unblocks Dist-2. A new switching loop prevention path is calculated.";
        case 'CONVERGED_ALT': return "TRAFFIC RESTORED: Massive topology shift complete. Dist-1 and Access-1 both route through Dist-2.";
      }
    }
  };

  const getBasicCable = (link: 'AB' | 'AC' | 'BC') => {
    if (link === 'AB') return { color: (stpPhase === 'LINK_FLAP' || stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') ? blk : fwd, dash: (stpPhase === 'LINK_FLAP' || stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') ? '6px' : '0' };
    if (link === 'AC') return { color: fwd, dash: '0' };
    if (link === 'BC') {
      if (stpPhase === 'IDLE' || stpPhase === 'BPDU_ELECT') return { color: lst, dash: '0' };
      if (stpPhase === 'ROLES' || stpPhase === 'CONVERGED' || stpPhase === 'LINK_FLAP') return { color: blk, dash: '6px' };
      return { color: fwd, dash: '0' };
    }
    return { color: T.borderColor, dash: '0' };
  };

  const getEntCable = (link: 'C1D1' | 'C1D2' | 'D1D2' | 'D1A1' | 'D2A1') => {
    if (link === 'C1D1') return { color: (stpPhase === 'LINK_FLAP' || stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') ? blk : fwd, dash: (stpPhase === 'LINK_FLAP' || stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') ? '6px' : '0' };
    if (link === 'C1D2') return { color: fwd, dash: '0' };
    if (link === 'D1D2') {
      if (stpPhase === 'IDLE' || stpPhase === 'BPDU_ELECT') return { color: lst, dash: '0' };
      if (stpPhase === 'ROLES' || stpPhase === 'CONVERGED' || stpPhase === 'LINK_FLAP') return { color: blk, dash: '6px' };
      return { color: fwd, dash: '0' };
    }
    if (link === 'D1A1') {
      if (stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') return { color: blk, dash: '6px' };
      return { color: fwd, dash: '0' };
    }
    if (link === 'D2A1') {
      if (stpPhase === 'IDLE' || stpPhase === 'BPDU_ELECT') return { color: lst, dash: '0' };
      if (stpPhase === 'ROLES' || stpPhase === 'CONVERGED' || stpPhase === 'LINK_FLAP') return { color: blk, dash: '6px' };
      return { color: fwd, dash: '0' };
    }
    return { color: T.borderColor, dash: '0' };
  };

  const btnUI = getStepButtonUI()!;

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Spanning Tree Protocol (STP) Convergence Studio</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Visualize BPDU elections, port role mapping, and loop prevention at your own pace.</p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.panelBg, borderRadius: '8px', padding: '4px' }}>
          <button type="button" onClick={() => handleTopologyChange('BASIC')} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: networkSize === 'BASIC' ? T.accent : 'transparent', color: networkSize === 'BASIC' ? '#fff' : T.textSecondary }}>3-Switch Triangle</button>
          <button type="button" onClick={() => handleTopologyChange('ENTERPRISE')} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: networkSize === 'ENTERPRISE' ? T.success : 'transparent', color: networkSize === 'ENTERPRISE' ? '#fff' : T.textSecondary }}>4-Switch Enterprise</button>
        </div>
      </div>

      <div style={{ backgroundColor: T.insetBg, border: T.border, padding: '2rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', position: 'relative', minHeight: networkSize === 'ENTERPRISE' ? '460px' : '280px', transition: 'min-height 0.3s ease' }}>
        
        {stpPhase === 'BPDU_ELECT' && (
          <div style={{ position: 'absolute', top: networkSize === 'ENTERPRISE' ? '50px' : '25%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', backgroundColor: T.accentSubtle, width: '250px', height: '250px', borderRadius: '50%', zIndex: 0 }}></div>
        )}

        {networkSize === 'BASIC' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', position: 'relative', zIndex: 1 }}>
            <div style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${stpPhase !== 'IDLE' ? T.accent : T.borderColor}`, textAlign: 'center', position: 'relative' }}>
              {stpPhase !== 'IDLE' && stpPhase !== 'BPDU_ELECT' && <span style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: T.accent, color: '#000', fontSize: '0.55rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>ROOT BRIDGE</span>}
              <div style={{ fontSize: '1.8rem' }}>🎛️</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SW-A (Core)</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '500px', marginTop: '10px' }}>
              <div style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.borderColor}`, textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: '1.8rem' }}>🎛️</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SW-B</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : (stpPhase === 'LINK_FLAP' || stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT' ? blk : fwd) }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : fwd }}></span>
                </div>
              </div>
              <div style={{ padding: '12px 20px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.borderColor}`, textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: '1.8rem' }}>🎛️</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SW-C</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : fwd }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: (stpPhase === 'IDLE' || stpPhase === 'BPDU_ELECT') ? idl : (stpPhase === 'ROLES' || stpPhase === 'LINK_FLAP' ? blk : (stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT' ? fwd : blk)) }}></span>
                </div>
                {(stpPhase === 'CONVERGED' || stpPhase === 'LINK_FLAP') && <span style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)', color: blk, fontSize: '0.55rem', fontWeight: 'bold' }}>BLOCKED</span>}
              </div>
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1 }}>
              <svg style={{ width: '100%', height: '100%' }}>
                <line x1="50%" y1="50px" x2="25%" y2="185px" stroke={getBasicCable('AB').color} strokeWidth="3" strokeDasharray={getBasicCable('AB').dash} style={{ transition: 'all 0.4s ease' }} />
                <line x1="50%" y1="50px" x2="75%" y2="185px" stroke={getBasicCable('AC').color} strokeWidth="3" strokeDasharray={getBasicCable('AC').dash} style={{ transition: 'all 0.4s ease' }} />
                <line x1="25%" y1="185px" x2="75%" y2="185px" stroke={getBasicCable('BC').color} strokeWidth="3" strokeDasharray={getBasicCable('BC').dash} style={{ transition: 'all 0.4s ease' }} />
              </svg>
            </div>
          </div>
        )}

        {networkSize === 'ENTERPRISE' && (
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', height: '420px', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${stpPhase !== 'IDLE' ? T.accent : T.borderColor}`, textAlign: 'center' }}>
              {stpPhase !== 'IDLE' && stpPhase !== 'BPDU_ELECT' && <span style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: T.accent, color: '#000', fontSize: '0.55rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>ROOT (Pri: 4096)</span>}
              <div style={{ fontSize: '1.8rem' }}>🎛️</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SW-1 (Core)</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase !== 'IDLE' ? fwd : idl }} title="C1-D1"></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase !== 'IDLE' ? fwd : idl }} title="C1-D2"></span>
              </div>
            </div>

            <div style={{ position: 'absolute', top: '160px', left: '25%', transform: 'translateX(-50%)', padding: '12px 20px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.borderColor}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>🎛️</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Dist-1</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : (stpPhase === 'LINK_FLAP' || stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT' ? blk : fwd) }} title="Uplink to Core"></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : fwd }} title="Crosslink DP"></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : (stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT' ? blk : fwd) }} title="Downlink to A1"></span>
              </div>
              {(stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') && <span style={{ position: 'absolute', bottom: '-15px', right: '0', color: blk, fontSize: '0.55rem', fontWeight: 'bold' }}>BLK</span>}
            </div>

            <div style={{ position: 'absolute', top: '160px', left: '75%', transform: 'translateX(-50%)', padding: '12px 20px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.borderColor}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>🎛️</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Dist-2</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : fwd }} title="Uplink to Core"></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: (stpPhase === 'IDLE' || stpPhase === 'BPDU_ELECT') ? idl : (stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT' ? fwd : blk) }} title="Crosslink BLK"></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : fwd }} title="Downlink DP"></span>
              </div>
              {(stpPhase === 'ROLES' || stpPhase === 'CONVERGED' || stpPhase === 'LINK_FLAP') && <span style={{ position: 'absolute', top: '20px', left: '-30px', color: blk, fontSize: '0.55rem', fontWeight: 'bold' }}>BLK</span>}
            </div>

            <div style={{ position: 'absolute', top: '320px', left: '50%', transform: 'translateX(-50%)', padding: '12px 20px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.borderColor}`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem' }}>🎛️</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Access-1</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stpPhase === 'IDLE' ? idl : (stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT' ? blk : fwd) }} title="Uplink D1"></span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: (stpPhase === 'IDLE' || stpPhase === 'BPDU_ELECT') ? idl : (stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT' ? fwd : blk) }} title="Uplink D2 BLK"></span>
              </div>
              {(stpPhase === 'ROLES' || stpPhase === 'CONVERGED' || stpPhase === 'LINK_FLAP') && <span style={{ position: 'absolute', top: '-15px', right: '-15px', color: blk, fontSize: '0.55rem', fontWeight: 'bold' }}>BLK</span>}
              {(stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') && <span style={{ position: 'absolute', top: '-15px', left: '-15px', color: blk, fontSize: '0.55rem', fontWeight: 'bold' }}>BLK</span>}
            </div>

            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1 }}>
              <svg style={{ width: '100%', height: '100%' }}>
                <line x1="50%" y1="50px" x2="25%" y2="190px" stroke={getEntCable('C1D1').color} strokeWidth="3" strokeDasharray={getEntCable('C1D1').dash} style={{ transition: 'all 0.4s ease' }} />
                <line x1="50%" y1="50px" x2="75%" y2="190px" stroke={getEntCable('C1D2').color} strokeWidth="3" strokeDasharray={getEntCable('C1D2').dash} style={{ transition: 'all 0.4s ease' }} />
                <line x1="25%" y1="190px" x2="75%" y2="190px" stroke={getEntCable('D1D2').color} strokeWidth="3" strokeDasharray={getEntCable('D1D2').dash} style={{ transition: 'all 0.4s ease' }} />
                <line x1="25%" y1="190px" x2="50%" y2="340px" stroke={getEntCable('D1A1').color} strokeWidth="3" strokeDasharray={getEntCable('D1A1').dash} style={{ transition: 'all 0.4s ease' }} />
                <line x1="75%" y1="190px" x2="50%" y2="340px" stroke={getEntCable('D2A1').color} strokeWidth="3" strokeDasharray={getEntCable('D2A1').dash} style={{ transition: 'all 0.4s ease' }} />
              </svg>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: T.panelBg, padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '4px' }}>Manual Phase Controller</span>
          <button type="button" onClick={handleNextStep} style={{ padding: '16px', fontSize: '0.85rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: btnUI.color, color: '#fff', transition: 'all 0.2s ease' }}>
            {btnUI.text}
          </button>
          {stpPhase !== 'IDLE' && (
            <button type="button" onClick={() => setStpPhase('IDLE')} style={{ padding: '8px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', color: T.textSecondary, cursor: 'pointer', textDecoration: 'underline' }}>
              Reset Simulator
            </button>
          )}
        </div>

        <div style={{ backgroundColor: T.termBg, padding: '1.2rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.6', color: T.termText }}>
          <span style={{ color: T.termMuted, display: 'block', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>STP BRIDGE CONVERGENCE CONSOLE</span>
          <div style={{ color: stpPhase === 'LINK_FLAP' ? blk : T.textSecondary }}>{getLogText()}</div>
        </div>
      </div>

      <div style={{ borderTop: T.border, paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        {(stpPhase === 'IDLE' || stpPhase === 'BPDU_ELECT' || stpPhase === 'ROLES') && (
          <>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.accent }}>Electing the Root Bridge</h4>
              <p style={{ margin: 0, color: T.textSecondary }}>
                Every switch exchanges BPDUs containing their Bridge ID (BID). The absolute lowest BID wins. In Enterprise networks, administrators manually set the Core switches to low priorities (e.g., 4096) to guarantee they win the election.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: T.warning }}>Root Ports vs. Designated Ports</h4>
              <p style={{ margin: 0, color: T.textSecondary }}>
                A Root Port (RP) is a switch's absolute lowest-cost interface leading back to the Root. A Designated Port (DP) lives on the forwarding side of an active link. There can only be one RP per switch, and one DP per segment.
              </p>
            </div>
          </>
        )}
        {(stpPhase === 'CONVERGED' || stpPhase === 'LINK_FLAP' || stpPhase === 'RE_CONVERGE' || stpPhase === 'CONVERGED_ALT') && (
          <>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: fwd }}>Preventing Switching Loops</h4>
              <p style={{ margin: 0, color: T.textSecondary }}>
                To smash Layer 2 switching loops, redundant paths are forced into a Blocked (BLK) state. In the Enterprise layout, Access-1 blocks its link to Dist-2. If both uplinks were active, broadcast frames would infinitely loop until the network crashed.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: blk }}>Cascading Path Shifts</h4>
              <p style={{ margin: 0, color: T.textSecondary }}>
                When the Core link drops, cascading changes occur. Access-1 realizes routing traffic through Dist-1 is now slower. STP dynamically recalculates: Access-1 blocks its link to Dist-1 and unblocks the direct link to Dist-2, creating a new loop-free topology.
              </p>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default StpLab;
