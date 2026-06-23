import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface TcpLabProps { isDarkMode?: boolean; }

type TcpState = 'CLOSED' | 'LISTEN' | 'SYN_SENT' | 'SYN_RECEIVED' | 'ESTABLISHED' | 'FIN_WAIT_1' | 'FIN_WAIT_2' | 'CLOSE_WAIT' | 'LAST_ACK' | 'TIME_WAIT';

interface Step {
  label: string;
  packet: string;
  direction: 'c2s' | 's2c' | 'none';
  clientState: TcpState;
  serverState: TcpState;
  seq: string;
  ack: string;
  log: string;
}

export const TcpLab: React.FC<TcpLabProps> = ({ isDarkMode = true }) => {
  const [step, setStep] = useState(0);
  const [showTeardown, setShowTeardown] = useState(false);
  const T = getLabTheme(isDarkMode);

  const handshakeSteps: Step[] = [
    {
      label: 'Idle', packet: '', direction: 'none',
      clientState: 'CLOSED', serverState: 'LISTEN',
      seq: '—', ack: '—',
      log: 'The server is listening on a port (e.g., TCP 443). The client has no active connection — it is in the CLOSED state.',
    },
    {
      label: 'SYN', packet: 'SYN  seq=1000', direction: 'c2s',
      clientState: 'SYN_SENT', serverState: 'LISTEN',
      seq: '1000', ack: '—',
      log: 'Step 1 — The client sends a SYN segment with its initial sequence number (ISN). It enters SYN_SENT and waits for the server to respond.',
    },
    {
      label: 'SYN-ACK', packet: 'SYN-ACK  seq=5000  ack=1001', direction: 's2c',
      clientState: 'SYN_SENT', serverState: 'SYN_RECEIVED',
      seq: '5000', ack: '1001',
      log: 'Step 2 — The server replies with its own SYN and acknowledges the client\'s ISN (ack = client seq + 1). The server enters SYN_RECEIVED.',
    },
    {
      label: 'ACK', packet: 'ACK  seq=1001  ack=5001', direction: 'c2s',
      clientState: 'ESTABLISHED', serverState: 'ESTABLISHED',
      seq: '1001', ack: '5001',
      log: 'Step 3 — The client acknowledges the server\'s SYN (ack = server seq + 1). Both sides enter ESTABLISHED. The connection is open.',
    },
    {
      label: 'Data', packet: 'DATA  seq=1001', direction: 'c2s',
      clientState: 'ESTABLISHED', serverState: 'ESTABLISHED',
      seq: '1001+', ack: '5001+',
      log: 'Data flows in both directions. Sequence numbers advance with each byte sent. The receiver sends ACKs to confirm delivery.',
    },
  ];

  const teardownSteps: Step[] = [
    {
      label: 'FIN', packet: 'FIN  seq=2000', direction: 'c2s',
      clientState: 'FIN_WAIT_1', serverState: 'ESTABLISHED',
      seq: '2000', ack: '5001',
      log: 'Teardown step 1 — The client sends a FIN to signal it has finished sending. It enters FIN_WAIT_1 but can still receive data.',
    },
    {
      label: 'ACK', packet: 'ACK  ack=2001', direction: 's2c',
      clientState: 'FIN_WAIT_2', serverState: 'CLOSE_WAIT',
      seq: '5001', ack: '2001',
      log: 'Teardown step 2 — The server ACKs the FIN. The client moves to FIN_WAIT_2; the server enters CLOSE_WAIT and may still send remaining data.',
    },
    {
      label: 'FIN', packet: 'FIN  seq=5001', direction: 's2c',
      clientState: 'FIN_WAIT_2', serverState: 'LAST_ACK',
      seq: '5001', ack: '2001',
      log: 'Teardown step 3 — The server sends its own FIN once it is done sending. It enters LAST_ACK and waits for the final acknowledgement.',
    },
    {
      label: 'ACK', packet: 'ACK  ack=5002', direction: 'c2s',
      clientState: 'TIME_WAIT', serverState: 'CLOSED',
      seq: '2001', ack: '5002',
      log: 'Teardown step 4 — The client sends the final ACK and enters TIME_WAIT (2× MSL ≈ 2–4 min) to catch any delayed packets. The server closes immediately.',
    },
    {
      label: 'Closed', packet: '', direction: 'none',
      clientState: 'CLOSED', serverState: 'CLOSED',
      seq: '—', ack: '—',
      log: 'TIME_WAIT expires and both sides are fully CLOSED. The port is now available for a new connection.',
    },
  ];

  const allSteps = showTeardown
    ? [...handshakeSteps, ...teardownSteps]
    : handshakeSteps;

  const current = allSteps[Math.min(step, allSteps.length - 1)];

  const stateColor = (s: TcpState) => {
    if (s === 'ESTABLISHED') return T.success;
    if (s === 'CLOSED') return T.textMuted;
    if (s === 'TIME_WAIT' || s === 'CLOSE_WAIT' || s === 'LAST_ACK' || s === 'FIN_WAIT_1' || s === 'FIN_WAIT_2') return T.warning;
    return T.accent;
  };

  const stateBox = (label: string, state: TcpState) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textMuted, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', marginBottom: 8 }}>
        {label === 'Client' ? '💻' : '🖥️'}
      </div>
      <div style={{ padding: '5px 10px', borderRadius: '20px', backgroundColor: `${stateColor(state)}18`, border: `1px solid ${stateColor(state)}`, color: stateColor(state), fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
        {state}
      </div>
    </div>
  );

  const packetArrow = () => {
    if (current.direction === 'none' || !current.packet) return null;
    const goRight = current.direction === 'c2s';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ padding: '4px 10px', backgroundColor: step >= handshakeSteps.length ? T.warningSubtle : T.accentSubtle, border: `1px solid ${step >= handshakeSteps.length ? T.warning : T.accent}`, borderRadius: '4px', fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, color: step >= handshakeSteps.length ? T.warning : T.accent, whiteSpace: 'nowrap' }}>
          {current.packet}
        </div>
        <div style={{ fontSize: '1rem', color: step >= handshakeSteps.length ? T.warning : T.accent }}>
          {goRight ? '→' : '←'}
        </div>
      </div>
    );
  };

  const advance = () => {
    if (step < allSteps.length - 1) setStep(s => s + 1);
    else { setStep(0); setShowTeardown(false); }
  };

  const startTeardown = () => {
    setShowTeardown(true);
    setStep(handshakeSteps.length);
  };

  const reset = () => { setStep(0); setShowTeardown(false); };

  const phaseLabel = step < handshakeSteps.length ? '3-Way Handshake' : '4-Way Teardown';
  const isEnd = step === allSteps.length - 1;
  const isEstablished = current.clientState === 'ESTABLISHED' && current.serverState === 'ESTABLISHED';

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>TCP Connection Lifecycle</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Step through the 3-way handshake that opens a connection and the 4-way teardown that closes it. Watch the TCP state machine on each side.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Visual */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Phase badge */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['3-Way Handshake', '4-Way Teardown'].map(p => (
              <span key={p} style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: phaseLabel === p ? (p.includes('Handshake') ? T.accentSubtle : T.warningSubtle) : T.panelBg, color: phaseLabel === p ? (p.includes('Handshake') ? T.accent : T.warning) : T.textMuted, border: `1px solid ${phaseLabel === p ? (p.includes('Handshake') ? T.accent : T.warning) : T.borderColor}` }}>
                {p}
              </span>
            ))}
          </div>

          {/* Diagram */}
          <div style={{ backgroundColor: T.insetBg, border: T.border, borderRadius: '12px', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', gap: '1rem', minHeight: 160 }}>
            {stateBox('Client', current.clientState)}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {current.direction === 'none'
                ? <span style={{ color: T.borderColor, fontSize: '1.5rem' }}>···</span>
                : packetArrow()}
            </div>
            {stateBox('Server', current.serverState)}
          </div>

          {/* Seq/Ack tracker */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[['Sequence', current.seq], ['Acknowledgement', current.ack]].map(([k, v]) => (
              <div key={k} style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: '6px', padding: '8px 12px' }}>
                <div style={{ fontSize: '0.65rem', color: T.textMuted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 700, color: T.accent }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={advance}
              style={{ flex: 2, padding: '0.7rem', borderRadius: '6px', border: 'none', backgroundColor: isEnd ? T.success : (step >= handshakeSteps.length ? T.warning : T.accent), color: isEnd ? '#fff' : (step >= handshakeSteps.length ? '#000' : '#fff'), fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              {isEnd ? 'Restart' : step === allSteps.length - 2 ? 'Finish' : 'Next step'}
            </button>
            {isEstablished && !showTeardown && (
              <button type="button" onClick={startTeardown}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '6px', border: `1px solid ${T.warning}`, backgroundColor: T.warningSubtle, color: T.warning, fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                Close connection
              </button>
            )}
            {step > 0 && (
              <button type="button" onClick={reset}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '6px', border: `1px solid ${T.borderColor}`, backgroundColor: 'transparent', color: T.textSecondary, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Reset</button>
            )}
          </div>
        </div>

        {/* Log + theory */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: T.termBg, padding: '1.25rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, flexGrow: 1 }}>
            <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.termMuted, borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '10px', fontWeight: 700 }}>
              {phaseLabel} — step {step + 1} of {allSteps.length}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: T.termText, lineHeight: '1.6' }}>
              {current.log}
            </div>
          </div>

          {/* Step progress dots */}
          <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', marginBottom: '10px' }}>Steps</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {allSteps.map((s, i) => (
                <div key={i} onClick={() => setStep(i)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', backgroundColor: i === step ? (i >= handshakeSteps.length ? T.warningSubtle : T.accentSubtle) : 'transparent', border: `1px solid ${i === step ? (i >= handshakeSteps.length ? T.warning : T.accent) : T.borderColor}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i < step ? T.success : (i === step ? (i >= handshakeSteps.length ? T.warning : T.accent) : T.borderColor), display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', color: i === step ? T.textPrimary : T.textMuted, fontWeight: i === step ? 700 : 400 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.accent }}>Why 3 steps?</h4>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: 1.5 }}>Both sides need to exchange sequence numbers and confirm receipt. Three packets is the minimum needed to do that in both directions simultaneously.</p>
            </div>
            <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.warning }}>Why 4-way close?</h4>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: 1.5 }}>Each side closes independently. The server may still have data to send after the client's FIN, so the FIN and ACK from the server are separate packets.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TcpLab;
