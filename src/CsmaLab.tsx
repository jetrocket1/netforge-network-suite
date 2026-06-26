import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

interface CsmaLabProps { isDarkMode?: boolean; }
type CdPhase = 'IDLE' | 'TRANSMITTING' | 'COLLISION' | 'JAMMING' | 'BACKOFF' | 'RETRANSMITTING' | 'SUCCESS';
type CaPhase = 'IDLE' | 'DIFS' | 'RTS' | 'CTS' | 'DATA' | 'ACK' | 'SUCCESS';

const CD_STEPS: { phase: CdPhase; log: string }[] = [
  { phase:'IDLE',           log:'Idle — both NICs are listening for activity on the shared medium.' },
  { phase:'TRANSMITTING',   log:'Step 1: Carrier Sense — medium appears clear. Both hosts begin transmitting simultaneously.' },
  { phase:'COLLISION',      log:'Step 2: Collision — electrical signals overlap mid-wire, creating a voltage spike both NICs can detect.' },
  { phase:'JAMMING',        log:'Step 3: Jam signal — both NICs broadcast a 32-bit jam sequence to alert all stations.' },
  { phase:'BACKOFF',        log:'Step 4: Random backoff — Host 1 waits 3 ms, Host 2 waits 9 ms (binary exponential backoff).' },
  { phase:'RETRANSMITTING', log:'Step 5: Retransmit — Host 1 wins the backoff race and sends its frame successfully.' },
  { phase:'SUCCESS',        log:'Complete — Host 1 frame delivered. Host 2 will sense the medium clear and retry later.' },
];
const CA_STEPS: { phase: CaPhase; log: string }[] = [
  { phase:'IDLE',    log:'Idle — all stations monitoring the wireless medium. No frames in transit.' },
  { phase:'DIFS',    log:'Step 1: DIFS wait — Laptop A waits the mandatory Distributed Inter-Frame Space before transmitting.' },
  { phase:'RTS',     log:'Step 2: RTS — Laptop A sends a Request-to-Send frame to reserve the wireless channel.' },
  { phase:'CTS',     log:'Step 3: CTS — the AP grants access with Clear-to-Send. Laptop B reads the CTS and sets its NAV timer.' },
  { phase:'DATA',    log:'Step 4: Data — channel is reserved via virtual carrier sense (NAV). Laptop A transmits its data frame.' },
  { phase:'ACK',     log:'Step 5: ACK — the AP confirms receipt with a Layer 2 acknowledgement frame.' },
  { phase:'SUCCESS', log:'Complete — frame exchange closed. Laptop B\'s NAV timer expires and the medium reopens for contention.' },
];

const CD_COLOR: Record<CdPhase,string> = {
  IDLE:'#484f58', TRANSMITTING:'#4493f8', COLLISION:'#f85149',
  JAMMING:'#f85149', BACKOFF:'#d29922', RETRANSMITTING:'#4493f8', SUCCESS:'#3fb950',
};
const CA_COLOR: Record<CaPhase,string> = {
  IDLE:'#484f58', DIFS:'#4493f8', RTS:'#d29922',
  CTS:'#a855f7', DATA:'#4493f8', ACK:'#3fb950', SUCCESS:'#3fb950',
};
const CD_LABEL: Record<CdPhase,string> = {
  IDLE:'IDLE — LISTENING', TRANSMITTING:'CARRIER SENSE — TRANSMITTING', COLLISION:'COLLISION DETECTED',
  JAMMING:'JAM SIGNAL BROADCAST', BACKOFF:'RANDOM BACKOFF', RETRANSMITTING:'HOST 1 RETRANSMITTING', SUCCESS:'DELIVERY SUCCESS',
};
const CA_LABEL: Record<CaPhase,string> = {
  IDLE:'IDLE — LISTENING', DIFS:'DIFS WAIT', RTS:'RTS SENT',
  CTS:'CTS + NAV LOCK', DATA:'DATA TRANSFER', ACK:'ACKNOWLEDGED', SUCCESS:'EXCHANGE COMPLETE',
};

const CSMA_EDU: EduCard[] = [
  { type:'exam', title:'CSMA/CD — Collision Detection (Wired Ethernet)',
    body:'Carrier Sense Multiple Access / Collision Detection: every NIC listens before transmitting (carrier sense). If the medium is clear it transmits, and simultaneously monitors for a collision (voltage anomaly). On detecting a collision it broadcasts a 32-bit jam signal, then waits a random backoff period before retrying. CSMA/CD only works on half-duplex shared media — it is irrelevant on full-duplex switched links.' },
  { type:'exam', title:'CSMA/CA — Collision Avoidance (Wi-Fi 802.11)',
    body:'On wireless media you can\'t detect a collision while transmitting — your own signal drowns out everything else. CSMA/CA avoids collisions before they happen: wait DIFS, send RTS, receive CTS from the AP, then transmit. All nearby stations that hear the CTS set a NAV (Network Allocation Vector) timer and defer. After the ACK, the NAV expires and stations can contend again.' },
  { type:'realworld', title:'Why CSMA/CD Is Effectively Obsolete',
    body:'Modern Ethernet switches give every port a dedicated point-to-point full-duplex link — there is no shared medium, so collisions are physically impossible. The IEEE 802.3 spec still defines CSMA/CD, but it only activates on half-duplex links (legacy hubs). You won\'t encounter it in a modern network, but it appears on every networking exam.' },
  { type:'gotcha', title:'The Hidden Node Problem — Why RTS/CTS Matters',
    body:'Laptop A and Laptop B may both have radio range to the AP but be out of range of each other. Without RTS/CTS, both could transmit simultaneously — causing a collision at the AP that neither sender can detect (because they only hear their own signal). RTS/CTS solves this: the AP\'s CTS is heard by all stations in its range, including those that couldn\'t hear the RTS.' },
  { type:'exam', title:'Truncated Binary Exponential Backoff (BEB)',
    body:'After the nth collision, a station waits a random number of 51.2 µs slot times drawn from [0, 2ⁿ − 1]. After the 1st collision: wait 0 or 1 slots. After the 10th: wait 0–1023 slots. The maximum window is capped at 1023 slots (n=10). After 16 consecutive collisions, the frame is dropped and an error is reported to the upper layer. This geometric backoff prevents a "thundering herd" of simultaneous retransmissions.' },
];

// Generates an SVG sine-wave path for the wireless medium
function wavePath(x1: number, x2: number, y: number): string {
  const amp = 7, period = 22;
  let d = `M ${x1} ${y}`;
  for (let x = x1 + 2; x <= x2; x += 2) {
    const t = ((x - x1) / period) * Math.PI * 2;
    d += ` L ${x} ${(y + amp * Math.sin(t)).toFixed(1)}`;
  }
  return d;
}

export const CsmaLab: React.FC<CsmaLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [tab,        setTab]        = useState<'CD' | 'CA'>('CD');
  const [cdStep,     setCdStep]     = useState(0);
  const [cdPhase,    setCdPhase]    = useState<CdPhase>('IDLE');
  const [cdProgress, setCdProgress] = useState(0);
  const [caStep,     setCaStep]     = useState(0);
  const [caPhase,    setCaPhase]    = useState<CaPhase>('IDLE');
  const [caProgress, setCaProgress] = useState(0);
  const [navTimer,   setNavTimer]   = useState(0);

  useEffect(() => {
    if (!['TRANSMITTING','JAMMING','RETRANSMITTING'].includes(cdPhase)) { setCdProgress(0); return; }
    setCdProgress(0);
    const iv = setInterval(() => setCdProgress(p => p >= 100 ? 100 : p + 4), 20);
    return () => clearInterval(iv);
  }, [cdPhase]);

  useEffect(() => {
    if (!['RTS','CTS','DATA','ACK'].includes(caPhase)) { setCaProgress(0); return; }
    setCaProgress(0);
    const iv = setInterval(() => setCaProgress(p => p >= 100 ? 100 : p + 5), 20);
    return () => clearInterval(iv);
  }, [caPhase]);

  useEffect(() => {
    if (navTimer <= 0) return;
    const t = setTimeout(() => setNavTimer(n => n - 1), 100);
    return () => clearTimeout(t);
  }, [navTimer]);

  const nextCd = () => {
    const next = (cdStep + 1) % CD_STEPS.length;
    setCdStep(next); setCdPhase(CD_STEPS[next].phase);
  };
  const nextCa = () => {
    const next = (caStep + 1) % CA_STEPS.length;
    setCaStep(next); setCaPhase(CA_STEPS[next].phase);
    if (CA_STEPS[next].phase === 'CTS') setNavTimer(55);
    else if (['IDLE','SUCCESS'].includes(CA_STEPS[next].phase)) setNavTimer(0);
  };
  const resetCd = () => { setCdStep(0); setCdPhase('IDLE'); };
  const resetCa = () => { setCaStep(0); setCaPhase('IDLE'); setNavTimer(0); };

  const jumpCd = (i: number) => { setCdStep(i); setCdPhase(CD_STEPS[i].phase); };
  const jumpCa = (i: number) => {
    setCaStep(i); setCaPhase(CA_STEPS[i].phase);
    if (CA_STEPS[i].phase === 'CTS') setNavTimer(55); else setNavTimer(0);
  };

  const isCollision = ['COLLISION','JAMMING'].includes(cdPhase);

  // CSMA/CD SVG geometry (viewBox 720×240)
  // H1 center (100,120), H2 center (620,120), wire y=120
  const CD = { h1x:100, h2x:620, wy:120, wx1:160, wx2:560, wLen:400 };
  // Packet positions
  const cdH1pkt  = CD.wx1 + (cdProgress/100) * CD.wLen/2;       // H1 → center
  const cdH2pkt  = CD.wx2 - (cdProgress/100) * CD.wLen/2;       // H2 → center
  const cdJam1   = 360   - (cdProgress/100) * CD.wLen/2;        // jam left
  const cdJam2   = 360   + (cdProgress/100) * CD.wLen/2;        // jam right
  const cdRetx   = CD.wx1 + (cdProgress/100) * CD.wLen;         // H1 retransmit
  const cdSucc   = cdPhase === 'SUCCESS';

  // H1 node state
  const h1Color = cdPhase === 'BACKOFF' ? '#d29922'
    : ['TRANSMITTING','RETRANSMITTING'].includes(cdPhase) ? '#4493f8'
    : cdSucc ? '#3fb950'
    : isCollision ? '#f85149' : T.borderColor;
  const h2Color = cdPhase === 'BACKOFF' ? '#f85149'
    : cdPhase === 'TRANSMITTING' ? '#4493f8'
    : isCollision ? '#f85149' : T.borderColor;
  const wireColor = isCollision ? '#f85149'
    : ['TRANSMITTING','RETRANSMITTING'].includes(cdPhase) ? '#4493f8'
    : cdSucc ? '#3fb950' : (isDarkMode ? '#30363d' : '#d1d5da');

  // CSMA/CA SVG geometry (viewBox 720×240)
  // Laptop A center (80,120), AP center (360,120), Laptop B center (640,120)
  const CA = { ax:80, apx:360, bx:640, wy:120, w1_x1:135, w1_x2:297, w2_x1:423, w2_x2:585, wLen:162 };
  const rtsX  = CA.w1_x1 + (caProgress/100) * CA.wLen;
  const ctsAx = CA.w1_x2 - (caProgress/100) * CA.wLen;
  const ctsBx = CA.w2_x1 + (caProgress/100) * CA.wLen;
  const dataX = CA.w1_x1 + (caProgress/100) * CA.wLen;
  const ackX  = CA.w1_x2 - (caProgress/100) * CA.wLen;

  // wave paths (computed once per render — they're static)
  const wave1 = wavePath(CA.w1_x1, CA.w1_x2, CA.wy);
  const wave2 = wavePath(CA.w2_x1, CA.w2_x2, CA.wy);

  const bg      = isDarkMode ? '#0d1117' : '#f6f8fa';
  const dimLine = isDarkMode ? '#30363d' : '#d1d5da';

  // Node card helper (for SVG rects)
  const nodeCard = (x: number, y: number, label: string, sub: string, color: string, half_w = 55, half_h = 26) => (
    <>
      {isDarkMode && <rect x={x-half_w} y={y-half_h+3} width={half_w*2} height={half_h*2} rx={10} fill="#000" opacity={0.25}/>}
      <rect x={x-half_w} y={y-half_h} width={half_w*2} height={half_h*2} rx={10}
        fill={isDarkMode?`${color}12`:`${color}08`} stroke={color} strokeWidth={2}/>
      <rect x={x-half_w} y={y-half_h} width={5} height={half_h*2} rx={4}
        fill={color} opacity={0.7}/>
      <text x={x+2} y={y-7} fill={color} fontSize={10.5} fontWeight="800"
        fontFamily="system-ui,-apple-system,sans-serif" textAnchor="middle">{label}</text>
      <text x={x+2} y={y+9} fill={isDarkMode?'#6e7681':'#6e7781'} fontSize={7.5}
        fontFamily="'Fira Code','Cascadia Code',monospace" textAnchor="middle">{sub}</text>
    </>
  );

  const pktLabel = (x: number, y: number, text: string, color: string) => (
    <>
      <rect x={x-20} y={y-9} width={40} height={18} rx={4}
        fill={isDarkMode?'#161b22':'#ffffff'} stroke={color} strokeWidth={1.5}/>
      <text x={x} y={y+4.5} textAnchor="middle" fill={color} fontSize={8}
        fontWeight="800" fontFamily="'Fira Code',monospace">{text}</text>
    </>
  );

  const acColor = tab === 'CD' ? CD_COLOR[cdPhase] : CA_COLOR[caPhase];
  const acLabel = tab === 'CD' ? CD_LABEL[cdPhase] : CA_LABEL[caPhase];
  const curStep = tab === 'CD' ? cdStep : caStep;
  const steps   = tab === 'CD' ? CD_STEPS : CA_STEPS;
  const stepColors = tab === 'CD'
    ? CD_STEPS.map(s => CD_COLOR[s.phase])
    : CA_STEPS.map(s => CA_COLOR[s.phase]);

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`@keyframes csma-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${T.cardBg} 0%,${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#4493f8,#f85149,#3fb950,#a855f7)' }}/>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📡</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>Media Access Control</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.success}20`, color:T.success, border:`1px solid ${T.success}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Free</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Compare how wired Ethernet (CSMA/CD) detects collisions after they occur, versus how Wi-Fi 802.11 (CSMA/CA) avoids them before they happen using virtual carrier sense.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Protocols',val:'2'},{label:'Steps',val:'7'},{label:'Frame Types',val:'4'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4493f8' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Tab Bar ── */}
        <div style={{ display:'flex', gap:4, marginBottom:'1.25rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}` }}>
          <button type="button" onClick={()=>{ setTab('CD'); resetCd(); }}
            style={{ flex:1, padding:'0.5rem', fontWeight:700, fontSize:'0.8rem', border:'none', borderRadius:8, cursor:'pointer', background:tab==='CD'?T.accent:'transparent', color:tab==='CD'?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
            CSMA/CD — Wired Ethernet
          </button>
          <button type="button" onClick={()=>{ setTab('CA'); resetCa(); }}
            style={{ flex:1, padding:'0.5rem', fontWeight:700, fontSize:'0.8rem', border:'none', borderRadius:8, cursor:'pointer', background:tab==='CA'?'#3fb950':'transparent', color:tab==='CA'?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
            CSMA/CA — Wireless 802.11
          </button>
        </div>

        {/* ── Status pill ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.5rem 1rem', marginBottom:'0.75rem' }}>
          <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:4, background:`${acColor}18`, color:acColor, border:`1px solid ${acColor}30`, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {tab === 'CD' ? 'CSMA/CD' : 'CSMA/CA'}
          </span>
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:acColor }}>{acLabel}</span>
          <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:T.textMuted }}>
            Step <strong style={{ color:T.textPrimary }}>{curStep}</strong> / {steps.length - 1}
          </span>
        </div>

        {/* ── Canvas SVG ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden', marginBottom:'0.75rem', animation:'csma-fade 0.25s ease-out' }}>
          <svg viewBox="0 0 720 240" style={{ width:'100%', display:'block' }}>
            <defs>
              <pattern id="csma-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="0.9" fill={isDarkMode?'#ffffff':'#000000'} opacity={isDarkMode?0.04:0.025}/>
              </pattern>
              <filter id="csma-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width={720} height={240} fill={bg}/>
            <rect width={720} height={240} fill="url(#csma-dots)"/>

            {/* ════ CSMA/CD ════ */}
            {tab === 'CD' && (
              <>
                {/* Wire glow (active) */}
                {!['IDLE'].includes(cdPhase) && (
                  <line x1={CD.wx1} y1={CD.wy} x2={CD.wx2} y2={CD.wy}
                    stroke={wireColor} strokeWidth={10} opacity={0.12} filter="url(#csma-glow)"/>
                )}
                {/* Wire */}
                <line x1={CD.wx1} y1={CD.wy} x2={CD.wx2} y2={CD.wy}
                  stroke={wireColor} strokeWidth={isCollision?3:2.5} strokeLinecap="round"
                  strokeDasharray={isCollision?'6 4':'none'} opacity={0.9}/>

                {/* Transmitting packets (from both ends) */}
                {cdPhase==='TRANSMITTING' && (
                  <>
                    <circle cx={cdH1pkt} cy={CD.wy} r={15} fill="#4493f8" opacity={0.07}/>
                    <circle cx={cdH1pkt} cy={CD.wy} r={9}  fill="#4493f8" opacity={0.15}/>
                    <circle cx={cdH1pkt} cy={CD.wy} r={4}  fill="#4493f8"/>
                    <circle cx={cdH2pkt} cy={CD.wy} r={15} fill="#4493f8" opacity={0.07}/>
                    <circle cx={cdH2pkt} cy={CD.wy} r={9}  fill="#4493f8" opacity={0.15}/>
                    <circle cx={cdH2pkt} cy={CD.wy} r={4}  fill="#4493f8"/>
                  </>
                )}

                {/* Collision burst */}
                {isCollision && (
                  <>
                    <circle cx={360} cy={CD.wy} r={28} fill="#f85149" opacity={0.08} filter="url(#csma-glow)"/>
                    <text x={360} y={CD.wy+8} textAnchor="middle" fontSize={28}>💥</text>
                  </>
                )}

                {/* Jam signals */}
                {cdPhase==='JAMMING' && (
                  <>
                    {[cdJam1, cdJam2].map((jx,i)=>(
                      <g key={i}>
                        <circle cx={jx} cy={CD.wy} r={12} fill="#f85149" opacity={0.08}/>
                        <circle cx={jx} cy={CD.wy} r={6}  fill="#f85149" opacity={0.3}/>
                        <circle cx={jx} cy={CD.wy} r={3}  fill="#f85149"/>
                      </g>
                    ))}
                    {pktLabel(360, CD.wy-22, 'JAM', '#f85149')}
                  </>
                )}

                {/* Backoff labels */}
                {cdPhase==='BACKOFF' && (
                  <>
                    <rect x={CD.h1x-30} y={CD.wy-70} width={60} height={20} rx={5} fill="#d29922" opacity={0.9}/>
                    <text x={CD.h1x} y={CD.wy-57} textAnchor="middle" fill="#000" fontSize={9} fontWeight="800" fontFamily="monospace">Backoff 3ms</text>
                    <rect x={CD.h2x-30} y={CD.wy-70} width={60} height={20} rx={5} fill="#f85149" opacity={0.9}/>
                    <text x={CD.h2x} y={CD.wy-57} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="800" fontFamily="monospace">Backoff 9ms</text>
                  </>
                )}

                {/* Retransmit DATA packet */}
                {cdPhase==='RETRANSMITTING' && (
                  <>
                    <line x1={CD.wx1} y1={CD.wy} x2={CD.wx2} y2={CD.wy}
                      stroke="#4493f8" strokeWidth={8} opacity={0.12} filter="url(#csma-glow)"/>
                    <circle cx={cdRetx} cy={CD.wy} r={14} fill="#4493f8" opacity={0.08}/>
                    <circle cx={cdRetx} cy={CD.wy} r={8}  fill="#4493f8" opacity={0.2}/>
                    <circle cx={cdRetx} cy={CD.wy} r={4}  fill="#4493f8"/>
                    {pktLabel(cdRetx, CD.wy-22, 'DATA', '#4493f8')}
                  </>
                )}

                {/* Success: DATA arrived */}
                {cdPhase==='SUCCESS' && (
                  <>
                    {pktLabel(CD.wx2, CD.wy-22, 'DATA ✓', '#3fb950')}
                  </>
                )}

                {/* H1 node */}
                {nodeCard(CD.h1x, CD.wy, 'Host 1', '10.0.0.1', h1Color)}
                {/* H2 node */}
                {nodeCard(CD.h2x, CD.wy, 'Host 2', '10.0.0.2', h2Color)}

                {/* Legend */}
                <text x="360" y="230" textAnchor="middle" fontSize="8.5"
                  fill={isDarkMode?'#484f58':'#9198a1'} fontFamily="system-ui,sans-serif">
                  CSMA/CD — shared half-duplex Ethernet bus
                </text>
              </>
            )}

            {/* ════ CSMA/CA ════ */}
            {tab === 'CA' && (
              <>
                {/* Wireless wave paths */}
                <path d={wave1} fill="none" stroke={dimLine} strokeWidth={1.5} opacity={0.5}/>
                <path d={wave2} fill="none" stroke={navTimer>0?'#f8514950':dimLine} strokeWidth={1.5} opacity={0.5}/>

                {/* Active glow on transmitting segment */}
                {['RTS','DATA'].includes(caPhase) && (
                  <path d={wave1} fill="none" stroke={CA_COLOR[caPhase]} strokeWidth={5} opacity={0.2} filter="url(#csma-glow)"/>
                )}
                {['CTS','ACK'].includes(caPhase) && (
                  <path d={wave1} fill="none" stroke={CA_COLOR[caPhase]} strokeWidth={5} opacity={0.2} filter="url(#csma-glow)"/>
                )}
                {caPhase==='CTS' && (
                  <path d={wave2} fill="none" stroke="#a855f7" strokeWidth={5} opacity={0.2} filter="url(#csma-glow)"/>
                )}

                {/* DIFS wait above Laptop A */}
                {caPhase==='DIFS' && (
                  <>
                    <rect x={CA.ax-32} y={CA.wy-74} width={64} height={20} rx={5} fill="#4493f8" opacity={0.9}/>
                    <text x={CA.ax} y={CA.wy-61} textAnchor="middle" fill="#fff" fontSize={9} fontWeight="800" fontFamily="monospace">Waiting DIFS…</text>
                  </>
                )}

                {/* RTS packet */}
                {caPhase==='RTS' && pktLabel(rtsX, CA.wy-18, 'RTS', '#d29922')}

                {/* CTS to Laptop A */}
                {caPhase==='CTS' && (
                  <>
                    {pktLabel(ctsAx, CA.wy-18, 'CTS', '#a855f7')}
                    {pktLabel(ctsBx, CA.wy-18, 'CTS', '#f85149')}
                  </>
                )}

                {/* DATA packet */}
                {caPhase==='DATA' && (
                  <>
                    <circle cx={dataX} cy={CA.wy} r={14} fill="#4493f8" opacity={0.08}/>
                    <circle cx={dataX} cy={CA.wy} r={8}  fill="#4493f8" opacity={0.2}/>
                    <circle cx={dataX} cy={CA.wy} r={4}  fill="#4493f8"/>
                    {pktLabel(dataX, CA.wy-22, 'DATA', '#4493f8')}
                  </>
                )}

                {/* ACK packet */}
                {caPhase==='ACK' && pktLabel(ackX, CA.wy-18, 'ACK', '#3fb950')}

                {/* NAV timer on Laptop B */}
                {navTimer > 0 && (
                  <>
                    <rect x={CA.bx-35} y={CA.wy-75} width={70} height={20} rx={5} fill="#f85149" opacity={0.9}/>
                    <text x={CA.bx} y={CA.wy-62} textAnchor="middle" fill="#fff" fontSize={8.5} fontWeight="800" fontFamily="monospace">
                      NAV {(navTimer * 0.1).toFixed(1)}s
                    </text>
                  </>
                )}

                {/* Nodes */}
                {nodeCard(CA.ax,  CA.wy, 'Laptop A', '192.168.1.10',
                  ['DIFS','RTS','DATA','SUCCESS'].includes(caPhase) ? '#3fb950' : '#4493f8', 50)}
                {nodeCard(CA.apx, CA.wy, 'Access Point', '192.168.1.1',
                  ['CTS','ACK'].includes(caPhase) ? '#3fb950' : T.accent, 60)}
                {nodeCard(CA.bx,  CA.wy, 'Laptop B', '192.168.1.11',
                  navTimer > 0 ? '#f85149' : (caPhase==='SUCCESS'?'#3fb950':T.borderColor), 50)}

                {/* Legend */}
                <text x="360" y="230" textAnchor="middle" fontSize="8.5"
                  fill={isDarkMode?'#484f58':'#9198a1'} fontFamily="system-ui,sans-serif">
                  CSMA/CA — IEEE 802.11 wireless with RTS/CTS virtual carrier sense
                </text>
              </>
            )}
          </svg>
        </div>

        {/* ── Step timeline ── */}
        <div style={{ display:'flex', gap:3, marginBottom:'0.75rem' }}>
          {steps.map((s,i)=>{
            const c = stepColors[i];
            return (
              <div key={i} onClick={()=> tab==='CD' ? jumpCd(i) : jumpCa(i)}
                style={{ flex:1, cursor:'pointer' }}>
                <div style={{ height:5, borderRadius:3, background:i<=curStep?c:dimLine, marginBottom:3, transition:'background 0.25s', boxShadow:i===curStep?`0 0 8px ${c}60`:undefined }}/>
                <div style={{ fontSize:'0.42rem', textAlign:'center', color:i===curStep?c:T.textMuted, fontWeight:i===curStep?800:400, textTransform:'uppercase', letterSpacing:'0.02em' }}>
                  {s.phase}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Controls + Terminal ── */}
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>

          {/* Controls */}
          <div style={{ flex:'0 0 auto', display:'flex', flexDirection:'column', gap:8, minWidth:180 }}>
            <button type="button"
              onClick={tab==='CD' ? nextCd : nextCa}
              style={{ padding:'0.65rem 1.25rem', borderRadius:8, border:'none', background:tab==='CD'?T.accent:'#3fb950', color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit', fontSize:'0.85rem' }}>
              {curStep === 0 ? '▶ Start' : curStep === steps.length - 1 ? '↺ Restart' : 'Next Step →'}
            </button>
            <button type="button"
              onClick={tab==='CD' ? resetCd : resetCa}
              disabled={curStep === 0}
              style={{ padding:'0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:curStep===0?T.textMuted:T.textSecondary, cursor:curStep===0?'not-allowed':'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.82rem', opacity:curStep===0?0.5:1 }}>
              ↺ Reset
            </button>

            {/* Phase indicator */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.65rem 0.8rem', marginTop:4 }}>
              <div style={{ fontSize:'0.58rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Phase</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:acColor, boxShadow:`0 0 6px ${acColor}80` }}/>
                <span style={{ fontSize:'0.72rem', fontWeight:800, color:acColor }}>{tab==='CD'?cdPhase:caPhase}</span>
              </div>
            </div>
          </div>

          {/* Terminal log */}
          <div style={{ flex:'1 1 260px', borderRadius:12, overflow:'hidden', border:`1px solid ${acColor}40` }}>
            <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }}/>)}
              </div>
              <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                {tab==='CD' ? 'csma/cd' : 'csma/ca'} — step {curStep} of {steps.length - 1}
              </span>
              <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'2px 6px', borderRadius:3, background:`${acColor}22`, color:acColor, border:`1px solid ${acColor}40`, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                {tab==='CD' ? cdPhase : caPhase}
              </span>
            </div>
            <div style={{ background:'#0d1117', padding:'0.85rem 1.1rem', minHeight:100 }}>
              <div style={{ fontFamily:"'Fira Code','Cascadia Code',monospace", fontSize:'0.74rem', color:isCollision?'#f85149':acColor, lineHeight:1.8 }}>
                {steps[curStep].log}
              </div>
            </div>
          </div>
        </div>

        <LabEduPanel cards={CSMA_EDU} isDarkMode={isDarkMode}/>
      </div>
    </div>
  );
};

export default CsmaLab;
