import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getLabTheme } from './labTheme';

interface WifiRoamingLabProps { isDarkMode?: boolean; }

const AP1 = { x: 27, y: 42, ch: 1 };
const AP2 = { x: 73, y: 57, ch: 6 };

const calcRSSI = (cx: number, cy: number, ax: number, ay: number) => {
  const d = Math.sqrt((cx - ax) ** 2 + (cy - ay) ** 2);
  return Math.max(-90, Math.min(-30, -30 - d * 0.88));
};

const ROAM_STEPS = [
  { id: 1, label: '802.11k — Neighbor report', desc: 'The client asks the current AP for a list of nearby BSSIDs and their channels, eliminating a blind scan of all 165+ possible channels.' },
  { id: 2, label: '802.11v — BSS Transition', desc: 'The infrastructure controller sends a BSS Transition Management frame, directing the client to move. Without this, sticky clients may hold on until -85 dBm.' },
  { id: 3, label: '802.11r — Fast Transition', desc: 'Pre-authentication keys are cached at the target AP via the WLC. The full 4-way handshake is skipped, cutting handoff time from ~100 ms to under 10 ms.' },
  { id: 4, label: 'Association complete', desc: 'Client is now associated with the new AP. The entire roaming event completed in under 10 ms — VoIP calls continue without audible clipping.' },
];

export const WifiRoamingLab: React.FC<WifiRoamingLabProps> = ({ isDarkMode = true }) => {
  const [clientPos, setClientPos] = useState({ x: 25, y: 52 });
  const [connectedAP, setConnectedAP] = useState<1 | 2>(1);
  const [activeStep, setActiveStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const T = getLabTheme(isDarkMode);

  const rssi1 = calcRSSI(clientPos.x, clientPos.y, AP1.x, AP1.y);
  const rssi2 = calcRSSI(clientPos.x, clientPos.y, AP2.x, AP2.y);
  const currentRSSI = connectedAP === 1 ? rssi1 : rssi2;

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => () => clearTimers(), []);

  const triggerRoam = useCallback((toAP: 1 | 2) => {
    clearTimers();
    setActiveStep(1);
    [700, 1400, 2100].forEach((ms, i) => {
      timersRef.current.push(setTimeout(() => setActiveStep(i + 2), ms));
    });
    timersRef.current.push(setTimeout(() => { setConnectedAP(toAP); setActiveStep(0); }, 3200));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    setClientPos({ x, y });
    const r1 = calcRSSI(x, y, AP1.x, AP1.y);
    const r2 = calcRSSI(x, y, AP2.x, AP2.y);
    if (connectedAP === 1 && r1 < -72 && r2 > r1 + 3 && activeStep === 0) triggerRoam(2);
    else if (connectedAP === 2 && r2 < -72 && r1 > r2 + 3 && activeStep === 0) triggerRoam(1);
  }, [isDragging, connectedAP, activeStep, triggerRoam]);

  const ap1Color = T.accent;
  const ap2Color = '#a855f7';
  const activeColor = connectedAP === 1 ? ap1Color : ap2Color;

  const RSSIBar = ({ label, rssi, color, connected }: { label: string; rssi: number; color: string; connected: boolean }) => {
    const pct = Math.max(0, ((rssi + 90) / 60) * 100);
    const quality = rssi > -60 ? 'Excellent' : rssi > -72 ? 'Good' : rssi > -80 ? 'Fair' : 'Poor';
    return (
      <div style={{ backgroundColor: T.panelBg, border: connected ? `2px solid ${color}` : T.border, borderRadius: '8px', padding: '10px 12px', transition: 'border 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.78rem', fontWeight: 700 }}>
          <span style={{ color: connected ? color : T.textSecondary }}>{label}{connected ? ' — connected' : ''}</span>
          <span style={{ fontFamily: 'monospace', color: rssi > -72 ? T.success : T.danger }}>{Math.round(rssi)} dBm</span>
        </div>
        <div style={{ height: 5, backgroundColor: T.insetBg, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.1s' }} />
        </div>
        <div style={{ fontSize: '0.62rem', color: T.textMuted, marginTop: 3 }}>{quality}</div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Wi-Fi Roaming & Cell Overlap</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Drag the client across the floor plan. When signal drops below -72 dBm and a stronger AP is nearby, the 802.11k/v/r roaming sequence fires automatically.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Floor plan */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ position: 'relative', height: '220px', backgroundColor: T.insetBg, borderRadius: '12px', border: T.border, overflow: 'hidden', userSelect: 'none' }}
          >
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={ap1Color} stopOpacity="0.2" />
                  <stop offset="65%" stopColor={ap1Color} stopOpacity="0.06" />
                  <stop offset="100%" stopColor={ap1Color} stopOpacity="0" />
                </radialGradient>
                <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={ap2Color} stopOpacity="0.2" />
                  <stop offset="65%" stopColor={ap2Color} stopOpacity="0.06" />
                  <stop offset="100%" stopColor={ap2Color} stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx={`${AP1.x}%`} cy={`${AP1.y}%`} rx="33%" ry="58%" fill="url(#rg1)" />
              <ellipse cx={`${AP2.x}%`} cy={`${AP2.y}%`} rx="33%" ry="58%" fill="url(#rg2)" />
              <line x1={`${connectedAP === 1 ? AP1.x : AP2.x}%`} y1={`${connectedAP === 1 ? AP1.y : AP2.y}%`} x2={`${clientPos.x}%`} y2={`${clientPos.y}%`} stroke={activeStep > 0 ? T.warning : activeColor} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8" style={{ transition: 'stroke 0.3s' }} />
              {[{ ap: AP1, color: ap1Color, id: 1, label: 'AP-1 Ch 1' }, { ap: AP2, color: ap2Color, id: 2, label: 'AP-2 Ch 6' }].map(({ ap, color, id, label }) => (
                <g key={id}>
                  <circle cx={`${ap.x}%`} cy={`${ap.y}%`} r="15" fill={T.panelBg} stroke={connectedAP === id ? color : T.borderColor} strokeWidth="2" style={{ transition: 'stroke 0.3s' }} />
                  <text x={`${ap.x}%`} y={`${ap.y}%`} textAnchor="middle" dominantBaseline="central" fontSize="11" fill={color}>&#9201;</text>
                  <text x={`${ap.x}%`} y={`${ap.y + 13}%`} textAnchor="middle" fontSize="7.5" fill={color} fontWeight="bold" fontFamily="monospace">{label}</text>
                </g>
              ))}
            </svg>
            <div
              onPointerDown={handlePointerDown}
              style={{ position: 'absolute', left: `${clientPos.x}%`, top: `${clientPos.y}%`, transform: 'translate(-50%, -50%)', width: 32, height: 32, borderRadius: '8px', backgroundColor: '#fff', border: `2.5px solid ${activeStep > 0 ? T.warning : activeColor}`, boxShadow: `0 0 14px ${activeStep > 0 ? T.warning : activeColor}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDragging ? 'grabbing' : 'grab', zIndex: 10, fontSize: '14px', transition: 'border-color 0.3s, box-shadow 0.3s', userSelect: 'none' }}
            >
              &#128241;
            </div>
            <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: '0.58rem', color: T.textMuted, fontFamily: 'monospace' }}>Roam threshold: -72 dBm &nbsp;|&nbsp; Drag client to move</div>
          </div>

          <RSSIBar label="AP-1 (Ch 1)" rssi={rssi1} color={ap1Color} connected={connectedAP === 1} />
          <RSSIBar label="AP-2 (Ch 6)" rssi={rssi2} color={ap2Color} connected={connectedAP === 2} />
        </div>

        {/* Roaming sequence */}
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: activeStep > 0 ? T.warningSubtle : T.successSubtle, border: `1px solid ${activeStep > 0 ? T.warning : T.success}`, textAlign: 'center', transition: 'all 0.3s' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: activeStep > 0 ? T.warning : T.success, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {activeStep > 0 ? `Roaming... step ${activeStep} of 4` : `Connected to AP-${connectedAP}`}
            </div>
            <div style={{ fontSize: '0.68rem', color: T.textSecondary, marginTop: 3 }}>
              {activeStep > 0 ? 'Do not interrupt — handoff in progress' : `Signal: ${Math.round(currentRSSI)} dBm`}
            </div>
          </div>

          <div style={{ backgroundColor: T.panelBg, borderRadius: '10px', border: T.border, overflow: 'hidden', flexGrow: 1 }}>
            <div style={{ padding: '8px 14px', borderBottom: T.border }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>802.11k/v/r sequence</span>
            </div>
            {ROAM_STEPS.map(step => {
              const done = activeStep > step.id;
              const active = activeStep === step.id;
              return (
                <div key={step.id} style={{ padding: '10px 14px', borderBottom: T.border, display: 'flex', gap: '10px', backgroundColor: active ? T.accentSubtle : 'transparent', transition: 'background-color 0.3s' }}>
                  <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', backgroundColor: done ? T.success : (active ? T.accent : T.panelBg), border: `2px solid ${done ? T.success : (active ? T.accent : T.borderColor)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 700, color: done || active ? '#fff' : T.textMuted, transition: 'all 0.3s' }}>
                    {done ? '✓' : step.id}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? T.accent : (done ? T.success : T.textSecondary), marginBottom: active ? 4 : 0, transition: 'color 0.3s' }}>{step.label}</div>
                    {(active || done) && <div style={{ fontSize: '0.68rem', color: T.textSecondary, lineHeight: 1.5 }}>{step.desc}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ backgroundColor: T.panelBg, padding: '10px', borderRadius: '8px', border: T.border }}>
              <h5 style={{ margin: '0 0 4px', fontSize: '0.78rem', fontWeight: 700, color: T.accent }}>15–20% overlap</h5>
              <p style={{ margin: 0, fontSize: '0.7rem', color: T.textSecondary, lineHeight: 1.5 }}>Too little creates dead zones. Too much causes channel flapping.</p>
            </div>
            <div style={{ backgroundColor: T.panelBg, padding: '10px', borderRadius: '8px', border: T.border }}>
              <h5 style={{ margin: '0 0 4px', fontSize: '0.78rem', fontWeight: 700, color: ap2Color }}>Sticky clients</h5>
              <p style={{ margin: 0, fontSize: '0.7rem', color: T.textSecondary, lineHeight: 1.5 }}>Without 802.11v, clients may hold connections to -85 dBm before roaming.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WifiRoamingLab;
