import { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const FORENSICS_EDU: EduCard[] = [
  { type:'exam', title:'SYN Scan Signature in Wireshark', body:'A TCP SYN scan (nmap -sS) shows: one source IP hitting many destination ports, SYN packets only, no handshake completion from the scanner. Closed ports respond RST/ACK; open ports respond SYN-ACK (scanner resets immediately). The "stealth" label is outdated — every modern IDS and firewall logs half-open connections. The exam asks: what identifies a port scan? Answer: many half-open TCP connections from one source.' },
  { type:'exam', title:'DNS Exfiltration Indicators', body:'Key indicators: TXT record queries (carry arbitrary binary data), high-entropy subdomain labels (Base64/hex looks random vs natural hostnames), very long FQDNs (>63 char labels), high query rate to a single external domain. Standard workstation DNS uses A/AAAA for web browsing — TXT queries at volume from a workstation, especially to low-reputation external domains, is always suspicious.' },
  { type:'config', title:'Detection Rules: Snort + tcpdump', body:'Practical detection signatures for port scanning and DNS-based exfiltration.', code:`# ─── Snort: SYN scan detection (15+ SYNs/second from same source) ───
alert tcp any any -> $HOME_NET any (\\
  flags:S; \\
  threshold: type threshold, track by_src, count 15, seconds 1; \\
  msg:"SCAN SYN stealth scan detected"; sid:1000001; rev:1;)

# ─── Snort: DNS TXT exfiltration (20+ TXT queries in 60s) ───
alert udp $HOME_NET any -> $EXTERNAL_NET 53 (\\
  byte_test:2,=,16,0,relative;   ! QTYPE = TXT (16)
  threshold: type threshold, track by_src, count 20, seconds 60; \\
  msg:"DNS exfiltration via TXT queries"; sid:1000002;)

# ─── tcpdump: capture DNS TXT queries only ───
tcpdump -n 'udp port 53 and udp[20:2] = 16'

# ─── tcpdump: capture SYN-only packets (half-open connections) ───
tcpdump -n 'tcp[tcpflags] = tcp-syn'` },
  { type:'gotcha', title:'Alert Fatigue Makes SOC Teams Ignore Real Threats', body:'Broad signatures generate thousands of daily alerts from legitimate scanners, security tools, and misconfigured devices. Alert fatigue causes analysts to suppress entire rule categories — exactly when an attacker exploits them. Tune rules to specific source subnets and realistic thresholds. Fewer, higher-fidelity alerts detect more real threats than thousands of noisy ones.' },
  { type:'gotcha', title:'No Baselines = Anomaly Detection is Blind', body:'A host that normally makes 10 DNS queries per hour sending 500 TXT queries is highly suspicious — but only if you know the baseline. Without per-host behaviour baselines, your SIEM cannot flag the anomaly. Implement per-host DNS rate baselining, off-hours connection alerting, and data volume anomalies. These catch threats that signature-based detection misses entirely.' },
  { type:'realworld', title:'SolarWinds SUNBURST: DNS C2 at Nation-State Scale', body:'The 2020 SolarWinds SUNBURST backdoor used DNS TXT queries for command-and-control. Subdomains encoded victim organisation data as Base64 labels sent to attacker-controlled authoritative nameservers, blending with legitimate Orion DNS traffic. Detection required subdomain entropy analysis and per-process DNS monitoring against a baseline. A defining example of why DNS egress monitoring is non-optional in enterprise SOCs.' },
];

interface Props { isDarkMode?: boolean; }
interface Packet   { time: string; src: string; dst: string; proto: string; len: number; info: string; flag?: 'sus' | 'normal'; decoded?: string; }
interface Question { q: string; options: [string,string,string,string]; answer: number; explanation: string; }
interface Scenario { id: string; title: string; description: string; difficulty: 'Intermediate'|'Advanced'; icon: string; threat: string; packets: Packet[]; questions: Question[]; }

const SCENARIOS: Scenario[] = [
  {
    id:'portscan', title:'Port Scan Detection', icon:'🔍', threat:'Reconnaissance', difficulty:'Intermediate',
    description:'Suspicious activity flagged on VLAN 20. Analyse the capture and identify the scan type.',
    packets: [
      { time:'08:14:01.001', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 22 [SYN] Seq=0 Win=1024 Len=0',       decoded:'TCP SYN — port 22 (SSH). No prior connection. Attacker testing if SSH is reachable.' },
      { time:'08:14:01.002', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 23 [SYN] Seq=0 Win=1024 Len=0',       decoded:'TCP SYN — port 23 (Telnet). Sequential scan continues.' },
      { time:'08:14:01.003', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 80 [SYN] Seq=0 Win=1024 Len=0',       decoded:'TCP SYN — port 80 (HTTP).' },
      { time:'08:14:01.004', src:'192.168.1.10', dst:'10.0.0.44',    proto:'TCP',   len:60,  flag:'normal', info:'80 → 51234 [RST, ACK]',                        decoded:'RST/ACK from target — port 80 is CLOSED. No service listening.' },
      { time:'08:14:01.005', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 443 [SYN] Seq=0 Win=1024 Len=0',      decoded:'TCP SYN — port 443 (HTTPS). High-value service being probed.' },
      { time:'08:14:01.006', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 3389 [SYN] Seq=0 Win=1024 Len=0',     decoded:'TCP SYN — port 3389 (RDP). Attacker looking for remote desktop access.' },
      { time:'08:14:01.007', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 445 [SYN] Seq=0 Win=1024 Len=0',      decoded:'TCP SYN — port 445 (SMB). Common ransomware target.' },
      { time:'08:14:01.008', src:'192.168.1.10', dst:'10.0.0.44',    proto:'TCP',   len:60,  flag:'normal', info:'445 → 51234 [RST, ACK]',                       decoded:'RST/ACK — port 445 closed.' },
      { time:'08:14:01.009', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 8080 [SYN] Seq=0 Win=1024 Len=0',     decoded:'TCP SYN — port 8080 (alt-HTTP). Web proxy or dev server.' },
      { time:'08:14:01.010', src:'10.0.0.44',    dst:'192.168.1.10', proto:'TCP',   len:60,  flag:'sus',    info:'51234 → 8443 [SYN] Seq=0 Win=1024 Len=0',     decoded:'TCP SYN — port 8443 (alt-HTTPS). 9 destination ports in 9ms = automated stealth scan.' },
    ],
    questions: [
      { q:'What type of scan is being performed?', options:['SYN Flood (DoS)','TCP SYN Scan (nmap -sS)','ARP Poisoning','DNS Amplification'], answer:1, explanation:'This is a TCP SYN stealth scan. The attacker sends SYN packets without completing the three-way handshake. RST responses confirm closed ports; no response indicates filtered. Identified by: one source IP, many sequential destination ports, no SYN-ACK completion. Classic nmap -sS signature.' },
      { q:'What is the attacker\'s IP address?', options:['192.168.1.10','10.0.0.44','51234','192.168.1.1'], answer:1, explanation:'10.0.0.44 is sending SYN packets to many ports on 192.168.1.10. Port 51234 is the ephemeral source port (auto-assigned by the OS) — the destination ports are what is being probed.' },
      { q:'Which IDS rule would detect this?', options:['Single SYN to port 80','ICMP ping flood','Multiple SYNs to different ports from same source in a short window','HTTP GET flood'], answer:2, explanation:'A port scan signature triggers on rate thresholds: e.g., "more than 15 different destination ports from one source IP within 1 second." Snort rule: alert tcp any any -> any any (flags:S; threshold: type threshold, track by_src, count 15, seconds 1; sid:1000001;)' },
    ],
  },
  {
    id:'exfil', title:'DNS Data Exfiltration', icon:'📡', threat:'Data Exfiltration', difficulty:'Advanced',
    description:'Unusual DNS query patterns detected from an internal workstation at 02:31 AM.',
    packets: [
      { time:'02:31:14.001', src:'192.168.10.5', dst:'8.8.8.8',      proto:'DNS',   len:118, flag:'sus',    info:'Query TXT "aGVsbG8td29ybGQ.exfil.attacker.com"', decoded:'TXT query — subdomain is Base64: "aGVsbG8td29ybGQ" decodes to "hello-world". Data is being encoded into DNS labels to exfiltrate through the firewall.' },
      { time:'02:31:14.120', src:'8.8.8.8',      dst:'192.168.10.5', proto:'DNS',   len:80,  flag:'normal', info:'Response TXT "ok"',                               decoded:'C2 acknowledgement. The attacker\'s DNS server confirms receipt of the exfiltrated data chunk.' },
      { time:'02:31:15.003', src:'192.168.10.5', dst:'8.8.8.8',      proto:'DNS',   len:142, flag:'sus',    info:'Query TXT "dXNlcjpwYXNzd29yZA.exfil.attacker.com"',decoded:'Base64 decode: "user:password". Credentials being exfiltrated through DNS TXT queries.' },
      { time:'02:31:15.130', src:'8.8.8.8',      dst:'192.168.10.5', proto:'DNS',   len:80,  flag:'normal', info:'Response TXT "ok"',                               decoded:'Acknowledgement — C2 received chunk 2.' },
      { time:'02:31:16.008', src:'192.168.10.5', dst:'8.8.8.8',      proto:'DNS',   len:156, flag:'sus',    info:'Query TXT "Y3JlZGVudGlhbHM.exfil.attacker.com"',  decoded:'Base64 decode: "credentials". Third data chunk. High-entropy subdomain labels are a key detection indicator.' },
      { time:'02:31:17.002', src:'192.168.10.5', dst:'8.8.8.8',      proto:'DNS',   len:130, flag:'normal', info:'Query A "www.google.com"',                         decoded:'Legitimate DNS query inserted to blend with normal traffic. A classic evasion technique.' },
      { time:'02:31:18.004', src:'192.168.10.5', dst:'8.8.8.8',      proto:'DNS',   len:161, flag:'sus',    info:'Query TXT "c2Vuc2l0aXZlZGF0YQ.exfil.attacker.com"',decoded:'Base64 decode: "sensitivedata". Fourth exfil chunk. TXT records can carry up to 255 bytes per string — ideal for tunnelling.' },
    ],
    questions: [
      { q:'What technique is the attacker using?', options:['DNS Amplification DDoS','DNS Cache Poisoning','DNS Tunnelling / Data Exfiltration','DNS Zone Transfer'], answer:2, explanation:'DNS tunnelling encodes data in DNS query subdomains (Base64 visible in labels). Because DNS is rarely blocked outright and often unmonitored, it\'s a common exfiltration channel. TXT record type is preferred as it carries arbitrary data. Detection: high-entropy subdomain labels, unusual TXT query rate, queries to unknown domains.' },
      { q:'What makes the timing suspicious?', options:['Queries are too fast','Off-hours activity (02:31 AM) with TXT queries to an unknown domain','Too many A record queries','DNS server IP is public'], answer:1, explanation:'Off-hours activity (02:31 AM) with TXT queries to an unknown domain is a strong red flag. Legitimate applications don\'t typically query TXT records at 2am. Baselining "normal" DNS behaviour per host and alerting on deviations is a key SOC technique.' },
      { q:'Which control would best prevent this?', options:['Block port 53 outbound entirely','DNS firewall with RPZ + DPI of DNS payloads','Rate-limit HTTP requests','Disable DNSSEC'], answer:1, explanation:'A DNS firewall (Response Policy Zones) blocks known malicious domains. Deep Packet Inspection can flag unusually long subdomains or high-entropy labels (Base64 ~6 bits/char entropy vs ~4 for English text). Never block port 53 entirely — use internal recursive resolvers instead to maintain visibility.' },
    ],
  },
  {
    id:'c2', title:'C2 Beaconing', icon:'📶', threat:'Malware C2', difficulty:'Advanced',
    description:'Endpoint detection flagged regular outbound connections. Investigate the interval pattern.',
    packets: [
      { time:'09:00:00.001', src:'192.168.1.50', dst:'185.220.101.5', proto:'HTTPS', len:312, flag:'sus',    info:'GET /update HTTP/1.1 Host: cdn-update.xyz',    decoded:'First beacon to cdn-update.xyz. Host resolves to a known Tor exit node IP. Mimicking CDN traffic to blend in.' },
      { time:'09:05:00.003', src:'192.168.1.50', dst:'185.220.101.5', proto:'HTTPS', len:298, flag:'sus',    info:'GET /update HTTP/1.1 Host: cdn-update.xyz',    decoded:'Exactly 5:00.002 minutes after first beacon. Fixed sleep interval — characteristic of automated malware.' },
      { time:'09:10:00.002', src:'192.168.1.50', dst:'185.220.101.5', proto:'HTTPS', len:305, flag:'sus',    info:'GET /update HTTP/1.1 Host: cdn-update.xyz',    decoded:'5:00.001 minute interval again. Standard deviation across intervals is < 5ms — extremely low, unlike human traffic.' },
      { time:'09:15:00.001', src:'192.168.1.50', dst:'185.220.101.5', proto:'HTTPS', len:301, flag:'sus',    info:'GET /update HTTP/1.1 Host: cdn-update.xyz',    decoded:'Fourth beacon. Payload sizes vary slightly (298-312B) to avoid exact-match signatures. JA3 fingerprint unchanged.' },
      { time:'09:20:00.004', src:'192.168.1.50', dst:'185.220.101.5', proto:'HTTPS', len:310, flag:'sus',    info:'GET /update HTTP/1.1 Host: cdn-update.xyz',    decoded:'Fifth beacon. No legitimate application beacons with <5ms jitter — this is automation.' },
      { time:'09:25:00.002', src:'192.168.1.50', dst:'185.220.101.5', proto:'HTTPS', len:308, flag:'sus',    info:'POST /cmd HTTP/1.1 Host: cdn-update.xyz',      decoded:'POST /cmd — beacon received a command. The malware is now executing instructions from the C2 server.' },
      { time:'09:30:00.001', src:'192.168.1.50', dst:'185.220.101.5', proto:'HTTPS', len:299, flag:'sus',    info:'GET /update HTTP/1.1 Host: cdn-update.xyz',    decoded:'Beaconing resumes after command execution. Predictable timing makes this high-confidence malware.' },
    ],
    questions: [
      { q:'What does the regular 5-minute interval indicate?', options:['Normal software update check','C2 beaconing with a fixed sleep interval','DNS TTL expiry','TCP keepalive'], answer:1, explanation:'Precise 5-minute intervals with <5ms jitter are a hallmark of C2 beaconing. Malware "phones home" on a schedule to receive commands or exfiltrate data. Real update clients use randomised jitter (±10-30%) to avoid this signature. The POST /cmd at 09:25 confirms command receipt from the C2.' },
      { q:'What makes 185.220.101.5 suspicious?', options:['It\'s a known Tor exit node IP','It\'s a loopback address','It\'s a DNS server','It\'s an RFC 1918 private address'], answer:0, explanation:'185.220.101.5 is a known Tor exit node IP. Malware using Tor for C2 anonymises infrastructure — the real C2 server is hidden behind the Tor network. Threat intel feeds (AlienVault OTX, AbuseIPDB, VirusTotal) flag such IPs. Block egress to known Tor exit nodes at the firewall.' },
      { q:'Which detection method is most effective?', options:['Signature-based AV','Beacon jitter analysis — flag connections with low std deviation in intervals','Block all HTTPS traffic','DNSSEC validation'], answer:1, explanation:'Jitter analysis calculates the standard deviation of connection intervals. Human-driven traffic is irregular (high std dev); beacons are regular (near-zero std dev). Tools like Zeek\'s conn.log and UEBA platforms score "beaconing likelihood." A 5-min interval with <5ms std dev scores extremely high.' },
    ],
  },
  {
    id:'arp', title:'ARP Cache Poisoning', icon:'⚡', threat:'Man-in-the-Middle', difficulty:'Intermediate',
    description:'VLAN 10 users report intermittent connectivity. ARP traffic shows anomalies.',
    packets: [
      { time:'10:45:01.001', src:'aa:bb:cc:dd:ee:ff', dst:'ff:ff:ff:ff:ff:ff', proto:'ARP',  len:42, flag:'normal', info:'Who has 192.168.10.1? Tell 192.168.10.50',             decoded:'Legitimate ARP request from host .50 seeking the gateway MAC. Normal broadcast behaviour.' },
      { time:'10:45:01.010', src:'de:ad:be:ef:00:01', dst:'ff:ff:ff:ff:ff:ff', proto:'ARP',  len:42, flag:'sus',    info:'Gratuitous ARP: 192.168.10.1 is at de:ad:be:ef:00:01', decoded:'Gratuitous ARP broadcast from attacker claiming to be the gateway (192.168.10.1). No one asked — this is unsolicited.' },
      { time:'10:45:01.011', src:'de:ad:be:ef:00:01', dst:'ff:ff:ff:ff:ff:ff', proto:'ARP',  len:42, flag:'sus',    info:'Gratuitous ARP: 192.168.10.1 is at de:ad:be:ef:00:01', decoded:'Second flood. Repeated Gratuitous ARPs force all hosts on the segment to update their ARP caches with the attacker\'s MAC.' },
      { time:'10:45:01.012', src:'de:ad:be:ef:00:01', dst:'ff:ff:ff:ff:ff:ff', proto:'ARP',  len:42, flag:'sus',    info:'Gratuitous ARP: 192.168.10.1 is at de:ad:be:ef:00:01', decoded:'Third flood in 2ms — automated tool (arpspoof, Bettercap) detected.' },
      { time:'10:45:01.020', src:'de:ad:be:ef:00:01', dst:'aa:bb:cc:dd:ee:ff', proto:'ARP',  len:42, flag:'sus',    info:'192.168.10.1 is at de:ad:be:ef:00:01 (unsolicited reply)',decoded:'Targeted unsolicited ARP reply to host .50 — gateway IP now maps to attacker MAC in victim\'s ARP cache.' },
      { time:'10:45:01.025', src:'de:ad:be:ef:00:01', dst:'aa:bb:cc:dd:ee:ff', proto:'ARP',  len:42, flag:'sus',    info:'192.168.10.50 is at de:ad:be:ef:00:01 (unsolicited reply)',decoded:'Attacker also poisons the gateway\'s ARP cache — tells the router that .50 is at attacker MAC. Full MitM position established.' },
      { time:'10:45:02.001', src:'aa:bb:cc:dd:ee:ff', dst:'de:ad:be:ef:00:01', proto:'TCP',  len:88, flag:'sus',    info:'→ 192.168.10.1 (MAC: de:ad:be:ef:00:01) — intercepted!', decoded:'Victim sends traffic to the gateway IP but it arrives at the attacker. Attacker can read, modify, or forward the traffic (MitM). If forwarding to real gateway, victim sees no disruption.' },
    ],
    questions: [
      { q:'What attack is taking place?', options:['MAC flooding','ARP cache poisoning / Man-in-the-Middle','VLAN hopping','DHCP starvation'], answer:1, explanation:'The attacker (de:ad:be:ef:00:01) sends unsolicited Gratuitous ARP replies claiming to be the gateway (192.168.10.1). Victims update their ARP cache with the attacker\'s MAC, so traffic for the gateway is sent to the attacker (MitM position). ARP has no authentication — it trusts the most recent reply.' },
      { q:'Which Layer 2 security feature prevents this?', options:['Port security (MAC limit)','Dynamic ARP Inspection (DAI)','BPDU Guard','802.1Q trunk pruning'], answer:1, explanation:'Dynamic ARP Inspection (DAI) validates ARP packets against the DHCP snooping binding table (IP→MAC→port mappings). If a Gratuitous ARP claims a different MAC for a known IP, DAI drops it. Must be combined with DHCP snooping on access ports.' },
      { q:'What is a Gratuitous ARP and why is it dangerous?', options:['An ARP request to 0.0.0.0','An ARP reply sent without a prior request — updates neighbour caches','An ARP request with TTL=0','An ARP proxy response'], answer:1, explanation:'Gratuitous ARPs are sent by a host to announce its IP-to-MAC binding (e.g., after a NIC change or HSRP failover). The problem: ARP has no authentication. Any host can send a Gratuitous ARP with a false IP-MAC binding and all neighbours will cache it, enabling MitM attacks. RFC 5227 documents this weakness.' },
    ],
  },
];

const PROTO_COLORS: Record<string,string> = { TCP:'#4493f8', DNS:'#d29922', ARP:'#a855f7', HTTPS:'#3fb950', UDP:'#f0883e' };

export function ForensicsLab({ isDarkMode = true }: Props) {
  const T = getLabTheme(isDarkMode);
  const [scenarioId, setScenarioId] = useState('portscan');
  const [answers,    setAnswers]    = useState<(number|null)[]>([null,null,null]);
  const [submitted,  setSubmitted]  = useState(false);
  const [expanded,   setExpanded]   = useState<number|null>(null);
  const [showAll,    setShowAll]    = useState(false);

  const scenario = SCENARIOS.find(s => s.id === scenarioId)!;

  const selectScenario = (id: string) => { setScenarioId(id); setAnswers([null,null,null]); setSubmitted(false); setExpanded(null); setShowAll(false); };
  const score = submitted ? answers.filter((a,i) => a === scenario.questions[i].answer).length : 0;
  const diffColor = (d: string) => d === 'Intermediate' ? '#d29922' : T.danger;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui, -apple-system, sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes foren-fade  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes foren-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes foren-slide { from{max-height:0;opacity:0} to{max-height:200px;opacity:1} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #f85149, #d29922, #a855f7)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${T.danger}15`, border:`1px solid ${T.danger}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🕵️</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>Network Forensics</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>SOC Level</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Analyse real-world packet captures. Identify attack patterns, click packets to decode them, and answer SOC investigation questions.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Scenarios', val:'4'},{label:'Questions', val:'12'},{label:'Attack Types', val:'4'}].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:T.danger }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Scenario Selector ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {SCENARIOS.map(s => {
            const active = scenarioId === s.id;
            const dc = diffColor(s.difficulty);
            return (
              <button key={s.id} onClick={() => selectScenario(s.id)} style={{ cursor:'pointer', textAlign:'left', padding:'0.9rem', borderRadius:12, border:`1.5px solid ${active ? T.accent : T.borderColor}`, background: active ? T.accentSubtle : T.panelBg, fontFamily:'inherit', color:T.textPrimary, transition:'all 0.18s', boxShadow: active ? `0 0 16px ${T.accent}20` : 'none', position:'relative', overflow:'hidden' }}>
                {active && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${T.accent}, transparent)` }} />}
                <div style={{ fontSize:'1.4rem', marginBottom:5 }}>{s.icon}</div>
                <div style={{ fontWeight:700, fontSize:'0.8rem', color: active ? T.accent : T.textPrimary, marginBottom:3, lineHeight:1.3 }}>{s.title}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                  <span style={{ fontSize:'0.58rem', fontWeight:700, padding:'1px 5px', borderRadius:4, background:`${dc}20`, color:dc }}>{s.difficulty}</span>
                  <span style={{ fontSize:'0.58rem', color:T.textMuted }}>{s.threat}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Scenario header ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap', animation:'foren-fade 0.25s ease-out' }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:'1.8rem', lineHeight:1 }}>{scenario.icon}</span>
            <div>
              <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:'1rem' }}>{scenario.title}</p>
              <p style={{ margin:0, fontSize:'0.81rem', color:T.textSecondary }}>{scenario.description}</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'3px 8px', borderRadius:20, background:`${diffColor(scenario.difficulty)}20`, color:diffColor(scenario.difficulty), border:`1px solid ${diffColor(scenario.difficulty)}40` }}>{scenario.difficulty}</span>
            <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'3px 8px', borderRadius:20, background:`${T.danger}15`, color:T.danger, border:`1px solid ${T.danger}30` }}>{scenario.threat}</span>
          </div>
        </div>

        {/* ── Packet Capture ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, marginBottom:'1.5rem', overflow:'hidden', animation:'foren-fade 0.25s ease-out' }}>
          <div style={{ padding:'0.75rem 1.25rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg, display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:5 }}>
              {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}
            </div>
            <span style={{ fontFamily:'monospace', fontSize:'0.7rem', color:T.textMuted, flex:1 }}>tcpdump -r capture.pcap -n | wireshark</span>
            <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'1px 6px', borderRadius:4, background:`${T.danger}20`, color:T.danger }}>
              {scenario.packets.filter(p=>p.flag==='sus').length} suspicious
            </span>
            <span style={{ fontSize:'0.62rem', padding:'1px 6px', borderRadius:4, background:`${T.success}20`, color:T.success, fontWeight:700 }}>
              {scenario.packets.filter(p=>p.flag==='normal').length} normal
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.71rem', fontFamily:'monospace' }}>
              <thead>
                <tr style={{ background:T.panelBg }}>
                  {['No.','Time','Source','Destination','Protocol','Length','Info'].map(h => (
                    <th key={h} style={{ padding:'0.4rem 0.75rem', textAlign:'left', fontWeight:700, color:T.textMuted, fontFamily:'system-ui', fontSize:'0.62rem', textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`1px solid ${T.borderColor}`, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(showAll ? scenario.packets : scenario.packets.slice(0,6)).map((p, i) => {
                  const isSus  = p.flag === 'sus';
                  const isOpen = expanded === i;
                  const pCol   = PROTO_COLORS[p.proto] ?? T.accent;
                  return (
                    <>
                      <tr key={i} onClick={() => setExpanded(isOpen ? null : i)} style={{ background: isSus ? `${T.danger}10` : 'transparent', borderBottom:`1px solid ${T.borderColor}`, cursor:'pointer', transition:'background 0.15s' }}>
                        <td style={{ padding:'0.35rem 0.75rem', color:T.textMuted }}>{i+1}</td>
                        <td style={{ padding:'0.35rem 0.75rem', color:T.textSecondary, whiteSpace:'nowrap' }}>{p.time}</td>
                        <td style={{ padding:'0.35rem 0.75rem', color: isSus ? T.danger : T.textPrimary, whiteSpace:'nowrap' }}>
                          {isSus && <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:T.danger, marginRight:5, animation:'foren-pulse 1.5s infinite', flexShrink:0, verticalAlign:'middle' }} />}
                          {p.src}
                        </td>
                        <td style={{ padding:'0.35rem 0.75rem', color:T.textPrimary, whiteSpace:'nowrap' }}>{p.dst}</td>
                        <td style={{ padding:'0.35rem 0.75rem' }}>
                          <span style={{ padding:'1px 6px', borderRadius:4, fontSize:'0.62rem', fontWeight:700, background:`${pCol}20`, color:pCol }}>{p.proto}</span>
                        </td>
                        <td style={{ padding:'0.35rem 0.75rem', color:T.textMuted }}>{p.len}B</td>
                        <td style={{ padding:'0.35rem 0.75rem', color: isSus?T.danger:T.textSecondary, maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {p.info}
                          <span style={{ marginLeft:5, color:isOpen?T.accent:T.textMuted, fontSize:'0.6rem' }}>{isOpen?'▲ hide':'▼ decode'}</span>
                        </td>
                      </tr>
                      {isOpen && p.decoded && (
                        <tr key={`${i}-detail`} style={{ background:'transparent', animation:'foren-fade 0.2s ease-out' }}>
                          <td colSpan={7} style={{ padding:'0 0.75rem 0.75rem 0.75rem' }}>
                            <div style={{ borderRadius:8, overflow:'hidden', border:`1px solid ${isSus?T.danger+'50':T.borderColor}` }}>
                              <div style={{ background:'#1a1a2e', padding:'0.35rem 0.9rem', display:'flex', alignItems:'center', gap:6 }}>
                                <div style={{ display:'flex', gap:4 }}>
                                  {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:7,height:7,borderRadius:'50%',background:c }} />)}
                                </div>
                                <span style={{ fontSize:'0.6rem', fontWeight:700, color: isSus?'#f85149':'#7ee787', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                                  {isSus?'⚠ Suspicious':'✓ Normal'} — Packet #{i+1} decode
                                </span>
                              </div>
                              <div style={{ background:'#0d1117', padding:'0.7rem 1rem' }}>
                                <pre style={{ margin:0, fontSize:'0.68rem', color:'#e6edf3', lineHeight:1.7, fontFamily:'\'Fira Code\',\'Cascadia Code\',monospace', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{p.decoded}</pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          {scenario.packets.length > 6 && (
            <button onClick={() => setShowAll(v=>!v)} style={{ cursor:'pointer', width:'100%', padding:'0.55rem', background:'none', border:'none', borderTop:`1px solid ${T.borderColor}`, color:T.accent, fontSize:'0.75rem', fontWeight:600, fontFamily:'inherit' }}>
              {showAll ? '▲ Show fewer packets' : `▼ Show all ${scenario.packets.length} packets`}
            </button>
          )}
        </div>

        {/* ── Questions ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'1.25rem' }}>
          {scenario.questions.map((q, qi) => (
            <div key={qi} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1.25rem', animation:'foren-fade 0.25s ease-out' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:'0.85rem' }}>
                <span style={{ fontSize:'0.65rem', fontWeight:800, padding:'3px 8px', borderRadius:20, background:`${T.accent}20`, color:T.accent, border:`1px solid ${T.accent}40`, flexShrink:0 }}>Q{qi+1}</span>
                <p style={{ margin:0, fontWeight:700, fontSize:'0.88rem', color:T.textPrimary, lineHeight:1.5 }}>{q.q}</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                {q.options.map((opt, oi) => {
                  const isSelected = answers[qi] === oi;
                  const isCorrect  = submitted && oi === q.answer;
                  const isWrong    = submitted && isSelected && oi !== q.answer;
                  const borderCol  = isCorrect ? '#3fb950' : isWrong ? T.danger : isSelected ? T.accent : T.borderColor;
                  const bgCol      = isCorrect ? '#3fb95015' : isWrong ? `${T.danger}15` : isSelected ? T.accentSubtle : T.panelBg;
                  return (
                    <button key={oi} onClick={() => !submitted && setAnswers(prev => { const n=[...prev]; n[qi]=oi; return n; })}
                      style={{ cursor:submitted?'default':'pointer', textAlign:'left', padding:'0.55rem 0.85rem', borderRadius:8, border:`1px solid ${borderCol}`, background:bgCol, color:T.textPrimary, fontFamily:'inherit', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:10, transition:'all 0.15s' }}>
                      <span style={{ width:18, height:18, borderRadius:'50%', border:`1.5px solid ${borderCol}`, background: isCorrect?'#3fb950':isWrong?T.danger:isSelected?T.accent:'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', color:'#fff', fontWeight:900, flexShrink:0 }}>
                        {isCorrect ? '✓' : isWrong ? '✗' : isSelected ? '●' : ''}
                      </span>
                      <span style={{ flex:1 }}>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div style={{ marginTop:'0.85rem', background:T.accentSubtle, border:`1px solid ${T.accent}30`, borderRadius:8, padding:'0.8rem 1rem', animation:'foren-fade 0.25s ease-out' }}>
                  <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:'0.75rem', color:T.accent }}>Investigation Notes</p>
                  <p style={{ margin:0, fontSize:'0.79rem', color:T.textSecondary, lineHeight:1.7 }}>{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Submit / Results ── */}
        {!submitted ? (
          <button onClick={() => setSubmitted(true)} disabled={answers.includes(null)} style={{ cursor:answers.includes(null)?'not-allowed':'pointer', width:'100%', padding:'0.8rem', borderRadius:10, background:T.accent, color:'#fff', border:'none', fontWeight:700, fontSize:'0.9rem', fontFamily:'inherit', opacity:answers.includes(null)?0.45:1, transition:'opacity 0.2s' }}>
            Submit Investigation →
          </button>
        ) : (
          <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.5rem', textAlign:'center', animation:'foren-fade 0.3s ease-out' }}>
            <div style={{ fontSize:'2.5rem', fontWeight:900, color: score===3?'#3fb950':score===2?'#d29922':T.danger, lineHeight:1, marginBottom:6 }}>{score}/3</div>
            <div style={{ display:'flex', gap:4, justifyContent:'center', marginBottom:12 }}>
              {[0,1,2].map(i => <div key={i} style={{ width:24, height:6, borderRadius:3, background: i<score?'#3fb950':T.borderColor }} />)}
            </div>
            <p style={{ margin:'0 0 1.25rem', color:T.textSecondary, fontSize:'0.85rem' }}>
              {score===3 ? '🎯 Perfect score — excellent threat analysis.' : score===2 ? '📚 Good work — review the investigation notes above.' : '🔍 Keep studying — network forensics takes practice.'}
            </p>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
              <button onClick={() => selectScenario(scenarioId)} style={{ cursor:'pointer', background:T.accent, color:'#fff', border:'none', borderRadius:8, padding:'0.55rem 1.5rem', fontWeight:700, fontSize:'0.85rem', fontFamily:'inherit' }}>↺ Try Again</button>
              <button onClick={() => { const ids=SCENARIOS.map(s=>s.id); const next=ids[(ids.indexOf(scenarioId)+1)%ids.length]; selectScenario(next); }} style={{ cursor:'pointer', background:T.panelBg, color:T.textSecondary, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.55rem 1.5rem', fontWeight:700, fontSize:'0.85rem', fontFamily:'inherit' }}>Next Scenario →</button>
            </div>
          </div>
        )}
        <LabEduPanel cards={FORENSICS_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default ForensicsLab;
