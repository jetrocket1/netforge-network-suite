import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const QOS_EDU: EduCard[] = [
  { type:'exam', title:'EF Traffic MUST Use LLQ, Not CBWFQ', body:'EF (DSCP 46) requires a strict-priority queue to guarantee bounded latency. Putting EF inside a CBWFQ class gives minimum bandwidth but no latency guarantee — voice MOS degrades under load. LLQ = CBWFQ + one strict priority class. The exam always asks: which queuing mechanism provides delay-bounded service for voice? Answer: LLQ.' },
  { type:'exam', title:'Token Bucket Components on the Exam', body:'CIR = Committed Information Rate (tokens added per second). CBS = Committed Burst Size (bucket depth = max tokens). Tc = time interval (CBS ÷ CIR). Packets cost tokens proportional to their size. Conforming traffic passes immediately; exceeding traffic is either dropped (police) or delayed (shape). Know all three terms for the CompTIA exam.' },
  { type:'exam', title:'Trust Boundary is Set at the Access Edge', body:'The trust boundary determines where DSCP markings are honoured vs re-classified. At the access switch ingress port, untrusted endpoints have their DSCP re-marked to BE (0) via a re-marking policy-map. Trusted ports (IP phones, known devices) have "mls qos trust dscp" applied. Re-marking at the edge protects the entire QoS domain from rogue marking.' },
  { type:'config', title:'Full LLQ Policy-Map for VoIP + Video', body:'Best-practice WAN edge QoS with strict-priority voice, guaranteed video bandwidth, and fair queuing for data.', code:`class-map match-any VOICE
  match dscp ef
class-map match-any VIDEO
  match dscp af41
class-map match-any CRITICAL
  match dscp af31

policy-map WAN-EDGE-OUT
  class VOICE
    priority 128         ! LLQ — strict priority, ms latency
    police rate 128000   ! MUST police PQ to prevent starvation!
  class VIDEO
    bandwidth percent 30
    random-detect dscp-based
  class CRITICAL
    bandwidth percent 20
  class class-default
    fair-queue
    bandwidth percent 25

interface Serial0/1
  service-policy output WAN-EDGE-OUT` },
  { type:'gotcha', title:'Never Leave the Priority Class Unpoliced', body:'An unpoliced LLQ strict-priority class will consume ALL available bandwidth during a burst, starving every other class to zero. Always add a "police" statement to the priority class limited to the committed voice bandwidth. A misconfigured LLQ can cause worse outcomes than no QoS at all — the most dangerous QoS mistake in production.' },
  { type:'gotcha', title:'Classify at the Edge, Not the Core', body:'QoS classification (matching ACLs or DPI) is CPU-intensive. Do it once at the ingress access edge — core and distribution switches should only read the DSCP field and queue accordingly. Classifying in the core causes line-rate performance issues. The rule: Mark once at the edge, honour everywhere in the core.' },
  { type:'realworld', title:'VoIP MOS Score Collapse Without QoS', body:'Mean Opinion Score (MOS) drops below 3.5 (perceptible degradation) when one-way latency exceeds 150ms, jitter exceeds 30ms, or packet loss exceeds 1%. A single 1500B bulk transfer on a 1 Mbps WAN link adds ~12ms serialisation delay — enough to degrade voice. QoS eliminates this by servicing the voice queue first, holding bulk traffic back microseconds.' },
];

interface QosLabProps { isDarkMode?: boolean; }
type QosTab = 'dscp' | 'queues' | 'shaping';
type QueueMode = 'fifo' | 'pq' | 'cbwfq' | 'llq';

const DSCP_ROWS = [
  { name:'CS7',  dscp:56, bin:'111000', phb:'Strict',          cls:'Network',   use:'Routing protocol keepalives (OSPF, BGP)' },
  { name:'CS6',  dscp:48, bin:'110000', phb:'Strict',          cls:'Network',   use:'Network management, SNMP' },
  { name:'EF',   dscp:46, bin:'101110', phb:'Expedited (LLQ)', cls:'Voice',     use:'VoIP RTP, real-time audio' },
  { name:'AF41', dscp:34, bin:'100010', phb:'Assured BW',      cls:'Video',     use:'Video conferencing (Webex, Teams)' },
  { name:'AF31', dscp:26, bin:'011010', phb:'Assured BW',      cls:'Critical',  use:'Call signalling, business apps' },
  { name:'AF21', dscp:18, bin:'010010', phb:'Assured BW',      cls:'Data',      use:'Transactional data, ERP' },
  { name:'AF11', dscp:10, bin:'001010', phb:'Assured BW',      cls:'Bulk',      use:'File transfers, backup' },
  { name:'CS1',  dscp:8,  bin:'001000', phb:'Scavenger',       cls:'Scavenger', use:'Peer-to-peer, non-business traffic' },
  { name:'BE',   dscp:0,  bin:'000000', phb:'Best Effort',     cls:'Default',   use:'Unclassified / internet browsing' },
];

type PktType = 'voice'|'video'|'data'|'bulk';
const PACKETS: {id:number;type:PktType;dscp:number;mark:string}[] = [
  {id:1,type:'voice',dscp:46,mark:'EF'},   {id:2,type:'bulk', dscp:0, mark:'BE'},
  {id:3,type:'video',dscp:34,mark:'AF41'}, {id:4,type:'data', dscp:18,mark:'AF21'},
  {id:5,type:'voice',dscp:46,mark:'EF'},   {id:6,type:'bulk', dscp:0, mark:'BE'},
  {id:7,type:'video',dscp:34,mark:'AF41'}, {id:8,type:'data', dscp:18,mark:'AF21'},
];

const ORDERS: Record<QueueMode, number[]> = {
  fifo:  [1,2,3,4,5,6,7,8],
  pq:    [1,5,3,7,4,8,2,6],
  cbwfq: [1,3,4,5,7,8,2,6],
  llq:   [1,5,3,4,7,8,2,6],
};

const MODE_INFO: Record<QueueMode, {label:string;desc:string;pro:string;con:string;ios:string}> = {
  fifo:  { label:'FIFO',  desc:'First In, First Out — packets leave exactly in arrival order. Zero prioritisation.', pro:'Zero overhead, fully deterministic', con:'Latency-sensitive traffic starves behind large bulk transfers',
    ios:'! FIFO is the default on IOS\n! No explicit config needed\n! All interfaces default to\n! FIFO if no policy applied\n!\ninterface GigabitEthernet0/1\n  ! (no service-policy applied)' },
  pq:    { label:'Priority Queue', desc:'Four strict queues (High/Medium/Normal/Low). High queue must be empty before lower queues are ever served.', pro:'Voice and video always get bandwidth immediately', con:'Low-priority queues can starve completely during sustained bursts',
    ios:'! Legacy PQ — queue-list\nqueue-list 1 protocol ip 1 dscp ef\nqueue-list 1 protocol ip 2 dscp af41\nqueue-list 1 default 3\n!\ninterface GigabitEthernet0/1\n  custom-queue-list 1' },
  cbwfq: { label:'CBWFQ', desc:'Class-Based Weighted Fair Queuing — each class gets a guaranteed bandwidth percentage. No class starves.', pro:'Guaranteed minimum bandwidth per class, no starvation', con:'No strict priority — voice latency still varies with queue depth',
    ios:'class-map VOICE\n  match dscp ef\nclass-map VIDEO\n  match dscp af41\n!\npolicy-map CBWFQ\n  class VOICE\n    bandwidth percent 20\n  class VIDEO\n    bandwidth percent 30\n  class class-default\n    fair-queue' },
  llq:   { label:'LLQ', desc:'Low Latency Queuing — adds a strict priority queue (for voice) on top of CBWFQ. The best of both worlds.', pro:'Voice gets strict priority; all other classes get guaranteed BW', con:'Strict priority class can starve others if misconfigured (police it!)',
    ios:'class-map VOICE\n  match dscp ef\nclass-map VIDEO\n  match dscp af41\n!\npolicy-map LLQ_POLICY\n  class VOICE\n    priority 128  ! strict PQ\n  class VIDEO\n    bandwidth percent 30\n  class class-default\n    fair-queue' },
};

export const QosLab: React.FC<QosLabProps> = ({ isDarkMode = true }) => {
  const [tab,     setTab]     = useState<QosTab>('dscp');
  const [mode,    setMode]    = useState<QueueMode>('fifo');
  const [txStep,  setTxStep]  = useState(0);
  const T = getLabTheme(isDarkMode);

  const typeColor = (t: PktType) =>
    t==='voice' ? '#a855f7' : t==='video' ? T.accent : t==='data' ? T.success : T.textMuted;

  const clsColor = (c: string) =>
    c==='Network'||c==='Scavenger' ? T.danger :
    c==='Voice'   ? '#a855f7' :
    c==='Video'||c==='Critical' ? T.accent :
    c==='Data'    ? T.success :
    c==='Bulk'    ? T.warning : T.textMuted;

  const order = ORDERS[mode];
  const transmitted = order.slice(0, txStep);
  const remaining   = order.slice(txStep);
  const nextPkt     = remaining.length > 0 ? PACKETS.find(p=>p.id===remaining[0]) : null;

  const CBS = 50; const PKT_COST = 10; const CIR_REFILL = 10; const BURST_PACKETS = 10;
  let policyTokens = CBS, shapeTokens = CBS;
  const policyResult: {pkt:number;pass:boolean}[] = [];
  const shapeResult:  {pkt:number;pass:boolean}[] = [];

  for (let i=0;i<BURST_PACKETS;i++) {
    if (policyTokens>=PKT_COST){ policyTokens-=PKT_COST; policyResult.push({pkt:i+1,pass:true}); }
    else policyResult.push({pkt:i+1,pass:false});
  }
  for (let i=0;i<BURST_PACKETS;i++) {
    if (shapeTokens>=PKT_COST){ shapeTokens-=PKT_COST; shapeResult.push({pkt:i+1,pass:true}); }
    else { shapeResult.push({pkt:i+1,pass:false}); shapeTokens=Math.min(CBS,shapeTokens+CIR_REFILL); }
  }

  const polPass=policyResult.filter(r=>r.pass).length, polDrop=policyResult.filter(r=>!r.pass).length;
  const shapPass=shapeResult.filter(r=>r.pass).length,  shapBuf=shapeResult.filter(r=>!r.pass).length;

  const PKT_BOX = (p: {id:number;type:PktType;mark:string}, dim?: boolean) => (
    <div key={p.id} title={`Pkt ${p.id} · DSCP ${PACKETS.find(x=>x.id===p.id)?.dscp} (${p.mark})`}
      style={{ width:44, height:38, borderRadius:6, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, background:`${typeColor(p.type)}22`, border:`2px solid ${typeColor(p.type)}`, opacity:dim?0.35:1, flexShrink:0, transition:'opacity 0.2s' }}>
      <span style={{ fontSize:'0.6rem', fontWeight:800, color:typeColor(p.type) }}>P{p.id}</span>
      <span style={{ fontSize:'0.5rem', color:typeColor(p.type), opacity:0.8 }}>{p.mark}</span>
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes qos-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Premium Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #d29922, #f85149, #a855f7)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#d2992215', border:'1px solid #d2992230', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📊</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>QoS Traffic Management</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Explore DSCP markings, queuing mechanisms, and the critical difference between traffic policing and shaping — with Cisco IOS config output.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'DSCP Rows',val:'9'},{label:'Queue Types',val:'4'},{label:'Tabs',val:'3'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#d29922' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Tab Bar ── */}
        <div style={{ display:'flex', gap:4, marginBottom:'1.5rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}` }}>
          {(['dscp','queues','shaping'] as const).map((t,i)=>(
            <button key={t} type="button" onClick={()=>setTab(t)} style={{ flex:1, padding:'0.45rem', fontWeight:700, fontSize:'0.78rem', border:'none', borderRadius:8, cursor:'pointer', background:tab===t?T.accent:'transparent', color:tab===t?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
              {['DSCP Classification','Queue Mechanisms','Police vs Shape'][i]}
            </button>
          ))}
        </div>

        {/* ── TAB 1: DSCP ── */}
        {tab==='dscp' && (
          <div style={{ animation:'qos-fade 0.25s ease-out' }}>
            <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${T.borderColor}`, marginBottom:'1.5rem' }}>
              <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', gap:5 }}>
                  {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                </div>
                <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>dscp-classification — RFC 2474/2475 Differentiated Services</span>
              </div>
              <div style={{ background:'#0d1117', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
                  <thead>
                    <tr style={{ background:'#161b22' }}>
                      {['DSCP Name','Value','Binary','PHB','Class','Typical Traffic'].map(h=>(
                        <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:'#7ee787', fontFamily:'monospace', fontWeight:700, borderBottom:'1px solid #30363d', whiteSpace:'nowrap', fontSize:'0.68rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DSCP_ROWS.map((r,i)=>(
                      <tr key={r.name} style={{ borderBottom:'1px solid #21262d', background:i%2===0?'transparent':'#161b22' }}>
                        <td style={{ padding:'8px 12px', fontFamily:'monospace', fontWeight:800, color:clsColor(r.cls) }}>{r.name}</td>
                        <td style={{ padding:'8px 12px', fontFamily:'monospace', fontWeight:700, color:'#ffa657' }}>{r.dscp}</td>
                        <td style={{ padding:'8px 12px', fontFamily:'monospace', color:'#8b949e', letterSpacing:'0.12em' }}>{r.bin}</td>
                        <td style={{ padding:'8px 12px', color:'#e6edf3', fontSize:'0.73rem' }}>{r.phb}</td>
                        <td style={{ padding:'8px 12px' }}>
                          <span style={{ fontSize:'0.65rem', fontWeight:700, color:clsColor(r.cls), background:`${clsColor(r.cls)}18`, padding:'2px 8px', borderRadius:10, whiteSpace:'nowrap' }}>{r.cls}</span>
                        </td>
                        <td style={{ padding:'8px 12px', color:'#8b949e', fontSize:'0.73rem' }}>{r.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem' }}>
              {[
                { title:'What is DSCP?', color:T.accent, body:'DSCP (Differentiated Services Code Point) is a 6-bit field in the IP header ToS byte. Routers read this field to decide how to queue, prioritise, and drop packets — without per-flow state, making it highly scalable.' },
                { title:'EF — Expedited Forwarding', color:'#a855f7', body:'EF (DSCP 46) is the gold standard for real-time voice. Traffic marked EF must be served by a strict-priority queue (LLQ) and policed tightly to prevent it starving other classes.' },
                { title:'Trust Boundaries', color:'#d29922', body:'At the network edge, a trust boundary decides whether to honour endpoint markings or re-classify them. Untrusted endpoints are re-marked to BE (0) at the access switch ingress policy.' },
              ].map(c=>(
                <div key={c.title} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${c.color}` }}>
                  <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:c.color }}>{c.title}</h4>
                  <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: QUEUES ── */}
        {tab==='queues' && (
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', animation:'qos-fade 0.25s ease-out' }}>
            <div style={{ flex:'1 1 380px', display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* Mode selector */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
                {(['fifo','pq','cbwfq','llq'] as const).map(m=>(
                  <button key={m} type="button" onClick={()=>{ setMode(m); setTxStep(0); }}
                    style={{ padding:'8px 4px', fontWeight:700, fontSize:'0.72rem', border:`1px solid ${mode===m?T.accent:T.borderColor}`, borderRadius:6, cursor:'pointer', background:mode===m?T.accentSubtle:T.panelBg, color:mode===m?T.accent:T.textSecondary, fontFamily:'inherit' }}>
                    {MODE_INFO[m].label}
                  </button>
                ))}
              </div>

              {/* Mode description */}
              <div style={{ background:T.panelBg, padding:'0.875rem 1rem', borderRadius:8, border:`1px solid ${T.borderColor}`, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.5 }}>
                {MODE_INFO[mode].desc}
                <div style={{ display:'flex', gap:'1rem', marginTop:8, fontSize:'0.75rem' }}>
                  <span style={{ color:T.success }}>+ {MODE_INFO[mode].pro}</span>
                  <span style={{ color:T.danger }}>– {MODE_INFO[mode].con}</span>
                </div>
              </div>

              {/* Packet legend */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontSize:'0.7rem', color:T.textMuted, fontWeight:700 }}>Legend:</span>
                {(['voice','video','data','bulk'] as PktType[]).map(t=>(
                  <span key={t} style={{ fontSize:'0.7rem', fontWeight:700, color:typeColor(t), background:`${typeColor(t)}18`, padding:'2px 8px', borderRadius:10 }}>
                    {t==='voice'?'Voice EF':t==='video'?'Video AF41':t==='data'?'Data AF21':'Bulk BE'}
                  </span>
                ))}
              </div>

              {/* Queue buffer */}
              <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'1rem' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', marginBottom:8 }}>Queue Buffer — {remaining.length} remaining</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', minHeight:50, alignItems:'flex-start' }}>
                  {remaining.length===0
                    ? <span style={{ fontSize:'0.8rem', color:T.textMuted, fontStyle:'italic', alignSelf:'center' }}>Queue empty — all packets transmitted</span>
                    : remaining.map((pid,i)=>{ const p=PACKETS.find(x=>x.id===pid)!; return PKT_BOX(p,i>0&&mode==='pq'&&txStep===0&&i>=2); })
                  }
                </div>
                {nextPkt && (
                  <div style={{ marginTop:8, fontSize:'0.72rem', color:typeColor(nextPkt.type), fontWeight:700 }}>
                    Next: Pkt {nextPkt.id} ({nextPkt.mark} · {nextPkt.type}) — served because {
                      mode==='fifo'   ? 'it arrived first' :
                      mode==='pq'     ? `${nextPkt.type} class has highest priority` :
                      mode==='cbwfq'  ? `${nextPkt.type} class has remaining bandwidth allocation` :
                      nextPkt.type==='voice' ? 'voice is in the strict priority queue' : `${nextPkt.type} class has remaining CBWFQ allocation`
                    }
                  </div>
                )}
              </div>

              {/* Transmitted */}
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'1rem' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', marginBottom:8 }}>Transmitted — {transmitted.length} packets</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', minHeight:42 }}>
                  {transmitted.length===0
                    ? <span style={{ fontSize:'0.8rem', color:T.textMuted, fontStyle:'italic', alignSelf:'center' }}>None yet</span>
                    : transmitted.map(pid=>{ const p=PACKETS.find(x=>x.id===pid)!; return PKT_BOX(p); })
                  }
                </div>
              </div>

              {/* Controls */}
              <div style={{ display:'flex', gap:8 }}>
                <button type="button" onClick={()=>setTxStep(0)} disabled={txStep===0} style={{ padding:'0.6rem 0.8rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:txStep===0?T.textMuted:T.textSecondary, cursor:txStep===0?'not-allowed':'pointer', fontFamily:'inherit' }}>Reset</button>
                {txStep<order.length
                  ? <button type="button" onClick={()=>setTxStep(p=>p+1)} style={{ flex:1, padding:'0.65rem', borderRadius:8, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>Transmit next packet</button>
                  : <button type="button" onClick={()=>setTxStep(0)} style={{ flex:1, padding:'0.65rem', borderRadius:8, border:'none', background:'#3fb950', color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>All transmitted — Reset</button>
                }
              </div>
            </div>

            {/* Right: IOS terminal */}
            <div style={{ flex:'1 1 240px', display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Mode selector cards */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {(['fifo','pq','cbwfq','llq'] as const).map(m=>(
                  <div key={m} onClick={()=>{ setMode(m); setTxStep(0); }} style={{ padding:'8px 12px', borderRadius:8, background:mode===m?T.accentSubtle:T.cardBg, border:`1px solid ${mode===m?T.accent:T.borderColor}`, cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:800, color:mode===m?T.accent:T.textSecondary, marginBottom:2 }}>{MODE_INFO[m].label}</div>
                    <div style={{ fontSize:'0.65rem', color:T.textMuted, lineHeight:1.4 }}>{MODE_INFO[m].desc.split('—')[0].trim()}</div>
                  </div>
                ))}
              </div>

              {/* IOS config terminal */}
              <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${T.accent}40`, flex:1 }}>
                <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:5 }}>
                    {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>ios-config — {MODE_INFO[mode].label}</span>
                </div>
                <div style={{ background:'#0d1117', padding:'1rem 1.25rem' }}>
                  <pre style={{ margin:0, fontSize:'0.68rem', lineHeight:1.75, color:'#e6edf3', fontFamily:'\'Fira Code\',\'Cascadia Code\',monospace', whiteSpace:'pre-wrap' }}>
                    {MODE_INFO[mode].ios.split('\n').map((line,i)=>{
                      const isComment = line.startsWith('!');
                      const isClass   = line.startsWith('class');
                      const isPolicy  = line.startsWith('policy') || line.startsWith('interface');
                      return (
                        <span key={i} style={{ color: isComment?'#8b949e':isClass?'#7ee787':isPolicy?'#4493f8':'#e6edf3', display:'block' }}>{line}</span>
                      );
                    })}
                  </pre>
                </div>
                <div style={{ background:T.cardBg, padding:'0.7rem 1rem', borderTop:`1px solid ${T.borderColor}` }}>
                  <p style={{ margin:0, fontSize:'0.72rem', color:T.textSecondary, lineHeight:1.5 }}>
                    <strong style={{ color:T.textPrimary }}>Tip: </strong>{MODE_INFO[mode].con}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: POLICING vs SHAPING ── */}
        {tab==='shaping' && (
          <div style={{ animation:'qos-fade 0.25s ease-out' }}>
            <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'1rem', marginBottom:'1.5rem', fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>
              <strong style={{ color:T.textPrimary }}>Scenario:</strong> 10 packets arrive simultaneously. Token bucket holds <strong style={{ color:T.accent }}>50 tokens</strong> (CBS). Each packet costs <strong style={{ color:T.accent }}>10 tokens</strong>. CIR refills <strong style={{ color:T.accent }}>10 tokens/interval</strong>. Watch how policing drops vs shaping buffers.
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:'1.5rem', marginBottom:'1.5rem' }}>
              {/* Policing terminal */}
              <div style={{ borderRadius:12, overflow:'hidden', border:`2px solid ${T.danger}` }}>
                <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:5 }}>
                    {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>traffic-policing — drops excess</span>
                </div>
                <div style={{ background:'#0d1117', padding:'1rem 1.25rem' }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:'1rem' }}>
                    {policyResult.map(r=>(
                      <div key={r.pkt} style={{ width:34, height:30, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:800, background:r.pass?'#3fb95018':'#f8514918', border:`1.5px solid ${r.pass?'#3fb950':'#f85149'}`, color:r.pass?'#3fb950':'#f85149' }}>
                        {r.pass?'OK':'DROP'}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'1rem', fontSize:'0.75rem', fontFamily:'monospace' }}>
                    <span><span style={{ color:'#7ee787' }}>pass:</span> <span style={{ color:'#3fb950', fontWeight:700 }}>{polPass}</span></span>
                    <span><span style={{ color:'#7ee787' }}>drop:</span> <span style={{ color:'#f85149', fontWeight:700 }}>{polDrop}</span></span>
                  </div>
                </div>
                <div style={{ background:T.cardBg, padding:'0.75rem 1rem', borderTop:`1px solid ${T.borderColor}`, fontSize:'0.73rem', color:T.textSecondary, lineHeight:1.4 }}>
                  Tokens exhausted → subsequent packets <strong style={{ color:T.danger }}>discarded</strong>. TCP retransmits, reducing throughput.
                </div>
              </div>

              {/* Shaping terminal */}
              <div style={{ borderRadius:12, overflow:'hidden', border:`2px solid ${T.warning}` }}>
                <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:5 }}>
                    {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>traffic-shaping — buffers excess</span>
                </div>
                <div style={{ background:'#0d1117', padding:'1rem 1.25rem' }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:'1rem' }}>
                    {shapeResult.map(r=>(
                      <div key={r.pkt} style={{ width:34, height:30, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:800, background:r.pass?'#3fb95018':'#d2992218', border:`1.5px solid ${r.pass?'#3fb950':'#d29922'}`, color:r.pass?'#3fb950':'#d29922' }}>
                        {r.pass?'OK':'BUF'}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:'1rem', fontSize:'0.75rem', fontFamily:'monospace' }}>
                    <span><span style={{ color:'#7ee787' }}>pass:</span> <span style={{ color:'#3fb950', fontWeight:700 }}>{shapPass}</span></span>
                    <span><span style={{ color:'#7ee787' }}>buf: </span> <span style={{ color:'#d29922', fontWeight:700 }}>{shapBuf}</span></span>
                  </div>
                </div>
                <div style={{ background:T.cardBg, padding:'0.75rem 1rem', borderTop:`1px solid ${T.borderColor}`, fontSize:'0.73rem', color:T.textSecondary, lineHeight:1.4 }}>
                  Excess packets <strong style={{ color:T.warning }}>buffered</strong>, released as tokens refill. No data loss — but added latency.
                </div>
              </div>
            </div>

            {/* Token bucket explanation */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1.25rem', marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', marginBottom:12, letterSpacing:'0.05em' }}>Token Bucket Model</div>
              <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap', alignItems:'flex-start' }}>
                <div style={{ flex:'0 0 auto', textAlign:'center' }}>
                  <div style={{ width:70, height:90, border:`2px solid ${T.borderColor}`, borderRadius:'0 0 8px 8px', borderTop:'none', position:'relative', overflow:'hidden', margin:'0 auto 6px' }}>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, background:T.accentSubtle, borderTop:`2px solid ${T.accent}`, height:'100%', transition:'height 0.4s' }} />
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800, color:T.accent }}>50</div>
                  </div>
                  <div style={{ fontSize:'0.65rem', color:T.textMuted }}>Token Bucket</div>
                  <div style={{ fontSize:'0.6rem', color:T.accent, marginTop:2 }}>CBS = 50</div>
                </div>
                <div style={{ flex:1, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.7, minWidth:180 }}>
                  <div><span style={{ color:T.accent, fontFamily:'monospace', fontWeight:700 }}>CIR</span> — Committed Information Rate: tokens added per interval (10/interval)</div>
                  <div><span style={{ color:T.accent, fontFamily:'monospace', fontWeight:700 }}>CBS</span> — Committed Burst Size: max tokens the bucket can hold (50)</div>
                  <div><span style={{ color:T.accent, fontFamily:'monospace', fontWeight:700 }}>Cost </span> — tokens consumed per packet (10 = proportional to size)</div>
                  <div style={{ marginTop:8, padding:'8px 10px', background:T.panelBg, borderRadius:6, fontSize:'0.75rem', border:`1px solid ${T.borderColor}` }}>
                    <strong style={{ color:T.textPrimary }}>Enough tokens?</strong> Pass immediately (both modes)<br/>
                    <strong style={{ color:T.danger }}>No tokens (police):</strong> Drop the packet<br/>
                    <strong style={{ color:T.warning }}>No tokens (shape): </strong> Buffer; wait for refill
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem', borderTop:`1px solid ${T.borderColor}`, paddingTop:'1.25rem' }}>
              {[
                { title:'When to Police', color:T.danger, body:'Use policing at network ingress edges to enforce SLA commitments. Also police the strict-priority class in LLQ to prevent voice from starving all other traffic.' },
                { title:'When to Shape', color:T.warning, body:'Use shaping to smooth traffic before WAN egress — where you\'re paying for a specific rate. Prevents upstream policing from dropping your traffic, at the cost of added latency.' },
                { title:'Dual Token Bucket', color:T.success, body:'Advanced implementations use two buckets: CIR (conforming) and PIR (peak). Conforming = green, between CIR and PIR = yellow (may drop under congestion), excess = red.' },
              ].map(c=>(
                <div key={c.title} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${c.color}` }}>
                  <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:c.color }}>{c.title}</h4>
                  <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <LabEduPanel cards={QOS_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default QosLab;
