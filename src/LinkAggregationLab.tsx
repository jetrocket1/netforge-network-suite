import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

/* ─── Types ──────────────────────────────────────────────────────── */
type TabId = 'compare' | 'sim' | 'hash';
type Mode  = 'STP' | 'LACP';
type LS    = 'fwd' | 'blk' | 'down' | 'converging';
type Theme = ReturnType<typeof getLabTheme>;

/* ─── Edu cards ──────────────────────────────────────────────────── */
const LACP_EDU: EduCard[] = [
  { type:'exam', title:'LACP Modes: Active vs Passive', body:'Active: port initiates LACP PDU negotiation. Passive: port only responds to PDUs, never initiates. For an EtherChannel to form: at least one side must be Active. Passive + Passive = no EtherChannel. Active + Passive = EtherChannel. Active + Active = EtherChannel. Cisco PAgP equivalent: Desirable (active) vs Auto (passive). On the exam: if both sides are passive, the bundle never forms.' },
  { type:'exam', title:'EtherChannel Member Port Requirements', body:'All ports in a channel-group must have identical: speed and duplex, switchport mode (all access or all trunk), access VLAN or trunk native VLAN, allowed VLAN list. Any mismatch causes the offending port to be suspended and excluded from the bundle. Common exam trap: adding a port with a different speed or trunk config and expecting it to join the LAG.' },
  { type:'config', title:'Cisco LACP EtherChannel Configuration', body:'Full switch configuration for an 802.3ad LACP bundle.', code:`! ─── Both switches: configure member interfaces ───
interface range GigabitEthernet0/1 - 4
  channel-group 1 mode active       ! active = initiate LACP PDUs
  no shutdown

! ─── Logical Port-Channel interface ───
interface Port-channel1
  switchport mode trunk
  switchport trunk native vlan 99
  switchport trunk allowed vlan 10,20,99
  spanning-tree portfast trunk      ! optional: faster STP on PO

! ─── Verify ───
show etherchannel summary           ! S=suspended, U=in-use, P=in-bundle
show lacp neighbor
show interfaces port-channel 1

! ─── Static LAG (no negotiation protocol) ───
interface range GigabitEthernet0/1 - 4
  channel-group 1 mode on           ! "on" = no LACP/PAgP, static only` },
  { type:'gotcha', title:'Single Flow Cannot Exceed One Link\'s Bandwidth', body:'Load balancing in LACP distributes FLOWS, not bytes within a flow. A single TCP session (one src-IP:port → dst-IP:port tuple) always maps to exactly one physical link via the hash algorithm. A 4×1G bundle can transfer a single 1G file at only 1 Gbps — not 4 Gbps. Total throughput scales only when there are multiple concurrent flows hashing to different links.' },
  { type:'gotcha', title:'"show etherchannel summary" — P vs S vs I Flags', body:'The most common LACP troubleshoot: a port shows "I" (stand-alone) or "S" (suspended) instead of "P" (in-bundle). "S" means a config mismatch was detected and the port was removed from the bundle to prevent loops. "I" means the port is not participating at all. Start with "show lacp neighbor" — if you see no neighbor, check cabling and that the other side is also configured for LACP.' },
  { type:'realworld', title:'MLAG: Cross-Chassis Link Aggregation at Scale', body:'Standard LACP bundles links between the same two switches. MLAG (Multi-Chassis Link Aggregation) allows a server to form a LAG across TWO separate switches — eliminating the switch itself as a single point of failure. Used in every major data center: VMware vSphere, Cisco vPC, Arista MLAG, and cloud providers\' physical spine-leaf fabric all rely on cross-chassis bundling for the host connectivity layer.' },
];

/* ─── Hash lab helpers ───────────────────────────────────────────── */
const EXAMPLE_FLOWS = [
  { src:'192.168.1.10', dst:'10.0.0.5',  label:'HTTP browsing' },
  { src:'192.168.1.11', dst:'10.0.0.5',  label:'Database query' },
  { src:'192.168.1.10', dst:'10.0.0.8',  label:'SSH session' },
  { src:'192.168.1.12', dst:'10.0.0.1',  label:'NFS transfer' },
  { src:'192.168.1.15', dst:'10.0.0.5',  label:'VoIP call' },
  { src:'192.168.1.20', dst:'10.0.0.3',  label:'Video stream' },
  { src:'192.168.1.18', dst:'10.0.0.7',  label:'Backup rsync' },
  { src:'192.168.1.22', dst:'10.0.0.5',  label:'IMAP mail' },
];

function xorHash(src: string, dst: string, n: number) {
  const so = parseInt(src.split('.')[3] ?? '0', 10);
  const dso = parseInt(dst.split('.')[3] ?? '0', 10);
  const xor = so ^ dso;
  return { so, dso, xor, link: (xor % n) + 1 };
}

/* ─── SVG topology component (shared by Compare + Sim tabs) ─────── */
const PORT_GAP = 30;
const SW_W     = 80;
const LACP_COL = '#a855f7';
const LS_COL: Record<LS, string>  = { fwd:'#22c55e', blk:'#ef4444', down:'#6b7280', converging:'#eab308' };
const LS_DASH: Record<LS, string> = { fwd:'none', blk:'8,5', down:'5,3', converging:'none' };

interface TopoProps { numLinks:number; mode:Mode; states:LS[]; traffic:boolean; dark:boolean; compact?:boolean; }

function LinkTopo({ numLinks, mode, states, traffic, dark, compact }: TopoProps) {
  const svgH  = Math.max(compact?130:170, 50 + numLinks * PORT_GAP + 50);
  const cy    = svgH / 2;
  const ly    = (i: number) => cy + (i - (numLinks-1)/2) * PORT_GAP;
  const swH   = Math.max(compact?55:70, 18 + numLinks * PORT_GAP);
  const swY   = cy - swH/2;
  const lx1   = compact ? 68 : 95;        // link start x (right edge of left switch + port)
  const lx2   = compact ? 232 : 505;      // link end x (left edge of right switch)
  const sw1x  = compact ? 6  : 10;
  const sw2x  = compact ? 238: 510;
  const bg    = dark ? '#161b22' : '#f1f5f9';
  const bd    = dark ? '#30363d' : '#cbd5e1';
  const tc    = dark ? '#e6edf3' : '#1e293b';
  const mc    = dark ? '#8b949e' : '#64748b';
  const mid   = (lx1 + lx2) / 2;
  const activeFwd = states.filter(s => s === 'fwd').length;

  return (
    <svg viewBox={`0 0 ${compact?300:600} ${svgH}`} style={{ width:'100%', height:'auto' }}>
      {/* LACP port-channel border */}
      {mode === 'LACP' && activeFwd > 0 && (
        <g>
          <rect x={lx1-2} y={ly(0)-16} width={lx2-lx1+6} height={ly(numLinks-1)-ly(0)+32}
            rx={7} fill={`${LACP_COL}0c`} stroke={LACP_COL} strokeWidth={1.5} strokeDasharray="8,4" />
          {!compact && (
            <>
              <rect x={mid-56} y={ly(0)-30} width={112} height={17} rx={8.5} fill={LACP_COL} />
              <text x={mid} y={ly(0)-21.5} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fontWeight="800" fill="#fff">
                Po1 — Port-Channel ({activeFwd} Gbps)
              </text>
            </>
          )}
        </g>
      )}

      {/* Links */}
      {Array.from({ length:numLinks }, (_, i) => {
        const s = states[i] ?? 'fwd';
        const y = ly(i);
        const col = LS_COL[s];
        const dash = traffic && s === 'fwd' ? '18 8' : LS_DASH[s];
        const anim = traffic && s === 'fwd'
          ? `la-flow ${(0.45 + i * 0.08).toFixed(2)}s linear infinite`
          : s === 'converging' ? 'la-conv 0.9s linear infinite' : 'none';
        return (
          <g key={i}>
            {/* Port connectors */}
            <rect x={lx1-8} y={y-4} width={10} height={8} rx={2} fill={col} style={{ transition:'fill 0.4s' }} />
            <rect x={lx2-2} y={y-4} width={10} height={8} rx={2} fill={col} style={{ transition:'fill 0.4s' }} />
            {/* Cable */}
            <line x1={lx1+2} y1={y} x2={lx2-2} y2={y}
              stroke={col} strokeWidth={s==='fwd'?3:2.5} strokeDasharray={dash}
              style={{ animation:anim, transition:'stroke 0.4s, stroke-dasharray 0.35s' }} />
            {/* Port label */}
            {!compact && <text x={lx1+22} y={y-7} textAnchor="middle" fontSize={8} fill={mc} fontFamily="monospace">Gi0/{i+1}</text>}
            {!compact && <text x={lx2-18} y={y-7} textAnchor="middle" fontSize={8} fill={mc} fontFamily="monospace">Gi0/{i+1}</text>}
            {/* State badges */}
            {s === 'blk' && (
              <g transform={`translate(${mid},${y})`}>
                <rect x={-16} y={-9} width={32} height={18} rx={5} fill="#0d1117" stroke="#ef444470" strokeWidth={1} />
                <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="800" fill="#ef4444">BLK</text>
              </g>
            )}
            {s === 'down' && (
              <g transform={`translate(${mid},${y})`}>
                <rect x={-13} y={-11} width={26} height={22} rx={5} fill="#0d1117" stroke="#30363d" strokeWidth={1} />
                <line x1={-6} y1={-6} x2={6} y2={6} stroke="#f85149" strokeWidth={2.5} />
                <line x1={6} y1={-6} x2={-6} y2={6} stroke="#f85149" strokeWidth={2.5} />
              </g>
            )}
            {s === 'converging' && (
              <g transform={`translate(${mid},${y})`}>
                <rect x={-24} y={-9} width={48} height={18} rx={5} fill="#0d1117" stroke="#eab30870" strokeWidth={1} />
                <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="800" fill="#eab308">CONVERGING…</text>
              </g>
            )}
            {s === 'fwd' && mode === 'LACP' && !compact && (
              <g transform={`translate(${mid},${y})`}>
                <rect x={-18} y={-8} width={36} height={16} rx={4} fill="#22c55e16" stroke="#22c55e40" strokeWidth={1} />
                <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={8.5} fontWeight="800" fill="#22c55e">FWD</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Left switch */}
      <g>
        <rect x={sw1x} y={swY} width={SW_W} height={swH} rx={7} fill={bg} stroke={bd} strokeWidth={1.5} />
        <text x={sw1x+SW_W/2} y={cy-(compact?4:8)} textAnchor="middle" dominantBaseline="middle" fontSize={compact?9.5:11} fontWeight="700" fill={tc}>Core-1</text>
        {!compact && <text x={sw1x+SW_W/2} y={cy+9} textAnchor="middle" dominantBaseline="middle" fontSize={8.5} fill={mc}>Gi0/1-{numLinks}</text>}
      </g>

      {/* Right switch */}
      <g>
        <rect x={sw2x} y={swY} width={SW_W} height={swH} rx={7} fill={bg} stroke={bd} strokeWidth={1.5} />
        <text x={sw2x+SW_W/2} y={cy-(compact?4:8)} textAnchor="middle" dominantBaseline="middle" fontSize={compact?9.5:11} fontWeight="700" fill={tc}>Dist-1</text>
        {!compact && <text x={sw2x+SW_W/2} y={cy+9} textAnchor="middle" dominantBaseline="middle" fontSize={8.5} fill={mc}>Gi0/1-{numLinks}</text>}
      </g>
    </svg>
  );
}

/* ─── Compare tab ────────────────────────────────────────────────── */
function CompareTab({ dark, T }: { dark:boolean; T: Theme }) {
  const N = 4;
  const stpStates: LS[]  = ['fwd','blk','blk','blk'];
  const lacpStates: LS[] = ['fwd','fwd','fwd','fwd'];

  const side = (label: string, sub: string, badge: string, badgeCol: string, states: LS[], mode: Mode, stat: string, statCol: string, note: string) => (
    <div style={{ flex:1, background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'0.9rem 1rem', borderBottom:`1px solid ${T.borderColor}`, display:'flex', alignItems:'center', gap:8 }}>
        <div>
          <div style={{ fontWeight:800, fontSize:'0.88rem' }}>{label}</div>
          <div style={{ fontSize:'0.7rem', color:T.textMuted }}>{sub}</div>
        </div>
        <span style={{ marginLeft:'auto', fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:`${badgeCol}18`, color:badgeCol, border:`1px solid ${badgeCol}40`, textTransform:'uppercase' }}>{badge}</span>
      </div>
      <div style={{ padding:'0.75rem' }}>
        <LinkTopo numLinks={N} mode={mode} states={states} traffic={mode==='LACP'} dark={dark} compact />
      </div>
      <div style={{ padding:'0.75rem 1rem', borderTop:`1px solid ${T.borderColor}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'0.7rem', color:T.textMuted }}>Available bandwidth</span>
        <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:'0.88rem', color:statCol }}>{stat}</span>
      </div>
      <div style={{ padding:'0.5rem 1rem 0.9rem', background:`${badgeCol}08` }}>
        <p style={{ margin:0, fontSize:'0.72rem', color:T.textSecondary, lineHeight:1.6 }}>{note}</p>
      </div>
    </div>
  );

  return (
    <div style={{ animation:'la-fade 0.2s ease-out' }}>
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
        {side(
          'Standard STP','Without EtherChannel','3 links wasted','#ef4444',
          stpStates,'STP','1 / 4 Gbps','#ef4444',
          'STP blocks 3 of 4 links to prevent Layer 2 loops. All traffic squeezes through one physical link. If that link fails, STP convergence takes ~50 seconds of downtime before a blocked port transitions to forwarding.'
        )}
        {side(
          'LACP EtherChannel','802.3ad Port-Channel','All links active','#a855f7',
          lacpStates,'LACP','4 / 4 Gbps','#a855f7',
          'STP sees all 4 links as a single logical Port-Channel interface — no loops to block. All links carry traffic simultaneously. If a link fails, LACP instantly redistributes flows across remaining links with zero STP convergence delay.'
        )}
      </div>

      {/* Comparison table */}
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'0.75rem 1rem', borderBottom:`1px solid ${T.borderColor}`, fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>
          Head-to-Head Comparison (4-link scenario)
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr' }}>
          {[
            ['', 'Standard STP', 'LACP EtherChannel'],
            ['Active links',         '1 of 4',              '4 of 4'],
            ['Available bandwidth',  '1 Gbps',              '4 Gbps'],
            ['Redundant links',      'Blocked (wasted)',     'Active standby'],
            ['Failover time',        '~50 seconds',         '< 1 ms (instant)'],
            ['Traffic on failure',   'Dropped during STP',  'Zero packet loss'],
            ['Load distribution',    'Single link only',    'Per-flow hash'],
            ['STP interaction',      'Normal (1 port seen)','1 logical port seen'],
            ['Protocol standard',    '802.1D / 802.1w',     '802.3ad (IEEE)'],
          ].map((row, ri) => row.map((cell, ci) => {
            const isHeader = ri === 0;
            const col = ci===1 ? '#ef4444' : ci===2 ? '#a855f7' : T.textSecondary;
            return (
              <div key={`${ri}-${ci}`} style={{
                padding:'0.45rem 0.75rem',
                borderBottom: ri < 8 ? `1px solid ${T.borderColor}` : 'none',
                borderRight: ci < 2 ? `1px solid ${T.borderColor}` : 'none',
                fontSize: ci===0?'0.7rem':'0.75rem',
                fontWeight: isHeader||ci===0 ? 700 : 400,
                color: isHeader ? T.textMuted : ci===0 ? T.textSecondary : col,
                background: isHeader ? T.insetBg : 'transparent',
                textTransform: isHeader ? 'uppercase' : 'none',
                letterSpacing: isHeader ? '0.05em' : 'normal',
              }}>{cell}</div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}

/* ─── Simulator tab ──────────────────────────────────────────────── */
interface SimTabProps { T: Theme; dark:boolean; }

function SimTab({ T, dark }: SimTabProps) {
  const [mode, setMode]         = useState<Mode>('LACP');
  const [numLinks, setNumLinks] = useState(4);
  const [severed, setSevered]   = useState<number[]>([]);
  const [traffic, setTraffic]   = useState(false);
  const [stpIdx, setStpIdx]     = useState(0);
  const [stpNext, setStpNext]   = useState(-1);
  const [converging, setConverging] = useState(false);
  const [log, setLog]           = useState('Select a protocol and click actions to simulate.');
  const tmr = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => { return () => { if (tmr.current) clearTimeout(tmr.current); }; }, []);

  const states: LS[] = Array.from({ length:numLinks }, (_,i) => {
    if (severed.includes(i)) return 'down';
    if (mode === 'STP') {
      if (converging && i === stpNext) return 'converging';
      return i === stpIdx ? 'fwd' : 'blk';
    }
    return 'fwd';
  });

  const activeBW = mode === 'LACP'
    ? numLinks - severed.length
    : (severed.includes(stpIdx) || converging ? 0 : 1);

  const switchMode = (m: Mode) => {
    if (tmr.current) clearTimeout(tmr.current);
    setMode(m); setSevered([]); setTraffic(false); setConverging(false); setStpIdx(0); setStpNext(-1);
    setLog(m==='STP'
      ? `Standard STP active. Link 1 FORWARDING, ${numLinks-1} links BLOCKED. Total: 1 Gbps.`
      : `LACP EtherChannel active. All ${numLinks} links FORWARDING. Total: ${numLinks} Gbps.`);
  };

  const toggleTraffic = () => {
    if (traffic) { setTraffic(false); setLog('Traffic halted.'); return; }
    if (activeBW === 0) { setLog('Cannot send traffic — all links down.'); return; }
    if (converging) { setLog('STP is reconverging — traffic unavailable for ~50s.'); return; }
    setTraffic(true);
    setLog(mode === 'LACP'
      ? `Traffic flowing. ASIC hashing flows across ${activeBW} active links at ${activeBW} Gbps total.`
      : `Traffic flowing over Link ${stpIdx+1} only. All other links are idle/blocked.`);
  };

  const severLink = () => {
    const target = mode === 'STP' ? stpIdx : severed.length < numLinks ? Array.from({length:numLinks}).findIndex((_,i)=>!severed.includes(i)) : -1;
    if (target === -1 || severed.includes(target)) return;
    const next = Array.from({length:numLinks}).findIndex((_,i) => i !== target && !severed.includes(i));
    const ns = [...severed, target];
    setSevered(ns);
    if (mode === 'STP') {
      setTraffic(false);
      if (next !== -1) {
        setStpNext(next); setConverging(true);
        setLog(`CRITICAL: Active Link ${target+1} severed! Traffic DROPPED. STP reconverging (~50s simulated as 5s). Link ${next+1} transitioning BLK→LIS→LRN→FWD…`);
        if (tmr.current) clearTimeout(tmr.current);
        tmr.current = setTimeout(() => {
          setStpIdx(next); setStpNext(-1); setConverging(false);
          setLog(`STP reconverged. Link ${next+1} now FORWARDING. Traffic may resume.`);
        }, 5000);
      } else {
        setLog('FATAL: All links severed. Network completely down.');
      }
    } else {
      const rem = numLinks - ns.length;
      if (rem > 0) {
        setLog(`Link ${target+1} severed. LACP instantly redistributes — ${rem} Gbps remaining. Zero packet loss.`);
      } else {
        setTraffic(false);
        setLog('FATAL: All links severed. Port-Channel interface DOWN.');
      }
    }
  };

  const repairAll = () => {
    if (tmr.current) clearTimeout(tmr.current);
    setSevered([]); setConverging(false); setStpIdx(0); setStpNext(-1);
    setLog(mode === 'STP'
      ? `All links restored. STP forces Link 1 to FORWARD, blocking Links 2–${numLinks}.`
      : `All links restored. LACP rebundles all ${numLinks} links. Bandwidth restored to ${numLinks} Gbps.`);
  };

  const downCount = severed.length;
  const sliderColor = mode === 'LACP' ? LACP_COL : '#4493f8';

  return (
    <div style={{ animation:'la-fade 0.2s ease-out' }}>
      {/* Controls row */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'0.75rem', marginBottom:'1rem', alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:4, gap:4 }}>
          {(['STP','LACP'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              style={{ padding:'6px 16px', border:'none', borderRadius:7, fontWeight:700, fontSize:'0.76rem', cursor:'pointer', background: mode===m ? (m==='LACP'?LACP_COL:'#4493f8') : 'transparent', color: mode===m?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
              {m === 'STP' ? 'Standard STP' : 'LACP Port-Channel'}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'0.72rem', color:T.textMuted, whiteSpace:'nowrap' }}>Physical links:</span>
          <input type="range" min={2} max={8} value={numLinks}
            onChange={e => { const v=parseInt(e.target.value); setNumLinks(v); setSevered([]); setTraffic(false); setConverging(false); setStpIdx(0); }}
            style={{ flex:1, accentColor:sliderColor, cursor:'pointer' }} />
          <span style={{ fontSize:'0.85rem', fontWeight:800, color:sliderColor, fontFamily:'monospace', minWidth:14 }}>{numLinks}</span>
        </div>
      </div>

      {/* SVG topology */}
      <div style={{ background:'#0d1117', borderRadius:14, border:`1px solid ${T.borderColor}`, padding:'0.75rem 1rem 1rem', marginBottom:'1rem' }}>
        {/* Legend */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:'0.5rem' }}>
          {[['#22c55e','Forwarding'],['#ef4444','Blocked'],['#eab308','Converging'],['#6b7280','Link down'],['#a855f7','Port-Channel']].map(([c,l]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:16, height:3, background:c, borderRadius:2 }} />
              <span style={{ fontSize:'0.6rem', color:'#8b949e' }}>{l}</span>
            </div>
          ))}
        </div>
        <LinkTopo numLinks={numLinks} mode={mode} states={states} traffic={traffic} dark={dark} />
      </div>

      {/* Action buttons + log */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          <div style={{ display:'flex', gap:'0.6rem' }}>
            <button type="button" onClick={toggleTraffic}
              style={{ flex:1, padding:'0.65rem', background: traffic?'#ef444420':'#22c55e20', border:`1px solid ${traffic?'#ef4444':'#22c55e'}50`, borderRadius:9, color: traffic?'#ef4444':'#22c55e', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit' }}>
              {traffic ? '⏹ Stop Traffic' : '▶ Send Traffic'}
            </button>
            <button type="button" onClick={severLink} disabled={downCount >= numLinks}
              style={{ flex:1, padding:'0.65rem', background:'transparent', border:`1px solid #f8514970`, borderRadius:9, color:'#f85149', fontWeight:700, fontSize:'0.78rem', cursor: downCount>=numLinks?'not-allowed':'pointer', opacity: downCount>=numLinks?0.4:1, fontFamily:'inherit' }}>
              ⚡ Sever Link
            </button>
          </div>
          <button type="button" onClick={repairAll} disabled={downCount === 0}
            style={{ padding:'0.6rem', background:'transparent', border:`1px dashed #d2992260`, borderRadius:9, color:'#d29922', fontWeight:700, fontSize:'0.78rem', cursor: downCount===0?'not-allowed':'pointer', opacity: downCount===0?0.4:1, fontFamily:'inherit' }}>
            🔧 Repair All Links
          </button>
          {/* Bandwidth gauge */}
          <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:9, padding:'0.6rem 0.85rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.68rem', color:T.textMuted, fontWeight:700, textTransform:'uppercase' }}>Active throughput</span>
            <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:'1rem', color: activeBW===0?'#f85149':mode==='LACP'?LACP_COL:'#3fb950' }}>
              {activeBW} / {numLinks} Gbps
            </span>
          </div>
        </div>

        {/* Log */}
        <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
          <div style={{ background:'#1a1a2e', padding:'0.4rem 0.8rem', display:'flex', alignItems:'center', gap:6 }}>
            {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:8,height:8,borderRadius:'50%',background:c }} />)}
            <span style={{ fontFamily:'monospace', fontSize:'0.6rem', color:'#8b949e', marginLeft:4 }}>system log</span>
          </div>
          <div style={{ background:'#0d1117', padding:'0.85rem 1rem', minHeight:110, fontFamily:"'Fira Code',monospace", fontSize:'0.73rem', lineHeight:1.8, color: converging?'#eab308':downCount>0?'#f85149':'#3fb950' }}>
            {log}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hash lab tab ───────────────────────────────────────────────── */
function HashTab({ T }: { T: Theme }) {
  const [numLinks, setNumLinks] = useState(4);
  const [srcIP,    setSrcIP]    = useState('192.168.1.10');
  const [dstIP,    setDstIP]    = useState('10.0.0.5');

  const h     = xorHash(srcIP, dstIP, numLinks);
  const valid = (ip: string) => /^\d+\.\d+\.\d+\.\d+$/.test(ip);

  const flowResults = EXAMPLE_FLOWS.map(f => ({ ...f, ...xorHash(f.src, f.dst, numLinks) }));
  const perLink: Record<number, number> = {};
  for (let i=1; i<=numLinks; i++) perLink[i] = 0;
  flowResults.forEach(f => { perLink[f.link] = (perLink[f.link]||0) + 1; });
  const maxBar = Math.max(1, ...Object.values(perLink));

  const inputS: React.CSSProperties = { padding:'0.45rem 0.7rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:T.insetBg, color:T.textPrimary, outline:'none', fontSize:'0.8rem', fontFamily:"'Fira Code',monospace", width:'100%', boxSizing:'border-box' };
  const toBin = (n: number) => n.toString(2).padStart(8,'0');

  return (
    <div style={{ animation:'la-fade 0.2s ease-out' }}>
      <p style={{ margin:'0 0 1rem', fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.6 }}>
        LACP load-balancing uses a hardware hash to assign each flow to a specific link. Cisco's default algorithm XORs the last octets of the source and destination IPs, then applies modulo N (number of links). Enter any src/dst IPs to see the result.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'0.75rem', marginBottom:'1.25rem', alignItems:'end' }}>
        <div>
          <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Source IP</label>
          <input type="text" value={srcIP} onChange={e=>setSrcIP(e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Destination IP</label>
          <input type="text" value={dstIP} onChange={e=>setDstIP(e.target.value)} style={inputS} />
        </div>
        <div>
          <label style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, display:'block', marginBottom:4, textTransform:'uppercase' }}>Links</label>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="range" min={2} max={8} value={numLinks} onChange={e=>setNumLinks(Number(e.target.value))} style={{ width:80, accentColor:LACP_COL, cursor:'pointer' }} />
            <span style={{ fontWeight:800, color:LACP_COL, fontFamily:'monospace', fontSize:'0.85rem' }}>{numLinks}</span>
          </div>
        </div>
      </div>

      {/* Computation display */}
      {valid(srcIP) && valid(dstIP) && (
        <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${T.borderColor}`, marginBottom:'1.25rem', animation:'la-fade 0.15s ease-out' }}>
          <div style={{ background:'#1a1a2e', padding:'0.45rem 1rem', display:'flex', alignItems:'center', gap:6 }}>
            {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:8,height:8,borderRadius:'50%',background:c }} />)}
            <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', marginLeft:4 }}>XOR hash — src-dst-ip algorithm</span>
          </div>
          <div style={{ background:'#0d1117', padding:'1rem 1.25rem', fontFamily:"'Fira Code',monospace", fontSize:'0.72rem', lineHeight:2 }}>
            <div style={{ color:'#8b949e' }}>! src last octet: {srcIP.split('.')[3]} = {toBin(h.so)} (0x{h.so.toString(16).toUpperCase().padStart(2,'0')})</div>
            <div style={{ color:'#8b949e' }}>! dst last octet: {dstIP.split('.')[3]} = {toBin(h.dso)} (0x{h.dso.toString(16).toUpperCase().padStart(2,'0')})</div>
            <div style={{ color:'#8b949e' }}>!                          XOR ─────────────────────────</div>
            <div style={{ color:'#7ee787' }}>hash result = {toBin(h.xor)} (0x{h.xor.toString(16).toUpperCase().padStart(2,'0')}) = {h.xor}</div>
            <div style={{ color:'#ffa657' }}>link index  = {h.xor} mod {numLinks} = {h.xor % numLinks}</div>
            <div style={{ color:'#4493f8', fontWeight:800 }}>→  assigned to Gi0/{h.link}</div>
          </div>
          <div style={{ background:`${LACP_COL}12`, padding:'0.7rem 1.25rem', borderTop:`1px solid ${T.borderColor}`, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'0.75rem', color:T.textSecondary }}>This flow ({srcIP} → {dstIP}) is pinned to</span>
            <span style={{ fontFamily:'monospace', fontWeight:800, fontSize:'0.88rem', color:LACP_COL, padding:'2px 10px', background:`${LACP_COL}18`, borderRadius:6, border:`1px solid ${LACP_COL}40` }}>Gi0/{h.link}</span>
            <span style={{ fontSize:'0.75rem', color:T.textMuted }}>for its entire lifetime</span>
          </div>
        </div>
      )}

      {/* Example flows table + bar chart */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 180px', gap:'1rem' }}>
        <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ padding:'0.6rem 0.9rem', borderBottom:`1px solid ${T.borderColor}`, fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>
            Example Flow Distribution
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 0.7fr 0.7fr 0.6fr' }}>
            {['Source IP','Dest IP','Last Oct XOR','Result','Link'].map(h => (
              <div key={h} style={{ padding:'0.35rem 0.75rem', background:T.insetBg, fontSize:'0.6rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', borderBottom:`1px solid ${T.borderColor}`, borderRight:`1px solid ${T.borderColor}` }}>{h}</div>
            ))}
            {flowResults.map((f, i) => {
              const isHighlighted = f.src === srcIP && f.dst === dstIP;
              const rowBg = isHighlighted ? `${LACP_COL}12` : 'transparent';
              return (
                <React.Fragment key={i}>
                  {[f.src, f.dst, `${f.so}⊕${f.dso}=${f.xor}`, `${f.xor}%${numLinks}=${f.xor%numLinks}`, `Gi0/${f.link}`].map((cell, ci) => (
                    <div key={ci} style={{ padding:'0.35rem 0.75rem', background:rowBg, fontSize: ci===4?'0.72rem':'0.68rem', fontFamily:'monospace', color: ci===4?LACP_COL:T.textSecondary, fontWeight: ci===4?700:400, borderBottom: i<flowResults.length-1?`1px solid ${T.borderColor}`:'none', borderRight:`1px solid ${T.borderColor}` }}>{cell}</div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'0.75rem' }}>
          <div style={{ fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.75rem' }}>Flows per Link</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {Array.from({length:numLinks}, (_,i) => {
              const cnt = perLink[i+1] ?? 0;
              const pct = (cnt / maxBar) * 100;
              return (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:T.textMuted }}>Gi0/{i+1}</span>
                    <span style={{ fontFamily:'monospace', fontSize:'0.65rem', fontWeight:700, color:LACP_COL }}>{cnt} flow{cnt!==1?'s':''}</span>
                  </div>
                  <div style={{ height:8, background:T.insetBg, borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:LACP_COL, borderRadius:4, transition:'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ margin:'0.75rem 0 0', fontSize:'0.64rem', color:T.textMuted, lineHeight:1.5 }}>Each flow is permanently assigned to one link. Add more flows or links to change the distribution.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
interface LinkAggregationLabProps { isDarkMode?: boolean; }

export const LinkAggregationLab: React.FC<LinkAggregationLabProps> = ({ isDarkMode = true }) => {
  const T   = getLabTheme(isDarkMode);
  const [tab, setTab] = useState<TabId>('compare');

  return (
    <div style={{ background:T.cardBg, borderRadius:20, border:`1px solid ${T.borderColor}`, overflow:'hidden', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes la-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes la-flow { from{stroke-dashoffset:26} to{stroke-dashoffset:0} }
        @keyframes la-conv { from{stroke-dashoffset:14} to{stroke-dashoffset:0} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ height:3, background:'linear-gradient(90deg,#a855f7,#4493f8,#3fb950)' }} />
      <div style={{ padding:'1.75rem 2rem 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#a855f7,#4493f8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>⛓️</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:800 }}>Link Aggregation (LACP) Lab</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:'#a855f720', color:'#a855f7', border:'1px solid #a855f740', textTransform:'uppercase', letterSpacing:'0.08em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:'#d2992220', color:'#d29922', border:'1px solid #d2992240', textTransform:'uppercase', letterSpacing:'0.08em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.55 }}>Compare STP vs LACP bandwidth utilisation, simulate link failures, and explore the per-flow hashing algorithm that drives 802.3ad load balancing.</p>
          </div>
        </div>

        {/* tab bar */}
        <div style={{ display:'flex', gap:0, borderTop:`1px solid ${T.borderColor}`, paddingTop:'0.1rem' }}>
          {([['compare','⚖️ Compare','Side-by-side STP vs LACP'],['sim','🎮 Simulator','Live failure simulation'],['hash','#️⃣ Hash Lab','Load balancing algorithm']] as [TabId,string,string][]).map(([id,label,hint]) => (
            <button key={id} type="button" onClick={() => setTab(id)}
              title={hint}
              style={{ padding:'0.55rem 1.1rem', border:'none', borderBottom: tab===id?`2px solid ${LACP_COL}`:'2px solid transparent', background:'none', color: tab===id?LACP_COL:T.textMuted, fontWeight:700, fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'color 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding:'1.5rem 2rem 2rem' }}>
        {tab === 'compare' && <CompareTab dark={isDarkMode} T={T} />}
        {tab === 'sim'     && <SimTab T={T} dark={isDarkMode} />}
        {tab === 'hash'    && <HashTab T={T} />}
        <LabEduPanel cards={LACP_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default LinkAggregationLab;
