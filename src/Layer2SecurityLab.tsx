import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const L2_EDU: EduCard[] = [
  { type:'exam', title:'Three Violation Modes — Know Each Precisely', body:'Protect: silently drops unknown MACs, port stays up, no syslog, counter unchanged. Restrict: drops + increments violation counter + sends syslog — port stays up. Shutdown: drops + increments counter + err-disables the port (manual recovery required). Exam scenario: "you want logging but the port to stay up" — answer: restrict.' },
  { type:'exam', title:'DHCP Snooping Blocks Server Messages on Untrusted Ports', body:'DHCP Snooping blocks only server-originated messages (OFFER, ACK, NAK) on untrusted ports. Client messages (DISCOVER, REQUEST) are allowed through. Trusted ports are uplinks to legitimate DHCP servers. The binding table (IP + MAC + port + VLAN) is used downstream by Dynamic ARP Inspection and IP Source Guard.' },
  { type:'config', title:'Port Security + DHCP Snooping + DAI', body:'Full Layer 2 hardening on a Cisco IOS access switch.', code:`! ─── Port Security ───
interface FastEthernet0/1
  switchport mode access
  switchport access vlan 10
  switchport port-security
  switchport port-security maximum 1
  switchport port-security mac-address sticky
  switchport port-security violation shutdown

! ─── DHCP Snooping ───
ip dhcp snooping
ip dhcp snooping vlan 10          ! enable per-VLAN (required!)
no ip dhcp snooping information option  ! disable option 82 if no relay
ip dhcp snooping limit rate 15    ! prevent DHCP starvation attacks

interface GigabitEthernet0/24     ! uplink → distribution
  ip dhcp snooping trust
  ip arp inspection trust

! ─── Dynamic ARP Inspection (pairs with snooping) ───
ip arp inspection vlan 10         ! prevents ARP poisoning` },
  { type:'gotcha', title:'Sticky MACs Vanish on Reload Without "write mem"', body:'Sticky MAC addresses are stored in running-config only until you save with "write mem". If the switch reboots without saving, all learned MACs are lost — every legitimate device triggers a violation on reconnect. Add "copy run start" to your port-security deployment checklist. Some organisations automate this with EEM applets after sticky MAC changes.' },
  { type:'gotcha', title:'"ip dhcp snooping vlan X" Is Required — Global Enable Is Not Enough', body:'Enabling "ip dhcp snooping" globally does nothing without specifying which VLANs it applies to. Many engineers enable global snooping and assume it\'s active, then wonder why rogue DHCP still works. Always add "ip dhcp snooping vlan X" for each VLAN that needs protection. Verify with "show ip dhcp snooping".' },
  { type:'realworld', title:'Rogue DHCP Attack at Conference Networks', body:'A classic attack: plug a laptop into a conference network, run rogue DHCP offering shorter lease times, become the default gateway for attendees. Without DHCP Snooping, attendees\' traffic silently flows through the attacker (perfect MitM position). Reported at DEF CON and corporate events. DHCP Snooping + DAI eliminates the attack vector entirely.' },
];

interface Layer2SecurityLabProps { isDarkMode?: boolean; }

export const Layer2SecurityLab: React.FC<Layer2SecurityLabProps> = ({ isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState<'PORT_SEC'|'SNOOPING'>('PORT_SEC');
  const [pluggedDevice, setPluggedDevice] = useState<'LEGIT'|'ROGUE'>('LEGIT');
  const [violationMode, setViolationMode] = useState<'protect'|'restrict'|'shutdown'>('shutdown');
  const [portStatus, setPortStatus] = useState<'UP'|'ERR_DISABLED'>('UP');
  const [securityCount, setSecurityCount] = useState(0);
  const [psAnimState, setPsAnimState] = useState<'IDLE'|'MOVING'|'DROPPED'|'SUCCESS'>('IDLE');
  const [psLog, setPsLog] = useState<string[]>(['[SYS] Port security active on Fa0/1', '[SYS] Sticky MAC: AA:BB:CC:11:22:33', '[SYS] Max MACs: 1  Violation: SHUTDOWN', '[SYS] Awaiting traffic…']);

  const [port1Trusted, setPort1Trusted]   = useState(false);
  const [port2Trusted, setPort2Trusted]   = useState(false);
  const [port24Trusted, setPort24Trusted] = useState(true);
  const [snoopSender, setSnoopSender]     = useState<'NONE'|'LEGIT'|'ROGUE'>('NONE');
  const [snoopAnimPhase, setSnoopAnimPhase] = useState<'IDLE'|'TO_SWITCH'|'TO_PC'|'DROPPED'>('IDLE');
  const [victimIp, setVictimIp]           = useState('0.0.0.0');
  const [snoopLog, setSnoopLog]           = useState<string[]>([
    '[SYS] DHCP Snooping enabled globally', '[SYS] Fa0/24 (Corp DHCP): TRUSTED',
    '[SYS] Fa0/2 (Rogue): UNTRUSTED', '[SYS] Awaiting DHCP traffic…'
  ]);

  const T = getLabTheme(isDarkMode);

  const addPsLog = (line: string) => setPsLog(prev => [...prev.slice(-6), line]);
  const addSnoopLog = (line: string) => setSnoopLog(prev => [...prev.slice(-6), line]);

  const triggerPortSecurityTraffic = () => {
    if (portStatus==='ERR_DISABLED'||psAnimState!=='IDLE') return;
    setPsAnimState('MOVING');
    const mac = pluggedDevice==='LEGIT' ? 'AA:BB:CC:11:22:33' : 'DE:AD:BE:EF:00:01';
    addPsLog(`[Fa0/1] Frame in — src-mac: ${mac}`);
    setTimeout(()=>{
      if (pluggedDevice==='LEGIT') {
        setPsAnimState('SUCCESS');
        addPsLog('[Fa0/1] MAC matches sticky entry → frame FORWARDED');
        setTimeout(()=>setPsAnimState('IDLE'),1500);
      } else {
        if (violationMode==='shutdown') {
          setPsAnimState('DROPPED');
          setPortStatus('ERR_DISABLED');
          setSecurityCount(c=>c+1);
          addPsLog(`[Fa0/1] VIOLATION: Unknown MAC ${mac}`);
          addPsLog('[Fa0/1] Mode=SHUTDOWN → port ERR-DISABLED');
          addPsLog('%PORT_SECURITY-2-PSECURE_VIOLATION: vlan 1, MAC DE:AD:BE:EF:00:01');
        } else if (violationMode==='restrict') {
          setPsAnimState('DROPPED');
          setSecurityCount(c=>c+1);
          addPsLog(`[Fa0/1] VIOLATION: Unknown MAC ${mac}`);
          addPsLog('[Fa0/1] Mode=RESTRICT → frame DROPPED, syslog sent');
        } else {
          setPsAnimState('DROPPED');
          addPsLog(`[Fa0/1] VIOLATION: Unknown MAC ${mac}`);
          addPsLog('[Fa0/1] Mode=PROTECT → frame DROPPED silently');
        }
        setTimeout(()=>setPsAnimState('IDLE'),2000);
      }
    },800);
  };

  const resetPort = () => {
    setPortStatus('UP');
    setPluggedDevice('LEGIT');
    addPsLog('[ADMIN] shutdown');
    addPsLog('[ADMIN] no shutdown');
    addPsLog('[Fa0/1] Port restored to UP state');
  };

  const triggerDhcpOffer = (sender: 'LEGIT'|'ROGUE') => {
    if (snoopAnimPhase!=='IDLE') return;
    setSnoopSender(sender);
    setSnoopAnimPhase('TO_SWITCH');
    const port = sender==='LEGIT'?'Fa0/24':'Fa0/2';
    addSnoopLog(`[${port}] DHCP OFFER rcvd from ${sender==='LEGIT'?'10.0.0.1':'192.168.99.1'}`);
    setTimeout(()=>{
      const isTrusted = sender==='LEGIT' ? port24Trusted : port2Trusted;
      if (isTrusted) {
        addSnoopLog(`[${port}] Trust=TRUSTED → forwarding OFFER`);
        setSnoopAnimPhase('TO_PC');
        setTimeout(()=>{
          setVictimIp(sender==='LEGIT'?'10.0.0.50':'192.168.99.50');
          setSnoopAnimPhase('IDLE');
          setSnoopSender('NONE');
          addSnoopLog(sender==='LEGIT'
            ?'[Fa0/1] PC leased 10.0.0.50 — gateway 10.0.0.1'
            :'[Fa0/1] *** MITM *** PC gateway hijacked → 192.168.99.1');
        },800);
      } else {
        addSnoopLog(`[${port}] Trust=UNTRUSTED → DHCP OFFER DROPPED`);
        addSnoopLog(`[SYS] %DHCP_SNOOPING-5-DHCP_SNOOPING_VIOLATION`);
        setSnoopAnimPhase('DROPPED');
        setTimeout(()=>{ setSnoopAnimPhase('IDLE'); setSnoopSender('NONE'); },1500);
      }
    },800);
  };

  const TermLog = ({ lines, title }: { lines: string[]; title: string }) => (
    <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${T.borderColor}` }}>
      <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ display:'flex', gap:5 }}>
          {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
        </div>
        <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, textAlign:'center' }}>{title}</span>
      </div>
      <div style={{ background:'#0d1117', padding:'0.9rem 1.1rem', minHeight:130, maxHeight:220, overflowY:'auto' }}>
        {lines.map((line,i)=>{
          const isErr  = line.includes('VIOLATION')||line.includes('ERR')||line.includes('ROGUE')||line.includes('MITM')||line.includes('DROPPED')||line.includes('%');
          const isOk   = line.includes('FORWARDED')||line.includes('leased')||line.includes('TRUSTED');
          const isSys  = line.startsWith('[SYS]')||line.startsWith('[ADMIN]');
          return (
            <div key={i} style={{ fontFamily:'monospace', fontSize:'0.68rem', lineHeight:1.75, color: isErr?'#f85149':isOk?'#3fb950':isSys?'#8b949e':'#e6edf3' }}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui,-apple-system,sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes l2-fade { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes l2-glow { 0%,100%{box-shadow:0 0 0 0 #f8514940} 50%{box-shadow:0 0 14px 4px #f8514920} }
      `}</style>

      {/* ── Premium Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #f85149, #a855f7, #d29922)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#f8514915', border:'1px solid #f8514930', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🛡️</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>Layer 2 Threat Mitigation</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Defend the physical layer against rogue MAC flooding and DHCP MITM attacks using port security sticky MACs and DHCP snooping trust boundaries.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Violation Modes',val:'3'},{label:'Trust States',val:'2'},{label:'Attack Types',val:'2'}].map(s=>(
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#f85149' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>
        {/* Tab Bar */}
        <div style={{ display:'flex', gap:4, marginBottom:'1.5rem', background:T.cardBg, padding:3, borderRadius:10, border:`1px solid ${T.borderColor}` }}>
          <button type="button" onClick={()=>setActiveTab('PORT_SEC')} style={{ flex:1, padding:'0.45rem', fontWeight:700, fontSize:'0.78rem', border:'none', borderRadius:8, cursor:'pointer', background:activeTab==='PORT_SEC'?T.danger:'transparent', color:activeTab==='PORT_SEC'?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
            MAC Port Security
          </button>
          <button type="button" onClick={()=>setActiveTab('SNOOPING')} style={{ flex:1, padding:'0.45rem', fontWeight:700, fontSize:'0.78rem', border:'none', borderRadius:8, cursor:'pointer', background:activeTab==='SNOOPING'?T.success:'transparent', color:activeTab==='SNOOPING'?'#fff':T.textMuted, transition:'all 0.15s', fontFamily:'inherit' }}>
            DHCP Snooping
          </button>
        </div>

        {/* ── PORT SECURITY TAB ── */}
        {activeTab==='PORT_SEC' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', animation:'l2-fade 0.25s ease-out' }}>

            {/* Animation canvas */}
            <div style={{ background:T.panelBg, border:`1px solid ${portStatus==='ERR_DISABLED'?T.danger:T.borderColor}`, padding:'2.5rem 1rem', borderRadius:14, transition:'border-color 0.3s', ...(portStatus==='ERR_DISABLED'?{animation:'l2-glow 2s ease-out 1'}:{}) }}>
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:0, position:'relative', maxWidth:560, margin:'0 auto' }}>
                <div style={{ zIndex:2, padding:'14px 12px', borderRadius:10, background:T.cardBg, border:`2px solid ${pluggedDevice==='LEGIT'?T.accent:T.danger}`, textAlign:'center', minWidth:88, transition:'border-color 0.3s' }}>
                  <div style={{ fontSize:'2.2rem' }}>{pluggedDevice==='LEGIT'?'💻':'🦹‍♂️'}</div>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, marginTop:4, color:pluggedDevice==='LEGIT'?T.accent:T.danger }}>
                    {pluggedDevice==='LEGIT'?'Legit PC':'Rogue Laptop'}
                  </div>
                  <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted, marginTop:2 }}>
                    {pluggedDevice==='LEGIT'?'AA:BB:CC:11:22:33':'DE:AD:BE:EF:00:01'}
                  </div>
                </div>

                <div style={{ flex:1, position:'relative', height:6, background:portStatus==='UP'?T.borderColor:T.dangerSubtle, margin:'0 -8px', zIndex:1, transition:'background 0.3s' }}>
                  {portStatus==='ERR_DISABLED' && (
                    <div style={{ position:'absolute', top:-26, left:'50%', transform:'translateX(-50%)', background:T.danger, color:'#fff', fontSize:'0.62rem', padding:'4px 8px', borderRadius:4, fontWeight:800, whiteSpace:'nowrap', fontFamily:'monospace' }}>ERR-DISABLED</div>
                  )}
                  {psAnimState!=='IDLE' && (
                    <div style={{
                      position:'absolute', top:-11, width:26, height:26, background:pluggedDevice==='LEGIT'?T.accent:T.danger, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', color:'#fff', fontWeight:800,
                      transition:'all 0.8s linear',
                      left:psAnimState==='MOVING'?'100%':(psAnimState==='DROPPED'||psAnimState==='SUCCESS'?'100%':'0%'),
                      opacity:psAnimState==='DROPPED'?0:1, transform:psAnimState==='DROPPED'?'scale(2)':'scale(1)',
                    }}>📦</div>
                  )}
                  {psAnimState==='DROPPED' && <div style={{ position:'absolute', top:-22, right:-8, fontSize:'1.8rem' }}>💥</div>}
                </div>

                <div style={{ zIndex:2, padding:'14px 12px', borderRadius:10, background:T.cardBg, border:`2px solid ${T.borderColor}`, textAlign:'center', minWidth:88, position:'relative' }}>
                  <div style={{ fontSize:'2.2rem' }}>🎛️</div>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, marginTop:4 }}>Fa0/1</div>
                  <div style={{ fontSize:'0.6rem', fontFamily:'monospace', color:T.textMuted, marginTop:2 }}>SW1 access port</div>
                  {psAnimState==='SUCCESS' && <div style={{ position:'absolute', top:-20, right:0, fontSize:'1.8rem' }}>✅</div>}
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:'1.5rem' }}>
              {/* Controls */}
              <div style={{ background:T.cardBg, padding:'1.25rem', borderRadius:12, border:`1px solid ${T.borderColor}`, display:'flex', flexDirection:'column', gap:'1rem' }}>
                <span style={{ fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>Violation Mode</span>
                <div style={{ display:'flex', gap:4 }}>
                  {(['protect','restrict','shutdown'] as const).map(m=>(
                    <button key={m} type="button" onClick={()=>setViolationMode(m)} style={{ flex:1, padding:'8px 4px', fontSize:'0.65rem', fontWeight:700, borderRadius:6, border:'none', cursor:'pointer', background:violationMode===m?(m==='protect'?T.accent:m==='restrict'?T.warning:T.danger):(T.panelBg), color:violationMode===m?'#fff':T.textSecondary, fontFamily:'inherit' }}>
                      {m.charAt(0).toUpperCase()+m.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:'0.73rem', color:T.textSecondary, background:T.panelBg, padding:'8px 10px', borderRadius:6, border:`1px solid ${T.borderColor}`, lineHeight:1.5 }}>
                  {violationMode==='protect'  && 'Drop unknown MACs silently. No syslog, no counter. Port stays up.'}
                  {violationMode==='restrict' && 'Drop unknown MACs + log a syslog message + increment violation counter. Port stays up.'}
                  {violationMode==='shutdown' && 'Drop the frame, send syslog, increment counter, and err-disable the port. Requires manual recovery.'}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button type="button" onClick={()=>setPluggedDevice(p=>p==='LEGIT'?'ROGUE':'LEGIT')} disabled={portStatus==='ERR_DISABLED'||psAnimState!=='IDLE'}
                    style={{ flex:1, padding:'10px', fontSize:'0.7rem', fontWeight:700, borderRadius:8, border:'none', cursor:portStatus==='ERR_DISABLED'?'not-allowed':'pointer', background:pluggedDevice==='LEGIT'?T.danger:T.accent, color:'#fff', opacity:portStatus==='ERR_DISABLED'?0.5:1, fontFamily:'inherit' }}>
                    {pluggedDevice==='LEGIT'?'Swap to Rogue':'Revert to Legit'}
                  </button>
                  <button type="button" onClick={triggerPortSecurityTraffic} disabled={portStatus==='ERR_DISABLED'||psAnimState!=='IDLE'}
                    style={{ flex:1, padding:'10px', fontSize:'0.7rem', fontWeight:700, borderRadius:8, border:'none', cursor:portStatus==='ERR_DISABLED'?'not-allowed':'pointer', background:T.success, color:'#fff', opacity:portStatus==='ERR_DISABLED'?0.5:1, fontFamily:'inherit' }}>
                    Send Frame
                  </button>
                </div>
                {portStatus==='ERR_DISABLED' && (
                  <button type="button" onClick={resetPort} style={{ padding:'8px', fontSize:'0.7rem', fontWeight:700, borderRadius:6, border:`1px dashed ${T.warning}`, background:'transparent', color:T.warning, cursor:'pointer', fontFamily:'inherit' }}>
                    Admin Reset (shutdown → no shutdown)
                  </button>
                )}
              </div>

              {/* Security console terminal */}
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <TermLog lines={psLog} title={`security-console — Fa0/1 — ${portStatus}`} />
                <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:10, overflow:'hidden' }}>
                  <div style={{ padding:'0.5rem 1rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg }}>
                    <span style={{ fontSize:'0.65rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase' }}>Port Status</span>
                  </div>
                  <div style={{ padding:'0.75rem 1rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem', fontFamily:'monospace', fontSize:'0.72rem' }}>
                    {[
                      ['Sticky MAC', 'AA:BB:CC:11:22:33'], ['Max MACs', '1'],
                      ['Status', portStatus], ['Violations', String(securityCount)],
                      ['Mode', violationMode], ['Device', pluggedDevice]
                    ].map(([k,v])=>(
                      <div key={k}>
                        <span style={{ color:'#7ee787' }}>{k}:</span>{' '}
                        <span style={{ color:k==='Status'?portStatus==='UP'?'#3fb950':'#f85149':k==='Violations'&&securityCount>0?'#f85149':'#ffa657' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Theory row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px,1fr))', gap:'1rem', borderTop:`1px solid ${T.borderColor}`, paddingTop:'1.25rem' }}>
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${T.accent}` }}>
                <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:T.accent }}>The Sticky MAC Advantage</h4>
                <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>Typing MAC addresses manually is impractical. Sticky MAC learning dynamically learns the first MAC seen on a port and locks it into the running config. Any subsequent unknown MAC triggers the configured violation action.</p>
              </div>
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${T.danger}` }}>
                <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:T.danger }}>The Err-Disabled State</h4>
                <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>Shutdown violation doesn't just drop traffic — it physically kills the port into err-disabled state. The port stays dead until an admin issues <code style={{ fontFamily:'monospace', color:T.accent }}>shutdown</code> then <code style={{ fontFamily:'monospace', color:T.accent }}>no shutdown</code>.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── DHCP SNOOPING TAB ── */}
        {activeTab==='SNOOPING' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', animation:'l2-fade 0.25s ease-out' }}>

            {/* Topology */}
            <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.5rem 1rem', overflow:'hidden' }}>
              <svg viewBox="0 0 580 340" style={{ width:'100%', maxWidth:580, display:'block', margin:'0 auto' }}>
                {/* Rogue DHCP */}
                <rect x="30" y="40" width="120" height="72" rx="10" fill={T.panelBg} stroke={T.danger} strokeWidth="2" />
                <text x="90" y="64" textAnchor="middle" fontSize="18">🦹‍♂️</text>
                <text x="90" y="82" textAnchor="middle" fontSize="10" fontWeight="700" fill={T.danger}>Rogue DHCP</text>
                <text x="90" y="94" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#8b949e">192.168.99.1</text>
                {/* Port trust badge */}
                <rect x="55" y="110" width="70" height="16" rx="4" fill={port2Trusted?'#3fb95018':'#f8514918'} stroke={port2Trusted?'#3fb950':'#f85149'} strokeWidth="1" />
                <text x="90" y="121" textAnchor="middle" fontSize="9" fontWeight="700" fill={port2Trusted?'#3fb950':'#f85149'}>{port2Trusted?'TRUSTED':'UNTRUSTED'}</text>

                {/* Corp DHCP */}
                <rect x="430" y="40" width="120" height="72" rx="10" fill={T.panelBg} stroke={T.success} strokeWidth="2" />
                <text x="490" y="64" textAnchor="middle" fontSize="18">🗄️</text>
                <text x="490" y="82" textAnchor="middle" fontSize="10" fontWeight="700" fill={T.success}>Corp DHCP</text>
                <text x="490" y="94" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#8b949e">10.0.0.1</text>
                <rect x="455" y="110" width="70" height="16" rx="4" fill={port24Trusted?'#3fb95018':'#f8514918'} stroke={port24Trusted?'#3fb950':'#f85149'} strokeWidth="1" />
                <text x="490" y="121" textAnchor="middle" fontSize="9" fontWeight="700" fill={port24Trusted?'#3fb950':'#f85149'}>{port24Trusted?'TRUSTED':'UNTRUSTED'}</text>

                {/* Switch */}
                <rect x="215" y="150" width="150" height="60" rx="10" fill={T.cardBg} stroke={T.borderColor} strokeWidth="2" />
                <text x="290" y="174" textAnchor="middle" fontSize="16">🎛️</text>
                <text x="290" y="190" textAnchor="middle" fontSize="10" fontWeight="700" fill={T.textPrimary}>SW1 (Snooping ON)</text>
                <text x="290" y="202" textAnchor="middle" fontSize="9" fill="#8b949e">Fa0/2  Fa0/24  Fa0/1</text>

                {/* Victim PC */}
                <rect x="225" y="270" width="130" height="58" rx="10" fill={T.panelBg} stroke={T.accent} strokeWidth="2" />
                <text x="290" y="292" textAnchor="middle" fontSize="16">💻</text>
                <text x="290" y="308" textAnchor="middle" fontSize="10" fontWeight="700" fill={T.accent}>Victim PC (Fa0/1)</text>
                <text x="290" y="320" textAnchor="middle" fontSize="9" fontFamily="monospace" fill={victimIp!=='0.0.0.0'?(victimIp.startsWith('192')?T.danger:T.success):'#8b949e'}>IP: {victimIp}</text>

                {/* Wires */}
                <line x1="150" y1="112" x2="240" y2="165" stroke={T.borderColor} strokeWidth="1.5" />
                <line x1="430" y1="112" x2="340" y2="165" stroke={T.borderColor} strokeWidth="1.5" />
                <line x1="290" y1="210" x2="290" y2="270" stroke={T.borderColor} strokeWidth="1.5" />

                {/* Animated packet - rogue */}
                {snoopSender==='ROGUE' && snoopAnimPhase!=='IDLE' && (
                  <circle r="9" fill={T.danger} opacity="0.9">
                    <animateMotion dur="0.8s" fill="freeze"
                      path={snoopAnimPhase==='TO_SWITCH'?'M90,112 L240,165':snoopAnimPhase==='TO_PC'?'M240,165 L290,270':'M240,165 L180,200'} />
                  </circle>
                )}
                {/* Animated packet - legit */}
                {snoopSender==='LEGIT' && snoopAnimPhase!=='IDLE' && (
                  <circle r="9" fill={T.success} opacity="0.9">
                    <animateMotion dur="0.8s" fill="freeze"
                      path={snoopAnimPhase==='TO_SWITCH'?'M490,112 L340,165':snoopAnimPhase==='TO_PC'?'M340,165 L290,270':'M340,165 L400,200'} />
                  </circle>
                )}
                {snoopAnimPhase==='DROPPED' && <text x={snoopSender==='ROGUE'?'200':'360'} y="200" fontSize="22" textAnchor="middle">💥</text>}
              </svg>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px,1fr))', gap:'1.5rem' }}>
              {/* Controls */}
              <div style={{ background:T.cardBg, padding:'1.25rem', borderRadius:12, border:`1px solid ${T.borderColor}`, display:'flex', flexDirection:'column', gap:'1rem' }}>
                <span style={{ fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>Port Trust Boundaries</span>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[
                    { label:'Client Port Fa0/1',   state:port1Trusted,  toggle:()=>setPort1Trusted(v=>!v),   color:T.accent },
                    { label:'Rogue Port Fa0/2',    state:port2Trusted,  toggle:()=>setPort2Trusted(v=>!v),   color:T.danger },
                    { label:'Corp Port Fa0/24',    state:port24Trusted, toggle:()=>setPort24Trusted(v=>!v),  color:T.success },
                  ].map(({ label, state, toggle, color }) => (
                    <button key={label} type="button" onClick={toggle}
                      style={{ padding:'8px 10px', fontSize:'0.7rem', fontWeight:700, borderRadius:7, border:`1px solid ${state?color:T.borderColor}`, cursor:'pointer', background:state?`${color}15`:T.panelBg, color:state?color:T.textSecondary, textAlign:'left', fontFamily:'inherit' }}>
                      {label}: <span style={{ fontFamily:'monospace' }}>{state?'TRUSTED':'UNTRUSTED'}</span>
                    </button>
                  ))}
                </div>
                <span style={{ fontSize:'0.68rem', fontWeight:800, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.06em' }}>Fire DHCP Offer</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button type="button" onClick={()=>triggerDhcpOffer('LEGIT')} disabled={snoopAnimPhase!=='IDLE'}
                    style={{ flex:1, padding:'10px', fontSize:'0.7rem', fontWeight:700, borderRadius:8, border:'none', cursor:'pointer', background:T.success, color:'#fff', opacity:snoopAnimPhase!=='IDLE'?0.5:1, fontFamily:'inherit' }}>
                    Send Legit
                  </button>
                  <button type="button" onClick={()=>triggerDhcpOffer('ROGUE')} disabled={snoopAnimPhase!=='IDLE'}
                    style={{ flex:1, padding:'10px', fontSize:'0.7rem', fontWeight:700, borderRadius:8, border:'none', cursor:'pointer', background:T.danger, color:'#fff', opacity:snoopAnimPhase!=='IDLE'?0.5:1, fontFamily:'inherit' }}>
                    Send Rogue
                  </button>
                </div>
              </div>

              <TermLog lines={snoopLog} title="dhcp-snooping — binding table log" />
            </div>

            {/* Theory row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px,1fr))', gap:'1rem', borderTop:`1px solid ${T.borderColor}`, paddingTop:'1.25rem' }}>
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${T.success}` }}>
                <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:T.success }}>Trust Boundary Concept</h4>
                <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>DHCP Snooping operates on zero-trust by default. Every port is UNTRUSTED — forbidden from sending DHCP OFFERs. Admins must manually mark uplink/server ports as TRUSTED to allow IP assignment.</p>
              </div>
              <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem', borderTop:`3px solid ${T.warning}` }}>
                <h4 style={{ margin:'0 0 6px', fontSize:'0.85rem', fontWeight:700, color:T.warning }}>MITM via Rogue DHCP</h4>
                <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.55 }}>If a rogue server assigns IPs, it sets itself as the Default Gateway. The victim PC blindly forwards all traffic to the attacker, who logs it before quietly routing it to the real internet.</p>
              </div>
            </div>
          </div>
        )}
        <LabEduPanel cards={L2_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default Layer2SecurityLab;
