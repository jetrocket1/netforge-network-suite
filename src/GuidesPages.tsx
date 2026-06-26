import { useEffect } from 'react';
import { Nav, Footer } from './MarketingPages';

const ACCENT  = '#4493f8';
const PURPLE  = '#a855f7';
const GREEN   = '#3fb950';
const RED     = '#f85149';
const GOLD    = '#d29922';

/* ─── useMeta ───────────────────────────────────────────────────── */
function useMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!el) { el = document.createElement('meta'); el.name = 'description'; document.head.appendChild(el); }
    el.content = description;
  }, [title, description]);
}

/* ─── Shared guide layout ───────────────────────────────────────── */
function GuideLayout({ children, breadcrumb }: { children: React.ReactNode; breadcrumb: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <div className="nf-section" style={{ flex: 1, maxWidth: 760, margin: '0 auto', paddingTop: '2rem', paddingBottom: '4rem', width: '100%' }}>
        <div style={{ fontSize: '0.72rem', color: '#6e7681', marginBottom: '2rem' }}>
          <a href="/" style={{ color: '#6e7681', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 6px' }}>›</span>
          <a href="/guides" style={{ color: '#6e7681', textDecoration: 'none' }}>Guides</a>
          <span style={{ margin: '0 6px' }}>›</span>
          <span style={{ color: '#8b949e' }}>{breadcrumb}</span>
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
}

/* helpers */
function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: '2.25rem 0 0.75rem', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em', borderBottom: '1px solid #21262d', paddingBottom: '0.4rem' }}>{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ margin: '1.5rem 0 0.5rem', fontSize: '1rem', fontWeight: 700 }}>{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 1rem', color: '#8b949e', lineHeight: 1.8, fontSize: '0.9rem' }}>{children}</p>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ color: '#8b949e', lineHeight: 1.8, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{children}</li>;
}
function Ul({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: '0 0 1rem', paddingLeft: '1.4rem' }}>{children}</ul>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <code style={{ fontFamily: 'monospace', fontSize: '0.82rem', background: '#161b22', border: '1px solid #21262d', borderRadius: 4, padding: '2px 6px', color: '#e6edf3' }}>{children}</code>;
}
function Pre({ children }: { children: React.ReactNode }) {
  return <pre style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '1.1rem', fontSize: '0.8rem', lineHeight: 1.7, overflowX: 'auto', margin: '0 0 1.25rem', color: '#e6edf3', fontFamily: 'monospace' }}>{children}</pre>;
}
function InfoBox({ title, children, color = ACCENT }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: `${color}0d`, border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: '1rem 1.1rem', margin: '1.25rem 0' }}>
      <div style={{ fontWeight: 700, color, fontSize: '0.82rem', marginBottom: '0.4rem' }}>{title}</div>
      <div style={{ color: '#8b949e', fontSize: '0.82rem', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
function LabCta({ icon, name, href, color }: { icon: string; name: string; href: string; color: string }) {
  return (
    <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.25rem', background: '#161b22', border: `1px solid ${color}40`, borderRadius: 12, textDecoration: 'none', margin: '1.5rem 0' }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Practice in NetForge</div>
        <div style={{ fontWeight: 700, color: '#e6edf3', fontSize: '0.9rem' }}>{name} →</div>
      </div>
    </a>
  );
}
function GuideMeta({ readTime, updated, tag }: { readTime: string; updated: string; tag: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '0.75rem 0 2rem', padding: '0.75rem 0', borderBottom: '1px solid #21262d' }}>
      {[['📖', readTime], ['📅', `Updated ${updated}`], ['🏷️', tag]].map(([i, t]) => (
        <span key={t} style={{ fontSize: '0.72rem', color: '#6e7681', display: 'flex', alignItems: 'center', gap: 5 }}><span>{i}</span>{t}</span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GUIDES INDEX
───────────────────────────────────────────────────────────────── */
const ALL_GUIDES = [
  { slug: '/guides/how-to-subnet',                    title: 'How to Subnet IPv4 Networks',                   desc: 'A step-by-step guide to subnetting — from CIDR basics to VLSM design. Includes the fast method used on exams.',  tag: 'Subnetting',    color: GREEN,  icon: '🧮', readTime: '8 min read' },
  { slug: '/guides/network-plus-study-guide',         title: 'CompTIA Network+ Complete Study Guide',         desc: 'Everything you need to know about the N10-009 exam — domains, key topics, recommended labs, and study approach.',tag: 'Certification', color: ACCENT, icon: '📡', readTime: '10 min read' },
  { slug: '/guides/network-plus-vs-security-plus',    title: 'CompTIA N+ vs Security+ — Which First?',        desc: 'A clear comparison of both exams: content, difficulty, prerequisites, and which to tackle based on your career goal.', tag: 'Certification', color: PURPLE, icon: '🏆', readTime: '6 min read' },
  { slug: '/guides/what-is-a-vlan',                   title: 'What Is a VLAN? A Complete Explanation',        desc: 'How VLANs work, why they exist, 802.1Q tagging, access vs trunk ports, and inter-VLAN routing explained simply.',  tag: 'Switching',     color: GOLD,   icon: '🔀', readTime: '7 min read' },
  { slug: '/guides/arp-poisoning',                    title: 'What Is ARP Poisoning? How It Works & Defences', desc: 'How ARP cache poisoning works, why it\'s effective, what attackers can do with it, and how Dynamic ARP Inspection stops it.', tag: 'Security', color: RED, icon: '🕵️', readTime: '7 min read' },
  { slug: '/guides/cisco-ios-commands',               title: 'Cisco IOS Commands — Complete Cheat Sheet',       desc: 'Essential Cisco IOS CLI commands organised by mode and function. Covers interfaces, routing, VLANs, ACLs, OSPF, and troubleshooting.', tag: 'CLI Reference', color: GOLD, icon: '💻', readTime: '10 min read' },
];

export function GuidesIndexPage() {
  useMeta(
    'Networking Guides & Articles | NetForge',
    'Free in-depth guides on subnetting, VLANs, ARP poisoning, CompTIA Network+ and Security+. Practical networking knowledge with interactive lab links.'
  );
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <div className="nf-section" style={{ flex: 1, maxWidth: 900, margin: '0 auto', paddingTop: '3rem', paddingBottom: '4rem', width: '100%' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Guides & Articles</div>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(1.75rem,4vw,2.25rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>Learn Networking, Deeply</h1>
          <p style={{ margin: 0, color: '#8b949e', fontSize: '1rem', lineHeight: 1.7, maxWidth: 560 }}>Practical guides covering the concepts that actually come up in the real world — and on CompTIA exams.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ALL_GUIDES.map(g => (
            <a key={g.slug} href={g.slug} style={{ display: 'flex', gap: '1.25rem', padding: '1.5rem', background: '#161b22', border: '1px solid #21262d', borderRadius: 14, textDecoration: 'none', alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${g.color}18`, border: `1px solid ${g.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{g.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#e6edf3', fontSize: '0.95rem' }}>{g.title}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 6, background: `${g.color}18`, color: g.color, border: `1px solid ${g.color}35`, flexShrink: 0 }}>{g.tag}</span>
                </div>
                <p style={{ margin: '0 0 0.35rem', color: '#6e7681', fontSize: '0.82rem', lineHeight: 1.6 }}>{g.desc}</p>
                <span style={{ fontSize: '0.7rem', color: '#4e5560' }}>{g.readTime}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GUIDE 1: HOW TO SUBNET
───────────────────────────────────────────────────────────────── */
export function GuideHowToSubnet() {
  useMeta(
    'How to Subnet IPv4 Networks — Step-by-Step Guide | NetForge',
    'Learn IPv4 subnetting from scratch. CIDR notation, the fast subnetting method, VLSM, and a reference table for every prefix length from /8 to /30.'
  );
  return (
    <GuideLayout breadcrumb="How to Subnet IPv4 Networks">
      <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>How to Subnet IPv4 Networks</h1>
      <GuideMeta readTime="8 min read" updated="June 2026" tag="Subnetting" />

      <P>Subnetting is the process of dividing a large IP network into smaller segments. Every router, every network design, and every CompTIA Network+ exam question about subnetting follows the same rules — once you understand them, the maths becomes quick and predictable.</P>

      <H2>Why subnetting exists</H2>
      <P>Without subnetting, every device on a network would be in the same broadcast domain. A broadcast sent by one device reaches every other device — fine for 20 hosts, catastrophic for 2,000. Subnetting creates smaller broadcast domains, improves security (devices in different subnets need a router to communicate), and makes IP address allocation efficient.</P>

      <H2>IPv4 address structure</H2>
      <P>Every IPv4 address is 32 bits, written as four octets (e.g. <Code>192.168.1.100</Code>). The address has two parts:</P>
      <Ul>
        <Li><strong style={{ color: '#e6edf3' }}>Network portion</strong> — identifies which network the address belongs to</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Host portion</strong> — identifies the specific device within that network</Li>
      </Ul>
      <P>The subnet mask (or CIDR prefix) defines where the split is. A <Code>/24</Code> means the first 24 bits are network, the last 8 are host.</P>

      <H2>CIDR notation</H2>
      <P>CIDR (Classless Inter-Domain Routing) notation writes the prefix length after a slash: <Code>192.168.1.0/24</Code>. This replaces the old class-based system and the verbose dotted-decimal mask (<Code>255.255.255.0</Code>). Both mean the same thing — you'll need to recognise both on exams.</P>

      <InfoBox title="Key formula" color={GREEN}>
        Usable hosts = 2^(32 − prefix) − 2. The −2 removes the network address (all host bits = 0) and the broadcast address (all host bits = 1).
        A /26 gives 2^(32−26) − 2 = 2^6 − 2 = 62 usable hosts.
      </InfoBox>

      <H2>The fast subnetting method</H2>
      <P>On timed exams you need a method that works in under 30 seconds. Here it is:</P>
      <H3>Step 1 — Find the block size</H3>
      <P>Block size = 256 − interesting octet of the subnet mask. For a /26 the mask is 255.255.255.<strong>192</strong>, so block size = 256 − 192 = <strong>64</strong>.</P>
      <H3>Step 2 — List the network addresses</H3>
      <P>Starting from 0, add the block size each time: 0, 64, 128, 192. These are your four /26 networks within a /24.</P>
      <H3>Step 3 — Find the ranges</H3>
      <P>Given <Code>192.168.1.100/26</Code>: the host (100) falls in the 64–127 range. So:</P>
      <Pre>{`Network address:   192.168.1.64
First usable host: 192.168.1.65
Last usable host:  192.168.1.126
Broadcast:         192.168.1.127`}</Pre>

      <H2>Common prefix reference</H2>
      <div style={{ overflowX: 'auto', margin: '0 0 1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #30363d' }}>
              {['Prefix', 'Mask', 'Hosts', 'Block size'].map(h => <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: '#6e7681', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ['/24','255.255.255.0','254','256'],
              ['/25','255.255.255.128','126','128'],
              ['/26','255.255.255.192','62','64'],
              ['/27','255.255.255.224','30','32'],
              ['/28','255.255.255.240','14','16'],
              ['/29','255.255.255.248','6','8'],
              ['/30','255.255.255.252','2','4'],
            ].map(row => (
              <tr key={row[0]} style={{ borderBottom: '1px solid #21262d' }}>
                {row.map((cell, i) => <td key={i} style={{ padding: '0.5rem 0.75rem', color: i === 0 ? ACCENT : '#8b949e', fontFamily: i < 2 ? 'monospace' : 'inherit' }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>VLSM — Variable Length Subnet Masking</H2>
      <P>VLSM lets you assign different-sized subnets to different segments, wasting as few addresses as possible. The approach: sort your requirements largest to smallest, assign the smallest subnet that fits each one.</P>
      <P>Example: you need subnets for 50 hosts, 20 hosts, and a point-to-point WAN link. Assign /26 (62 hosts), /27 (30 hosts), and /30 (2 hosts) respectively.</P>

      <InfoBox title="Exam tip" color={GOLD}>
        CompTIA N+ nearly always asks you to find the "most efficient" subnet for a given host count — that means the smallest prefix that still fits. For 50 hosts, /27 (30 hosts) is too small; /26 (62 hosts) is correct.
      </InfoBox>

      <LabCta icon="🧮" name="IP Subnet Calculator — practise in your browser" href="/app?cat=subnetting&tool=calculator" color={GREEN} />
      <LabCta icon="🌳" name="VLSM Planner — design address plans interactively" href="/app?cat=subnetting&tool=splitter" color={ACCENT} />
    </GuideLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GUIDE 2: NETWORK+ STUDY GUIDE
───────────────────────────────────────────────────────────────── */
export function GuideNetworkPlusStudy() {
  useMeta(
    'CompTIA Network+ (N10-009) Complete Study Guide | NetForge',
    'A complete study guide for CompTIA Network+ N10-009. Exam domains, key topics, hands-on labs for each domain, and a practical study approach.'
  );
  const domains = [
    { n:'1.0', pct:'23%', name:'Networking Concepts', color:ACCENT, topics:['OSI and TCP/IP models','IPv4 and IPv6 addressing','Common ports and protocols','Cloud concepts and virtualisation','Network topologies and types'], labs:[{icon:'📶',name:'OSI 7-Layer Model',href:'/app?cat=fundamentals&tool=osiModel'},{icon:'🔌',name:'TCP Connection Lifecycle',href:'/app?cat=fundamentals&tool=tcpLab'}] },
    { n:'2.0', pct:'20%', name:'Network Implementation', color:GREEN, topics:['Ethernet switching and VLANs','Routing protocols (OSPF, BGP basics)','Wireless standards (802.11a/b/g/n/ac/ax)','Cable types and connectors','IPv4/IPv6 subnetting'], labs:[{icon:'🧮',name:'IP Subnet Calculator',href:'/app?cat=subnetting&tool=calculator'},{icon:'🔀',name:'VLAN Configuration',href:'/app?cat=switching&tool=vlanMap'}] },
    { n:'3.0', pct:'17%', name:'Network Operations', color:PURPLE, topics:['Network monitoring tools (SNMP, NetFlow)','Remote access technologies','DHCP, DNS, NTP services','High availability and disaster recovery','Change management processes'], labs:[{icon:'🌐',name:'DNS Resolution Visualiser',href:'/app?cat=fundamentals&tool=dnsLab'},{icon:'🔄',name:'NAT / PAT Simulator',href:'/app?cat=routing&tool=natLab'}] },
    { n:'4.0', pct:'20%', name:'Network Security', color:RED, topics:['Common attack types (DoS, MITM, phishing)','Firewalls, IDS/IPS, and UTM','VPNs and tunnelling protocols','Network Access Control (802.1X)','Physical security'], labs:[{icon:'🔒',name:'802.1X NAC Lab',href:'/app?cat=switching&tool=dot1xLab'},{icon:'🔥',name:'Firewall Zone Policy',href:'/app?cat=security&tool=firewallLab'}] },
    { n:'5.0', pct:'20%', name:'Network Troubleshooting', color:GOLD, topics:['Troubleshooting methodology (OSI bottom-up/top-down)','Network tools (ping, traceroute, nslookup, netstat)','Wireless troubleshooting','Cable and hardware issues','Common connectivity problems'], labs:[{icon:'📡',name:'How Ping Works (ICMP)',href:'/app?cat=fundamentals&tool=icmpLab'},{icon:'📶',name:'Wi-Fi Spectrum Analyser',href:'/app?cat=wireless&tool=wifi'}] },
  ];
  return (
    <GuideLayout breadcrumb="CompTIA Network+ Study Guide">
      <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>CompTIA Network+ (N10-009) Complete Study Guide</h1>
      <GuideMeta readTime="10 min read" updated="June 2026" tag="Certification" />

      <P>The CompTIA Network+ (N10-009) is the most widely recognised entry-level networking certification. It validates that you can design, configure, manage, and troubleshoot wired and wireless networks. This guide covers the exam structure, every domain, and which hands-on labs will reinforce each area.</P>

      <H2>Exam at a glance</H2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '0.75rem', margin: '0 0 1.5rem' }}>
        {[['Questions','Up to 90'],['Time','90 minutes'],['Passing score','720 / 900'],['Question types','Multiple choice, drag-and-drop, performance-based'],['Cost','~£330 / $349']].map(([l,v])=>(
          <div key={l} style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:10, padding:'0.85rem', textAlign:'center' }}>
            <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#e6edf3' }}>{v}</div>
            <div style={{ fontSize:'0.65rem', color:'#6e7681', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      <InfoBox title="Performance-based questions" color={ACCENT}>
        The N+ includes simulation questions where you configure a device or troubleshoot a network diagram. These can't be answered from memory alone — hands-on lab practice is the best preparation.
      </InfoBox>

      <H2>Exam domains</H2>
      {domains.map(d => (
        <div key={d.n} style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:14, padding:'1.25rem', marginBottom:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'0.75rem' }}>
            <div style={{ fontSize:'0.65rem', fontWeight:800, padding:'3px 8px', borderRadius:8, background:`${d.color}18`, color:d.color, border:`1px solid ${d.color}35` }}>{d.pct}</div>
            <span style={{ fontWeight:800, color:'#e6edf3' }}>{d.n} {d.name}</span>
          </div>
          <ul style={{ margin:'0 0 0.75rem', paddingLeft:'1.25rem' }}>
            {d.topics.map(t => <li key={t} style={{ color:'#8b949e', fontSize:'0.8rem', lineHeight:1.7 }}>{t}</li>)}
          </ul>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {d.labs.map(lab => (
              <a key={lab.name} href={lab.href} style={{ fontSize:'0.72rem', padding:'4px 10px', borderRadius:8, background:`${d.color}12`, border:`1px solid ${d.color}30`, color:d.color, textDecoration:'none', fontWeight:600 }}>
                {lab.icon} {lab.name} →
              </a>
            ))}
          </div>
        </div>
      ))}

      <H2>Study approach</H2>
      <H3>1. Understand first, memorise second</H3>
      <P>The N+ tests understanding, not just recall. If you understand why a /26 gives 62 hosts, you don't need to memorise the table. Build mental models through the labs before moving to flashcards.</P>
      <H3>2. Hands-on practice for every domain</H3>
      <P>Performance-based questions (PBQs) catch candidates who only studied theory. For each domain above, open the linked labs and interact with the concepts before moving on.</P>
      <H3>3. Use process of elimination on PBQs</H3>
      <P>PBQs count heavily but can be time-consuming. Flag them, skip to multiple choice first, then return. You can often eliminate two wrong answers quickly, turning a 25% guess into 50%.</P>

      <InfoBox title="Recommended study order" color={GREEN}>
        Domain 5 (Troubleshooting) uses concepts from all other domains — study it last. Start with Domain 1 (Concepts) and 2 (Implementation) to build your foundation before tackling security and operations.
      </InfoBox>

      <LabCta icon="📡" name="Browse all Network+ labs on NetForge" href="/comptia-network-plus" color={ACCENT} />
    </GuideLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GUIDE 3: N+ vs SEC+
───────────────────────────────────────────────────────────────── */
export function GuideNplusVsSecplus() {
  useMeta(
    'CompTIA Network+ vs Security+ — Which Should You Take First? | NetForge',
    'Comparing CompTIA Network+ and Security+: content, difficulty, prerequisites, career paths, and a clear recommendation based on your goal.'
  );
  return (
    <GuideLayout breadcrumb="N+ vs Security+ — Which First?">
      <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>CompTIA N+ vs Security+ — Which Should You Take First?</h1>
      <GuideMeta readTime="6 min read" updated="June 2026" tag="Certification" />

      <P>Both CompTIA Network+ and Security+ are vendor-neutral certifications that open doors in IT. They cover different ground, and the right order depends entirely on where you want to go. Here's a direct comparison.</P>

      <H2>What each exam covers</H2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'1rem', margin:'0 0 1.5rem' }}>
        {[
          { name:'Network+ (N10-009)', color:ACCENT, items:['Network infrastructure design','IP addressing and subnetting','Switching, routing, and wireless','Network monitoring and operations','Basic security hardening','Troubleshooting methodology'] },
          { name:'Security+ (SY0-701)', color:RED, items:['Threat actors and attack types','Vulnerability assessment','Security architecture (firewalls, VPNs)','Identity and access management','Incident response','Compliance and governance'] },
        ].map(e => (
          <div key={e.name} style={{ background:'#161b22', border:`1px solid ${e.color}40`, borderRadius:12, padding:'1.25rem', borderTop:`3px solid ${e.color}` }}>
            <div style={{ fontWeight:800, color:'#e6edf3', marginBottom:'0.75rem', fontSize:'0.95rem' }}>{e.name}</div>
            {e.items.map(i => <div key={i} style={{ display:'flex', gap:7, fontSize:'0.78rem', color:'#8b949e', marginBottom:'0.3rem' }}><span style={{ color:e.color }}>✓</span>{i}</div>)}
          </div>
        ))}
      </div>

      <H2>Key differences</H2>
      <div style={{ overflowX:'auto', margin:'0 0 1.5rem' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #30363d' }}>
              {['','Network+','Security+'].map(h => <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', color:'#6e7681', fontWeight:700 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ['Prerequisites','None (A+ recommended)','None (Network+ or 2yr experience recommended)'],
              ['Focus','Infrastructure & connectivity','Threats, defences & compliance'],
              ['Difficulty','Moderate','Moderate–High'],
              ['Questions','Up to 90, 90 min','Up to 90, 90 min'],
              ['Passing score','720 / 900','750 / 900'],
              ['Renewal','3 years (CE credits)','3 years (CE credits)'],
              ['Jobs it targets','Network technician, sysadmin','Security analyst, SOC analyst'],
            ].map(row => (
              <tr key={row[0]} style={{ borderBottom:'1px solid #21262d' }}>
                <td style={{ padding:'0.5rem 0.75rem', color:'#e6edf3', fontWeight:600, fontSize:'0.78rem' }}>{row[0]}</td>
                <td style={{ padding:'0.5rem 0.75rem', color:'#8b949e' }}>{row[1]}</td>
                <td style={{ padding:'0.5rem 0.75rem', color:'#8b949e' }}>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Which should you take first?</H2>
      <H3>Take Network+ first if…</H3>
      <Ul>
        <Li>You're new to IT and don't have a strong networking foundation</Li>
        <Li>You want to work in network engineering, sysadmin, or cloud infrastructure</Li>
        <Li>You're starting an apprenticeship or IT support role</Li>
        <Li>You find subnetting, routing, and switching unfamiliar</Li>
      </Ul>
      <H3>Go straight to Security+ if…</H3>
      <Ul>
        <Li>You already work in IT and understand networking basics</Li>
        <Li>Your target role is security-focused (SOC analyst, penetration tester, security engineer)</Li>
        <Li>You're in the military or government (DoD 8570 mandates Sec+ for many roles)</Li>
        <Li>You want the higher salary uplift — security roles typically pay more</Li>
      </Ul>

      <InfoBox title="CompTIA's official stance" color={PURPLE}>
        CompTIA recommends having Network+ knowledge before attempting Security+, but doesn't require it. Many candidates pass Sec+ without N+ — especially those with hands-on networking experience in a job role.
      </InfoBox>

      <H2>Can you do both?</H2>
      <P>Absolutely. Many IT professionals hold both, and the knowledge overlaps enough that studying for one makes the other easier. If you're targeting a mid-level security role within 12–18 months, N+ → Sec+ is a well-trodden and well-respected path.</P>

      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', margin:'1.5rem 0' }}>
        <a href="/comptia-network-plus" style={{ padding:'0.65rem 1.25rem', background:`${ACCENT}18`, border:`1px solid ${ACCENT}40`, color:ACCENT, textDecoration:'none', borderRadius:10, fontWeight:700, fontSize:'0.82rem' }}>Network+ labs →</a>
        <a href="/comptia-security-plus" style={{ padding:'0.65rem 1.25rem', background:`${RED}18`, border:`1px solid ${RED}40`, color:RED, textDecoration:'none', borderRadius:10, fontWeight:700, fontSize:'0.82rem' }}>Security+ labs →</a>
      </div>
    </GuideLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GUIDE 4: WHAT IS A VLAN
───────────────────────────────────────────────────────────────── */
export function GuideWhatIsVlan() {
  useMeta(
    'What Is a VLAN? A Complete Explanation | NetForge',
    'What VLANs are, why they exist, how 802.1Q tagging works, access vs trunk ports, inter-VLAN routing, and the security benefits of VLAN segmentation.'
  );
  return (
    <GuideLayout breadcrumb="What Is a VLAN?">
      <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>What Is a VLAN? A Complete Explanation</h1>
      <GuideMeta readTime="7 min read" updated="June 2026" tag="Switching" />

      <P>A VLAN (Virtual Local Area Network) is a logical grouping of network devices that behave as if they're on the same physical network segment — even if they're not. VLANs are one of the most important concepts in enterprise networking and a core topic on the CompTIA Network+ exam.</P>

      <H2>The problem VLANs solve</H2>
      <P>In a flat network, every device shares the same broadcast domain. A broadcast frame sent by one device (like an ARP request) is forwarded to every other port on every switch. In a network with hundreds of devices this creates noise, reduces performance, and offers no security separation between departments.</P>
      <P>VLANs solve this by creating multiple logical broadcast domains on a single physical infrastructure. The finance team, the guest Wi-Fi, and the IP phones can all share the same switches while being completely isolated from each other.</P>

      <H2>How VLANs work — 802.1Q tagging</H2>
      <P>VLANs are defined in the IEEE 802.1Q standard. When a frame crosses a trunk port (a link between two switches carrying multiple VLANs), the switch inserts a 4-byte tag into the Ethernet frame header:</P>
      <Pre>{`Original frame:  | Dst MAC | Src MAC | EtherType | Payload |
Tagged frame:    | Dst MAC | Src MAC | 802.1Q Tag | EtherType | Payload |

802.1Q Tag breakdown:
  - TPID (16 bits): 0x8100 — identifies this as an 802.1Q frame
  - PCP  ( 3 bits): Priority Code Point (QoS)
  - DEI  ( 1 bit ): Drop Eligible Indicator
  - VID  (12 bits): VLAN ID (0–4094)`}</Pre>
      <P>The receiving switch reads the VLAN ID from the tag, strips it, and forwards the frame only to ports that belong to that VLAN.</P>

      <H2>Access ports vs trunk ports</H2>
      <Ul>
        <Li><strong style={{ color:'#e6edf3' }}>Access port</strong> — belongs to a single VLAN. End devices (PCs, phones, printers) connect here. The device has no awareness of VLANs — the switch adds and strips the tag invisibly.</Li>
        <Li><strong style={{ color:'#e6edf3' }}>Trunk port</strong> — carries frames from multiple VLANs. Used between switches, and between switches and routers. Frames are tagged with their VLAN ID.</Li>
        <Li><strong style={{ color:'#e6edf3' }}>Native VLAN</strong> — frames on trunk ports that arrive untagged are assigned to the native VLAN (default VLAN 1). Mismatching native VLANs between switches is a common misconfiguration.</Li>
      </Ul>

      <H2>Inter-VLAN routing</H2>
      <P>Because VLANs are separate broadcast domains, traffic between VLANs must go through a Layer 3 device — a router or a Layer 3 switch.</P>
      <H3>Router-on-a-stick</H3>
      <P>A single router interface is split into sub-interfaces, one per VLAN. The router receives tagged frames on a trunk port and routes between VLANs. Simple to configure, limited throughput for high-traffic environments.</P>
      <Pre>{`interface GigabitEthernet0/0.10
 encapsulation dot1Q 10
 ip address 192.168.10.1 255.255.255.0`}</Pre>
      <H3>Layer 3 switch (SVI)</H3>
      <P>A Switched Virtual Interface (SVI) is a virtual Layer 3 interface on a switch, one per VLAN. The switch routes traffic internally — far higher throughput than a router-on-a-stick and the preferred approach in modern designs.</P>

      <InfoBox title="Security benefit" color={GOLD}>
        VLANs provide traffic isolation but are not a security boundary on their own — a misconfigured trunk or a VLAN hopping attack can bypass them. Pair VLANs with ACLs and 802.1X port authentication for proper security.
      </InfoBox>

      <LabCta icon="🔀" name="VLAN Configuration Lab — configure VLANs on a live switch" href="/app?cat=switching&tool=vlanMap" color={PURPLE} />
    </GuideLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   GUIDE 5: ARP POISONING
───────────────────────────────────────────────────────────────── */
export function GuideArpPoisoning() {
  useMeta(
    'What Is ARP Poisoning? How It Works & How to Defend Against It | NetForge',
    'A complete explanation of ARP cache poisoning (ARP spoofing): how ARP works, how the attack is carried out, what attackers can intercept, and how Dynamic ARP Inspection stops it.'
  );
  return (
    <GuideLayout breadcrumb="What Is ARP Poisoning?">
      <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>What Is ARP Poisoning? How It Works &amp; How to Defend Against It</h1>
      <GuideMeta readTime="7 min read" updated="June 2026" tag="Security" />

      <P>ARP poisoning (also called ARP spoofing or ARP cache poisoning) is a Layer 2 man-in-the-middle attack that lets an attacker intercept, modify, or stop network traffic between two hosts on the same network. It exploits a fundamental weakness in the Address Resolution Protocol — there is no authentication.</P>

      <H2>How ARP works (and why it's vulnerable)</H2>
      <P>When a device wants to communicate with another device on the same subnet, it needs the target's MAC address. It sends an ARP request — a broadcast to every device asking "who has IP 192.168.1.1? Tell me your MAC." The target replies with a unicast ARP reply: "I have 192.168.1.1 — my MAC is AA:BB:CC:DD:EE:FF."</P>
      <P>The requesting device stores this mapping in its ARP cache. Here's the critical weakness: <strong style={{ color:'#e6edf3' }}>any device can send an unsolicited ARP reply, and most operating systems will accept and cache it without question.</strong></P>

      <H2>The attack step by step</H2>
      <P>An attacker on the same network segment (VLAN) as the victim can perform the attack as follows:</P>
      <Ul>
        <Li><strong style={{ color:'#e6edf3' }}>Step 1</strong> — Attacker sends a fake ARP reply to the <em>victim</em>, claiming: "I have the gateway's IP (192.168.1.1) — my MAC is DE:AD:BE:EF:CA:FE."</Li>
        <Li><strong style={{ color:'#e6edf3' }}>Step 2</strong> — Attacker sends a fake ARP reply to the <em>gateway</em>, claiming: "I have the victim's IP (192.168.1.10) — my MAC is DE:AD:BE:EF:CA:FE."</Li>
        <Li><strong style={{ color:'#e6edf3' }}>Step 3</strong> — Both victim and gateway update their ARP caches with the attacker's MAC address.</Li>
        <Li><strong style={{ color:'#e6edf3' }}>Step 4</strong> — All traffic between victim and gateway now flows <em>through</em> the attacker. The attacker forwards it on (so neither party notices), while reading or modifying it.</Li>
      </Ul>
      <Pre>{`Victim ARP cache (poisoned):
  192.168.1.1  →  DE:AD:BE:EF:CA:FE  ← Attacker's MAC!

Gateway ARP cache (poisoned):
  192.168.1.10 →  DE:AD:BE:EF:CA:FE  ← Attacker's MAC!`}</Pre>

      <H2>What an attacker can do</H2>
      <Ul>
        <Li><strong style={{ color:'#e6edf3' }}>Credential theft</strong> — HTTP login forms, unencrypted FTP, Telnet sessions, and NTLM hashes pass through in plaintext</Li>
        <Li><strong style={{ color:'#e6edf3' }}>Session hijacking</strong> — steal authenticated session cookies from HTTP traffic</Li>
        <Li><strong style={{ color:'#e6edf3' }}>SSL stripping</strong> — downgrade HTTPS to HTTP on sites that don't enforce HSTS</Li>
        <Li><strong style={{ color:'#e6edf3' }}>DNS spoofing</strong> — manipulate DNS responses to redirect traffic to fake sites</Li>
        <Li><strong style={{ color:'#e6edf3' }}>Denial of service</strong> — drop traffic rather than forwarding it</Li>
      </Ul>

      <InfoBox title="Real-world impact" color={RED}>
        ARP poisoning is effective on any switched network where the attacker has Layer 2 access — this includes corporate Wi-Fi, shared office networks, and hotel/café networks. A successful attack on an unencrypted protocol requires no further exploitation.
      </InfoBox>

      <H2>Defences</H2>
      <H3>Dynamic ARP Inspection (DAI)</H3>
      <P>DAI is a Cisco IOS feature (and equivalent on other vendors) that validates ARP packets against the DHCP snooping binding table. Ports are classified as trusted (uplinks) or untrusted (end-user ports). An ARP reply arriving on an untrusted port is dropped if the IP-to-MAC mapping doesn't match the binding table.</P>
      <Pre>{`ip dhcp snooping
ip dhcp snooping vlan 10
ip arp inspection vlan 10
!
interface GigabitEthernet0/1
 ip dhcp snooping limit rate 15
 ip arp inspection limit rate 100`}</Pre>
      <H3>Static ARP entries</H3>
      <P>For critical devices (gateway, servers), you can add static ARP entries that cannot be overwritten by gratuitous ARP replies. Manageable for a handful of devices, impractical at scale.</P>
      <H3>Encrypted protocols</H3>
      <P>HTTPS, SSH, and VPN tunnels mean that even if an attacker intercepts your traffic, they see only ciphertext. This doesn't stop the attack but limits the damage severely. Always verify the certificate is valid — SSL stripping can still be attempted.</P>
      <H3>Network segmentation and 802.1X</H3>
      <P>ARP poisoning only works within a broadcast domain. Proper VLAN segmentation limits the blast radius — an attacker on the guest VLAN cannot reach the corporate VLAN. 802.1X port authentication prevents untrusted devices from joining the network in the first place.</P>

      <LabCta icon="🕵️" name="ARP Poisoning / MITM Lab — watch the attack animate live" href="/app?cat=security&tool=arpMitm" color={RED} />
      <LabCta icon="🔀" name="VLAN Configuration — practice network segmentation" href="/app?cat=switching&tool=vlanMap" color={PURPLE} />
    </GuideLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   6. CISCO IOS COMMANDS
───────────────────────────────────────────────────────────────── */
export function GuideCiscoIos() {
  useMeta(
    'Cisco IOS Commands Cheat Sheet | NetForge',
    'Essential Cisco IOS CLI commands for Network+ and CCNA exam prep. Covers modes, interfaces, routing, VLANs, ACLs, OSPF, and troubleshooting show commands.'
  );
  return (
    <GuideLayout breadcrumb="Cisco IOS Command Reference">
      <h1 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>
        Cisco IOS Commands — Complete Cheat Sheet
      </h1>
      <GuideMeta readTime="10 min read" updated="June 2026" tag="CLI Reference" />

      <P>Cisco IOS (Internetwork Operating System) is the firmware that runs on most Cisco routers and switches. All configuration happens through a hierarchical CLI — knowing which mode you're in and which commands belong to which mode is the foundation of everything that follows.</P>

      <InfoBox title="Exam relevance" color={GOLD}>
        CompTIA Network+ (N10-009) tests CLI concepts conceptually — you won't type commands but you must recognise output from <Code>show</Code> commands and understand what each does. CCNA tests actual configuration, so both syntax and purpose matter.
      </InfoBox>

      {/* ── MODES ── */}
      <H2>IOS Modes</H2>
      <P>IOS uses a privilege hierarchy. You move down into sub-modes to configure specific features, and back up with <Code>exit</Code> or all the way back to privileged EXEC with <Code>end</Code>.</P>
      <Pre>{`Router>                    ! User EXEC — limited read-only commands
Router> enable             ! → Privileged EXEC (requires enable password/secret)

Router#                    ! Privileged EXEC — full show commands, copy, reload
Router# configure terminal ! → Global configuration mode
Router# disable            ! ← Back to User EXEC
Router# exit               ! Disconnect session

Router(config)#            ! Global configuration — hostname, routing, ACLs
Router(config)# interface GigabitEthernet0/0   ! → Interface sub-mode
Router(config)# router ospf 1                  ! → Router sub-mode
Router(config)# line vty 0 4                   ! → Line sub-mode

Router(config-if)#         ! Interface sub-mode
Router(config-if)# exit    ! ← One level up (back to global config)
Router(config-if)# end     ! ← All the way back to privileged EXEC
Router(config-if)# Ctrl+Z  ! Same as end`}</Pre>

      {/* ── MANAGEMENT ── */}
      <H2>Management & Saving</H2>
      <Pre>{`! Set device hostname
Router(config)# hostname SW1

! Set privileged EXEC password (encrypted — always prefer this over 'enable password')
SW1(config)# enable secret Cisco123!

! Encrypt all plaintext passwords in running-config
SW1(config)# service password-encryption

! Set a login banner
SW1(config)# banner motd # Authorised access only. #

! Save running config to NVRAM (survives reboot)
SW1# copy running-config startup-config
SW1# write memory          ! Shorthand for the same thing

! View configs
SW1# show running-config   ! Active config in RAM
SW1# show startup-config   ! Config that loads on boot

! Reboot the device
SW1# reload

! Show device info (IOS version, uptime, hardware)
SW1# show version`}</Pre>

      <InfoBox title="running-config vs startup-config" color={ACCENT}>
        Changes take effect immediately in <Code>running-config</Code> (RAM) but are lost on reboot unless you save them to <Code>startup-config</Code> (NVRAM). Always <Code>copy run start</Code> after making changes you want to keep.
      </InfoBox>

      {/* ── INTERFACES ── */}
      <H2>Interface Configuration</H2>
      <Pre>{`! Enter interface (shorthand notation works: gi0/0, fa0/1, se0/0/0)
Router(config)# interface GigabitEthernet0/0

! Assign IP address and subnet mask
Router(config-if)# ip address 192.168.1.1 255.255.255.0

! Enable the interface (Cisco interfaces are shutdown by default on routers)
Router(config-if)# no shutdown

! Disable the interface
Router(config-if)# shutdown

! Add a human-readable description
Router(config-if)# description Link to Core-SW1

! Set duplex and speed (usually left on auto)
Router(config-if)# duplex full
Router(config-if)# speed 1000

! Configure a loopback (always up, used for router-id and management)
Router(config)# interface Loopback0
Router(config-if)# ip address 1.1.1.1 255.255.255.255`}</Pre>
      <Pre>{`! Useful show commands for interfaces
Router# show interfaces                    ! Detailed stats for all interfaces
Router# show interfaces GigabitEthernet0/0 ! Single interface detail
Router# show ip interface brief            ! Summary table: IP, status, protocol
Router# show interfaces status             ! (Switches) Port, VLAN, duplex, speed`}</Pre>

      <LabCta icon="📡" name="OSI & Protocol Data Units — understand the layers behind these commands" href="/app?cat=fundamentals&tool=osiModel" color={ACCENT} />

      {/* ── STATIC ROUTING ── */}
      <H2>Static Routing</H2>
      <Pre>{`! Syntax: ip route <network> <mask> <next-hop-ip OR exit-interface>
Router(config)# ip route 10.0.2.0 255.255.255.0 10.0.1.2

! Default route (send all unknown traffic to this next hop)
Router(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1

! Floating static route (higher AD = used only if primary route disappears)
Router(config)# ip route 10.0.2.0 255.255.255.0 10.0.1.3 200

! View the routing table
Router# show ip route
Router# show ip route static
Router# show ip route 10.0.2.0    ! Show best match for specific prefix`}</Pre>

      <InfoBox title="Administrative Distance" color={PURPLE}>
        AD is the trustworthiness of a routing source. Connected = 0, Static = 1, OSPF = 110, RIP = 120, EBGP = 20. Lower wins. A floating static route uses a higher AD so a dynamic route takes precedence when available.
      </InfoBox>

      {/* ── OSPF ── */}
      <H2>OSPF</H2>
      <Pre>{`! Enable OSPF process (process-id is local only — doesn't need to match peers)
Router(config)# router ospf 1

! Advertise a network into OSPF (wildcard mask = inverse of subnet mask)
Router(config-router)# network 192.168.1.0 0.0.0.255 area 0
Router(config-router)# network 10.0.0.0 0.255.255.255 area 0

! Set a stable router ID (loopback IP is preferred automatically)
Router(config-router)# router-id 1.1.1.1

! Prevent OSPF hellos on an interface (stub networks, LANs)
Router(config-router)# passive-interface GigabitEthernet0/1

! Useful OSPF show commands
Router# show ip ospf neighbor           ! Neighbour table and state
Router# show ip ospf interface brief    ! Which interfaces run OSPF
Router# show ip ospf database           ! LSDB contents
Router# show ip route ospf              ! Only OSPF-learned routes`}</Pre>

      <LabCta icon="🌐" name="OSPF Visualiser Lab — watch neighbour formation and SPF live" href="/app?cat=routing&tool=ospfSim" color={PURPLE} />

      {/* ── VLANS ── */}
      <H2>VLANs & Switching</H2>
      <Pre>{`! Create a VLAN and give it a name (on a switch)
Switch(config)# vlan 10
Switch(config-vlan)# name Sales

Switch(config)# vlan 20
Switch(config-vlan)# name Engineering

! Access port — assigns a single VLAN to an end-device port
Switch(config)# interface GigabitEthernet0/1
Switch(config-if)# switchport mode access
Switch(config-if)# switchport access vlan 10

! Trunk port — carries multiple VLANs between switches / to routers
Switch(config)# interface GigabitEthernet0/24
Switch(config-if)# switchport mode trunk
Switch(config-if)# switchport trunk encapsulation dot1q  ! (required on older IOSv)
Switch(config-if)# switchport trunk allowed vlan 10,20   ! Restrict which VLANs

! Show VLAN info
Switch# show vlan brief               ! VLAN IDs, names, and assigned ports
Switch# show interfaces trunk         ! Trunk ports and allowed VLANs
Switch# show interfaces GigabitEthernet0/1 switchport  ! Port mode detail`}</Pre>

      <Pre>{`! Router-on-a-stick inter-VLAN routing (sub-interfaces on a router)
Router(config)# interface GigabitEthernet0/0.10
Router(config-subif)# encapsulation dot1Q 10
Router(config-subif)# ip address 192.168.10.1 255.255.255.0

Router(config)# interface GigabitEthernet0/0.20
Router(config-subif)# encapsulation dot1Q 20
Router(config-subif)# ip address 192.168.20.1 255.255.255.0`}</Pre>

      <LabCta icon="🔀" name="VLAN Configuration Lab — configure access/trunk ports interactively" href="/app?cat=switching&tool=vlanMap" color={GOLD} />

      {/* ── ACLs ── */}
      <H2>Access Control Lists (ACLs)</H2>
      <P>ACLs filter traffic. Standard ACLs match on source IP only; extended ACLs match source, destination, protocol, and port. Place standard ACLs close to the destination, extended ACLs close to the source.</P>
      <Pre>{`! Standard numbered ACL (1–99, 1300–1999)
Router(config)# access-list 10 permit 192.168.1.0 0.0.0.255
Router(config)# access-list 10 deny any   ! Implicit deny exists anyway

! Extended numbered ACL (100–199, 2000–2699)
! Syntax: access-list <number> <permit|deny> <protocol> <src> <dst> [operator port]
Router(config)# access-list 101 permit tcp 192.168.1.0 0.0.0.255 any eq 80
Router(config)# access-list 101 permit tcp 192.168.1.0 0.0.0.255 any eq 443
Router(config)# access-list 101 deny ip any any

! Named ACL (easier to edit — can delete individual lines)
Router(config)# ip access-list extended BLOCK-TELNET
Router(config-ext-nacl)# deny tcp any any eq 23
Router(config-ext-nacl)# permit ip any any

! Apply ACL to an interface (in = inbound traffic, out = outbound)
Router(config)# interface GigabitEthernet0/0
Router(config-if)# ip access-group 101 in
Router(config-if)# ip access-group BLOCK-TELNET out

! View ACLs
Router# show ip access-lists          ! All ACLs with hit counts
Router# show ip interface GigabitEthernet0/0  ! Which ACLs applied to interface`}</Pre>

      {/* ── SSH & LINES ── */}
      <H2>SSH & Remote Access</H2>
      <Pre>{`! Configure SSH (requires hostname + domain name first)
Router(config)# hostname R1
Router(config)# ip domain-name netforge.lab
Router(config)# crypto key generate rsa modulus 2048
Router(config)# ip ssh version 2

! Set VTY lines to accept SSH only (lines 0–4 = 5 simultaneous sessions)
Router(config)# line vty 0 4
Router(config-line)# transport input ssh
Router(config-line)# login local

! Create a local user for SSH login
Router(config)# username admin privilege 15 secret Cisco123!

! Disable Telnet on console for security
Router(config)# line console 0
Router(config-line)# login local
Router(config-line)# exec-timeout 10 0   ! Auto-logout after 10 min idle`}</Pre>

      {/* ── TROUBLESHOOTING ── */}
      <H2>Troubleshooting Commands</H2>
      <Pre>{`! Connectivity tests
Router# ping 8.8.8.8
Router# ping 192.168.1.1 source GigabitEthernet0/0   ! Ping from specific interface
Router# traceroute 8.8.8.8

! CDP — discover directly connected Cisco devices
Router# show cdp neighbors            ! Summary table
Router# show cdp neighbors detail     ! IPs and IOS versions

! ARP table
Router# show arp
Router# show ip arp

! MAC address table (switches)
Switch# show mac address-table
Switch# show mac address-table address 00aa.bbcc.ddee

! Spanning Tree
Switch# show spanning-tree             ! STP state for all VLANs
Switch# show spanning-tree vlan 10     ! Specific VLAN

! Debug (use carefully — high CPU on production devices)
Router# debug ip icmp                 ! Show ICMP activity in real time
Router# debug ip ospf events          ! OSPF state changes
Router# no debug all                  ! Turn off ALL debugs (or 'undebug all')

! Logging and timestamps
Router# show logging                  ! View buffered syslog
Router(config)# service timestamps log datetime msec`}</Pre>

      <InfoBox title="Debug warning" color={RED}>
        <Code>debug</Code> commands generate output for every matching event and can overwhelm a busy router's CPU. Always turn off with <Code>no debug all</Code> immediately after you've captured what you need, especially on production equipment.
      </InfoBox>

      {/* ── QUICK REF ── */}
      <H2>Quick Reference — Most-Used Commands</H2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[
          ['show ip interface brief',      'Interface status and IP addresses at a glance'],
          ['show running-config',          'Current active configuration'],
          ['show ip route',                'Routing table'],
          ['show vlan brief',              'VLAN list and port assignments'],
          ['show interfaces trunk',        'Trunk ports and allowed VLANs'],
          ['show ip ospf neighbor',        'OSPF neighbour adjacencies'],
          ['show ip access-lists',         'ACLs with hit counters'],
          ['show cdp neighbors detail',    'Discover connected Cisco devices'],
          ['copy running-config startup-config', 'Save config to NVRAM'],
          ['no debug all',                 'Stop all debug output'],
        ].map(([cmd, desc]) => (
          <div key={cmd} style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0.9rem', background: '#161b22', border: '1px solid #21262d', borderRadius: 8, alignItems: 'flex-start' }}>
            <code style={{ fontFamily: 'monospace', fontSize: '0.77rem', color: GOLD, whiteSpace: 'nowrap', flexShrink: 0, minWidth: 0 }}>{cmd}</code>
            <span style={{ fontSize: '0.77rem', color: '#8b949e', lineHeight: 1.5 }}>{desc}</span>
          </div>
        ))}
      </div>

      <LabCta icon="🌐" name="Gateway & Backup Routes Lab — configure routing in a live topology" href="/app?cat=routing&tool=gatewayLab" color={ACCENT} />
      <LabCta icon="🔒" name="802.1X Network Access Control — port security in action" href="/app?cat=switching&tool=dot1xLab" color={RED} />
    </GuideLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FAQ PAGE
───────────────────────────────────────────────────────────────── */
export function FaqPage() {
  useMeta(
    'FAQ — NetForge Networking Labs',
    'Frequently asked questions about NetForge: what\'s free, how the Pro purchase works, which CompTIA exams are covered, and how the labs work in your browser.'
  );

  const sections = [
    {
      title: 'General',
      color: ACCENT,
      qs: [
        { q: 'What is NetForge?', a: 'NetForge is a browser-based interactive lab platform for learning networking and cybersecurity. Labs cover subnetting, VLANs, routing, wireless, and security — all running live in your browser with no install required.' },
        { q: 'Do I need to install anything?', a: 'No. Every lab runs entirely in your browser using JavaScript and SVG. There are no virtual machines, no Cisco emulators, and no downloads.' },
        { q: 'Do I need an account to use the free labs?', a: 'No. All free labs are accessible without signing in. An account is only needed to activate and access your Pro or Bundle purchase.' },
        { q: 'What browsers are supported?', a: 'Any modern browser — Chrome, Firefox, Safari, and Edge all work. The labs use standard web technologies with no browser-specific dependencies.' },
      ],
    },
    {
      title: 'Pricing & Purchases',
      color: GREEN,
      qs: [
        { q: 'Is this really a one-time payment?', a: 'Yes. You pay once and have lifetime access — there are no subscriptions, no renewals, and no price increases for existing customers.' },
        { q: 'What\'s included in Labs Pro vs the Full Bundle?', a: 'Labs Pro (£5.99) unlocks all premium interactive labs. The Full Bundle (£11.99) includes everything in Labs Pro plus the CompTIA Network+ and Security+ exam practice suites with timed mock exams.' },
        { q: 'Can I get a refund?', a: 'Yes. If you haven\'t accessed the premium content, you can request a full refund within 14 days of purchase. Email admin@netforgens.com with your order details.' },
        { q: 'What does "all future Pro labs" mean?', a: 'Any lab we add to the Pro tier in the future is automatically included in your purchase at no extra cost. You won\'t be asked to pay again for new content.' },
        { q: 'Is payment secure?', a: 'Payments are processed by Stripe — we never see or store your card details. Stripe is PCI-DSS Level 1 certified.' },
      ],
    },
    {
      title: 'CompTIA Exam Prep',
      color: PURPLE,
      qs: [
        { q: 'Which exams does the Full Bundle cover?', a: 'CompTIA Network+ (N10-009) and CompTIA Security+ (SY0-701). Each includes timed mock exams, question-by-question explanations, and objective tracking.' },
        { q: 'Are the labs enough to pass the exam on their own?', a: 'The labs are an excellent complement to study materials — they provide the hands-on understanding that textbooks can\'t. We recommend using them alongside a structured course or study guide rather than as a standalone revision tool.' },
        { q: 'Do the free labs help with CompTIA exams?', a: 'Yes. A significant portion of the free labs directly covers N+ and Sec+ exam objectives. The premium labs go deeper into enterprise topics that appear in the higher-difficulty questions.' },
      ],
    },
    {
      title: 'Technical',
      color: GOLD,
      qs: [
        { q: 'My progress isn\'t saving — what\'s wrong?', a: 'Progress is stored in your browser\'s localStorage. If you\'re using private/incognito mode, or have localStorage disabled, progress won\'t persist between sessions.' },
        { q: 'The lab isn\'t loading — what should I try?', a: 'Try a hard refresh (Ctrl+Shift+R / Cmd+Shift+R). If the problem persists, clear your browser cache or try a different browser. If you still see issues, email admin@netforgens.com.' },
        { q: 'Can I use NetForge on mobile?', a: 'The labs are designed for desktop use and work best on screens wider than 768px. Some simpler tools work on tablet and mobile, but interactive labs with topology diagrams are optimised for a larger screen.' },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <div className="nf-section" style={{ flex: 1, maxWidth: 800, margin: '0 auto', paddingTop: '3rem', paddingBottom: '4rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ margin: '0 0 0.6rem', fontSize: 'clamp(1.75rem,4vw,2.25rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>Frequently Asked Questions</h1>
          <p style={{ margin: 0, color: '#8b949e', fontSize: '0.9rem' }}>Can't find the answer? <a href="/contact" style={{ color: ACCENT, textDecoration: 'none' }}>Contact us →</a></p>
        </div>
        {sections.map(s => (
          <div key={s.title} style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: s.color }}>{s.title}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {s.qs.map(({ q, a }) => (
                <div key={q} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                  <div style={{ fontWeight: 700, color: '#e6edf3', marginBottom: '0.4rem', fontSize: '0.88rem' }}>{q}</div>
                  <div style={{ color: '#8b949e', fontSize: '0.82rem', lineHeight: 1.75 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CONTACT PAGE
───────────────────────────────────────────────────────────────── */
export function ContactPage() {
  useMeta(
    'Contact NetForge — Support & Enquiries',
    'Get in touch with NetForge for support, billing questions, feature requests, or partnership enquiries. We aim to respond within 24–48 hours.'
  );
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <div className="nf-section" style={{ flex: 1, maxWidth: 700, margin: '0 auto', paddingTop: '3rem', paddingBottom: '4rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ margin: '0 0 0.6rem', fontSize: 'clamp(1.75rem,4vw,2.25rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>Get in Touch</h1>
          <p style={{ margin: 0, color: '#8b949e', lineHeight: 1.7 }}>We aim to respond to all enquiries within 24–48 hours on business days.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: '🛟', title: 'Support', desc: 'Lab not loading? Can\'t access your purchase? We\'ll get it sorted.', color: ACCENT },
            { icon: '💳', title: 'Billing', desc: 'Refund requests, payment issues, or questions about your purchase.', color: GREEN },
            { icon: '💡', title: 'Feature requests', desc: 'Got an idea for a lab or a topic we haven\'t covered yet?', color: PURPLE },
            { icon: '🤝', title: 'Partnerships', desc: 'Training providers, bootcamps, or institutional licensing enquiries.', color: GOLD },
          ].map(c => (
            <div key={c.title} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: '1.25rem', borderTop: `3px solid ${c.color}` }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{c.icon}</div>
              <div style={{ fontWeight: 700, color: '#e6edf3', marginBottom: '0.3rem', fontSize: '0.88rem' }}>{c.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#6e7681', lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#161b22', border: `1px solid ${ACCENT}40`, borderRadius: 18, padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✉️</div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>Email us directly</h2>
          <p style={{ margin: '0 0 1.5rem', color: '#8b949e', fontSize: '0.88rem', lineHeight: 1.7 }}>
            Send your message to our support address and include as much detail as possible — your account email, which lab or feature the issue relates to, and what you expected to happen.
          </p>
          <a href="mailto:admin@netforgens.com" style={{ display: 'inline-block', padding: '0.85rem 2rem', background: `linear-gradient(135deg,${ACCENT},#2563eb)`, color: '#fff', textDecoration: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', boxShadow: `0 4px 14px ${ACCENT}30` }}>
            admin@netforgens.com
          </a>
        </div>

        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <p style={{ color: '#6e7681', fontSize: '0.8rem' }}>Before emailing, check the <a href="/faq" style={{ color: ACCENT, textDecoration: 'none' }}>FAQ</a> — your question may already be answered there.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
