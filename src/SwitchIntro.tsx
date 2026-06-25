import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

type TabId = 'overview' | 'types' | 'hierarchy';

/* ─── Hub vs Switch animated comparison ─────────────────────────── */
const R   = 68;
const CX  = 135;
const CY  = 108;
const NODES = [
  { label:'PC-1', x:CX,      y:CY-R,        role:'source' },
  { label:'PC-2', x:CX+R*Math.sin(Math.PI/3), y:CY-R*Math.cos(Math.PI/3), role:'other' },
  { label:'PC-3', x:CX+R*Math.sin(2*Math.PI/3), y:CY+R*Math.cos(Math.PI/3), role:'dest' },
  { label:'PC-4', x:CX,      y:CY+R,        role:'other' },
  { label:'PC-5', x:CX-R*Math.sin(2*Math.PI/3), y:CY+R*Math.cos(Math.PI/3), role:'other' },
  { label:'PC-6', x:CX-R*Math.sin(Math.PI/3), y:CY-R*Math.cos(Math.PI/3), role:'other' },
];

function DevTopo({ mode, sent, dark }: { mode:'hub'|'switch'; sent:boolean; dark:boolean }) {
  const isHub = mode === 'hub';

  const linkColor = (i: number) => {
    if (!sent) return dark ? '#30363d' : '#cbd5e1';
    if (isHub) return '#f97316';       // hub: all orange
    if (i === 0) return '#4493f8';     // switch: source = blue (incoming)
    if (i === 2) return '#22c55e';     // switch: dest   = green (outgoing)
    return dark ? '#21262d' : '#e2e8f0'; // switch: others fade
  };

  const nodeColor = (i: number) => {
    if (!sent) return i === 0 ? '#4493f8' : i === 2 ? '#22c55e' : (dark?'#30363d':'#cbd5e1');
    if (isHub) return '#f97316';
    if (i === 0) return '#4493f8';
    if (i === 2) return '#22c55e';
    return dark ? '#21262d' : '#e2e8f0';
  };

  const centerColor = sent ? (isHub ? '#f97316' : '#22c55e') : '#4493f8';
  const centerLabel = isHub ? 'HUB' : 'SW';

  return (
    <svg viewBox="0 0 270 218" style={{ width:'100%', height:'auto' }}>
      {/* Links */}
      {NODES.map((n, i) => (
        <line key={i}
          x1={CX} y1={CY} x2={n.x} y2={n.y}
          stroke={linkColor(i)} strokeWidth={sent && (isHub || i===0 || i===2) ? 2.5 : 1.5}
          strokeDasharray={sent && isHub ? '6,3' : 'none'}
          style={{ transition:'stroke 0.3s, stroke-width 0.3s' }}
        />
      ))}
      {/* Nodes */}
      {NODES.map((n, i) => {
        const col = nodeColor(i);
        const isS = n.role === 'source';
        const isD = n.role === 'dest';
        return (
          <g key={i} transform={`translate(${n.x},${n.y})`}>
            <rect x={-22} y={-11} width={44} height={22} rx={6} fill={`${col}18`} stroke={col} strokeWidth={1.5} style={{ transition:'fill 0.3s, stroke 0.3s' }} />
            <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={col} style={{ transition:'fill 0.3s' }}>{n.label}</text>
            {(isS || isD) && (
              <text x={0} y={16} textAnchor="middle" fontSize={7} fill={isS?'#4493f8':'#22c55e'} fontWeight={600}>{isS?'SOURCE':'DEST'}</text>
            )}
          </g>
        );
      })}
      {/* Center device */}
      <g transform={`translate(${CX},${CY})`}>
        <rect x={-22} y={-13} width={44} height={26} rx={7} fill={`${centerColor}22`} stroke={centerColor} strokeWidth={2} style={{ transition:'fill 0.35s, stroke 0.35s' }} />
        <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={900} fill={centerColor} style={{ transition:'fill 0.35s' }}>{centerLabel}</text>
      </g>
      {/* Result label */}
      {sent && (
        <g>
          <rect x={4} y={192} width={260} height={22} rx={6} fill={isHub?'#f9731620':'#22c55e16'} />
          <text x={134} y={203} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={isHub?'#f97316':'#22c55e'}>
            {isHub ? 'Frame sent to ALL 5 ports — every PC sees it' : 'Frame sent to PC-3 only — other PCs unaffected'}
          </text>
        </g>
      )}
    </svg>
  );
}

/* ─── Switch type cards data ─────────────────────────────────────── */
const SWITCH_TYPES = [
  {
    icon:'🔌', name:'Unmanaged Switch', tier:'Home / SOHO',
    tierColor:'#22c55e',
    summary:'Plug-in and forget. No configuration interface. Forwards based on MAC addresses automatically.',
    features:['Zero configuration','Fixed port speed','No VLANs or QoS','Very low cost'],
    where:'Home networks, small printers clusters, quick expansions',
  },
  {
    icon:'⚙️', name:'Managed Switch (Layer 2)', tier:'Enterprise Access',
    tierColor:'#4493f8',
    summary:'Full CLI or web UI. Supports VLANs, Spanning Tree, port security, SNMP monitoring, and QoS.',
    features:['VLAN segmentation','Spanning Tree Protocol','Port mirroring & SPAN','SNMP / syslog support'],
    where:'Office floors, school labs, campus access layer',
  },
  {
    icon:'🌐', name:'Layer 3 Switch (MLS)', tier:'Distribution / Core',
    tierColor:'#a855f7',
    summary:'Routes IP packets between VLANs internally — no dedicated router needed for inter-VLAN traffic.',
    features:['Inter-VLAN routing','Static & dynamic routes','Hardware-speed routing','ACLs on routed interfaces'],
    where:'Distribution layer, collapsing router + switch into one device',
  },
  {
    icon:'⚡', name:'PoE Switch', tier:'Access (IP devices)',
    tierColor:'#f59e0b',
    summary:'Delivers DC power over the Ethernet cable (IEEE 802.3af/at/bt). Eliminates separate power adapters.',
    features:['802.3af: 15.4 W per port','802.3at (PoE+): 30 W','802.3bt (PoE++): 90 W','Per-port power budget'],
    where:'IP cameras, VoIP phones, Wi-Fi access points, IoT sensors',
  },
  {
    icon:'📦', name:'Stackable Switch', tier:'Scalable Access',
    tierColor:'#06b6d4',
    summary:'Multiple physical units connected via stack cables and managed as a single logical device.',
    features:['Single IP / single config','Shared MAC table','Redundant stack ring','Scale ports without reconfiguring'],
    where:'Growing access layers, server farms needing dense 10G ports',
  },
  {
    icon:'🏢', name:'Chassis / Modular Switch', tier:'Core / Data Centre',
    tierColor:'#ef4444',
    summary:'Fixed chassis with swappable line cards, supervisor engines, and power supplies. Built for massive scale.',
    features:['Hot-swap line cards','Redundant supervisors','Tbps switching capacity','High availability / HA'],
    where:'Data centre core, ISP PoP, enterprise network backbone',
  },
];

/* ─── Network Hierarchy SVG ──────────────────────────────────────── */
function HierarchySvg({ dark }: { dark:boolean }) {
  const mc  = dark ? '#8b949e' : '#64748b';

  const CORE  = { label:'Core Switch', sub:'Cisco Catalyst 9500 / Nexus 9000', col:'#ef4444' };
  const DIST  = { label:'Distribution', sub:'Layer 3 — inter-VLAN routing, ACLs', col:'#a855f7' };
  const ACC   = { label:'Access', sub:'PoE / Managed L2 — connects end devices', col:'#22c55e' };

  const coreCx = 320;
  const distXs = [160, 480];
  const accXs  = [60, 230, 400, 570];
  const row    = [50, 155, 265];

  const swBox = (cx: number, cy: number, col: string, label: string, sub: string) => (
    <g key={`${cx}-${cy}`}>
      <rect x={cx-52} y={cy-20} width={104} height={40} rx={8} fill={`${col}16`} stroke={col} strokeWidth={1.5} />
      <text x={cx} y={cy-4} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={800} fill={col}>{label}</text>
      <text x={cx} y={cy+10} textAnchor="middle" dominantBaseline="middle" fontSize={7.5} fill={mc}>{sub}</text>
    </g>
  );

  const line = (x1:number, y1:number, x2:number, y2:number, col:string) => (
    <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={1.5} strokeOpacity={0.6} />
  );

  const devIcons = ['🖥️ PCs', '🖨️ Print', '📷 Cameras', '📡 APs'];

  return (
    <svg viewBox="0 0 640 340" style={{ width:'100%', height:'auto' }}>
      {/* Core → Distribution links */}
      {distXs.map(dx => line(coreCx, row[0]+20, dx, row[1]-20, DIST.col))}
      {/* Distribution → Access links */}
      {[0,1].map(di => [0,1].map(ai => line(distXs[di], row[1]+20, accXs[di*2+ai], row[2]-20, ACC.col)))}

      {/* Switches */}
      {swBox(coreCx, row[0], CORE.col, CORE.label, '')}
      {distXs.map(dx => swBox(dx, row[1], DIST.col, DIST.label, ''))}
      {accXs.map(ax => swBox(ax, row[2], ACC.col, ACC.label, ''))}

      {/* Device labels */}
      {accXs.map((ax, i) => (
        <text key={i} x={ax} y={row[2]+34} textAnchor="middle" fontSize={9} fill={mc}>{devIcons[i]}</text>
      ))}

      {/* Tier annotations (right side) */}
      {[
        { y:row[0], col:CORE.col, label:'CORE LAYER', sub:'Speed — no policy' },
        { y:row[1], col:DIST.col, label:'DISTRIBUTION', sub:'Routing, ACLs, QoS' },
        { y:row[2], col:ACC.col, label:'ACCESS LAYER', sub:'End-device connectivity' },
      ].map(a => (
        <g key={a.label}>
          <rect x={602} y={a.y-16} width={3} height={32} rx={1.5} fill={a.col} />
          <text x={608} y={a.y-4} fontSize={8.5} fontWeight={800} fill={a.col}>{a.label}</text>
          <text x={608} y={a.y+8} fontSize={7.5} fill={mc}>{a.sub}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── Overview tab ───────────────────────────────────────────────── */
function OverviewTab({ dark, T }: { dark:boolean; T: ReturnType<typeof getLabTheme> }) {
  const [sent, setSent] = useState(false);

  const keyFacts = [
    { icon:'📋', col:'#4493f8', title:'Layer 2 Device', body:'A switch operates at the Data Link layer. It reads the destination MAC address in each Ethernet frame to decide which port to forward it out of.' },
    { icon:'🗂️', col:'#a855f7', title:'MAC Address Table', body:'When a frame arrives, the switch learns the source MAC → port mapping. Next time that MAC is the destination, the switch forwards directly rather than flooding.' },
    { icon:'🔄', col:'#22c55e', title:'Full-Duplex Ports', body:'Every switch port is its own collision domain. Devices can send and receive simultaneously at full line-rate — completely eliminating the collisions that plagued shared-hub networks.' },
    { icon:'⚡', col:'#f59e0b', title:'Wire-Speed Forwarding', body:'Modern switches forward frames in hardware using ASICs (not software). A 48-port gigabit switch can switch all 48 ports simultaneously at 1 Gbps each.' },
  ];

  return (
    <div style={{ animation:'si-fade 0.2s ease-out' }}>
      {/* What is a switch */}
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:'1rem' }}>
        <h3 style={{ margin:'0 0 0.6rem', fontSize:'0.95rem', fontWeight:800 }}>What is a network switch?</h3>
        <p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.7 }}>
          A <strong style={{ color:T.textPrimary }}>network switch</strong> is a Layer 2 device that connects multiple devices on the same local area network (LAN). Unlike a hub — which blindly sends every frame to every port — a switch <em>learns</em> which device lives on which port and delivers frames only to the correct destination. This makes the network faster, more secure, and more efficient.
        </p>
        <p style={{ margin:'0.6rem 0 0', fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.7 }}>
          Switches replaced hubs in the 1990s and are now the fundamental building block of every wired LAN, from a home with three devices to a data centre with 100,000 servers.
        </p>
      </div>

      {/* Key facts grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {keyFacts.map(f => (
          <div key={f.title} style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'0.9rem 1rem', display:'flex', gap:10 }}>
            <div style={{ fontSize:'1.2rem', lineHeight:1, flexShrink:0 }}>{f.icon}</div>
            <div>
              <div style={{ fontSize:'0.78rem', fontWeight:800, color:f.col, marginBottom:4 }}>{f.title}</div>
              <div style={{ fontSize:'0.74rem', color:T.textSecondary, lineHeight:1.6 }}>{f.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Hub vs Switch */}
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'0.75rem 1.25rem', borderBottom:`1px solid ${T.borderColor}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.88rem', marginBottom:2 }}>Hub vs Switch — Frame Delivery</div>
            <div style={{ fontSize:'0.72rem', color:T.textMuted }}>PC-1 sends a frame to PC-3. Watch the difference.</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={() => setSent(true)}
              style={{ padding:'6px 16px', borderRadius:8, border:'none', background:'#4493f8', color:'#fff', fontWeight:700, fontSize:'0.76rem', cursor:'pointer', fontFamily:'inherit', opacity:sent?0.5:1 }}>
              ▶ Send Frame
            </button>
            <button type="button" onClick={() => setSent(false)}
              style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:T.textMuted, fontWeight:700, fontSize:'0.76rem', cursor:'pointer', fontFamily:'inherit' }}>
              Reset
            </button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ padding:'0.75rem', borderRight:`1px solid ${T.borderColor}` }}>
            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#f97316', textAlign:'center', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Hub</div>
            <DevTopo mode="hub" sent={sent} dark={dark} />
            <p style={{ margin:'0.5rem 0 0', fontSize:'0.7rem', color:T.textMuted, textAlign:'center', lineHeight:1.5 }}>
              All devices see every frame.<br />Shared bandwidth. Collision domain.
            </p>
          </div>
          <div style={{ padding:'0.75rem' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#22c55e', textAlign:'center', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Switch</div>
            <DevTopo mode="switch" sent={sent} dark={dark} />
            <p style={{ margin:'0.5rem 0 0', fontSize:'0.7rem', color:T.textMuted, textAlign:'center', lineHeight:1.5 }}>
              Only the destination port is used.<br />Dedicated bandwidth per port.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Switch Types tab ───────────────────────────────────────────── */
function TypesTab({ T }: { T: ReturnType<typeof getLabTheme> }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ animation:'si-fade 0.2s ease-out' }}>
      <p style={{ margin:'0 0 1rem', fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.6 }}>
        Not all switches are equal. The type you deploy depends on where in the network it lives, what features are required, and the budget available. Here are the six categories you'll encounter in real deployments and on exams.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
        {SWITCH_TYPES.map(t => {
          const open = expanded === t.name;
          return (
            <div key={t.name} style={{ background:T.panelBg, border:`1px solid ${open ? t.tierColor : T.borderColor}`, borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s' }}
              onClick={() => setExpanded(open ? null : t.name)}>
              <div style={{ padding:'0.85rem 1rem', display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ fontSize:'1.4rem', lineHeight:1, flexShrink:0 }}>{t.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:'0.82rem', marginBottom:3 }}>{t.name}</div>
                  <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${t.tierColor}18`, color:t.tierColor, border:`1px solid ${t.tierColor}40` }}>{t.tier}</span>
                </div>
                <div style={{ fontSize:'0.65rem', color:T.textMuted, flexShrink:0 }}>{open?'▲':'▼'}</div>
              </div>
              {open && (
                <div style={{ padding:'0 1rem 1rem', borderTop:`1px solid ${T.borderColor}`, paddingTop:'0.75rem' }} onClick={e=>e.stopPropagation()}>
                  <p style={{ margin:'0 0 0.75rem', fontSize:'0.76rem', color:T.textSecondary, lineHeight:1.6 }}>{t.summary}</p>
                  <div style={{ marginBottom:'0.75rem' }}>
                    <div style={{ fontSize:'0.65rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Key Features</div>
                    {t.features.map(f => (
                      <div key={f} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:t.tierColor, flexShrink:0 }} />
                        <span style={{ fontSize:'0.74rem', color:T.textSecondary }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:T.insetBg, borderRadius:8, padding:'0.5rem 0.75rem' }}>
                    <span style={{ fontSize:'0.65rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase' }}>Typical use: </span>
                    <span style={{ fontSize:'0.74rem', color:T.textSecondary }}>{t.where}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Network Hierarchy tab ──────────────────────────────────────── */
function HierarchyTab({ dark, T }: { dark:boolean; T: ReturnType<typeof getLabTheme> }) {
  const tiers = [
    { col:'#ef4444', label:'Core Layer', icon:'🏎️', summary:'The high-speed backbone. Switches here move traffic between distribution blocks as fast as possible with no filtering or QoS — just raw switching throughput.', specs:['100 Gbps / 400 Gbps ports','Sub-microsecond latency','Redundant pair (no STP needed with L3 routed links)','Examples: Cisco Nexus 9000, Arista 7500'], },
    { col:'#a855f7', label:'Distribution Layer', icon:'🔀', summary:'The intelligence layer. Distribution switches do inter-VLAN routing, apply ACLs, enforce QoS policies, and summarise routes before passing traffic to core.', specs:['Layer 3 switching (MLS)','Route summarisation','Policy enforcement (ACL / QoS)','Examples: Cisco Catalyst 9300, 9400'], },
    { col:'#22c55e', label:'Access Layer', icon:'🔌', summary:'Where end devices connect. Access switches must be cheap, dense, and PoE-capable. They operate at Layer 2 and carry multiple VLANs as trunks toward distribution.', specs:['48 × 1 Gbps PoE+ ports','Managed Layer 2','Trunk uplink to distribution','Examples: Cisco Catalyst 9200, HP Aruba 2930'], },
  ];

  return (
    <div style={{ animation:'si-fade 0.2s ease-out' }}>
      <p style={{ margin:'0 0 1rem', fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.6 }}>
        Enterprise networks use a <strong style={{ color:T.textPrimary }}>3-tier hierarchical model</strong> to separate concerns: each layer has a distinct role, which simplifies design, troubleshooting, and upgrades. Every switch you buy fits into one of these three tiers.
      </p>

      <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1rem', marginBottom:'1.25rem' }}>
        <HierarchySvg dark={dark} />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {tiers.map(tier => (
          <div key={tier.label} style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem 1.1rem', display:'flex', gap:'1rem' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${tier.col}20`, border:`1px solid ${tier.col}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>{tier.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:'0.85rem', color:tier.col, marginBottom:4 }}>{tier.label}</div>
              <p style={{ margin:'0 0 0.6rem', fontSize:'0.76rem', color:T.textSecondary, lineHeight:1.6 }}>{tier.summary}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {tier.specs.map(s => (
                  <span key={s} style={{ fontSize:'0.67rem', padding:'2px 8px', borderRadius:20, background:T.insetBg, border:`1px solid ${T.borderColor}`, color:T.textMuted }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick rule of thumb */}
      <div style={{ marginTop:'1rem', background:`#4493f820`, border:`1px solid #4493f840`, borderRadius:12, padding:'0.85rem 1rem' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#4493f8', textTransform:'uppercase', marginBottom:4 }}>Exam Rule of Thumb</div>
        <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.6 }}>
          Access = many cheap L2 PoE switches · Distribution = fewer L3 switches (routing, ACLs) · Core = one fast redundant pair (no filtering). If a question says "where do you apply ACLs?", the answer is <strong style={{ color:T.textPrimary }}>Distribution</strong>. If it says "where do end devices connect?", the answer is <strong style={{ color:T.textPrimary }}>Access</strong>.
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
interface Props { isDarkMode?: boolean; }

export const SwitchIntro: React.FC<Props> = ({ isDarkMode = true }) => {
  const T   = getLabTheme(isDarkMode);
  const [tab, setTab] = useState<TabId>('overview');

  const TABS: [TabId, string, string][] = [
    ['overview',   '💡 What is a Switch?', 'Fundamentals and hub comparison'],
    ['types',      '🗂️ Switch Types',       'Unmanaged to chassis'],
    ['hierarchy',  '🏗️ Network Hierarchy',  '3-tier access/dist/core model'],
  ];

  return (
    <div style={{ background:T.cardBg, borderRadius:20, border:`1px solid ${T.borderColor}`, overflow:'hidden', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`@keyframes si-fade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }`}</style>

      {/* Header gradient bar */}
      <div style={{ height:3, background:'linear-gradient(90deg,#22c55e,#4493f8,#a855f7)' }} />

      <div style={{ padding:'1.75rem 2rem 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#22c55e,#4493f8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔀</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:800 }}>Network Switches — Concepts & Types</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:'#22c55e20', color:'#22c55e', border:'1px solid #22c55e40', textTransform:'uppercase', letterSpacing:'0.08em' }}>Beginner</span>
            </div>
            <p style={{ margin:0, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.55 }}>
              Understand what a switch does, how it differs from a hub, the six categories of switches, and where each fits in the 3-tier network model.
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:0, borderTop:`1px solid ${T.borderColor}`, paddingTop:'0.1rem' }}>
          {TABS.map(([id, label, hint]) => (
            <button key={id} type="button" onClick={() => setTab(id)} title={hint}
              style={{ padding:'0.55rem 1.1rem', border:'none', borderBottom: tab===id?`2px solid #4493f8`:'2px solid transparent', background:'none', color: tab===id?'#4493f8':T.textMuted, fontWeight:700, fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'color 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'1.5rem 2rem 2rem' }}>
        {tab === 'overview'   && <OverviewTab   dark={isDarkMode} T={T} />}
        {tab === 'types'      && <TypesTab      T={T} />}
        {tab === 'hierarchy'  && <HierarchyTab  dark={isDarkMode} T={T} />}
      </div>
    </div>
  );
};

export default SwitchIntro;
