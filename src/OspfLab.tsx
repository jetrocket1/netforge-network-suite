import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const OSPF_EDU: EduCard[] = [
  { type:'exam', title:'DR/BDR Election is Non-Preemptive', body:'Higher OSPF priority wins DR (ties broken by RID); priority 0 = never eligible. If a higher-priority router joins later, it will NOT displace the current DR — re-election only happens on DR failure. Common exam question: what happens when a new router with priority 255 is added to an existing segment?' },
  { type:'exam', title:'Timer Mismatch = Stuck Adjacency', body:'Hello/Dead interval mismatch stalls at INIT/2-WAY. MTU mismatch stalls at EXCHANGE/LOADING. Area ID, authentication type, and stub-flag mismatches all prevent FULL state. The Dead interval must exactly match on both sides (typically 4× Hello). The exam loves asking which mismatch causes which stuck state.' },
  { type:'exam', title:'LSA Types by Flooding Scope', body:'Type 1 (Router-LSA) and Type 2 (Network-LSA) stay within one area. Type 3 (Summary-LSA) crosses area boundaries via ABRs. Type 5 (External-LSA) floods the entire OSPF AS but is blocked from stub/totally-stubby areas. Type 7 (NSSA External) lives inside an NSSA and translates to Type 5 at the ABR.' },
  { type:'config', title:'OSPF Reference BW + Passive Interface', body:'Always set reference-bandwidth to match your fastest link. Mark all non-WAN interfaces passive to prevent unnecessary hellos.', code:`router ospf 1
  router-id 1.1.1.1
  auto-cost reference-bandwidth 10000  ! 10G baseline — critical!
  passive-interface default             ! suppress hellos everywhere
  no passive-interface GigabitEthernet0/1  ! enable only on WAN links
  network 10.0.0.0 0.0.0.255 area 0
  area 1 range 192.168.0.0 255.255.0.0  ! summarise at ABR

interface GigabitEthernet0/1
  ip ospf cost 10            ! override auto-cost per-interface
  ip ospf hello-interval 5   ! MUST match neighbour
  ip ospf dead-interval 20   ! MUST match neighbour (= 4 × hello)` },
  { type:'gotcha', title:'Default reference-bandwidth Makes GigE = FastE = Cost 1', body:'With the default 100 Mbps reference, any interface ≥100 Mbps has cost 1 — Gigabit, 10G, and 100G are all equal to OSPF. SPF picks arbitrary paths. Always run "auto-cost reference-bandwidth 10000" (or 100000 for 100G) on every router in the OSPF domain, or costs will be meaningless.' },
  { type:'gotcha', title:'Forgetting passive-interface on LAN Ports', body:'By default OSPF sends Hellos out every enabled interface — including server LANs where no routers exist. This wastes bandwidth, triggers unnecessary DR elections, and can expose routing info. Use "passive-interface default" and selectively enable only router-to-router links.' },
  { type:'realworld', title:'Sub-Second Convergence with SPF Throttling', body:'Without throttle tuning, a large OSPF domain can spend 5–30 seconds reconverging. Service providers use "timers throttle spf 50 200 5000" (initial/hold/max ms) plus LSA group pacing to achieve sub-second failover. This is critical for BFD-assisted fast failover in data centre and carrier networks.' },
];

interface OspfLabProps { isDarkMode?: boolean; }
type OspfTab = 'adjacency' | 'areas' | 'spf';

const ADJ_STEPS = [
  { state:'DOWN',     fromR1:null, fromR2:null,
    log:'No OSPF Hello packets exchanged. The interface is OSPF-enabled but no neighbor detected yet. The Dead timer has not started.',
    packet:'[No OSPF traffic]\n\nInterface: GigabitEthernet0/0\n  OSPF enabled: yes\n  OSPF state:   DOWN\n  Hello timer:  not started\n  Dead timer:   not started\n\nWaiting for first Hello multicast to 224.0.0.5…' },
  { state:'INIT',     fromR1:'Hello (RID=1.1.1.1, Neighbors=[])', fromR2:null,
    log:'R1 multicasts a Hello to 224.0.0.5. The packet carries R1\'s Router ID, Area ID, Hello/Dead timers, and an empty neighbors-seen list.',
    packet:'IP: 10.0.0.1 → 224.0.0.5  (OSPF All-Routers)\nProtocol: 89 (OSPF)\n\nOSPF Hello Packet:\n  Version:         2\n  Message Type:    Hello (1)\n  Router ID:       1.1.1.1\n  Area ID:         0.0.0.0\n  Hello Interval:  10s\n  Dead Interval:   40s\n  DR:              0.0.0.0 (unknown)\n  BDR:             0.0.0.0 (unknown)\n  Neighbors Seen:  [] ← empty list\n\nR2 receives this but R1 is NOT yet in R2\'s neighbor list.' },
  { state:'2-WAY',    fromR1:null, fromR2:'Hello (RID=2.2.2.2, Neighbors=[1.1.1.1])',
    log:'R2 replies with a Hello listing R1 in the Neighbors Seen field. R1 sees itself — bidirectional communication confirmed. On a broadcast LAN, DR/BDR election happens here.',
    packet:'IP: 10.0.0.2 → 224.0.0.5\nProtocol: 89 (OSPF)\n\nOSPF Hello Packet:\n  Version:         2\n  Router ID:       2.2.2.2\n  Area ID:         0.0.0.0\n  Hello Interval:  10s\n  Dead Interval:   40s\n  DR:              0.0.0.0\n  BDR:             0.0.0.0\n  Neighbors Seen:  [1.1.1.1] ← R1 listed!\n\nR1 sees its own RID in R2\'s Hello → 2-Way state.\nDR/BDR election starts: higher priority wins,\nthen higher Router ID. R2 (2.2.2.2) wins DR.' },
  { state:'EXSTART',  fromR1:'DBD (seq=100, I=1, MS=1)', fromR2:'DBD (seq=200, I=1, MS=1)',
    log:'Both routers send empty DBD packets claiming Master. The higher RID wins — R2 (2.2.2.2) becomes Master and controls the sequence number space.',
    packet:'R1 → R2: OSPF Database Description\n  Sequence:        100\n  Init bit (I):    1  ← first DBD\n  Master bit (MS): 1  ← claims master\n  More bit (M):    0\n  Options:         E-bit (external LSAs)\n  MTU:             1500\n  [No LSA headers — empty]\n\nR2 → R1: OSPF Database Description\n  Sequence:        200  ← higher seq\n  Init bit (I):    1\n  Master bit (MS): 1  ← also claims master\n\nResult: Higher RID (2.2.2.2) wins Master role.\nR2 sets sequence, R1 acknowledges.' },
  { state:'EXCHANGE', fromR1:'DBD (LSA headers, seq=201)', fromR2:'DBD (LSA headers, seq=201)',
    log:'Routers exchange DBD packets listing LSA headers from their LSDBs. Each builds a list of missing or stale LSAs it needs to request.',
    packet:'R2 → R1: OSPF Database Description\n  Sequence:        201  (Master sets seq)\n  Init bit (I):    0\n  More bit (M):    1  ← more DBDs coming\n  Master bit (MS): 1\n\n  LSA Header [1/3]:\n    Type:      1 (Router-LSA)\n    Link ID:   2.2.2.2\n    Age:       180s\n    Seq:       0x80000003\n    Checksum:  0xA12F\n\n  LSA Header [2/3]:\n    Type:      3 (Summary-LSA)\n    Link ID:   10.10.2.0\n    Age:       95s\n\nR1 compares headers to its LSDB → builds LSR list.' },
  { state:'LOADING',  fromR1:'LSR / LSU / LSAck', fromR2:'LSR / LSU / LSAck',
    log:'Link-State Requests (LSR) are sent for needed LSAs. The neighbor replies with Link-State Updates (LSU). LSAcks confirm delivery. Retransmit timers fire if no Ack arrives.',
    packet:'R1 → R2: Link-State Request\n  LSA Type: 1\n  Link ID:  2.2.2.2\n  Adv Rtr:  2.2.2.2\n\nR2 → R1: Link-State Update\n  # LSAs: 1\n  Router-LSA for 2.2.2.2:\n    # Links: 2\n    Link 1: 10.0.0.0/24, cost 10\n    Link 2: 192.168.2.0/24, cost 1\n\nR1 → R2: Link-State Acknowledgement\n  LSA Header: Type 1, 2.2.2.2, seq 0x80000003\n  [Confirms delivery — stops retransmit timer]' },
  { state:'FULL',     fromR1:null, fromR2:null,
    log:'LSDBs are synchronized. Both routers are fully adjacent. SPF (Dijkstra) runs and routes are installed into the routing table. Hellos continue every 10s to maintain the adjacency.',
    packet:'[Adjacency established — ongoing Hellos only]\n\nOSPF Hello (keepalive, every 10s):\n  Router ID:       1.1.1.1\n  DR:              2.2.2.2\n  BDR:             1.1.1.1\n  Neighbors Seen:  [2.2.2.2]\n\nSPF triggered:\n  Computing shortest paths from 1.1.1.1…\n  Routes installed in RIB:\n    O  192.168.2.0/24 [110/11] via 10.0.0.2\n    O  10.10.2.0/24   [110/21] via 10.0.0.2\n\nAdjacency maintained until Dead timer (40s) expires.' },
];

const STATE_COLORS_MAP: Record<string, string> = {
  DOWN:'danger', INIT:'textMuted', '2-WAY':'textSecondary',
  EXSTART:'warning', EXCHANGE:'warning', LOADING:'accent', FULL:'success',
};

const NODES = [
  { id:'R1', rid:'1.1.1.1', role:'ABR',      areas:['0','1'], x:210, y:120 },
  { id:'R2', rid:'2.2.2.2', role:'ABR',      areas:['0','2'], x:390, y:120 },
  { id:'R3', rid:'3.3.3.3', role:'Internal', areas:['1'],     x:130, y:265 },
  { id:'R4', rid:'4.4.4.4', role:'Internal', areas:['1'],     x:130, y:345 },
  { id:'R5', rid:'5.5.5.5', role:'ASBR',     areas:['2'],     x:470, y:265 },
];

const LINKS = [
  { a:'R1', b:'R2', cost:10, area:'0' },
  { a:'R1', b:'R3', cost:5,  area:'1' },
  { a:'R3', b:'R4', cost:3,  area:'1' },
  { a:'R2', b:'R5', cost:20, area:'2' },
];

type NodeState = 'confirmed' | 'tentative' | 'unvisited';
interface SpfStep { costs:Record<string,number>; states:Record<string,NodeState>; processing:string|null; desc:string; }

function computeSpf(source: string): SpfStep[] {
  const adj: Record<string,{to:string;cost:number}[]> = {
    R1:[{to:'R2',cost:10},{to:'R3',cost:5}], R2:[{to:'R1',cost:10},{to:'R5',cost:20}],
    R3:[{to:'R1',cost:5},{to:'R4',cost:3}],  R4:[{to:'R3',cost:3}], R5:[{to:'R2',cost:20}],
  };
  const ids = ['R1','R2','R3','R4','R5'];
  const costs: Record<string,number> = {};
  const states: Record<string,NodeState> = {};
  for (const n of ids) { costs[n]=n===source?0:Infinity; states[n]=n===source?'tentative':'unvisited'; }
  const confirmed = new Set<string>();
  const steps: SpfStep[] = [];
  const srcNode = NODES.find(n=>n.id===source)!;
  steps.push({ costs:{...costs}, states:{...states}, processing:null, desc:`SPF started from ${source} (RID ${srcNode.rid}). Self cost = 0; all others = ∞. Source added to tentative list.` });
  while (confirmed.size < ids.length) {
    let minNode: string|null=null, minCost=Infinity;
    for (const n of ids) if (!confirmed.has(n) && costs[n]<minCost) { minCost=costs[n]; minNode=n; }
    if (!minNode||minCost===Infinity) break;
    confirmed.add(minNode);
    states[minNode]='confirmed';
    const updates: string[]=[];
    for (const {to,cost} of adj[minNode]||[]) {
      if (!confirmed.has(to)) { const nc=costs[minNode]+cost; if (nc<costs[to]) { costs[to]=nc; if (states[to]==='unvisited') states[to]='tentative'; updates.push(`${to}: ${costs[to]===Infinity?'∞':nc-cost}+${cost}→${nc}`); } }
    }
    steps.push({ costs:{...costs}, states:{...states}, processing:minNode, desc:`Confirm ${minNode} (cost ${minCost}). ${updates.length?'Update: '+updates.join(', ')+'.':'No cheaper paths found for neighbors.'}` });
  }
  steps.push({ costs:{...costs}, states:{...states}, processing:null, desc:`SPF complete from ${source}: `+ids.map(n=>`${n}=${costs[n]===Infinity?'∞':costs[n]}`).join(', ')+'. Routes installed in RIB.' });
  return steps;
}

export const OspfLab: React.FC<OspfLabProps> = ({ isDarkMode = true }) => {
  const [tab,       setTab]       = useState<OspfTab>('adjacency');
  const [adjStep,   setAdjStep]   = useState(0);
  const [spfSource, setSpfSource] = useState('R1');
  const [spfStep,   setSpfStep]   = useState(0);
  const T = getLabTheme(isDarkMode);

  const spfSteps = computeSpf(spfSource);
  const cur = spfSteps[Math.min(spfStep, spfSteps.length-1)];
  const adj = ADJ_STEPS[adjStep];

  const areaColor  = (a: string) => a==='0'?T.accent:a==='1'?T.success:T.warning;
  const roleColor  = (r: string) => r==='ABR'?T.accent:r==='ASBR'?T.warning:T.textSecondary;
  const nodeColor  = (s: NodeState) => s==='confirmed'?'#3fb950':s==='tentative'?'#d29922':T.textMuted;
  const stateColor = (s: string): string => { const key=STATE_COLORS_MAP[s] as keyof ReturnType<typeof getLabTheme>; return (T[key] as string)??T.textMuted; };
  const gp = (id: string) => NODES.find(n=>n.id===id)!;

  const TermLine = ({ label, value, hi }: { label:string; value:string; hi?:boolean }) => (
    <div style={{ display:'grid', gridTemplateColumns:'190px 1fr', gap:'0 1rem', padding:'0.28rem 0', borderBottom:'1px solid #ffffff10' }}>
      <span style={{ fontSize:'0.7rem', color:'#7ee787', fontFamily:'monospace' }}>{label}:</span>
      <span style={{ fontSize:'0.7rem', color:hi?'#ffa657':'#e6edf3', fontFamily:'monospace', wordBreak:'break-all' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui, -apple-system, sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes ospf-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ospf-glow { 0%,100%{box-shadow:0 0 0 0 #3fb95040} 50%{box-shadow:0 0 16px 5px #3fb95020} }
        @keyframes ospf-pulse{ 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #4493f8, #3fb950, #d29922)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🌐</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>OSPF Visualiser</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Explore OSPF neighbor adjacency formation, multi-area LSA design, and Dijkstra SPF calculation with real packet-level inspection.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'States', val:'7'},{label:'Areas', val:'3'},{label:'Routers', val:'5'}].map(s => (
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
        <div style={{ display:'flex', gap:4, marginBottom:'1.5rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}` }}>
          {(['adjacency','areas','spf'] as const).map((t,i) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ flex:1, padding:'0.45rem', fontWeight:700, fontSize:'0.78rem', border:'none', borderRadius:8, cursor:'pointer', background:tab===t?T.accent:'transparent', color:tab===t?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
              {['Neighbor Adjacency','Areas & LSAs','SPF Calculation'][i]}
            </button>
          ))}
        </div>

        {/* ── TAB 1: ADJACENCY ── */}
        {tab==='adjacency' && (
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', animation:'ospf-fade 0.25s ease-out' }}>
            <div style={{ flex:'1 1 340px', display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* State pill */}
              <div style={{ textAlign:'center' }}>
                <span style={{ display:'inline-block', padding:'5px 24px', borderRadius:20, fontFamily:'monospace', fontWeight:800, fontSize:'1rem', background:`${stateColor(adj.state)}18`, border:`2px solid ${stateColor(adj.state)}`, color:stateColor(adj.state), transition:'all 0.3s', ...(adj.state==='FULL'?{animation:'ospf-glow 2s ease-out 1'}:{}) }}>
                  {adj.state}
                </span>
              </div>

              {/* R1 ↔ R2 diagram */}
              <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1.5rem 1rem', display:'grid', gridTemplateColumns:'1fr 1.4fr 1fr', alignItems:'center', gap:'0.75rem', minHeight:150 }}>
                <div style={{ textAlign:'center', padding:'12px 8px', borderRadius:10, background:T.cardBg, border:`2px solid ${adjStep>=1?T.accent:T.borderColor}`, transition:'border-color 0.3s' }}>
                  <div style={{ fontSize:'1.5rem' }}>🎛️</div>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, marginTop:4, color:T.textPrimary }}>R1</div>
                  <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted }}>1.1.1.1</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
                  {adj.fromR1 && (
                    <div style={{ width:'100%', textAlign:'center' }}>
                      <div style={{ fontSize:'0.55rem', fontFamily:'monospace', fontWeight:700, color:T.accent, background:T.accentSubtle, border:`1px solid ${T.accent}30`, borderRadius:4, padding:'3px 5px', marginBottom:2, wordBreak:'break-all' }}>{adj.fromR1}</div>
                      <div style={{ color:T.accent }}>→</div>
                    </div>
                  )}
                  {adj.fromR2 && (
                    <div style={{ width:'100%', textAlign:'center' }}>
                      <div style={{ color:'#3fb950' }}>←</div>
                      <div style={{ fontSize:'0.55rem', fontFamily:'monospace', fontWeight:700, color:'#3fb950', background:'#3fb95015', border:'1px solid #3fb95030', borderRadius:4, padding:'3px 5px', marginTop:2, wordBreak:'break-all' }}>{adj.fromR2}</div>
                    </div>
                  )}
                  {!adj.fromR1 && !adj.fromR2 && <span style={{ color:T.borderColor, fontSize:'1.5rem' }}>···</span>}
                </div>
                <div style={{ textAlign:'center', padding:'12px 8px', borderRadius:10, background:T.cardBg, border:`2px solid ${adjStep>=2?'#3fb950':T.borderColor}`, transition:'border-color 0.3s' }}>
                  <div style={{ fontSize:'1.5rem' }}>🎛️</div>
                  <div style={{ fontSize:'0.75rem', fontWeight:700, marginTop:4, color:T.textPrimary }}>R2</div>
                  <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted }}>2.2.2.2</div>
                </div>
              </div>

              {/* State timeline */}
              <div style={{ display:'flex', gap:3 }}>
                {ADJ_STEPS.map((s,i) => (
                  <div key={i} onClick={() => setAdjStep(i)} style={{ flex:1, cursor:'pointer' }}>
                    <div style={{ height:4, borderRadius:2, background:i<=adjStep?stateColor(s.state):T.borderColor, marginBottom:3, transition:'background 0.3s' }} />
                    <div style={{ fontSize:'0.48rem', textAlign:'center', color:i===adjStep?stateColor(s.state):T.textMuted, fontWeight:i===adjStep?800:400 }}>{s.state}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={() => setAdjStep(p=>Math.max(0,p-1))} disabled={adjStep===0} style={{ flex:1, padding:'0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:adjStep===0?T.textMuted:T.textSecondary, cursor:adjStep===0?'not-allowed':'pointer', fontWeight:600, fontFamily:'inherit' }}>← Back</button>
                {adjStep < ADJ_STEPS.length-1
                  ? <button type="button" onClick={() => setAdjStep(p=>p+1)} style={{ flex:2, padding:'0.65rem', borderRadius:8, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>Next State →</button>
                  : <button type="button" onClick={() => setAdjStep(0)} style={{ flex:2, padding:'0.65rem', borderRadius:8, border:'none', background:'#3fb950', color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>✓ Full — Reset</button>
                }
              </div>
            </div>

            {/* Right: terminal + hello params */}
            <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Terminal */}
              <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${stateColor(adj.state)}40`, flex:1 }}>
                <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:5 }}>
                    {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                    ospf adjacency — step {adjStep+1}/{ADJ_STEPS.length} — state: {adj.state}
                  </span>
                </div>
                <div style={{ background:'#0d1117', padding:'0.9rem 1.1rem', minHeight:160 }}>
                  <pre style={{ margin:0, fontSize:'0.68rem', lineHeight:1.75, color:'#e6edf3', fontFamily:'\'Fira Code\', \'Cascadia Code\', monospace', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{adj.packet}</pre>
                </div>
                <div style={{ background:T.cardBg, padding:'0.8rem 1.1rem', borderTop:`1px solid ${T.borderColor}` }}>
                  <p style={{ margin:0, fontSize:'0.77rem', color:T.textSecondary, lineHeight:1.65 }}>{adj.log}</p>
                </div>
              </div>

              {/* Hello params */}
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'0.6rem 1rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.accent }}>Hello Packet Parameters</span>
                </div>
                <div style={{ padding:'0.75rem 1rem' }}>
                  {[['Hello interval','10s (broadcast) / 30s (NBMA)'],['Dead interval','40s (4× hello)'],['All OSPF routers','224.0.0.5'],['All DR routers','224.0.0.6'],['Must match','Area ID, timers, MTU, auth']].map(([k,v])=>(
                    <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:8, fontSize:'0.73rem', marginBottom:5 }}>
                      <span style={{ color:T.textMuted }}>{k}</span>
                      <span style={{ fontFamily:'monospace', color:T.textPrimary, textAlign:'right', fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: AREAS & LSAs ── */}
        {tab==='areas' && (
          <div style={{ animation:'ospf-fade 0.25s ease-out' }}>
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1rem', marginBottom:'1.5rem', overflowX:'auto' }}>
              <svg viewBox="0 0 560 430" style={{ width:'100%', maxWidth:560, display:'block', margin:'0 auto' }}>
                <rect x="155" y="72" width="280" height="90" rx="10" fill={`${areaColor('0')}12`} stroke={areaColor('0')} strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="300" y="88" textAnchor="middle" fontSize="10" fontWeight="700" fill={areaColor('0')}>Area 0 — Backbone</text>
                <rect x="70" y="82" width="190" height="290" rx="10" fill={`${areaColor('1')}0c`} stroke={areaColor('1')} strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="162" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill={areaColor('1')}>Area 1</text>
                <rect x="350" y="82" width="180" height="215" rx="10" fill={`${areaColor('2')}0c`} stroke={areaColor('2')} strokeWidth="1.5" strokeDasharray="6 3" />
                <text x="440" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill={areaColor('2')}>Area 2</text>
                <ellipse cx="470" cy="375" rx="50" ry="22" fill={`${T.borderColor}20`} stroke={T.borderColor} strokeWidth="1.5" strokeDasharray="4 2" />
                <text x="470" y="379" textAnchor="middle" fontSize="10" fill={T.textMuted}>Internet</text>
                {LINKS.map(l=>{ const a=gp(l.a),b=gp(l.b),mx=(a.x+b.x)/2,my=(a.y+b.y)/2; return (
                  <g key={`${l.a}-${l.b}`}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={areaColor(l.area)} strokeWidth="2.5" />
                    <rect x={mx-16} y={my-9} width={32} height={16} rx={4} fill={T.panelBg} stroke={areaColor(l.area)} strokeWidth="1" />
                    <text x={mx} y={my+4} textAnchor="middle" fontSize="9" fontWeight="700" fill={areaColor(l.area)}>cost {l.cost}</text>
                  </g>
                ); })}
                <line x1="470" y1="265" x2="470" y2="353" stroke={T.textMuted} strokeWidth="1.5" strokeDasharray="5 3" />
                <rect x="478" y="296" width="38" height="14" rx="3" fill={T.panelBg} stroke={T.danger} strokeWidth="1" />
                <text x="497" y="306" textAnchor="middle" fontSize="8" fontWeight="700" fill={T.danger}>Type 5</text>
                {NODES.map(n=>(
                  <g key={n.id}>
                    <circle cx={n.x} cy={n.y} r="22" fill={T.panelBg} stroke={roleColor(n.role)} strokeWidth="2.5" />
                    <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.textPrimary}>{n.id}</text>
                    <text x={n.x} y={n.y+35} textAnchor="middle" fontSize="9" fill={roleColor(n.role)} fontWeight="700">{n.role}</text>
                    <text x={n.x} y={n.y+46} textAnchor="middle" fontSize="8" fill={T.textMuted} fontFamily="monospace">{n.rid}</text>
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
              {[
                { type:'Type 1', name:'Router LSA',   color:'#3fb950', desc:'Every router generates one per area. Describes its interfaces, link types, and OSPF costs. Flooded only within the originating area.' },
                { type:'Type 2', name:'Network LSA',  color:T.accent,  desc:'The DR generates this on broadcast/NBMA segments. Lists all routers attached to that segment. Flooded within the area.' },
                { type:'Type 3', name:'Summary LSA',  color:'#d29922', desc:'ABRs generate these to summarise inter-area prefixes across area boundaries. Enables routing between areas without full LSDB visibility.' },
                { type:'Type 5', name:'External LSA', color:T.danger,  desc:'ASBRs generate these for redistributed routes (BGP, static, EIGRP). Flooded AS-wide — blocked by stub and totally-stubby areas.' },
              ].map(lsa=>(
                <div key={lsa.type} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderLeft:`4px solid ${lsa.color}` }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:6 }}>
                    <span style={{ fontFamily:'monospace', fontSize:'0.7rem', fontWeight:800, color:lsa.color }}>{lsa.type}</span>
                    <span style={{ fontSize:'0.8rem', fontWeight:700, color:T.textPrimary }}>{lsa.name}</span>
                  </div>
                  <p style={{ margin:0, fontSize:'0.75rem', color:T.textSecondary, lineHeight:1.55 }}>{lsa.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1rem', borderTop:`1px solid ${T.borderColor}`, paddingTop:'1.25rem' }}>
              {[
                { title:'Why multi-area?', color:T.accent, body:'Single-area OSPF floods every LSA to every router. In large networks the LSDB grows prohibitively. Areas limit flooding scope — only Type 3 summaries cross boundaries, reducing per-router database size dramatically.' },
                { title:'DR / BDR Election', color:'#d29922', body:'On broadcast LANs, full adjacency forms only with the DR and BDR — reducing O(n²) adjacencies to O(n). Winner: highest OSPF priority (default 1), then highest Router ID. Priority 0 = never eligible.' },
                { title:'Stub Areas', color:'#3fb950', body:'A stub area blocks Type 5 External LSAs and substitutes a default route. Totally-stubby also blocks Type 3 summaries. Ideal for branch sites — only a default path is needed.' },
              ].map(c=>(
                <div key={c.title} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${c.color}` }}>
                  <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:c.color }}>{c.title}</h4>
                  <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: SPF ── */}
        {tab==='spf' && (
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', animation:'ospf-fade 0.25s ease-out' }}>
            <div style={{ flex:'1 1 340px', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.6rem 0.9rem' }}>
                <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>SPF Root:</span>
                {NODES.map(n=>(
                  <button key={n.id} type="button" onClick={() => { setSpfSource(n.id); setSpfStep(0); }}
                    style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${spfSource===n.id?T.accent:T.borderColor}`, background:spfSource===n.id?T.accentSubtle:'transparent', color:spfSource===n.id?T.accent:T.textSecondary, fontWeight:spfSource===n.id?700:400, fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit' }}>
                    {n.id}
                  </button>
                ))}
              </div>
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1rem', overflowX:'auto' }}>
                <svg viewBox="0 0 560 430" style={{ width:'100%', maxWidth:560, display:'block', margin:'0 auto' }}>
                  {LINKS.map(l=>{ const a=gp(l.a),b=gp(l.b),both=cur.states[l.a]==='confirmed'&&cur.states[l.b]==='confirmed',mx=(a.x+b.x)/2,my=(a.y+b.y)/2; return (
                    <g key={`${l.a}-${l.b}`}>
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={both?'#3fb950':T.borderColor} strokeWidth={both?3:1.5} strokeDasharray={both?'0':'5 3'} style={{ transition:'stroke 0.3s' }} />
                      <rect x={mx-16} y={my-9} width={32} height={16} rx={4} fill={T.panelBg} stroke={T.borderColor} strokeWidth="1" />
                      <text x={mx} y={my+4} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.textMuted}>cost {l.cost}</text>
                    </g>
                  ); })}
                  {NODES.map(n=>{ const st=cur.states[n.id],c=nodeColor(st),cost=cur.costs[n.id],isProc=cur.processing===n.id; return (
                    <g key={n.id}>
                      {isProc && <circle cx={n.x} cy={n.y} r="29" fill="none" stroke={T.accent} strokeWidth="2" strokeDasharray="4 2" style={{ animation:'ospf-pulse 1s infinite' }} />}
                      <circle cx={n.x} cy={n.y} r="22" fill={T.panelBg} stroke={c} strokeWidth={st==='confirmed'?3:1.5} style={{ transition:'all 0.3s' }} />
                      <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.textPrimary}>{n.id}</text>
                      <rect x={n.x-18} y={n.y+27} width={36} height={16} rx={4} fill={st==='confirmed'?'#3fb95020':st==='tentative'?'#d2992220':T.panelBg} stroke={c} strokeWidth="1" />
                      <text x={n.x} y={n.y+38} textAnchor="middle" fontSize="9" fontWeight="700" fill={c}>{cost===Infinity?'∞':cost}</text>
                    </g>
                  ); })}
                  {(['confirmed','tentative','unvisited'] as NodeState[]).map((s,i)=>(
                    <g key={s} transform={`translate(${15+i*130},410)`}>
                      <circle cx={6} cy={5} r={5} fill="none" stroke={nodeColor(s)} strokeWidth="2" />
                      <text x={15} y={9} fontSize="9" fill={nodeColor(s)}>{s}</text>
                    </g>
                  ))}
                </svg>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={() => setSpfStep(0)} disabled={spfStep===0} style={{ padding:'0.6rem 0.8rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:spfStep===0?T.textMuted:T.textSecondary, cursor:spfStep===0?'not-allowed':'pointer', fontSize:'0.8rem', fontFamily:'inherit' }}>↺</button>
                <button type="button" onClick={() => setSpfStep(p=>Math.max(0,p-1))} disabled={spfStep===0} style={{ flex:1, padding:'0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:spfStep===0?T.textMuted:T.textSecondary, cursor:spfStep===0?'not-allowed':'pointer', fontWeight:600, fontFamily:'inherit' }}>← Back</button>
                {spfStep < spfSteps.length-1
                  ? <button type="button" onClick={() => setSpfStep(p=>p+1)} style={{ flex:2, padding:'0.65rem', borderRadius:8, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>Next Step →</button>
                  : <button type="button" onClick={() => setSpfStep(0)} style={{ flex:2, padding:'0.65rem', borderRadius:8, border:'none', background:'#3fb950', color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>✓ Complete — Reset</button>
                }
              </div>
            </div>

            <div style={{ flex:'1 1 240px', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Dijkstra log terminal */}
              <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${T.accent}40` }}>
                <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:5 }}>
                    {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                    dijkstra — step {spfStep+1}/{spfSteps.length} — root: {spfSource}
                  </span>
                </div>
                <div style={{ background:'#0d1117', padding:'0.9rem 1.1rem' }}>
                  <TermLine label="SPF Root" value={spfSource} />
                  <TermLine label="Step" value={`${spfStep+1} of ${spfSteps.length}`} />
                  <TermLine label="Processing" value={cur.processing ?? 'none'} hi />
                  <div style={{ height:1, background:'#ffffff10', margin:'6px 0' }} />
                  <pre style={{ margin:0, fontSize:'0.68rem', color:'#e6edf3', fontFamily:'monospace', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{cur.desc}</pre>
                </div>
              </div>

              {/* Cost table */}
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ padding:'0.6rem 1rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg }}>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>Cost Table from {spfSource}</span>
                </div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'monospace', fontSize:'0.75rem' }}>
                  <thead><tr style={{ background:T.panelBg }}>
                    {['Router','RID','Cost','State'].map(h=><th key={h} style={{ padding:'6px 10px', textAlign:'left', color:T.textMuted, fontWeight:700, borderBottom:`1px solid ${T.borderColor}`, fontSize:'0.65rem', textTransform:'uppercase' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {NODES.map(n=>{ const st=cur.states[n.id],c=nodeColor(st),cost=cur.costs[n.id]; return (
                      <tr key={n.id} style={{ background:cur.processing===n.id?T.accentSubtle:'transparent', transition:'background 0.3s' }}>
                        <td style={{ padding:'7px 10px', fontWeight:700, borderBottom:`1px solid ${T.borderColor}`, color:T.textPrimary }}>{n.id}</td>
                        <td style={{ padding:'7px 10px', color:T.textMuted, borderBottom:`1px solid ${T.borderColor}`, fontSize:'0.7rem' }}>{n.rid}</td>
                        <td style={{ padding:'7px 10px', color:cost===Infinity?T.textMuted:T.accent, fontWeight:700, borderBottom:`1px solid ${T.borderColor}` }}>{cost===Infinity?'∞':cost}</td>
                        <td style={{ padding:'7px 10px', borderBottom:`1px solid ${T.borderColor}` }}>
                          <span style={{ fontSize:'0.62rem', fontWeight:700, color:c, background:`${c}18`, padding:'2px 6px', borderRadius:4 }}>{st}</span>
                        </td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>

              {/* Cost formula */}
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem' }}>
                <p style={{ margin:'0 0 6px', fontSize:'0.75rem', fontWeight:700, color:T.accent }}>OSPF Cost Formula</p>
                <div style={{ fontFamily:'monospace', fontSize:'0.78rem', color:T.textPrimary, background:T.panelBg, padding:'8px 10px', borderRadius:6, marginBottom:8, border:`1px solid ${T.borderColor}` }}>cost = reference BW ÷ interface BW</div>
                <p style={{ margin:0, fontSize:'0.75rem', color:T.textSecondary, lineHeight:1.55 }}>Default reference = 100 Mbps. Always set <code style={{ fontFamily:'monospace', color:T.accent, background:T.panelBg, padding:'1px 4px', borderRadius:3 }}>auto-cost reference-bandwidth 1000</code> on modern networks.</p>
              </div>
            </div>
          </div>
        )}
        <LabEduPanel cards={OSPF_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default OspfLab;
