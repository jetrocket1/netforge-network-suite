import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface ArpLabProps { isDarkMode?: boolean; }
type ArpPhase = 'idle' | 'pc1-to-switch' | 'broadcast-flood' | 'unicast-reply' | 'complete';

export const ArpLab: React.FC<ArpLabProps> = ({ isDarkMode = true }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const T = getLabTheme(isDarkMode);

  const steps: { phase: ArpPhase; log: string }[] = [
    { phase: 'idle',            log: 'Idle — PC1 wants to send data to 192.168.1.20 but has no MAC address cached for it. It will broadcast an ARP Request to find out.' },
    { phase: 'pc1-to-switch',   log: 'Step 1: PC1 sends an ARP Request with destination MAC FF:FF:FF:FF:FF:FF (broadcast). The switch receives it on Fa0/1 and records PC1\'s MAC address in its CAM table.' },
    { phase: 'broadcast-flood', log: 'Step 2: The switch floods the broadcast out every active port except Fa0/1. PC2 recognises its own IP and accepts the frame. PC3 sees a different target IP and discards it.' },
    { phase: 'unicast-reply',   log: 'Step 3: PC2 sends a unicast ARP Reply directly back to PC1\'s MAC address. As it leaves Fa0/2, the switch learns PC2\'s MAC and adds it to the CAM table.' },
    { phase: 'complete',        log: 'Complete — the switch forwards the reply to PC1 on Fa0/1. PC1 stores PC2\'s MAC in its ARP cache and can now send frames directly.' },
  ];

  const phase = steps[stepIndex].phase;

  const arpTable = () => {
    const base = [{ ip: '192.168.1.1', mac: '00:0A:95:9D:68:16', resolved: true }];
    return stepIndex === 4
      ? [...base, { ip: '192.168.1.20', mac: '5E:FF:56:A1:C2:88', resolved: true }]
      : [...base, { ip: '192.168.1.20', mac: 'Not found', resolved: false }];
  };

  const camTable = () => {
    const base = [{ mac: '00:0A:95:9D:68:16', port: 'Fa0/24' }];
    if (stepIndex >= 1) base.push({ mac: '00:11:22:AA:BB:CC', port: 'Fa0/1' });
    if (stepIndex >= 3) base.push({ mac: '5E:FF:56:A1:C2:88', port: 'Fa0/2' });
    return base;
  };

  const advance = () => setStepIndex(i => (i + 1) % steps.length);
  const reset = () => setStepIndex(0);

  const nodeBox = (active: boolean, color: string) => ({
    padding: '10px', borderRadius: '8px', textAlign: 'center' as const,
    border: active ? `2px solid ${color}` : T.border,
    backgroundColor: active ? `${color}14` : T.panelBg,
    transition: 'border-color 0.2s, background-color 0.2s',
  });

  const badge = (text: string, bg: string, fg = '#fff') => (
    <div style={{ marginTop: 6, padding: '2px 6px', backgroundColor: bg, color: fg, fontSize: '0.6rem', fontWeight: 700, borderRadius: 3, fontFamily: 'monospace' }}>{text}</div>
  );

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>ARP & Switch MAC Learning</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Step through an ARP exchange to see how a switch builds its CAM table and how a host resolves an IP address to a MAC address.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>

        {/* Topology */}
        <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: T.insetBg, border: T.border, padding: '1.5rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 70px 1fr', alignItems: 'center', gap: '12px', minHeight: 220 }}>

            {/* PC1 */}
            <div style={nodeBox(phase === 'pc1-to-switch' || phase === 'complete', T.accent)}>
              <div style={{ fontSize: '1.5rem' }}>&#128187;</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: T.accent }}>PC1 — Sender</div>
              <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: T.textMuted, marginTop: 2 }}>192.168.1.5<br />00:11:22:AA:BB:CC<br />Fa0/1</div>
              {phase === 'pc1-to-switch' && badge('ARP Request →', T.warning, '#000')}
              {phase === 'complete' && badge('← Reply received', T.success)}
            </div>

            {/* Switch */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '10px 6px', backgroundColor: T.panelBg, border: `2px solid ${T.borderColor}`, borderRadius: '6px', textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '1.2rem' }}>&#127803;</div>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, fontFamily: 'monospace', color: T.textSecondary, marginTop: 2 }}>SWITCH</div>
              </div>
            </div>

            {/* Right column — PC2 & PC3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={nodeBox(phase === 'broadcast-flood' || phase === 'unicast-reply', phase === 'unicast-reply' ? T.success : T.warning)}>
                <div style={{ fontSize: '1.2rem' }}>&#128187;</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: phase === 'unicast-reply' ? T.success : T.textPrimary }}>PC2 — Target</div>
                <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: T.textMuted }}>192.168.1.20<br />Fa0/2</div>
                {phase === 'broadcast-flood' && badge('IP match — accept', T.warning, '#000')}
                {phase === 'unicast-reply' && badge('Sending reply →', T.success)}
              </div>
              <div style={{ ...nodeBox(phase === 'broadcast-flood', T.danger), opacity: ['unicast-reply','complete'].includes(phase) ? 0.35 : 1 }}>
                <div style={{ fontSize: '1.2rem' }}>&#128187;</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: T.textMuted }}>PC3 — Other</div>
                <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: T.textMuted }}>192.168.1.30<br />Fa0/3</div>
                {phase === 'broadcast-flood' && badge('IP mismatch — drop', T.danger)}
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={advance}
              style={{ flex: 2, padding: '0.7rem', border: 'none', borderRadius: '6px', backgroundColor: stepIndex === steps.length - 1 ? T.success : T.accent, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              {stepIndex === 0 ? 'Start' : stepIndex === steps.length - 1 ? 'Restart' : 'Next step'}
            </button>
            {stepIndex > 0 && (
              <button type="button" onClick={reset}
                style={{ flex: 1, padding: '0.7rem', border: `1px solid ${T.borderColor}`, borderRadius: '6px', backgroundColor: 'transparent', color: T.textSecondary, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Reset</button>
            )}
          </div>
        </div>

        {/* Log */}
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ backgroundColor: T.termBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${T.termBorder}`, height: '100%', minHeight: 200, fontFamily: 'monospace', fontSize: '0.82rem', color: T.termText, lineHeight: '1.6', display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: T.termMuted, display: 'block', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '10px', fontWeight: 700, fontSize: '0.7rem' }}>
              ARP trace — step {stepIndex} of {steps.length - 1}
            </span>
            <div style={{ color: phase === 'broadcast-flood' ? T.warning : T.termText }}>{steps[stepIndex].log}</div>
          </div>
        </div>

      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', paddingTop: '1.25rem', borderTop: T.border }}>

        <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>PC1 ARP cache (arp -a)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.72rem' }}>
            {arpTable().map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', backgroundColor: T.insetBg, borderRadius: 4, gap: 8 }}>
                <span style={{ color: T.textPrimary }}>{e.ip}</span>
                <span style={{ color: e.resolved ? T.success : T.danger, fontWeight: 700 }}>{e.mac}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Switch CAM table (show mac address-table)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.72rem' }}>
            {camTable().map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', backgroundColor: T.insetBg, borderRadius: 4, gap: 8 }}>
                <span style={{ color: T.accent }}>{e.mac}</span>
                <span style={{ color: T.textPrimary, fontWeight: 700 }}>{e.port}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ArpLab;
