import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';

type NodeId = 'client' | 'resolver' | 'root' | 'tld' | 'auth';
type StepType = 'query' | 'referral' | 'answer' | 'nxdomain' | 'cname';

interface DnsStep {
  from: NodeId; to: NodeId; type: StepType;
  label: string; title: string; detail: string; packet: string[];
}
interface Scenario { name: string; domain: string; qtype: string; steps: DnsStep[]; }

const NODES: Record<NodeId, { x:number; y:number; label:string; sub:string }> = {
  client:   { x:70,  y:155, label:'Client',             sub:'192.168.1.50' },
  resolver: { x:235, y:155, label:'Recursive Resolver', sub:'8.8.8.8 (Google)' },
  root:     { x:420, y:55,  label:'Root NS',             sub:'a.root-servers.net' },
  tld:      { x:575, y:155, label:'TLD NS (.com)',        sub:'a.gtld-servers.net' },
  auth:     { x:420, y:270, label:'Auth NS',              sub:'ns1.example.com' },
};

const SCENARIOS: Scenario[] = [
  {
    name: 'Fresh Recursive', domain: 'www.example.com', qtype: 'A',
    steps: [
      {
        from: 'client', to: 'resolver', type: 'query', label: 'A?',
        title: 'Client sends recursive query to resolver',
        detail: 'The client OS sends a recursive DNS query to its configured resolver over UDP port 53. The RD (Recursion Desired) flag is set to 1 — the resolver will do all the work and return a complete answer.',
        packet: [';; ->>HEADER<<- opcode: QUERY  status: NOERROR  id: 34281', ';; flags: rd;  QUERY: 1  ANSWER: 0', ';; QUESTION SECTION:', ';www.example.com.    IN    A'],
      },
      {
        from: 'resolver', to: 'root', type: 'query', label: 'A?',
        title: 'Resolver queries root NS — no cache entry',
        detail: 'The resolver has no cached answer. It queries one of the 13 root nameserver clusters (hardcoded in every resolver). Root servers know which servers delegate each TLD — they do not know individual domain IPs.',
        packet: [';; QUESTION SECTION:', ';www.example.com.    IN    A', ';; Querying: 198.41.0.4#53', ';;   (a.root-servers.net)'],
      },
      {
        from: 'root', to: 'resolver', type: 'referral', label: 'NS .com',
        title: 'Root returns .com TLD referral with glue records',
        detail: 'Root NS does not know www.example.com but returns a referral to the .com TLD nameservers with glue A records. Glue records embed the IP of the NS server inline so the resolver can reach it without a chicken-and-egg lookup.',
        packet: [';; AUTHORITY SECTION:', 'com.  172800  IN  NS  a.gtld-servers.net.', ';; ADDITIONAL SECTION (glue):', 'a.gtld-servers.net.  172800  IN  A  192.5.6.30'],
      },
      {
        from: 'resolver', to: 'tld', type: 'query', label: 'A?',
        title: 'Resolver queries .com TLD nameserver',
        detail: 'Using the glue record IP, the resolver contacts a .com TLD nameserver directly. The .com TLD registry holds delegations for every .com domain — it knows which authoritative NS is responsible for example.com.',
        packet: [';; QUESTION SECTION:', ';www.example.com.    IN    A', ';; Querying: 192.5.6.30#53', ';;   (a.gtld-servers.net)'],
      },
      {
        from: 'tld', to: 'resolver', type: 'referral', label: 'NS example.com',
        title: 'TLD returns example.com authoritative NS referral',
        detail: 'The .com TLD returns NS records for example.com with glue records pointing to the authoritative nameservers registered by the domain owner. The resolver now knows exactly who to ask for the final answer.',
        packet: [';; AUTHORITY SECTION:', 'example.com.  172800  IN  NS  a.iana-servers.net.', ';; ADDITIONAL SECTION (glue):', 'a.iana-servers.net.  3600  IN  A  199.43.135.53'],
      },
      {
        from: 'resolver', to: 'auth', type: 'query', label: 'A?',
        title: 'Resolver queries the authoritative NS directly',
        detail: 'The resolver contacts the authoritative nameserver for example.com — the only server with the definitive zone file entry. All previous steps were navigation. This is the authoritative source of truth.',
        packet: [';; QUESTION SECTION:', ';www.example.com.    IN    A', ';; Querying: 199.43.135.53#53', ';;   (a.iana-servers.net)'],
      },
      {
        from: 'auth', to: 'resolver', type: 'answer', label: '93.184.216.34',
        title: 'Auth NS returns the A record — AA flag set',
        detail: 'The authoritative NS returns the A record with the AA (Authoritative Answer) flag set to 1. The TTL of 3600 tells the resolver it can cache this answer for up to 1 hour before re-querying.',
        packet: [';; flags: qr aa rd;  QUERY: 1  ANSWER: 1', ';; ANSWER SECTION:', 'www.example.com.  3600  IN  A  93.184.216.34'],
      },
      {
        from: 'resolver', to: 'client', type: 'answer', label: '93.184.216.34',
        title: 'Resolver caches result and delivers to client',
        detail: 'The resolver caches the A record for 3600s, then forwards the answer with the RA (Recursion Available) flag set. Total cold-query round-trip: 80–150ms across four server tiers.',
        packet: [';; flags: qr rd ra;  QUERY: 1  ANSWER: 1', ';; ANSWER SECTION:', 'www.example.com.  3600  IN  A  93.184.216.34', '', ';; Query time: 112 msec', ';; SERVER: 8.8.8.8#53'],
      },
    ],
  },
  {
    name: 'Cache Hit', domain: 'www.example.com', qtype: 'A',
    steps: [
      {
        from: 'client', to: 'resolver', type: 'query', label: 'A?',
        title: 'Client sends the same query — resolver checks cache',
        detail: 'The client sends the identical query it sent an hour ago. The resolver checks its local cache before initiating any external lookups. Caching is the mechanism that lets DNS scale to the entire internet without root servers collapsing under load.',
        packet: [';; QUESTION SECTION:', ';www.example.com.    IN    A'],
      },
      {
        from: 'resolver', to: 'client', type: 'answer', label: '93.184.216.34 (cached)',
        title: 'Cache HIT — instant response, zero external queries',
        detail: 'The resolver found www.example.com in cache with 2,688 seconds remaining on the TTL. No root, TLD or auth queries needed. Response time under 1ms vs ~120ms cold. This is why TTL tuning matters — operators balance freshness (short TTL) against resolver load (long TTL).',
        packet: [';; flags: qr rd ra;  QUERY: 1  ANSWER: 1', ';; ANSWER SECTION:', 'www.example.com.  2688  IN  A  93.184.216.34', '', ';; Query time: 0 msec', ';; SERVER: 8.8.8.8#53', ';; (CACHE HIT — no external queries made)'],
      },
    ],
  },
  {
    name: 'NXDOMAIN', domain: 'www.ghost-xyz999.com', qtype: 'A',
    steps: [
      {
        from: 'client', to: 'resolver', type: 'query', label: 'A?',
        title: 'Client queries a domain that was never registered',
        detail: 'The resolver must still perform full recursion to confirm non-existence — it cannot assume a domain does not exist without checking the authoritative source.',
        packet: [';; QUESTION SECTION:', ';www.ghost-xyz999.com.    IN    A'],
      },
      {
        from: 'resolver', to: 'root', type: 'query', label: 'A?',
        title: 'Resolver queries root — standard start',
        detail: 'No cache entry. Resolver starts at root as normal. The .com TLD exists, so root will provide a referral to the .com TLD NS.',
        packet: [';; QUESTION SECTION:', ';www.ghost-xyz999.com.    IN    A'],
      },
      {
        from: 'root', to: 'resolver', type: 'referral', label: 'NS .com',
        title: 'Root confirms .com exists — referral returned',
        detail: 'Root returns the .com TLD nameserver referral. The .com TLD holds a complete registry of all registered .com domains and can answer definitively about ghost-xyz999.com.',
        packet: [';; AUTHORITY SECTION:', 'com.  172800  IN  NS  a.gtld-servers.net.'],
      },
      {
        from: 'resolver', to: 'tld', type: 'query', label: 'A?',
        title: 'Resolver queries .com TLD for the unregistered domain',
        detail: 'The .com registry holds the complete list of all delegated .com domains. If ghost-xyz999.com has no entry, the TLD NS returns NXDOMAIN directly — no auth NS lookup is needed.',
        packet: [';; QUESTION SECTION:', ';www.ghost-xyz999.com.    IN    A'],
      },
      {
        from: 'tld', to: 'resolver', type: 'nxdomain', label: 'NXDOMAIN',
        title: 'TLD returns NXDOMAIN — domain was never registered',
        detail: 'ghost-xyz999.com has no delegation record in the .com zone. The TLD NS returns NXDOMAIN with a SOA record. The SOA minimum TTL field (900s) is the negative cache TTL — how long resolvers should cache this non-existence to prevent repeated storms of queries.',
        packet: [';; ->>HEADER<<- status: NXDOMAIN  id: 19823', ';; flags: qr rd ra;  QUERY: 1  ANSWER: 0', ';; AUTHORITY SECTION:', 'com.  900  IN  SOA  a.gtld-servers.net.', ';;          nstld.verisign-grs.com. 1750049666 1800 900 604800 900'],
      },
      {
        from: 'resolver', to: 'client', type: 'nxdomain', label: 'NXDOMAIN',
        title: 'Resolver delivers NXDOMAIN — cached for 900s',
        detail: 'The resolver caches the negative response for 900s and returns NXDOMAIN to the client. The browser shows DNS_PROBE_FINISHED_NXDOMAIN or similar. Negative caching is critical — without it, queries for typo domains would continually hit root servers.',
        packet: [';; status: NXDOMAIN', ';; ANSWER: 0 (domain does not exist)', ';; Query time: 78 msec', ';; Negative TTL cached: 900s'],
      },
    ],
  },
  {
    name: 'CNAME Chain', domain: 'www.shop.example.com', qtype: 'A',
    steps: [
      {
        from: 'client', to: 'resolver', type: 'query', label: 'A?',
        title: 'Client queries — unaware it will encounter a CNAME',
        detail: 'The client requests an A record and does not know that www.shop.example.com is a CNAME alias. It will only discover this when the auth NS responds with a CNAME record instead of an A record.',
        packet: [';; QUESTION SECTION:', ';www.shop.example.com.    IN    A'],
      },
      {
        from: 'resolver', to: 'root', type: 'query', label: 'A?',
        title: 'Standard recursive start at root',
        detail: 'No cache entry. Resolver initiates standard recursion from root to find example.com authoritative NS.',
        packet: [';; QUESTION SECTION:', ';www.shop.example.com.    IN    A'],
      },
      {
        from: 'root', to: 'resolver', type: 'referral', label: 'NS .com',
        title: 'Root returns .com TLD referral',
        detail: 'Root NS returns .com TLD nameserver referral with glue records.',
        packet: [';; AUTHORITY SECTION:', 'com.  172800  IN  NS  a.gtld-servers.net.'],
      },
      {
        from: 'resolver', to: 'tld', type: 'query', label: 'A?',
        title: 'Resolver queries .com TLD for example.com',
        detail: 'The .com TLD knows example.com is registered and returns a referral to its authoritative NS.',
        packet: [';; QUESTION SECTION:', ';www.shop.example.com.    IN    A'],
      },
      {
        from: 'tld', to: 'resolver', type: 'referral', label: 'NS example.com',
        title: 'TLD returns example.com auth NS referral',
        detail: 'TLD returns NS records for example.com with glue. Resolver contacts the auth NS directly.',
        packet: [';; AUTHORITY SECTION:', 'example.com.  172800  IN  NS  ns1.example.com.'],
      },
      {
        from: 'resolver', to: 'auth', type: 'query', label: 'A?',
        title: 'Resolver queries auth NS expecting an A record',
        detail: 'The resolver contacts the authoritative NS for example.com and requests an A record for www.shop.example.com.',
        packet: [';; QUESTION SECTION:', ';www.shop.example.com.    IN    A'],
      },
      {
        from: 'auth', to: 'resolver', type: 'cname', label: 'CNAME',
        title: 'Auth returns CNAME — resolver must follow the chain',
        detail: 'The auth NS returns a CNAME (Canonical Name) record — www.shop.example.com is an alias for shops.myshopify.com. RFC 1034 requires resolvers to follow CNAME chains automatically until an A record is found. The resolver must now restart the lookup for the target.',
        packet: [';; ANSWER SECTION:', 'www.shop.example.com.  3600  IN  CNAME  shops.myshopify.com.', ';; (no A record — resolver must follow the alias)'],
      },
      {
        from: 'resolver', to: 'auth', type: 'query', label: 'A? (CNAME target)',
        title: 'Resolver re-queries for the CNAME target domain',
        detail: 'The resolver re-initiates a full lookup for shops.myshopify.com — root, .com TLD, and myshopify.com auth NS steps are abbreviated here. It reaches ns1.myshopify.com, a completely separate auth NS from a different operator.',
        packet: [';; QUESTION SECTION:', ';shops.myshopify.com.    IN    A', ';; (root + .com TLD referrals abbreviated)', ';; Querying: ns1.myshopify.com#53'],
      },
      {
        from: 'auth', to: 'resolver', type: 'answer', label: '23.227.38.68',
        title: 'Auth NS returns A record for the CNAME target',
        detail: 'The authoritative NS for myshopify.com returns the actual IP. The short TTL of 180s is deliberate — CDN operators use low TTLs so they can rapidly shift traffic between edge PoPs without waiting for cache expiry across the internet.',
        packet: [';; ANSWER SECTION:', 'shops.myshopify.com.   180   IN  A  23.227.38.68'],
      },
      {
        from: 'resolver', to: 'client', type: 'answer', label: 'CNAME + A',
        title: 'Resolver returns full CNAME chain to client',
        detail: 'The resolver delivers both records. The client uses 23.227.38.68 directly. If the A TTL (180s) expires while the CNAME TTL (3600s) is still valid, only the A record needs re-fetching — not the entire chain.',
        packet: [';; ANSWER SECTION:', 'www.shop.example.com.  3600  IN  CNAME  shops.myshopify.com.', 'shops.myshopify.com.   180   IN  A      23.227.38.68', '', ';; Query time: 245 msec (2 auth lookups for CNAME chain)'],
      },
    ],
  },
];

function nEdge(from: {x:number;y:number}, to: {x:number;y:number}): {x:number;y:number} {
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ndx = dx / len, ndy = dy / len;
  const t = Math.min(ndx !== 0 ? 62 / Math.abs(ndx) : Infinity, ndy !== 0 ? 24 / Math.abs(ndy) : Infinity);
  return { x: from.x + ndx * t, y: from.y + ndy * t };
}

function easeInOut(t: number): number { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

interface DnsLabProps { isDarkMode?: boolean; }

export const DnsLab: React.FC<DnsLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [scenario,  setScenario]  = useState(0);
  const [step,      setStep]      = useState(0);
  const [dotT,      setDotT]      = useState(0);
  const [autoPlay,  setAutoPlay]  = useState(false);
  const rafRef = useRef<number>();
  const t0Ref  = useRef<number>(0);

  const sc    = SCENARIOS[scenario];
  const cur   = sc.steps[step];
  const fromN = NODES[cur.from];
  const toN   = NODES[cur.to];

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDotT(0);
    t0Ref.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0Ref.current) / 750, 1);
      setDotT(t);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [step, scenario]);

  useEffect(() => {
    if (!autoPlay || dotT < 1) return;
    const id = setTimeout(() => {
      if (step < sc.steps.length - 1) setStep(s => s + 1);
      else setAutoPlay(false);
    }, 500);
    return () => clearTimeout(id);
  }, [autoPlay, dotT, step, sc.steps.length]);

  const changeScenario = (i: number) => { setScenario(i); setStep(0); setAutoPlay(false); };
  const prevStep = () => { setStep(s => Math.max(0, s - 1)); setAutoPlay(false); };
  const nextStep = () => { setStep(s => Math.min(sc.steps.length - 1, s + 1)); };

  const typeColor = (t: StepType) => ({ query: T.accent, referral: T.warning, answer: T.success, nxdomain: T.danger, cname: '#a855f7' }[t]);
  const typeBadge = (t: StepType) => ({ query: 'QUERY', referral: 'REFERRAL', answer: 'ANSWER', nxdomain: 'NXDOMAIN', cname: 'CNAME' }[t]);

  const et   = easeInOut(dotT);
  const se   = nEdge(fromN, toN);
  const ee   = nEdge(toN, fromN);
  const dotX = lerp(se.x, ee.x, et);
  const dotY = lerp(se.y, ee.y, et);
  const midX = lerp(se.x, ee.x, 0.5);
  const midY = lerp(se.y, ee.y, 0.5);
  const ac   = typeColor(cur.type);

  const CONNS: [NodeId, NodeId][] = [['client','resolver'],['resolver','root'],['resolver','tld'],['resolver','auth']];
  const isActive = (a: NodeId, b: NodeId) => (cur.from === a && cur.to === b) || (cur.from === b && cur.to === a);

  return (
    <div style={{ padding:'2rem', backgroundColor:T.cardBg, borderRadius:'12px', border:T.border, color:T.textPrimary, fontFamily:'system-ui,sans-serif' }}>

      <div style={{ marginBottom:'1.5rem', paddingBottom:'1rem', borderBottom:T.border }}>
        <h3 style={{ fontSize:'1.25rem', fontWeight:700, margin:'0 0 4px' }}>DNS Resolution Visualiser</h3>
        <p style={{ color:T.textSecondary, margin:0, fontSize:'0.875rem' }}>Step through the recursive query chain from client to authoritative nameserver and back.</p>
      </div>

      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'1.25rem', alignItems:'center' }}>
        {SCENARIOS.map((s, i) => (
          <button key={i} onClick={() => changeScenario(i)}
            style={{ padding:'6px 14px', borderRadius:'6px', border:`1px solid ${scenario===i?T.accent:T.borderColor}`, backgroundColor:scenario===i?T.accentSubtle:T.panelBg, color:scenario===i?T.accent:T.textSecondary, fontWeight:600, fontSize:'0.78rem', cursor:'pointer' }}>
            {s.name}
          </button>
        ))}
        <div style={{ marginLeft:'auto', fontFamily:'monospace', fontSize:'0.8rem', color:T.textMuted }}>
          <span style={{ color:T.textSecondary, fontWeight:600 }}>{sc.qtype}? </span>
          <span style={{ color:T.accent, fontWeight:700 }}>{sc.domain}</span>
        </div>
      </div>

      <div style={{ backgroundColor:T.insetBg, borderRadius:'10px', border:T.border, overflow:'hidden', marginBottom:'1rem' }}>
        <svg viewBox="0 0 660 325" style={{ width:'100%', display:'block' }}>
          <defs>
            {(['query','referral','answer','nxdomain','cname'] as StepType[]).map(t => (
              <marker key={t} id={`a-${t}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M 0 1 L 7 4 L 0 7 z" fill={typeColor(t)} />
              </marker>
            ))}
          </defs>

          {CONNS.map(([a, b]) => {
            const s2 = nEdge(NODES[a], NODES[b]);
            const e2 = nEdge(NODES[b], NODES[a]);
            const act = isActive(a, b);
            return (
              <line key={`${a}${b}`} x1={s2.x} y1={s2.y} x2={e2.x} y2={e2.y}
                stroke={act ? ac : T.borderColor} strokeWidth={act ? 2 : 1}
                strokeDasharray={act ? 'none' : '4 3'} opacity={act ? 0.65 : 0.3}
                markerEnd={act ? `url(#a-${cur.type})` : 'none'} />
            );
          })}

          {dotT > 0 && dotT < 1 && (
            <>
              <circle cx={dotX} cy={dotY} r={10} fill={ac} opacity={0.12} />
              <circle cx={dotX} cy={dotY} r={5}  fill={ac} opacity={0.38} />
              <circle cx={dotX} cy={dotY} r={3}  fill={ac} />
            </>
          )}

          {(Object.keys(NODES) as NodeId[]).map(id => {
            const n = NODES[id];
            const active = cur.from === id || (cur.to === id && dotT > 0.85);
            const col = active ? ac : T.borderColor;
            return (
              <g key={id}>
                <rect x={n.x-62} y={n.y-24} width={124} height={48} rx={8}
                  fill={active ? `${ac}15` : (isDarkMode ? '#161b22' : '#ffffff')}
                  stroke={col} strokeWidth={active ? 2 : 1} />
                <text x={n.x} y={n.y-5} textAnchor="middle" fill={active ? ac : T.textPrimary}
                  fontSize={11} fontWeight="700" fontFamily="system-ui,sans-serif">{n.label}</text>
                <text x={n.x} y={n.y+11} textAnchor="middle" fill={T.textMuted}
                  fontSize={8.5} fontFamily="monospace">{n.sub}</text>
              </g>
            );
          })}

          <rect x={midX-28} y={midY-10} width={56} height={18} rx={4}
            fill={isDarkMode ? '#161b22' : '#ffffff'} stroke={ac} strokeWidth={1} opacity={0.92} />
          <text x={midX} y={midY+4} textAnchor="middle" fill={ac} fontSize={8.5} fontWeight="700" fontFamily="monospace">{cur.label}</text>

          <text x={12} y={316} fill={T.textMuted} fontSize={9} fontFamily="monospace">Step {step+1}/{sc.steps.length}</text>
        </svg>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem', flexWrap:'wrap' }}>
        <button onClick={prevStep} disabled={step === 0}
          style={{ padding:'6px 14px', borderRadius:'6px', border:T.border, backgroundColor:T.panelBg, color:T.textPrimary, fontWeight:600, fontSize:'0.8rem', cursor:step===0?'not-allowed':'pointer', opacity:step===0?0.4:1 }}>
          Prev
        </button>
        <button onClick={() => { if (step === sc.steps.length - 1) { setStep(0); setAutoPlay(true); } else setAutoPlay(a => !a); }}
          style={{ padding:'6px 18px', borderRadius:'6px', border:'none', backgroundColor:autoPlay?T.warning:T.accent, color:'#fff', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}>
          {autoPlay ? 'Pause' : step === sc.steps.length - 1 ? 'Replay' : 'Play'}
        </button>
        <button onClick={nextStep} disabled={step === sc.steps.length - 1}
          style={{ padding:'6px 14px', borderRadius:'6px', border:T.border, backgroundColor:T.panelBg, color:T.textPrimary, fontWeight:600, fontSize:'0.8rem', cursor:step===sc.steps.length-1?'not-allowed':'pointer', opacity:step===sc.steps.length-1?0.4:1 }}>
          Next
        </button>
        <div style={{ display:'flex', gap:4, marginLeft:'auto', flexWrap:'wrap' }}>
          {sc.steps.map((_, i) => (
            <button key={i} onClick={() => { setStep(i); setAutoPlay(false); }}
              style={{ width:10, height:10, borderRadius:'50%', border:'none', cursor:'pointer', padding:0,
                backgroundColor: i===step ? ac : i<step ? `${ac}55` : T.borderColor, transition:'background-color 0.15s' }} />
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'1rem' }}>
        <div style={{ backgroundColor:T.panelBg, borderRadius:'8px', padding:'1.1rem', border:T.border }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'0.65rem', fontWeight:800, color:ac, backgroundColor:`${ac}18`, padding:'2px 8px', borderRadius:'10px', letterSpacing:'0.06em' }}>
              {typeBadge(cur.type)}
            </span>
            <span style={{ fontSize:'0.85rem', fontWeight:700, color:T.textPrimary }}>{cur.title}</span>
          </div>
          <p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.65 }}>{cur.detail}</p>
        </div>
        <div style={{ backgroundColor:T.termBg, borderRadius:'8px', padding:'1rem', border:`1px solid ${T.termBorder}` }}>
          <div style={{ fontSize:'0.65rem', fontFamily:'monospace', color:T.termMuted, fontWeight:700, borderBottom:`1px solid ${T.termBorder}`, paddingBottom:'5px', marginBottom:'8px', letterSpacing:'0.06em' }}>
            DNS PACKET — dig-style output
          </div>
          <div style={{ fontFamily:'monospace', fontSize:'0.76rem', lineHeight:1.7 }}>
            {cur.packet.map((line, i) => {
              const col = line.startsWith(';;') ? T.termMuted
                : line.includes('IN  A ') ? T.success
                : line.includes('CNAME') ? '#a855f7'
                : line.includes(' NS ') ? T.warning
                : (line.includes('NXDOMAIN') || line.includes('SOA')) ? T.danger
                : T.termText;
              return <div key={i} style={{ color: col }}>{line || ' '}</div>;
            })}
          </div>
        </div>
      </div>

      <div style={{ borderTop:T.border, paddingTop:'1.1rem', marginTop:'1.25rem', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1rem' }}>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.accent }}>TTL and caching</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>Every DNS record carries a TTL in seconds. A TTL of 300 means changes propagate globally in ~5 minutes. A TTL of 86400 means up to 24 hours. Operators lower TTL before migrations, then raise it again. Negative TTL (from SOA) controls how long NXDOMAIN responses are cached.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.success }}>Root server anycast</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>The 13 root nameserver addresses (A–M root-servers.net) are not 13 physical machines. They use IP anycast so thousands of nodes globally share each address. Querying 198.41.0.4 reaches the nearest a-root node — which might be London, Tokyo, or Chicago depending on your BGP path.</p>
        </div>
        <div>
          <h4 style={{ margin:'0 0 5px', fontSize:'0.875rem', fontWeight:700, color:T.warning }}>DNSSEC chain of trust</h4>
          <p style={{ margin:0, color:T.textSecondary, fontSize:'0.8rem', lineHeight:1.6 }}>Standard DNS has no origin authentication — a resolver cannot verify a response was not tampered with (DNS cache poisoning). DNSSEC adds cryptographic signatures to zone records, creating a chain of trust from root to TLD to auth NS. DANE extends this to TLS certificate validation.</p>
        </div>
      </div>
    </div>
  );
};

export default DnsLab;
