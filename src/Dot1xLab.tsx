import { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const DOT1X_EDU: EduCard[] = [
  { type:'exam', title:'PEAP vs EAP-TLS Certificate Requirements', body:'PEAP-MSCHAPv2: only the RADIUS server needs a certificate (for the TLS tunnel). Client authenticates with username/password inside. EAP-TLS: both sides present X.509 certificates — true mutual authentication, phishing-resistant. EAP-TLS is more secure but requires a PKI to issue certs to every device. Exam: which method requires client certificates? Answer: EAP-TLS only.' },
  { type:'exam', title:'RADIUS Access-Accept Carries Dynamic VLAN Assignment', body:'A RADIUS Access-Accept can include VSA attributes: Tunnel-Type (13 = VLAN), Tunnel-Medium-Type (6 = 802), and Tunnel-Private-Group-ID (the VLAN ID). The switch uses these to assign the authenticating port to the correct VLAN dynamically — no per-port static VLAN config needed. This enables policy-based network segmentation at scale.' },
  { type:'config', title:'Cisco Switch 802.1X + RADIUS Configuration', body:'Full 802.1X setup with critical fallback handling.', code:`aaa new-model
aaa authentication dot1x default group radius
aaa authorization network default group radius
dot1x system-auth-control  ! CRITICAL: must enable globally first

radius server CORP-RADIUS
  address ipv4 10.0.0.100 auth-port 1812 acct-port 1813
  key <shared-secret>

! ─── Fallback if RADIUS unreachable ───
radius-server dead-criteria time 5 tries 3  ! mark dead after 3 failures
radius-server deadtime 10                   ! retry after 10 minutes

interface FastEthernet0/1
  switchport mode access
  switchport access vlan 10
  dot1x port-control auto
  dot1x host-mode multi-auth         ! PC + IP phone on same port
  authentication event fail action authorize vlan 999   ! guest on failure
  authentication event no-response action authorize vlan 999` },
  { type:'gotcha', title:'RADIUS Down = Full Lockout Without dead-criteria', body:'If RADIUS is unreachable and no dead-criteria or fallback VLAN is configured, every 802.1X port stays UNAUTHORISED — nobody can access the network. Always configure radius-server dead-criteria and an auth-fail/critical VLAN. Test the RADIUS failure scenario explicitly in a maintenance window before deploying 802.1X to production.' },
  { type:'gotcha', title:'"dot1x system-auth-control" — Most Forgotten Command', body:'Every interface-level "dot1x port-control auto" silently fails without the global "dot1x system-auth-control" command. Ports stay unauthorised with no obvious error message in the logs. This is the #1 802.1X troubleshooting mistake. Always check "show dot1x" to confirm global 802.1X is enabled when troubleshooting a non-working deployment.' },
  { type:'realworld', title:'Hospital Networks: 802.1X for Device Segmentation', body:'Hospitals use 802.1X with EAP-TLS and dynamic VLAN assignment to automatically segment connected devices: imaging systems → radiology VLAN, clinical workstations → clinical VLAN, unknown devices → quarantine VLAN. This enforces HIPAA network segmentation requirements without per-port manual configuration — critical when hundreds of medical devices connect across dozens of buildings.' },
];

interface Props { isDarkMode?: boolean; }
type EapMethod = 'peap' | 'eap-tls';
type PortState = 'unauthorized' | 'authenticating' | 'authorized' | 'rejected';

interface Message {
  id: number;
  from: 'sup' | 'auth' | 'radius';
  to:   'sup' | 'auth' | 'radius';
  label: string;
  sublabel: string;
  detail: string;
  type: 'eapol' | 'radius' | 'eap' | 'data';
}

const PEAP_MESSAGES: Message[] = [
  { id:1, from:'sup',    to:'auth',   label:'EAPOL-Start',              sublabel:'EtherType: 0x888E',              type:'eapol',  detail:'The supplicant signals readiness to authenticate. Sent as a broadcast on the wire. Only EAPOL frames are permitted through the blocked port at this stage.' },
  { id:2, from:'auth',   to:'sup',    label:'EAP-Request / Identity',   sublabel:'Code: 01, Type: 01',             type:'eap',    detail:'Authenticator requests the supplicant\'s identity. The switch port remains unauthorized — no user traffic passes until RADIUS grants access.' },
  { id:3, from:'sup',    to:'auth',   label:'EAP-Response / Identity',  sublabel:'"user@netforge.example"',        type:'eap',    detail:'Supplicant provides its identity (NAI / username). This is often sent in plaintext — the real credential exchange happens inside the protected TLS tunnel.' },
  { id:4, from:'auth',   to:'radius', label:'RADIUS Access-Request',    sublabel:'Code: 1, EAP-Message attr',     type:'radius', detail:'Authenticator proxies the EAP-Response to the RADIUS server, adding NAS-IP-Address, NAS-Port, and the EAP-Message attribute wrapping the identity.' },
  { id:5, from:'radius', to:'auth',   label:'RADIUS Access-Challenge',  sublabel:'EAP-Request/PEAP TLS Hello',    type:'radius', detail:'RADIUS challenges the client with a TLS Server Hello. PEAP establishes a TLS tunnel first. Contains State attribute to track the session.' },
  { id:6, from:'auth',   to:'sup',    label:'EAP-Request (TLS Hello)',  sublabel:'PEAP Phase 1: TLS handshake',   type:'eap',    detail:'Authenticator relays the TLS challenge. PEAP Phase 1 establishes a TLS tunnel — server authenticates with its certificate. Client does NOT need a cert in PEAP.' },
  { id:7, from:'sup',    to:'auth',   label:'EAP-Response (Creds)',     sublabel:'PEAP Phase 2: MSCHAPv2/TLS',   type:'eap',    detail:'Inside the encrypted TLS tunnel, the supplicant sends MSCHAPv2 credentials (username + NT hash). Protected from eavesdropping by the outer TLS tunnel.' },
  { id:8, from:'auth',   to:'radius', label:'RADIUS Access-Request',    sublabel:'EAP-Message: credentials',      type:'radius', detail:'Authenticator forwards the encrypted credential exchange to RADIUS. The RADIUS server decrypts and validates against its user database (LDAP, Active Directory, etc.).' },
  { id:9, from:'radius', to:'auth',   label:'RADIUS Access-Accept',     sublabel:'EAP-Success + VLAN attrs',      type:'radius', detail:'Credentials valid! RADIUS sends Access-Accept with optional VLAN assignment attributes: Tunnel-Type, Tunnel-Medium-Type, Tunnel-Private-Group-ID (VLAN ID). Also sends MSK for MIC verification.' },
  { id:10,from:'auth',   to:'sup',    label:'EAP-Success',              sublabel:'Code: 03 — port authorised',    type:'eap',    detail:'Authenticator signals success to the supplicant. The port is moved from unauthorized → authorized. If a VLAN assignment was received, the port joins that VLAN.' },
];

const TLS_MESSAGES: Message[] = [
  { id:1, from:'sup',    to:'auth',   label:'EAPOL-Start',                 sublabel:'EtherType: 0x888E',                  type:'eapol',  detail:'Supplicant initiates 802.1X authentication on the wire.' },
  { id:2, from:'auth',   to:'sup',    label:'EAP-Request / Identity',      sublabel:'Code: 01, Type: 01',                 type:'eap',    detail:'Switch requests supplicant identity before mutual TLS begins.' },
  { id:3, from:'sup',    to:'auth',   label:'EAP-Response / Identity',     sublabel:'"user@netforge.example"',            type:'eap',    detail:'Supplicant provides identity. Unlike PEAP, both sides will present X.509 certificates — there is no password exchange.' },
  { id:4, from:'auth',   to:'radius', label:'RADIUS Access-Request',       sublabel:'EAP-Type: EAP-TLS',                 type:'radius', detail:'RADIUS server is told EAP-TLS is being used. It will perform mutual certificate authentication.' },
  { id:5, from:'radius', to:'auth',   label:'RADIUS Access-Challenge',     sublabel:'TLS ServerHello + Certificate',      type:'radius', detail:'RADIUS sends its own TLS certificate for the supplicant to validate. Chain verified against the trusted Root CA in the supplicant\'s trust store.' },
  { id:6, from:'auth',   to:'sup',    label:'EAP-Request (TLS ServerHello)',sublabel:'Server cert + CertificateRequest',  type:'eap',    detail:'Server requests client certificate — this is mutual TLS. Supplicant must have a client cert issued by a CA trusted by the RADIUS server.' },
  { id:7, from:'sup',    to:'auth',   label:'EAP-Response (Client Cert)',  sublabel:'ClientCertificate + KeyExchange',    type:'eap',    detail:'Supplicant sends its client certificate + key exchange. RADIUS verifies this cert against the PKI — no username or password needed at any point.' },
  { id:8, from:'auth',   to:'radius', label:'RADIUS Access-Request',       sublabel:'EAP-Message: client cert',          type:'radius', detail:'RADIUS validates the client certificate: correct CA chain, not revoked (CRL/OCSP), SAN matches policy. This is certificate-based NAC.' },
  { id:9, from:'radius', to:'auth',   label:'RADIUS Access-Accept',        sublabel:'EAP-TLS Success + VLAN',            type:'radius', detail:'Certificate valid — mutual authentication complete. Stronger than PEAP-MSCHAPv2 because it\'s phishing-resistant: credentials cannot be stolen.' },
  { id:10,from:'auth',   to:'sup',    label:'EAP-Success',                 sublabel:'Code: 03 — port authorised',         type:'eap',    detail:'Port opened. EAP-TLS provides phishing-resistant authentication — even if an attacker captures traffic, they cannot replay the certificate-bound session.' },
];

const TYPE_COLORS: Record<string, string> = { eapol:'#4493f8', eap:'#d29922', radius:'#a855f7', data:'#3fb950' };
const TYPE_LABELS: Record<string, string> = { eapol:'EAPOL', eap:'EAP', radius:'RADIUS', data:'DATA' };

// Column positions as percentages: SUP=0, AUTH=1, RADIUS=2
const COL_POS = { sup: 0, auth: 1, radius: 2 };

export function Dot1xLab({ isDarkMode = true }: Props) {
  const T = getLabTheme(isDarkMode);
  const [method,    setMethod]    = useState<EapMethod>('peap');
  const [step,      setStep]      = useState(0);
  const [auto,      setAuto]      = useState(false);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [portState, setPortState] = useState<PortState>('unauthorized');
  const msgBoxRef = useRef<HTMLDivElement>(null);

  const msgs = method === 'peap' ? PEAP_MESSAGES : TLS_MESSAGES;

  useEffect(() => { setStep(0); setPortState('unauthorized'); setSelected(null); setAuto(false); }, [method]);

  useEffect(() => {
    if (!auto) return;
    if (step >= msgs.length) { setAuto(false); return; }
    const id = setTimeout(() => {
      const next = step + 1;
      setStep(next);
      if (next === msgs.length) setPortState('authorized');
      else if (next > 1) setPortState('authenticating');
    }, 750);
    return () => clearTimeout(id);
  }, [auto, step, msgs.length]);

  useEffect(() => {
    if (msgBoxRef.current) msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
  }, [step]);

  const advance = () => {
    if (step >= msgs.length) return;
    const next = step + 1;
    setStep(next);
    if (next === msgs.length) setPortState('authorized');
    else if (next > 1) setPortState('authenticating');
  };

  const reset = () => { setStep(0); setPortState('unauthorized'); setSelected(null); setAuto(false); };

  const portColor = portState === 'authorized' ? '#3fb950' : portState === 'rejected' ? T.danger : portState === 'authenticating' ? '#d29922' : T.textMuted;
  const portIcon  = portState === 'authorized' ? '🔓' : portState === 'rejected' ? '⛔' : portState === 'authenticating' ? '⏳' : '🔒';
  const portLabel = portState === 'authorized' ? 'PORT OPEN — FORWARDING' : portState === 'rejected' ? 'ACCESS DENIED' : portState === 'authenticating' ? 'AUTHENTICATING…' : 'PORT BLOCKED';

  const ENTITIES = [
    { id:'sup',    label:'Supplicant',   sublabel:'Laptop / Phone',   icon:'💻', color:'#4493f8' },
    { id:'auth',   label:'Authenticator',sublabel:'802.1X Switch',    icon:'🔀', color:'#a855f7' },
    { id:'radius', label:'RADIUS Server',sublabel:'Authentication Svc',icon:'🖥️',color:'#3fb950' },
  ] as const;

  // For each message, derive which columns it spans and direction
  const msgArrow = (m: Message) => {
    const from = COL_POS[m.from];
    const to   = COL_POS[m.to];
    return { from, to, dir: to > from ? 'rtl' as const : 'ltr' as const };
  };

  const selMsg = selected !== null ? msgs[selected] : null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', color: T.textPrimary }}>
      <style>{`
        @keyframes dot1x-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot1x-arrow { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }
        @keyframes dot1x-arrowR{ from{clip-path:inset(0 0 0 100%)} to{clip-path:inset(0 0 0 0%)} }
        @keyframes dot1x-pulseg{ 0%,100%{box-shadow:0 0 0 0 #3fb95040} 50%{box-shadow:0 0 14px 4px #3fb95025} }
        @keyframes dot1x-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #4493f8, #a855f7, #3fb950)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#a855f715', border:'1px solid #a855f730', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔀</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>802.1X Network Access Control</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Animate the full EAP/RADIUS exchange step-by-step. The switch port stays blocked until RADIUS grants access — see exactly why.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Steps', val:'10'},{label:'Entities', val:'3'},{label:'EAP Modes', val:'2'}].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#a855f7' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Controls ── */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem', alignItems:'center', background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'0.75rem 1rem' }}>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>EAP Method:</span>
          {(['peap','eap-tls'] as EapMethod[]).map(m => (
            <button key={m} onClick={() => setMethod(m)} style={{ cursor:'pointer', padding:'0.3rem 0.9rem', borderRadius:8, border:`1px solid ${method===m ? '#a855f7' : T.borderColor}`, background:method===m ? '#a855f715' : T.panelBg, color:method===m ? '#a855f7' : T.textMuted, fontWeight:700, fontSize:'0.75rem', fontFamily:'inherit', transition:'all 0.15s' }}>
              {m==='peap' ? 'PEAP-MSCHAPv2' : 'EAP-TLS (Certs)'}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:'0.5rem' }}>
            <button onClick={() => setAuto(true)} disabled={auto||step>=msgs.length} style={{ cursor:'pointer', background:'#a855f7', color:'#fff', border:'none', borderRadius:8, padding:'0.35rem 0.85rem', fontSize:'0.75rem', fontWeight:700, fontFamily:'inherit', opacity:auto||step>=msgs.length?0.4:1, transition:'opacity 0.2s' }}>▶ Auto Play</button>
            <button onClick={advance} disabled={auto||step>=msgs.length} style={{ cursor:'pointer', background:T.panelBg, color:T.textSecondary, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.35rem 0.85rem', fontSize:'0.75rem', fontWeight:700, fontFamily:'inherit', opacity:auto||step>=msgs.length?0.4:1 }}>Step →</button>
            <button onClick={reset} style={{ cursor:'pointer', background:T.panelBg, color:T.textMuted, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.35rem 0.75rem', fontSize:'0.75rem', fontFamily:'inherit' }}>↺ Reset</button>
          </div>
        </div>

        {/* ── Port Status Banner ── */}
        <div style={{ marginBottom:'1.25rem', padding:'0.75rem 1.25rem', borderRadius:12, background:`${portColor}12`, border:`1px solid ${portColor}40`, display:'flex', alignItems:'center', gap:12, transition:'all 0.4s' }}>
          <span style={{ fontSize:'1.4rem', lineHeight:1, ...(portState==='authenticating'?{animation:'dot1x-blink 1.2s infinite'}:{}) }}>{portIcon}</span>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.82rem', color:portColor, letterSpacing:'0.05em' }}>{portLabel}</div>
            <div style={{ fontSize:'0.7rem', color:T.textMuted, marginTop:2 }}>
              {portState==='unauthorized' && 'Only EAPOL frames (EtherType 0x888E) are permitted through the port'}
              {portState==='authenticating' && 'EAP exchange in progress — RADIUS has not yet issued Access-Accept'}
              {portState==='authorized' && method==='peap' ? 'MSCHAPv2 credentials verified — port moved to forwarding state' : portState==='authorized' ? 'Client certificate validated by RADIUS — port moved to forwarding state' : ''}
              {portState==='rejected' && 'RADIUS returned Access-Reject — port remains in unauthorized state'}
            </div>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            {msgs.map((_,i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background: i < step ? portColor : T.borderColor, transition:'background 0.3s' }} />)}
          </div>
        </div>

        {/* ── Sequence Diagram ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.25rem', marginBottom:'1.25rem', ...(portState==='authorized'?{animation:'dot1x-pulseg 2s ease-out 1'}:{}) }}>

          {/* Entity headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.5rem', marginBottom:'0.75rem' }}>
            {ENTITIES.map(e => {
              const isActive = step > 0 && step < msgs.length && (msgs[step-1].from === e.id || msgs[step-1].to === e.id);
              return (
                <div key={e.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'0.5rem' }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:`${e.color}15`, border:`2px solid ${isActive ? e.color : e.color+'40'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', transition:'all 0.3s', ...(isActive?{boxShadow:`0 0 16px ${e.color}40`}:{}) }}>
                    {e.icon}
                  </div>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:T.textPrimary }}>{e.label}</span>
                  <span style={{ fontSize:'0.6rem', color:T.textMuted }}>{e.sublabel}</span>
                </div>
              );
            })}
          </div>

          {/* Lifeline + messages area */}
          <div style={{ position:'relative', minHeight: step > 0 ? step * 52 : 60 }}>
            {/* Three lifelines */}
            {[16.67, 50, 83.33].map(pos => (
              <div key={pos} style={{ position:'absolute', left:`${pos}%`, top:0, bottom:0, width:1, background:T.borderColor, opacity:0.35, transform:'translateX(-50%)' }} />
            ))}

            {step === 0 && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:T.textMuted, fontSize:'0.82rem' }}>Press Step → or Auto Play to begin the authentication flow</span>
              </div>
            )}

            {msgs.slice(0, step).map((m, i) => {
              const { from, to } = msgArrow(m);
              const isLTR = to > from;
              const col   = TYPE_COLORS[m.type];
              const isSel = selected === i;

              // Convert column index (0,1,2) to left-% on screen
              const colToX = (c: number) => [16.67, 50, 83.33][c];
              const x1 = colToX(from);
              const x2 = colToX(to);
              const arrowLeft  = Math.min(x1, x2);
              const arrowWidth = Math.abs(x2 - x1);
              const labelCenter = (x1 + x2) / 2;

              return (
                <div key={m.id} onClick={() => setSelected(isSel ? null : i)} style={{ position:'absolute', top: i * 52, left:0, right:0, height:48, cursor:'pointer', animation:'dot1x-fade 0.3s ease-out' }}>
                  {/* Arrow line */}
                  <div style={{ position:'absolute', top:'50%', left:`${arrowLeft}%`, width:`${arrowWidth}%`, height:2, transform:'translateY(-50%)', animation: isLTR ? 'dot1x-arrow 0.25s ease-out' : 'dot1x-arrowR 0.25s ease-out' }}>
                    <div style={{ width:'100%', height:'100%', background: isSel ? col : col+'90', transition:'background 0.15s' }} />
                    {/* Arrowhead */}
                    <div style={{ position:'absolute', ...(isLTR ? {right:-1} : {left:-1}), top:'50%', transform:'translateY(-50%)', width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', ...(isLTR ? {borderLeft:`6px solid ${isSel?col:col+'90'}`} : {borderRight:`6px solid ${isSel?col:col+'90'}`}) }} />
                  </div>

                  {/* Label centered above arrow */}
                  <div style={{ position:'absolute', bottom:'50%', left:`${labelCenter}%`, transform:'translate(-50%, -4px)', whiteSpace:'nowrap', textAlign:'center' }}>
                    <span style={{ fontSize:'0.68rem', fontWeight:700, color: isSel ? col : T.textPrimary, background: isSel ? `${col}18` : T.cardBg, padding:'1px 6px', borderRadius:4, border: isSel ? `1px solid ${col}40` : '1px solid transparent', transition:'all 0.15s' }}>{m.label}</span>
                  </div>

                  {/* Type badge + sublabel below arrow */}
                  <div style={{ position:'absolute', top:'50%', left:`${labelCenter}%`, transform:'translate(-50%, 6px)', whiteSpace:'nowrap', textAlign:'center', display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                    <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'0px 4px', borderRadius:3, background:`${col}20`, color:col }}>{TYPE_LABELS[m.type]}</span>
                    <span style={{ fontSize:'0.58rem', color:T.textMuted }}>{m.sublabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selMsg && (
          <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${TYPE_COLORS[selMsg.type]}50`, marginBottom:'1.25rem', animation:'dot1x-fade 0.2s ease-out' }}>
            <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c=><div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
              </div>
              <span style={{ fontSize:'0.58rem', fontWeight:800, padding:'2px 7px', borderRadius:20, background:`${TYPE_COLORS[selMsg.type]}25`, color:TYPE_COLORS[selMsg.type], border:`1px solid ${TYPE_COLORS[selMsg.type]}40`, textTransform:'uppercase', flexShrink:0 }}>{TYPE_LABELS[selMsg.type]}</span>
              <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selMsg.label} — {selMsg.sublabel}</span>
              <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:TYPE_COLORS[selMsg.type], flexShrink:0 }}>{selMsg.from.toUpperCase()} → {selMsg.to.toUpperCase()}</span>
            </div>
            <div style={{ background:'#0d1117', padding:'0.9rem 1.25rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:'0 0.75rem', padding:'0.25rem 0', borderBottom:'1px solid #ffffff10', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.68rem', color:'#7ee787', fontFamily:'monospace' }}>EtherType / Port:</span>
                <span style={{ fontSize:'0.68rem', color:'#ffa657', fontFamily:'monospace' }}>{selMsg.sublabel}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:'0 0.75rem', padding:'0.25rem 0', borderBottom:'1px solid #ffffff10', marginBottom:'0.75rem' }}>
                <span style={{ fontSize:'0.68rem', color:'#7ee787', fontFamily:'monospace' }}>Direction:</span>
                <span style={{ fontSize:'0.68rem', color:'#e6edf3', fontFamily:'monospace' }}>
                  {selMsg.from==='sup'?'Supplicant':selMsg.from==='auth'?'Authenticator':'RADIUS'}{' → '}
                  {selMsg.to==='sup'?'Supplicant':selMsg.to==='auth'?'Authenticator':'RADIUS'}
                </span>
              </div>
              <p style={{ margin:0, fontSize:'0.77rem', color:'#c9d1d9', lineHeight:1.75 }}>{selMsg.detail}</p>
            </div>
          </div>
        )}

        {/* ── Comparison Table ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'0.9rem 1.25rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:T.textPrimary }}>PEAP-MSCHAPv2 vs EAP-TLS</span>
            <span style={{ fontSize:'0.65rem', color:T.textMuted }}>— choose the right method for your environment</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:0 }}>
            {[['', 'PEAP-MSCHAPv2', 'EAP-TLS'],
              ['Client certificate', '❌ Not required','✅ Required'],
              ['Server certificate', '✅ Required','✅ Required'],
              ['Credential type', 'Password (NTHash)','X.509 Certificate'],
              ['Phishing resistance', '⚠️ Password theft','✅ Cert-bound identity'],
              ['Deployment effort', '✅ Easy (no PKI)','⚠️ Requires PKI'],
              ['Security strength', '⚠️ Depends on password','✅ Very high'],
            ].map((row, ri) => (
              row.map((cell, ci) => (
                <div key={`${ri}-${ci}`} style={{ padding:'0.45rem 0.75rem', borderBottom:`1px solid ${T.borderColor}`, borderRight: ci<2?`1px solid ${T.borderColor}`:'none', fontSize: ci===0?'0.72rem':'0.75rem', fontWeight: ri===0||ci===0?700:400, color: ri===0 ? T.textMuted : ci===0 ? T.textSecondary : T.textPrimary, background: ri===0 ? T.panelBg : ci===1 && method==='peap' ? `${T.accent}08` : ci===2 && method==='eap-tls' ? `${T.accent}08` : 'transparent', textTransform: ri===0?'uppercase':'none', letterSpacing: ri===0?'0.05em':'normal', transition:'background 0.2s' }}>
                  {cell}
                </div>
              ))
            ))}
          </div>
        </div>

        <LabEduPanel cards={DOT1X_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default Dot1xLab;
