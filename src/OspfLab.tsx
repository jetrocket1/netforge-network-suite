import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface OspfLabProps { isDarkMode?: boolean; }
type OspfTab = 'adjacency' | 'areas' | 'spf';

const ADJ_STEPS = [
  { state: 'DOWN',     fromR1: null, fromR2: null,
    log: 'No OSPF Hello packets exchanged. The interface is OSPF-enabled but no neighbor detected yet. The Dead timer has not started.' },
  { state: 'INIT',     fromR1: 'Hello (RID=1.1.1.1, Neighbors=[])', fromR2: null,
    log: 'R1 multicasts a Hello to 224.0.0.5. The packet carries R1\'s Router ID, Area ID, Hello/Dead timers, and an empty neighbors-seen list.' },
  { state: '2-WAY',    fromR1: null, fromR2: 'Hello (RID=2.2.2.2, Neighbors=[1.1.1.1])',
    log: 'R2 replies with a Hello listing R1 in the Neighbors Seen field. R1 sees itself — bidirectional communication confirmed. On a broadcast LAN, DR/BDR election happens here.' },
  { state: 'EXSTART',  fromR1: 'DBD (seq=100, I=1, MS=1)', fromR2: 'DBD (seq=200, I=1, MS=1)',
    log: 'Both routers send empty DBD packets claiming Master. The higher RID wins — R2 (2.2.2.2) becomes Master and controls the sequence number space.' },
  { state: 'EXCHANGE', fromR1: 'DBD (LSA headers, seq=201)', fromR2: 'DBD (LSA headers, seq=201)',
    log: 'Routers exchange DBD packets listing LSA headers from their LSDBs. Each builds a list of missing or stale LSAs it needs to request.' },
  { state: 'LOADING',  fromR1: 'LSR / LSU / LSAck', fromR2: 'LSR / LSU / LSAck',
    log: 'Link-State Requests (LSR) are sent for needed LSAs. The neighbor replies with Link-State Updates (LSU). LSAcks confirm delivery. Retransmit timers fire if no Ack arrives.' },
  { state: 'FULL',     fromR1: null, fromR2: null,
    log: 'LSDBs are synchronized. Both routers are fully adjacent. SPF (Dijkstra) runs and routes are installed into the routing table. Hellos continue every 10s to maintain the adjacency.' },
];

const STATE_COLORS_MAP: Record<string, string> = {
  DOWN: 'danger', INIT: 'textMuted', '2-WAY': 'textSecondary',
  EXSTART: 'warning', EXCHANGE: 'warning', LOADING: 'accent', FULL: 'success',
};

const NODES = [
  { id: 'R1', rid: '1.1.1.1', role: 'ABR',      areas: ['0','1'], x: 210, y: 120 },
  { id: 'R2', rid: '2.2.2.2', role: 'ABR',      areas: ['0','2'], x: 390, y: 120 },
  { id: 'R3', rid: '3.3.3.3', role: 'Internal', areas: ['1'],     x: 130, y: 265 },
  { id: 'R4', rid: '4.4.4.4', role: 'Internal', areas: ['1'],     x: 130, y: 345 },
  { id: 'R5', rid: '5.5.5.5', role: 'ASBR',     areas: ['2'],     x: 470, y: 265 },
];

const LINKS = [
  { a: 'R1', b: 'R2', cost: 10, area: '0' },
  { a: 'R1', b: 'R3', cost: 5,  area: '1' },
  { a: 'R3', b: 'R4', cost: 3,  area: '1' },
  { a: 'R2', b: 'R5', cost: 20, area: '2' },
];

type NodeState = 'confirmed' | 'tentative' | 'unvisited';
interface SpfStep { costs: Record<string,number>; states: Record<string,NodeState>; processing: string|null; desc: string; }

function computeSpf(source: string): SpfStep[] {
  const adj: Record<string, {to:string;cost:number}[]> = {
    R1:[{to:'R2',cost:10},{to:'R3',cost:5}],
    R2:[{to:'R1',cost:10},{to:'R5',cost:20}],
    R3:[{to:'R1',cost:5},{to:'R4',cost:3}],
    R4:[{to:'R3',cost:3}],
    R5:[{to:'R2',cost:20}],
  };
  const ids = ['R1','R2','R3','R4','R5'];
  const costs: Record<string,number> = {};
  const states: Record<string,NodeState> = {};
  for (const n of ids) { costs[n] = n===source ? 0 : Infinity; states[n] = n===source ? 'tentative' : 'unvisited'; }
  const confirmed = new Set<string>();
  const steps: SpfStep[] = [];
  const srcNode = NODES.find(n=>n.id===source)!;
  steps.push({ costs:{...costs}, states:{...states}, processing:null,
    desc:`SPF started from ${source} (RID ${srcNode.rid}). Self cost = 0; all others = ∞.` });
  while (confirmed.size < ids.length) {
    let minNode: string|null = null, minCost = Infinity;
    for (const n of ids) if (!confirmed.has(n) && costs[n] < minCost) { minCost=costs[n]; minNode=n; }
    if (!minNode || minCost===Infinity) break;
    confirmed.add(minNode);
    states[minNode] = 'confirmed';
    const updates: string[] = [];
    for (const {to,cost} of adj[minNode]||[]) {
      if (!confirmed.has(to)) {
        const nc = costs[minNode]+cost;
        if (nc < costs[to]) {
          costs[to]=nc;
          if (states[to]==='unvisited') states[to]='tentative';
          updates.push(`${to}: ${costs[to]===Infinity?'∞':costs[to]-cost+'+'+cost}→${nc}`);
        }
      }
    }
    steps.push({ costs:{...costs}, states:{...states}, processing:minNode,
      desc:`Confirm ${minNode} (cost ${minCost}). ${updates.length ? 'Update: '+updates.join(', ')+'.' : 'No cheaper paths for neighbors.'}` });
  }
  steps.push({ costs:{...costs}, states:{...states}, processing:null,
    desc:`SPF complete. Costs from ${source}: `+ids.map(n=>`${n}=${costs[n]===Infinity?'∞':costs[n]}`).join(', ')+'.' });
  return steps;
}

export const OspfLab: React.FC<OspfLabProps> = ({ isDarkMode = true }) => {
  const [tab, setTab] = useState<OspfTab>('adjacency');
  const [adjStep, setAdjStep] = useState(0);
  const [spfSource, setSpfSource] = useState('R1');
  const [spfStep, setSpfStep] = useState(0);
  const T = getLabTheme(isDarkMode);

  const spfSteps = computeSpf(spfSource);
  const cur = spfSteps[Math.min(spfStep, spfSteps.length-1)];
  const adj = ADJ_STEPS[adjStep];

  const areaColor = (a: string) => a==='0' ? T.accent : a==='1' ? T.success : T.warning;
  const roleColor = (r: string) => r==='ABR' ? T.accent : r==='ASBR' ? T.warning : T.textSecondary;
  const nodeColor = (s: NodeState) => s==='confirmed' ? T.success : s==='tentative' ? T.warning : T.textMuted;
  const stateColor = (s: string): string => {
    const key = STATE_COLORS_MAP[s] as keyof ReturnType<typeof getLabTheme>;
    return (T[key] as string) ?? T.textMuted;
  };
  const gp = (id: string) => NODES.find(n=>n.id===id)!;

  return (
    <div style={{ padding:'2rem', backgroundColor:T.cardBg, borderRadius:'12px', border:T.border, color:T.textPrimary, fontFamily:'system-ui,sans-serif' }}>

      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:T.border }}>
        <h3 style={{ fontSize:'1.25rem', fontWeight:700, margin:0 }}>OSPF Visualiser</h3>
        <p style={{ color:T.textSecondary, margin:'4px 0 0', fontSize:'0.875rem' }}>
          Explore neighbor adjacency formation, multi-area LSA design, and Dijkstra SPF calculation.
        </p>
      </div>

      <div style={{ display:'flex', gap:'4px', marginBottom:'1.5rem', backgroundColor:T.panelBg, padding:'3px', borderRadius:'8px', border:T.border }}>
        {(['adjacency','areas','spf'] as const).map((t,i) => (
          <button key={t} type="button" onClick={()=>setTab(t)} style={{ flex:1, padding:'8px', fontWeight:700, fontSize:'0.8rem', border:'none', borderRadius:'6px', cursor:'pointer', backgroundColor:tab===t?T.accent:'transparent', color:tab===t?'#fff':T.textSecondary, transition:'all 0.12s' }}>
            {['Neighbor Adjacency','Areas & LSAs','SPF Calculation'][i]}
          </button>
        ))}
      </div>

      {/* ── TAB 1: ADJACENCY ── */}
      {tab==='adjacency' && (
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 360px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ textAlign:'center' }}>
              <span style={{ display:'inline-block', padding:'4px 20px', borderRadius:'20px', fontFamily:'monospace', fontWeight:800, fontSize:'1rem', backgroundColor:`${stateColor(adj.state)}18`, border:`2px solid ${stateColor(adj.state)}`, color:stateColor(adj.state) }}>
                {adj.state}
              </span>
            </div>

            <div style={{ backgroundColor:T.insetBg, border:T.border, borderRadius:'12px', padding:'2rem 1rem', display:'grid', gridTemplateColumns:'1fr 1.4fr 1fr', alignItems:'center', gap:'0.75rem', minHeight:160 }}>
              <div style={{ textAlign:'center', padding:'12px 8px', borderRadius:'8px', backgroundColor:T.panelBg, border:`2px solid ${adjStep>=1?T.accent:T.borderColor}` }}>
                <div style={{ fontSize:'1.6rem' }}>🎛️</div>
                <div style={{ fontSize:'0.75rem', fontWeight:700, marginTop:4 }}>R1</div>
                <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted }}>1.1.1.1</div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'center' }}>
                {adj.fromR1 && (
                  <div style={{ width:'100%', textAlign:'center' }}>
                    <div style={{ fontSize:'0.58rem', fontFamily:'monospace', fontWeight:700, color:T.accent, backgroundColor:T.accentSubtle, border:`1px solid ${T.borderColor}`, borderRadius:'4px', padding:'3px 5px', marginBottom:'2px', wordBreak:'break-all' }}>{adj.fromR1}</div>
                    <div style={{ fontSize:'1rem', color:T.accent }}>→</div>
                  </div>
                )}
                {adj.fromR2 && (
                  <div style={{ width:'100%', textAlign:'center' }}>
                    <div style={{ fontSize:'1rem', color:T.success }}>←</div>
                    <div style={{ fontSize:'0.58rem', fontFamily:'monospace', fontWeight:700, color:T.success, backgroundColor:T.successSubtle, border:`1px solid ${T.borderColor}`, borderRadius:'4px', padding:'3px 5px', marginTop:'2px', wordBreak:'break-all' }}>{adj.fromR2}</div>
                  </div>
                )}
                {!adj.fromR1 && !adj.fromR2 && <span style={{ color:T.borderColor, fontSize:'1.5rem' }}>···</span>}
              </div>

              <div style={{ textAlign:'center', padding:'12px 8px', borderRadius:'8px', backgroundColor:T.panelBg, border:`2px solid ${adjStep>=2?T.success:T.borderColor}` }}>
                <div style={{ fontSize:'1.6rem' }}>🎛️</div>
                <div style={{ fontSize:'0.75rem', fontWeight:700, marginTop:4 }}>R2</div>
                <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted }}>2.2.2.2</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:'3px' }}>
              {ADJ_STEPS.map((s,i) => (
                <div key={i} onClick={()=>setAdjStep(i)} style={{ flex:1, cursor:'pointer' }}>
                  <div style={{ height:4, borderRadius:2, backgroundColor:i<=adjStep?stateColor(s.state):T.borderColor, marginBottom:3, transition:'background-color 0.3s' }} />
                  <div style={{ fontSize:'0.5rem', textAlign:'center', color:i===adjStep?stateColor(s.state):T.textMuted, fontWeight:i===adjStep?800:400 }}>{s.state}</div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              <button type="button" onClick={()=>setAdjStep(p=>Math.max(0,p-1))} disabled={adjStep===0} style={{ flex:1, padding:'0.65rem', borderRadius:'6px', border:`1px solid ${T.borderColor}`, backgroundColor:'transparent', color:adjStep===0?T.textMuted:T.textSecondary, cursor:adjStep===0?'not-allowed':'pointer', fontWeight:600, fontSize:'0.85rem' }}>Back</button>
              {adjStep<ADJ_STEPS.length-1
                ? <button type="button" onClick={()=>setAdjStep(p=>p+1)} style={{ flex:2, padding:'0.7rem', borderRadius:'6px', border:'none', backgroundColor:T.accent, color:'#fff', cursor:'pointer', fontWeight:700 }}>Next step</button>
                : <button type="button" onClick={()=>setAdjStep(0)} style={{ flex:2, padding:'0.7rem', borderRadius:'6px', border:'none', backgroundColor:T.success, color:'#fff', cursor:'pointer', fontWeight:700 }}>Adjacency formed — Reset</button>
              }
            </div>
          </div>

          <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ backgroundColor:T.termBg, padding:'1.25rem', borderRadius:'8px', border:`1px solid ${T.termBorder}`, flexGrow:1 }}>
              <div style={{ fontSize:'0.7rem', fontFamily:'monospace', color:T.termMuted, borderBottom:`1px solid ${T.termBorder}`, paddingBottom:'4px', marginBottom:'10px', fontWeight:700 }}>
                OSPF ADJACENCY LOG — Step {adjStep+1}/{ADJ_STEPS.length}
              </div>
              <div style={{ fontFamily:'monospace', fontSize:'0.82rem', color:T.termText, lineHeight:1.6 }}>{adj.log}</div>
            </div>
            <div style={{ backgroundColor:T.panelBg, padding:'1rem', borderRadius:'8px', border:T.border }}>
              <h4 style={{ margin:'0 0 8px', fontSize:'0.85rem', fontWeight:700, color:T.accent }}>Hello packet parameters</h4>
              {[['Hello interval','10s (broadcast) / 30s (NBMA)'],['Dead interval','40s (4× hello)'],['All OSPF routers','224.0.0.5'],['All DR routers','224.0.0.6'],['Must match to form adj.','Area ID, timers, MTU']].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:'8px', fontSize:'0.75rem', marginBottom:'4px' }}>
                  <span style={{ color:T.textMuted }}>{k}</span>
                  <span style={{ fontFamily:'monospace', color:T.textPrimary, textAlign:'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: AREAS & LSAs ── */}
      {tab==='areas' && (
        <div>
          <div style={{ backgroundColor:T.insetBg, border:T.border, borderRadius:'12px', padding:'1rem', marginBottom:'1.5rem', overflowX:'auto' }}>
            <svg viewBox="0 0 560 430" style={{ width:'100%', maxWidth:560, display:'block', margin:'0 auto' }}>
              {/* Area regions */}
              <rect x="155" y="72" width="280" height="90" rx="10" fill={`${areaColor('0')}12`} stroke={areaColor('0')} strokeWidth="1.5" strokeDasharray="6 3" />
              <text x="300" y="88" textAnchor="middle" fontSize="10" fontWeight="700" fill={areaColor('0')}>Area 0 — Backbone</text>
              <rect x="70" y="82" width="190" height="290" rx="10" fill={`${areaColor('1')}0c`} stroke={areaColor('1')} strokeWidth="1.5" strokeDasharray="6 3" />
              <text x="162" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill={areaColor('1')}>Area 1</text>
              <rect x="350" y="82" width="180" height="215" rx="10" fill={`${areaColor('2')}0c`} stroke={areaColor('2')} strokeWidth="1.5" strokeDasharray="6 3" />
              <text x="440" y="97" textAnchor="middle" fontSize="10" fontWeight="700" fill={areaColor('2')}>Area 2</text>
              {/* Internet cloud */}
              <ellipse cx="470" cy="375" rx="50" ry="22" fill={`${T.borderColor}20`} stroke={T.borderColor} strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="470" y="379" textAnchor="middle" fontSize="10" fill={T.textMuted}>Internet</text>
              {/* Links */}
              {LINKS.map(l => { const a=gp(l.a),b=gp(l.b),mx=(a.x+b.x)/2,my=(a.y+b.y)/2; return (
                <g key={`${l.a}-${l.b}`}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={areaColor(l.area)} strokeWidth="2.5" />
                  <rect x={mx-15} y={my-9} width={30} height={16} rx={4} fill={T.insetBg} stroke={areaColor(l.area)} strokeWidth="1" />
                  <text x={mx} y={my+4} textAnchor="middle" fontSize="9" fontWeight="700" fill={areaColor(l.area)}>cost {l.cost}</text>
                </g>
              ); })}
              {/* ASBR to Internet (Type 5 LSA) */}
              <line x1="470" y1="265" x2="470" y2="353" stroke={T.textMuted} strokeWidth="1.5" strokeDasharray="5 3" />
              <rect x="478" y="296" width="38" height="14" rx="3" fill={T.panelBg} stroke={T.danger} strokeWidth="1" />
              <text x="497" y="306" textAnchor="middle" fontSize="8" fontWeight="700" fill={T.danger}>Type 5</text>
              {/* Nodes */}
              {NODES.map(n => (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r="22" fill={T.panelBg} stroke={roleColor(n.role)} strokeWidth="2.5" />
                  <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.textPrimary}>{n.id}</text>
                  <text x={n.x} y={n.y+35} textAnchor="middle" fontSize="9" fill={roleColor(n.role)} fontWeight="700">{n.role}</text>
                  <text x={n.x} y={n.y+46} textAnchor="middle" fontSize="8" fill={T.textMuted} fontFamily="monospace">{n.rid}</text>
                </g>
              ))}
            </svg>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
            {[
              { type:'Type 1', name:'Router LSA',   color:T.success, desc:'Every router generates one per area. Describes its interfaces, link types, and OSPF costs. Flooded only within the originating area.' },
              { type:'Type 2', name:'Network LSA',  color:T.accent,  desc:'The Designated Router (DR) generates this on broadcast/NBMA segments. Lists all routers on that LAN. Flooded within the area.' },
              { type:'Type 3', name:'Summary LSA',  color:T.warning, desc:'ABRs generate these when crossing area boundaries. Summarises inter-area prefixes. Enables routing between areas without full LSDB visibility.' },
              { type:'Type 5', name:'External LSA', color:T.danger,  desc:'ASBRs generate these for routes redistributed from outside OSPF (BGP, static, EIGRP). Flooded AS-wide — blocked by stub areas.' },
            ].map(lsa=>(
              <div key={lsa.type} style={{ backgroundColor:T.panelBg, border:T.border, borderRadius:'8px', padding:'1rem', borderLeft:`4px solid ${lsa.color}` }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'6px' }}>
                  <span style={{ fontFamily:'monospace', fontSize:'0.7rem', fontWeight:800, color:lsa.color }}>{lsa.type}</span>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, color:T.textPrimary }}>{lsa.name}</span>
                </div>
                <p style={{ margin:0, fontSize:'0.75rem', color:T.textSecondary, lineHeight:1.5 }}>{lsa.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem', borderTop:T.border, paddingTop:'1.5rem' }}>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.accent }}>Why multi-area OSPF?</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>Single-area OSPF floods every LSA to every router. In large networks the LSDB and SPF runtime grow prohibitively. Areas limit flooding scope — only Type 3 summaries cross boundaries, massively reducing per-router database size.</p></div>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.warning }}>DR / BDR Election</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>On broadcast LANs, full adjacency forms only with the DR and BDR — not between all pairs. This reduces O(n²) adjacencies to O(n). Winner: highest OSPF priority (default 1), then highest Router ID. Priority 0 = ineligible.</p></div>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.success }}>Stub Areas</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>A stub area blocks Type 5 External LSAs and substitutes a default route from the ABR. A totally-stubby area also blocks Type 3 summaries. Ideal for branch sites that need only a default path out.</p></div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SPF ── */}
      {tab==='spf' && (
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 360px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', gap:'6px', alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase' }}>SPF root:</span>
              {NODES.map(n=>(
                <button key={n.id} type="button" onClick={()=>{ setSpfSource(n.id); setSpfStep(0); }}
                  style={{ padding:'4px 10px', borderRadius:'4px', border:`1px solid ${spfSource===n.id?T.accent:T.borderColor}`, backgroundColor:spfSource===n.id?T.accentSubtle:'transparent', color:spfSource===n.id?T.accent:T.textSecondary, fontWeight:spfSource===n.id?700:400, fontSize:'0.78rem', cursor:'pointer' }}>
                  {n.id}
                </button>
              ))}
            </div>

            <div style={{ backgroundColor:T.insetBg, border:T.border, borderRadius:'12px', padding:'1rem', overflowX:'auto' }}>
              <svg viewBox="0 0 560 430" style={{ width:'100%', maxWidth:560, display:'block', margin:'0 auto' }}>
                {LINKS.map(l=>{ const a=gp(l.a),b=gp(l.b),both=cur.states[l.a]==='confirmed'&&cur.states[l.b]==='confirmed',mx=(a.x+b.x)/2,my=(a.y+b.y)/2; return (
                  <g key={`${l.a}-${l.b}`}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={both?T.success:T.borderColor} strokeWidth={both?3:1.5} strokeDasharray={both?'0':'5 3'} style={{ transition:'stroke 0.3s' }} />
                    <rect x={mx-15} y={my-9} width={30} height={16} rx={4} fill={T.insetBg} stroke={T.borderColor} strokeWidth="1" />
                    <text x={mx} y={my+4} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.textMuted}>cost {l.cost}</text>
                  </g>
                ); })}
                {NODES.map(n=>{ const st=cur.states[n.id],c=nodeColor(st),cost=cur.costs[n.id],isProc=cur.processing===n.id; return (
                  <g key={n.id}>
                    {isProc&&<circle cx={n.x} cy={n.y} r="28" fill="none" stroke={T.accent} strokeWidth="2" strokeDasharray="4 2" />}
                    <circle cx={n.x} cy={n.y} r="22" fill={T.panelBg} stroke={c} strokeWidth={st==='confirmed'?3:1.5} style={{ transition:'all 0.3s' }} />
                    <text x={n.x} y={n.y+4} textAnchor="middle" fontSize="12" fontWeight="800" fill={T.textPrimary}>{n.id}</text>
                    <rect x={n.x-18} y={n.y+27} width={36} height={16} rx={4} fill={st==='confirmed'?T.successSubtle:st==='tentative'?T.warningSubtle:T.panelBg} stroke={c} strokeWidth="1" />
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

            <div style={{ display:'flex', gap:'8px' }}>
              <button type="button" onClick={()=>setSpfStep(0)} disabled={spfStep===0} style={{ padding:'0.6rem 0.8rem', borderRadius:'6px', border:`1px solid ${T.borderColor}`, backgroundColor:'transparent', color:spfStep===0?T.textMuted:T.textSecondary, cursor:spfStep===0?'not-allowed':'pointer', fontSize:'0.8rem' }}>Reset</button>
              <button type="button" onClick={()=>setSpfStep(p=>Math.max(0,p-1))} disabled={spfStep===0} style={{ flex:1, padding:'0.65rem', borderRadius:'6px', border:`1px solid ${T.borderColor}`, backgroundColor:'transparent', color:spfStep===0?T.textMuted:T.textSecondary, cursor:spfStep===0?'not-allowed':'pointer', fontWeight:600 }}>Back</button>
              {spfStep<spfSteps.length-1
                ? <button type="button" onClick={()=>setSpfStep(p=>p+1)} style={{ flex:2, padding:'0.7rem', borderRadius:'6px', border:'none', backgroundColor:T.accent, color:'#fff', cursor:'pointer', fontWeight:700 }}>Next step</button>
                : <button type="button" onClick={()=>setSpfStep(0)} style={{ flex:2, padding:'0.7rem', borderRadius:'6px', border:'none', backgroundColor:T.success, color:'#fff', cursor:'pointer', fontWeight:700 }}>SPF Complete — Reset</button>
              }
            </div>
          </div>

          <div style={{ flex:'1 1 240px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ backgroundColor:T.termBg, padding:'1.25rem', borderRadius:'8px', border:`1px solid ${T.termBorder}` }}>
              <div style={{ fontSize:'0.7rem', fontFamily:'monospace', color:T.termMuted, borderBottom:`1px solid ${T.termBorder}`, paddingBottom:'4px', marginBottom:'10px', fontWeight:700 }}>
                DIJKSTRA LOG — Step {spfStep+1}/{spfSteps.length}
              </div>
              <div style={{ fontFamily:'monospace', fontSize:'0.8rem', color:T.termText, lineHeight:1.6 }}>{cur.desc}</div>
            </div>

            <div style={{ backgroundColor:T.panelBg, borderRadius:'8px', border:T.border, overflow:'hidden' }}>
              <div style={{ padding:'8px 12px', borderBottom:T.border }}>
                <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase' }}>Cost Table from {spfSource}</span>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:'monospace', fontSize:'0.78rem' }}>
                <thead><tr style={{ backgroundColor:T.insetBg }}>
                  {['Router','RID','Cost','State'].map(h=><th key={h} style={{ padding:'6px 10px', textAlign:'left', color:T.textMuted, fontWeight:700, borderBottom:T.border }}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {NODES.map(n=>{ const st=cur.states[n.id],c=nodeColor(st),cost=cur.costs[n.id]; return (
                    <tr key={n.id} style={{ backgroundColor:cur.processing===n.id?T.accentSubtle:'transparent', transition:'background-color 0.3s' }}>
                      <td style={{ padding:'7px 10px', fontWeight:700, borderBottom:T.border, color:T.textPrimary }}>{n.id}</td>
                      <td style={{ padding:'7px 10px', color:T.textMuted, borderBottom:T.border, fontSize:'0.7rem' }}>{n.rid}</td>
                      <td style={{ padding:'7px 10px', color:cost===Infinity?T.textMuted:T.accent, fontWeight:700, borderBottom:T.border }}>{cost===Infinity?'∞':cost}</td>
                      <td style={{ padding:'7px 10px', borderBottom:T.border }}>
                        <span style={{ fontSize:'0.65rem', fontWeight:700, color:c, backgroundColor:`${c}18`, padding:'2px 6px', borderRadius:'4px' }}>{st}</span>
                      </td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>

            <div style={{ backgroundColor:T.panelBg, padding:'1rem', borderRadius:'8px', border:T.border }}>
              <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:T.accent }}>OSPF Cost Formula</h4>
              <div style={{ fontFamily:'monospace', fontSize:'0.8rem', color:T.textPrimary, backgroundColor:T.insetBg, padding:'8px 10px', borderRadius:'4px', marginBottom:'8px' }}>cost = reference BW ÷ interface BW</div>
              <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.5 }}>Default reference = 100 Mbps. FastEthernet and GigabitEthernet both get cost 1 with defaults — always set <span style={{ fontFamily:'monospace', color:T.accent }}>auto-cost reference-bandwidth 1000</span> on modern networks.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OspfLab;
