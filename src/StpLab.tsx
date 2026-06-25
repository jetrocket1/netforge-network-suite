import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

/* ─── Types ──────────────────────────────────────────────────────── */
type Phase = 'IDLE'|'BPDU_ELECT'|'ROLES'|'CONVERGED'|'LINK_FLAP'|'RE_CONVERGE'|'CONVERGED_ALT';
type Topo  = 'BASIC'|'ENTERPRISE';
type LS    = 'idle'|'active'|'blocked'|'broken'|'transitioning'|'bpdu';
type Role  = 'DP'|'RP'|'ALT'|'';
interface LC { state: LS; a?: Role; b?: Role; }

/* ─── Phase metadata ─────────────────────────────────────────────── */
const PHASES: Phase[] = ['IDLE','BPDU_ELECT','ROLES','CONVERGED','LINK_FLAP','RE_CONVERGE','CONVERGED_ALT'];

const PHASE_INFO: Record<Phase, { icon:string; title:string; desc:string; hint:string; }> = {
  IDLE: {
    icon:'💤', title:'Idle — STP Dormant',
    desc:'Every switch port starts in the Blocking state when first enabled. No traffic flows. Each switch is about to begin the Root Bridge election by broadcasting BPDU frames on all active interfaces.',
    hint:'All links are grey — no forwarding decisions have been made yet.',
  },
  BPDU_ELECT: {
    icon:'📡', title:'BPDU Flood — Root Bridge Election',
    desc:'Every switch floods Bridge Protocol Data Units (BPDUs) advertising its Bridge ID (Priority + MAC). Switches compare BIDs — if a received BID is lower, they update their "best root" and re-flood. The switch with the lowest BID wins the election.',
    hint:'Animated blue dashes on links represent BPDU frames in transit. The switch with the lowest MAC (or lowest manually-set priority) becomes Root Bridge.',
  },
  ROLES: {
    icon:'🗺️', title:'Port Role Assignment — RP & DP',
    desc:'Every non-root switch picks its Root Port (RP) — the port with the lowest cumulative path cost back to the Root Bridge. On each segment, one port is elected Designated Port (DP). Redundant ports will become Alternate (blocked) in the next step.',
    hint:'RP labels (green) point toward the Root Bridge. DP labels (blue) show the forwarding port on each link segment.',
  },
  CONVERGED: {
    icon:'✅', title:'Converged — Loop-Free Topology',
    desc:'Non-designated ports are placed in the Blocked (ALT) state, breaking all Layer 2 loops. The redundant cross-link is physically connected but logically disabled by STP. A broadcast storm cannot form. The network is fully converged.',
    hint:'The red dashed link is BLOCKED — physically present but logically disabled. Notice the ALT label on the blocked port end.',
  },
  LINK_FLAP: {
    icon:'⚡', title:'Link Failure — Primary Uplink Down',
    desc:'A physical link failure is detected. The affected switch sends a Topology Change Notification (TCN) upstream toward the Root, which floods a TC flag causing all switches to flush their MAC tables — preventing stale entries from looping during reconvergence.',
    hint:'The broken link (grey ✕) is the failed uplink. The previously blocked port is reconsidering — it may become the new active path.',
  },
  RE_CONVERGE: {
    icon:'🔄', title:'Re-convergence — Transitioning',
    desc:'The previously blocked port transitions through Listening (15s) → Learning (15s) → Forwarding. During Listening, BPDUs are processed but no data forwards. During Learning, MACs are learned but still no forwarding. This 30-second delay prevents temporary loops.',
    hint:'Yellow dashed links show ports in transition (LIS/LRN state). Standard STP takes up to 50 seconds — RSTP reduces this to ~1 second.',
  },
  CONVERGED_ALT: {
    icon:'🔁', title:'Alternate Path Active — Restored',
    desc:'Reconvergence is complete. The backup path held in reserve by STP is now fully active. MAC tables have been flushed and repopulated. The network is stable with a new loop-free topology using the previously blocked path.',
    hint:'Compare to the CONVERGED state — notice which links switched from blocked to active, and how Root Ports changed.',
  },
};

/* ─── Node positions ─────────────────────────────────────────────── */
const BN = {
  A: { cx:300, cy:72,  label:'SW-A', sub:'Core Switch' },
  B: { cx:100, cy:235, label:'SW-B', sub:'Access' },
  C: { cx:500, cy:235, label:'SW-C', sub:'Access' },
};
const EN = {
  C1: { cx:300, cy:58,  label:'SW-1',     sub:'Core / Root' },
  D1: { cx:115, cy:205, label:'Dist-1',   sub:'Distribution' },
  D2: { cx:485, cy:205, label:'Dist-2',   sub:'Distribution' },
  A1: { cx:300, cy:370, label:'Access-1', sub:'Access' },
};

/* ─── Phase link/role configs ────────────────────────────────────── */
type BasicLinks = { AB:LC; AC:LC; BC:LC; };
type EntLinks   = { C1D1:LC; C1D2:LC; D1D2:LC; D1A1:LC; D2A1:LC; };

const BCFG: Record<Phase, { root?:boolean; links:BasicLinks }> = {
  IDLE:          { links:{ AB:{state:'idle'}, AC:{state:'idle'}, BC:{state:'idle'} } },
  BPDU_ELECT:    { links:{ AB:{state:'bpdu'}, AC:{state:'bpdu'}, BC:{state:'bpdu'} } },
  ROLES:         { links:{ AB:{state:'active',a:'DP',b:'RP'}, AC:{state:'active',a:'DP',b:'RP'}, BC:{state:'active',a:'DP',b:''} } },
  CONVERGED:     { root:true, links:{ AB:{state:'active',a:'DP',b:'RP'}, AC:{state:'active',a:'DP',b:'RP'}, BC:{state:'blocked',a:'DP',b:'ALT'} } },
  LINK_FLAP:     { root:true, links:{ AB:{state:'broken'}, AC:{state:'active',a:'DP',b:'RP'}, BC:{state:'blocked',a:'DP',b:'ALT'} } },
  RE_CONVERGE:   { root:true, links:{ AB:{state:'broken'}, AC:{state:'active',a:'DP',b:'RP'}, BC:{state:'transitioning',a:'',b:''} } },
  CONVERGED_ALT: { root:true, links:{ AB:{state:'broken'}, AC:{state:'active',a:'DP',b:'RP'}, BC:{state:'active',a:'RP',b:'DP'} } },
};

const ECFG: Record<Phase, { root?:boolean; links:EntLinks }> = {
  IDLE:          { links:{ C1D1:{state:'idle'}, C1D2:{state:'idle'}, D1D2:{state:'idle'}, D1A1:{state:'idle'}, D2A1:{state:'idle'} } },
  BPDU_ELECT:    { links:{ C1D1:{state:'bpdu'}, C1D2:{state:'bpdu'}, D1D2:{state:'bpdu'}, D1A1:{state:'bpdu'}, D2A1:{state:'bpdu'} } },
  ROLES:         { links:{ C1D1:{state:'active',a:'DP',b:'RP'}, C1D2:{state:'active',a:'DP',b:'RP'}, D1D2:{state:'active',a:'DP',b:''}, D1A1:{state:'active',a:'DP',b:'RP'}, D2A1:{state:'active',a:'DP',b:''} } },
  CONVERGED:     { root:true, links:{ C1D1:{state:'active',a:'DP',b:'RP'}, C1D2:{state:'active',a:'DP',b:'RP'}, D1D2:{state:'blocked',a:'DP',b:'ALT'}, D1A1:{state:'active',a:'DP',b:'RP'}, D2A1:{state:'blocked',a:'DP',b:'ALT'} } },
  LINK_FLAP:     { root:true, links:{ C1D1:{state:'broken'}, C1D2:{state:'active',a:'DP',b:'RP'}, D1D2:{state:'blocked',a:'DP',b:'ALT'}, D1A1:{state:'active',a:'DP',b:'RP'}, D2A1:{state:'blocked',a:'DP',b:'ALT'} } },
  RE_CONVERGE:   { root:true, links:{ C1D1:{state:'broken'}, C1D2:{state:'active',a:'DP',b:'RP'}, D1D2:{state:'transitioning',a:'',b:''}, D1A1:{state:'active',a:'DP',b:'RP'}, D2A1:{state:'transitioning',a:'',b:''} } },
  CONVERGED_ALT: { root:true, links:{ C1D1:{state:'broken'}, C1D2:{state:'active',a:'DP',b:'RP'}, D1D2:{state:'active',a:'DP',b:'RP'}, D1A1:{state:'blocked',a:'DP',b:'ALT'}, D2A1:{state:'active',a:'DP',b:'RP'} } },
};

/* ─── STP EduCards ───────────────────────────────────────────────── */
const STP_EDU: EduCard[] = [
  { type:'exam', title:'Root Bridge Election — Lowest BID Wins', body:'Bridge ID = Priority (2B) + MAC (6B). Default priority is 32768. The switch with the lowest BID becomes Root Bridge. Admins set Core switches to priority 4096 or 8192 to guarantee they win. On the exam: if priority is equal, lower MAC wins. "Extended System ID" adds the VLAN ID to the priority — know this for 802.1D vs PVST+ questions.' },
  { type:'exam', title:'Port States: STP vs RSTP', body:'STP (802.1D) port states: Blocking → Listening (15s) → Learning (15s) → Forwarding → Disabled. Max convergence = 50s. RSTP (802.1w) collapses these: Discarding → Learning → Forwarding, with sync mechanism replacing timers. RSTP converges in ~1–2 seconds. 802.1s (MST) runs RSTP per instance. Know which states exist in which standard — a favorite exam question.' },
  { type:'config', title:'STP Tuning — Priority, PortFast, BPDU Guard', body:'Essential STP configuration commands.', code:`! ─── Force SW-1 to be Root Bridge ───
spanning-tree vlan 10 priority 4096    ! lower = more likely to win
spanning-tree vlan 10 root primary     ! auto-sets to 24576 or lower

! ─── PortFast: skip Listening/Learning on access ports ───
interface FastEthernet0/1
  spanning-tree portfast                ! for end-device ports only
  spanning-tree bpduguard enable        ! shut port if BPDU received

! ─── Global BPDU Guard (on all PortFast ports) ───
spanning-tree portfast bpduguard default

! ─── Root Guard: prevent rogue root bridge on a port ───
interface FastEthernet0/24
  spanning-tree guard root

! ─── Verify ───
show spanning-tree vlan 10
show spanning-tree interface fa0/24 detail` },
  { type:'gotcha', title:'PortFast on Trunk Ports = Potential Loop', body:'PortFast skips Listening and Learning, sending the port directly to Forwarding. This is safe ONLY on access ports connecting to end devices (PCs, servers). If PortFast is misconfigured on a trunk or inter-switch link, a newly connected switch can cause a broadcast storm before STP can detect and block the loop. Always pair PortFast with BPDU Guard.' },
  { type:'gotcha', title:'Unidirectional Links and STP Failure (UDLD)', body:'In fiber networks, one fiber strand can fail while the other stays up — creating a unidirectional link. STP may believe the port is forwarding correctly, but frames only travel one way, causing a hidden loop. Deploy Cisco UDLD (Unidirectional Link Detection) or RSTP loop guard on all fiber inter-switch links to detect and disable this condition.' },
  { type:'realworld', title:'2003 Northeast Blackout — Analogous to Broadcast Storm', body:'The 2003 North American power blackout was caused by a cascade failure where a single overloaded line tripped others in sequence — exactly how a Layer 2 broadcast storm cascades. A misconfigured trunk or missing PortFast has brought down production networks in minutes: one broadcast frame duplicates at every switch, doubling each time, until all switch CPUs hit 100% processing BPDUs and stop forwarding user traffic entirely.' },
];

/* ─── SVG helpers ────────────────────────────────────────────────── */
const LC_COLOR: Record<LS, string> = {
  idle:'#4b5563', active:'#22c55e', blocked:'#ef4444',
  broken:'#6b7280', transitioning:'#eab308', bpdu:'#3b82f6',
};
const ROLE_COL: Record<string, string> = { DP:'#4493f8', RP:'#3fb950', ALT:'#f85149' };

function NetLink({ x1,y1,x2,y2,cfg }: { x1:number;y1:number;x2:number;y2:number;cfg:LC }) {
  const s = cfg.state;
  const col = LC_COLOR[s];
  const dash = s==='active'?'none':s==='blocked'?'9,5':s==='broken'?'6,4':s==='transitioning'?'5,4':'12,6';
  const anim = s==='bpdu'?'stp-flow 0.55s linear infinite':s==='transitioning'?'stp-flow 1.1s linear infinite':'none';
  const mx=(x1+x2)/2, my=(y1+y2)/2;
  const t=0.27;
  const lx1=x1+t*(x2-x1), ly1=y1+t*(y2-y1);
  const lx2=x2+t*(x1-x2), ly2=y2+t*(y1-y2);
  const showR = s !== 'idle' && s !== 'bpdu';
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={s==='idle'?2:3}
        strokeDasharray={dash}
        style={{ animation:anim, transition:'stroke 0.45s, stroke-dasharray 0.35s, stroke-width 0.3s' }} />
      {/* broken X */}
      {s==='broken' && (
        <g transform={`translate(${mx},${my})`}>
          <rect x={-12} y={-12} width={24} height={24} rx={5} fill="#0d1117" stroke="#30363d" strokeWidth={1} />
          <line x1={-6} y1={-6} x2={6} y2={6} stroke="#f85149" strokeWidth={2.5} />
          <line x1={6} y1={-6} x2={-6} y2={6} stroke="#f85149" strokeWidth={2.5} />
        </g>
      )}
      {/* BLK / LIS+LRN badge */}
      {(s==='blocked'||s==='transitioning') && (
        <g transform={`translate(${mx},${my})`}>
          <rect x={-21} y={-10} width={42} height={20} rx={5} fill="#0d1117" stroke={col} strokeWidth={1.2} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight="bold" fill={col}>
            {s==='blocked'?'BLK':'LIS/LRN'}
          </text>
        </g>
      )}
      {/* Port role labels */}
      {showR && cfg.a && ROLE_COL[cfg.a] && (
        <g transform={`translate(${lx1},${ly1})`}>
          <rect x={-13} y={-9} width={26} height={18} rx={4} fill={ROLE_COL[cfg.a]+'22'} stroke={ROLE_COL[cfg.a]+'70'} strokeWidth={1} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fontWeight="800" fill={ROLE_COL[cfg.a]}>{cfg.a}</text>
        </g>
      )}
      {showR && cfg.b && ROLE_COL[cfg.b] && (
        <g transform={`translate(${lx2},${ly2})`}>
          <rect x={-13} y={-9} width={26} height={18} rx={4} fill={ROLE_COL[cfg.b]+'22'} stroke={ROLE_COL[cfg.b]+'70'} strokeWidth={1} />
          <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fontWeight="800" fill={ROLE_COL[cfg.b]}>{cfg.b}</text>
        </g>
      )}
    </g>
  );
}

function SwNode({ cx,cy,label,sub,isRoot,bpdu,dark }: { cx:number;cy:number;label:string;sub:string;isRoot?:boolean;bpdu?:boolean;dark:boolean }) {
  const W=84, H=52, x=cx-W/2, y=cy-H/2;
  const bg   = dark ? '#161b22' : '#f1f5f9';
  const bd   = isRoot ? '#d29922' : bpdu ? '#4493f8' : (dark?'#30363d':'#cbd5e1');
  const tc   = dark ? '#e6edf3' : '#1e293b';
  const mc   = dark ? '#8b949e' : '#64748b';
  const portC = isRoot ? '#d29922' : '#3fb950';
  return (
    <g>
      {isRoot && <rect x={x-5} y={y-5} width={W+10} height={H+10} rx={12} fill="#d2992212" stroke="#d2992238" strokeWidth={1.5} />}
      {bpdu && <rect x={x-8} y={y-8} width={W+16} height={H+16} rx={16} fill="none" stroke="#4493f8" strokeWidth={2} style={{ animation:'stp-pulse 1.1s ease-in-out infinite' }} />}
      <rect x={x} y={y} width={W} height={H} rx={8} fill={bg} stroke={bd} strokeWidth={isRoot?2.2:1.5} style={{ transition:'stroke 0.4s, fill 0.3s' }} />
      {/* port rail */}
      <rect x={cx-28} y={cy-17} width={56} height={7} rx={2} fill={dark?'#21262d':'#e2e8f0'} />
      {[0,1,2,3,4,5,6].map(i => (
        <rect key={i} x={cx-25+i*7} y={cy-16} width={5} height={5} rx={1} fill={portC} opacity={0.75} />
      ))}
      <text x={cx} y={cy+3} textAnchor="middle" dominantBaseline="middle" fontSize={11.5} fontWeight="700" fill={tc}>{label}</text>
      <text x={cx} y={cy+17} textAnchor="middle" dominantBaseline="middle" fontSize={8.5} fill={mc}>{sub}</text>
      {isRoot && (
        <g>
          <rect x={cx-30} y={y-23} width={60} height={19} rx={9.5} fill="#d29922" />
          <text x={cx} y={y-13.5} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight="800" fill="#000">ROOT BRIDGE</text>
        </g>
      )}
    </g>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
interface StpLabProps { isDarkMode?: boolean; }

export const StpLab: React.FC<StpLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [topo,  setTopo]  = useState<Topo>('BASIC');
  const [phase, setPhase] = useState<Phase>('IDLE');

  const phaseIdx = PHASES.indexOf(phase);
  const info     = PHASE_INFO[phase];
  const bc       = BCFG[phase];
  const ec       = ECFG[phase];

  const next  = () => setPhase(PHASES[(phaseIdx+1) % PHASES.length]);
  const reset = () => setPhase('IDLE');

  const nextLabel: Record<Phase,string> = {
    IDLE:          'Step 1 — Broadcast BPDUs',
    BPDU_ELECT:    'Step 2 — Map Port Roles',
    ROLES:         'Step 3 — Apply Loop Prevention',
    CONVERGED:     'Step 4 — Simulate Link Failure',
    LINK_FLAP:     'Step 5 — TCN & Re-convergence',
    RE_CONVERGE:   'Step 6 — Finalise Alternate Path',
    CONVERGED_ALT: 'Restart Simulation',
  };

  const isBpdu = phase === 'BPDU_ELECT';

  return (
    <div style={{ background:T.cardBg, borderRadius:20, border:`1px solid ${T.borderColor}`, overflow:'hidden', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes stp-fade  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        @keyframes stp-flow  { from{stroke-dashoffset:20} to{stroke-dashoffset:0} }
        @keyframes stp-pulse { 0%,100%{opacity:0.65} 50%{opacity:0.12} }
        @keyframes stp-warn  { 0%,100%{opacity:1} 40%{opacity:0.25} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ height:3, background:'linear-gradient(90deg,#4493f8,#3fb950,#d29922,#f85149)' }} />
      <div style={{ padding:'1.75rem 2rem 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#4493f8,#d29922)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🌐</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:800 }}>Spanning Tree Protocol Lab</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:'#4493f820', color:'#4493f8', border:'1px solid #4493f840', textTransform:'uppercase', letterSpacing:'0.08em' }}>Advanced</span>
            </div>
            <p style={{ margin:0, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.55 }}>Step through BPDU elections, port role assignment, loop prevention, and failure reconvergence with port roles (DP/RP/ALT) labelled on every link.</p>
          </div>
          {/* topology switcher */}
          <div style={{ display:'flex', background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:4, gap:4, flexShrink:0 }}>
            {(['BASIC','ENTERPRISE'] as Topo[]).map(t => (
              <button key={t} type="button" onClick={() => { setTopo(t); reset(); }}
                style={{ padding:'5px 12px', border:'none', borderRadius:7, fontWeight:700, fontSize:'0.72rem', cursor:'pointer', background: topo===t ? T.accent : 'transparent', color: topo===t ? '#fff' : T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
                {t==='BASIC' ? '3-Switch Triangle' : '4-Switch Enterprise'}
              </button>
            ))}
          </div>
        </div>

        {/* phase progress */}
        <div style={{ display:'flex', gap:0, borderTop:`1px solid ${T.borderColor}`, paddingTop:'0.85rem', paddingBottom:'0.85rem', overflowX:'auto' }}>
          {PHASES.map((p, i) => {
            const done = i < phaseIdx, active = i === phaseIdx;
            const col  = active ? '#4493f8' : done ? '#3fb950' : T.textMuted;
            return (
              <React.Fragment key={p}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:72, cursor:'pointer', opacity: active ? 1 : done ? 0.85 : 0.45, transition:'opacity 0.2s' }} onClick={() => setPhase(p)}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background: active ? '#4493f820' : done ? '#3fb95018' : T.panelBg, border:`2px solid ${col}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', transition:'all 0.3s' }}>
                    {done ? '✓' : PHASE_INFO[p].icon}
                  </div>
                  <span style={{ fontSize:'0.56rem', fontWeight:700, color:col, textTransform:'uppercase', letterSpacing:'0.04em', textAlign:'center', lineHeight:1.3, maxWidth:64 }}>{p.replace('_',' ')}</span>
                </div>
                {i < PHASES.length-1 && <div style={{ flex:1, height:2, background: i < phaseIdx ? '#3fb950' : T.borderColor, alignSelf:'flex-start', marginTop:13, transition:'background 0.4s', minWidth:8 }} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ padding:'1.25rem 2rem 2rem' }}>

        {/* ── Phase guide card ── */}
        <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderLeft:`4px solid #4493f8`, borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem', animation:'stp-fade 0.25s ease-out', display:'flex', gap:'1rem', alignItems:'flex-start' }}>
          <div style={{ fontSize:'1.5rem', flexShrink:0, marginTop:2 }}>{info.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:'0.9rem', marginBottom:4 }}>{info.title}</div>
            <p style={{ margin:'0 0 8px', fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.65 }}>{info.desc}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6, background:T.insetBg, borderRadius:7, padding:'5px 10px' }}>
              <span style={{ fontSize:'0.7rem', fontWeight:800, color:'#d29922' }}>LOOK FOR</span>
              <span style={{ fontSize:'0.72rem', color:T.textSecondary }}>{info.hint}</span>
            </div>
          </div>
        </div>

        {/* ── SVG topology ── */}
        <div style={{ background:'#0d1117', borderRadius:16, border:`1px solid ${T.borderColor}`, padding:'1.5rem', marginBottom:'1.25rem', position:'relative' }}>
          {/* legend */}
          <div style={{ position:'absolute', top:12, right:16, display:'flex', gap:10, flexWrap:'wrap', justifyContent:'flex-end' }}>
            {[['#22c55e','Forwarding'],['#ef4444','Blocked (ALT)'],['#eab308','Transitioning'],['#3b82f6','BPDU flow'],['#6b7280','Link down']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:18, height:3, background:c, borderRadius:2 }} />
                <span style={{ fontSize:'0.6rem', color:'#8b949e' }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ position:'absolute', top:12, left:16, display:'flex', gap:8 }}>
            {[['#4493f8','DP – Designated'],['#3fb950','RP – Root Port'],['#f85149','ALT – Blocked']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:22, height:14, borderRadius:4, background:`${c}22`, border:`1px solid ${c}70`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:'8px', fontWeight:800, color:c }}>{l.split(' ')[0]}</span>
                </div>
                <span style={{ fontSize:'0.6rem', color:'#8b949e' }}>{l.split('–')[1]}</span>
              </div>
            ))}
          </div>

          {topo === 'BASIC' && (
            <svg viewBox="0 0 600 310" style={{ width:'100%', height:'auto', marginTop:28 }}>
              <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              {/* Links (drawn first, behind nodes) */}
              <NetLink x1={BN.A.cx} y1={BN.A.cy} x2={BN.B.cx} y2={BN.B.cy} cfg={bc.links.AB} />
              <NetLink x1={BN.A.cx} y1={BN.A.cy} x2={BN.C.cx} y2={BN.C.cy} cfg={bc.links.AC} />
              <NetLink x1={BN.B.cx} y1={BN.B.cy} x2={BN.C.cx} y2={BN.C.cy} cfg={bc.links.BC} />
              {/* Nodes (drawn on top) */}
              <SwNode {...BN.A} isRoot={bc.root} bpdu={isBpdu} dark={isDarkMode} />
              <SwNode {...BN.B} bpdu={isBpdu} dark={isDarkMode} />
              <SwNode {...BN.C} bpdu={isBpdu} dark={isDarkMode} />
            </svg>
          )}

          {topo === 'ENTERPRISE' && (
            <svg viewBox="0 0 600 430" style={{ width:'100%', height:'auto', marginTop:28 }}>
              <defs>
                <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <NetLink x1={EN.C1.cx} y1={EN.C1.cy} x2={EN.D1.cx} y2={EN.D1.cy} cfg={ec.links.C1D1} />
              <NetLink x1={EN.C1.cx} y1={EN.C1.cy} x2={EN.D2.cx} y2={EN.D2.cy} cfg={ec.links.C1D2} />
              <NetLink x1={EN.D1.cx} y1={EN.D1.cy} x2={EN.D2.cx} y2={EN.D2.cy} cfg={ec.links.D1D2} />
              <NetLink x1={EN.D1.cx} y1={EN.D1.cy} x2={EN.A1.cx} y2={EN.A1.cy} cfg={ec.links.D1A1} />
              <NetLink x1={EN.D2.cx} y1={EN.D2.cy} x2={EN.A1.cx} y2={EN.A1.cy} cfg={ec.links.D2A1} />
              <SwNode {...EN.C1} isRoot={ec.root} bpdu={isBpdu} dark={isDarkMode} />
              <SwNode {...EN.D1} bpdu={isBpdu} dark={isDarkMode} />
              <SwNode {...EN.D2} bpdu={isBpdu} dark={isDarkMode} />
              <SwNode {...EN.A1} bpdu={isBpdu} dark={isDarkMode} />
            </svg>
          )}
        </div>

        {/* ── Controls ── */}
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'1.25rem' }}>
          <button type="button" onClick={next}
            style={{ flex:1, padding:'0.75rem 1.5rem', background: phase==='CONVERGED_ALT'?T.panelBg:T.accent, color: phase==='CONVERGED_ALT'?T.textSecondary:'#fff', border:`1px solid ${phase==='CONVERGED_ALT'?T.borderColor:T.accent}`, borderRadius:10, fontWeight:800, fontSize:'0.85rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}>
            {nextLabel[phase]}
          </button>
          {phase !== 'IDLE' && (
            <button type="button" onClick={reset}
              style={{ padding:'0.75rem 1.1rem', background:'none', border:`1px solid ${T.borderColor}`, borderRadius:10, color:T.textMuted, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit' }}>
              ↺ Reset
            </button>
          )}
          <div style={{ fontSize:'0.72rem', color:T.textMuted, whiteSpace:'nowrap' }}>
            Step {phaseIdx + 1} / {PHASES.length}
          </div>
        </div>

        {/* ── Port role reference table ── */}
        {(phase === 'CONVERGED' || phase === 'CONVERGED_ALT') && (
          <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', marginBottom:'1.25rem', animation:'stp-fade 0.2s ease-out' }}>
            <div style={{ fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.75rem' }}>
              Port Role Summary — {phase === 'CONVERGED' ? 'Initial Convergence' : 'After Failover'}
            </div>
            {topo === 'BASIC' ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[
                  { sw:'SW-A (ROOT)', ports: phase==='CONVERGED' ? [['→ SW-B','DP','#4493f8'],['→ SW-C','DP','#4493f8']] : [['→ SW-B','DOWN','#6b7280'],['→ SW-C','DP','#4493f8']] },
                  { sw:'SW-B', ports: phase==='CONVERGED' ? [['→ SW-A','RP','#3fb950'],['→ SW-C','DP','#4493f8']] : [['→ SW-A','DOWN','#6b7280'],['→ SW-C','RP','#3fb950']] },
                  { sw:'SW-C', ports: phase==='CONVERGED' ? [['→ SW-A','RP','#3fb950'],['→ SW-B','ALT','#f85149']] : [['→ SW-A','RP','#3fb950'],['→ SW-B','DP','#4493f8']] },
                ].map(row => (
                  <div key={row.sw} style={{ background:T.insetBg, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.6rem' }}>
                    <div style={{ fontSize:'0.7rem', fontWeight:700, color:T.textPrimary, marginBottom:6 }}>{row.sw}</div>
                    {(row.ports as [string,string,string][]).map(([link,role,col]) => (
                      <div key={link} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                        <span style={{ fontSize:'0.66rem', color:T.textMuted, fontFamily:'monospace' }}>{link}</span>
                        <span style={{ fontSize:'0.63rem', fontWeight:800, padding:'1px 6px', borderRadius:4, background:`${col}20`, color:col, border:`1px solid ${col}50` }}>{role}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[
                  { sw:'SW-1 (ROOT)', ports: phase==='CONVERGED' ? [['→ Dist-1','DP','#4493f8'],['→ Dist-2','DP','#4493f8']] : [['→ Dist-1','DOWN','#6b7280'],['→ Dist-2','DP','#4493f8']] },
                  { sw:'Dist-1', ports: phase==='CONVERGED' ? [['→ SW-1','RP','#3fb950'],['↔ Dist-2','DP','#4493f8'],['→ Acc-1','DP','#4493f8']] : [['→ SW-1','DOWN','#6b7280'],['↔ Dist-2','RP','#3fb950'],['→ Acc-1','DP','#4493f8']] },
                  { sw:'Dist-2', ports: phase==='CONVERGED' ? [['→ SW-1','RP','#3fb950'],['↔ Dist-1','ALT','#f85149'],['→ Acc-1','DP','#4493f8']] : [['→ SW-1','RP','#3fb950'],['↔ Dist-1','DP','#4493f8'],['→ Acc-1','DP','#4493f8']] },
                  { sw:'Access-1', ports: phase==='CONVERGED' ? [['→ Dist-1','RP','#3fb950'],['→ Dist-2','ALT','#f85149']] : [['→ Dist-1','ALT','#f85149'],['→ Dist-2','RP','#3fb950']] },
                ].map(row => (
                  <div key={row.sw} style={{ background:T.insetBg, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.6rem' }}>
                    <div style={{ fontSize:'0.7rem', fontWeight:700, color:T.textPrimary, marginBottom:6 }}>{row.sw}</div>
                    {(row.ports as [string,string,string][]).map(([link,role,col]) => (
                      <div key={link} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                        <span style={{ fontSize:'0.62rem', color:T.textMuted, fontFamily:'monospace' }}>{link}</span>
                        <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'1px 5px', borderRadius:4, background:`${col}20`, color:col, border:`1px solid ${col}50` }}>{role}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <LabEduPanel cards={STP_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default StpLab;
