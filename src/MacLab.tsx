import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';

function ease(t: number) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function lerp(a: number, b: number, t: number) { return a+(b-a)*t; }
function shortMac(m: string) { return m.split(':').slice(0,2).join(':')+'…'; }

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

const SW = { x:232, y:122, w:196, h:76 };

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
        detail:'The full table is known. DD:DD maps to Port 4. The switch sends the frame to Port 4 exclusively. Ports 2 and 3 receive nothing. Compare this to a hub, which would duplicate the frame to every port regardless — the switch eliminates unnecessary traffic and gives each segment its full bandwidth.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:31},{mac:MB,port:2,vlan:1,age:47},{mac:MC,port:3,vlan:1,age:62},{mac:MD,port:4,vlan:1,age:88}] },
      { srcPort:2, srcMac:MB, dstMac:ME, decision:{type:'flood',ports:[1,3,4]}, learnMac:null,
        frameType:'flood', title:'PC-B → Unknown Host — Unknown Unicast Flood',
        detail:'PC-B sends to EE:EE:EE:EE:EE:05 — a MAC not in the table. This is "unknown unicast" flooding. The switch copies the frame to all ports except the source (Port 2). Note: the switch does NOT learn EE:EE as a destination. Switches only learn from source MACs on incoming frames, never from destination fields.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:35},{mac:MB,port:2,vlan:1,age:51},{mac:MC,port:3,vlan:1,age:66},{mac:MD,port:4,vlan:1,age:92}] },
      { srcPort:3, srcMac:MC, dstMac:BCAST, decision:{type:'flood',ports:[1,2,4]}, learnMac:null,
        frameType:'broadcast', title:'PC-C Sends Broadcast — Always Flooded by Design',
        detail:'A frame to FF:FF:FF:FF:FF:FF must reach every device on the segment. The switch always floods broadcasts — not because the destination is unknown, but because broadcasts are definitionally for everyone. ARP requests, DHCP discovers, and some routing protocol hellos use this mechanism.',
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
        detail:'DD:DD:DD:DD:DD:04 has not appeared as a source for 300 seconds. The switch purges the entry. It now has no idea which port leads to PC-D. The next frame destined for DD:DD will trigger flooding, exactly as if that MAC had never been learned. Aging is what keeps stale state from accumulating indefinitely.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:8},{mac:MB,port:2,vlan:1,age:6},{mac:MC,port:3,vlan:1,age:195}] },
      { srcPort:4, srcMac:MD, dstMac:MB, decision:{type:'unicast',port:2}, learnMac:MD,
        frameType:'unicast', title:'PC-D Re-Learned — Age Resets to 0',
        detail:'PC-D sends a frame. DD:DD is not in the table (it expired), so the switch re-learns it on Port 4, age 0. BB:BB is still cached on Port 2, so this is a direct unicast forward. If PC-D had physically moved to a different port during the silence, the switch would learn the new port number here — aging is the mechanism that allows MAC moves to self-heal.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:12},{mac:MB,port:2,vlan:1,age:10},{mac:MC,port:3,vlan:1,age:199},{mac:MD,port:4,vlan:1,age:0,state:'new'}] },
      { srcPort:3, srcMac:MC, dstMac:MA, decision:{type:'unicast',port:1}, learnMac:null,
        frameType:'unicast', title:'Traffic Refreshes CC:CC — Age Resets to 0',
        detail:'PC-C sends traffic, resetting the CC:CC age to 0. Any frame received from a MAC already in the table refreshes that entry\'s age. The aging timer is configurable on most switches — Cisco IOS: "mac address-table aging-time 300". Setting it too low causes excessive flooding; too high leaves stale entries that misdirect traffic after topology changes.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:16},{mac:MB,port:2,vlan:1,age:14},{mac:MC,port:3,vlan:1,age:0,state:'updated'},{mac:MD,port:4,vlan:1,age:4}] },
    ],
  },
  {
    name:'MAC Move', desc:'Watch the switch update its table when a device changes ports',
    steps:[
      { srcPort:2, srcMac:MB, dstMac:MA, decision:{type:'unicast',port:1}, learnMac:null,
        frameType:'unicast', title:'Normal — PC-B Active on Port 2',
        detail:'Everything is stable. PC-B is connected to Port 2. The switch forwards BB:BB traffic to Port 1 (PC-A) without any flooding. The MAC table is accurate and consistent with the physical topology.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:22},{mac:MB,port:2,vlan:1,age:0},{mac:MC,port:3,vlan:1,age:35},{mac:MD,port:4,vlan:1,age:51}] },
      { srcPort:null, srcMac:'', dstMac:'', decision:null, learnMac:null,
        title:'PC-B Unplugged from Port 2 — Moving to Port 3',
        detail:'A user physically moves the laptop from the Port 2 socket to the Port 3 socket. The Port 2 link goes down. Port 3 now has two devices reachable (PC-C and PC-B). The MAC table still maps BB:BB to Port 2 — the switch does not know about the physical change yet. The entry sits there, aging, pointing to the wrong port.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:27},{mac:MB,port:2,vlan:1,age:5,state:'expiring'},{mac:MC,port:3,vlan:1,age:40},{mac:MD,port:4,vlan:1,age:56}] },
      { srcPort:3, srcMac:MB, dstMac:MA, decision:{type:'unicast',port:1}, learnMac:MB, isMove:true,
        frameType:'unicast', title:'MAC Move Detected — BB:BB Updated Port 2 → Port 3',
        detail:'PC-B\'s first frame after reconnecting arrives on Port 3. The switch sees BB:BB as the source, checks the table, and finds a conflict — same MAC, different port. This is a MAC move event. The switch immediately overwrites the entry: BB:BB is now on Port 3. Switches log MAC moves; frequent moves on the same MAC often indicate a bridging loop or an active MAC spoofing attack.',
        tableAfter:[{mac:MA,port:1,vlan:1,age:32},{mac:MB,port:3,vlan:1,age:0,state:'updated'},{mac:MC,port:3,vlan:1,age:45},{mac:MD,port:4,vlan:1,age:61}] },
      { srcPort:1, srcMac:MA, dstMac:MB, decision:{type:'unicast',port:3}, learnMac:null,
        frameType:'unicast', title:'Traffic to PC-B Correctly Reaches Port 3',
        detail:'PC-A sends to PC-B. The switch looks up BB:BB and finds Port 3 (the updated entry). The frame goes to Port 3, where PC-B now lives. Port 2 receives nothing. The table has converged to match reality. Note that both BB:BB and CC:CC are now on Port 3 — the switch handles this fine, it just means two devices share that link (typical when a downstream hub or unmanaged switch is involved).',
        tableAfter:[{mac:MA,port:1,vlan:1,age:0,state:'updated'},{mac:MB,port:3,vlan:1,age:5},{mac:MC,port:3,vlan:1,age:50},{mac:MD,port:4,vlan:1,age:66}] },
    ],
  },
];

interface MacLabProps { isDarkMode?: boolean; }

export const MacLab: React.FC<MacLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [scIdx, setScIdx] = useState(0);
  const [stIdx, setStIdx] = useState(0);
  const [dotT, setDotT] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);
  const t0Ref = useRef(0);

  const sc  = SCENARIOS[scIdx];
  const cur = sc.steps[stIdx];

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (cur.srcPort === null) { setDotT(1); return; }
    setDotT(0);
    t0Ref.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0Ref.current) / 750, 1);
      setDotT(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [stIdx, scIdx]);

  useEffect(() => {
    if (!autoPlay || dotT < 1) return;
    const id = setTimeout(() => {
      if (stIdx < sc.steps.length - 1) setStIdx(s => s + 1);
      else setAutoPlay(false);
    }, 700);
    return () => clearTimeout(id);
  }, [autoPlay, dotT, stIdx, sc.steps.length]);

  const changeSc = (i: number) => { setScIdx(i); setStIdx(0); setAutoPlay(false); };
  const prev = () => { setStIdx(s => Math.max(0, s-1)); setAutoPlay(false); };
  const next = () => setStIdx(s => Math.min(sc.steps.length-1, s+1));

  const frameCol = cur.frameType === 'broadcast' ? '#f97316'
    : cur.decision?.type === 'flood' ? T.warning : T.accent;

  const p1 = ease(Math.min(dotT * 2, 1));
  const p2 = ease(Math.max((dotT - 0.5) * 2, 0));
  const atSwitch = dotT >= 0.5;
  const src = cur.srcPort !== null ? LINKS[cur.srcPort - 1] : null;
  const d1x = src ? lerp(src.hx, src.px, p1) : 0;
  const d1y = src ? lerp(src.hy, src.py, p1) : 0;
  const showP1 = src !== null && dotT < 0.52;
  const showP2 = src !== null && dotT > 0.48;
  const egressPorts = cur.decision?.type === 'unicast' ? [cur.decision.port]
    : cur.decision?.type === 'flood' ? cur.decision.ports : [];

  const stateColor = (s?: string) =>
    s === 'new' ? T.success : s === 'updated' ? T.warning : s === 'expiring' ? T.danger : T.textSecondary;

  return (
    <div style={{ padding:'2rem', backgroundColor:T.cardBg, borderRadius:'12px', border:T.border, color:T.textPrimary, fontFamily:'system-ui,sans-serif' }}>

      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:T.border }}>
        <h3 style={{ fontSize:'1.25rem', fontWeight:700, margin:'0 0 4px' }}>MAC Learning & Forwarding Table</h3>
        <p style={{ color:T.textSecondary, margin:0, fontSize:'0.875rem' }}>See how a switch builds its CAM table by inspecting source MACs and how it decides between flooding and unicast forwarding.</p>
      </div>

      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'1.25rem', alignItems:'center' }}>
        {SCENARIOS.map((s,i) => (
          <button key={i} onClick={() => changeSc(i)}
            style={{ padding:'6px 14px', borderRadius:'6px', border:`1px solid ${scIdx===i?T.accent:T.borderColor}`, backgroundColor:scIdx===i?T.accentSubtle:T.panelBg, color:scIdx===i?T.accent:T.textSecondary, fontWeight:600, fontSize:'0.78rem', cursor:'pointer' }}>
            {s.name}
          </button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:'0.75rem', color:T.textMuted, fontStyle:'italic' }}>{sc.desc}</span>
      </div>

      {/* SVG + MAC table */}
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1rem' }}>

        <div style={{ flex:'1 1 360px', backgroundColor:T.insetBg, borderRadius:'10px', border:T.border, overflow:'hidden' }}>
          <svg viewBox="0 0 660 340" style={{ width:'100%', display:'block' }}>

            {/* Links */}
            {LINKS.map((lk,i) => (
              <line key={i} x1={lk.hx} y1={lk.hy} x2={lk.px} y2={lk.py}
                stroke={T.borderColor} strokeWidth={2} opacity={0.55} />
            ))}

            {/* Host boxes */}
            {HOSTS.map(h => {
              const active = cur.srcPort === h.id;
              const isEgress = egressPorts.includes(h.id) && showP2;
              const borderCol = active ? T.accent : isEgress ? frameCol : T.borderColor;
              return (
                <g key={h.id}>
                  <rect x={h.cx-65} y={h.cy-22} width={130} height={44} rx={7}
                    fill={isDarkMode?'#161b22':'#ffffff'}
                    stroke={borderCol} strokeWidth={active||isEgress?2:1} />
                  <text x={h.cx} y={h.cy-5} textAnchor="middle" fill={T.textPrimary}
                    fontSize={11} fontWeight="700" fontFamily="system-ui,sans-serif">{h.label}</text>
                  <text x={h.cx} y={h.cy+10} textAnchor="middle" fill={T.textMuted}
                    fontSize={9} fontFamily="monospace">{shortMac(h.mac)}</text>
                </g>
              );
            })}

            {/* Switch */}
            <rect x={SW.x} y={SW.y} width={SW.w} height={SW.h} rx={8}
              fill={isDarkMode?'#1a2332':'#e8f0fe'} stroke={T.accent} strokeWidth={1.5} />
            {cur.learnMac && atSwitch && dotT < 0.85 && (
              <rect x={SW.x+2} y={SW.y+2} width={SW.w-4} height={SW.h-4} rx={7}
                fill={T.success} opacity={0.1} />
            )}
            <text x={330} y={SW.y+SW.h/2+5} textAnchor="middle" fill={T.accent}
              fontSize={12} fontWeight="800" fontFamily="system-ui,sans-serif">SWITCH</text>

            {/* Port circles */}
            {LINKS.map((lk,i) => (
              <g key={`pc-${i}`}>
                <circle cx={lk.px} cy={lk.py} r={8}
                  fill={isDarkMode?'#1a2332':'#e8f0fe'} stroke={T.accent} strokeWidth={1.5} />
                <text x={lk.px} y={lk.py} textAnchor="middle" dominantBaseline="central"
                  fill={T.accent} fontSize={8} fontWeight="800" fontFamily="monospace">{i+1}</text>
              </g>
            ))}

            {/* Phase 1 dot (ingress) */}
            {showP1 && (
              <>
                <circle cx={d1x} cy={d1y} r={9} fill={frameCol} opacity={0.12} />
                <circle cx={d1x} cy={d1y} r={5} fill={frameCol} opacity={0.38} />
                <circle cx={d1x} cy={d1y} r={3} fill={frameCol} />
              </>
            )}

            {/* Phase 2 dots (egress) */}
            {showP2 && egressPorts.map(p => {
              const lk = LINKS[p-1];
              const ex = lerp(lk.px, lk.hx, p2);
              const ey = lerp(lk.py, lk.hy, p2);
              return (
                <g key={p}>
                  <circle cx={ex} cy={ey} r={9} fill={frameCol} opacity={0.12} />
                  <circle cx={ex} cy={ey} r={5} fill={frameCol} opacity={0.38} />
                  <circle cx={ex} cy={ey} r={3} fill={frameCol} />
                </g>
              );
            })}

            {/* Legend */}
            <rect x={8} y={318} width={220} height={16} rx={3} fill={T.termBg} opacity={0.75} />
            <circle cx={20} cy={326} r={4} fill={frameCol} />
            <text x={29} y={330} fill={T.termMuted} fontSize={9} fontFamily="monospace">
              {cur.frameType==='broadcast'?'BROADCAST — always flood'
                :cur.decision?.type==='flood'?'UNKNOWN UNICAST — flood all ports'
                :cur.srcPort===null?'No frame — table state change'
                :'UNICAST — direct forward only'}
            </text>
          </svg>
        </div>

        {/* CAM table */}
        <div style={{ flex:'0 0 270px', backgroundColor:T.panelBg, borderRadius:'10px', border:T.border, padding:'1rem', display:'flex', flexDirection:'column', gap:'7px' }}>
          <div style={{ fontSize:'0.65rem', fontWeight:800, color:T.textMuted, letterSpacing:'0.07em' }}>CAM TABLE (MAC FORWARDING TABLE)</div>
          <div style={{ display:'grid', gridTemplateColumns:'32px 1fr 36px 38px', gap:'3px', fontSize:'0.62rem', fontWeight:700, color:T.textMuted, fontFamily:'monospace', paddingBottom:'5px', borderBottom:T.border }}>
            <span>PORT</span><span>MAC ADDRESS</span><span>VLAN</span><span>AGE</span>
          </div>
          {cur.tableAfter.length === 0 ? (
            <div style={{ fontSize:'0.78rem', color:T.textMuted, textAlign:'center', padding:'1.5rem 0', fontStyle:'italic' }}>
              Empty — no MACs learned yet
            </div>
          ) : cur.tableAfter.map((e,i) => {
            const rowBg = e.state==='new'?`${T.success}18`:e.state==='updated'?`${T.warning}18`:e.state==='expiring'?`${T.danger}12`:'transparent';
            const tc = e.state ? stateColor(e.state) : T.textPrimary;
            return (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'32px 1fr 36px 38px', gap:'3px', fontSize:'0.68rem', fontFamily:'monospace', padding:'4px 5px', borderRadius:'5px', backgroundColor:rowBg, border:`1px solid ${e.state?stateColor(e.state)+'38':'transparent'}` }}>
                <span style={{ color:T.accent, fontWeight:700 }}>{e.port}</span>
                <span style={{ color:tc, fontWeight:e.state?700:400, wordBreak:'break-all' }}>{e.mac}</span>
                <span style={{ color:T.textMuted }}>{e.vlan}</span>
                <span style={{ color:e.age>270?T.danger:e.age>200?T.warning:T.textMuted }}>{e.age}s</span>
              </div>
            );
          })}
          <div style={{ marginTop:'auto', paddingTop:'8px', borderTop:T.border, display:'flex', flexDirection:'column', gap:'3px' }}>
            {([{color:T.success,label:'Newly learned'},{color:T.warning,label:'Updated / MAC move'},{color:T.danger,label:'Expiring / expired'}] as const).map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.65rem', color:T.textMuted }}>
                <div style={{ width:8, height:8, borderRadius:2, backgroundColor:l.color, opacity:0.7 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem', flexWrap:'wrap' }}>
        <button onClick={prev} disabled={stIdx===0}
          style={{ padding:'6px 14px', borderRadius:'6px', border:T.border, backgroundColor:T.panelBg, color:T.textPrimary, fontWeight:600, fontSize:'0.8rem', cursor:stIdx===0?'not-allowed':'pointer', opacity:stIdx===0?0.4:1 }}>Prev</button>
        <button onClick={() => { if(stIdx===sc.steps.length-1){setStIdx(0);setAutoPlay(true);}else setAutoPlay(a=>!a); }}
          style={{ padding:'6px 18px', borderRadius:'6px', border:'none', backgroundColor:autoPlay?T.warning:T.accent, color:'#fff', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>
          {autoPlay?'Pause':stIdx===sc.steps.length-1?'Replay':'Play'}
        </button>
        <button onClick={next} disabled={stIdx===sc.steps.length-1}
          style={{ padding:'6px 14px', borderRadius:'6px', border:T.border, backgroundColor:T.panelBg, color:T.textPrimary, fontWeight:600, fontSize:'0.8rem', cursor:stIdx===sc.steps.length-1?'not-allowed':'pointer', opacity:stIdx===sc.steps.length-1?0.4:1 }}>Next</button>
        <div style={{ display:'flex', gap:4, marginLeft:'auto', flexWrap:'wrap' }}>
          {sc.steps.map((_,i) => (
            <button key={i} onClick={() => { setStIdx(i); setAutoPlay(false); }}
              style={{ width:10, height:10, borderRadius:'50%', border:'none', cursor:'pointer', padding:0,
                backgroundColor:i===stIdx?frameCol:i<stIdx?`${frameCol}55`:T.borderColor, transition:'background-color 0.15s' }} />
          ))}
        </div>
      </div>

      {/* Detail panels */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem', marginBottom:'1.25rem' }}>
        <div style={{ backgroundColor:T.panelBg, borderRadius:'8px', padding:'1.1rem', border:T.border }}>
          <div style={{ display:'flex', gap:'7px', alignItems:'center', flexWrap:'wrap', marginBottom:'8px' }}>
            {cur.srcPort && (
              <span style={{ fontSize:'0.65rem', fontWeight:800, color:T.accent, backgroundColor:T.accentSubtle, padding:'2px 8px', borderRadius:'10px' }}>PORT {cur.srcPort} INGRESS</span>
            )}
            {cur.learnMac && (
              <span style={{ fontSize:'0.65rem', fontWeight:800, color:T.success, backgroundColor:`${T.success}20`, padding:'2px 8px', borderRadius:'10px' }}>
                {cur.isMove?'MAC MOVE':'MAC LEARNED'}
              </span>
            )}
            {cur.decision && (
              <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:'10px',
                color:cur.decision.type==='unicast'?T.accent:T.warning,
                backgroundColor:`${cur.decision.type==='unicast'?T.accent:T.warning}18` }}>
                {cur.decision.type==='unicast'?`FORWARD → PORT ${cur.decision.port}`:`FLOOD → ${cur.decision.ports.map(p=>`P${p}`).join(', ')}`}
              </span>
            )}
          </div>
          <div style={{ fontSize:'0.9rem', fontWeight:700, color:T.textPrimary, marginBottom:'6px' }}>{cur.title}</div>
          <p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.65 }}>{cur.detail}</p>
        </div>

        {cur.srcPort !== null && (
          <div style={{ backgroundColor:T.termBg, borderRadius:'8px', padding:'1rem', border:`1px solid ${T.termBorder}` }}>
            <div style={{ fontSize:'0.65rem', fontFamily:'monospace', color:T.termMuted, fontWeight:700, borderBottom:`1px solid ${T.termBorder}`, paddingBottom:'5px', marginBottom:'8px', letterSpacing:'0.06em' }}>ETHERNET FRAME</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              {[
                { k:'Source MAC',      v:cur.srcMac,  c:T.accent },
                { k:'Destination MAC', v:cur.dstMac,  c:cur.dstMac===BCAST?T.danger:T.termText },
                { k:'Frame Type',      v:cur.frameType==='broadcast'?'Broadcast':cur.decision?.type==='flood'?'Unknown Unicast':'Unicast', c:T.termText },
                { k:'Switch Action',   v:cur.decision?.type==='unicast'?`Forward → Port ${cur.decision.port}`:cur.decision?.type==='flood'?`Flood → Ports ${cur.decision.ports.join(',')}`:'-', c:cur.decision?.type==='unicast'?T.success:T.warning },
              ].map(f => (
                <div key={f.k} style={{ display:'flex', gap:'8px', fontSize:'0.73rem', lineHeight:1.5 }}>
                  <span style={{ color:T.termMuted, fontFamily:'monospace', flexShrink:0, minWidth:120 }}>{f.k}:</span>
                  <span style={{ color:f.c, fontFamily:'monospace', wordBreak:'break-all' }}>{f.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theory */}
      <div style={{ borderTop:T.border, paddingTop:'1.1rem', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem' }}>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.accent }}>How switches learn</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>A switch only learns from source MACs on incoming frames — never from destination fields. Every received frame is a learning opportunity. The hardware TCAM (ternary content-addressable memory) does the lookup in O(1) time at wire speed, regardless of table size.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.warning }}>Three flood triggers</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>Flooding occurs for: (1) unknown unicast — destination not in table, (2) broadcast — FF:FF:FF:FF:FF:FF destination, (3) multicast — 01:xx:xx:xx:xx:xx destination unless IGMP snooping optimises it. VLAN membership constrains the flood domain — a frame in VLAN 10 only floods ports also in VLAN 10.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.danger }}>CAM table overflow attack</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>An attacker can flood the switch with frames using random source MACs to fill the CAM table. Once full, the switch falls back to hub behaviour — flooding all traffic to all ports, exposing every conversation. Port security (max MAC count per port) and 802.1X authentication mitigate this.</p>
        </div>
      </div>
    </div>
  );
};

export default MacLab;
