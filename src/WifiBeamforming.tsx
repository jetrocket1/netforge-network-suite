import React, { useState, useRef, useCallback } from 'react';
import { getLabTheme } from './labTheme';

interface WifiBeamformingProps { isDarkMode?: boolean; }

type Mode = 'omni' | 'beam' | 'mu-mimo';

const CX = 200, CY = 200, MAX_R = 150;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const pointOnRing = (angleDeg: number, r: number) => ({
  x: CX + r * Math.sin(toRad(angleDeg)),
  y: CY - r * Math.cos(toRad(angleDeg)),
});

const angleOf = (x: number, y: number) => {
  const dx = x - CX, dy = y - CY;
  let a = Math.atan2(dx, -dy) * (180 / Math.PI);
  if (a < 0) a += 360;
  return a;
};

const clampRing = (x: number, y: number, minR = 55, maxR = 148) => {
  const dx = x - CX, dy = y - CY;
  const d = Math.sqrt(dx * dx + dy * dy) || 1;
  const r = Math.max(minR, Math.min(maxR, d));
  return { x: CX + (dx / d) * r, y: CY + (dy / d) * r };
};

const gaussLobe = (angleDeg: number, targetDeg: number, sigma = 28) => {
  const diff = Math.min(Math.abs(angleDeg - targetDeg), 360 - Math.abs(angleDeg - targetDeg));
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
};

const gainAt = (angleDeg: number, mode: Mode, a1: number, a2: number): number => {
  if (mode === 'omni') return 0.62;
  if (mode === 'beam') return 0.08 + 0.88 * gaussLobe(angleDeg, a1);
  const g1 = gaussLobe(angleDeg, a1);
  const g2 = gaussLobe(angleDeg, a2);
  return 0.08 + 0.88 * Math.max(g1, g2);
};

const buildPath = (mode: Mode, a1: number, a2: number): string => {
  const N = 360;
  const pts = Array.from({ length: N }, (_, i) => {
    const r = gainAt(i, mode, a1, a2) * MAX_R;
    return pointOnRing(i, r);
  });
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
};

const gainTodBm = (g: number) => Math.round(-30 - (1 - g) * 35);

const MODE_INFO: Record<Mode, { label: string; desc: string }> = {
  omni: {
    label: 'Omni-directional',
    desc: 'No phase adjustment is applied. The AP radiates uniformly in all directions — simple, but signal energy is wasted on directions with no clients.',
  },
  beam: {
    label: 'Explicit beamforming (SU-MIMO)',
    desc: 'The client sends a VHT steering matrix (compressed beamforming feedback) to the AP. The AP phase-shifts its antenna elements to focus a main lobe precisely toward the client, boosting gain by up to +6 dB.',
  },
  'mu-mimo': {
    label: 'MU-MIMO (802.11ac Wave 2+)',
    desc: 'The AP serves two (or more) clients simultaneously using separate spatial streams. Each client sees its own focused lobe. Null-steering suppresses interference between streams.',
  },
};

export const WifiBeamforming: React.FC<WifiBeamformingProps> = ({ isDarkMode = true }) => {
  const [mode, setMode] = useState<Mode>('omni');
  const [client1, setClient1] = useState({ x: CX + 95, y: CY - 95 });
  const [client2, setClient2] = useState({ x: CX - 80, y: CY + 80 });
  const [dragging, setDragging] = useState<0 | 1 | 2>(0);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const T = getLabTheme(isDarkMode);

  const angle1 = angleOf(client1.x, client1.y);
  const angle2 = angleOf(client2.x, client2.y);

  const gain1 = gainAt(angle1, mode, angle1, angle2);
  const gain2 = gainAt(angle2, mode, angle1, angle2);
  const dBm1 = gainTodBm(gain1);
  const dBm2 = gainTodBm(gain2);

  const getSVGCoords = (e: React.PointerEvent): { x: number; y: number } => {
    const el = svgContainerRef.current;
    if (!el) return { x: CX, y: CY };
    const rect = el.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 400,
      y: ((e.clientY - rect.top) / rect.height) * 400,
    };
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging === 0) return;
    const { x, y } = getSVGCoords(e);
    const clamped = clampRing(x, y);
    if (dragging === 1) setClient1(clamped);
    else setClient2(clamped);
  }, [dragging]);

  const handlePointerDown = (which: 1 | 2) => (e: React.PointerEvent<SVGCircleElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(which);
  };

  const handlePointerUp = () => setDragging(0);

  const patternPath = buildPath(mode, angle1, angle2);
  const c1Pos = pointOnRing(angle1, MAX_R * gain1);
  const c2Pos = pointOnRing(angle2, MAX_R * gain2);

  const color1 = T.accent;
  const color2 = '#a855f7';

  const dBmBar = (label: string, dBm: number, gain: number, color: string) => {
    const pct = Math.max(0, gain * 100);
    const quality = dBm > -40 ? 'Excellent' : dBm > -50 ? 'Good' : dBm > -60 ? 'Fair' : 'Weak';
    return (
      <div style={{ backgroundColor: T.panelBg, border: `1px solid ${color}`, borderRadius: '8px', padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.78rem', fontWeight: 700 }}>
          <span style={{ color }}>{label}</span>
          <span style={{ fontFamily: 'monospace', color: dBm > -50 ? T.success : T.warning }}>{dBm} dBm</span>
        </div>
        <div style={{ height: 5, backgroundColor: T.insetBg, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3, transition: 'width 0.1s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontSize: '0.62rem', color: T.textMuted }}>{quality}</span>
          <span style={{ fontSize: '0.62rem', color: T.textMuted, fontFamily: 'monospace' }}>{Math.round(angle1 === angle2 || label.includes('2') ? angle2 : angle1)}°</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Wi-Fi Beamforming — Polar Radiation Pattern</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Drag the client markers to aim the beam. Compare omni, focused single-stream, and MU-MIMO dual-lobe radiation patterns.
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
        {(['omni', 'beam', 'mu-mimo'] as Mode[]).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            style={{ flex: 1, padding: '7px 8px', fontWeight: 700, fontSize: '0.78rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: mode === m ? T.accent : 'transparent', color: mode === m ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
            {m === 'omni' ? 'Omni' : m === 'beam' ? 'Beamforming (SU)' : 'MU-MIMO'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Polar diagram */}
        <div style={{ flex: '1 1 340px' }}>
          <div
            ref={svgContainerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ aspectRatio: '1', width: '100%', maxWidth: 420, backgroundColor: T.insetBg, borderRadius: '12px', border: T.border, userSelect: 'none', cursor: dragging ? 'grabbing' : 'default' }}
          >
            <svg viewBox="0 0 400 400" width="100%" height="100%">

              {/* Polar grid rings */}
              {[0.25, 0.5, 0.75, 1].map((frac, i) => (
                <g key={frac}>
                  <circle cx={CX} cy={CY} r={MAX_R * frac} fill="none" stroke={T.borderSubtle} strokeWidth="1" />
                  <text x={CX + MAX_R * frac + 3} y={CY - 3} fontSize="8" fill={T.textMuted} fontFamily="monospace">
                    {['-60', '-50', '-40', '-30'][i]} dBm
                  </text>
                </g>
              ))}

              {/* Angle lines every 30° */}
              {Array.from({ length: 12 }, (_, i) => i * 30).map(deg => {
                const p = pointOnRing(deg, MAX_R);
                return (
                  <g key={deg}>
                    <line x1={CX} y1={CY} x2={p.x} y2={p.y} stroke={T.borderSubtle} strokeWidth="1" />
                    <text
                      x={pointOnRing(deg, MAX_R + 14).x}
                      y={pointOnRing(deg, MAX_R + 14).y}
                      textAnchor="middle" dominantBaseline="central"
                      fontSize="8" fill={T.textMuted} fontFamily="monospace"
                    >{deg}°</text>
                  </g>
                );
              })}

              {/* Radiation pattern */}
              <path
                d={patternPath}
                fill={color1}
                fillOpacity="0.18"
                stroke={color1}
                strokeWidth="2"
                strokeOpacity="0.9"
              />

              {/* Second lobe highlight for MU-MIMO */}
              {mode === 'mu-mimo' && (
                <path
                  d={buildPath('beam', angle2, angle2)}
                  fill={color2}
                  fillOpacity="0.12"
                  stroke={color2}
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                  strokeDasharray="5 3"
                />
              )}

              {/* AP at center */}
              <circle cx={CX} cy={CY} r="12" fill={T.panelBg} stroke={T.accent} strokeWidth="2" />
              <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize="11" fill={T.accent}>&#9201;</text>

              {/* Beam direction lines */}
              {mode !== 'omni' && (
                <line
                  x1={CX} y1={CY}
                  x2={client1.x} y2={client1.y}
                  stroke={color1} strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
                />
              )}
              {mode === 'mu-mimo' && (
                <line
                  x1={CX} y1={CY}
                  x2={client2.x} y2={client2.y}
                  stroke={color2} strokeWidth="1" strokeDasharray="4 3" opacity="0.5"
                />
              )}

              {/* Client 1 */}
              <circle
                cx={client1.x} cy={client1.y} r="11"
                fill={color1} fillOpacity="0.2" stroke={color1} strokeWidth="2"
                onPointerDown={handlePointerDown(1)}
                style={{ cursor: 'grab' }}
              />
              <text x={client1.x} y={client1.y} textAnchor="middle" dominantBaseline="central" fontSize="9" fill={color1} fontFamily="monospace" style={{ pointerEvents: 'none' }}>C1</text>

              {/* Signal dot at pattern edge */}
              {mode !== 'omni' && (
                <circle cx={c1Pos.x} cy={c1Pos.y} r="4" fill={color1} opacity="0.7" style={{ pointerEvents: 'none' }} />
              )}

              {/* Client 2 (MU-MIMO only) */}
              {mode === 'mu-mimo' && (
                <>
                  <circle
                    cx={client2.x} cy={client2.y} r="11"
                    fill={color2} fillOpacity="0.2" stroke={color2} strokeWidth="2"
                    onPointerDown={handlePointerDown(2)}
                    style={{ cursor: 'grab' }}
                  />
                  <text x={client2.x} y={client2.y} textAnchor="middle" dominantBaseline="central" fontSize="9" fill={color2} fontFamily="monospace" style={{ pointerEvents: 'none' }}>C2</text>
                  <circle cx={c2Pos.x} cy={c2Pos.y} r="4" fill={color2} opacity="0.7" style={{ pointerEvents: 'none' }} />
                </>
              )}
            </svg>
          </div>
          <div style={{ fontSize: '0.65rem', color: T.textMuted, textAlign: 'center', marginTop: 6 }}>Drag client markers to steer the beam</div>
        </div>

        {/* Right panel */}
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Mode info */}
          <div style={{ padding: '12px 14px', backgroundColor: T.accentSubtle, border: `1px solid ${T.borderColor}`, borderRadius: '8px' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: T.accent, marginBottom: 4 }}>{MODE_INFO[mode].label}</div>
            <div style={{ fontSize: '0.75rem', color: T.textSecondary, lineHeight: 1.6 }}>{MODE_INFO[mode].desc}</div>
          </div>

          {/* Signal bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dBmBar('Client 1', dBm1, gain1, color1)}
            {mode === 'mu-mimo' && dBmBar('Client 2', dBm2, gain2, color2)}
          </div>

          {/* Theory cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ backgroundColor: T.panelBg, padding: '10px 12px', borderRadius: '8px', border: T.border }}>
              <h5 style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: T.success }}>Beamforming gain</h5>
              <p style={{ margin: 0, fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>
                Focusing energy toward one client vs spreading it omnidirectionally yields 3–6 dB gain — equivalent to doubling or quadrupling transmit power without regulatory limit increases.
              </p>
            </div>
            <div style={{ backgroundColor: T.panelBg, padding: '10px 12px', borderRadius: '8px', border: T.border }}>
              <h5 style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: T.warning }}>Null steering</h5>
              <p style={{ margin: 0, fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>
                In MU-MIMO mode, the AP applies a null between the two spatial streams so each client does not hear the other's data. This requires feedback from both clients simultaneously.
              </p>
            </div>
            <div style={{ backgroundColor: T.panelBg, padding: '10px 12px', borderRadius: '8px', border: T.border }}>
              <h5 style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 700, color: T.danger }}>Implicit vs explicit</h5>
              <p style={{ margin: 0, fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>
                Implicit TxBF: the AP estimates channel state from sounding frames — no client support needed, lower accuracy. Explicit TxBF: the client sends a steering matrix back, enabling precise phase control per antenna element.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WifiBeamforming;
