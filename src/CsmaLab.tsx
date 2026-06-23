import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';

interface CsmaLabProps { isDarkMode?: boolean; }
type CdPhases = 'IDLE' | 'TRANSMITTING' | 'COLLISION' | 'JAMMING' | 'BACKOFF' | 'RETRANSMITTING' | 'SUCCESS';
type CaPhases = 'IDLE' | 'DIFS' | 'RTS' | 'CTS' | 'DATA' | 'ACK' | 'SUCCESS';

export const CsmaLab: React.FC<CsmaLabProps> = ({ isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState<'CD' | 'CA'>('CD');
  const [isNode1Chatty, setIsNode1Chatty] = useState(false);
  const [isNode2Chatty, setIsNode2Chatty] = useState(false);
  const [cdPhase, setCdPhase] = useState<CdPhases>('IDLE');
  const [cdStepIndex, setCdStepIndex] = useState(0);
  const [cdProgress, setCdProgress] = useState(0);
  const [caPhase, setCaPhase] = useState<CaPhases>('IDLE');
  const [caStepIndex, setCaStepIndex] = useState(0);
  const [caProgress, setCaProgress] = useState(0);
  const [navTimer, setNavTimer] = useState(0);
  const T = getLabTheme(isDarkMode);

  const cdSteps = [
    { phase: 'IDLE',           log: 'Idle — both NICs are listening for activity on the shared medium.' },
    { phase: 'TRANSMITTING',   log: 'Step 1: Carrier Sense — the medium appears clear. Both hosts transmit simultaneously.' },
    { phase: 'COLLISION',      log: 'Step 2: Collision — electrical signals overlap mid-wire, creating a voltage spike.' },
    { phase: 'JAMMING',        log: 'Step 3: Jam signal — both NICs broadcast a 32-bit jam to alert all stations to stop transmitting.' },
    { phase: 'BACKOFF',        log: 'Step 4: Random backoff — Host 1 waits 3 ms, Host 2 waits 9 ms before retrying.' },
    { phase: 'RETRANSMITTING', log: 'Step 5: Retransmit — Host 1 wins the backoff race and sends its frame successfully.' },
    { phase: 'SUCCESS',        log: 'Complete — Host 1 frame delivered. Host 2 will wait and re-check the medium later.' },
  ] as const;

  const caSteps = [
    { phase: 'IDLE',    log: 'Idle — all devices are monitoring the wireless medium for activity.' },
    { phase: 'DIFS',    log: 'Step 1: DIFS — Laptop A waits the mandatory Distributed Inter-Frame Space before transmitting.' },
    { phase: 'RTS',     log: 'Step 2: RTS — Laptop A sends a Request-to-Send frame to reserve the channel.' },
    { phase: 'CTS',     log: 'Step 3: CTS — The AP grants access with a Clear-to-Send. Laptop B reads this and sets its NAV timer.' },
    { phase: 'DATA',    log: 'Step 4: Data — the channel is reserved. Laptop A transmits its full data frame.' },
    { phase: 'ACK',     log: 'Step 5: ACK — the AP confirms receipt with a Layer 2 acknowledgement.' },
    { phase: 'SUCCESS', log: 'Complete — frame exchange closed. Laptop B\'s NAV timer expires and the medium opens again.' },
  ] as const;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (['TRANSMITTING', 'JAMMING', 'RETRANSMITTING'].includes(cdPhase)) {
      setCdProgress(0);
      interval = setInterval(() => setCdProgress(p => (p >= 100 ? 100 : p + 4)), 20);
    } else { setCdProgress(0); }
    return () => clearInterval(interval);
  }, [cdPhase]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (['RTS', 'CTS', 'DATA', 'ACK'].includes(caPhase)) {
      setCaProgress(0);
      interval = setInterval(() => setCaProgress(p => (p >= 100 ? 100 : p + 5)), 20);
    } else { setCaProgress(0); }
    return () => clearInterval(interval);
  }, [caPhase]);

  useEffect(() => {
    if (navTimer <= 0) return;
    const t = setTimeout(() => setNavTimer(n => n - 1), 100);
    return () => clearTimeout(t);
  }, [navTimer]);

  const handleNextCdStep = () => {
    if (cdStepIndex === 0 && (isNode1Chatty || isNode2Chatty)) return;
    const next = (cdStepIndex + 1) % cdSteps.length;
    setCdStepIndex(next); setCdPhase(cdSteps[next].phase as CdPhases);
  };
  const handleNextCaStep = () => {
    const next = (caStepIndex + 1) % caSteps.length;
    setCaStepIndex(next); setCaPhase(caSteps[next].phase as CaPhases);
    if (caSteps[next].phase === 'CTS') setNavTimer(55);
    else if (caSteps[next].phase === 'IDLE' || caSteps[next].phase === 'SUCCESS') setNavTimer(0);
  };
  const resetCd = () => { setCdStepIndex(0); setCdPhase('IDLE'); setIsNode1Chatty(false); setIsNode2Chatty(false); };
  const resetCa = () => { setCaStepIndex(0); setCaPhase('IDLE'); setNavTimer(0); };

  const tabBtn = (active: boolean, color: string) => ({
    flex: 1, padding: '8px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.8rem', backgroundColor: active ? color : 'transparent',
    color: active ? '#fff' : T.textSecondary, transition: 'all 0.12s',
  } as React.CSSProperties);

  const isCollision = ['COLLISION', 'JAMMING'].includes(cdPhase);

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Media Access Control</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Compare how wired Ethernet (CSMA/CD) detects collisions after they happen, versus how Wi-Fi (CSMA/CA) prevents them before they occur.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
        <button type="button" onClick={() => { setActiveTab('CD'); resetCd(); }} style={tabBtn(activeTab === 'CD', T.accent)}>
          CSMA/CD — Wired Ethernet
        </button>
        <button type="button" onClick={() => { setActiveTab('CA'); resetCa(); }} style={tabBtn(activeTab === 'CA', T.success)}>
          CSMA/CA — Wireless 802.11
        </button>
      </div>

      {/* ── CSMA/CD ── */}
      {activeTab === 'CD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Canvas */}
          <div style={{ backgroundColor: T.insetBg, border: isCollision ? `1px solid ${T.danger}` : T.border, padding: '2rem 1.5rem', borderRadius: '12px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', maxWidth: 640, margin: '0 auto', width: '100%' }}>

              {/* Host 1 */}
              <div onClick={() => cdPhase === 'IDLE' && setIsNode1Chatty(v => !v)}
                style={{ zIndex: 2, padding: '10px 14px', borderRadius: '8px', backgroundColor: T.panelBg, cursor: cdPhase === 'IDLE' ? 'pointer' : 'default', border: `2px solid ${cdPhase === 'BACKOFF' ? T.warning : isNode1Chatty ? T.accent : T.borderColor}`, textAlign: 'center', minWidth: 90, position: 'relative' }}>
                <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>&#128187;</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4 }}>Host 1</div>
                <div style={{ fontSize: '0.65rem', color: isNode1Chatty ? T.accent : T.textMuted }}>{isNode1Chatty ? 'Line busy' : 'Listening'}</div>
                {cdPhase === 'BACKOFF' && <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', backgroundColor: T.warning, color: '#000', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>Backoff: 3 ms</div>}
              </div>

              {/* Wire */}
              <div style={{ flex: 1, position: 'relative', height: 6, backgroundColor: isCollision ? T.danger : (isNode1Chatty || isNode2Chatty ? T.accent : T.borderColor), margin: '0 -2px', zIndex: 1 }}>
                {cdPhase === 'TRANSMITTING' && <>
                  <div style={{ position: 'absolute', left: `${cdProgress * 0.5}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', backgroundColor: T.accent }} />
                  <div style={{ position: 'absolute', left: `${100 - cdProgress * 0.5}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 10, height: 10, borderRadius: '50%', backgroundColor: T.accent }} />
                </>}
                {isCollision && <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem' }}>&#128165;</div>}
                {cdPhase === 'JAMMING' && <>
                  <div style={{ position: 'absolute', left: `${cdProgress}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', backgroundColor: T.danger }} />
                  <div style={{ position: 'absolute', left: `${100 - cdProgress}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', backgroundColor: T.danger }} />
                </>}
                {['RETRANSMITTING', 'SUCCESS'].includes(cdPhase) && (
                  <div style={{ position: 'absolute', top: -11, left: `${cdPhase === 'RETRANSMITTING' ? cdProgress : 100}%`, transform: 'translateX(-50%)', backgroundColor: T.success, borderRadius: 3, padding: '2px 6px', fontSize: '0.6rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>DATA</div>
                )}
              </div>

              {/* Host 2 */}
              <div onClick={() => cdPhase === 'IDLE' && setIsNode2Chatty(v => !v)}
                style={{ zIndex: 2, padding: '10px 14px', borderRadius: '8px', backgroundColor: T.panelBg, cursor: cdPhase === 'IDLE' ? 'pointer' : 'default', border: `2px solid ${cdPhase === 'BACKOFF' ? T.danger : isNode2Chatty ? T.accent : T.borderColor}`, textAlign: 'center', minWidth: 90, position: 'relative' }}>
                <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>&#128187;</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4 }}>Host 2</div>
                <div style={{ fontSize: '0.65rem', color: isNode2Chatty ? T.accent : T.textMuted }}>{isNode2Chatty ? 'Line busy' : 'Listening'}</div>
                {cdPhase === 'BACKOFF' && <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', backgroundColor: T.danger, color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>Backoff: 9 ms</div>}
                {cdPhase === 'SUCCESS' && <div style={{ position: 'absolute', top: -16, right: -8, color: T.success, fontSize: '1.2rem' }}>&#10003;</div>}
              </div>

            </div>
            <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: T.textMuted, textAlign: 'center' }}>
              {cdPhase === 'IDLE' ? 'Click Host 1 or Host 2 to mark them as already transmitting before starting.' : ''}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button type="button" onClick={handleNextCdStep} disabled={isNode1Chatty || isNode2Chatty}
                style={{ flex: 2, padding: '0.7rem', borderRadius: '6px', border: 'none', backgroundColor: T.accent, color: '#fff', fontWeight: 700, cursor: (isNode1Chatty || isNode2Chatty) ? 'not-allowed' : 'pointer', opacity: (isNode1Chatty || isNode2Chatty) ? 0.5 : 1, fontSize: '0.875rem' }}>
                {cdStepIndex === 0 ? 'Start' : cdStepIndex === cdSteps.length - 1 ? 'Restart' : 'Next step'}
              </button>
              {cdStepIndex > 0 && <button type="button" onClick={resetCd} style={{ flex: 1, padding: '0.7rem', borderRadius: '6px', border: `1px solid ${T.borderColor}`, backgroundColor: 'transparent', color: T.textSecondary, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Reset</button>}
            </div>
            <div style={{ backgroundColor: T.termBg, padding: '1rem', borderRadius: '8px', border: `1px solid ${T.termBorder}` }}>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.termMuted, borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '8px', fontWeight: 700 }}>CSMA/CD — step {cdStepIndex} of {cdSteps.length - 1}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: isCollision ? T.danger : T.termText, lineHeight: '1.5' }}>{cdSteps[cdStepIndex].log}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: T.border }}>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.accent }}>Reactive by design</h4>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>CSMA/CD lets collisions happen, then recovers with a jam signal and random backoff. Modern switches eliminated this problem entirely by giving each device a dedicated full-duplex link — so CSMA/CD is effectively retired.</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.danger }}>Half-duplex legacy</h4>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>Old hubs repeated signals to every port, forcing half-duplex operation — a device could not listen while transmitting. Switches replaced hubs and gave each port its own TX/RX pair, making collisions physically impossible.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CSMA/CA ── */}
      {activeTab === 'CA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Canvas */}
          <div style={{ backgroundColor: T.insetBg, border: T.border, padding: '2rem 1rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', maxWidth: 680, margin: '0 auto', width: '100%', gap: 0 }}>

              {/* Laptop A */}
              <div style={{ zIndex: 2, padding: '10px 14px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.success}`, textAlign: 'center', minWidth: 90, position: 'relative' }}>
                <div style={{ fontSize: '1.5rem' }}>&#128187;</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4, color: T.success }}>Laptop A</div>
                {caPhase === 'DIFS' && <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', backgroundColor: T.accent, color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>Waiting DIFS</div>}
                {caPhase === 'SUCCESS' && <div style={{ color: T.success, position: 'absolute', top: -18, right: -8, fontSize: '1.2rem' }}>&#10003;</div>}
              </div>

              {/* Air A-to-AP */}
              <div style={{ flex: 1, position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: T.borderColor, fontSize: '1.1rem', letterSpacing: 4, fontFamily: 'monospace' }}>{'~'.repeat(8)}</div>
                {caPhase === 'RTS' && <div style={{ position: 'absolute', padding: '2px 8px', backgroundColor: T.warning, borderRadius: 10, left: `${caProgress}%`, transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#000', fontWeight: 700, fontFamily: 'monospace' }}>RTS</div>}
                {caPhase === 'CTS' && <div style={{ position: 'absolute', padding: '2px 8px', backgroundColor: T.success, borderRadius: 10, right: `${caProgress}%`, transform: 'translateX(50%)', fontSize: '0.6rem', color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>CTS</div>}
                {caPhase === 'DATA' && <div style={{ position: 'absolute', padding: '3px 8px', backgroundColor: T.accent, borderRadius: 4, left: `${caProgress}%`, transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>DATA</div>}
                {caPhase === 'ACK' && <div style={{ position: 'absolute', padding: '2px 8px', backgroundColor: T.success, borderRadius: 10, right: `${caProgress}%`, transform: 'translateX(50%)', fontSize: '0.6rem', color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>ACK</div>}
              </div>

              {/* AP */}
              <div style={{ zIndex: 2, padding: '10px 14px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${T.borderColor}`, textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: '1.5rem' }}>&#128225;</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4 }}>Access Point</div>
              </div>

              {/* Air AP-to-B */}
              <div style={{ flex: 1, position: 'relative', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: T.borderColor, fontSize: '1.1rem', letterSpacing: 4, fontFamily: 'monospace' }}>{'~'.repeat(8)}</div>
                {caPhase === 'CTS' && <div style={{ position: 'absolute', padding: '2px 8px', backgroundColor: T.danger, borderRadius: 10, left: `${caProgress}%`, transform: 'translateX(-50%)', fontSize: '0.6rem', color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>CTS</div>}
              </div>

              {/* Laptop B */}
              <div style={{ zIndex: 2, padding: '10px 14px', borderRadius: '8px', backgroundColor: T.panelBg, border: `2px solid ${navTimer > 0 ? T.danger : T.borderColor}`, textAlign: 'center', minWidth: 90, position: 'relative' }}>
                <div style={{ fontSize: '1.5rem' }}>&#128241;</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4 }}>Laptop B</div>
                <div style={{ fontSize: '0.65rem', color: navTimer > 0 ? T.danger : T.textMuted }}>{navTimer > 0 ? 'NAV locked' : 'Listening'}</div>
                {navTimer > 0 && <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', backgroundColor: T.danger, color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>NAV: {(navTimer * 0.1).toFixed(1)}s</div>}
              </div>

            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button type="button" onClick={handleNextCaStep}
                style={{ flex: 2, padding: '0.7rem', borderRadius: '6px', border: 'none', backgroundColor: T.success, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                {caStepIndex === 0 ? 'Start' : caStepIndex === caSteps.length - 1 ? 'Restart' : 'Next step'}
              </button>
              {caStepIndex > 0 && <button type="button" onClick={resetCa} style={{ flex: 1, padding: '0.7rem', borderRadius: '6px', border: `1px solid ${T.borderColor}`, backgroundColor: 'transparent', color: T.textSecondary, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Reset</button>}
            </div>
            <div style={{ backgroundColor: T.termBg, padding: '1rem', borderRadius: '8px', border: `1px solid ${T.termBorder}` }}>
              <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.termMuted, borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '8px', fontWeight: 700 }}>CSMA/CA — step {caStepIndex} of {caSteps.length - 1}</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: T.termText, lineHeight: '1.5' }}>{caSteps[caStepIndex].log}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: T.border }}>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.success }}>The hidden node problem</h4>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>Laptop A and Laptop B may both reach the access point but be completely out of radio range of each other. Without an explicit handshake, both devices could transmit simultaneously — causing a collision at the AP that neither sender can detect.</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.warning }}>Network Allocation Vector (NAV)</h4>
              <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>The CTS frame includes a duration field. Every device in the cell reads this and sets a local NAV countdown timer — effectively a virtual "do not transmit" lock. When the timer hits zero, the medium reopens for contention.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CsmaLab;
