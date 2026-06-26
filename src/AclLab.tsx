import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

interface AclLabProps { isDarkMode?: boolean; }

const validIp = (v: string) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(v.trim()) &&
  v.trim().split('.').every(o => +o >= 0 && +o <= 255);

const ACL_EDU: EduCard[] = [
  { type:'exam', title:'Standard vs. Extended ACL Placement',
    body:'Standard ACLs (1–99) match only on source IP — place them close to the destination so they don\'t block traffic meant for other networks. Extended ACLs (100–199) match source, destination, protocol, and port — place them close to the source to drop unwanted traffic as early as possible and conserve bandwidth.' },
  { type:'exam', title:'ACL Evaluation: Top-Down, First-Match Wins',
    body:'IOS evaluates ACL entries top-to-bottom. The first rule that matches a packet terminates evaluation immediately — all rules below it are ignored for that packet. Put more specific rules (a single host) before general rules (a whole subnet). A permit-all entry at the top defeats the entire ACL.' },
  { type:'gotcha', title:'The Implicit Deny — Every ACL Ends With One',
    body:'IOS appends "deny any" (standard) or "deny ip any any" (extended) to every ACL automatically. It never appears in show running-config but is always enforced. If you build an ACL with only permit statements, any traffic that fails to match is silently dropped — including your management SSH session. Always plan for this.' },
  { type:'config', title:'Wildcard Masks vs. Subnet Masks',
    body:'A wildcard mask is the bitwise inverse of a subnet mask. A 0-bit means "must match this bit"; a 1-bit means "ignore this bit". Subtract the subnet mask from 255.255.255.255 to get the wildcard.',
    code:`# Wildcard = 255.255.255.255 − subnet mask
# /24  (255.255.255.0)   → wildcard 0.0.0.255
# /30  (255.255.255.252) → wildcard 0.0.0.3

# Match entire /24:
access-list 10 permit 192.168.1.0 0.0.0.255

# Match one host — both lines are equivalent:
access-list 10 permit host 10.0.0.5
access-list 10 permit 10.0.0.5 0.0.0.0

# Match everything — both lines are equivalent:
access-list 10 permit any
access-list 10 permit 0.0.0.0 255.255.255.255` },
  { type:'config', title:'Applying an ACL to an Interface',
    body:'An ACL has no effect until bound to an interface with a direction. Only one ACL per direction per interface is allowed — applying a second silently replaces the first.',
    code:`! Apply inbound (filter traffic arriving from LAN)
interface GigabitEthernet0/0
 ip access-group 101 in

! Apply outbound (filter traffic leaving to WAN)
interface GigabitEthernet0/1
 ip access-group 101 out

! Verify binding
show ip interface Gi0/0 | include access list
  Inbound  access list is 101
  Outbound access list is not set

! Remove ACL from interface
interface Gi0/0
 no ip access-group 101 in` },
];

export const AclLab: React.FC<AclLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);

  const [aclType,   setAclType]   = useState<'standard' | 'extended'>('extended');
  const [aclAction, setAclAction] = useState<'permit' | 'deny'>('deny');

  const [sourceType, setSourceType] = useState<'any' | 'host' | 'subnet'>('host');
  const [sourceIp,   setSourceIp]   = useState('10.0.0.5');
  const [srcNet,     setSrcNet]     = useState('10.0.0.0');
  const [srcWild,    setSrcWild]    = useState('0.0.0.255');

  const [destType, setDestType] = useState<'any' | 'host' | 'subnet'>('any');
  const [destIp,   setDestIp]   = useState('192.168.1.1');
  const [dstNet,   setDstNet]   = useState('192.168.1.0');
  const [dstWild,  setDstWild]  = useState('0.0.0.255');

  const [appFilter,       setAppFilter]       = useState<'none' | '22' | '80' | '443' | '53' | 'ping'>('22');
  const [targetInterface, setTargetInterface] = useState('GigabitEthernet0/0');
  const [direction,       setDirection]       = useState<'in' | 'out'>('in');

  const srcIpOk  = validIp(sourceIp);
  const srcNetOk = validIp(srcNet) && validIp(srcWild);
  const dstIpOk  = validIp(destIp);
  const dstNetOk = validIp(dstNet) && validIp(dstWild);

  const getAclMetadata = () => {
    const aclNum = aclType === 'standard' ? '10' : '101';
    let srcStr = 'any';
    if (sourceType === 'host')   srcStr = `host ${srcIpOk  ? sourceIp.trim() : '?'}`;
    if (sourceType === 'subnet') srcStr = srcNetOk ? `${srcNet.trim()} ${srcWild.trim()}` : '? ?';
    let dstStr = 'any';
    if (aclType === 'extended') {
      if (destType === 'host')   dstStr = `host ${dstIpOk  ? destIp.trim() : '?'}`;
      if (destType === 'subnet') dstStr = dstNetOk ? `${dstNet.trim()} ${dstWild.trim()}` : '? ?';
    }
    let proto = 'ip', portSuffix = '';
    if (aclType === 'extended') {
      if (appFilter === '22')   { proto = 'tcp'; portSuffix = ' eq 22'; }
      if (appFilter === '80')   { proto = 'tcp'; portSuffix = ' eq 80'; }
      if (appFilter === '443')  { proto = 'tcp'; portSuffix = ' eq 443'; }
      if (appFilter === '53')   { proto = 'udp'; portSuffix = ' eq 53'; }
      if (appFilter === 'ping') { proto = 'icmp'; }
    }
    const definition = aclType === 'standard'
      ? `access-list ${aclNum} ${aclAction} ${srcStr}`
      : `access-list ${aclNum} ${aclAction} ${proto} ${srcStr} ${dstStr}${portSuffix}`;
    const srcExplain = sourceType === 'any' ? 'all source addresses'
      : sourceType === 'host' ? `the single host ${sourceIp.trim()}`
      : `the subnet ${srcNet.trim()} (wildcard ${srcWild.trim()})`;
    const dstExplain = aclType !== 'extended' ? ''
      : destType === 'any' ? 'any destination'
      : destType === 'host' ? `destination host ${destIp.trim()}`
      : `destination subnet ${dstNet.trim()} (wildcard ${dstWild.trim()})`;
    return {
      aclNum, definition, proto, portSuffix,
      binding: [
        `router(config)# interface ${targetInterface}`,
        `router(config-if)# ip access-group ${aclNum} ${direction}`,
      ],
      explanation: aclType === 'standard'
        ? `This standard ACL ${aclAction}s traffic from ${srcExplain}. Standard ACLs match on source IP only — place them close to the destination.`
        : `This extended ACL ${aclAction}s ${proto.toUpperCase()} traffic from ${srcExplain} to ${dstExplain}${portSuffix ? ` on port${portSuffix.replace(' eq', '')}` : ''}. Extended ACLs match source, destination, protocol, and port — place them close to the source.`,
    };
  };

  const meta = getAclMetadata();
  const ac = aclAction === 'permit' ? '#3fb950' : '#f85149';

  // Helpers
  const toggleBtn = (active: boolean, color?: string): CSSProperties => ({
    flex: 1, padding: '0.38rem 0.45rem', fontSize: '0.72rem', fontWeight: 700,
    cursor: 'pointer', borderRadius: 7, border: 'none', fontFamily: 'inherit',
    background: active ? (color ?? T.accent) : 'transparent',
    color: active ? '#fff' : T.textMuted, transition: 'all 0.15s',
  });

  const inputSt = (ok: boolean): CSSProperties => ({
    width: '100%', padding: '0.42rem 0.65rem', borderRadius: 8, boxSizing: 'border-box',
    background: isDarkMode ? '#0d1117' : '#f6f8fa', color: T.textPrimary,
    border: `1px solid ${ok ? T.borderColor : T.danger}`,
    fontSize: '0.78rem', fontFamily: "'Fira Code','Cascadia Code',monospace", outline: 'none',
  });

  const sLabel: CSSProperties = {
    display: 'block', fontSize: '0.6rem', fontWeight: 800, color: T.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
  };

  const toggleGroup: CSSProperties = {
    display: 'flex', gap: 3, background: T.panelBg, padding: 3,
    borderRadius: 8, border: `1px solid ${T.borderColor}`,
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`@keyframes acl-fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${T.cardBg} 0%,${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#4493f8,#a855f7,#3fb950,#f85149)' }}/>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🛡️</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>ACL Rule Builder</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.success}20`, color:T.success, border:`1px solid ${T.success}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Free</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Build, customise, and understand Cisco IOS access control list syntax. Configure the rule parameters and see the exact IOS commands generated in real-time.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'ACL Types',val:'2'},{label:'Protocols',val:'5'},{label:'Match Fields',val:'4'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4493f8' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── ACL Type Tab Bar ── */}
        <div style={{ display:'flex', gap:4, marginBottom:'1rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}` }}>
          <button type="button" onClick={()=>setAclType('standard')}
            style={{ flex:1, padding:'0.5rem', fontWeight:700, fontSize:'0.8rem', border:'none', borderRadius:8, cursor:'pointer', background:aclType==='standard'?T.accent:'transparent', color:aclType==='standard'?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
            Standard ACL&ensp;<span style={{ fontSize:'0.65rem', opacity:0.75 }}>(1–99)</span>
          </button>
          <button type="button" onClick={()=>setAclType('extended')}
            style={{ flex:1, padding:'0.5rem', fontWeight:700, fontSize:'0.8rem', border:'none', borderRadius:8, cursor:'pointer', background:aclType==='extended'?T.accent:'transparent', color:aclType==='extended'?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
            Extended ACL&ensp;<span style={{ fontSize:'0.65rem', opacity:0.75 }}>(100–199)</span>
          </button>
        </div>
        <div style={{ fontSize:'0.72rem', color:T.textMuted, marginBottom:'1.25rem', paddingLeft:2 }}>
          {aclType === 'standard'
            ? '🔵 Matches on source IP only. Simple but blunt — place close to the destination.'
            : '🟣 Matches source, destination, protocol, and port. Precise — place close to the source.'}
        </div>

        {/* ── Main flex row ── */}
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap', animation:'acl-fade 0.2s ease-out' }}>

          {/* LEFT: Form controls */}
          <div style={{ flex:'1 1 360px', background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1.1rem' }}>

            {/* Action */}
            <div>
              <label style={sLabel}>Action</label>
              <div style={toggleGroup}>
                <button type="button" onClick={()=>setAclAction('permit')} style={toggleBtn(aclAction==='permit','#3fb950')}>✓ PERMIT — Allow</button>
                <button type="button" onClick={()=>setAclAction('deny')}   style={toggleBtn(aclAction==='deny','#f85149')}>✕ DENY — Block</button>
              </div>
            </div>

            {/* Source */}
            <div>
              <label style={sLabel}>Source Address</label>
              <div style={{ ...toggleGroup, marginBottom:8 }}>
                <button type="button" onClick={()=>setSourceType('any')}    style={toggleBtn(sourceType==='any')}>Any</button>
                <button type="button" onClick={()=>setSourceType('host')}   style={toggleBtn(sourceType==='host')}>Host IP</button>
                <button type="button" onClick={()=>setSourceType('subnet')} style={toggleBtn(sourceType==='subnet')}>Subnet</button>
              </div>
              {sourceType==='host' && (
                <div>
                  <input value={sourceIp} onChange={e=>setSourceIp(e.target.value)} placeholder="e.g. 10.0.0.5" style={inputSt(srcIpOk)}/>
                  {!srcIpOk && <div style={{ fontSize:'0.6rem', color:T.danger, marginTop:3 }}>Enter a valid IPv4 address</div>}
                </div>
              )}
              {sourceType==='subnet' && (
                <div style={{ display:'flex', gap:6 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.6rem', color:T.textMuted, marginBottom:3 }}>Network address</div>
                    <input value={srcNet} onChange={e=>setSrcNet(e.target.value)} placeholder="10.0.0.0" style={inputSt(validIp(srcNet))}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:'0.6rem', color:T.textMuted, marginBottom:3 }}>Wildcard mask</div>
                    <input value={srcWild} onChange={e=>setSrcWild(e.target.value)} placeholder="0.0.0.255" style={inputSt(validIp(srcWild))}/>
                  </div>
                </div>
              )}
            </div>

            {/* Destination (extended only) */}
            {aclType==='extended' && (
              <div>
                <label style={sLabel}>Destination Address</label>
                <div style={{ ...toggleGroup, marginBottom:8 }}>
                  <button type="button" onClick={()=>setDestType('any')}    style={toggleBtn(destType==='any')}>Any</button>
                  <button type="button" onClick={()=>setDestType('host')}   style={toggleBtn(destType==='host')}>Host IP</button>
                  <button type="button" onClick={()=>setDestType('subnet')} style={toggleBtn(destType==='subnet')}>Subnet</button>
                </div>
                {destType==='host' && (
                  <div>
                    <input value={destIp} onChange={e=>setDestIp(e.target.value)} placeholder="e.g. 192.168.1.1" style={inputSt(dstIpOk)}/>
                    {!dstIpOk && <div style={{ fontSize:'0.6rem', color:T.danger, marginTop:3 }}>Enter a valid IPv4 address</div>}
                  </div>
                )}
                {destType==='subnet' && (
                  <div style={{ display:'flex', gap:6 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.6rem', color:T.textMuted, marginBottom:3 }}>Network address</div>
                      <input value={dstNet} onChange={e=>setDstNet(e.target.value)} placeholder="192.168.1.0" style={inputSt(validIp(dstNet))}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.6rem', color:T.textMuted, marginBottom:3 }}>Wildcard mask</div>
                      <input value={dstWild} onChange={e=>setDstWild(e.target.value)} placeholder="0.0.0.255" style={inputSt(validIp(dstWild))}/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Protocol / Port (extended only) */}
            {aclType==='extended' && (
              <div>
                <label style={sLabel}>Protocol / Port</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3, background:T.panelBg, padding:3, borderRadius:8, border:`1px solid ${T.borderColor}` }}>
                  {([['none','All IP'],['22','SSH / 22'],['80','HTTP / 80'],['443','HTTPS / 443'],['53','DNS / 53'],['ping','Ping (ICMP)']] as const).map(([v,lbl])=>(
                    <button key={v} type="button" onClick={()=>setAppFilter(v)} style={toggleBtn(appFilter===v)}>{lbl}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Interface & Direction */}
            <div style={{ borderTop:`1px solid ${T.borderColor}`, paddingTop:'1rem' }}>
              <label style={sLabel}>Interface &amp; Direction</label>
              <div style={{ display:'flex', gap:6 }}>
                <div style={{ flex:2 }}>
                  <div style={{ fontSize:'0.6rem', color:T.textMuted, marginBottom:3 }}>Interface name</div>
                  <input value={targetInterface} onChange={e=>setTargetInterface(e.target.value)} placeholder="GigabitEthernet0/0" style={inputSt(true)}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.6rem', color:T.textMuted, marginBottom:3 }}>Direction</div>
                  <div style={{ ...toggleGroup, height:33, alignItems:'stretch' }}>
                    <button type="button" onClick={()=>setDirection('in')}  style={{ ...toggleBtn(direction==='in',  T.accent),  flex:1 }}>IN</button>
                    <button type="button" onClick={()=>setDirection('out')} style={{ ...toggleBtn(direction==='out', T.warning), flex:1 }}>OUT</button>
                  </div>
                </div>
              </div>
              <div style={{ fontSize:'0.62rem', color:T.textMuted, marginTop:6, lineHeight:1.5 }}>
                {direction==='in'
                  ? 'IN — filters packets arriving at this interface (from the connected segment).'
                  : 'OUT — filters packets leaving this interface (towards the connected segment).'}
              </div>
            </div>
          </div>

          {/* RIGHT: Terminal + explanation */}
          <div style={{ flex:'1 1 280px', display:'flex', flexDirection:'column', gap:'0.9rem' }}>

            {/* Terminal */}
            <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${ac}40` }}>
              <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', gap:5 }}>
                  {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }}/>)}
                </div>
                <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                  cisco ios — acl {meta.aclNum} — running-config
                </span>
                <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'2px 6px', borderRadius:3, background:`${ac}22`, color:ac, border:`1px solid ${ac}40`, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  {aclAction}
                </span>
              </div>
              <div style={{ background:'#0d1117', padding:'0.9rem 1.1rem' }}>
                <div style={{ fontFamily:"'Fira Code','Cascadia Code',monospace", fontSize:'0.71rem', lineHeight:1.8 }}>
                  <div style={{ color:'#8b949e' }}># Step 1 — define the ACL rule</div>
                  <div style={{ color:'#d29922', fontWeight:700, marginBottom:14 }}>{meta.definition}</div>
                  <div style={{ color:'#8b949e' }}># Step 2 — apply to interface</div>
                  {meta.binding.map((cmd,i)=>(
                    <div key={i} style={{ color:'#4493f8', fontWeight:700 }}>{cmd}</div>
                  ))}
                  <div style={{ marginTop:14, borderTop:'1px dashed #30363d', paddingTop:12 }}>
                    <div style={{ color:'#8b949e' }}># Always appended — never visible in show run</div>
                    <div style={{ color:'#f85149', opacity:0.5, fontWeight:700 }}>
                      {aclType==='standard'
                        ? `access-list ${meta.aclNum} deny any`
                        : `access-list ${meta.aclNum} deny ip any any`}
                      <span style={{ fontFamily:'system-ui', fontStyle:'italic', fontWeight:400, marginLeft:10, fontSize:'0.62rem', opacity:0.85 }}>← implicit deny</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What this rule does */}
            <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderLeft:`4px solid ${ac}` }}>
              <div style={{ fontSize:'0.6rem', fontWeight:800, color:ac, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>What this rule does</div>
              <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.7 }}>{meta.explanation}</p>
            </div>

            {/* Implicit deny warning */}
            <div style={{ background:`${T.danger}0d`, border:`1px solid ${T.danger}35`, borderLeft:`3px solid ${T.danger}`, borderRadius:10, padding:'0.7rem 0.9rem', fontSize:'0.72rem', lineHeight:1.65, color:T.textSecondary }}>
              <span style={{ fontWeight:800, color:T.danger }}>Implicit deny — every ACL ends with one.</span>{' '}
              IOS appends{' '}
              <span style={{ fontFamily:'monospace', color:T.textPrimary, fontSize:'0.68rem' }}>deny any</span> (standard) or{' '}
              <span style={{ fontFamily:'monospace', color:T.textPrimary, fontSize:'0.68rem' }}>deny ip any any</span> (extended) automatically.
              It never appears in <span style={{ fontFamily:'monospace', color:T.textPrimary, fontSize:'0.68rem' }}>show running-config</span> but is always enforced.
            </div>

            {/* Cisco reference link */}
            <a href="https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html"
              target="_blank" rel="noopener noreferrer"
              style={{ display:'block', textAlign:'center', padding:'0.5rem', borderRadius:8, border:`1px solid ${T.borderColor}`, color:T.accent, fontSize:'0.72rem', fontWeight:700, textDecoration:'none', background:`${T.accent}08` }}>
              Cisco ACL Reference ↗
            </a>
          </div>
        </div>

        <LabEduPanel cards={ACL_EDU} isDarkMode={isDarkMode}/>
      </div>
    </div>
  );
};

export default AclLab;
