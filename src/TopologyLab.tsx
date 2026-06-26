import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

interface TopologyLabProps { isDarkMode?: boolean; }
type TopologyType = 'star' | 'mesh' | 'ring' | 'bus' | 'hybrid' | 'spineLeaf';

const TOPOLOGIES: Record<TopologyType, { name: string; tab: string; icon: string; color: string; desc: string; vulnerability: string }> = {
  star:      { name:'Star',            tab:'Star',       icon:'⭐', color:'#4493f8', desc:'All devices connect to a central switch. The most common design in modern LANs — easy to manage and isolate faults.',                                                                       vulnerability:'If the central switch fails, the entire segment goes down. Individual host failures only affect that one device.' },
  mesh:      { name:'Full Mesh',       tab:'Full Mesh',  icon:'🕸️', color:'#a855f7', desc:'Every device has a direct link to every other device. Extremely resilient — used in core network backbones.',                                                                               vulnerability:'No single point of failure. However, the number of links grows exponentially: n(n−1)/2 — 10 nodes = 45 links.' },
  ring:      { name:'Ring',            tab:'Ring',       icon:'🔵', color:'#3fb950', desc:'Devices form a closed loop, each connected to its two neighbours. Data travels in one direction around the ring.',                                                                           vulnerability:'A single link break halts all traffic unless a dual-ring failover (e.g. FDDI) is in place.' },
  bus:       { name:'Bus',             tab:'Bus',        icon:'📡', color:'#d29922', desc:'All devices share one backbone cable. A legacy design from early Ethernet (10BASE2 / 10BASE5) that is rarely used today.',                                                                  vulnerability:'A fault or missing 50 Ω terminator on the backbone causes signal reflection and total network collapse.' },
  hybrid:    { name:'Star-Bus Hybrid', tab:'Hybrid',     icon:'🔗', color:'#f78166', desc:'Multiple star clusters connected via a backbone bus. Common in campus networks built in stages across separate buildings.',                                                                  vulnerability:'A local switch failure isolates one cluster. A backbone failure disconnects all clusters from each other.' },
  spineLeaf: { name:'Spine-Leaf',      tab:'Spine-Leaf', icon:'🌿', color:'#58a6ff', desc:'A modern data centre fabric. Every leaf switch connects to every spine switch, enabling predictable low-latency east-west traffic.',                                                         vulnerability:'Losing one spine reduces total bandwidth by 50%, but no paths are fully cut — all leaf-to-leaf routes remain reachable.' },
};

// Node positions for viewBox "0 0 720 300"
const POS: Record<string, {cx:number;cy:number}> = {
  'star-1':{cx:145,cy:67},  'star-2':{cx:575,cy:67},  'star-3':{cx:575,cy:233}, 'star-4':{cx:145,cy:233}, 'star-5':{cx:360,cy:150},
  'mesh-1':{cx:360,cy:52},  'mesh-2':{cx:562,cy:150}, 'mesh-3':{cx:360,cy:238}, 'mesh-4':{cx:158,cy:150},
  'ring-1':{cx:360,cy:52},  'ring-2':{cx:562,cy:150}, 'ring-3':{cx:360,cy:238}, 'ring-4':{cx:158,cy:150},
  'bus-1':{cx:140,cy:62},   'bus-2':{cx:310,cy:62},   'bus-3':{cx:410,cy:238},  'bus-4':{cx:580,cy:238},
  'hybrid-1':{cx:195,cy:90},  'hybrid-2':{cx:525,cy:90},  'hybrid-3':{cx:110,cy:218}, 'hybrid-4':{cx:278,cy:218}, 'hybrid-5':{cx:445,cy:218}, 'hybrid-6':{cx:613,cy:218},
  'spineLeaf-1':{cx:255,cy:72}, 'spineLeaf-2':{cx:465,cy:72}, 'spineLeaf-3':{cx:145,cy:225}, 'spineLeaf-4':{cx:360,cy:225}, 'spineLeaf-5':{cx:575,cy:225},
};

const TOPO_NODES: Record<TopologyType, number[]> = {
  star:[1,2,3,4,5], mesh:[1,2,3,4], ring:[1,2,3,4], bus:[1,2,3,4],
  hybrid:[1,2,3,4,5,6], spineLeaf:[1,2,3,4,5],
};

const TOPO_EDU: EduCard[] = [
  { type:'exam', title:'Comparing Topologies: Fault Tolerance vs. Cost',
    body:'Star is cheapest and easiest to manage but has a SPOF at the switch. Full mesh eliminates SPOFs but link count scales as n(n−1)/2 — for 10 nodes that\'s 45 links. Spine-leaf and partial mesh are real-world compromises that balance resilience against cabling cost and switch port count.' },
  { type:'realworld', title:'Spine-Leaf in Modern Data Centres',
    body:'AWS, Azure, and GCP all run spine-leaf fabrics. Leaf switches connect to servers and the top-of-rack gear; spines connect only to leaves — no server-to-server traffic crosses a spine. Any server reaches any other server in exactly 2 hops (leaf → spine → leaf), giving sub-millisecond, predictable east-west latency critical for containerised workloads and microservices.' },
  { type:'exam', title:'Ring Topology and Token Passing (IEEE 802.5 / FDDI)',
    body:'Token Ring (IEEE 802.5) used token passing so only the station holding the token could transmit. FDDI used a dual counter-rotating ring that could self-heal — if a segment broke, the ring "wrapped" on itself to maintain connectivity. Both technologies are entirely obsolete; the dual-ring concept lives on in SONET/SDH protection switching.' },
  { type:'gotcha', title:'Bus Topology: 50 Ω Termination is Non-Negotiable',
    body:'10BASE5 (Thicknet) and 10BASE2 (Thinnet) required a 50 Ω terminator at both ends of the coax backbone. A missing, loose, or wrong-value terminator caused reflections that collided with live frames and destroyed all traffic on the segment. A single loose BNC connector could take down the entire floor. This fragility is why bus topology was abandoned as soon as structured cabling became affordable.' },
  { type:'config', title:'Physical vs. Logical Topology',
    body:'Physical topology = how cables actually run. Logical topology = how data actually flows. Modern LANs are physically a star (all runs to a switch) but logically a broadcast domain per VLAN — behaving like the old shared bus.',
    code:`# Physical star — all cables run to one switch:
Switch port 1 ─── Host A
Switch port 2 ─── Host B
Switch port 3 ─── Host C

# Logical topology per VLAN: broadcast domain
# FF:FF:FF:FF:FF:FF floods every port in the VLAN
# → logical bus behaviour on a physical star

# A VLAN creates a separate logical network
# Multiple VLANs = multiple logical topologies
# on one physical star infrastructure` },
];

export const TopologyLab: React.FC<TopologyLabProps> = ({ isDarkMode = true }) => {
  const [active,      setActive]      = useState<TopologyType>('star');
  const [brokenNode,  setBrokenNode]  = useState<number | null>(null);
  const [simStatus,   setSimStatus]   = useState<string>('');
  const [simming,     setSimming]     = useState(false);
  const [progress,    setProgress]    = useState(0);
  const T = getLabTheme(isDarkMode);

  useEffect(() => {
    if (!simming) { setProgress(0); return; }
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setSimming(false); evalResult(); return 100; }
        return p + 4;
      });
    }, 40);
    return () => clearInterval(iv);
  }, [simming]);

  const evalResult = () => {
    if (brokenNode === null) { setSimStatus('Success — 64 bytes received. All paths verified. Latency < 1 ms.'); return; }
    switch (active) {
      case 'star':
        setSimStatus(brokenNode === 5
          ? 'Critical failure — core switch is down. 100% packet loss across the entire segment.'
          : `Partial loss — H${brokenNode} is unreachable, but the switch forwarded successfully to all other active hosts.`); break;
      case 'mesh':
        setSimStatus(`Rerouted — direct path to H${brokenNode} failed, but the full mesh found an alternate route automatically.`); break;
      case 'ring':
        setSimStatus('Ring broken — token loop interrupted. All traffic halts until the break is repaired or a wrap occurs.'); break;
      case 'bus':
        setSimStatus('Backbone fault — signal reflections caused collisions. Complete network outage on this segment.'); break;
      case 'hybrid':
        setSimStatus(brokenNode === 1 || brokenNode === 2
          ? `SW${brokenNode} failed — its cluster is isolated, but the other cluster continues normally.`
          : `H${brokenNode} disconnected. The rest of the hybrid topology is unaffected.`); break;
      case 'spineLeaf':
        setSimStatus(brokenNode <= 2
          ? `Spine ${brokenNode === 1 ? 'A' : 'B'} offline — bandwidth reduced 50%, but all leaf nodes remain fully interconnected.`
          : `LF${brokenNode-2} offline — devices on that rack are isolated. All other leaves unaffected.`); break;
    }
  };

  const runTest = () => { if (simming) return; setSimming(true); setSimStatus('Sending ICMP echo request…'); };

  const G = (id: number) => POS[`${active}-${id}`] ?? {cx:0, cy:0};

  const nodeRole = (id: number): {short:string; full:string; color:string; r:number} => {
    if (active === 'star' && id === 5) return {short:'SW',  full:'Core Switch', color:'#a855f7', r:28};
    if (active === 'hybrid' && id <= 2) return {short:`SW${id}`, full:`Switch ${id}`, color:'#a855f7', r:26};
    if (active === 'spineLeaf' && id <= 2) return {short:`SP${id===1?'A':'B'}`, full:`Spine ${id===1?'A':'B'}`, color:'#3fb950', r:25};
    if (active === 'spineLeaf') return {short:`LF${id-2}`, full:`Leaf ${id-2}`, color:'#d29922', r:22};
    return {short:`H${id}`, full:`Host ${id}`, color:T.accent, r:21};
  };

  const isBroken = (a: number, b: number) => brokenNode === a || brokenNode === b;

  const lerpPt = (x1:number, y1:number, x2:number, y2:number) => ({
    x: x1+(x2-x1)*(progress/100), y: y1+(y2-y1)*(progress/100),
  });

  const getLinks = () => {
    switch(active) {
      case 'star':      return [1,2,3,4].map(id => ({a:id, b:5}));
      case 'ring':      return [1,2,3,4].map(id => ({a:id, b:id===4?1:id+1}));
      case 'mesh':      { const L:{a:number;b:number}[]=[]; for(let i=1;i<=4;i++) for(let j=i+1;j<=4;j++) L.push({a:i,b:j}); return L; }
      case 'hybrid':    return [{a:1,b:2},{a:1,b:3},{a:1,b:4},{a:2,b:5},{a:2,b:6}];
      case 'spineLeaf': { const L:{a:number;b:number}[]=[]; for(let sp=1;sp<=2;sp++) for(let lf=3;lf<=5;lf++) L.push({a:sp,b:lf}); return L; }
      default: return [];
    }
  };

  const toggle = (id: number) => setBrokenNode(n => n === id ? null : id);

  const topo    = TOPOLOGIES[active];
  const bg      = isDarkMode ? '#0d1117' : '#f6f8fa';
  const dimLine = isDarkMode ? '#30363d' : '#d1d5da';
  const brokenLabel = brokenNode === null ? null
    : active === 'star' && brokenNode === 5 ? 'SW (Core Switch)'
    : active === 'hybrid' && brokenNode <= 2 ? `SW${brokenNode}`
    : active === 'spineLeaf' && brokenNode <= 2 ? `Spine ${brokenNode===1?'A':'B'}`
    : active === 'spineLeaf' ? `Leaf ${brokenNode-2}`
    : `H${brokenNode}`;

  const simColor = simStatus.startsWith('Success') ? '#3fb950'
    : simStatus.startsWith('Sending') ? T.warning
    : simStatus ? '#f85149' : (isDarkMode?'#6e7681':'#6e7781');

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`@keyframes topo-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${T.cardBg} 0%,${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#4493f8,#a855f7,#3fb950,#d29922)' }}/>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔗</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>Network Topologies</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.success}20`, color:T.success, border:`1px solid ${T.success}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Free</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Click nodes to simulate failures, then run a packet test to see how each topology responds. Compare fault tolerance across all six designs.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Topologies',val:'6'},{label:'Max Nodes',val:'6'},{label:'Failure Modes',val:'4+'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4493f8' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Topology Tab Bar ── */}
        <div style={{ display:'flex', gap:4, marginBottom:'1.25rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}`, flexWrap:'wrap' }}>
          {(Object.keys(TOPOLOGIES) as TopologyType[]).map(t=>(
            <button key={t} type="button"
              onClick={()=>{ setActive(t); setBrokenNode(null); setSimStatus(''); setSimming(false); }}
              style={{ flex:'1 1 auto', padding:'0.45rem 0.5rem', fontWeight:700, fontSize:'0.75rem', border:'none', borderRadius:8, cursor:'pointer', background:active===t?TOPOLOGIES[t].color:'transparent', color:active===t?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {TOPOLOGIES[t].tab}
            </button>
          ))}
        </div>

        {/* ── Status bar ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.5rem 1rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'2px 8px', borderRadius:4, background:`${topo.color}18`, color:topo.color, border:`1px solid ${topo.color}30`, textTransform:'uppercase', letterSpacing:'0.06em' }}>{topo.name}</span>
          <span style={{ fontSize:'0.72rem', color:T.textMuted }}>{topo.icon}</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            {brokenNode !== null
              ? <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:`${T.danger}15`, border:`1px solid ${T.danger}30` }}>
                  <span style={{ fontSize:'0.62rem' }}>⚠</span>
                  <span style={{ fontSize:'0.6rem', fontWeight:800, color:T.danger, letterSpacing:'0.05em' }}>{brokenLabel} FAILED</span>
                </div>
              : <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:`${T.success}10`, border:`1px solid ${T.success}25` }}>
                  <span style={{ fontSize:'0.62rem' }}>✓</span>
                  <span style={{ fontSize:'0.6rem', fontWeight:700, color:T.success, letterSpacing:'0.04em' }}>ALL NODES HEALTHY</span>
                </div>
            }
            <span style={{ fontSize:'0.7rem', color:T.textMuted }}>— click nodes to toggle failures</span>
          </div>
        </div>

        {/* ── SVG Topology — full width ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden', marginBottom:'0.75rem', animation:'topo-fade 0.25s ease-out' }}>
          <svg viewBox="0 0 720 300" style={{ width:'100%', display:'block' }}>
            <defs>
              <pattern id="topo-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="0.9" fill={isDarkMode?'#ffffff':'#000000'} opacity={isDarkMode?0.04:0.025}/>
              </pattern>
              <filter id="topo-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="topo-shadow" x="-10%" y="-15%" width="120%" height="135%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity={isDarkMode?0.4:0.1}/>
              </filter>
            </defs>

            {/* Background */}
            <rect width={720} height={300} fill={bg}/>
            <rect width={720} height={300} fill="url(#topo-dots)"/>

            {/* ── Bus: special backbone rendering ── */}
            {active==='bus' && (
              <>
                {/* Backbone glow */}
                {simming && <line x1={55} y1={150} x2={665} y2={150} stroke={brokenNode!==null?T.danger:T.success} strokeWidth={10} opacity={0.15} filter="url(#topo-glow)"/>}
                {/* Backbone */}
                <line x1={55} y1={150} x2={665} y2={150}
                  stroke={brokenNode!==null?T.danger:T.success} strokeWidth={4}
                  strokeDasharray={brokenNode!==null?'8 5':'none'} opacity={0.85} strokeLinecap="round"/>
                {/* Terminators */}
                {[{x:46},{x:660}].map((t,i)=>(
                  <g key={i}>
                    <rect x={t.x} y={143} width={14} height={14} rx={3}
                      fill={brokenNode!==null?`${T.danger}25`:`${T.success}20`}
                      stroke={brokenNode!==null?T.danger:T.success} strokeWidth={1.5}/>
                    <text x={t.x+7} y={140} textAnchor="middle" fontSize={7} fill={isDarkMode?'#6e7681':'#6e7781'} fontFamily="monospace">50Ω</text>
                  </g>
                ))}
                {/* Stubs */}
                {[1,2].map(id => (
                  <line key={id} x1={G(id).cx} y1={G(id).cy} x2={G(id).cx} y2={150}
                    stroke={brokenNode===id?T.danger:T.success} strokeWidth={2}
                    strokeDasharray={brokenNode===id?'5 3':'none'} opacity={0.8}/>
                ))}
                {[3,4].map(id => (
                  <line key={id} x1={G(id).cx} y1={G(id).cy} x2={G(id).cx} y2={150}
                    stroke={brokenNode===id?T.danger:T.success} strokeWidth={2}
                    strokeDasharray={brokenNode===id?'5 3':'none'} opacity={0.8}/>
                ))}
                {/* Packet dot on backbone */}
                {simming && (()=>{
                  const px = 55 + progress * 6.1;
                  const dc = brokenNode!==null?T.danger:T.success;
                  return (
                    <g>
                      <circle cx={px} cy={150} r={14} fill={dc} opacity={0.06}/>
                      <circle cx={px} cy={150} r={9}  fill={dc} opacity={0.14}/>
                      <circle cx={px} cy={150} r={5}  fill={dc} opacity={0.45}/>
                      <circle cx={px} cy={150} r={2.5} fill={dc}/>
                    </g>
                  );
                })()}
              </>
            )}

            {/* ── Hybrid: backbone line ── */}
            {active==='hybrid' && (()=>{
              const sw1=G(1), sw2=G(2);
              const brokeBb=brokenNode===1||brokenNode===2;
              const bbColor=brokeBb?T.danger:T.success;
              const px=sw1.cx+progress*((sw2.cx-sw1.cx)/100);
              return (
                <>
                  {simming && <line x1={sw1.cx} y1={sw1.cy} x2={sw2.cx} y2={sw2.cy} stroke={bbColor} strokeWidth={10} opacity={0.15} filter="url(#topo-glow)"/>}
                  <line x1={sw1.cx} y1={sw1.cy} x2={sw2.cx} y2={sw2.cy}
                    stroke={bbColor} strokeWidth={3.5} strokeLinecap="round"
                    strokeDasharray={brokeBb?'8 5':'none'} opacity={0.8}/>
                  {simming && !brokeBb && (
                    <g>
                      <circle cx={px} cy={sw1.cy} r={12} fill={T.success} opacity={0.07}/>
                      <circle cx={px} cy={sw1.cy} r={7}  fill={T.success} opacity={0.15}/>
                      <circle cx={px} cy={sw1.cy} r={4}  fill={T.success} opacity={0.5}/>
                      <circle cx={px} cy={sw1.cy} r={2}  fill={T.success}/>
                    </g>
                  )}
                </>
              );
            })()}

            {/* ── Standard links (star, ring, mesh, hybrid branches, spine-leaf) ── */}
            {getLinks().map(({a,b}) => {
              const p1=G(a), p2=G(b), broken=isBroken(a,b);

              const dot=lerpPt(p1.cx, p1.cy, p2.cx, p2.cy);
              return (
                <g key={`${a}-${b}`}>
                  {simming && !broken && <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy} stroke={T.success} strokeWidth={8} opacity={0.12} filter="url(#topo-glow)"/>}
                  <line x1={p1.cx} y1={p1.cy} x2={p2.cx} y2={p2.cy}
                    stroke={broken?T.danger:dimLine} strokeWidth={broken?2:1.5}
                    strokeDasharray={broken?'6 4':'none'}
                    opacity={broken?0.8:0.55} strokeLinecap="round"/>
                  {simming && !broken && (
                    <g>
                      <circle cx={dot.x} cy={dot.y} r={13} fill={T.success} opacity={0.06}/>
                      <circle cx={dot.x} cy={dot.y} r={8}  fill={T.success} opacity={0.14}/>
                      <circle cx={dot.x} cy={dot.y} r={4.5} fill={T.success} opacity={0.45}/>
                      <circle cx={dot.x} cy={dot.y} r={2.5} fill={T.success}/>
                    </g>
                  )}
                </g>
              );
            })}

            {/* ── Nodes ── */}
            {TOPO_NODES[active].map(id => {
              const {cx,cy}=G(id);
              const {short,full,color,r}=nodeRole(id);
              const broken=brokenNode===id;
              const fill=broken?`${T.danger}18`:`${color}14`;
              const stroke=broken?T.danger:color;
              return (
                <g key={id} onClick={()=>toggle(id)} style={{ cursor:'pointer' }} filter="url(#topo-shadow)">
                  {/* Glow ring (active or simming) */}
                  {(simming&&!broken) && <circle cx={cx} cy={cy} r={r+8} fill="none" stroke={color} strokeWidth={3} opacity={0.18}/>}
                  {broken && <circle cx={cx} cy={cy} r={r+6} fill="none" stroke={T.danger} strokeWidth={3} opacity={0.25}/>}
                  {/* Main circle */}
                  <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={2}/>
                  {/* Inside label */}
                  {!broken && <text x={cx} y={cy+4} textAnchor="middle" fill={color} fontSize={11} fontWeight="800" fontFamily="'Fira Code','Cascadia Code',monospace">{short}</text>}
                  {/* Broken X */}
                  {broken && <>
                    <line x1={cx-r*0.4} y1={cy-r*0.4} x2={cx+r*0.4} y2={cy+r*0.4} stroke={T.danger} strokeWidth={2.5} strokeLinecap="round"/>
                    <line x1={cx+r*0.4} y1={cy-r*0.4} x2={cx-r*0.4} y2={cy+r*0.4} stroke={T.danger} strokeWidth={2.5} strokeLinecap="round"/>
                    <text x={cx} y={cy+r*0.2} textAnchor="middle" fill={T.danger} fontSize={9} fontWeight="800" fontFamily="monospace">{short}</text>
                  </>}
                  {/* Label badge below */}
                  <text x={cx} y={cy+r+14} textAnchor="middle"
                    fill={broken?T.danger:(isDarkMode?'#8b949e':'#6e7781')}
                    fontSize={8} fontWeight="600" fontFamily="system-ui,sans-serif">{full}</text>
                </g>
              );
            })}

            {/* Hint text */}
            <text x="360" y="294" textAnchor="middle" fontSize="8.5"
              fill={isDarkMode?'#484f58':'#9198a1'} fontFamily="system-ui,sans-serif">
              Click any node to toggle a failure — then run the packet test
            </text>
          </svg>
        </div>

        {/* ── Controls ── */}
        <div style={{ display:'flex', gap:8, marginBottom:'1.25rem' }}>
          <button type="button"
            onClick={()=>{ setBrokenNode(null); setSimStatus(''); setSimming(false); }}
            disabled={brokenNode===null&&simStatus===''}
            style={{ flex:1, padding:'0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:brokenNode===null&&!simStatus?T.textMuted:T.textSecondary, cursor:brokenNode===null&&!simStatus?'not-allowed':'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.82rem', opacity:brokenNode===null&&!simStatus?0.5:1 }}>
            ↺ Reset
          </button>
          <button type="button" onClick={runTest} disabled={simming}
            style={{ flex:3, padding:'0.65rem', borderRadius:8, border:'none', background:simming?'#3fb95099':T.success, color:'#fff', cursor:simming?'not-allowed':'pointer', fontWeight:700, fontFamily:'inherit', fontSize:'0.82rem', transition:'background 0.15s' }}>
            {simming ? 'Sending packet…' : '▶ Run Packet Test'}
          </button>
        </div>

        {/* ── Bottom panels ── */}
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>

          {/* Terminal */}
          <div style={{ flex:'1 1 300px', borderRadius:12, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
            <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }}/>)}
              </div>
              <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                ping test — {topo.name.toLowerCase()} topology
              </span>
            </div>
            <div style={{ background:'#0d1117', padding:'0.9rem 1.1rem', minHeight:100 }}>
              {simStatus
                ? <div style={{ fontFamily:"'Fira Code','Cascadia Code',monospace", fontSize:'0.72rem', color:simColor, lineHeight:1.75 }}>
                    {simStatus.startsWith('Sending')
                      ? <><span style={{ color:'#8b949e' }}>$ </span><span>ping {active === 'star' ? '192.168.1.1' : '10.0.0.1'} -c 4</span><br/><span style={{ color:T.warning }}>PING in progress…</span></>
                      : <><span style={{ color:'#8b949e' }}>$ </span><span>ping result</span><br/>{simStatus}</>
                    }
                  </div>
                : <div style={{ fontFamily:"'Fira Code','Cascadia Code',monospace", fontSize:'0.7rem', color:isDarkMode?'#484f58':'#9198a1', lineHeight:1.75 }}>
                    <span style={{ color:'#8b949e' }}>$ </span>— run a packet test to see output here —
                  </div>
              }
            </div>
          </div>

          {/* Info card */}
          <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:'0.8rem' }}>
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderLeft:`4px solid ${topo.color}`, flex:'1 1 auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:'0.6rem', fontWeight:800, color:topo.color, background:`${topo.color}18`, padding:'2px 8px', borderRadius:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>Topology</span>
                <span style={{ fontSize:'0.88rem', fontWeight:700 }}>{topo.name}</span>
              </div>
              <p style={{ margin:'0 0 0.75rem', fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.7 }}>{topo.desc}</p>
              <div style={{ padding:'0.5rem 0.65rem', background:`${T.warning}10`, border:`1px solid ${T.warning}30`, borderRadius:8, borderLeft:`3px solid ${T.warning}` }}>
                <div style={{ fontSize:'0.6rem', fontWeight:800, color:T.warning, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Failure Impact</div>
                <p style={{ margin:0, fontSize:'0.75rem', color:T.textSecondary, lineHeight:1.6 }}>{topo.vulnerability}</p>
              </div>
            </div>

            {/* Link legend */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.6rem 0.9rem' }}>
              <div style={{ fontSize:'0.58rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Link States</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.45rem 1rem' }}>
                {[{color:dimLine,label:'Inactive',dash:true},{color:T.success,label:'Active'},{color:T.danger,label:'Failed',dash:true}].map(l=>(
                  <div key={l.label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <svg width="22" height="8" style={{ overflow:'visible' }}>
                      <line x1="0" y1="4" x2="22" y2="4" stroke={l.color} strokeWidth={2} strokeDasharray={l.dash?'4 3':'none'} strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <LabEduPanel cards={TOPO_EDU} isDarkMode={isDarkMode}/>
      </div>
    </div>
  );
};

export default TopologyLab;
