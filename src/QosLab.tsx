import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface QosLabProps { isDarkMode?: boolean; }
type QosTab = 'dscp' | 'queues' | 'shaping';
type QueueMode = 'fifo' | 'pq' | 'cbwfq' | 'llq';

const DSCP_ROWS = [
  { name:'CS7',  dscp:56, bin:'111000', phb:'Strict',          cls:'Network',  use:'Routing protocol keepalives (OSPF, BGP)' },
  { name:'CS6',  dscp:48, bin:'110000', phb:'Strict',          cls:'Network',  use:'Network management, SNMP' },
  { name:'EF',   dscp:46, bin:'101110', phb:'Expedited (LLQ)', cls:'Voice',    use:'VoIP RTP, real-time audio' },
  { name:'AF41', dscp:34, bin:'100010', phb:'Assured BW',      cls:'Video',    use:'Video conferencing (Webex, Teams)' },
  { name:'AF31', dscp:26, bin:'011010', phb:'Assured BW',      cls:'Critical', use:'Call signalling, business apps' },
  { name:'AF21', dscp:18, bin:'010010', phb:'Assured BW',      cls:'Data',     use:'Transactional data, ERP' },
  { name:'AF11', dscp:10, bin:'001010', phb:'Assured BW',      cls:'Bulk',     use:'File transfers, backup' },
  { name:'CS1',  dscp:8,  bin:'001000', phb:'Scavenger',       cls:'Scavenger',use:'Peer-to-peer, non-business traffic' },
  { name:'BE',   dscp:0,  bin:'000000', phb:'Best Effort',     cls:'Default',  use:'Unclassified / internet browsing' },
];

type PktType = 'voice'|'video'|'data'|'bulk';
const PACKETS: {id:number;type:PktType;dscp:number;mark:string}[] = [
  {id:1,type:'voice',dscp:46,mark:'EF'},
  {id:2,type:'bulk', dscp:0, mark:'BE'},
  {id:3,type:'video',dscp:34,mark:'AF41'},
  {id:4,type:'data', dscp:18,mark:'AF21'},
  {id:5,type:'voice',dscp:46,mark:'EF'},
  {id:6,type:'bulk', dscp:0, mark:'BE'},
  {id:7,type:'video',dscp:34,mark:'AF41'},
  {id:8,type:'data', dscp:18,mark:'AF21'},
];

// Pre-computed transmission order for each queuing mode (1-based packet IDs)
const ORDERS: Record<QueueMode, number[]> = {
  fifo:  [1,2,3,4,5,6,7,8],
  pq:    [1,5,3,7,4,8,2,6],
  cbwfq: [1,3,4,5,7,8,2,6],
  llq:   [1,5,3,4,7,8,2,6],
};

const MODE_INFO: Record<QueueMode, {label:string;desc:string;pro:string;con:string}> = {
  fifo:  { label:'FIFO',  desc:'First In, First Out — packets leave exactly in arrival order. Zero prioritisation.', pro:'Zero overhead, fully deterministic', con:'Latency-sensitive traffic starves behind large bulk transfers' },
  pq:    { label:'Priority Queue',  desc:'Four strict queues (High/Medium/Normal/Low). High queue must be empty before lower queues are ever served.', pro:'Voice and video always get bandwidth immediately', con:'Low-priority queues can starve completely during sustained traffic bursts' },
  cbwfq: { label:'CBWFQ', desc:'Class-Based Weighted Fair Queuing — each class gets a guaranteed bandwidth percentage. No class starves.', pro:'Guaranteed minimum bandwidth per class, no starvation', con:'No strict priority — voice latency still varies with queue depth' },
  llq:   { label:'LLQ',   desc:'Low Latency Queuing — adds a strict priority queue (for voice) on top of CBWFQ. The best of both worlds.', pro:'Voice gets strict priority; all other classes get guaranteed BW', con:'Strict priority class can starve others if misconfigured (police it!)' },
};


export const QosLab: React.FC<QosLabProps> = ({ isDarkMode = true }) => {
  const [tab, setTab]         = useState<QosTab>('dscp');
  const [mode, setMode]       = useState<QueueMode>('fifo');
  const [txStep, setTxStep]   = useState(0);
  const T = getLabTheme(isDarkMode);

  const typeColor = (t: PktType) =>
    t==='voice' ? '#a855f7' : t==='video' ? T.accent : t==='data' ? T.success : T.textMuted;

  const clsColor = (c: string) =>
    c==='Network'  ? T.danger  :
    c==='Voice'    ? '#a855f7' :
    c==='Video'    ? T.accent  :
    c==='Critical' ? T.accent  :
    c==='Data'     ? T.success :
    c==='Bulk'     ? T.warning :
    c==='Scavenger'? T.danger  : T.textMuted;

  const order = ORDERS[mode];
  const transmitted = order.slice(0, txStep);
  const remaining   = order.slice(txStep);
  const nextPkt     = remaining.length > 0 ? PACKETS.find(p=>p.id===remaining[0]) : null;

  // Shaping / Policing simulation
  const CBS = 50; // max tokens (committed burst size)
  let policyTokens = CBS, shapeTokens = CBS;
  const policyResult: {pkt:number;pass:boolean;tokens:number}[] = [];
  const shapeResult:  {pkt:number;pass:boolean;delay:boolean;tokens:number}[] = [];
  const shapeBuf: number[] = [];

  // Simulate 10 arriving packets at CIR=5 per interval (each packet costs 10 tokens)
  const PKT_COST = 10;
  const CIR_REFILL = 10;
  const BURST_PACKETS = 10;

  for (let i=0; i<BURST_PACKETS; i++) {
    if (policyTokens >= PKT_COST) { policyTokens -= PKT_COST; policyResult.push({pkt:i+1,pass:true,tokens:policyTokens}); }
    else { policyResult.push({pkt:i+1,pass:false,tokens:policyTokens}); }
  }
  for (let i=0; i<BURST_PACKETS; i++) {
    if (shapeTokens >= PKT_COST) { shapeTokens -= PKT_COST; shapeResult.push({pkt:i+1,pass:true,delay:false,tokens:shapeTokens}); }
    else { shapeBuf.push(i+1); shapeResult.push({pkt:i+1,pass:false,delay:true,tokens:shapeTokens}); shapeTokens = Math.min(CBS, shapeTokens+CIR_REFILL); }
  }

  const polPass  = policyResult.filter(r=>r.pass).length;
  const polDrop  = policyResult.filter(r=>!r.pass).length;
  const shapPass = shapeResult.filter(r=>r.pass).length;
  const shapBuf  = shapeResult.filter(r=>r.delay).length;


  const PKT_BOX = (p: {id:number;type:PktType;mark:string}, dim?: boolean) => (
    <div key={p.id} title={`Pkt ${p.id} · DSCP ${PACKETS.find(x=>x.id===p.id)?.dscp} (${p.mark})`}
      style={{ width:44, height:38, borderRadius:6, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1, backgroundColor:`${typeColor(p.type)}22`, border:`2px solid ${typeColor(p.type)}`, opacity:dim?0.35:1, flexShrink:0, transition:'opacity 0.2s' }}>
      <span style={{ fontSize:'0.6rem', fontWeight:800, color:typeColor(p.type) }}>P{p.id}</span>
      <span style={{ fontSize:'0.5rem', color:typeColor(p.type), opacity:0.8 }}>{p.mark}</span>
    </div>
  );

  return (
    <div style={{ padding:'2rem', backgroundColor:T.cardBg, borderRadius:'12px', border:T.border, color:T.textPrimary, fontFamily:'system-ui,sans-serif' }}>

      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:T.border }}>
        <h3 style={{ fontSize:'1.25rem', fontWeight:700, margin:0 }}>QoS Traffic Management</h3>
        <p style={{ color:T.textSecondary, margin:'4px 0 0', fontSize:'0.875rem' }}>
          Explore DSCP markings, queuing mechanisms, and the difference between policing and shaping.
        </p>
      </div>

      <div style={{ display:'flex', gap:'4px', marginBottom:'1.5rem', backgroundColor:T.panelBg, padding:'3px', borderRadius:'8px', border:T.border }}>
        {(['dscp','queues','shaping'] as const).map((t,i)=>(
          <button key={t} type="button" onClick={()=>setTab(t)} style={{ flex:1, padding:'8px', fontWeight:700, fontSize:'0.8rem', border:'none', borderRadius:'6px', cursor:'pointer', backgroundColor:tab===t?T.accent:'transparent', color:tab===t?'#fff':T.textSecondary, transition:'all 0.12s' }}>
            {['DSCP Classification','Queue Mechanisms','Police vs Shape'][i]}
          </button>
        ))}
      </div>

      {/* ── TAB 1: DSCP ── */}
      {tab==='dscp' && (
        <div>
          <div style={{ overflowX:'auto', marginBottom:'1.5rem' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor:T.panelBg }}>
                  {['DSCP Name','Value','Binary','PHB','Class','Typical Traffic'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:T.textMuted, fontWeight:700, borderBottom:T.border, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DSCP_ROWS.map((r,i)=>(
                  <tr key={r.name} style={{ borderBottom:T.border, backgroundColor:i%2===0?'transparent':T.panelBg }}>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontWeight:700, color:clsColor(r.cls) }}>{r.name}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', fontWeight:700, color:T.textPrimary }}>{r.dscp}</td>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', color:T.textMuted, letterSpacing:'0.05em' }}>{r.bin}</td>
                    <td style={{ padding:'10px 12px', color:T.textSecondary }}>{r.phb}</td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ fontSize:'0.7rem', fontWeight:700, color:clsColor(r.cls), backgroundColor:`${clsColor(r.cls)}18`, padding:'2px 8px', borderRadius:'10px', whiteSpace:'nowrap' }}>{r.cls}</span>
                    </td>
                    <td style={{ padding:'10px 12px', color:T.textSecondary }}>{r.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem', borderTop:T.border, paddingTop:'1.5rem' }}>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.accent }}>What is DSCP?</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>DSCP (Differentiated Services Code Point) is a 6-bit field in the IP header ToS byte. Routers and switches read this field to decide how to queue, prioritise, and drop packets — without per-flow state.</p></div>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:'#a855f7' }}>EF — Expedited Forwarding</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>EF (DSCP 46) is the gold standard for real-time voice. Traffic marked EF must be served by a strict-priority queue (LLQ) and policed tightly to prevent it starving other classes.</p></div>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.warning }}>Trust Boundaries</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>Endpoints (PCs, phones) can mark their own traffic. At the network edge, a trust boundary decides whether to honour those markings or re-classify them. Untrusted endpoints are usually re-marked to BE (0) at the access switch.</p></div>
          </div>
        </div>
      )}

      {/* ── TAB 2: QUEUES ── */}
      {tab==='queues' && (
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 380px', display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Mode selector */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'4px' }}>
              {(['fifo','pq','cbwfq','llq'] as const).map(m=>(
                <button key={m} type="button" onClick={()=>{ setMode(m); setTxStep(0); }}
                  style={{ padding:'8px 4px', fontWeight:700, fontSize:'0.72rem', border:`1px solid ${mode===m?T.accent:T.borderColor}`, borderRadius:'6px', cursor:'pointer', backgroundColor:mode===m?T.accentSubtle:T.panelBg, color:mode===m?T.accent:T.textSecondary }}>
                  {MODE_INFO[m].label}
                </button>
              ))}
            </div>

            {/* Mode description */}
            <div style={{ backgroundColor:T.panelBg, padding:'0.875rem 1rem', borderRadius:'8px', border:T.border, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.5 }}>
              {MODE_INFO[mode].desc}
              <div style={{ display:'flex', gap:'1rem', marginTop:'8px', fontSize:'0.75rem' }}>
                <span style={{ color:T.success }}>+ {MODE_INFO[mode].pro}</span>
                <span style={{ color:T.danger }}>– {MODE_INFO[mode].con}</span>
              </div>
            </div>

            {/* Packet legend */}
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'0.7rem', color:T.textMuted, fontWeight:700 }}>Legend:</span>
              {(['voice','video','data','bulk'] as PktType[]).map(t=>(
                <span key={t} style={{ fontSize:'0.7rem', fontWeight:700, color:typeColor(t), backgroundColor:`${typeColor(t)}18`, padding:'2px 8px', borderRadius:'10px' }}>
                  {t==='voice'?'Voice EF':t==='video'?'Video AF41':t==='data'?'Data AF21':'Bulk BE'}
                </span>
              ))}
            </div>

            {/* Queue visual */}
            <div style={{ backgroundColor:T.insetBg, border:T.border, borderRadius:'10px', padding:'1rem' }}>
              <div style={{ fontSize:'0.65rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', marginBottom:'8px' }}>
                Queue Buffer — {remaining.length} remaining
              </div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', minHeight:50, alignItems:'flex-start' }}>
                {remaining.length === 0
                  ? <span style={{ fontSize:'0.8rem', color:T.textMuted, fontStyle:'italic', alignSelf:'center' }}>Queue empty — all packets transmitted</span>
                  : remaining.map((pid,i) => {
                      const p = PACKETS.find(x=>x.id===pid)!;
                      return PKT_BOX(p, i>0 && mode==='pq' && txStep===0 && i>=2);
                    })
                }
              </div>
              {nextPkt && (
                <div style={{ marginTop:'8px', fontSize:'0.72rem', color:typeColor(nextPkt.type), fontWeight:700 }}>
                  Next: Pkt {nextPkt.id} ({nextPkt.mark} · {nextPkt.type}) — served because {
                    mode==='fifo' ? 'it arrived first' :
                    mode==='pq'   ? `${nextPkt.type} class has highest priority` :
                    mode==='cbwfq'? `${nextPkt.type} class has remaining bandwidth allocation` :
                    nextPkt.type==='voice' ? 'voice is in the strict priority queue' : `${nextPkt.type} class has remaining CBWFQ allocation`
                  }
                </div>
              )}
            </div>

            {/* Transmitted */}
            <div style={{ backgroundColor:T.panelBg, border:T.border, borderRadius:'10px', padding:'1rem' }}>
              <div style={{ fontSize:'0.65rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', marginBottom:'8px' }}>
                Transmitted — {transmitted.length} packets
              </div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', minHeight:42 }}>
                {transmitted.length === 0
                  ? <span style={{ fontSize:'0.8rem', color:T.textMuted, fontStyle:'italic', alignSelf:'center' }}>None yet</span>
                  : transmitted.map(pid => { const p = PACKETS.find(x=>x.id===pid)!; return PKT_BOX(p); })
                }
              </div>
            </div>

            {/* Controls */}
            <div style={{ display:'flex', gap:'8px' }}>
              <button type="button" onClick={()=>setTxStep(0)} disabled={txStep===0} style={{ padding:'0.6rem 0.8rem', borderRadius:'6px', border:`1px solid ${T.borderColor}`, backgroundColor:'transparent', color:txStep===0?T.textMuted:T.textSecondary, cursor:txStep===0?'not-allowed':'pointer', fontSize:'0.8rem' }}>Reset</button>
              {txStep < order.length
                ? <button type="button" onClick={()=>setTxStep(p=>p+1)} style={{ flex:1, padding:'0.7rem', borderRadius:'6px', border:'none', backgroundColor:T.accent, color:'#fff', cursor:'pointer', fontWeight:700 }}>Transmit next packet</button>
                : <button type="button" onClick={()=>setTxStep(0)} style={{ flex:1, padding:'0.7rem', borderRadius:'6px', border:'none', backgroundColor:T.success, color:'#fff', cursor:'pointer', fontWeight:700 }}>All transmitted — Reset</button>
              }
            </div>
          </div>

          {/* Theory right column */}
          <div style={{ flex:'1 1 240px', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ backgroundColor:T.termBg, padding:'1.25rem', borderRadius:'8px', border:`1px solid ${T.termBorder}` }}>
              <div style={{ fontSize:'0.7rem', fontFamily:'monospace', color:T.termMuted, borderBottom:`1px solid ${T.termBorder}`, paddingBottom:'4px', marginBottom:'10px', fontWeight:700 }}>
                QUEUING MECHANICS
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {['fifo','pq','cbwfq','llq'].map(m=>(
                  <div key={m} style={{ padding:'8px', borderRadius:'6px', backgroundColor:mode===m?T.accentSubtle:'transparent', border:`1px solid ${mode===m?T.accent:T.borderColor}`, transition:'all 0.2s' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:800, color:mode===m?T.accent:T.textSecondary, marginBottom:'3px' }}>{MODE_INFO[m as QueueMode].label}</div>
                    <div style={{ fontSize:'0.68rem', color:T.termMuted, lineHeight:1.4 }}>{MODE_INFO[m as QueueMode].desc.split('—')[0].trim()}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ backgroundColor:T.panelBg, padding:'1rem', borderRadius:'8px', border:T.border }}>
              <h4 style={{ margin:'0 0 8px', fontSize:'0.85rem', fontWeight:700, color:T.accent }}>Cisco IOS Configuration</h4>
              <div style={{ fontFamily:'monospace', fontSize:'0.72rem', backgroundColor:T.termBg, padding:'10px', borderRadius:'6px', color:T.termText, lineHeight:1.6 }}>
                {mode==='llq'&&<><span style={{ color:T.termMuted }}># LLQ policy-map example</span>{'\n'}</>}
                {mode==='llq'&&<><span style={{ color:T.accent }}>policy-map QOS_POLICY</span>{'\n'}</>}
                {mode==='llq'&&<><span style={{ color:T.accent }}> class VOICE</span>{'\n'}</>}
                {mode==='llq'&&<><span>  priority 128</span>{'\n'}</>}
                {mode==='llq'&&<><span style={{ color:T.accent }}> class VIDEO</span>{'\n'}</>}
                {mode==='llq'&&<><span>  bandwidth percent 30</span>{'\n'}</>}
                {mode==='llq'&&<><span style={{ color:T.accent }}> class class-default</span>{'\n'}</>}
                {mode==='llq'&&<><span>  fair-queue</span></>}
                {mode==='cbwfq'&&<><span style={{ color:T.termMuted }}># CBWFQ example</span>{'\n'}</>}
                {mode==='cbwfq'&&<><span style={{ color:T.accent }}>class-map VOICE</span>{'\n'}</>}
                {mode==='cbwfq'&&<><span> match dscp ef</span>{'\n'}</>}
                {mode==='cbwfq'&&<><span style={{ color:T.accent }}>policy-map CBWFQ</span>{'\n'}</>}
                {mode==='cbwfq'&&<><span style={{ color:T.accent }}> class VOICE</span>{'\n'}</>}
                {mode==='cbwfq'&&<><span>  bandwidth percent 20</span></>}
                {mode==='pq'&&<span style={{ color:T.termMuted }}># PQ uses 4 hardcoded queues{'\n'}# (High/Med/Normal/Low){'\n'}# Configured via queue-list{'\n'}queue-list 1 protocol ip 1{'\n'} dscp ef</span>}
                {mode==='fifo'&&<span style={{ color:T.termMuted }}># FIFO is the default{'\n'}# No explicit config needed{'\n'}# All interfaces default to{'\n'}# FIFO if no policy applied</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: POLICING vs SHAPING ── */}
      {tab==='shaping' && (
        <div>
          <div style={{ backgroundColor:T.panelBg, border:T.border, borderRadius:'8px', padding:'1rem', marginBottom:'1.5rem', fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>
            <strong style={{ color:T.textPrimary }}>Scenario:</strong> 10 packets arrive simultaneously (a burst). The token bucket holds <strong style={{ color:T.accent }}>50 tokens</strong> (CBS). Each packet costs <strong style={{ color:T.accent }}>10 tokens</strong>. The CIR refills <strong style={{ color:T.accent }}>10 tokens</strong> per interval. Watch what policing and shaping do differently.
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))', gap:'1.5rem', marginBottom:'1.5rem' }}>
            {/* Policing */}
            <div style={{ backgroundColor:T.insetBg, border:`2px solid ${T.danger}`, borderRadius:'10px', padding:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div style={{ fontWeight:800, fontSize:'0.9rem', color:T.danger }}>Traffic Policing</div>
                <span style={{ fontSize:'0.68rem', fontWeight:700, color:T.danger, backgroundColor:T.dangerSubtle, padding:'2px 8px', borderRadius:'10px' }}>Drops excess</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'1rem' }}>
                {policyResult.map(r=>(
                  <div key={r.pkt} style={{ width:34, height:30, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:800, backgroundColor:r.pass?T.successSubtle:T.dangerSubtle, border:`1.5px solid ${r.pass?T.success:T.danger}`, color:r.pass?T.success:T.danger }}>
                    {r.pass ? 'OK' : 'DROP'}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'1rem', fontSize:'0.78rem' }}>
                <div style={{ color:T.success }}><strong>{polPass}</strong> passed</div>
                <div style={{ color:T.danger }}><strong>{polDrop}</strong> dropped</div>
              </div>
              <div style={{ marginTop:'8px', fontSize:'0.75rem', color:T.textSecondary, lineHeight:1.4 }}>
                Once tokens are exhausted, all subsequent packets in the burst are discarded. Fast, no delay — but traffic is lost. TCP will retransmit, causing throughput reduction.
              </div>
            </div>

            {/* Shaping */}
            <div style={{ backgroundColor:T.insetBg, border:`2px solid ${T.warning}`, borderRadius:'10px', padding:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div style={{ fontWeight:800, fontSize:'0.9rem', color:T.warning }}>Traffic Shaping</div>
                <span style={{ fontSize:'0.68rem', fontWeight:700, color:T.warning, backgroundColor:T.warningSubtle, padding:'2px 8px', borderRadius:'10px' }}>Buffers excess</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'1rem' }}>
                {shapeResult.map(r=>(
                  <div key={r.pkt} style={{ width:34, height:30, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', fontWeight:800, backgroundColor:r.pass?T.successSubtle:T.warningSubtle, border:`1.5px solid ${r.pass?T.success:T.warning}`, color:r.pass?T.success:T.warning }}>
                    {r.pass ? 'OK' : 'BUF'}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'1rem', fontSize:'0.78rem' }}>
                <div style={{ color:T.success }}><strong>{shapPass}</strong> passed</div>
                <div style={{ color:T.warning }}><strong>{shapBuf}</strong> buffered</div>
              </div>
              <div style={{ marginTop:'8px', fontSize:'0.75rem', color:T.textSecondary, lineHeight:1.4 }}>
                Excess packets are held in a buffer and released in later intervals as tokens refill. No data is lost — but latency increases. Better for TCP; not suitable for VoIP.
              </div>
            </div>
          </div>

          {/* Token bucket diagram */}
          <div style={{ backgroundColor:T.panelBg, border:T.border, borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', marginBottom:'12px' }}>Token Bucket Model</div>
            <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap', alignItems:'flex-start' }}>
              <div style={{ flex:'0 0 auto', textAlign:'center' }}>
                <div style={{ width:70, height:90, border:`2px solid ${T.borderColor}`, borderRadius:'0 0 8px 8px', borderTop:'none', position:'relative', overflow:'hidden', margin:'0 auto 6px' }}>
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor:T.accentSubtle, borderTop:`2px solid ${T.accent}`, height:`${(CBS/CBS)*100}%`, transition:'height 0.4s' }} />
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800, color:T.accent }}>50</div>
                </div>
                <div style={{ fontSize:'0.65rem', color:T.textMuted }}>Token Bucket</div>
                <div style={{ fontSize:'0.6rem', color:T.accent, marginTop:2 }}>CBS = 50</div>
              </div>
              <div style={{ flex:1, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.7, minWidth:180 }}>
                <div><span style={{ color:T.accent, fontFamily:'monospace', fontWeight:700 }}>CIR</span> — Committed Information Rate: tokens added per interval (10/interval here)</div>
                <div><span style={{ color:T.accent, fontFamily:'monospace', fontWeight:700 }}>CBS</span> — Committed Burst Size: max tokens the bucket can hold (50 here)</div>
                <div><span style={{ color:T.accent, fontFamily:'monospace', fontWeight:700 }}>Packet cost</span> — tokens consumed per packet (10 here = proportional to size)</div>
                <div style={{ marginTop:6, padding:'6px 10px', backgroundColor:T.insetBg, borderRadius:6, fontSize:'0.75rem' }}>
                  <strong style={{ color:T.textPrimary }}>Enough tokens?</strong> Pass immediately (both modes)<br/>
                  <strong style={{ color:T.danger }}>No tokens (police):</strong> Drop the packet<br/>
                  <strong style={{ color:T.warning }}>No tokens (shape):</strong> Buffer; wait for refill
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem', borderTop:T.border, paddingTop:'1.5rem' }}>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.danger }}>When to Police</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>Use policing at network ingress edges (customer handoff, access switch uplinks) to enforce SLA commitments. It's also used to police the strict-priority class in LLQ to prevent voice from starving all other traffic.</p></div>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.warning }}>When to Shape</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>Use shaping to smooth traffic before it leaves your network — typically on WAN egress where you're paying for a specific rate. Shaping prevents upstream policing from dropping your traffic, at the cost of added latency.</p></div>
            <div><h4 style={{ margin:'0 0 6px', fontSize:'0.9rem', fontWeight:700, color:T.success }}>Dual Token Bucket</h4><p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.5 }}>Advanced implementations use two token buckets: one for CIR (conforming) and one for PIR (peak rate). Traffic conforming to CIR is marked green, traffic between CIR and PIR is marked yellow (may be dropped under congestion), excess is red.</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QosLab;
