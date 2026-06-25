import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

type TabId = 'overview' | 'types' | 'table';

/* ─── IP helpers for LPM demo ────────────────────────────────────── */
function ipToInt(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) return NaN;
  return parts.reduce<number>((acc, o) => (acc << 8) | parseInt(o, 10), 0) >>> 0;
}
function isValidIP(ip: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && ip.split('.').every(o => parseInt(o) <= 255);
}

interface Route { prefix: string; nexthop: string; iface: string; src: string; }
const ROUTES: Route[] = [
  { prefix:'10.10.10.0/24',  nexthop:'directly connected', iface:'Gi0/2', src:'C' },
  { prefix:'10.10.0.0/16',   nexthop:'10.1.1.2',           iface:'Gi0/1', src:'O' },
  { prefix:'10.0.0.0/8',     nexthop:'10.1.1.1',           iface:'Gi0/1', src:'S' },
  { prefix:'192.168.1.0/24', nexthop:'directly connected', iface:'Gi0/0', src:'C' },
  { prefix:'172.16.0.0/12',  nexthop:'10.1.1.3',           iface:'Gi0/1', src:'O' },
  { prefix:'0.0.0.0/0',      nexthop:'203.0.113.1',        iface:'Gi0/0', src:'S' },
];

function lpm(destIP: string): Route | null {
  if (!isValidIP(destIP)) return null;
  const dest = ipToInt(destIP);
  let best: Route | null = null;
  let bestBits = -1;
  for (const r of ROUTES) {
    const [net, bitsStr] = r.prefix.split('/');
    const bits = parseInt(bitsStr, 10);
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    if ((dest & mask) >>> 0 === (ipToInt(net) & mask) >>> 0 && bits > bestBits) {
      best = r; bestBits = bits;
    }
  }
  return best;
}

/* ─── Router vs Switch diagrams (one per side) ───────────────────── */
function SameSubnetDiagram({ sent, dark }: { sent:boolean; dark:boolean }) {
  const tc = dark ? '#e6edf3' : '#1e293b';
  const mc = dark ? '#8b949e' : '#64748b';
  const G  = '#22c55e';
  const BL = '#4493f8';
  const col = (base: string) => sent ? G : base;
  const lc  = sent ? G : (dark ? '#30363d' : '#cbd5e1');

  const Node = ({ cx, cy, icon, label, sub, c }: { cx:number; cy:number; icon:string; label:string; sub:string; c:string }) => (
    <g>
      <rect x={cx-30} y={cy-20} width={60} height={40} rx={9} fill={`${c}16`} stroke={c} strokeWidth={1.5} style={{ transition:'stroke 0.3s' }} />
      <text x={cx} y={cy-3}  textAnchor="middle" dominantBaseline="middle" fontSize={18}>{icon}</text>
      <text x={cx} y={cy+26} textAnchor="middle" fontSize={9}   fontWeight={700} fill={tc}>{label}</text>
      <text x={cx} y={cy+38} textAnchor="middle" fontSize={7.5} fill={mc}>{sub}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 280 110" style={{ width:'100%', height:'auto' }}>
      <line x1={62} y1={44} x2={108} y2={44} stroke={lc} strokeWidth={2} strokeDasharray={sent?'10 4':'none'} style={{ transition:'stroke 0.3s' }} />
      <line x1={172} y1={44} x2={218} y2={44} stroke={lc} strokeWidth={2} strokeDasharray={sent?'10 4':'none'} style={{ transition:'stroke 0.3s' }} />
      <Node cx={35}  cy={44} icon="🖥️" label="PC-A" sub="192.168.1.10" c={col(BL)} />
      <Node cx={140} cy={44} icon="🔀" label="Switch" sub="Layer 2"    c={col('#6b7280')} />
      <Node cx={245} cy={44} icon="🖥️" label="PC-B" sub="192.168.1.20" c={col(BL)} />
      {sent
        ? <text x={140} y={100} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={G}>✓ No router needed — same /24</text>
        : <text x={140} y={100} textAnchor="middle" fontSize={8}   fill={mc}>Both devices on 192.168.1.0/24</text>
      }
    </svg>
  );
}

function DiffSubnetDiagram({ sent, dark }: { sent:boolean; dark:boolean }) {
  const tc = dark ? '#e6edf3' : '#1e293b';
  const mc = dark ? '#8b949e' : '#64748b';
  const O  = '#f97316';
  const BL = '#4493f8';
  const col = (base: string) => sent ? O : base;
  const lc  = sent ? O : (dark ? '#30363d' : '#cbd5e1');

  const Node = ({ cx, cy, icon, label, sub, c }: { cx:number; cy:number; icon:string; label:string; sub:string; c:string }) => (
    <g>
      <rect x={cx-30} y={cy-20} width={60} height={40} rx={9} fill={`${c}16`} stroke={c} strokeWidth={1.5} style={{ transition:'stroke 0.3s' }} />
      <text x={cx} y={cy-3}  textAnchor="middle" dominantBaseline="middle" fontSize={18}>{icon}</text>
      <text x={cx} y={cy+26} textAnchor="middle" fontSize={9}   fontWeight={700} fill={tc}>{label}</text>
      <text x={cx} y={cy+38} textAnchor="middle" fontSize={7.5} fill={mc}>{sub}</text>
    </g>
  );

  return (
    <svg viewBox="0 0 280 110" style={{ width:'100%', height:'auto' }}>
      <line x1={62} y1={44} x2={108} y2={44} stroke={lc} strokeWidth={2} strokeDasharray={sent?'10 4':'none'} style={{ transition:'stroke 0.3s' }} />
      <line x1={172} y1={44} x2={218} y2={44} stroke={lc} strokeWidth={2} strokeDasharray={sent?'10 4':'none'} style={{ transition:'stroke 0.3s' }} />
      <Node cx={35}  cy={44} icon="🖥️" label="PC-A"   sub="192.168.1.10" c={col(BL)} />
      <Node cx={140} cy={44} icon="🔷" label="Router" sub="Layer 3"       c={col('#a855f7')} />
      <Node cx={245} cy={44} icon="🖥️" label="PC-B"   sub="10.0.0.5"     c={col(BL)} />
      {sent
        ? <text x={140} y={100} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={O}>Router checks table → forwards to 10.0.0.0/8</text>
        : <text x={140} y={100} textAnchor="middle" fontSize={8}   fill={mc}>PC-A on 192.168.1.0/24 · PC-B on 10.0.0.0/8</text>
      }
    </svg>
  );
}

/* ─── Router type cards ──────────────────────────────────────────── */
const ROUTER_TYPES = [
  {
    icon:'🏠', name:'Home / SOHO Router', tier:'Consumer', tierColor:'#22c55e',
    summary:'An all-in-one box combining a router, switch, Wi-Fi AP, DHCP server, and basic NAT firewall. Does everything needed for a home or very small office out of the box.',
    features:['NAT/PAT built-in','Built-in 4-port switch','2.4 / 5 GHz Wi-Fi','Web UI only — no CLI'],
    where:'Homes, coffee shops, very small offices. Examples: BT Hub, TP-Link Archer, Netgear Nighthawk.',
  },
  {
    icon:'🏢', name:'SMB / Branch Router', tier:'Small Business', tierColor:'#4493f8',
    summary:'A dedicated router with a proper CLI, site-to-site VPN support, dual WAN failover, and QoS. No built-in Wi-Fi — connects to a separate managed switch and APs.',
    features:['Dual WAN / failover','Site-to-site VPN (IPsec)','QoS for voice/video','CLI + web UI management'],
    where:'Branch offices, retail sites. Examples: Cisco ISR 1100, MikroTik RB4011, Ubiquiti EdgeRouter.',
  },
  {
    icon:'🏛️', name:'Enterprise Router', tier:'Enterprise / WAN Edge', tierColor:'#a855f7',
    summary:'High-throughput router handling thousands of concurrent flows, dynamic routing protocols (OSPF, BGP), MPLS, and redundant WAN links. Designed for always-on enterprise WAN.',
    features:['BGP / OSPF / MPLS','Multi-gig throughput','Modular interface cards','High-availability pairs'],
    where:'Head offices, data centre WAN edge. Examples: Cisco ISR 4000, ASR 1000, Juniper SRX.',
  },
  {
    icon:'🌐', name:'Service Provider Core Router', tier:'Carrier / ISP', tierColor:'#ef4444',
    summary:'Carriers and ISPs use these to route internet traffic between autonomous systems. They hold the full BGP internet routing table (900,000+ routes) at terabit speeds.',
    features:['Full BGP internet table','Terabit forwarding ASICs','Hot-swap redundancy','Sub-50ms failover'],
    where:'ISP PoPs, internet exchange points. Examples: Cisco ASR 9000, Juniper PTX, Nokia 7750.',
  },
  {
    icon:'💻', name:'Virtual / Software Router', tier:'Cloud / Lab', tierColor:'#06b6d4',
    summary:'Software running on a standard server or VM. Used in cloud environments where VPC routing is handled in software, and in labs where physical hardware isn\'t available.',
    features:['Runs on any x86 server','VPC routing in AWS/Azure','Free lab options (VyOS)','Lower throughput than hardware'],
    where:'Cloud VPCs, dev/test labs, budget branch offices. Examples: VyOS, pfSense, Cisco CSR 1000v.',
  },
  {
    icon:'☁️', name:'SD-WAN Edge Device', tier:'Modern Enterprise', tierColor:'#f59e0b',
    summary:'Software-Defined WAN overlays intelligent routing on top of any underlay (broadband, LTE, MPLS). The controller in the cloud pushes policy — no per-router CLI configuration needed.',
    features:['Centralised cloud controller','App-aware path selection','Zero-touch provisioning','MPLS + broadband + LTE bonding'],
    where:'Multi-site enterprises replacing MPLS. Examples: Cisco Viptela, VMware VeloCloud, Meraki MX.',
  },
];

/* ─── Overview tab ───────────────────────────────────────────────── */
function OverviewTab({ dark, T }: { dark:boolean; T: ReturnType<typeof getLabTheme> }) {
  const [sent, setSent] = useState(false);

  const facts = [
    { icon:'🌐', col:'#4493f8', title:'Layer 3 Device', body:'A router reads the destination IP address in each packet (not the MAC address). It makes forwarding decisions based on its routing table — a database of known networks and where to send traffic for each one.' },
    { icon:'🗺️', col:'#a855f7', title:'Connects Different Networks', body:'A switch connects devices on the same network. A router connects different networks together — between VLANs, between your office and the internet, or between branch offices over a WAN.' },
    { icon:'📋', col:'#22c55e', title:'Routing Table', body:'Every router maintains a routing table: a list of destination prefixes and what next-hop address or interface to use. Routes can be added manually (static) or learned automatically (OSPF, BGP, RIP).' },
    { icon:'🔄', col:'#f59e0b', title:'NAT & WAN Gateway', body:'At the network edge, routers also perform NAT — translating your private 192.168.x.x addresses into a single public IP. This is why every device in your home can reach the internet from one IP.' },
  ];

  return (
    <div style={{ animation:'ri-fade 0.2s ease-out' }}>
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.25rem 1.5rem', marginBottom:'1rem' }}>
        <h3 style={{ margin:'0 0 0.6rem', fontSize:'0.95rem', fontWeight:800 }}>What is a router?</h3>
        <p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.7 }}>
          A <strong style={{ color:T.textPrimary }}>router</strong> is a Layer 3 device that forwards packets between different IP networks. While a switch connects devices within the same network using MAC addresses, a router connects <em>separate</em> networks using IP addresses and a routing table.
        </p>
        <p style={{ margin:'0.6rem 0 0', fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.7 }}>
          Every packet that leaves your local network passes through a router. The router inspects the destination IP, finds the best matching route in its table, and sends the packet toward its destination — one hop at a time.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
        {facts.map(f => (
          <div key={f.title} style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'0.9rem 1rem', display:'flex', gap:10 }}>
            <div style={{ fontSize:'1.2rem', lineHeight:1, flexShrink:0 }}>{f.icon}</div>
            <div>
              <div style={{ fontSize:'0.78rem', fontWeight:800, color:f.col, marginBottom:4 }}>{f.title}</div>
              <div style={{ fontSize:'0.74rem', color:T.textSecondary, lineHeight:1.6 }}>{f.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Switch vs Router diagram */}
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'0.75rem 1.25rem', borderBottom:`1px solid ${T.borderColor}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.88rem', marginBottom:2 }}>When Do You Need a Router?</div>
            <div style={{ fontSize:'0.72rem', color:T.textMuted }}>PC-A sends a packet. See the difference when the destination is on a different subnet.</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button type="button" onClick={() => setSent(true)} style={{ padding:'6px 16px', borderRadius:8, border:'none', background:'#4493f8', color:'#fff', fontWeight:700, fontSize:'0.76rem', cursor:'pointer', fontFamily:'inherit', opacity:sent?0.5:1 }}>▶ Send Packet</button>
            <button type="button" onClick={() => setSent(false)} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:T.textMuted, fontWeight:700, fontSize:'0.76rem', cursor:'pointer', fontFamily:'inherit' }}>Reset</button>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          <div style={{ padding:'0.75rem', borderRight:`1px solid ${T.borderColor}` }}>
            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#22c55e', textAlign:'center', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Same Subnet</div>
            <SameSubnetDiagram sent={sent} dark={dark} />
            <p style={{ margin:'0.25rem 0 0', fontSize:'0.7rem', color:T.textMuted, textAlign:'center', lineHeight:1.5 }}>Switch forwards by MAC.<br/>No router involved.</p>
          </div>
          <div style={{ padding:'0.75rem' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#f97316', textAlign:'center', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Different Subnet</div>
            <DiffSubnetDiagram sent={sent} dark={dark} />
            <p style={{ margin:'0.25rem 0 0', fontSize:'0.7rem', color:T.textMuted, textAlign:'center', lineHeight:1.5 }}>Packet hits the default gateway.<br/>Router forwards to the destination network.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Router Types tab ───────────────────────────────────────────── */
function TypesTab({ T }: { T: ReturnType<typeof getLabTheme> }) {
  const [expanded, setExpanded] = useState<string|null>(null);
  return (
    <div style={{ animation:'ri-fade 0.2s ease-out' }}>
      <p style={{ margin:'0 0 1rem', fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.6 }}>
        The word "router" covers everything from the £30 box your ISP sent you to the multi-million pound backbone routers carrying internet traffic between continents. Here are the six categories you'll encounter in the real world and on exams.
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
        {ROUTER_TYPES.map(t => {
          const open = expanded === t.name;
          return (
            <div key={t.name}
              style={{ background:T.panelBg, border:`1px solid ${open?t.tierColor:T.borderColor}`, borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'border-color 0.2s' }}
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

/* ─── Routing Table tab ──────────────────────────────────────────── */
function TableTab({ T }: { T: ReturnType<typeof getLabTheme> }) {
  const [destIP, setDestIP] = useState('10.10.10.55');
  const match = isValidIP(destIP) ? lpm(destIP) : null;

  const srcColor = (s:string) => s==='C'?'#22c55e':s==='S'?'#f59e0b':'#4493f8';

  return (
    <div style={{ animation:'ri-fade 0.2s ease-out' }}>
      <p style={{ margin:'0 0 1rem', fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.6 }}>
        A router's forwarding decision is driven entirely by its <strong style={{ color:T.textPrimary }}>routing table</strong>. For every incoming packet, the router finds the most specific matching prefix — the <strong style={{ color:T.textPrimary }}>Longest Prefix Match</strong> — and sends the packet to that next-hop. Enter a destination IP below to see which route wins.
      </p>

      {/* Interactive LPM lookup */}
      <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1rem 1.25rem', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'0.85rem', flexWrap:'wrap' }}>
          <label style={{ fontSize:'0.72rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', whiteSpace:'nowrap' }}>Destination IP</label>
          <input type="text" value={destIP} onChange={e=>setDestIP(e.target.value)}
            style={{ padding:'0.4rem 0.75rem', borderRadius:8, border:`1px solid ${match?'#22c55e':isValidIP(destIP)?T.borderColor:'#ef4444'}`, background:T.insetBg, color:T.textPrimary, fontFamily:"'Fira Code',monospace", fontSize:'0.85rem', outline:'none', width:160 }} />
          {match && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.4rem 0.9rem', borderRadius:8, background:'#22c55e14', border:'1px solid #22c55e40' }}>
              <span style={{ fontSize:'0.72rem', color:'#22c55e', fontWeight:700 }}>→ matched</span>
              <span style={{ fontFamily:'monospace', fontSize:'0.8rem', fontWeight:800, color:'#22c55e' }}>{match.prefix}</span>
              <span style={{ fontSize:'0.72rem', color:T.textMuted }}>via {match.nexthop} ({match.iface})</span>
            </div>
          )}
          {destIP && !isValidIP(destIP) && <span style={{ fontSize:'0.72rem', color:'#ef4444' }}>Invalid IP</span>}
        </div>

        {/* Routing table */}
        <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
          <div style={{ background:'#1a1a2e', padding:'0.4rem 0.9rem', display:'flex', alignItems:'center', gap:6 }}>
            {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:8,height:8,borderRadius:'50%',background:c }} />)}
            <span style={{ fontFamily:'monospace', fontSize:'0.6rem', color:'#8b949e', marginLeft:4 }}>Router# show ip route</span>
          </div>
          <div style={{ background:'#0d1117', fontFamily:"'Fira Code',monospace", fontSize:'0.72rem' }}>
            <div style={{ padding:'0.5rem 0.9rem', color:'#6e7681', borderBottom:`1px solid #21262d` }}>
              Codes: C - connected, S - static, O - OSPF
            </div>
            {ROUTES.map(r => {
              const isMatch = match?.prefix === r.prefix;
              return (
                <div key={r.prefix} style={{ display:'grid', gridTemplateColumns:'1.4fr 1.8fr 0.9fr 0.65fr', gap:'0 1rem', padding:'0.38rem 0.9rem', background: isMatch?'#22c55e14':'transparent', borderLeft: isMatch?'3px solid #22c55e':'3px solid transparent', transition:'background 0.3s', alignItems:'center' }}>
                  <div>
                    <span style={{ fontWeight:800, color:srcColor(r.src) }}>{r.src} </span>
                    <span style={{ color: isMatch?'#22c55e':'#7ee787' }}>{r.prefix}</span>
                    {r.prefix === '0.0.0.0/0' && <span style={{ color:'#6e7681', fontSize:'0.65rem', marginLeft:6 }}>(default)</span>}
                  </div>
                  <div style={{ color: isMatch?'#22c55e':'#ffa657' }}>{r.nexthop === 'directly connected' ? <span style={{ color:'#8b949e' }}>directly connected</span> : `via ${r.nexthop}`}</div>
                  <div style={{ color:'#79c0ff' }}>{r.iface}</div>
                  <div>
                    {isMatch && <span style={{ fontSize:'0.6rem', fontWeight:800, color:'#22c55e', background:'#22c55e18', border:'1px solid #22c55e40', padding:'1px 6px', borderRadius:4 }}>MATCH</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rule callout */}
      <div style={{ background:'#4493f820', border:'1px solid #4493f840', borderRadius:12, padding:'0.85rem 1rem' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:800, color:'#4493f8', textTransform:'uppercase', marginBottom:4 }}>Longest Prefix Match Rule</div>
        <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.6 }}>
          When multiple routes match a destination, the router always picks the <strong style={{ color:T.textPrimary }}>most specific</strong> one — the prefix with the most bits. Try <code style={{ background:T.insetBg, padding:'1px 5px', borderRadius:4 }}>10.10.10.55</code> — it matches /8, /16, /24 and default, but the /24 wins. Then try <code style={{ background:T.insetBg, padding:'1px 5px', borderRadius:4 }}>8.8.8.8</code> — only the default route matches.
        </p>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
interface Props { isDarkMode?: boolean; }

export const RouterIntro: React.FC<Props> = ({ isDarkMode = true }) => {
  const T   = getLabTheme(isDarkMode);
  const [tab, setTab] = useState<TabId>('overview');

  const TABS: [TabId,string,string][] = [
    ['overview', '💡 What is a Router?', 'Fundamentals and vs-switch comparison'],
    ['types',    '🗂️ Router Types',      'Home to service-provider core'],
    ['table',    '📋 Routing Table',     'How packets are forwarded'],
  ];

  return (
    <div style={{ background:T.cardBg, borderRadius:20, border:`1px solid ${T.borderColor}`, overflow:'hidden', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`@keyframes ri-fade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }`}</style>

      <div style={{ height:3, background:'linear-gradient(90deg,#4493f8,#a855f7,#22c55e)' }} />

      <div style={{ padding:'1.75rem 2rem 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#4493f8,#a855f7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔷</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:800 }}>Network Routers — Concepts & Types</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:'#22c55e20', color:'#22c55e', border:'1px solid #22c55e40', textTransform:'uppercase', letterSpacing:'0.08em' }}>Beginner</span>
            </div>
            <p style={{ margin:0, fontSize:'0.8rem', color:T.textSecondary, lineHeight:1.55 }}>
              Understand what a router does, why it differs from a switch, the six categories from home to carrier-grade, and how a routing table makes forwarding decisions.
            </p>
          </div>
        </div>

        <div style={{ display:'flex', gap:0, borderTop:`1px solid ${T.borderColor}`, paddingTop:'0.1rem' }}>
          {TABS.map(([id, label, hint]) => (
            <button key={id} type="button" onClick={() => setTab(id)} title={hint}
              style={{ padding:'0.55rem 1.1rem', border:'none', borderBottom: tab===id?'2px solid #4493f8':'2px solid transparent', background:'none', color: tab===id?'#4493f8':T.textMuted, fontWeight:700, fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'color 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'1.5rem 2rem 2rem' }}>
        {tab === 'overview' && <OverviewTab dark={isDarkMode} T={T} />}
        {tab === 'types'    && <TypesTab T={T} />}
        {tab === 'table'    && <TableTab T={T} />}
      </div>
    </div>
  );
};

export default RouterIntro;
