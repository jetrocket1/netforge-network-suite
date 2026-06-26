import { useEffect, useState } from 'react';

const ACCENT  = '#4493f8';
const PURPLE  = '#a855f7';
const GREEN   = '#3fb950';
const ORANGE  = '#f0883e';
const RED     = '#f85149';
const GOLD    = '#d29922';

/* ─── SEO meta updater ──────────────────────────────────────────── */
function useMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!el) { el = document.createElement('meta'); el.name = 'description'; document.head.appendChild(el); }
    el.content = description;
  }, [title, description]);
}

/* ─── Shared layout ─────────────────────────────────────────────── */
export function Nav() {
  const [open, setOpen] = useState(false);
  const links: [string, string][] = [['Labs','/networking-labs'],['Guides','/guides'],['Pricing','/pricing'],['About','/about']];
  return (
    <>
      <style>{`
        /* ── Global mobile resets for marketing pages ── */
        *,*::before,*::after{box-sizing:border-box}
        body{overflow-x:hidden}
        /* Nav responsive */
        .nf-nav-links{display:flex;gap:1.25rem;align-items:center}
        .nf-nav-burger{display:none;background:none;border:none;cursor:pointer;color:#e6edf3;font-size:1.3rem;line-height:1;padding:6px 8px;border-radius:6px;min-width:44px;min-height:44px;align-items:center;justify-content:center}
        /* Page section responsive padding */
        .nf-section{padding-left:2rem!important;padding-right:2rem!important}
        @media(max-width:640px){
          .nf-nav-links{display:none}
          .nf-nav-burger{display:flex}
          .nf-section{padding-left:1rem!important;padding-right:1rem!important}
          .nf-hero-pad{padding-top:2.5rem!important;padding-bottom:1.5rem!important}
        }
      `}</style>
      <div style={{ position:'sticky', top:0, zIndex:10, background:'#010409', fontFamily:'system-ui,-apple-system,sans-serif' }}>
        <nav style={{ borderBottom: open ? 'none' : '1px solid #21262d', padding:'0.75rem 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <a href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <svg width="28" height="28" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius:8, flexShrink:0 }}>
              <defs><linearGradient id="nfbg" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={ACCENT}/><stop offset="100%" stopColor={PURPLE}/></linearGradient></defs>
              <rect width="200" height="200" rx="40" fill="url(#nfbg)"/>
              <line x1="100" y1="82" x2="100" y2="55" stroke="white" strokeWidth="10" strokeOpacity="0.75" strokeLinecap="round"/>
              <line x1="86" y1="110" x2="62" y2="125" stroke="white" strokeWidth="10" strokeOpacity="0.75" strokeLinecap="round"/>
              <line x1="114" y1="110" x2="138" y2="125" stroke="white" strokeWidth="10" strokeOpacity="0.75" strokeLinecap="round"/>
              <circle cx="100" cy="42" r="13" fill="white" fillOpacity="0.85"/>
              <circle cx="50" cy="135" r="13" fill="white" fillOpacity="0.85"/>
              <circle cx="150" cy="135" r="13" fill="white" fillOpacity="0.85"/>
              <circle cx="100" cy="100" r="20" fill="white"/>
            </svg>
            <span style={{ fontWeight:800, fontSize:'1rem', color:'#e6edf3' }}>NetForge</span>
          </a>
          <div className="nf-nav-links">
            {links.map(([l,h]) => (
              <a key={h} href={h} style={{ fontSize:'0.8rem', color:'#8b949e', textDecoration:'none' }}>{l}</a>
            ))}
            <a href="/app" style={{ fontSize:'0.78rem', color:'#fff', textDecoration:'none', background:ACCENT, padding:'0.35rem 0.9rem', borderRadius:8, fontWeight:700 }}>Open App →</a>
          </div>
          <button className="nf-nav-burger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
            {open ? '✕' : '☰'}
          </button>
        </nav>
        {open && (
          <div style={{ borderBottom:'1px solid #21262d', padding:'0.5rem 1.5rem 1rem', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            {links.map(([l,h]) => (
              <a key={h} href={h} onClick={() => setOpen(false)}
                style={{ fontSize:'0.95rem', color:'#8b949e', textDecoration:'none', padding:'0.65rem 0', borderBottom:'1px solid #21262d40', display:'block' }}>{l}</a>
            ))}
            <a href="/app" onClick={() => setOpen(false)}
              style={{ display:'block', textAlign:'center', marginTop:'0.5rem', padding:'0.75rem 1rem', background:ACCENT, color:'#fff', textDecoration:'none', borderRadius:10, fontWeight:700, fontSize:'0.9rem' }}>
              Open App →
            </a>
          </div>
        )}
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="nf-section" style={{ borderTop:'1px solid #21262d', paddingTop:'2rem', paddingBottom:'2rem', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexWrap:'wrap', gap:'2rem', justifyContent:'space-between', background:'#010409' }}>
      <div>
        <div style={{ fontWeight:800, color:'#e6edf3', marginBottom:'0.5rem' }}>NetForge</div>
        <div style={{ fontSize:'0.75rem', color:'#6e7681', maxWidth:260, lineHeight:1.7 }}>Free interactive network and security labs for CompTIA N+ and Sec+ candidates.</div>
      </div>
      <div style={{ display:'flex', gap:'3rem', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#6e7681', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Labs</div>
          {[['Subnetting','/subnetting'],['Network+ Prep','/comptia-network-plus'],['Security+ Prep','/comptia-security-plus'],['All Labs','/networking-labs']].map(([l,h]) => (
            <div key={h}><a href={h} style={{ fontSize:'0.78rem', color:'#8b949e', textDecoration:'none', display:'block', marginBottom:'0.35rem' }}>{l}</a></div>
          ))}
        </div>
        <div>
          <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#6e7681', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.6rem' }}>Company</div>
          {[['Pricing','/pricing'],['About','/about'],['Privacy Policy','/privacy'],['Terms of Service','/terms']].map(([l,h]) => (
            <div key={h}><a href={h} style={{ fontSize:'0.78rem', color:'#8b949e', textDecoration:'none', display:'block', marginBottom:'0.35rem' }}>{l}</a></div>
          ))}
        </div>
      </div>
    </footer>
  );
}

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', color:'#e6edf3', fontFamily:'system-ui,-apple-system,sans-serif', display:'flex', flexDirection:'column' }}>
      <Nav />
      <div style={{ flex:1 }}>{children}</div>
      <Footer />
    </div>
  );
}

function Hero({ badge, title, sub, cta, ctaHref, secondary, secondaryHref }: { badge?:string; title:string; sub:string; cta:string; ctaHref:string; secondary?:string; secondaryHref?:string }) {
  return (
    <div className="nf-hero-pad nf-section" style={{ paddingTop:'5rem', paddingBottom:'4rem', textAlign:'center', maxWidth:760, margin:'0 auto' }}>
      {badge && <div style={{ display:'inline-block', fontSize:'0.65rem', fontWeight:800, padding:'4px 12px', borderRadius:20, background:`${ACCENT}20`, color:ACCENT, border:`1px solid ${ACCENT}40`, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'1.25rem' }}>{badge}</div>}
      <h1 style={{ margin:'0 0 1.1rem', fontSize:'clamp(1.6rem,5vw,2.6rem)', fontWeight:900, lineHeight:1.15, letterSpacing:'-0.02em' }}>{title}</h1>
      <p style={{ margin:'0 0 2rem', fontSize:'clamp(0.9rem,2.5vw,1.05rem)', color:'#8b949e', lineHeight:1.75, maxWidth:600, marginLeft:'auto', marginRight:'auto' }}>{sub}</p>
      <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
        <a href={ctaHref} style={{ padding:'0.8rem 1.75rem', background:`linear-gradient(135deg,${ACCENT},#2563eb)`, color:'#fff', textDecoration:'none', borderRadius:10, fontWeight:700, fontSize:'0.95rem', boxShadow:`0 4px 14px ${ACCENT}40` }}>{cta}</a>
        {secondary && <a href={secondaryHref} style={{ padding:'0.8rem 1.5rem', border:'1px solid #30363d', color:'#e6edf3', textDecoration:'none', borderRadius:10, fontWeight:600, fontSize:'0.95rem' }}>{secondary}</a>}
      </div>
    </div>
  );
}

function SectionHead({ title, sub }: { title:string; sub?:string }) {
  return (
    <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
      <h2 style={{ margin:'0 0 0.6rem', fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.01em' }}>{title}</h2>
      {sub && <p style={{ margin:0, color:'#8b949e', fontSize:'0.9rem' }}>{sub}</p>}
    </div>
  );
}

function Card({ icon, title, body, color = ACCENT }: { icon:string; title:string; body:string; color?:string }) {
  return (
    <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:14, padding:'1.5rem', borderTop:`3px solid ${color}` }}>
      <div style={{ fontSize:'1.5rem', marginBottom:'0.75rem' }}>{icon}</div>
      <div style={{ fontWeight:700, marginBottom:'0.4rem', color:'#e6edf3' }}>{title}</div>
      <div style={{ fontSize:'0.82rem', color:'#8b949e', lineHeight:1.7 }}>{body}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(auto-fit,minmax(240px,1fr))`, gap:'1rem', maxWidth:1100, margin:'0 auto' }}>{children}</div>;
}

function LabRow({ icon, name, desc, free, href, color }: { icon:string; name:string; desc:string; free:boolean; href:string; color:string }) {
  return (
    <a href={href} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.9rem 1.25rem', background:'#161b22', border:'1px solid #21262d', borderRadius:12, textDecoration:'none', transition:'border-color 0.15s' }}>
      <div style={{ width:38, height:38, borderRadius:10, background:`${color}20`, border:`1px solid ${color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, color:'#e6edf3', fontSize:'0.88rem' }}>{name}</div>
        <div style={{ color:'#6e7681', fontSize:'0.75rem', marginTop:2 }}>{desc}</div>
      </div>
      <div style={{ fontSize:'0.62rem', fontWeight:800, padding:'3px 8px', borderRadius:8, background: free?`${GREEN}20`:`${GOLD}20`, color: free?GREEN:GOLD, border:`1px solid ${free?GREEN:GOLD}40`, whiteSpace:'nowrap', flexShrink:0 }}>{free?'FREE':'PRO'}</div>
    </a>
  );
}

/* ─────────────────────────────────────────────────────────────────
   1. SUBNETTING PAGE
───────────────────────────────────────────────────────────────── */
export function SubnettingPage() {
  useMeta(
    'Free Subnetting Practice & Calculator | NetForge',
    'Master IPv4 subnetting with free interactive tools. IP subnet calculator, VLSM planner, and CompTIA Network+ subnetting practice. No signup required.'
  );
  return (
    <PageWrap>
      <Hero
        badge="Free Subnetting Tools"
        title="Master Subnetting — Free Interactive Practice"
        sub="From CIDR basics to VLSM design, NetForge has every tool you need to ace the subnetting questions on your CompTIA Network+ exam."
        cta="Open Subnet Calculator →"
        ctaHref="/?cat=subnetting&tool=calculator"
        secondary="View all tools"
        secondaryHref="/networking-labs"
      />

      <div className="nf-section" style={{ paddingTop:0, paddingBottom:'4rem', maxWidth:1100, margin:'0 auto' }}>
        <SectionHead title="What Is Subnetting?" />
        <p style={{ color:'#8b949e', lineHeight:1.8, maxWidth:720, margin:'0 auto 3rem', textAlign:'center', fontSize:'0.9rem' }}>
          Subnetting divides a large IP network into smaller, more manageable segments called subnets. Each subnet is a broadcast domain — devices can communicate directly within it, but need a router to reach other subnets. Subnetting is essential for network security, efficient IP address usage, and is heavily tested on the CompTIA Network+ (N10-009) exam.
        </p>

        <SectionHead title="Free Subnetting Tools" sub="Everything you need, no account required" />
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', maxWidth:800, margin:'0 auto 4rem' }}>
          <LabRow icon="🧮" name="IP Subnet Calculator" desc="Enter any IP and CIDR prefix — instantly see network address, broadcast, host range, and wildcard mask." free={true} href="/?cat=subnetting&tool=calculator" color={ACCENT} />
          <LabRow icon="🌳" name="VLSM Planner" desc="Allocate subnets of varying sizes to multiple departments using Variable Length Subnet Masking." free={true} href="/?cat=subnetting&tool=splitter" color={GREEN} />
          <LabRow icon="🌐" name="IPv6 Address Basics" desc="Interactive guide to IPv6 notation, prefix lengths, and address types with live examples." free={true} href="/?cat=subnetting&tool=ipv6Suite" color={PURPLE} />
          <LabRow icon="📋" name="Subnetting Quick Sheet" desc="Printable reference card with all subnet masks, wildcard masks, and host counts from /8 to /30." free={true} href="/?cat=subnetting&tool=cheatsheet" color={ORANGE} />
        </div>

        <SectionHead title="Key Subnetting Formulas" sub="Everything the exam tests" />
        <Grid>
          <Card icon="🔢" title="Number of Hosts" body="Usable hosts = 2^(32 − prefix) − 2. The −2 removes the network address and broadcast address. A /24 gives 2^8 − 2 = 254 hosts." color={ACCENT} />
          <Card icon="🔲" title="Number of Subnets" body="Subnets borrowed from host bits = 2^n, where n = bits borrowed. Borrowing 3 bits from a /24 gives 2^3 = 8 subnets, each a /27." color={GREEN} />
          <Card icon="📏" title="Subnet Increment" body="The block size (increment between subnets) = 256 − subnet mask octet. For /26 (mask 192), block = 256 − 192 = 64. Subnets start at 0, 64, 128, 192." color={PURPLE} />
        </Grid>
      </div>
    </PageWrap>
  );
}

/* ─────────────────────────────────────────────────────────────────
   2. NETWORK+ PAGE
───────────────────────────────────────────────────────────────── */
export function NetworkPlusPage() {
  useMeta(
    'CompTIA Network+ Lab Practice — Free Interactive Labs | NetForge',
    'Free interactive labs mapped to every CompTIA Network+ (N10-009) exam domain. Subnetting, VLANs, routing, wireless, and more. Hands-on practice that sticks.'
  );

  const domains = [
    { code:'1.0', name:'Networking Concepts', pct:'23%', color:ACCENT,  labs:['OSI 7-Layer Model','TCP Connection Lifecycle','Protocol Data Units','Packets vs Frames','How Ping Works (ICMP)'] },
    { code:'2.0', name:'Network Implementation', pct:'20%', color:GREEN,  labs:['IP Subnet Calculator','VLSM Planner','VLAN Configuration','Spanning Tree Protocol','Link Aggregation'] },
    { code:'3.0', name:'Network Operations', pct:'17%', color:PURPLE, labs:['DNS Resolution Visualiser','DHCP / DNS Services','NAT / PAT Simulator','QoS Traffic Management','Gateway & Backup Routes'] },
    { code:'4.0', name:'Network Security', pct:'20%', color:RED,    labs:['802.1X Network Access Control','ACL Rules Simulator','Firewall Zone Policy','TLS Handshake Visualiser','PKI & Certificate Chain'] },
    { code:'5.0', name:'Network Troubleshooting', pct:'20%', color:GOLD,   labs:['MAC Learning & Forwarding','Longest Prefix Match','OSPF Visualiser','Wireless Spectrum Analyser','Layer 2 Attack Mitigation'] },
  ];

  return (
    <PageWrap>
      <Hero
        badge="CompTIA N10-009"
        title="CompTIA Network+ Lab Practice"
        sub="Hands-on interactive labs mapped to every N+ exam domain. Stop memorising — start understanding through simulation."
        cta="Start Practising Free →"
        ctaHref="/?cat=fundamentals"
        secondary="View Exam Labs →"
        secondaryHref="/networking-labs"
      />

      <div className="nf-section" style={{ paddingTop:0, paddingBottom:'4rem', maxWidth:1100, margin:'0 auto' }}>
        <SectionHead title="Exam at a Glance" />
        <Grid>
          {[
            { label:'Questions',     value:'65',         color:ACCENT  },
            { label:'Time',          value:'90 min',     color:GREEN   },
            { label:'Passing Score', value:'720 / 900',  color:PURPLE  },
            { label:'Labs on NetForge', value:'30+',     color:GOLD    },
          ].map(s => (
            <div key={s.label} style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:14, padding:'1.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'1.75rem', fontWeight:900, color:s.color, fontFamily:'monospace' }}>{s.value}</div>
              <div style={{ fontSize:'0.72rem', color:'#6e7681', marginTop:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
            </div>
          ))}
        </Grid>

        <div style={{ marginTop:'3rem' }}>
          <SectionHead title="Labs by Exam Domain" sub="Every domain covered — click any lab to open it" />
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            {domains.map(d => (
              <div key={d.code} style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'0.9rem 1.25rem', borderBottom:'1px solid #21262d', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${d.color}20`, border:`1px solid ${d.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'0.78rem', color:d.color, flexShrink:0 }}>{d.pct}</div>
                  <div>
                    <span style={{ fontWeight:800, color:'#e6edf3', fontSize:'0.9rem' }}>{d.code} {d.name}</span>
                    <span style={{ fontSize:'0.72rem', color:'#6e7681', marginLeft:8 }}>{d.pct} of exam</span>
                  </div>
                </div>
                <div style={{ padding:'0.75rem 1.25rem', display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {d.labs.map(lab => (
                    <a key={lab} href="/" style={{ fontSize:'0.72rem', padding:'4px 10px', borderRadius:8, background:`${d.color}12`, border:`1px solid ${d.color}30`, color:d.color, textDecoration:'none', fontWeight:600 }}>{lab}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

/* ─────────────────────────────────────────────────────────────────
   3. SECURITY+ PAGE
───────────────────────────────────────────────────────────────── */
export function SecurityPlusPage() {
  useMeta(
    'CompTIA Security+ Lab Practice — Free Interactive Security Labs | NetForge',
    'Hands-on CompTIA Security+ (SY0-701) lab practice. Phishing simulator, ARP poisoning, firewall rules, TLS, PKI, and network forensics. Free and Pro labs available.'
  );

  const domains = [
    { code:'1.0', name:'General Security Concepts', pct:'12%', color:ACCENT, labs:['TLS Handshake Visualiser','PKI & Certificate Chain','802.1X Network Access Control'] },
    { code:'2.0', name:'Threats, Vulnerabilities & Mitigations', pct:'22%', color:RED, labs:['Phishing Simulator','ARP Poisoning / MITM','Layer 2 Attack Mitigation','Network Forensics'] },
    { code:'3.0', name:'Security Architecture', pct:'18%', color:PURPLE, labs:['Firewall Zone Policy','ACL Rules Simulator','IPsec / WireGuard VPN','NAT / PAT Simulator'] },
    { code:'4.0', name:'Security Operations', pct:'28%', color:GREEN, labs:['Network Forensics','Wi-Fi Security (WPA)','VLAN Configuration','Network Forensics'] },
    { code:'5.0', name:'Security Program Management', pct:'20%', color:GOLD, labs:['Exam Practice Sandbox'] },
  ];

  return (
    <PageWrap>
      <Hero
        badge="CompTIA SY0-701"
        title="CompTIA Security+ Lab Practice"
        sub="From phishing attacks to ARP poisoning to firewall policy — practise every Security+ threat scenario hands-on before exam day."
        cta="Start Security Labs →"
        ctaHref="/?cat=security"
        secondary="See Pricing"
        secondaryHref="/pricing"
      />

      <div className="nf-section" style={{ paddingTop:0, paddingBottom:'4rem', maxWidth:1100, margin:'0 auto' }}>
        <SectionHead title="Why Hands-On Practice Works" />
        <Grid>
          <Card icon="🎣" title="Phishing Simulator" body="Identify real-world phishing emails, spot spoofed domains, and analyse suspicious URLs — exactly the attack recognition skills tested in Domain 2." color={RED} />
          <Card icon="🕵️" title="ARP Poisoning / MITM" body="Watch a Layer 2 man-in-the-middle attack unfold step by step. See how ARP cache poisoning works and how Dynamic ARP Inspection stops it." color={PURPLE} />
          <Card icon="🔥" title="Firewall Zone Policy" body="Build stateful firewall rules, define security zones, and simulate traffic — the exact skill set for architecture and hardening questions." color={ORANGE} />
        </Grid>

        <div style={{ marginTop:'3rem' }}>
          <SectionHead title="Labs by Exam Domain" />
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            {domains.map(d => (
              <div key={d.code} style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'0.9rem 1.25rem', borderBottom:'1px solid #21262d', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${d.color}20`, border:`1px solid ${d.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'0.78rem', color:d.color, flexShrink:0 }}>{d.pct}</div>
                  <span style={{ fontWeight:800, color:'#e6edf3', fontSize:'0.9rem' }}>{d.code} {d.name} <span style={{ fontSize:'0.72rem', color:'#6e7681', fontWeight:400 }}>— {d.pct} of exam</span></span>
                </div>
                <div style={{ padding:'0.75rem 1.25rem', display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {d.labs.map(lab => (
                    <a key={lab} href="/?cat=security" style={{ fontSize:'0.72rem', padding:'4px 10px', borderRadius:8, background:`${d.color}12`, border:`1px solid ${d.color}30`, color:d.color, textDecoration:'none', fontWeight:600 }}>{lab}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrap>
  );
}

/* ─────────────────────────────────────────────────────────────────
   4. ALL LABS PAGE
───────────────────────────────────────────────────────────────── */
export function LabsPage() {
  useMeta(
    'All Free Networking Labs | NetForge',
    'Browse all interactive networking and security labs. Free labs for subnetting, ARP, TCP, DNS, VLANs, wireless and more. Premium labs for advanced enterprise topics.'
  );

  const cats = [
    { name:'Fundamentals', color:ACCENT, labs:[
      { icon:'📶', name:'OSI 7-Layer Model', desc:'Interactive OSI reference with real protocol examples at each layer.', free:true, href:'/?cat=fundamentals&tool=osiModel' },
      { icon:'🔌', name:'TCP Connection Lifecycle', desc:'Animated 3-way handshake, data transfer, and graceful teardown.', free:true, href:'/?cat=fundamentals&tool=tcpLab' },
      { icon:'📡', name:'How Ping Works (ICMP)', desc:'ICMP echo request/reply visualised with TTL and error messages.', free:true, href:'/?cat=fundamentals&tool=icmpLab' },
      { icon:'🔍', name:'Address Resolution (ARP)', desc:'Watch ARP requests and replies populate the ARP cache in real time.', free:true, href:'/?cat=fundamentals&tool=arpLab' },
      { icon:'🌐', name:'DNS Resolution Visualiser', desc:'Step-by-step recursive and iterative DNS resolution with caching.', free:true, href:'/?cat=fundamentals&tool=dnsLab' },
    ]},
    { name:'Subnetting', color:GREEN, labs:[
      { icon:'🧮', name:'IP Subnet Calculator', desc:'Instant subnet breakdown for any IPv4 address and prefix length.', free:true, href:'/?cat=subnetting&tool=calculator' },
      { icon:'🌳', name:'VLSM Planner', desc:'Design efficient address plans with Variable Length Subnet Masking.', free:true, href:'/?cat=subnetting&tool=splitter' },
      { icon:'🌐', name:'IPv6 Address Basics', desc:'Explore IPv6 notation, address types, and EUI-64 formation.', free:true, href:'/?cat=subnetting&tool=ipv6Suite' },
    ]},
    { name:'Switching', color:PURPLE, labs:[
      { icon:'🔀', name:'VLAN Configuration', desc:'Build a live switch, animate packet tagging, complete IOS CLI challenges.', free:false, href:'/?cat=switching&tool=vlanMap' },
      { icon:'🔒', name:'802.1X Network Access Control', desc:'EAP, RADIUS, and port authentication with PEAP vs EAP-TLS comparison.', free:false, href:'/?cat=switching&tool=dot1xLab' },
      { icon:'🌲', name:'Spanning Tree Protocol', desc:'STP port states, BPDU exchange, and root bridge election visualised.', free:true, href:'/?cat=switching&tool=stpLab' },
    ]},
    { name:'Wireless', color:GOLD, labs:[
      { icon:'📡', name:'Wi-Fi Spectrum Analyser', desc:'SVG bell-curve channel overlap, ACI/CCI detection, interference simulation.', free:false, href:'/?cat=wireless&tool=wifi' },
      { icon:'🔐', name:'Wi-Fi Security (WPA)', desc:'WPA2/WPA3 handshake, PMKID attacks, and enterprise 802.1X mode.', free:true, href:'/?cat=wireless&tool=security' },
    ]},
    { name:'Security', color:RED, labs:[
      { icon:'🎣', name:'Phishing Simulator', desc:'Identify phishing emails, red flags, BEC attacks and suspicious URLs.', free:false, href:'/?cat=security&tool=phishingSim' },
      { icon:'🕵️', name:'ARP Poisoning / MITM', desc:'Step-by-step ARP cache poisoning animation with DAI countermeasures.', free:false, href:'/?cat=security&tool=arpMitm' },
      { icon:'🔥', name:'Firewall Zone Policy', desc:'Build stateful firewall rules and test traffic across security zones.', free:false, href:'/?cat=security&tool=firewallLab' },
      { icon:'🔒', name:'Network Forensics', desc:'Analyse simulated packet captures and logs to identify threats.', free:false, href:'/?cat=security&tool=forensicsLab' },
      { icon:'📜', name:'PKI & Certificate Chain', desc:'Certificate authorities, trust chains, and TLS certificate validation.', free:false, href:'/?cat=security&tool=pkiLab' },
    ]},
  ];

  return (
    <PageWrap>
      <Hero
        badge="30+ Labs"
        title="Interactive Networking Labs"
        sub="Every lab runs in your browser — no software to install, no VMs, no signup needed for free content. Learn by doing, not watching."
        cta="Open App →"
        ctaHref="/"
      />
      <div className="nf-section" style={{ paddingTop:0, paddingBottom:'4rem', maxWidth:1100, margin:'0 auto' }}>
        {cats.map(cat => (
          <div key={cat.name} style={{ marginBottom:'2.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' }}>
              <div style={{ width:10, height:10, borderRadius:3, background:cat.color }} />
              <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:800 }}>{cat.name}</h2>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              {cat.labs.map(lab => <LabRow key={lab.name} {...lab} color={cat.color} />)}
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  );
}

/* ─────────────────────────────────────────────────────────────────
   5. PRICING PAGE
───────────────────────────────────────────────────────────────── */
export function PricingPage() {
  useMeta(
    'Pricing — NetForge Labs Pro | One-Time Payment, Lifetime Access',
    'NetForge Labs Pro from £5.99 — one-time payment, lifetime access to all premium network and security labs. No subscription, no renewal.'
  );

  const freePros = ['IP Subnet Calculator','VLSM Planner','IPv6 Suite','OSI Model','TCP Lifecycle','ICMP / Ping Lab','ARP Lab','DNS Visualiser','MAC Learning','STP Lab','Wi-Fi Security','Routing Protocols Matrix','All beginner & intermediate fundamentals'];
  const proPros  = ['Everything in Free','VLAN Configuration Lab','802.1X / Dot1x Lab','Wi-Fi Spectrum Analyser','Phishing Simulator','ARP Poisoning / MITM Lab','Firewall Zone Policy','PKI & Certificate Chain','Network Forensics','IPsec / WireGuard VPN','OSPF Visualiser','QoS Traffic Management','All future Pro labs'];
  const examPros = ['Everything in Labs Pro','CompTIA Network+ Exam Practice','CompTIA Security+ Exam Practice','Timed mock exams','Question-by-question explanations','Exam objective tracking'];

  return (
    <PageWrap>
      <Hero
        badge="Simple Pricing"
        title="One-Time Payment. Lifetime Access."
        sub="No subscriptions, no renewals, no catches. Pay once and keep access to every current and future lab forever."
        cta="Get Labs Pro — £5.99 →"
        ctaHref="/"
      />
      <div style={{ padding:'0 2rem 4rem', maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1.25rem', marginBottom:'3rem' }}>
          {/* Free */}
          <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:18, padding:'2rem', display:'flex', flexDirection:'column' }}>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'#e6edf3', marginBottom:4 }}>Free</div>
            <div style={{ fontSize:'2.25rem', fontWeight:900, color:'#e6edf3', marginBottom:'0.25rem' }}>£0</div>
            <div style={{ fontSize:'0.75rem', color:'#6e7681', marginBottom:'1.5rem' }}>No account required</div>
            <a href="/" style={{ display:'block', textAlign:'center', padding:'0.7rem', border:'1px solid #30363d', borderRadius:10, color:'#e6edf3', textDecoration:'none', fontWeight:700, marginBottom:'1.5rem' }}>Start for free</a>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {freePros.map(f => <div key={f} style={{ display:'flex', gap:8, fontSize:'0.78rem', color:'#8b949e' }}><span style={{ color:GREEN, flexShrink:0 }}>✓</span>{f}</div>)}
            </div>
          </div>

          {/* Labs Pro */}
          <div style={{ background:'#161b22', border:`2px solid ${ACCENT}`, borderRadius:18, padding:'2rem', display:'flex', flexDirection:'column', position:'relative' }}>
            <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:`linear-gradient(135deg,${ACCENT},#2563eb)`, color:'#fff', fontSize:'0.62rem', fontWeight:800, padding:'3px 12px', borderRadius:20, letterSpacing:'0.08em', whiteSpace:'nowrap' }}>MOST POPULAR</div>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'#e6edf3', marginBottom:4 }}>Labs Pro</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:'0.25rem' }}>
              <span style={{ fontSize:'2.25rem', fontWeight:900, color:ACCENT }}>£5.99</span>
              <span style={{ fontSize:'0.8rem', color:'#6e7681' }}>one-time</span>
            </div>
            <div style={{ fontSize:'0.75rem', color:'#6e7681', marginBottom:'1.5rem' }}>Lifetime access · No renewal</div>
            <a href="/" style={{ display:'block', textAlign:'center', padding:'0.7rem', background:`linear-gradient(135deg,${ACCENT},#2563eb)`, borderRadius:10, color:'#fff', textDecoration:'none', fontWeight:700, marginBottom:'1.5rem', boxShadow:`0 4px 14px ${ACCENT}40` }}>Get Labs Pro →</a>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {proPros.map(f => <div key={f} style={{ display:'flex', gap:8, fontSize:'0.78rem', color: f.startsWith('Everything') ? '#e6edf3' : '#8b949e' }}><span style={{ color:GREEN, flexShrink:0 }}>✓</span>{f}</div>)}
            </div>
          </div>

          {/* Full Bundle */}
          <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:18, padding:'2rem', display:'flex', flexDirection:'column' }}>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'#e6edf3', marginBottom:4 }}>Full Bundle</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:'0.25rem' }}>
              <span style={{ fontSize:'2.25rem', fontWeight:900, color:PURPLE }}>£11.99</span>
              <span style={{ fontSize:'0.8rem', color:'#6e7681' }}>one-time</span>
            </div>
            <div style={{ fontSize:'0.75rem', color:'#6e7681', marginBottom:'1.5rem' }}>Labs + Exam Prep · Lifetime access</div>
            <a href="/" style={{ display:'block', textAlign:'center', padding:'0.7rem', background:`linear-gradient(135deg,${PURPLE},#7c3aed)`, borderRadius:10, color:'#fff', textDecoration:'none', fontWeight:700, marginBottom:'1.5rem' }}>Get Full Bundle →</a>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {examPros.map(f => <div key={f} style={{ display:'flex', gap:8, fontSize:'0.78rem', color: f.startsWith('Everything') ? '#e6edf3' : '#8b949e' }}><span style={{ color:GREEN, flexShrink:0 }}>✓</span>{f}</div>)}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <SectionHead title="Frequently Asked Questions" />
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', maxWidth:720, margin:'0 auto' }}>
          {[
            { q:'Is this really a one-time payment?', a:'Yes. Pay once and you have access forever — no monthly fees, no renewal reminders, no price increases for existing customers.' },
            { q:'What does "all future Pro labs" mean?', a:'Any lab we add to the Pro tier in the future is automatically included in your purchase at no extra cost.' },
            { q:'Can I get a refund?', a:'Yes — if you haven\'t accessed the premium content, you can request a full refund within 14 days of purchase. Contact admin@netforgens.com.' },
            { q:'Do I need an account for free labs?', a:'No. All free labs work without signing in. An account is only needed to activate and access your Pro purchase.' },
            { q:'What exams does the Full Bundle cover?', a:'CompTIA Network+ (N10-009) and CompTIA Security+ (SY0-701) exam practice with timed mock exams and detailed explanations.' },
          ].map(({ q, a }) => (
            <div key={q} style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:12, padding:'1.1rem 1.25rem' }}>
              <div style={{ fontWeight:700, color:'#e6edf3', marginBottom:'0.4rem', fontSize:'0.88rem' }}>{q}</div>
              <div style={{ color:'#8b949e', fontSize:'0.82rem', lineHeight:1.7 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>
    </PageWrap>
  );
}

/* ─────────────────────────────────────────────────────────────────
   6. ABOUT PAGE
───────────────────────────────────────────────────────────────── */
export function AboutPage() {
  useMeta(
    'About NetForge — Interactive Network Training Labs',
    'NetForge is a browser-based network engineering training platform built for CompTIA Network+ and Security+ candidates who learn best by doing.'
  );
  return (
    <PageWrap>
      <Hero
        badge="About NetForge"
        title="Learn Networking By Doing, Not Watching"
        sub="NetForge was built out of frustration with passive study materials. Reading about subnetting is not the same as calculating it under exam pressure. Watching a video about VLANs is not the same as configuring one."
        cta="Start Learning Free →"
        ctaHref="/"
      />
      <div style={{ padding:'0 2rem 4rem', maxWidth:900, margin:'0 auto' }}>
        <SectionHead title="What Is NetForge?" />
        <p style={{ color:'#8b949e', lineHeight:1.85, fontSize:'0.92rem', marginBottom:'1.5rem' }}>
          NetForge is a browser-based interactive lab platform for network engineers and IT professionals studying for CompTIA Network+ and Security+ certifications. Every lab runs entirely in your browser — no virtual machines, no Cisco licensing, no complex setup.
        </p>
        <p style={{ color:'#8b949e', lineHeight:1.85, fontSize:'0.92rem', marginBottom:'3rem' }}>
          Labs are designed to build genuine understanding, not just exam-passing knowledge. When you configure a VLAN and watch the 802.1Q tag appear on a trunk port, or see your ARP cache get poisoned in real time, that knowledge sticks in a way that flashcards never will.
        </p>

        <SectionHead title="Who Is It For?" />
        <Grid>
          <Card icon="🎓" title="Exam Candidates" body="Studying for CompTIA Network+ or Security+? Labs cover every exam domain with practical scenarios that reinforce the theory you've been reading." color={ACCENT} />
          <Card icon="💼" title="IT Professionals" body="Moving into a networking or security role? Use NetForge to build confidence with enterprise concepts like VLANs, 802.1X, OSPF, and firewall policy." color={GREEN} />
          <Card icon="🏫" title="Students & Bootcamps" body="Whether you're in a university course or a self-paced bootcamp, NetForge provides the hands-on lab component that most courses leave out." color={PURPLE} />
        </Grid>

        <div style={{ marginTop:'3rem' }}>
          <SectionHead title="By the Numbers" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'1rem', textAlign:'center' }}>
            {[
              { value:'30+', label:'Interactive Labs',   color:ACCENT  },
              { value:'5',   label:'Topic Categories',   color:GREEN   },
              { value:'2',   label:'Exam Prep Suites',   color:PURPLE  },
              { value:'£0',  label:'To get started',     color:GOLD    },
            ].map(s => (
              <div key={s.label} style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:14, padding:'1.5rem 1rem' }}>
                <div style={{ fontSize:'2rem', fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:'0.72rem', color:'#6e7681', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop:'3rem', background:'#161b22', border:`1px solid ${ACCENT}40`, borderRadius:18, padding:'2.5rem', textAlign:'center' }}>
          <h3 style={{ margin:'0 0 0.75rem', fontSize:'1.25rem', fontWeight:800 }}>Ready to start?</h3>
          <p style={{ color:'#8b949e', margin:'0 0 1.5rem', fontSize:'0.88rem' }}>Every free lab is available right now — no account, no signup, no credit card.</p>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/" style={{ padding:'0.75rem 1.5rem', background:`linear-gradient(135deg,${ACCENT},#2563eb)`, color:'#fff', textDecoration:'none', borderRadius:10, fontWeight:700 }}>Open Free Labs →</a>
            <a href="/pricing" style={{ padding:'0.75rem 1.5rem', border:'1px solid #30363d', color:'#e6edf3', textDecoration:'none', borderRadius:10, fontWeight:600 }}>View Pricing</a>
          </div>
        </div>

        <div style={{ marginTop:'2.5rem', textAlign:'center' }}>
          <p style={{ color:'#6e7681', fontSize:'0.8rem' }}>Questions? Email us at <a href="mailto:admin@netforgens.com" style={{ color:ACCENT }}>admin@netforgens.com</a></p>
        </div>
      </div>
    </PageWrap>
  );
}
