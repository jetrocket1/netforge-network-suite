import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

type NodeId   = 'client' | 'resolver' | 'root' | 'tld' | 'auth';
type StepType = 'query' | 'referral' | 'answer' | 'nxdomain' | 'cname';

interface DnsStep {
  from: NodeId; to: NodeId; type: StepType;
  label: string; title: string; detail: string; packet: string[];
}
interface Scenario { name: string; domain: string; qtype: string; steps: DnsStep[]; }

const NODES: Record<NodeId, { x:number; y:number; label:string; sub:string; icon:string; color:string }> = {
  client:   { x:92,  y:155, label:'Client',             sub:'192.168.1.50',       icon:'💻', color:'#4493f8' },
  resolver: { x:280, y:155, label:'Recursive Resolver', sub:'8.8.8.8',            icon:'🔄', color:'#a855f7' },
  root:     { x:520, y:62,  label:'Root NS',            sub:'a.root-servers.net', icon:'🌍', color:'#3fb950' },
  tld:      { x:640, y:155, label:'TLD NS (.com)',       sub:'a.gtld-servers.net', icon:'📋', color:'#d29922' },
  auth:     { x:520, y:248, label:'Auth NS',             sub:'ns1.example.com',    icon:'📁', color:'#f78166' },
};

const SCENARIOS: Scenario[] = [
  {
    name: 'Fresh Recursive', domain: 'www.example.com', qtype: 'A',
    steps: [
      { from:'client', to:'resolver', type:'query', label:'A?',
        title:'Client sends recursive query to resolver',
        detail:'The client OS sends a recursive DNS query to its configured resolver over UDP port 53. The RD (Recursion Desired) flag is set to 1 — the resolver will do all the work and return a complete answer.',
        packet:[';; ->>HEADER<<- opcode: QUERY  status: NOERROR  id: 34281',';; flags: rd;  QUERY: 1  ANSWER: 0',';; QUESTION SECTION:',';www.example.com.    IN    A'] },
      { from:'resolver', to:'root', type:'query', label:'A?',
        title:'Resolver queries root NS — no cache entry',
        detail:'The resolver has no cached answer. It queries one of the 13 root nameserver clusters (hardcoded in every resolver). Root servers know which servers delegate each TLD — they do not know individual domain IPs.',
        packet:[';; QUESTION SECTION:',';www.example.com.    IN    A',';; Querying: 198.41.0.4#53',';;   (a.root-servers.net)'] },
      { from:'root', to:'resolver', type:'referral', label:'NS .com',
        title:'Root returns .com TLD referral with glue records',
        detail:'Root NS does not know www.example.com but returns a referral to the .com TLD nameservers with glue A records. Glue records embed the IP of the NS server inline so the resolver can reach it without a chicken-and-egg lookup.',
        packet:[';; AUTHORITY SECTION:','com.  172800  IN  NS  a.gtld-servers.net.',';; ADDITIONAL SECTION (glue):','a.gtld-servers.net.  172800  IN  A  192.5.6.30'] },
      { from:'resolver', to:'tld', type:'query', label:'A?',
        title:'Resolver queries .com TLD nameserver',
        detail:'Using the glue record IP, the resolver contacts a .com TLD nameserver directly. The .com TLD registry holds delegations for every .com domain — it knows which authoritative NS is responsible for example.com.',
        packet:[';; QUESTION SECTION:',';www.example.com.    IN    A',';; Querying: 192.5.6.30#53',';;   (a.gtld-servers.net)'] },
      { from:'tld', to:'resolver', type:'referral', label:'NS example.com',
        title:'TLD returns example.com authoritative NS referral',
        detail:'The .com TLD returns NS records for example.com with glue records pointing to the authoritative nameservers registered by the domain owner. The resolver now knows exactly who to ask for the final answer.',
        packet:[';; AUTHORITY SECTION:','example.com.  172800  IN  NS  a.iana-servers.net.',';; ADDITIONAL SECTION (glue):','a.iana-servers.net.  3600  IN  A  199.43.135.53'] },
      { from:'resolver', to:'auth', type:'query', label:'A?',
        title:'Resolver queries the authoritative NS directly',
        detail:'The resolver contacts the authoritative nameserver for example.com — the only server with the definitive zone file entry. All previous steps were navigation. This is the authoritative source of truth.',
        packet:[';; QUESTION SECTION:',';www.example.com.    IN    A',';; Querying: 199.43.135.53#53',';;   (a.iana-servers.net)'] },
      { from:'auth', to:'resolver', type:'answer', label:'93.184.216.34',
        title:'Auth NS returns the A record — AA flag set',
        detail:'The authoritative NS returns the A record with the AA (Authoritative Answer) flag set to 1. The TTL of 3600 tells the resolver it can cache this answer for up to 1 hour before re-querying.',
        packet:[';; flags: qr aa rd;  QUERY: 1  ANSWER: 1',';; ANSWER SECTION:','www.example.com.  3600  IN  A  93.184.216.34'] },
      { from:'resolver', to:'client', type:'answer', label:'93.184.216.34',
        title:'Resolver caches result and delivers to client',
        detail:'The resolver caches the A record for 3600s, then forwards the answer with the RA (Recursion Available) flag set. Total cold-query round-trip: 80–150ms across four server tiers.',
        packet:[';; flags: qr rd ra;  QUERY: 1  ANSWER: 1',';; ANSWER SECTION:','www.example.com.  3600  IN  A  93.184.216.34','',';; Query time: 112 msec',';; SERVER: 8.8.8.8#53'] },
    ],
  },
  {
    name: 'Cache Hit', domain: 'www.example.com', qtype: 'A',
    steps: [
      { from:'client', to:'resolver', type:'query', label:'A?',
        title:'Client sends the same query — resolver checks cache',
        detail:'The client sends the identical query it sent an hour ago. The resolver checks its local cache before initiating any external lookups. Caching is the mechanism that lets DNS scale to the entire internet without root servers collapsing under load.',
        packet:[';; QUESTION SECTION:',';www.example.com.    IN    A'] },
      { from:'resolver', to:'client', type:'answer', label:'93.184.216.34 (cached)',
        title:'Cache HIT — instant response, zero external queries',
        detail:'The resolver found www.example.com in cache with 2,688 seconds remaining on the TTL. No root, TLD or auth queries needed. Response time under 1ms vs ~120ms cold. This is why TTL tuning matters — operators balance freshness (short TTL) against resolver load (long TTL).',
        packet:[';; flags: qr rd ra;  QUERY: 1  ANSWER: 1',';; ANSWER SECTION:','www.example.com.  2688  IN  A  93.184.216.34','',';; Query time: 0 msec',';; SERVER: 8.8.8.8#53',';; (CACHE HIT — no external queries made)'] },
    ],
  },
  {
    name: 'NXDOMAIN', domain: 'www.ghost-xyz999.com', qtype: 'A',
    steps: [
      { from:'client', to:'resolver', type:'query', label:'A?',
        title:'Client queries a domain that was never registered',
        detail:'The resolver must still perform full recursion to confirm non-existence — it cannot assume a domain does not exist without checking the authoritative source.',
        packet:[';; QUESTION SECTION:',';www.ghost-xyz999.com.    IN    A'] },
      { from:'resolver', to:'root', type:'query', label:'A?',
        title:'Resolver queries root — standard start',
        detail:'No cache entry. Resolver starts at root as normal. The .com TLD exists, so root will provide a referral to the .com TLD NS.',
        packet:[';; QUESTION SECTION:',';www.ghost-xyz999.com.    IN    A'] },
      { from:'root', to:'resolver', type:'referral', label:'NS .com',
        title:'Root confirms .com exists — referral returned',
        detail:'Root returns the .com TLD nameserver referral. The .com TLD holds a complete registry of all registered .com domains and can answer definitively about ghost-xyz999.com.',
        packet:[';; AUTHORITY SECTION:','com.  172800  IN  NS  a.gtld-servers.net.'] },
      { from:'resolver', to:'tld', type:'query', label:'A?',
        title:'Resolver queries .com TLD for the unregistered domain',
        detail:'The .com registry holds the complete list of all delegated .com domains. If ghost-xyz999.com has no entry, the TLD NS returns NXDOMAIN directly — no auth NS lookup is needed.',
        packet:[';; QUESTION SECTION:',';www.ghost-xyz999.com.    IN    A'] },
      { from:'tld', to:'resolver', type:'nxdomain', label:'NXDOMAIN',
        title:'TLD returns NXDOMAIN — domain was never registered',
        detail:'ghost-xyz999.com has no delegation record in the .com zone. The TLD NS returns NXDOMAIN with a SOA record. The SOA minimum TTL field (900s) is the negative cache TTL — how long resolvers should cache this non-existence.',
        packet:[';; ->>HEADER<<- status: NXDOMAIN  id: 19823',';; flags: qr rd ra;  QUERY: 1  ANSWER: 0',';; AUTHORITY SECTION:','com.  900  IN  SOA  a.gtld-servers.net.',';;          nstld.verisign-grs.com. 1750049666 1800 900 604800 900'] },
      { from:'resolver', to:'client', type:'nxdomain', label:'NXDOMAIN',
        title:'Resolver delivers NXDOMAIN — cached for 900s',
        detail:'The resolver caches the negative response for 900s and returns NXDOMAIN to the client. The browser shows DNS_PROBE_FINISHED_NXDOMAIN or similar. Negative caching is critical — without it, queries for typo domains would continually hit root servers.',
        packet:[';; status: NXDOMAIN',';; ANSWER: 0 (domain does not exist)',';; Query time: 78 msec',';; Negative TTL cached: 900s'] },
    ],
  },
  {
    name: 'CNAME Chain', domain: 'www.shop.example.com', qtype: 'A',
    steps: [
      { from:'client', to:'resolver', type:'query', label:'A?',
        title:'Client queries — unaware it will encounter a CNAME',
        detail:'The client requests an A record and does not know that www.shop.example.com is a CNAME alias. It will only discover this when the auth NS responds with a CNAME record instead of an A record.',
        packet:[';; QUESTION SECTION:',';www.shop.example.com.    IN    A'] },
      { from:'resolver', to:'root', type:'query', label:'A?',
        title:'Standard recursive start at root',
        detail:'No cache entry. Resolver initiates standard recursion from root to find example.com authoritative NS.',
        packet:[';; QUESTION SECTION:',';www.shop.example.com.    IN    A'] },
      { from:'root', to:'resolver', type:'referral', label:'NS .com',
        title:'Root returns .com TLD referral',
        detail:'Root NS returns .com TLD nameserver referral with glue records.',
        packet:[';; AUTHORITY SECTION:','com.  172800  IN  NS  a.gtld-servers.net.'] },
      { from:'resolver', to:'tld', type:'query', label:'A?',
        title:'Resolver queries .com TLD for example.com',
        detail:'The .com TLD knows example.com is registered and returns a referral to its authoritative NS.',
        packet:[';; QUESTION SECTION:',';www.shop.example.com.    IN    A'] },
      { from:'tld', to:'resolver', type:'referral', label:'NS example.com',
        title:'TLD returns example.com auth NS referral',
        detail:'TLD returns NS records for example.com with glue. Resolver contacts the auth NS directly.',
        packet:[';; AUTHORITY SECTION:','example.com.  172800  IN  NS  ns1.example.com.'] },
      { from:'resolver', to:'auth', type:'query', label:'A?',
        title:'Resolver queries auth NS expecting an A record',
        detail:'The resolver contacts the authoritative NS for example.com and requests an A record for www.shop.example.com.',
        packet:[';; QUESTION SECTION:',';www.shop.example.com.    IN    A'] },
      { from:'auth', to:'resolver', type:'cname', label:'CNAME',
        title:'Auth returns CNAME — resolver must follow the chain',
        detail:'The auth NS returns a CNAME (Canonical Name) record — www.shop.example.com is an alias for shops.myshopify.com. RFC 1034 requires resolvers to follow CNAME chains automatically until an A record is found.',
        packet:[';; ANSWER SECTION:','www.shop.example.com.  3600  IN  CNAME  shops.myshopify.com.',';; (no A record — resolver must follow the alias)'] },
      { from:'resolver', to:'auth', type:'query', label:'A? (CNAME target)',
        title:'Resolver re-queries for the CNAME target domain',
        detail:'The resolver re-initiates a full lookup for shops.myshopify.com — root, .com TLD, and myshopify.com auth NS steps are abbreviated here. It reaches ns1.myshopify.com, a completely separate auth NS.',
        packet:[';; QUESTION SECTION:',';shops.myshopify.com.    IN    A',';; (root + .com TLD referrals abbreviated)',';; Querying: ns1.myshopify.com#53'] },
      { from:'auth', to:'resolver', type:'answer', label:'23.227.38.68',
        title:'Auth NS returns A record for the CNAME target',
        detail:'The authoritative NS for myshopify.com returns the actual IP. The short TTL of 180s is deliberate — CDN operators use low TTLs so they can rapidly shift traffic between edge PoPs without waiting for cache expiry.',
        packet:[';; ANSWER SECTION:','shops.myshopify.com.   180   IN  A  23.227.38.68'] },
      { from:'resolver', to:'client', type:'answer', label:'CNAME + A',
        title:'Resolver returns full CNAME chain to client',
        detail:'The resolver delivers both records. The client uses 23.227.38.68 directly. If the A TTL (180s) expires while the CNAME TTL (3600s) is still valid, only the A record needs re-fetching — not the entire chain.',
        packet:[';; ANSWER SECTION:','www.shop.example.com.  3600  IN  CNAME  shops.myshopify.com.','shops.myshopify.com.   180   IN  A      23.227.38.68','',';; Query time: 245 msec (2 auth lookups for CNAME chain)'] },
    ],
  },
];

const DNS_EDU: EduCard[] = [
  { type:'exam', title:'TTL, Caching & Negative TTL',
    body:'Every DNS record carries a TTL in seconds. A TTL of 300 means changes propagate globally in ~5 minutes. A TTL of 86400 means up to 24 hours. Operators lower TTL before migrations then raise it after. Negative TTL (from the SOA minimum field) controls how long NXDOMAIN responses are cached — without it, typo-domain queries would flood root servers on every attempt.' },
  { type:'realworld', title:'Root Servers Use IP Anycast — 13 Addresses, Thousands of Nodes',
    body:'The 13 root nameserver addresses (A–M root-servers.net) are not 13 physical machines. They use IP anycast so thousands of nodes globally share each address. Querying 198.41.0.4 reaches the nearest a-root node — which might be London, Tokyo, or Chicago depending on your BGP path. There are over 1,500 root server instances worldwide.' },
  { type:'exam', title:'DNSSEC Chain of Trust',
    body:'Standard DNS has no origin authentication — a resolver cannot verify a response was not tampered with (DNS cache poisoning / Kaminsky attack). DNSSEC adds cryptographic signatures to zone records, creating a chain of trust from root → TLD → auth NS. Each zone signs its records with a ZSK and publishes a DS record in the parent zone. DANE extends this to TLS certificate validation.' },
  { type:'gotcha', title:'CNAME Cannot Coexist with Other Records at the Zone Apex',
    body:'You cannot put a CNAME on the root of a domain (@ / example.com). RFC 1034 forbids it because the apex must have NS and SOA records — and CNAME excludes all other record types. This is why you can\'t CNAME example.com to your CDN. Workarounds: CNAME flattening (Cloudflare ALIAS record), or point the apex A record to the CDN IP directly.' },
  { type:'config', title:'dig Command Reference',
    body:'Use dig to manually perform DNS queries and inspect raw responses.',
    code:`# Basic A record lookup
dig www.example.com A

# Query a specific resolver (bypass system resolver)
dig @8.8.8.8 www.example.com A

# Full recursion trace (shows each step)
dig +trace www.example.com A

# Reverse DNS (PTR record)
dig -x 93.184.216.34

# Check DNSSEC signatures
dig +dnssec www.example.com A

# Short output only (just the answer)
dig +short www.example.com A

# Check NS records for a domain
dig example.com NS

# SOA record (shows negative TTL)
dig example.com SOA` },
];

// halfW=70, halfH=27 to match 140×54 node cards
function nEdge(from:{x:number;y:number}, to:{x:number;y:number}) {
  const dx=to.x-from.x, dy=to.y-from.y;
  const len=Math.sqrt(dx*dx+dy*dy)||1;
  const ndx=dx/len, ndy=dy/len;
  const t=Math.min(ndx!==0?70/Math.abs(ndx):Infinity, ndy!==0?27/Math.abs(ndy):Infinity);
  return { x:from.x+ndx*t, y:from.y+ndy*t };
}
function easeInOut(t:number){ return t<0.5?2*t*t:-1+(4-2*t)*t; }
function lerp(a:number, b:number, t:number){ return a+(b-a)*t; }

const TYPE_COLOR = (t:StepType, T:ReturnType<typeof getLabTheme>): string =>
  (({ query:T.accent, referral:T.warning ?? '#d29922', answer:T.success ?? '#3fb950', nxdomain:T.danger ?? '#f85149', cname:'#a855f7' } as Record<StepType,string>)[t] ?? T.accent);
const TYPE_LABEL: Record<StepType,string> =
  { query:'QUERY', referral:'REFERRAL', answer:'ANSWER', nxdomain:'NXDOMAIN', cname:'CNAME' };
const CONNS: [NodeId,NodeId][] = [['client','resolver'],['resolver','root'],['resolver','tld'],['resolver','auth']];

interface DnsLabProps { isDarkMode?: boolean; }

export const DnsLab: React.FC<DnsLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [scenario, setScenario] = useState(0);
  const [step,     setStep]     = useState(0);
  const [dotT,     setDotT]     = useState(0);
  const [auto,     setAuto]     = useState(false);
  const rafRef = useRef<number | undefined>(undefined);
  const t0Ref  = useRef<number>(0);

  const sc  = SCENARIOS[scenario];
  const cur = sc.steps[step];
  const ac  = TYPE_COLOR(cur.type, T);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDotT(0); t0Ref.current = performance.now();
    const tick=(now:number)=>{ const t=Math.min((now-t0Ref.current)/700,1); setDotT(t); if(t<1) rafRef.current=requestAnimationFrame(tick); };
    rafRef.current=requestAnimationFrame(tick);
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [step, scenario]);

  useEffect(()=>{
    if(!auto||dotT<1) return;
    const id=setTimeout(()=>{ if(step<sc.steps.length-1) setStep(s=>s+1); else setAuto(false); },500);
    return ()=>clearTimeout(id);
  },[auto,dotT,step,sc.steps.length]);

  useEffect(()=>{ setStep(0); setAuto(false); },[scenario]);

  const prevStep=()=>{ setStep(s=>Math.max(0,s-1)); setAuto(false); };
  const nextStep=()=>{ setStep(s=>Math.min(sc.steps.length-1,s+1)); };

  const fromN = NODES[cur.from], toN = NODES[cur.to];
  const et=easeInOut(dotT);
  const se=nEdge(fromN,toN), ee=nEdge(toN,fromN);
  const dotX=lerp(se.x,ee.x,et), dotY=lerp(se.y,ee.y,et);
  const midX=lerp(se.x,ee.x,0.5), midY=lerp(se.y,ee.y,0.5);
  const isActive=(a:NodeId,b:NodeId)=>(cur.from===a&&cur.to===b)||(cur.from===b&&cur.to===a);

  const isLast=step===sc.steps.length-1;
  const statusCfg = !isLast
    ? { color:T.warning,  icon:'⏳', label:'RESOLVING' }
    : cur.type==='nxdomain'
    ? { color:T.danger,   icon:'✗',  label:'NXDOMAIN' }
    : cur.type==='answer'
    ? { color:T.success,  icon:'✓',  label:scenario===1?'CACHE HIT':'RESOLVED' }
    : { color:'#a855f7',  icon:'⏳', label:'FOLLOWING CNAME' };

  // Dynamic pill width based on label length
  const dispLabel = cur.label.length > 20 ? cur.label.slice(0,18)+'…' : cur.label;
  const pillW = Math.max(60, Math.min(130, dispLabel.length * 6 + 18));

  const bg = isDarkMode ? '#0d1117' : '#f6f8fa';
  const cardFill = isDarkMode ? '#161b22' : '#ffffff';
  const dimLine = isDarkMode ? '#30363d' : '#d1d5da';

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes dns-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dns-blink { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes dns-pulse { 0%{transform:scale(1);opacity:0.5} 60%{transform:scale(1.35);opacity:0} 100%{transform:scale(1.35);opacity:0} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${T.cardBg} 0%,${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#4493f8,#a855f7,#3fb950)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🌐</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>DNS Resolution Visualiser</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.success}20`, color:T.success, border:`1px solid ${T.success}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Free</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Step through the recursive query chain — from client stub resolver to authoritative nameserver — and inspect the raw DNS packets at every hop.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Scenarios',val:'4'},{label:'Query Hops',val:'4'},{label:'Record Types',val:'4'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4493f8' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Scenario Tab Bar ── */}
        <div style={{ display:'flex', gap:4, marginBottom:'1.25rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}`, flexWrap:'wrap' }}>
          {SCENARIOS.map((s,i)=>(
            <button key={i} type="button" onClick={()=>setScenario(i)}
              style={{ flex:'1 1 auto', padding:'0.45rem 0.5rem', fontWeight:700, fontSize:'0.75rem', border:'none', borderRadius:8, cursor:'pointer', background:scenario===i?T.accent:'transparent', color:scenario===i?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              {s.name}
            </button>
          ))}
        </div>

        {/* ── Domain + status bar ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.5rem 1rem', marginBottom:'0.75rem', flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.62rem', fontWeight:800, color:ac, background:`${ac}18`, border:`1px solid ${ac}30`, padding:'2px 7px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{sc.qtype}</span>
          <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:'0.82rem', color:T.textPrimary }}>{sc.domain}</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:`${statusCfg.color}15`, border:`1px solid ${statusCfg.color}30` }}>
            <span style={{ fontSize:'0.65rem', ...(!isLast?{animation:'dns-blink 1.2s infinite'}:{}) }}>{statusCfg.icon}</span>
            <span style={{ fontSize:'0.6rem', fontWeight:800, color:statusCfg.color, letterSpacing:'0.05em' }}>{statusCfg.label}</span>
          </div>
          <div style={{ marginLeft:4, fontSize:'0.7rem', color:T.textMuted }}>
            Step <strong style={{ color:T.textPrimary }}>{step+1}</strong> / {sc.steps.length}
          </div>
        </div>

        {/* ── SVG Topology — full width ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden', marginBottom:'0.75rem', animation:'dns-fade 0.25s ease-out' }}>
          <svg viewBox="0 0 820 310" style={{ width:'100%', display:'block' }}>
            <defs>
              <pattern id="dns-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="0.9" fill={isDarkMode?'#ffffff':'#000000'} opacity={isDarkMode?0.045:0.03}/>
              </pattern>
              <filter id="dns-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="dns-nodeshadow" x="-8%" y="-12%" width="116%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity={isDarkMode?0.4:0.12}/>
              </filter>
              {(['query','referral','answer','nxdomain','cname'] as StepType[]).map(t=>(
                <marker key={t} id={`da-${t}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={TYPE_COLOR(t,T)} />
                </marker>
              ))}
              {(Object.keys(NODES) as NodeId[]).map(id=>(
                <clipPath key={`cp-${id}`} id={`dns-clip-${id}`}>
                  <rect x={NODES[id].x-70} y={NODES[id].y-27} width={140} height={54} rx={10}/>
                </clipPath>
              ))}
            </defs>

            {/* Background */}
            <rect width={820} height={310} fill={bg}/>
            <rect width={820} height={310} fill="url(#dns-dots)"/>

            {/* Subtle region hints */}
            <rect x={370} y={10} width={440} height={290} rx={16}
              fill={isDarkMode?'#ffffff':'#000000'} opacity={0.018}/>

            {/* Connection lines */}
            {CONNS.map(([a,b])=>{
              const s2=nEdge(NODES[a],NODES[b]), e2=nEdge(NODES[b],NODES[a]);
              const act=isActive(a,b);
              if(act) return (
                <g key={`${a}${b}`}>
                  <line x1={s2.x} y1={s2.y} x2={e2.x} y2={e2.y}
                    stroke={ac} strokeWidth={10} opacity={0.15} filter="url(#dns-glow)" strokeLinecap="round"/>
                  <line x1={s2.x} y1={s2.y} x2={e2.x} y2={e2.y}
                    stroke={ac} strokeWidth={2.5} strokeLinecap="round"
                    markerEnd={`url(#da-${cur.type})`}/>
                </g>
              );
              return (
                <line key={`${a}${b}`} x1={s2.x} y1={s2.y} x2={e2.x} y2={e2.y}
                  stroke={dimLine} strokeWidth={1.2} strokeDasharray="6 4"
                  opacity={0.5} strokeLinecap="round"/>
              );
            })}

            {/* Animated dot */}
            {dotT>0&&dotT<1&&(
              <g>
                <circle cx={dotX} cy={dotY} r={20} fill={ac} opacity={0.05}/>
                <circle cx={dotX} cy={dotY} r={13} fill={ac} opacity={0.12}/>
                <circle cx={dotX} cy={dotY} r={7}  fill={ac} opacity={0.45}/>
                <circle cx={dotX} cy={dotY} r={3.5} fill={ac}/>
              </g>
            )}

            {/* Node cards */}
            {(Object.keys(NODES) as NodeId[]).map(id=>{
              const n=NODES[id];
              const active=cur.from===id||(cur.to===id&&dotT>0.78);
              const col = active ? n.color : dimLine;
              const fill = active ? (isDarkMode?`${n.color}10`:n.color+'08') : cardFill;
              return (
                <g key={id} filter="url(#dns-nodeshadow)">
                  {/* Card body */}
                  <rect x={n.x-70} y={n.y-27} width={140} height={54} rx={10}
                    fill={fill} stroke={col} strokeWidth={active?2:1}/>
                  {/* Left color accent strip */}
                  <rect x={n.x-70} y={n.y-27} width={5} height={54}
                    clipPath={`url(#dns-clip-${id})`}
                    fill={n.color} opacity={active?0.9:0.45}/>
                  {/* Active glow ring */}
                  {active&&(
                    <rect x={n.x-73} y={n.y-30} width={146} height={60} rx={12}
                      fill="none" stroke={n.color} strokeWidth={3} opacity={0.22}/>
                  )}
                  {/* Icon badge circle */}
                  <circle cx={n.x-38} cy={n.y} r={18}
                    fill={active?`${n.color}22`:`${n.color}0e`}
                    stroke={active?`${n.color}55`:`${n.color}22`} strokeWidth={1}/>
                  <text x={n.x-38} y={n.y+5.5} textAnchor="middle" fontSize={15}>{n.icon}</text>
                  {/* Label */}
                  <text x={n.x-10} y={n.y-7}
                    fill={active?n.color:(isDarkMode?'#e6edf3':'#24292f')}
                    fontSize={10} fontWeight="700" fontFamily="system-ui,-apple-system,sans-serif"
                    textAnchor="start">{n.label}</text>
                  {/* Sub / IP */}
                  <text x={n.x-10} y={n.y+8.5}
                    fill={isDarkMode?'#6e7681':'#6e7781'}
                    fontSize={7} fontFamily="'Fira Code','Cascadia Code',monospace"
                    textAnchor="start">{n.sub}</text>
                </g>
              );
            })}

            {/* Mid-connection label pill */}
            <rect x={midX-pillW/2} y={midY-11} width={pillW} height={22} rx={5}
              fill={isDarkMode?'#1c2128':'#ffffff'} stroke={ac} strokeWidth={1.5} opacity={0.96}/>
            <text x={midX} y={midY+4.5} textAnchor="middle"
              fill={ac} fontSize={8.5} fontWeight="800"
              fontFamily="'Fira Code','Cascadia Code',monospace">{dispLabel}</text>
          </svg>
        </div>

        {/* ── Step timeline ── */}
        <div style={{ display:'flex', gap:3, marginBottom:'0.75rem' }}>
          {sc.steps.map((s,i)=>{
            const c=TYPE_COLOR(s.type,T);
            return (
              <div key={i} onClick={()=>{ setStep(i); setAuto(false); }}
                style={{ flex:1, cursor:'pointer' }}>
                <div style={{ height:5, borderRadius:3, background:i<=step?c:T.borderColor, marginBottom:3, transition:'background 0.25s', boxShadow:i===step?`0 0 8px ${c}60`:undefined }} />
                <div style={{ fontSize:'0.42rem', textAlign:'center', color:i===step?c:T.textMuted, fontWeight:i===step?800:400, textTransform:'uppercase', letterSpacing:'0.02em' }}>{TYPE_LABEL[s.type]}</div>
              </div>
            );
          })}
        </div>

        {/* ── Controls ── */}
        <div style={{ display:'flex', gap:8, marginBottom:'1.25rem' }}>
          <button type="button" onClick={prevStep} disabled={step===0}
            style={{ flex:1, padding:'0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:'transparent', color:step===0?T.textMuted:T.textSecondary, cursor:step===0?'not-allowed':'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.82rem' }}>
            ← Back
          </button>
          <button type="button" onClick={()=>setAuto(a=>!a)}
            style={{ flex:1, padding:'0.6rem', borderRadius:8, border:`1px solid ${T.borderColor}`, background:auto?T.warning:T.panelBg, color:auto?'#fff':T.textSecondary, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.82rem' }}>
            {auto?'⏸ Pause':'▶ Auto'}
          </button>
          {step<sc.steps.length-1
            ? <button type="button" onClick={nextStep}
                style={{ flex:2, padding:'0.65rem', borderRadius:8, border:'none', background:T.accent, color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit', fontSize:'0.82rem' }}>
                Next Step →
              </button>
            : <button type="button" onClick={()=>{ setStep(0); setAuto(false); }}
                style={{ flex:2, padding:'0.65rem', borderRadius:8, border:'none', background:'#3fb950', color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit', fontSize:'0.82rem' }}>
                ✓ Done — Reset
              </button>
          }
        </div>

        {/* ── Bottom panels: terminal + detail ── */}
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>

          {/* Terminal */}
          <div style={{ flex:'1 1 300px', borderRadius:12, overflow:'hidden', border:`1px solid ${ac}40` }}>
            <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }}/>)}
              </div>
              <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                dns packet — step {step+1}/{sc.steps.length} — {cur.from} → {cur.to}
              </span>
              <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'2px 6px', borderRadius:3, background:`${ac}22`, color:ac, border:`1px solid ${ac}40`, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                {TYPE_LABEL[cur.type]}
              </span>
            </div>
            <div style={{ background:'#0d1117', padding:'0.9rem 1.1rem', minHeight:130 }}>
              <div style={{ fontFamily:"'Fira Code','Cascadia Code',monospace", fontSize:'0.68rem', lineHeight:1.75 }}>
                {cur.packet.map((line,i)=>{
                  const col=line.startsWith(';;')?'#8b949e'
                    :line.includes('IN  A ')?'#3fb950'
                    :line.includes('CNAME')?'#a855f7'
                    :line.includes(' NS ')?'#d29922'
                    :(line.includes('NXDOMAIN')||line.includes('SOA'))?'#f85149'
                    :'#e6edf3';
                  return <div key={i} style={{ color:col }}>{line||' '}</div>;
                })}
              </div>
            </div>
          </div>

          {/* Detail + legend */}
          <div style={{ flex:'1 1 250px', display:'flex', flexDirection:'column', gap:'0.8rem' }}>
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderLeft:`4px solid ${ac}`, flex:'1 1 auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:'0.6rem', fontWeight:800, color:ac, background:`${ac}18`, padding:'2px 8px', borderRadius:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>{TYPE_LABEL[cur.type]}</span>
                <span style={{ fontSize:'0.82rem', fontWeight:700, color:T.textPrimary }}>{cur.title}</span>
              </div>
              <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.7 }}>{cur.detail}</p>
            </div>
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, padding:'0.6rem 0.9rem' }}>
              <div style={{ fontSize:'0.58rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Message Types</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.45rem 0.9rem' }}>
                {(['query','referral','answer','nxdomain','cname'] as StepType[]).map(t=>(
                  <div key={t} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:20, height:3, background:TYPE_COLOR(t,T), borderRadius:2 }}/>
                    <span style={{ fontSize:'0.58rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{TYPE_LABEL[t]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <LabEduPanel cards={DNS_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default DnsLab;
