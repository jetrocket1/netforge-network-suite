import { useEffect } from 'react';
import { Nav, Footer } from './MarketingPages';

const ACCENT = '#4493f8';
const PURPLE = '#a855f7';
const GREEN  = '#3fb950';
const ORANGE = '#f0883e';
const RED    = '#f85149';
const GOLD   = '#d29922';

export function HomePage() {
  useEffect(() => {
    document.title = 'NetForge — Interactive Network & Security Labs | CompTIA N+ & Sec+ Prep';
    const el = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (el) el.content = 'Free interactive labs for subnetting, VLANs, ARP, TCP, firewalls, Wi-Fi, and more. Premium CompTIA Network+ and Security+ exam practice. Learn networking hands-on.';
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Nav />

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 2rem 4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: `radial-gradient(ellipse at center, ${ACCENT}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: 800, padding: '4px 14px', borderRadius: 20, background: `${GREEN}18`, color: GREEN, border: `1px solid ${GREEN}40`, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>
            Free browser-based labs · No install required
          </div>
          <h1 style={{ margin: '0 0 1.25rem', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.025em' }}>
            The hands-on way to pass<br />
            <span style={{ background: `linear-gradient(135deg,${ACCENT},${PURPLE})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Network+ and Security+
            </span>
          </h1>
          <p style={{ margin: '0 0 2.25rem', fontSize: '1.1rem', color: '#8b949e', lineHeight: 1.75, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            30+ interactive labs covering subnetting, VLANs, routing, wireless, and cybersecurity — all running live in your browser. No VMs. No Cisco licensing. Start in seconds.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/app" style={{ padding: '0.9rem 2rem', background: `linear-gradient(135deg,${ACCENT},#2563eb)`, color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1rem', boxShadow: `0 6px 20px ${ACCENT}40` }}>
              Start Free Labs →
            </a>
            <a href="/pricing" style={{ padding: '0.9rem 1.75rem', border: '1px solid #30363d', color: '#e6edf3', textDecoration: 'none', borderRadius: 12, fontWeight: 600, fontSize: '1rem' }}>
              See Pricing
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section style={{ borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d', padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(2rem,6vw,5rem)', flexWrap: 'wrap', maxWidth: 800, margin: '0 auto' }}>
          {[
            { value: '30+',  label: 'Interactive Labs',   color: ACCENT  },
            { value: '5',    label: 'Topic Categories',   color: GREEN   },
            { value: '2',    label: 'Exam Prep Suites',   color: PURPLE  },
            { value: '£0',   label: 'To get started',     color: GOLD    },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#6e7681', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lab categories ── */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em' }}>Everything you need in one place</h2>
          <p style={{ margin: 0, color: '#8b949e', fontSize: '0.9rem' }}>Labs organised by topic — click any category to jump straight in</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
          {[
            { icon: '📡', name: 'Fundamentals', desc: 'OSI model, TCP, ICMP, ARP, DNS — the building blocks of every network.', color: ACCENT,  href: '/app?cat=fundamentals' },
            { icon: '🧮', name: 'Subnetting',   desc: 'IP subnet calculator, VLSM planner, IPv6 basics, and cheat sheets.', color: GREEN,  href: '/subnetting' },
            { icon: '🔀', name: 'Switching',    desc: 'VLANs, 802.1X, Spanning Tree, LACP — enterprise switching concepts.', color: PURPLE, href: '/app?cat=switching' },
            { icon: '🌐', name: 'Routing',      desc: 'OSPF, NAT, BGP basics, longest-prefix match, and gateway design.', color: ORANGE, href: '/app?cat=routing' },
            { icon: '📶', name: 'Wireless',     desc: 'Wi-Fi standards, spectrum analysis, channel overlap, and WPA security.', color: GOLD,   href: '/app?cat=wireless' },
            { icon: '🔒', name: 'Security',     desc: 'Phishing, ARP poisoning, firewall policy, PKI, forensics, and more.', color: RED,    href: '/app?cat=security' },
          ].map(c => (
            <a key={c.name} href={c.href} style={{ display: 'block', background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: '1.5rem 1.25rem', textDecoration: 'none', borderTop: `3px solid ${c.color}`, transition: 'border-color 0.15s' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '0.6rem' }}>{c.icon}</div>
              <div style={{ fontWeight: 800, color: '#e6edf3', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{c.name}</div>
              <div style={{ fontSize: '0.77rem', color: '#6e7681', lineHeight: 1.65 }}>{c.desc}</div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Featured labs ── */}
      <section style={{ padding: '0 2rem 4rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 800 }}>Popular labs</h2>
          <p style={{ margin: 0, color: '#8b949e', fontSize: '0.88rem' }}>Free labs you can open right now — no account needed</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
          {[
            { icon: '🧮', name: 'IP Subnet Calculator', desc: 'Enter any IP and CIDR prefix. Instantly see network address, broadcast, host range, and wildcard mask.', color: GREEN,  href: '/app?cat=subnetting&tool=calculator', free: true },
            { icon: '📶', name: 'OSI 7-Layer Model',    desc: 'Interactive OSI reference with real protocols at each layer. Click any layer to explore its responsibilities.', color: ACCENT, href: '/app?cat=fundamentals&tool=osiModel', free: true },
            { icon: '🔌', name: 'TCP Lifecycle',        desc: 'Animated 3-way handshake, data transfer, and teardown. Step through each packet and see what\'s happening.', color: PURPLE, href: '/app?cat=fundamentals&tool=tcpLab', free: true },
            { icon: '🌐', name: 'DNS Resolution',       desc: 'Step-by-step recursive DNS resolution from root to authoritative server, with TTL caching explained.', color: ORANGE, href: '/app?cat=fundamentals&tool=dnsLab', free: true },
            { icon: '🎣', name: 'Phishing Simulator',   desc: 'Identify phishing emails, spot spoofed domains, and analyse suspicious URLs — core Security+ skill.', color: RED,    href: '/app?cat=security&tool=phishingSim', free: false },
            { icon: '🔀', name: 'VLAN Configuration',   desc: 'Build a live switch, configure VLANs, animate 802.1Q tagging on trunk ports, and complete CLI challenges.', color: GOLD,   href: '/app?cat=switching&tool=vlanMap', free: false },
          ].map(lab => (
            <a key={lab.name} href={lab.href} style={{ display: 'block', background: '#161b22', border: '1px solid #21262d', borderRadius: 14, padding: '1.25rem', textDecoration: 'none', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: `${lab.color}18`, border: `1px solid ${lab.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{lab.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, color: '#e6edf3', fontSize: '0.88rem' }}>{lab.name}</span>
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: lab.free ? `${GREEN}20` : `${GOLD}20`, color: lab.free ? GREEN : GOLD, border: `1px solid ${lab.free ? GREEN : GOLD}40` }}>{lab.free ? 'FREE' : 'PRO'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6e7681', lineHeight: 1.6 }}>{lab.desc}</div>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/networking-labs" style={{ fontSize: '0.85rem', color: ACCENT, textDecoration: 'none', fontWeight: 600 }}>View all 30+ labs →</a>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '4rem 2rem', background: '#010409', borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 800 }}>Learning that actually sticks</h2>
            <p style={{ margin: 0, color: '#8b949e', fontSize: '0.88rem' }}>Reading about subnetting isn't the same as calculating it under pressure</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem' }}>
            {[
              { n: '01', title: 'Choose a topic', body: 'Browse labs by category or jump to a specific tool. Everything is free to explore — no account, no paywall on core content.', color: ACCENT },
              { n: '02', title: 'Interact, don\'t just read', body: 'Configure live VLANs, watch ARP packets animate in real time, step through a TCP handshake packet by packet. The simulation IS the lesson.', color: GREEN },
              { n: '03', title: 'Test your knowledge', body: 'Each lab includes exam-style callouts mapping concepts to N+ and Sec+ objectives. Pro users get full timed mock exams.', color: PURPLE },
            ].map(s => (
              <div key={s.n} style={{ position: 'relative', paddingLeft: '1rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: `${s.color}30`, fontFamily: 'monospace', lineHeight: 1, marginBottom: '0.5rem' }}>{s.n}</div>
                <div style={{ fontWeight: 800, color: '#e6edf3', marginBottom: '0.4rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#6e7681', lineHeight: 1.75 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Exam prep ── */}
      <section style={{ padding: '4rem 2rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 800 }}>Built for CompTIA exam prep</h2>
          <p style={{ margin: 0, color: '#8b949e', fontSize: '0.88rem' }}>Every lab maps to official exam objectives</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' }}>
          {[
            {
              badge: 'N10-009', name: 'CompTIA Network+', color: ACCENT,
              href: '/comptia-network-plus',
              domains: ['Networking Concepts (23%)', 'Network Implementation (20%)', 'Network Operations (17%)', 'Network Security (20%)', 'Network Troubleshooting (20%)'],
              cta: 'See N+ labs →',
            },
            {
              badge: 'SY0-701', name: 'CompTIA Security+', color: RED,
              href: '/comptia-security-plus',
              domains: ['Threats, Vulnerabilities & Mitigations (22%)', 'Security Architecture (18%)', 'Security Operations (28%)', 'Security Program Management (20%)', 'General Security Concepts (12%)'],
              cta: 'See Sec+ labs →',
            },
          ].map(e => (
            <div key={e.name} style={{ background: '#161b22', border: `1px solid #21262d`, borderRadius: 16, padding: '2rem', borderTop: `3px solid ${e.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: `${e.color}20`, color: e.color, border: `1px solid ${e.color}40` }}>{e.badge}</div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{e.name}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {e.domains.map(d => (
                  <div key={d} style={{ display: 'flex', gap: 8, fontSize: '0.78rem', color: '#8b949e' }}>
                    <span style={{ color: e.color, flexShrink: 0 }}>✓</span>{d}
                  </div>
                ))}
              </div>
              <a href={e.href} style={{ fontSize: '0.82rem', fontWeight: 700, color: e.color, textDecoration: 'none' }}>{e.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section style={{ padding: '4rem 2rem', background: '#010409', borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 800 }}>Simple, honest pricing</h2>
            <p style={{ margin: 0, color: '#8b949e', fontSize: '0.88rem' }}>One-time payment. Lifetime access. No subscription.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
            {[
              { name: 'Free', price: '£0', sub: 'No account needed', color: GREEN, items: ['All beginner labs', 'Subnet calculator & VLSM', 'OSI, TCP, ARP, DNS labs', 'Wi-Fi security basics'], cta: 'Start free →', ctaHref: '/app', outline: true },
              { name: 'Labs Pro', price: '£5.99', sub: 'One-time · Lifetime', color: ACCENT, items: ['Everything free', 'VLAN & 802.1X labs', 'Phishing & ARP MITM', 'Firewall, PKI, Forensics', 'Wi-Fi spectrum analyser', 'All future Pro labs'], cta: 'Get Labs Pro →', ctaHref: '/app', outline: false },
              { name: 'Full Bundle', price: '£11.99', sub: 'One-time · Lifetime', color: PURPLE, items: ['Everything in Pro', 'CompTIA N+ mock exams', 'CompTIA Sec+ mock exams', 'Timed exam simulator', 'Objective tracking'], cta: 'Get Bundle →', ctaHref: '/app', outline: true },
            ].map(p => (
              <div key={p.name} style={{ background: '#161b22', border: `${p.outline ? '1px solid #21262d' : `2px solid ${p.color}`}`, borderRadius: 16, padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: p.color, marginBottom: 2 }}>{p.price}</div>
                <div style={{ fontSize: '0.72rem', color: '#6e7681', marginBottom: '1.25rem' }}>{p.sub}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {p.items.map(i => <div key={i} style={{ display: 'flex', gap: 7, fontSize: '0.76rem', color: '#8b949e' }}><span style={{ color: p.color }}>✓</span>{i}</div>)}
                </div>
                <a href={p.ctaHref} style={{ display: 'block', textAlign: 'center', padding: '0.65rem', borderRadius: 10, background: p.outline ? 'transparent' : `linear-gradient(135deg,${p.color},${p.color === ACCENT ? '#2563eb' : '#7c3aed'})`, border: p.outline ? `1px solid #30363d` : 'none', color: p.outline ? '#e6edf3' : '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem' }}>{p.cta}</a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <a href="/pricing" style={{ fontSize: '0.8rem', color: '#6e7681', textDecoration: 'none' }}>Full pricing details & FAQ →</a>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.5rem,4vw,2.25rem)', fontWeight: 900, letterSpacing: '-0.02em' }}>Ready to start learning?</h2>
          <p style={{ margin: '0 0 2rem', color: '#8b949e', lineHeight: 1.7, fontSize: '0.95rem' }}>Every free lab is available right now — no account, no credit card, no download. Open NetForge and start in 10 seconds.</p>
          <a href="/app" style={{ display: 'inline-block', padding: '1rem 2.5rem', background: `linear-gradient(135deg,${ACCENT},#2563eb)`, color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1.05rem', boxShadow: `0 6px 24px ${ACCENT}40` }}>
            Open NetForge Free →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
