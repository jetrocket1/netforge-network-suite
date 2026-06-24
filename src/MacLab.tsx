import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';

function ease(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function lerp(a: number, b: number, t: number) { return a+(b-a)*t; }
function shortMac(m: string) { return m.split(':').slice(0,2).join(':')+'…'; }

// Per-port colours — used in both the SVG port circles and the CAM table
const PC = ['#4493f8', '#3fb950', '#e3b341', '#a855f7'];

const HOSTS = [
  { id:1, label:'PC-A', mac:'AA:AA:AA:AA:AA:01', cx:80,  cy:52  },
  { id:2, label:'PC-B', mac:'BB:BB:BB:BB:BB:02', cx:580, cy:52  },
  { id:3, label:'PC-C', mac:'CC:CC:CC:CC:CC:03', cx:80,  cy:290 },
  { id:4, label:'PC-D', mac:'DD:DD:DD:DD:DD:04', cx:580, cy:290 },
];

const LINKS = [
  { hx:80,  hy:74,  px:255, py:122 },
  { hx:580, hy:74,  px:405, py:122 },
  { hx:80,  hy:268, px:255, py:198 },
  { hx:580, hy:268, px:405, py:198 },
];

const SW = { x:228, y:118, w:204, h:84 };

const MA='AA:AA:AA:AA:AA:01', MB='BB:BB:BB:BB:BB:02';
const MC='CC:CC:CC:CC:CC:03', MD='DD:DD:DD:DD:DD:04';
const ME='EE:EE:EE:EE:EE:05', BCAST='FF:FF:FF:FF:FF:FF';

interface MacEntry { mac:string; port:number; vlan:number; age:number; state?:'new'|'updated'|'expiring'; }
type FwdDecision = { type:'unicast'; port:number } | { type:'flood'; ports:number[] } | null;
interface MacStep {
  srcPort:number|null; srcMac:string; dstMac:string; decision:FwdDecision;
  learnMac:string|null; isMove?:boolean; frameType?:'unicast'|'flood'|'broadcast';
  title:string; detail:string; tableAfter:MacEntry[];
}
interface MacScenario { name:string; desc:string; steps:MacStep[]; }

const SCENARIOS: MacScenario[] = [
  {
    name:'MAC Learning', desc:'Watch the switch populate its forwarding table from scratch',
    steps:[
      { srcPort:1, srcMac:MA, dstMac:MB, decision:{type:'flood',ports:[2,3,4]}, learnMac:MA,
        frameType:'flood', title:'PC-A → PC-B — Unknown Destination, Flood All',
        detail:'The MAC table is empty. The frame arrives on Port 1, so the switch learns AA:AA on Port 1. But BB:BB is not in the table — the switch has no choice but to flood: it copies the frame to every other port (2, 3, 4). Only PC-B should respond; PC-C and PC-D silently discard it.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:0,state:'new'}] },
      { srcPort:2, srcMac:MB, dstMac:MA, decision:{type:'unicast',port:1}, learnMac:MB,
        frameType:'unicast', title:'PC-B → PC-A — Known Destination, Unicast Forward',
        detail:'PC-B replies. The frame arrives on Port 2 — BB:BB is learned there. The destination AA:AA was already learned in the previous step on Port 1, so the switch forwards to Port 1 only. Ports 3 and 4 see nothing. This is the switch\'s core value over a hub: traffic only goes where it needs to.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:2},{mac:MB,port:2,vlan:1,age:0,state:'new'}] },
      { srcPort:3, srcMac:MC, dstMac:MD, decision:{type:'flood',ports:[1,2,4]}, learnMac:MC,
        frameType:'flood', title:'PC-C → PC-D — Unknown Destination, Flood All',
        detail:'A second conversation starts. CC:CC is learned on Port 3. DD:DD is not yet in the table, so the switch floods ports 1, 2, and 4. PC-A and PC-B receive the copy but discard it — only PC-D should respond.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:8},{mac:MB,port:2,vlan:1,age:6},{mac:MC,port:3,vlan:1,age:0,state:'new'}] },
      { srcPort:4, srcMac:MD, dstMac:MC, decision:{type:'unicast',port:3}, learnMac:MD,
        frameType:'unicast', title:'PC-D → PC-C — Table Full, All Traffic Now Unicast',
        detail:'DD:DD is learned on Port 4. The table now has all four hosts. CC:CC is on Port 3, so the frame goes there directly. From this point, every conversation between these four hosts uses efficient unicast forwarding — no unnecessary copies, no wasted bandwidth.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:14},{mac:MB,port:2,vlan:1,age:12},{mac:MC,port:3,vlan:1,age:6},{mac:MD,port:4,vlan:1,age:0,state:'new'}] },
    ],
  },
  {
    name:'Flood vs Forward', desc:'See what triggers flooding versus unicast forwarding',
    steps:[
      { srcPort:1, srcMac:MA, dstMac:MD, decision:{type:'unicast',port:4}, learnMac:null,
        frameType:'unicast', title:'PC-A → PC-D — Unicast: One Port Only',
        detail:'The full table is known. DD:DD maps to Port 4. The switch sends the frame to Port 4 exclusively. Ports 2 and 3 receive nothing. Compare this to a hub, which would duplicate the frame to every port regardless — the switch eliminates unnecessary traffic.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:31},{mac:MB,port:2,vlan:1,age:47},{mac:MC,port:3,vlan:1,age:62},{mac:MD,port:4,vlan:1,age:88}] },
      { srcPort:2, srcMac:MB, dstMac:ME, decision:{type:'flood',ports:[1,3,4]}, learnMac:null,
        frameType:'flood', title:'PC-B → Unknown Host — Unknown Unicast Flood',
        detail:'PC-B sends to EE:EE:EE:EE:EE:05 — a MAC not in the table. This is "unknown unicast" flooding. The switch copies the frame to all ports except the source (Port 2). The switch does NOT learn EE:EE as a destination — switches only learn from source MACs, never from destination fields.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:35},{mac:MB,port:2,vlan:1,age:51},{mac:MC,port:3,vlan:1,age:66},{mac:MD,port:4,vlan:1,age:92}] },
      { srcPort:3, srcMac:MC, dstMac:BCAST, decision:{type:'flood',ports:[1,2,4]}, learnMac:null,
        frameType:'broadcast', title:'PC-C Sends Broadcast — Always Flooded by Design',
        detail:'A frame to FF:FF:FF:FF:FF:FF must reach every device on the segment. The switch always floods broadcasts — not because the destination is unknown, but because broadcasts are definitionally for everyone. ARP requests, DHCP discovers, and routing protocol hellos all use this.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:39},{mac:MB,port:2,vlan:1,age:55},{mac:MC,port:3,vlan:1,age:0},{mac:MD,port:4,vlan:1,age:96}] },
      { srcPort:4, srcMac:MD, dstMac:MB, decision:{type:'unicast',port:2}, learnMac:null,
        frameType:'unicast', title:'PC-D → PC-B — Unicast: Straight to Port 2',
        detail:'Back to normal unicast. BB:BB is on Port 2. The frame is delivered there exclusively. In a VLAN-aware switch, the lookup also checks that source and destination share the same VLAN — frames between different VLANs require a Layer 3 routed hop, not just a switch forward.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:42},{mac:MB,port:2,vlan:1,age:58},{mac:MC,port:3,vlan:1,age:3},{mac:MD,port:4,vlan:1,age:0}] },
    ],
  },
  {
    name:'MAC Aging', desc:'Entries expire after 300 s of inactivity and get re-learned on next traffic',
    steps:[
      { srcPort:1, srcMac:MA, dstMac:MB, decision:{type:'unicast',port:2}, learnMac:null,
        frameType:'unicast', title:'Normal Traffic — Ages Incrementing',
        detail:'The MAC table is populated. Each entry\'s age counts up from when the MAC was last seen as a source. Notice DD:DD at 271 s — it is approaching the default 300-second aging timeout. If PC-D stays silent for another 29 seconds, its entry will be purged.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:2},{mac:MB,port:2,vlan:1,age:0},{mac:MC,port:3,vlan:1,age:188},{mac:MD,port:4,vlan:1,age:271,state:'expiring'}] },
      { srcPort:null, srcMac:'', dstMac:'', decision:null, learnMac:null,
        title:'DD:DD Expired — Removed from Table',
        detail:'DD:DD:DD:DD:DD:04 has not appeared as a source for 300 seconds. The switch purges the entry. It now has no idea which port leads to PC-D. The next frame destined for DD:DD will trigger flooding, exactly as if that MAC had never been learned.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:8},{mac:MB,port:2,vlan:1,age:6},{mac:MC,port:3,vlan:1,age:195}] },
      { srcPort:4, srcMac:MD, dstMac:MB, decision:{type:'unicast',port:2}, learnMac:MD,
        frameType:'unicast', title:'PC-D Re-Learned — Age Resets to 0',
        detail:'PC-D sends a frame. DD:DD is not in the table (expired), so the switch re-learns it on Port 4 with age 0. BB:BB is still cached on Port 2, so this is a direct unicast forward. If PC-D had moved ports during the silence, the switch would learn the new port number here.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:12},{mac:MB,port:2,vlan:1,age:10},{mac:MC,port:3,vlan:1,age:199},{mac:MD,port:4,vlan:1,age:0,state:'new'}] },
      { srcPort:3, srcMac:MC, dstMac:MA, decision:{type:'unicast',port:1}, learnMac:null,
        frameType:'unicast', title:'Traffic Refreshes CC:CC — Age Resets to 0',
        detail:'PC-C sends traffic, resetting CC:CC\'s age to 0. Any frame from a MAC already in the table refreshes that entry\'s age. Cisco IOS: "mac address-table aging-time 300". Too low causes excessive flooding; too high leaves stale entries that misdirect traffic after topology changes.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:16},{mac:MB,port:2,vlan:1,age:14},{mac:MC,port:3,vlan:1,age:0,state:'updated'},{mac:MD,port:4,vlan:1,age:4}] },
    ],
  },
  {
    name:'MAC Move', desc:'Watch the switch update its table when a device changes ports',
    steps:[
      { srcPort:2, srcMac:MB, dstMac:MA, decision:{type:'unicast',port:1}, learnMac:null,
        frameType:'unicast', title:'Normal — PC-B Active on Port 2',
        detail:'Everything is stable. PC-B is on Port 2. The switch forwards BB:BB traffic to Port 1 (PC-A) without flooding. The MAC table accurately reflects the physical topology.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:22},{mac:MB,port:2,vlan:1,age:0},{mac:MC,port:3,vlan:1,age:35},{mac:MD,port:4,vlan:1,age:51}] },
      { srcPort:null, srcMac:'', dstMac:'', decision:null, learnMac:null,
        title:'PC-B Unplugged from Port 2 — Moving to Port 3',
        detail:'A user physically moves the laptop from Port 2 to Port 3. The Port 2 link goes down. Port 3 now has two reachable devices (PC-C and PC-B). The MAC table still maps BB:BB to Port 2 — the switch does not know about the physical change yet.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:27},{mac:MB,port:2,vlan:1,age:5,state:'expiring'},{mac:MC,port:3,vlan:1,age:40},{mac:MD,port:4,vlan:1,age:56}] },
      { srcPort:3, srcMac:MB, dstMac:MA, decision:{type:'unicast',port:1}, learnMac:MB, isMove:true,
        frameType:'unicast', title:'MAC Move Detected — BB:BB Updated Port 2 → Port 3',
        detail:'PC-B\'s first frame after reconnecting arrives on Port 3. The switch sees BB:BB as the source, checks the table, and finds a conflict — same MAC, different port. This is a MAC move event. The switch immediately overwrites the entry. Frequent MAC moves often indicate a bridging loop or a MAC spoofing attack.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:32},{mac:MB,port:3,vlan:1,age:0,state:'updated'},{mac:MC,port:3,vlan:1,age:45},{mac:MD,port:4,vlan:1,age:61}] },
      { srcPort:1, srcMac:MA, dstMac:MB, decision:{type:'unicast',port:3}, learnMac:null,
        frameType:'unicast', title:'Traffic to PC-B Now Correctly Goes to Port 3',
        detail:'PC-A sends to PC-B. The switch looks up BB:BB and finds Port 3 (the updated entry). The frame goes to Port 3 where PC-B now lives. Port 2 receives nothing. The table has converged to reflect the new physical layout.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:0,state:'updated'},{mac:MB,port:3,vlan:1,age:5},{mac:MC,port:3,vlan:1,age:50},{mac:MD,port:4,vlan:1,age:66}] },
    ],
  },
];

interface MacLabProps { isDarkMode?: boolean; }

export const MacLab: React.FC<MacLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [scIdx, setScIdx] = useState(0);
  const [stIdx, setStIdx] = useState(0);
  const [dotT,  setDotT]  = useState(1);   // 1 = idle, 0→1 = animating
  const [autoPlay, setAutoPlay] = useState(false);
  const rafRef = useRef<number>(undefined);
  const t0Ref  = useRef(0);

  const sc  = SCENARIOS[scIdx];
  const cur = sc.steps[stIdx];

  // Called imperatively from Next / Play — NOT from useEffect
  function startAnim(step: MacStep) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (step.srcPort === null) { setDotT(1); return; }
    setDotT(0);
    t0Ref.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0Ref.current) / 1800, 1);
      setDotT(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // Unmount cleanup
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Auto-play: advance to next step once dot lands
  useEffect(() => {
    if (!autoPlay || dotT < 1) return;
    const id = setTimeout(() => {
      if (stIdx < sc.steps.length - 1) {
        const next = stIdx + 1;
        setStIdx(next);
        startAnim(sc.steps[next]);
      } else {
        setAutoPlay(false);
      }
    }, 600);
    return () => clearTimeout(id);
  }, [autoPlay, dotT, stIdx, sc.steps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeSc = (i: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setScIdx(i); setStIdx(0); setDotT(1); setAutoPlay(false);
  };
  const handlePrev = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDotT(1); setAutoPlay(false);
    setStIdx(s => Math.max(0, s - 1));
  };
  const handleNext = () => {
    const ni = Math.min(sc.steps.length - 1, stIdx + 1);
    setStIdx(ni);
    startAnim(sc.steps[ni]);
  };
  const handlePlay = () => {
    if (autoPlay) { setAutoPlay(false); return; }
    if (stIdx === sc.steps.length - 1) {
      setStIdx(0); setAutoPlay(true); startAnim(sc.steps[0]);
    } else {
      setAutoPlay(true); startAnim(sc.steps[stIdx]);
    }
  };
  const handlePill = (i: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDotT(1); setAutoPlay(false); setStIdx(i);
  };

  // --- Animation state ---
  // Three phases: ingress (0→0.45), dwell at switch (0.45→0.55), egress (0.55→1)
  const inP  = ease(Math.min(dotT / 0.45, 1));
  const egP  = ease(Math.max((dotT - 0.55) / 0.45, 0));
  const atSw = dotT >= 0.4 && dotT <= 0.65;
  const animating = dotT < 1;

  const src = cur.srcPort !== null ? LINKS[cur.srcPort - 1] : null;
  const d1x = src ? lerp(src.hx, src.px, inP) : 0;
  const d1y = src ? lerp(src.hy, src.py, inP) : 0;
  const showP1 = animating && src !== null && dotT < 0.56;
  const showP2 = animating && src !== null && dotT > 0.44;

  const egressPorts = cur.decision?.type === 'unicast' ? [cur.decision.port]
    : cur.decision?.type === 'flood' ? cur.decision.ports : [];

  const frameCol = cur.frameType === 'broadcast' ? '#f97316'
    : cur.decision?.type === 'flood' ? T.warning : T.accent;

  const stateColor = (s?: string) =>
    s === 'new' ? T.success : s === 'updated' ? T.warning : s === 'expiring' ? T.danger : T.textMuted;

  return (
    <div style={{ padding:'2rem', backgroundColor:T.cardBg, borderRadius:'12px', border:T.border, color:T.textPrimary, fontFamily:'system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:T.border }}>
        <h3 style={{ fontSize:'1.25rem', fontWeight:700, margin:'0 0 4px' }}>MAC Learning & Forwarding Table</h3>
        <p style={{ color:T.textSecondary, margin:0, fontSize:'0.875rem' }}>See how a switch builds its CAM table by inspecting source MACs and decides between flooding and unicast forwarding. Press Play or Next to animate.</p>
      </div>

      {/* Scenario tabs */}
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'1.25rem', alignItems:'center' }}>
        {SCENARIOS.map((s,i) => (
          <button key={i} onClick={() => changeSc(i)}
            style={{ padding:'6px 14px', borderRadius:'6px', border:`1px solid ${scIdx===i?T.accent:T.borderColor}`, backgroundColor:scIdx===i?T.accentSubtle:T.panelBg, color:scIdx===i?T.accent:T.textSecondary, fontWeight:600, fontSize:'0.78rem', cursor:'pointer' }}>
            {s.name}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:T.textMuted, fontStyle:'italic' }}>{sc.desc}</span>
      </div>

      {/* SVG topology + CAM table */}
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1rem' }}>

        {/* SVG */}
        <div style={{ flex:'1 1 360px', borderRadius:'12px', border:T.border, overflow:'hidden', backgroundColor: isDarkMode ? '#0d1117' : '#f0f6ff' }}>
          <svg viewBox="0 0 660 340" style={{ width:'100%', display:'block' }}>
            <defs>
              {/* Dot grid */}
              <pattern id="mlgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="11" cy="11" r="1" fill={isDarkMode ? '#21262d' : '#c8d8e8'} />
              </pattern>
              {/* Glow filter */}
              <filter id="mlglow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="mlglow-sm" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Background grid */}
            <rect width="660" height="340" fill="url(#mlgrid)" />

            {/* Active link glow behind cable */}
            {LINKS.map((lk, i) => {
              const isIngress = cur.srcPort === i+1 && showP1;
              const isEgress  = egressPorts.includes(i+1) && showP2;
              return (isIngress || isEgress) ? (
                <line key={`glow-${i}`} x1={lk.hx} y1={lk.hy} x2={lk.px} y2={lk.py}
                  stroke={isIngress ? T.accent : frameCol} strokeWidth={10} opacity={0.18}
                  strokeLinecap="round" filter="url(#mlglow-sm)" />
              ) : null;
            })}

            {/* Cables */}
            {LINKS.map((lk, i) => {
              const isActive = (cur.srcPort===i+1 && showP1) || (egressPorts.includes(i+1) && showP2);
              return (
                <line key={`cable-${i}`} x1={lk.hx} y1={lk.hy} x2={lk.px} y2={lk.py}
                  stroke={isActive ? PC[i] : (isDarkMode ? '#30363d' : '#b0bec5')}
                  strokeWidth={isActive ? 2.5 : 2} strokeLinecap="round"
                  opacity={isActive ? 1 : 0.6} />
              );
            })}

            {/* Host boxes */}
            {HOSTS.map(h => {
              const isSource  = cur.srcPort === h.id && animating;
              const isEgDest  = egressPorts.includes(h.id) && showP2;
              const portColor = PC[h.id - 1];
              return (
                <g key={h.id}>
                  {/* Glow when active */}
                  {(isSource || isEgDest) && (
                    <rect x={h.cx-68} y={h.cy-25} width={136} height={50} rx={10}
                      fill={isSource ? T.accent : frameCol} opacity={0.12} filter="url(#mlglow-sm)" />
                  )}
                  {/* Shadow */}
                  <rect x={h.cx-63} y={h.cy-18} width={130} height={46} rx={9}
                    fill="#000" opacity={isDarkMode?0.35:0.12} />
                  {/* Body */}
                  <rect x={h.cx-65} y={h.cy-22} width={130} height={46} rx={9}
                    fill={isDarkMode?'#161b22':'#ffffff'}
                    stroke={isSource?T.accent:isEgDest?frameCol:portColor}
                    strokeWidth={isSource||isEgDest?2.5:1.5} />
                  {/* Port colour strip */}
                  <rect x={h.cx-65} y={h.cy-22} width={130} height={6} rx={9}
                    fill={portColor} opacity={0.7} />
                  <rect x={h.cx-65} y={h.cy-16} width={130} height={4}
                    fill={portColor} opacity={0.7} />
                  {/* Label */}
                  <text x={h.cx} y={h.cy-2} textAnchor="middle" fill={T.textPrimary}
                    fontSize={11} fontWeight="700" fontFamily="system-ui,sans-serif">{h.label}</text>
                  <text x={h.cx} y={h.cy+14} textAnchor="middle" fill={T.textMuted}
                    fontSize={8.5} fontFamily="monospace">{shortMac(h.mac)}</text>
                </g>
              );
            })}

            {/* Switch shadow */}
            <rect x={SW.x+4} y={SW.y+4} width={SW.w} height={SW.h} rx={12} fill="#000" opacity={isDarkMode?0.4:0.15} />
            {/* Switch body */}
            <rect x={SW.x} y={SW.y} width={SW.w} height={SW.h} rx={12}
              fill={isDarkMode?'#1c2b3a':'#dbeafe'} stroke={T.accent} strokeWidth={2} />
            {/* Highlight strip */}
            <rect x={SW.x+2} y={SW.y+2} width={SW.w-4} height={18} rx={10}
              fill={isDarkMode?'#ffffff':'#ffffff'} opacity={isDarkMode?0.04:0.5} />
            {/* Switch flash on frame arrival */}
            {atSw && animating && (
              <rect x={SW.x+2} y={SW.y+2} width={SW.w-4} height={SW.h-4} rx={11}
                fill={cur.learnMac?T.success:frameCol} opacity={0.1} />
            )}
            {/* Port socket decorations */}
            {LINKS.map((_, i) => {
              const sx = i < 2 ? SW.x+44 + i*76 : SW.x+44 + (i-2)*76;
              const sy = i < 2 ? SW.y+22 : SW.y+48;
              return (
                <rect key={`sock-${i}`} x={sx-9} y={sy-5} width={18} height={10} rx={2}
                  fill={isDarkMode?'#0d1117':'#c8d8ef'} stroke={PC[i]} strokeWidth={1} opacity={0.8} />
              );
            })}
            {/* Switch label */}
            <text x={SW.x+SW.w/2} y={SW.y+SW.h/2+5} textAnchor="middle" fill={T.accent}
              fontSize={13} fontWeight="800" fontFamily="system-ui,sans-serif" letterSpacing="2">SWITCH</text>
            <text x={SW.x+SW.w/2} y={SW.y+SW.h-8} textAnchor="middle" fill={T.textMuted}
              fontSize={7} fontFamily="monospace">LAYER 2 — CAM TABLE FORWARDING</text>

            {/* Floating event label near switch */}
            {atSw && animating && cur.learnMac && (
              <g>
                <rect x={246} y={97} width={168} height={18} rx={4}
                  fill={cur.isMove?T.warning:T.success} opacity={0.92} />
                <text x={330} y={110} textAnchor="middle" fill="#fff"
                  fontSize={9} fontWeight="800" fontFamily="monospace">
                  {cur.isMove?'MAC MOVE':'LEARNED'}: {shortMac(cur.learnMac)} on Port {cur.srcPort}
                </text>
              </g>
            )}
            {atSw && animating && cur.decision?.type === 'flood' && (
              <g>
                <rect x={252} y={222} width={156} height={16} rx={4}
                  fill={frameCol} opacity={0.9} />
                <text x={330} y={234} textAnchor="middle"
                  fill={isDarkMode?'#0d1117':'#fff'}
                  fontSize={8.5} fontWeight="800" fontFamily="monospace">
                  FLOOD → PORT {cur.decision.ports.join(', ')}
                </text>
              </g>
            )}

            {/* Port circles on switch edges */}
            {LINKS.map((lk, i) => {
              const isActive = (cur.srcPort===i+1&&showP1)||(egressPorts.includes(i+1)&&showP2);
              return (
                <g key={`pc-${i}`}>
                  {isActive && <circle cx={lk.px} cy={lk.py} r={14} fill={PC[i]} opacity={0.2} filter="url(#mlglow-sm)" />}
                  <circle cx={lk.px} cy={lk.py} r={9}
                    fill={isDarkMode?'#1c2b3a':'#dbeafe'}
                    stroke={isActive?PC[i]:PC[i]} strokeWidth={isActive?2:1.5}
                    opacity={isActive?1:0.7} />
                  <text x={lk.px} y={lk.py} textAnchor="middle" dominantBaseline="central"
                    fill={PC[i]} fontSize={9} fontWeight="800" fontFamily="monospace">{i+1}</text>
                </g>
              );
            })}

            {/* Flood burst ring */}
            {showP2 && cur.decision?.type === 'flood' && egP < 0.25 && (
              <circle cx={SW.x+SW.w/2} cy={SW.y+SW.h/2}
                r={lerp(20, 60, egP/0.25)}
                fill="none" stroke={frameCol} strokeWidth={2}
                opacity={lerp(0.6, 0, egP/0.25)} />
            )}

            {/* Ingress dot */}
            {showP1 && (
              <g filter="url(#mlglow)">
                <circle cx={d1x} cy={d1y} r={16} fill={T.accent} opacity={0.07} />
                <circle cx={d1x} cy={d1y} r={10} fill={T.accent} opacity={0.18} />
                <circle cx={d1x} cy={d1y} r={6}  fill={T.accent} opacity={0.5}  />
                <circle cx={d1x} cy={d1y} r={3.5} fill={T.accent} />
              </g>
            )}

            {/* Egress dots */}
            {showP2 && egressPorts.map(p => {
              const lk = LINKS[p-1];
              const ex = lerp(lk.px, lk.hx, egP);
              const ey = lerp(lk.py, lk.hy, egP);
              return (
                <g key={p} filter="url(#mlglow)">
                  <circle cx={ex} cy={ey} r={16} fill={frameCol} opacity={0.07} />
                  <circle cx={ex} cy={ey} r={10} fill={frameCol} opacity={0.18} />
                  <circle cx={ex} cy={ey} r={6}  fill={frameCol} opacity={0.5}  />
                  <circle cx={ex} cy={ey} r={3.5} fill={frameCol} />
                </g>
              );
            })}

            {/* Status strip */}
            <rect x={0} y={320} width={660} height={20} fill={isDarkMode?'#161b22':'#e8f0fa'} opacity={0.85} />
            <circle cx={14} cy={330} r={4} fill={frameCol} />
            <text x={24} y={334} fill={T.textMuted} fontSize={9} fontFamily="monospace">
              {cur.frameType==='broadcast'?'BROADCAST — always flooded to all ports'
                :cur.decision?.type==='flood'?'UNKNOWN UNICAST — flooded to all ports except source'
                :cur.srcPort===null?'Table state change — no frame in transit'
                :'UNICAST — forwarded to one port only'}
            </text>
          </svg>
        </div>

        {/* CAM table */}
        <div style={{ flex:'0 0 288px', backgroundColor:T.panelBg, borderRadius:'12px', border:T.border, padding:'1rem', display:'flex', flexDirection:'column', gap:'6px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
            <div style={{ width:8, height:8, borderRadius:2, backgroundColor:T.accent }} />
            <span style={{ fontSize:'0.65rem', fontWeight:800, color:T.textMuted, letterSpacing:'0.08em' }}>CAM TABLE</span>
            <span style={{ marginLeft:'auto', fontSize:'0.6rem', color:T.textMuted, fontFamily:'monospace' }}>{cur.tableAfter.length}/16384 entries</span>
          </div>

          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 32px 44px', gap:'4px', fontSize:'0.6rem', fontWeight:700, color:T.textMuted, fontFamily:'monospace', padding:'4px 8px', backgroundColor:T.insetBg, borderRadius:'6px' }}>
            <span>P</span><span>MAC ADDRESS</span><span>VLAN</span><span>AGE</span>
          </div>

          {cur.tableAfter.length === 0 ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:T.textMuted, fontSize:'0.78rem', fontStyle:'italic', textAlign:'center', padding:'1rem' }}>
              Empty — switch has not seen any frames yet
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              {cur.tableAfter.map((e, i) => {
                const pCol = PC[e.port - 1];
                const sc2 = stateColor(e.state);
                const rowBg = e.state==='new'?`${T.success}14`:e.state==='updated'?`${T.warning}14`:e.state==='expiring'?`${T.danger}10`:(isDarkMode?'#161b22':'#f6f8fa');
                return (
                  <div key={i} style={{ borderRadius:'7px', overflow:'hidden', border:`1px solid ${e.state?sc2+'40':T.borderColor}`, backgroundColor:rowBg }}>
                    {/* Port colour accent bar */}
                    <div style={{ height:3, backgroundColor:pCol }} />
                    <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 32px 44px', gap:'4px', fontSize:'0.68rem', fontFamily:'monospace', padding:'5px 8px', alignItems:'center' }}>
                      {/* Port badge */}
                      <div style={{ width:20, height:20, borderRadius:'50%', backgroundColor:`${pCol}22`, border:`1.5px solid ${pCol}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:800, color:pCol }}>{e.port}</div>
                      <span style={{ color:e.state?sc2:T.textPrimary, fontWeight:e.state?700:400, wordBreak:'break-all', fontSize:'0.64rem' }}>{e.mac}</span>
                      <span style={{ color:T.textMuted, fontSize:'0.62rem' }}>{e.vlan}</span>
                      <span style={{ color:e.age>250?T.danger:e.age>150?T.warning:T.success, fontWeight:700 }}>{e.age}s</span>
                    </div>
                    {/* Age progress bar */}
                    <div style={{ height:2, backgroundColor:T.borderColor }}>
                      <div style={{ height:2, width:`${Math.min(e.age/300*100,100)}%`, backgroundColor:e.age>250?T.danger:e.age>150?T.warning:pCol, transition:'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop:'auto', paddingTop:'8px', borderTop:T.border, display:'flex', flexDirection:'column', gap:'4px' }}>
            {[{color:T.success,label:'Newly learned'},{color:T.warning,label:'Updated / MAC move'},{color:T.danger,label:'Expiring (>250 s)'}].map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.63rem', color:T.textMuted }}>
                <div style={{ width:8, height:8, borderRadius:2, backgroundColor:l.color, flexShrink:0 }} />
                {l.label}
              </div>
            ))}
            <div style={{ fontSize:'0.6rem', color:T.textMuted, marginTop:'4px', fontFamily:'monospace' }}>Age bar = % toward 300 s timeout</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem', flexWrap:'wrap' }}>
        <button onClick={handlePrev} disabled={stIdx===0}
          style={{ padding:'7px 16px', borderRadius:'7px', border:T.border, backgroundColor:T.panelBg, color:T.textPrimary, fontWeight:600, fontSize:'0.82rem', cursor:stIdx===0?'not-allowed':'pointer', opacity:stIdx===0?0.35:1 }}>← Prev</button>
        <button onClick={handlePlay}
          style={{ padding:'7px 22px', borderRadius:'7px', border:'none', backgroundColor:autoPlay?T.warning:T.accent, color:'#fff', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', minWidth:72 }}>
          {autoPlay?'Pause':stIdx===sc.steps.length-1?'Replay':'Play'}
        </button>
        <button onClick={handleNext} disabled={stIdx===sc.steps.length-1}
          style={{ padding:'7px 16px', borderRadius:'7px', border:T.border, backgroundColor:T.panelBg, color:T.textPrimary, fontWeight:600, fontSize:'0.82rem', cursor:stIdx===sc.steps.length-1?'not-allowed':'pointer', opacity:stIdx===sc.steps.length-1?0.35:1 }}>Next →</button>
        <div style={{ display:'flex', gap:5, marginLeft:'auto', alignItems:'center' }}>
          {sc.steps.map((_,i) => (
            <button key={i} onClick={() => handlePill(i)}
              style={{ width:11, height:11, borderRadius:'50%', border:`2px solid ${i===stIdx?frameCol:T.borderColor}`, cursor:'pointer', padding:0,
                backgroundColor:i===stIdx?frameCol:i<stIdx?`${frameCol}44`:'transparent', transition:'all 0.2s' }} />
          ))}
        </div>
      </div>

      {/* Detail panels */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
        <div style={{ backgroundColor:T.panelBg, borderRadius:'10px', padding:'1.1rem', border:T.border }}>
          <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap', marginBottom:'9px' }}>
            {cur.srcPort && <span style={{ fontSize:'0.63rem', fontWeight:800, color:PC[cur.srcPort-1], backgroundColor:`${PC[cur.srcPort-1]}18`, padding:'3px 9px', borderRadius:'10px' }}>PORT {cur.srcPort} INGRESS</span>}
            {cur.learnMac && <span style={{ fontSize:'0.63rem', fontWeight:800, color:T.success, backgroundColor:`${T.success}18`, padding:'3px 9px', borderRadius:'10px' }}>{cur.isMove?'MAC MOVE':'MAC LEARNED'}</span>}
            {cur.decision && <span style={{ fontSize:'0.63rem', fontWeight:800, padding:'3px 9px', borderRadius:'10px', color:cur.decision.type==='unicast'?T.accent:T.warning, backgroundColor:`${cur.decision.type==='unicast'?T.accent:T.warning}18` }}>
              {cur.decision.type==='unicast'?`FORWARD → PORT ${cur.decision.port}`:`FLOOD → ${cur.decision.ports.map(p=>`P${p}`).join(' ')}`}
            </span>}
          </div>
          <div style={{ fontSize:'0.9rem', fontWeight:700, color:T.textPrimary, marginBottom:'7px' }}>{cur.title}</div>
          <p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.65 }}>{cur.detail}</p>
        </div>

        {cur.srcPort !== null && (
          <div style={{ backgroundColor:T.termBg, borderRadius:'10px', padding:'1rem', border:`1px solid ${T.termBorder}` }}>
            <div style={{ fontSize:'0.62rem', fontFamily:'monospace', color:T.termMuted, fontWeight:700, borderBottom:`1px solid ${T.termBorder}`, paddingBottom:'6px', marginBottom:'9px', letterSpacing:'0.07em' }}>ETHERNET FRAME</div>
            {[
              { k:'Source MAC',      v:cur.srcMac, c:PC[(cur.srcPort||1)-1] },
              { k:'Destination MAC', v:cur.dstMac, c:cur.dstMac===BCAST?T.danger:T.termText },
              { k:'Frame Type',      v:cur.frameType==='broadcast'?'Broadcast':cur.decision?.type==='flood'?'Unknown Unicast':'Known Unicast', c:T.termText },
              { k:'Switch Action',   v:cur.decision?.type==='unicast'?`Forward → Port ${cur.decision.port}`:cur.decision?.type==='flood'?`Flood → Ports ${cur.decision.ports.join(', ')}`:'-', c:cur.decision?.type==='unicast'?T.success:T.warning },
            ].map(f => (
              <div key={f.k} style={{ display:'flex', gap:'8px', fontSize:'0.72rem', lineHeight:1.6, marginBottom:'3px' }}>
                <span style={{ color:T.termMuted, fontFamily:'monospace', flexShrink:0, minWidth:118 }}>{f.k}:</span>
                <span style={{ color:f.c, fontFamily:'monospace', wordBreak:'break-all' }}>{f.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theory */}
      <div style={{ borderTop:T.border, paddingTop:'1.1rem', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem' }}>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.accent }}>How switches learn</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>A switch only learns from source MACs on incoming frames — never from destination fields. Every received frame is a learning opportunity. The hardware TCAM does the lookup in O(1) time at wire speed, regardless of table size.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.warning }}>Three flood triggers</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>Flooding occurs for: (1) unknown unicast — destination not in table, (2) broadcast — FF:FF:FF:FF:FF:FF, (3) multicast — 01:xx:xx:xx:xx:xx unless IGMP snooping optimises it. VLAN membership constrains the flood domain.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.danger }}>CAM table overflow</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>An attacker can flood the switch with random source MACs to fill the CAM table. Once full, the switch falls back to hub behaviour — flooding all traffic. Port security (max MAC count per port) and 802.1X authentication mitigate this.</p>
        </div>
      </div>
    </div>
  );
};

export default MacLab;
