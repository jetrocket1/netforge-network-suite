import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

interface DynamicRoutingLabProps { isDarkMode?: boolean; }

type Protocol = 'static' | 'default' | 'rip' | 'ospf' | 'eigrp' | 'bgp';
type SimPhase  = 'idle' | 'computing' | 'transit' | 'done';

const PROTO_META: Record<Protocol, { label: string; color: string; ad: string }> = {
  static:  { label:'Static',  color:'#9198a1', ad:'1'         },
  default: { label:'Default', color:'#6e7781', ad:'1'         },
  rip:     { label:'RIP',     color:'#d29922', ad:'120'       },
  ospf:    { label:'OSPF',    color:'#4493f8', ad:'110'       },
  eigrp:   { label:'EIGRP',   color:'#a855f7', ad:'90'        },
  bgp:     { label:'BGP',     color:'#3fb950', ad:'20 (eBGP)' },
};

const PROTO_GUIDE: Record<Protocol, { title:string; formula:string; explanation:string; challenge:string }> = {
  static: {
    title: 'Static Routing — Manual Administrator Configuration',
    formula: 'ip route [network] [mask] [next-hop-ip]  →  AD: 1',
    explanation: 'Hardcoded paths directly configured by engineers. Because Administrative Distance measures trustworthiness, a static path (AD: 1) overrides any dynamically learned route to the same destination, regardless of metric.',
    challenge: 'Notice Path B is locked regardless of the slider. Static routes bypass all dynamic metric calculations — the path never changes unless an engineer manually edits the device config.',
  },
  default: {
    title: 'Default Routing — Gateway of Last Resort',
    formula: 'ip route 0.0.0.0 0.0.0.0 [exit-interface]  →  AD: 1',
    explanation: 'The catch-all wildcard route. When a frame arrives and matches no specific prefix in the routing table, the 0.0.0.0/0 entry (Gateway of Last Resort) forwards it toward the internet edge.',
    challenge: '0.0.0.0/0 has the shortest possible prefix (/0). Cisco\'s longest-prefix-match rule always prefers more specific routes — the default only fires when nothing else matches.',
  },
  rip: {
    title: 'Distance-Vector Protocol — Routing Information Protocol',
    formula: 'Metric = Hop Count (max 15, 16 = unreachable)',
    explanation: 'RIP counts routers (hops) to reach a destination, broadcasting its full routing table every 30 seconds. Maximum useful distance is 15 hops — any route with 16+ hops is treated as infinite (unreachable).',
    challenge: 'RIP ignores link speed entirely. It prefers Path A (1 hop) regardless of bandwidth. A 56 Kbps dial-up link counts the same as a 100 Gbps fibre link.',
  },
  ospf: {
    title: 'Link-State Protocol — Open Shortest Path First',
    formula: 'Cost = Reference BW (100 Mbps) ÷ Interface BW',
    explanation: 'OSPF floods Link-State Advertisements to build a complete topology map (LSDB), then runs Dijkstra\'s SPF algorithm independently on each router to compute the lowest-cost tree.',
    challenge: 'Set the slider below 99 and inject a packet — Path B wins via R3. Drag it above 99 and Path A wins. The switchover occurs exactly when 1 + cost crosses 100.',
  },
  eigrp: {
    title: 'Hybrid Protocol — Enhanced Interior Gateway Routing Protocol',
    formula: 'Metric = [K1 × BW + K3 × Delay] × 256',
    explanation: 'Cisco\'s DUAL algorithm computes a composite metric from bandwidth and delay. It maintains a topology table with a Successor (best path) and Feasible Successors (loop-free backups) for sub-second failover.',
    challenge: 'Leave the slider at 1 and Path B beats Path A. Drag past ~10 and the metric calculation flips. EIGRP scales both bandwidth AND delay simultaneously.',
  },
  bgp: {
    title: 'Path-Vector Protocol — Border Gateway Protocol',
    formula: 'Best path: Weight → LOCAL_PREF → AS_PATH length → Origin → MED → …',
    explanation: 'BGP connects Autonomous Systems (AS numbers) across the internet. It carries full AS_PATH attributes rather than raw metrics. The path with the shortest AS_PATH wins when all higher-priority attributes are equal.',
    challenge: 'Path A crosses 1 AS, Path B crosses 2. BGP policy overrides link speed. In production, ISPs manipulate LOCAL_PREF and MED to override AS_PATH — BGP is 90% policy, 10% math.',
  },
};

const ROUTING_EDU: EduCard[] = [
  { type:'exam', title:'Administrative Distance — Lower AD Always Wins',
    body:'When two routing sources learn routes to the same destination, the router installs only the one with the lowest Administrative Distance. Connected=0, Static=1, eBGP=20, EIGRP=90, OSPF=110, IS-IS=115, RIP=120. If AD ties, the protocol\'s own metric (cost, hops, composite) breaks the tie. Only equal-AD routes can be ECMP load-balanced.' },
  { type:'exam', title:'OSPF Cost = 100 Mbps ÷ Interface Bandwidth',
    body:'Default reference bandwidth is 100 Mbps. FastEthernet (100M) = cost 1. T1 (1.544M) = cost 64. GigabitEthernet defaults to cost 1 as well — which makes Gig and FastEthernet look equal. Best practice: increase the reference with `auto-cost reference-bandwidth 10000` (for 10G) so high-speed links get meaningful costs.' },
  { type:'exam', title:'RIP\'s 15-Hop Limit — Why It Was Replaced',
    body:'RIP defines 16 hops as infinite (unreachable). Any network beyond 15 routers is invisible to RIP. Combined with bandwidth blindness (hop count only), slow convergence (30-second updates, 180-second holddown), and no VLSM support in v1, RIP was effectively replaced by OSPF and EIGRP in all but the smallest networks.' },
  { type:'gotcha', title:'EIGRP Was Cisco-Proprietary Until 2016',
    body:'EIGRP was Cisco-only for over 20 years. In 2016 Cisco published RFC 7868, opening the specification. It remains rare outside Cisco environments. Its DUAL (Diffusing Update Algorithm) guarantees loop-free paths and stores Feasible Successors — backup routes that are mathematically guaranteed not to loop — enabling instant failover without SPF recalculation.' },
  { type:'realworld', title:'BGP Routes the Entire Internet',
    body:'Your home router doesn\'t run BGP — your ISP does. Every AS (ISP, cloud provider, enterprise edge) announces its IP prefixes to peers via eBGP. The global "Default-Free Zone" currently holds 900,000+ BGP prefixes. AWS, Google, Cloudflare, and every major CDN all run BGP on every internet-facing edge router. BGP\'s 11-attribute selection process (Weight, LOCAL_PREF, AS_PATH, Origin, MED, etc.) makes it the most complex routing protocol to tune.' },
];

// Computes where a line exits the bounding box of a node card
function nEdge(from: {x:number;y:number}, to: {x:number;y:number}, hw = 45, hh = 26) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx*dx + dy*dy) || 1;
  const ndx = dx/len, ndy = dy/len;
  const t = Math.min(ndx !== 0 ? hw/Math.abs(ndx) : Infinity, ndy !== 0 ? hh/Math.abs(ndy) : Infinity);
  return { x: from.x + ndx*t, y: from.y + ndy*t };
}

export const DynamicRoutingLab: React.FC<DynamicRoutingLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [protocol,   setProtocol]   = useState<Protocol>('ospf');
  const [linkBCost,  setLinkBCost]  = useState(10);
  const [simPhase,   setSimPhase]   = useState<SimPhase>('idle');
  const [animPct,    setAnimPct]    = useState(0);
  const [routingLog, setRoutingLog] = useState<string[]>(['RIB engine ready. Select a protocol and inject a packet.']);

  const usesPathB = (() => {
    if (protocol === 'static' || protocol === 'default') return true;
    if (protocol === 'rip'   || protocol === 'bgp')     return false;
    if (protocol === 'ospf')  return (1 + linkBCost) < 100;
    if (protocol === 'eigrp') return (2560 * linkBCost) < 25600;
    return false;
  })();

  const protoColor  = PROTO_META[protocol].color;
  const dimLine     = isDarkMode ? '#30363d' : '#d1d5da';
  const pathAColor  = !usesPathB ? protoColor : dimLine;
  const pathBColor  = usesPathB  ? protoColor : dimLine;
  const isComputing = simPhase === 'computing';
  const isTransit   = simPhase === 'transit';
  const isDone      = simPhase === 'done';

  // Smooth 0→100 packet animation when phase = 'transit'
  useEffect(() => {
    if (simPhase !== 'transit') { if (simPhase !== 'done') setAnimPct(0); return; }
    setAnimPct(0);
    let pct = 0;
    const iv = setInterval(() => {
      pct += 2;
      setAnimPct(pct);
      if (pct >= 100) { clearInterval(iv); setSimPhase('done'); }
    }, 30);
    return () => clearInterval(iv);
  }, [simPhase]);

  const runSimulation = () => {
    setSimPhase('computing');
    const logs: string[] = ['[0ms]  Packet at ingress on R1 — evaluating RIB...'];
    setRoutingLog([...logs]);

    setTimeout(() => {
      if (protocol === 'static') {
        logs.push('[200ms] Static override detected (AD 1).');
        logs.push('[300ms] ip route 10.0.0.0/8 via R3 → matched.');
        logs.push('[400ms] Winner → Path B  (static, AD 1 beats all dynamic).');
      } else if (protocol === 'default') {
        logs.push('[200ms] No specific prefix match found in RIB.');
        logs.push('[300ms] Gateway of Last Resort: 0.0.0.0/0 via R3.');
        logs.push('[400ms] Winner → Path B  (default route /0).');
      } else if (protocol === 'rip') {
        logs.push('[200ms] RIPv2 metric: Path A = 1 hop · Path B = 2 hops.');
        logs.push('[400ms] Winner → Path A  (lowest hop count).');
      } else if (protocol === 'ospf') {
        const costB = 1 + linkBCost;
        logs.push(`[200ms] OSPF SPF: Path A cost = 100, Path B cost = 1 + ${linkBCost} = ${costB}.`);
        logs.push(`[400ms] Winner → ${costB < 100 ? `Path B  (${costB} < 100)` : `Path A  (${costB} ≥ 100)`}.`);
      } else if (protocol === 'eigrp') {
        const mA = 25600, mB = 2560 * linkBCost;
        logs.push(`[200ms] EIGRP DUAL: Path A metric = ${mA} · Path B metric = ${mB}.`);
        logs.push(`[400ms] Winner → ${mB < mA ? 'Path B  (lower composite metric)' : 'Path A  (lower composite metric)'}.`);
      } else {
        logs.push('[200ms] BGP: Path A AS_PATH = [65002] (1 hop).');
        logs.push('[250ms] BGP: Path B AS_PATH = [65003, 65002] (2 hops).');
        logs.push('[400ms] Winner → Path A  (shortest AS_PATH attribute).');
      }
      logs.push('[500ms] Forwarding out of interface — packet in flight…');
      setRoutingLog([...logs]);
      setSimPhase('transit');
    }, 900);

    setTimeout(() => {
      logs.push('[900ms] ✓ Packet delivered successfully at R2.');
      setRoutingLog([...logs]);
    }, 2800);
  };

  const handleProtocol = (p: Protocol) => { setProtocol(p); setSimPhase('idle'); setAnimPct(0); };
  const handleCost     = (v: number)   => { setLinkBCost(v); setSimPhase('idle'); setAnimPct(0); };

  // ── SVG geometry ──────────────────────────────────────────────────
  const R1 = { x:130, y:105 }, R2 = { x:590, y:105 }, R3 = { x:360, y:210 };
  const hw = 45, hh = 26;

  const pA_f  = nEdge(R1, R2, hw, hh);  // R1→R2 start
  const pA_t  = nEdge(R2, R1, hw, hh);  // R1→R2 end
  const pB1_f = nEdge(R1, R3, hw, hh);  // R1→R3 start
  const pB1_t = nEdge(R3, R1, hw, hh);  // R1→R3 end
  const pB2_f = nEdge(R3, R2, hw, hh);  // R3→R2 start
  const pB2_t = nEdge(R2, R3, hw, hh);  // R3→R2 end

  // Interpolated packet position
  let pktX = R1.x, pktY = R1.y;
  if (isTransit || isDone) {
    if (!usesPathB) {
      pktX = pA_f.x + (animPct/100) * (pA_t.x - pA_f.x);
      pktY = pA_f.y;
    } else if (animPct <= 50) {
      const f = animPct / 50;
      pktX = pB1_f.x + f * (pB1_t.x - pB1_f.x);
      pktY = pB1_f.y + f * (pB1_t.y - pB1_f.y);
    } else {
      const f = (animPct - 50) / 50;
      pktX = pB2_f.x + f * (pB2_t.x - pB2_f.x);
      pktY = pB2_f.y + f * (pB2_t.y - pB2_f.y);
    }
  }

  const bg      = isDarkMode ? '#0d1117' : '#f6f8fa';
  const guide   = PROTO_GUIDE[protocol];
  const sliderDisabled = ['rip','bgp','static','default'].includes(protocol) || simPhase !== 'idle';

  // Path labels
  const pALabel = protocol === 'static'  ? 'Path A: blocked (AD 1 override)'
    : protocol === 'default' ? 'Path A: no prefix match'
    : protocol === 'rip'     ? 'Path A: 1 hop'
    : protocol === 'ospf'    ? 'Path A: cost 100'
    : protocol === 'eigrp'   ? 'Path A: metric 25600'
    :                          'Path A: AS_PATH length 1';
  const pBLabel = protocol === 'static'  ? 'Path B: admin static override'
    : protocol === 'default' ? 'Path B: gateway of last resort'
    : protocol === 'rip'     ? 'Path B: 2 hops'
    : protocol === 'ospf'    ? `Path B: cost ${1+linkBCost}`
    : protocol === 'eigrp'   ? `Path B: metric ${2560*linkBCost}`
    :                          'Path B: AS_PATH length 2';

  // SVG helper components
  const NodeCard = ({ pos, label, sub, color }: { pos:{x:number;y:number}; label:string; sub:string; color:string }) => (
    <>
      {isDarkMode && <rect x={pos.x-hw} y={pos.y-hh+3} width={hw*2} height={hh*2} rx={10} fill="#000" opacity={0.2}/>}
      <rect x={pos.x-hw} y={pos.y-hh} width={hw*2} height={hh*2} rx={10}
        fill={isDarkMode?`${color}12`:`${color}08`} stroke={color} strokeWidth={2}/>
      <rect x={pos.x-hw} y={pos.y-hh} width={5} height={hh*2} rx={4} fill={color} opacity={0.7}/>
      <text x={pos.x+2} y={pos.y-7} fill={color} fontSize={11.5} fontWeight="800"
        fontFamily="system-ui,-apple-system,sans-serif" textAnchor="middle">{label}</text>
      <text x={pos.x+2} y={pos.y+9} fill={isDarkMode?'#6e7681':'#6e7781'} fontSize={7.5}
        fontFamily="'Fira Code','Cascadia Code',monospace" textAnchor="middle">{sub}</text>
    </>
  );

  const PathLabel = ({ x, y, text, color }: { x:number; y:number; text:string; color:string }) => {
    const w = text.length * 4.4 + 14;
    return (
      <>
        <rect x={x-w/2} y={y-8} width={w} height={16} rx={3}
          fill={isDarkMode?'#161b22':'#ffffff'} stroke={color} strokeWidth={1} opacity={0.9}/>
        <text x={x} y={y+4} textAnchor="middle" fill={color} fontSize={7.5}
          fontWeight="700" fontFamily="'Fira Code',monospace">{text}</text>
      </>
    );
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`@keyframes rout-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${T.cardBg} 0%,${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#4493f8,#d29922,#a855f7,#3fb950)' }}/>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${T.accent}15`, border:`1px solid ${T.accent}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🗺️</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>Routing Protocols Matrix</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.success}20`, color:T.success, border:`1px solid ${T.success}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Free</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Compare how six routing strategies — from static admin overrides to BGP AS_PATH — each select a different path through a 3-router topology.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Protocols',val:'6'},{label:'AD Range',val:'1–120'},{label:'Algorithms',val:'3'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:T.accent }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Protocol tab bar ── */}
        <div style={{ display:'flex', gap:3, marginBottom:'1rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}` }}>
          {(Object.keys(PROTO_META) as Protocol[]).map(p => {
            const c = PROTO_META[p].color;
            const active = protocol === p;
            return (
              <button key={p} type="button" onClick={() => handleProtocol(p)}
                style={{ flex:1, padding:'0.45rem 0.25rem', fontWeight:700, fontSize:'0.7rem', border:'none', borderRadius:8, cursor:'pointer', background:active?c:'transparent', color:active?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                {PROTO_META[p].label}
              </button>
            );
          })}
        </div>

        {/* ── Status pill ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.5rem 1rem', marginBottom:'0.75rem' }}>
          <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:4, background:`${protoColor}18`, color:protoColor, border:`1px solid ${protoColor}30`, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            {PROTO_META[protocol].label}
          </span>
          <span style={{ fontSize:'0.72rem', fontWeight:700, color:protoColor }}>
            {usesPathB ? 'Path B selected → via R3' : 'Path A selected → direct R1→R2'}
          </span>
          <span style={{ marginLeft:'auto', fontSize:'0.7rem', color:T.textMuted }}>
            AD <strong style={{ color:T.textPrimary }}>{PROTO_META[protocol].ad}</strong>
          </span>
        </div>

        {/* ── Topology SVG ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden', marginBottom:'0.75rem', animation:'rout-fade 0.25s ease-out' }}>
          <svg viewBox="0 0 720 275" style={{ width:'100%', display:'block' }}>
            <defs>
              <pattern id="rout-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="0.9" fill={isDarkMode?'#ffffff':'#000000'} opacity={isDarkMode?0.04:0.025}/>
              </pattern>
              <filter id="rout-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width={720} height={275} fill={bg}/>
            <rect width={720} height={275} fill="url(#rout-dots)"/>

            {/* ── Path A ── */}
            {!usesPathB && (
              <line x1={pA_f.x} y1={pA_f.y} x2={pA_t.x} y2={pA_t.y}
                stroke={protoColor} strokeWidth={10} opacity={0.1} filter="url(#rout-glow)"/>
            )}
            <line x1={pA_f.x} y1={pA_f.y} x2={pA_t.x} y2={pA_t.y}
              stroke={pathAColor} strokeWidth={usesPathB?2:2.5}
              strokeDasharray={usesPathB?'7 5':'none'} strokeLinecap="round" opacity={0.9}/>

            {/* ── Path B (two segments) ── */}
            {usesPathB && (
              <>
                <line x1={pB1_f.x} y1={pB1_f.y} x2={pB1_t.x} y2={pB1_t.y}
                  stroke={protoColor} strokeWidth={10} opacity={0.1} filter="url(#rout-glow)"/>
                <line x1={pB2_f.x} y1={pB2_f.y} x2={pB2_t.x} y2={pB2_t.y}
                  stroke={protoColor} strokeWidth={10} opacity={0.1} filter="url(#rout-glow)"/>
              </>
            )}
            <line x1={pB1_f.x} y1={pB1_f.y} x2={pB1_t.x} y2={pB1_t.y}
              stroke={pathBColor} strokeWidth={usesPathB?2.5:2}
              strokeDasharray={usesPathB?'none':'7 5'} strokeLinecap="round" opacity={0.9}/>
            <line x1={pB2_f.x} y1={pB2_f.y} x2={pB2_t.x} y2={pB2_t.y}
              stroke={pathBColor} strokeWidth={usesPathB?2.5:2}
              strokeDasharray={usesPathB?'none':'7 5'} strokeLinecap="round" opacity={0.9}/>

            {/* ── Path labels ── */}
            <PathLabel x={360} y={67} text={pALabel} color={pathAColor}/>
            <PathLabel x={360} y={254} text={pBLabel} color={pathBColor}/>

            {/* ── Travelling packet ── */}
            {isTransit && (
              <>
                <circle cx={pktX} cy={pktY} r={18} fill={protoColor} opacity={0.07}/>
                <circle cx={pktX} cy={pktY} r={11} fill={protoColor} opacity={0.15}/>
                <circle cx={pktX} cy={pktY} r={5}  fill={protoColor}/>
              </>
            )}

            {/* ── Delivery success glow ── */}
            {isDone && (
              <>
                <circle cx={R2.x} cy={R2.y} r={36} fill={T.success} opacity={0.07} filter="url(#rout-glow)"/>
                <text x={R2.x} y={R2.y - hh - 12} textAnchor="middle"
                  fontSize={10} fontWeight="800" fill={T.success}
                  fontFamily="system-ui,-apple-system,sans-serif">✓ Delivered</text>
              </>
            )}

            {/* ── Router nodes ── */}
            <NodeCard pos={R1} label="R1" sub="10.0.1.0/24" color={protoColor}/>
            <NodeCard pos={R3} label="R3" sub="10.0.3.0/24" color={usesPathB ? protoColor : dimLine}/>
            <NodeCard pos={R2} label="R2" sub="10.0.2.0/24" color={isDone ? T.success : T.borderColor}/>

            {/* ── Diagram legend ── */}
            <text x={360} y={266} textAnchor="middle" fontSize={8.5}
              fill={isDarkMode?'#484f58':'#9198a1'} fontFamily="system-ui,sans-serif">
              Solid = selected path · Dashed = inactive
            </text>
          </svg>
        </div>

        {/* ── Controls + Terminal ── */}
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap', marginBottom:'1rem' }}>

          {/* Controls */}
          <div style={{ flex:'0 0 auto', display:'flex', flexDirection:'column', gap:8, minWidth:210 }}>
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.75rem' }}>
              <div style={{ fontSize:'0.6rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>
                Path B Cost Multiplier
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                <input type="range" min="1" max="120" value={linkBCost}
                  onChange={e => handleCost(parseInt(e.target.value) || 1)}
                  disabled={sliderDisabled}
                  style={{ flex:1, accentColor:protoColor, opacity:sliderDisabled?0.3:1, cursor:sliderDisabled?'not-allowed':'pointer' }}/>
                <span style={{ fontSize:'0.8rem', fontWeight:800, color:protoColor, minWidth:28, textAlign:'right' }}>{linkBCost}</span>
              </div>
              {protocol === 'ospf' && (
                <div style={{ fontSize:'0.65rem', color:T.textMuted, fontFamily:'monospace' }}>
                  Path B = 1 + {linkBCost} = <strong style={{ color:(1+linkBCost)<100?T.success:T.danger }}>{1+linkBCost}</strong>
                  <span style={{ color:T.textMuted }}> (threshold: 100)</span>
                </div>
              )}
              {protocol === 'eigrp' && (
                <div style={{ fontSize:'0.65rem', color:T.textMuted, fontFamily:'monospace' }}>
                  Path B = <strong style={{ color:(2560*linkBCost)<25600?T.success:T.danger }}>{2560*linkBCost}</strong>
                  <span style={{ color:T.textMuted }}> (vs A: 25600)</span>
                </div>
              )}
              {sliderDisabled && !['ospf','eigrp'].includes(protocol) && (
                <div style={{ fontSize:'0.62rem', color:T.textMuted, fontStyle:'italic' }}>
                  {protocol === 'static' || protocol === 'default'
                    ? 'Slider ignored — admin override'
                    : 'Slider ignored — metric is hop/AS count'}
                </div>
              )}
            </div>

            <button type="button" onClick={runSimulation}
              disabled={isComputing || isTransit}
              style={{ padding:'0.65rem', borderRadius:8, border:'none', background:protoColor, color:'#fff', cursor:isComputing||isTransit?'not-allowed':'pointer', fontWeight:700, fontFamily:'inherit', fontSize:'0.82rem', opacity:isComputing||isTransit?0.7:1 }}>
              {isComputing ? 'Computing RIB…' : isTransit ? 'Routing…' : '▶ Inject Packet'}
            </button>

            {isDone && (
              <button type="button" onClick={() => { setSimPhase('idle'); setAnimPct(0); }}
                style={{ padding:'0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:T.textSecondary, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.78rem' }}>
                ↺ Reset
              </button>
            )}
          </div>

          {/* Mac-dots terminal */}
          <div style={{ flex:'1 1 260px', borderRadius:12, overflow:'hidden', border:`1px solid ${protoColor}40` }}>
            <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }}/>)}
              </div>
              <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                routing simulation — {PROTO_META[protocol].label}
              </span>
            </div>
            <div style={{ background:'#0d1117', padding:'0.85rem 1.1rem', minHeight:120 }}>
              {routingLog.map((line,i) => (
                <div key={i} style={{ fontFamily:"'Fira Code','Cascadia Code',monospace", fontSize:'0.72rem', lineHeight:1.85,
                  color: line.includes('✓') ? T.success : line.includes('Winner') ? protoColor : (isDarkMode?'#8b949e':'#57606a') }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Protocol detail card ── */}
        <div key={protocol} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1.1rem 1.25rem', marginBottom:'1.25rem', animation:'rout-fade 0.25s ease-out' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            <div style={{ fontSize:'0.92rem', fontWeight:700, color:protoColor }}>{guide.title}</div>
            <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'3px 10px', borderRadius:20, background:`${protoColor}18`, color:protoColor, border:`1px solid ${protoColor}30`, fontFamily:'monospace', whiteSpace:'nowrap' }}>
              AD: {PROTO_META[protocol].ad}
            </span>
          </div>
          <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.55rem 0.9rem', marginBottom:10, fontFamily:"'Fira Code','Cascadia Code',monospace", fontSize:'0.73rem', color:T.success }}>
            {guide.formula}
          </div>
          <p style={{ margin:'0 0 10px', fontSize:'0.82rem', lineHeight:1.65, color:T.textSecondary }}>{guide.explanation}</p>
          <div style={{ borderLeft:`3px solid ${protoColor}`, background:`${protoColor}0e`, padding:'0.65rem 0.9rem', borderRadius:'0 8px 8px 0' }}>
            <div style={{ fontSize:'0.67rem', fontWeight:800, color:protoColor, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Lab Objective</div>
            <p style={{ margin:0, fontSize:'0.79rem', lineHeight:1.6, color:T.textSecondary }}>{guide.challenge}</p>
          </div>
        </div>

        <LabEduPanel cards={ROUTING_EDU} isDarkMode={isDarkMode}/>
      </div>
    </div>
  );
};

export default DynamicRoutingLab;
