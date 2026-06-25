import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const FW_EDU: EduCard[] = [
  { type:'exam', title:'First Match Wins — Rule Order is Everything', body:'Firewall policies evaluate top-to-bottom; the first matching rule applies and processing stops. A broad permit-all rule above a specific deny will silently permit all traffic. On the exam: "traffic is blocked despite a permit rule" often means a more specific deny appears above it. Always place specific rules before general ones.' },
  { type:'exam', title:'Stateful vs Stateless Inspection', body:'Stateful: tracks connection state (SYN → SYN-ACK → ACK) in a session table. Return traffic matching an established session is automatically permitted — no explicit inbound rule needed. Stateless (router ACL): evaluates each packet in isolation. You must write explicit rules for both directions including ephemeral return ports. Stateful is default on dedicated firewalls; router ACLs are stateless.' },
  { type:'config', title:'Zone-Based Firewall + iptables', body:'Cisco IOS zone-based firewall and Linux iptables — both commonly tested.', code:`! ─── Cisco IOS Zone-Based Firewall ───
zone security INSIDE
zone security DMZ
zone security OUTSIDE

class-map type inspect match-any WEB
  match protocol http
  match protocol https

policy-map type inspect IN-TO-OUT
  class type inspect WEB
    inspect   ! stateful — return traffic automatically allowed

zone-pair security IN-OUT source INSIDE destination OUTSIDE
  service-policy type inspect IN-TO-OUT

! ─── Linux iptables equivalent ───
# Default policy: DROP everything
iptables -P FORWARD DROP

# Allow established/related return traffic (stateful)
iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow inside → outside HTTP/HTTPS
iptables -A FORWARD -i eth0 -o eth1 -p tcp --dport 80 -j ACCEPT
iptables -A FORWARD -i eth0 -o eth1 -p tcp --dport 443 -j ACCEPT

# Allow outside → DMZ HTTPS only
iptables -A FORWARD -i eth1 -o eth2 -p tcp --dport 443 -j ACCEPT` },
  { type:'gotcha', title:'Implicit Deny Generates No Log Without Explicit Logging Rule', body:'The implicit "deny all" at the end silently drops traffic with no log entry unless you add an explicit "deny any any log" rule just above it. New service deployments frequently break because a server was added but the firewall rule was forgotten — and without logging on the implicit deny, nobody sees the drops until a user complains. Always add a logged explicit deny at the bottom.' },
  { type:'gotcha', title:'DMZ-to-Inside Must Always Be Explicitly Denied', body:'If the DMZ-to-inside deny is missing or misconfigured, a compromised web server can pivot directly to internal databases. The DMZ should only reach the internet for updates (HTTP/HTTPS/DNS only) — never the inside zone. This is the most frequently exploited misconfiguration in enterprise networks and the first thing a firewall auditor checks.' },
  { type:'realworld', title:'Target 2013: Wrong Zone Design = 40 Million Cards', body:'In the Target breach, a third-party HVAC vendor\'s credentials provided access to Target\'s network. The vendor\'s remote-access segment had direct connectivity to the payment POS network — effectively in the same security zone. Proper segmentation (HVAC in an isolated vendor zone, POS in a separate zone with only required protocols) would have contained the breach. 40 million payment card numbers were stolen.' },
];

interface FirewallLabProps { isDarkMode?: boolean; }
type Zone = 'inside'|'dmz'|'outside';
type Protocol = 'HTTP'|'HTTPS'|'SSH'|'RDP'|'ICMP'|'FTP'|'DNS';

interface Rule {
  src: Zone|'*'; dst: Zone|'*'; proto: Protocol|'*';
  action: 'permit'|'deny'; reason: string;
  ios: string;
}

const RULES: Rule[] = [
  { src:'inside',  dst:'outside', proto:'*',     action:'permit', reason:'All outbound traffic from the trusted inside network is allowed.',               ios:'permit ip 10.0.0.0 0.0.0.255 any' },
  { src:'inside',  dst:'dmz',     proto:'*',     action:'permit', reason:'Inside network can reach DMZ servers for management.',                           ios:'permit ip 10.0.0.0 0.0.0.255 172.16.0.0 0.0.0.255' },
  { src:'outside', dst:'dmz',     proto:'HTTP',  action:'permit', reason:'Internet users may reach the DMZ web server on HTTP (port 80).',                 ios:'permit tcp any 172.16.0.0 0.0.0.255 eq 80' },
  { src:'outside', dst:'dmz',     proto:'HTTPS', action:'permit', reason:'Internet users may reach the DMZ web server on HTTPS (port 443).',               ios:'permit tcp any 172.16.0.0 0.0.0.255 eq 443' },
  { src:'outside', dst:'dmz',     proto:'DNS',   action:'permit', reason:'Internet resolvers may reach the DMZ authoritative DNS server (port 53).',       ios:'permit udp any 172.16.0.0 0.0.0.255 eq 53' },
  { src:'dmz',     dst:'outside', proto:'HTTP',  action:'permit', reason:'DMZ servers may fetch updates via HTTP.',                                         ios:'permit tcp 172.16.0.0 0.0.0.255 any eq 80' },
  { src:'dmz',     dst:'outside', proto:'HTTPS', action:'permit', reason:'DMZ servers may fetch updates via HTTPS.',                                        ios:'permit tcp 172.16.0.0 0.0.0.255 any eq 443' },
  { src:'dmz',     dst:'outside', proto:'DNS',   action:'permit', reason:'DMZ servers may resolve names via DNS.',                                          ios:'permit udp 172.16.0.0 0.0.0.255 any eq 53' },
  { src:'dmz',     dst:'inside',  proto:'*',     action:'deny',   reason:'The DMZ must never reach the inside network. A compromised DMZ server cannot pivot inward.', ios:'deny ip 172.16.0.0 0.0.0.255 10.0.0.0 0.0.0.255' },
  { src:'outside', dst:'inside',  proto:'*',     action:'deny',   reason:'All unsolicited inbound traffic from the internet to the inside network is blocked.',         ios:'deny ip any 10.0.0.0 0.0.0.255' },
  { src:'*',       dst:'*',       proto:'*',     action:'deny',   reason:'Implicit deny — anything not explicitly permitted is blocked.',                              ios:'deny ip any any  ! implicit' },
];

const PROTO_PORT: Record<Protocol, string> = {
  HTTP:'80/TCP', HTTPS:'443/TCP', SSH:'22/TCP', RDP:'3389/TCP', ICMP:'echo', FTP:'21/TCP', DNS:'53/UDP'
};

export const FirewallLab: React.FC<FirewallLabProps> = ({ isDarkMode = true }) => {
  const [src,    setSrc]    = useState<Zone>('outside');
  const [dst,    setDst]    = useState<Zone>('inside');
  const [proto,  setProto]  = useState<Protocol>('RDP');
  const [result, setResult] = useState<{action:'permit'|'deny';rule:Rule;idx:number}|null>(null);
  const T = getLabTheme(isDarkMode);

  const zoneColor: Record<Zone,string>  = { inside:T.success,  dmz:T.warning,  outside:T.danger };
  const zoneIcon:  Record<Zone,string>  = { inside:'🏢', dmz:'🖥️', outside:'🌐' };
  const zoneSubnet: Record<Zone,string> = { inside:'10.0.0.0/24', dmz:'172.16.0.0/24', outside:'0.0.0.0/0' };
  const zones: Zone[]        = ['inside','dmz','outside'];
  const protocols: Protocol[] = ['HTTP','HTTPS','SSH','RDP','ICMP','FTP','DNS'];

  const evaluate = () => {
    for (let i=0;i<RULES.length;i++) {
      const r=RULES[i];
      if ((r.src==='*'||r.src===src)&&(r.dst==='*'||r.dst===dst)&&(r.proto==='*'||r.proto===proto)) {
        setResult({action:r.action,rule:r,idx:i});
        return;
      }
    }
  };

  const selBtn = (active: boolean, color: string): React.CSSProperties => ({
    flex:1, padding:'7px 5px', border:`1px solid ${active?color:T.borderColor}`, borderRadius:7,
    cursor:'pointer', fontWeight:active?700:500, background:active?`${color}18`:T.panelBg,
    color:active?color:T.textSecondary, fontSize:'0.78rem', transition:'all 0.12s',
  });

  const TermLine = ({ label, value, hi }: { label:string; value:string; hi?:boolean }) => (
    <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:'0 0.75rem', padding:'0.28rem 0', borderBottom:'1px solid #ffffff10' }}>
      <span style={{ fontSize:'0.68rem', color:'#7ee787', fontFamily:'monospace' }}>{label}:</span>
      <span style={{ fontSize:'0.68rem', color:hi?'#ffa657':'#e6edf3', fontFamily:'monospace', wordBreak:'break-all' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes fw-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fw-permit { 0%{box-shadow:0 0 0 0 #3fb95040} 80%{box-shadow:0 0 20px 6px #3fb95010} 100%{box-shadow:0 0 0 0 #3fb95000} }
        @keyframes fw-deny   { 0%{box-shadow:0 0 0 0 #f8514940} 80%{box-shadow:0 0 20px 6px #f8514910} 100%{box-shadow:0 0 0 0 #f8514900} }
      `}</style>

      {/* ── Premium Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #f85149, #d29922, #3fb950)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#f8514915', border:'1px solid #f8514930', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔥</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>Firewall Zone Policy</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Select source zone, destination zone, and protocol — watch the policy evaluate top-down and see the matching Cisco IOS ACL entry.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Zones',val:'3'},{label:'Rules',val:'11'},{label:'Mode',val:'Stateful'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#f85149' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem', animation:'fw-fade 0.25s ease-out' }}>
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>

          {/* Left: zone diagram + selector */}
          <div style={{ flex:'1 1 360px', display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Zone diagram */}
            <div style={{ background:T.panelBg, borderRadius:14, border:`1px solid ${T.borderColor}`, padding:'1.25rem' }}>
              <span style={{ fontSize:'0.68rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'1rem' }}>Zone Topology</span>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0 }}>
                {zones.map((z,i)=>(
                  <React.Fragment key={z}>
                    <div style={{ textAlign:'center', padding:'10px 14px', borderRadius:10, border:`2px solid ${src===z||dst===z?zoneColor[z]:T.borderColor}`, background:src===z||dst===z?`${zoneColor[z]}12`:T.cardBg, minWidth:84, transition:'all 0.2s' }}>
                      <div style={{ fontSize:'1.5rem' }}>{zoneIcon[z]}</div>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:zoneColor[z], marginTop:4 }}>{z.toUpperCase()}</div>
                      <div style={{ fontSize:'0.6rem', color:T.textMuted, marginTop:2, fontFamily:'monospace' }}>{zoneSubnet[z]}</div>
                    </div>
                    {i<zones.length-1 && (
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', margin:'0 4px' }}>
                        <div style={{ padding:'3px 7px', background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:4, fontSize:'0.65rem', fontWeight:700, color:T.accent, marginBottom:4 }}>🔥</div>
                        <div style={{ height:2, width:20, background:T.borderColor }} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Traffic selector */}
            <div style={{ background:T.cardBg, borderRadius:12, border:`1px solid ${T.borderColor}`, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:7 }}>Source Zone</label>
                <div style={{ display:'flex', gap:6 }}>
                  {zones.map(z=><button key={z} type="button" onClick={()=>{ setSrc(z); setResult(null); }} style={selBtn(src===z,zoneColor[z])}>{z.charAt(0).toUpperCase()+z.slice(1)}</button>)}
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:7 }}>Destination Zone</label>
                <div style={{ display:'flex', gap:6 }}>
                  {zones.map(z=><button key={z} type="button" onClick={()=>{ setDst(z); setResult(null); }} style={selBtn(dst===z,zoneColor[z])}>{z.charAt(0).toUpperCase()+z.slice(1)}</button>)}
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.68rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:7 }}>Protocol</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {protocols.map(p=>(
                    <button key={p} type="button" onClick={()=>{ setProto(p); setResult(null); }} style={{ ...selBtn(proto===p,T.accent), flex:'none', minWidth:58 }}>{p}</button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={evaluate} disabled={src===dst}
                style={{ padding:'0.7rem', borderRadius:8, border:'none', background:src===dst?T.panelBg:T.accent, color:src===dst?T.textMuted:'#fff', fontWeight:700, cursor:src===dst?'not-allowed':'pointer', fontSize:'0.88rem', fontFamily:'inherit', transition:'background 0.15s' }}>
                {src===dst?'Source and destination must differ':'Evaluate traffic →'}
              </button>
            </div>
          </div>

          {/* Right: result terminal + rule table */}
          <div style={{ flex:'1 1 260px', display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Result terminal */}
            {result ? (
              <div style={{ borderRadius:12, overflow:'hidden', border:`2px solid ${result.action==='permit'?T.success:T.danger}`, animation:result.action==='permit'?'fw-permit 0.6s ease-out':'fw-deny 0.6s ease-out' }}>
                <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:5 }}>
                    {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
                  </div>
                  <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                    firewall-policy — rule {result.idx+1}/{RULES.length} matched
                  </span>
                </div>
                <div style={{ background:'#0d1117', padding:'0.9rem 1.1rem' }}>
                  <div style={{ textAlign:'center', marginBottom:'0.8rem' }}>
                    <span style={{ fontSize:'1.8rem', marginRight:8 }}>{result.action==='permit'?'✅':'🚫'}</span>
                    <span style={{ fontSize:'1.1rem', fontWeight:800, color:result.action==='permit'?'#3fb950':'#f85149', textTransform:'uppercase', letterSpacing:'0.08em' }}>{result.action}</span>
                  </div>
                  <TermLine label="Source Zone"   value={`${src} (${zoneSubnet[src]})`} />
                  <TermLine label="Dest Zone"     value={`${dst} (${zoneSubnet[dst]})`} />
                  <TermLine label="Protocol"      value={`${proto}  (port ${PROTO_PORT[proto]})`} hi />
                  <TermLine label="Matched Rule"  value={`#${result.idx+1} of ${RULES.length}`} />
                  <TermLine label="Action"        value={result.action.toUpperCase()} hi />
                  <div style={{ marginTop:'0.7rem', paddingTop:'0.7rem', borderTop:'1px solid #ffffff12', fontFamily:'monospace', fontSize:'0.68rem', color:'#8b949e' }}>
                    <div style={{ color:'#7ee787', marginBottom:3 }}>ios-acl-entry:</div>
                    <div style={{ color:'#ffa657' }}>{result.rule.ios}</div>
                  </div>
                </div>
                <div style={{ background:T.cardBg, padding:'0.8rem 1rem', borderTop:`1px solid ${T.borderColor}`, fontSize:'0.74rem', color:T.textSecondary, lineHeight:1.5 }}>
                  {result.rule.reason}
                </div>
              </div>
            ) : (
              <div style={{ padding:'1.5rem', borderRadius:12, background:T.cardBg, border:`1px solid ${T.borderColor}`, textAlign:'center', color:T.textMuted, fontSize:'0.85rem', fontStyle:'italic' }}>
                Configure traffic above and click Evaluate to test the policy.
              </div>
            )}

            {/* Rule table */}
            <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${T.borderColor}`, flex:1 }}>
              <div style={{ padding:'0.55rem 1rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg }}>
                <span style={{ fontSize:'0.65rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>Policy (evaluated top-down, first match wins)</span>
              </div>
              <div style={{ overflowY:'auto', maxHeight:340 }}>
                {RULES.map((r,i)=>(
                  <div key={i} style={{ padding:'7px 12px', borderBottom:`1px solid ${T.borderColor}`, display:'flex', alignItems:'center', gap:8, background:result?.idx===i?(r.action==='permit'?'#3fb95012':'#f8514912'):'transparent', transition:'background 0.2s' }}>
                    <span style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted, width:14, flexShrink:0, fontWeight:700 }}>{i+1}</span>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:r.action==='permit'?T.success:T.danger, flexShrink:0 }} />
                    <span style={{ fontFamily:'monospace', fontSize:'0.66rem', color:T.textSecondary, flex:1 }}>
                      <span style={{ color:r.src==='*'?T.textMuted:zoneColor[r.src as Zone] }}>{r.src}</span>
                      <span style={{ color:T.textMuted }}> → </span>
                      <span style={{ color:r.dst==='*'?T.textMuted:zoneColor[r.dst as Zone] }}>{r.dst}</span>
                      <span style={{ color:T.textMuted }}> </span>
                      <span style={{ color:T.accent }}>{r.proto}</span>
                    </span>
                    <span style={{ fontSize:'0.63rem', fontWeight:700, color:r.action==='permit'?T.success:T.danger, textTransform:'uppercase', flexShrink:0 }}>{r.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Theory ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:'1rem', paddingTop:'1.25rem', marginTop:'1.5rem', borderTop:`1px solid ${T.borderColor}` }}>
          {[
            { title:'Stateful Inspection',  color:T.accent,   body:'A stateful firewall tracks active sessions. When inside traffic is permitted outbound, a state entry is created — return traffic matching that session is automatically allowed without a separate inbound rule. ACLs require explicit bi-directional rules.' },
            { title:'The DMZ Purpose',      color:T.warning,  body:'The DMZ hosts public-facing services (web, mail, DNS) that must be reachable from the internet. If a DMZ server is compromised, the firewall blocks it from reaching the inside network — containing the blast radius.' },
            { title:'Implicit Deny',        color:T.danger,   body:'Every firewall policy ends with an implicit "deny all." If no rule matches a packet, it is dropped silently. This is why the rule base is evaluated top-down — the first match wins, and the implicit deny is always last.' },
          ].map(c=>(
            <div key={c.title} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${c.color}` }}>
              <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:c.color }}>{c.title}</h4>
              <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>{c.body}</p>
            </div>
          ))}
        </div>
        <LabEduPanel cards={FW_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default FirewallLab;
