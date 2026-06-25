import { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const PKI_EDU: EduCard[] = [
  { type:'exam', title:'Certificate Chain Validation Order', body:'Validation goes leaf → intermediate → root: verify the leaf is signed by the intermediate, the intermediate is signed by the root, then check the root is in the local trust store. The root CA is self-signed — you must explicitly trust it. If any link is expired, revoked, or has wrong key usage, the entire chain fails. Most TLS errors are expired intermediates, not expired leaf certs.' },
  { type:'exam', title:'OCSP vs CRL: Real-Time vs Cached Revocation', body:'CRL: client downloads a signed list of revoked serials at intervals — can be large; revoked certs remain trusted until the next refresh. OCSP: client queries a responder with a serial number and gets a real-time signed status. OCSP Stapling: the server pre-fetches and attaches the OCSP response to the TLS handshake, eliminating the client round trip. Stapling is best practice for high-traffic public sites.' },
  { type:'config', title:'OpenSSL: Key Gen → CSR → Sign → Verify Chain', body:'The complete PKI lifecycle from the command line — all three tiers.', code:`# ─── Root CA (self-signed) ───
openssl genrsa -out root-ca.key 4096
openssl req -new -x509 -key root-ca.key -out root-ca.crt \\
  -days 3650 -subj "/CN=Corp Root CA/O=Corp/C=US"

# ─── Intermediate CA (signed by Root) ───
openssl genrsa -out intermediate.key 4096
openssl req -new -key intermediate.key -out intermediate.csr \\
  -subj "/CN=Corp Intermediate CA"
openssl x509 -req -in intermediate.csr -CA root-ca.crt \\
  -CAkey root-ca.key -CAcreateserial -out intermediate.crt \\
  -days 1825 -extensions v3_ca

# ─── Leaf Certificate (signed by Intermediate) ───
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr \\
  -subj "/CN=netforge.example.com"
openssl x509 -req -in server.csr -CA intermediate.crt \\
  -CAkey intermediate.key -out server.crt -days 365 \\
  -extfile <(printf "subjectAltName=DNS:netforge.example.com")

# ─── Verify full chain ───
openssl verify -CAfile <(cat root-ca.crt intermediate.crt) server.crt` },
  { type:'gotcha', title:'Expired Intermediate CA Breaks Every Leaf Certificate', body:'When the intermediate CA expires, every certificate it signed becomes un-verifiable — even leaf certs with years remaining on their own validity. Clients get "certificate chain invalid." Organisations with unmonitored PKI have suffered complete outages from this. Implement automated monitoring of CA cert expiry with alerts at 90/30/7 days remaining.' },
  { type:'gotcha', title:'Missing subjectAltName (SAN) Breaks Modern Browsers', body:'Since 2017, browsers require the hostname in the SAN extension — the CN field is ignored for hostname validation. A cert with CN=server.corp.com but no SAN fails validation in Chrome, Firefox, and Safari even when the hostname matches. Always include DNS SAN entries when generating leaf certs. Wildcard SANs (*.corp.com) cover only one level of subdomain.' },
  { type:'realworld', title:'DigiNotar 2011: Rogue Certificate for *.google.com', body:'Dutch CA DigiNotar was silently compromised. Attackers issued 531 fraudulent certificates including *.google.com, used to MitM Gmail for ~300,000 Iranian users. When discovered, all major browsers revoked DigiNotar\'s root CA — instantly breaking every site using DigiNotar certs. DigiNotar declared bankruptcy within days. The incident drove adoption of Certificate Transparency (CT) logs, now mandatory in Chrome.' },
];

interface Props { isDarkMode?: boolean; }
type CertId = 'root' | 'intermediate' | 'leaf';
type Stage   = 'idle' | 'signed-intermediate' | 'signed-leaf' | 'verified' | 'revoked';

const CERTS = {
  root: {
    label:'Root CA', cn:'NetForge Root CA',
    subject:   'CN=NetForge Root CA, O=NetForge PKI, C=GB',
    issuer:    'CN=NetForge Root CA, O=NetForge PKI, C=GB',
    serial:    '01:00:00:00:00:00:00:01',
    notBefore: '2024-01-01',
    notAfter:  '2044-01-01',
    keyAlg:    'rsaEncryption (4096 bit)',
    sigAlg:    'sha256WithRSAEncryption',
    basicConstraints: 'CA:TRUE, pathlen:2',
    keyUsage: 'Certificate Sign, CRL Sign',
    extKeyUsage: null as string | null,
    san: null as string | null,
    cdp: null as string | null,
    ocsp: null as string | null,
    selfSigned: true,
    keySize: '4096-bit',
    validity: '20 years',
    color: '#3fb950',
  },
  intermediate: {
    label:'Intermediate CA', cn:'NetForge Intermediate CA',
    subject:   'CN=NetForge Intermediate CA, O=NetForge PKI, C=GB',
    issuer:    'CN=NetForge Root CA, O=NetForge PKI, C=GB',
    serial:    '02:00:00:00:00:00:00:02',
    notBefore: '2024-01-01',
    notAfter:  '2034-01-01',
    keyAlg:    'rsaEncryption (2048 bit)',
    sigAlg:    'sha256WithRSAEncryption',
    basicConstraints: 'CA:TRUE, pathlen:0',
    keyUsage: 'Certificate Sign, CRL Sign',
    extKeyUsage: null as string | null,
    san: null as string | null,
    cdp: 'http://crl.netforge.example/root.crl',
    ocsp: 'http://ocsp.netforge.example',
    selfSigned: false,
    keySize: '2048-bit',
    validity: '10 years',
    color: '#4493f8',
  },
  leaf: {
    label:'End-Entity (Leaf)', cn:'*.netforge.example',
    subject:   'CN=*.netforge.example, O=NetForge Ltd, C=GB',
    issuer:    'CN=NetForge Intermediate CA, O=NetForge PKI, C=GB',
    serial:    '03:A9:F2:44:C1:88:2B:11',
    notBefore: '2024-06-01',
    notAfter:  '2024-09-01',
    keyAlg:    'rsaEncryption (2048 bit)',
    sigAlg:    'sha256WithRSAEncryption',
    basicConstraints: 'CA:FALSE',
    keyUsage: 'Digital Signature, Key Encipherment',
    extKeyUsage: 'TLS Web Server Authentication (1.3.6.1.5.5.7.3.1)',
    san: 'DNS:*.netforge.example, DNS:netforge.example',
    cdp: 'http://crl.netforge.example/intermediate.crl',
    ocsp: 'http://ocsp.netforge.example',
    selfSigned: false,
    keySize: '2048-bit',
    validity: '90 days',
    color: '#d29922',
  },
} as const;

const INSIGHT: Record<CertId, { heading: string; body: string }> = {
  root:         { heading:'Trust Anchor', body:'Root CA certificates are distributed out-of-band — embedded in OS and browser trust stores. Clients trust the Root implicitly. Its private key is kept air-gapped; compromise means rebuilding your entire PKI. The Root signs the Intermediate and nothing else.' },
  intermediate: { heading:'Why an Intermediate?', body:'The Root CA private key is kept offline. The Intermediate issues day-to-day certificates. If the Intermediate is compromised, it can be revoked and replaced without touching the Root. The pathlen:0 constraint means it cannot sign other CAs — only end-entity certs.' },
  leaf:         { heading:'90-day validity', body:'Modern best practice (Let\'s Encrypt, upcoming CAB/Forum mandate) uses short-lived certificates. Short validity limits exposure if a private key is compromised. Note: the SAN field is what browsers actually validate — the CN is legacy. The wildcard *.netforge.example covers all subdomains.' },
};

export function PkiLab({ isDarkMode = true }: Props) {
  const T = getLabTheme(isDarkMode);
  const [stage,       setStage]       = useState<Stage>('idle');
  const [selected,    setSelected]    = useState<CertId | null>(null);
  const [animating,   setAnimating]   = useState(false);
  const [revokeCheck, setRevokeCheck] = useState<'crl' | 'ocsp'>('ocsp');
  const [revokeState, setRevokeState] = useState<'idle' | 'checking' | 'valid' | 'revoked'>('idle');
  const [revokeProgress, setRevokeProgress] = useState(0);

  const animate = (fn: () => void) => {
    setAnimating(true);
    setTimeout(() => { fn(); setAnimating(false); }, 950);
  };

  const signIntermediate = () => animate(() => setStage('signed-intermediate'));
  const signLeaf         = () => animate(() => setStage('signed-leaf'));
  const verify           = () => { setStage('verified'); setRevokeState('idle'); };

  const checkRevocation = () => {
    setRevokeState('checking');
    setRevokeProgress(0);
    const ticks = [0, 150, 300, 500, 750, 1000];
    ticks.forEach((t, i) => setTimeout(() => setRevokeProgress((i / (ticks.length - 1)) * 100), t));
    setTimeout(() => setRevokeState('valid'), 1100);
  };

  const revokeLeaf = () => { setRevokeState('revoked'); setStage('revoked'); };

  const intSigned  = stage !== 'idle';
  const leafSigned = ['signed-leaf','verified','revoked'].includes(stage);
  const chainValid = ['verified','revoked'].includes(stage);

  const certStatus = (id: CertId) => {
    if (id === 'root') return 'trusted';
    if (id === 'intermediate') return intSigned ? 'signed' : 'pending';
    return leafSigned ? (stage === 'revoked' ? 'revoked' : 'signed') : 'pending';
  };

  const statusColor = (s: string) =>
    s === 'trusted' || s === 'signed' ? '#3fb950' : s === 'revoked' ? T.danger : T.textMuted;

  const certCard = (id: CertId) => {
    const c    = CERTS[id];
    const st   = certStatus(id);
    const col  = statusColor(st);
    const isActive = selected === id;

    return (
      <div key={id} onClick={() => setSelected(isActive ? null : id)} style={{ flex:1, minWidth:150, cursor:'pointer', borderRadius:12, border:`1.5px solid ${isActive ? c.color : col+'50'}`, background: isActive ? `${c.color}10` : T.panelBg, transition:'all 0.22s', position:'relative', overflow:'hidden', boxShadow: isActive ? `0 0 20px ${c.color}25` : 'none' }}>
        {/* Color accent stripe on top */}
        <div style={{ height:3, background: st === 'pending' ? T.borderColor : col, transition:'background 0.5s' }} />
        <div style={{ padding:'0.9rem' }}>
          {/* Label + status */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8, gap:6 }}>
            <span style={{ fontSize:'0.58rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.08em', color:T.textMuted }}>{c.label}</span>
            <span style={{ fontSize:'0.58rem', fontWeight:800, padding:'2px 6px', borderRadius:10, background:`${col}20`, color:col, border:`1px solid ${col}35`, whiteSpace:'nowrap' }}>
              {st === 'trusted' ? '✓ Self-signed' : st === 'signed' ? '✓ Signed' : st === 'revoked' ? '⛔ Revoked' : '○ Unsigned'}
            </span>
          </div>

          {/* CN */}
          <p style={{ margin:'0 0 3px', fontSize:'0.8rem', fontWeight:700, color:T.textPrimary, fontFamily:'monospace', lineHeight:1.3 }}>{c.cn}</p>
          <p style={{ margin:'0 0 8px', fontSize:'0.67rem', color:T.textMuted }}>{c.sigAlg}</p>

          {/* Mini stats */}
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {[['Key', c.keySize], ['Valid', c.validity], ['Alg', 'SHA-256']].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.62rem' }}>
                <span style={{ color:T.textMuted }}>{k}</span>
                <span style={{ color:T.textPrimary, fontFamily:'monospace', fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>

          <p style={{ margin:'8px 0 0', fontSize:'0.62rem', color:c.color, fontWeight:600 }}>Click to inspect →</p>
        </div>
      </div>
    );
  };

  const termLine = (label: string, value: string | null, highlight?: boolean) => {
    if (!value) return null;
    return (
      <div key={label} style={{ display:'grid', gridTemplateColumns:'170px 1fr', gap:'0 1rem', padding:'0.3rem 0', borderBottom:`1px solid ${T.termText}12` }}>
        <span style={{ fontSize:'0.7rem', color:'#7ee787', fontFamily:'monospace', userSelect:'text' }}>{label}:</span>
        <span style={{ fontSize:'0.7rem', color: highlight ? '#ffa657' : T.termText, fontFamily:'monospace', wordBreak:'break-all', userSelect:'text' }}>{value}</span>
      </div>
    );
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui, -apple-system, sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes pki-fade    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pki-sign    { 0%,100%{transform:scale(1)} 40%{transform:scale(1.12)} 70%{transform:scale(0.96)} }
        @keyframes pki-glow    { 0%,100%{box-shadow:0 0 0 0 #3fb95040} 50%{box-shadow:0 0 18px 6px #3fb95020} }
        @keyframes pki-progress{ from{width:0} to{width:100%} }
        @keyframes pki-dash    { to{stroke-dashoffset:-16} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #3fb950, #4493f8, #d29922)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#3fb95015', border:'1px solid #3fb95030', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔐</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>PKI & Certificate Chain</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Build and inspect a three-tier X.509 certificate hierarchy. Sign certs, verify the chain of trust, and simulate OCSP/CRL revocation.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Tier Depth', val:'3'},{label:'Revocation', val:'2'},{label:'Sig Alg', val:'SHA-256'}].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#3fb950' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Chain Diagram ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.5rem', marginBottom:'1.5rem', ...(chainValid&&stage!=='revoked'?{animation:'pki-glow 2s ease-out 1'}:{}) }}>
          <div style={{ display:'flex', alignItems:'stretch', gap:'0.6rem', flexWrap:'wrap' }}>

            {certCard('root')}

            {/* Arrow 1 */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5, minWidth:60 }}>
              {!intSigned ? (
                <button onClick={signIntermediate} disabled={animating} style={{ cursor:animating?'default':'pointer', background:T.accent, color:'#fff', border:'none', borderRadius:8, padding:'0.45rem 0.8rem', fontSize:'0.72rem', fontWeight:700, fontFamily:'inherit', opacity:animating?0.6:1, transition:'all 0.2s', ...(animating?{animation:'pki-sign 0.95s ease-in-out'}:{}) }}>
                  {animating ? '✍️ Signing…' : '→ Sign'}
                </button>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <svg width="40" height="20" viewBox="0 0 40 20">
                    <path d="M2,10 L34,10" stroke="#3fb950" strokeWidth="2" fill="none" strokeDasharray="4 2" style={{ animation:'pki-dash 0.8s linear infinite' }} />
                    <polygon points="34,6 40,10 34,14" fill="#3fb950" />
                  </svg>
                  <span style={{ fontSize:'0.58rem', color:'#3fb950', fontWeight:700, fontFamily:'monospace' }}>sha256RSA</span>
                </div>
              )}
            </div>

            {certCard('intermediate')}

            {/* Arrow 2 */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5, minWidth:60 }}>
              {intSigned && !leafSigned ? (
                <button onClick={signLeaf} disabled={animating} style={{ cursor:animating?'default':'pointer', background:T.accent, color:'#fff', border:'none', borderRadius:8, padding:'0.45rem 0.8rem', fontSize:'0.72rem', fontWeight:700, fontFamily:'inherit', opacity:animating?0.6:1, transition:'all 0.2s', ...(animating?{animation:'pki-sign 0.95s ease-in-out'}:{}) }}>
                  {animating ? '✍️ Signing…' : '→ Sign'}
                </button>
              ) : leafSigned ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <svg width="40" height="20" viewBox="0 0 40 20">
                    <path d="M2,10 L34,10" stroke={stage==='revoked'?T.danger:'#3fb950'} strokeWidth="2" fill="none" strokeDasharray="4 2" style={{ animation:'pki-dash 0.8s linear infinite' }} />
                    <polygon points="34,6 40,10 34,14" fill={stage==='revoked'?T.danger:'#3fb950'} />
                  </svg>
                  <span style={{ fontSize:'0.58rem', color: stage==='revoked'?T.danger:'#3fb950', fontWeight:700, fontFamily:'monospace' }}>sha256RSA</span>
                </div>
              ) : (
                <div style={{ width:40, height:2, background:T.borderColor, borderRadius:1 }} />
              )}
            </div>

            {certCard('leaf')}
          </div>

          {/* Verify + result */}
          {leafSigned && !chainValid && (
            <div style={{ marginTop:'1.25rem', textAlign:'center', animation:'pki-fade 0.3s ease-out' }}>
              <button onClick={verify} style={{ cursor:'pointer', background:'#3fb950', color:'#fff', border:'none', borderRadius:9, padding:'0.65rem 2rem', fontWeight:700, fontSize:'0.88rem', fontFamily:'inherit', boxShadow:'0 2px 12px #3fb95030' }}>
                ✓ Verify Chain
              </button>
            </div>
          )}

          {chainValid && (
            <div style={{ marginTop:'1.25rem', background: stage==='revoked' ? `${T.danger}12` : '#3fb95012', border:`1px solid ${stage==='revoked'?T.danger:'#3fb950'}40`, borderRadius:10, padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:12, animation:'pki-fade 0.3s ease-out' }}>
              <span style={{ fontSize:'1.4rem', lineHeight:1 }}>{stage==='revoked' ? '⛔' : '✅'}</span>
              <div>
                <p style={{ margin:'0 0 3px', fontWeight:700, fontSize:'0.88rem', color: stage==='revoked'?T.danger:'#3fb950' }}>
                  {stage==='revoked' ? 'Certificate Revoked — Connection Refused' : 'Chain Valid — Trust Established'}
                </p>
                <p style={{ margin:0, fontSize:'0.76rem', color:T.textSecondary, lineHeight:1.55 }}>
                  {stage==='revoked'
                    ? 'Leaf cert serial 03:A9:F2:44:C1:88:2B:11 found in CRL/OCSP. Browsers return ERR_CERT_REVOKED.'
                    : 'Root → Intermediate → Leaf signatures verified. Each issuer field matches the parent subject. Certificate is within its validity period.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Terminal Inspector ── */}
        {selected && (
          <div style={{ marginBottom:'1.5rem', borderRadius:14, overflow:'hidden', border:`1px solid ${CERTS[selected].color}50`, animation:'pki-fade 0.25s ease-out' }}>
            {/* Terminal chrome */}
            <div style={{ background:'#1a1a2e', padding:'0.6rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }} />)}
              </div>
              <span style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'#8b949e', flex:1, textAlign:'center' }}>
                openssl x509 -text -noout &lt;{CERTS[selected].label.toLowerCase().replace(/\s+/g,'_')}.pem&gt;
              </span>
              <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:6, background:`${CERTS[selected].color}25`, color:CERTS[selected].color, border:`1px solid ${CERTS[selected].color}40` }}>{CERTS[selected].label}</span>
            </div>
            {/* Terminal body */}
            <div style={{ background:'#0d1117', padding:'1rem 1.25rem', maxHeight:340, overflowY:'auto' }}>
              <p style={{ margin:'0 0 8px', fontFamily:'monospace', fontSize:'0.7rem', color:'#e6edf3' }}>Certificate:</p>
              <p style={{ margin:'0 0 4px 12px', fontFamily:'monospace', fontSize:'0.7rem', color:'#e6edf3' }}>Data:</p>
              {termLine('        Version', '3 (0x2)')}
              {termLine('        Serial Number', CERTS[selected].serial, true)}
              {termLine('    Signature Algorithm', CERTS[selected].sigAlg)}
              {termLine('        Issuer', CERTS[selected].issuer)}
              <div style={{ padding:'0.3rem 0', borderBottom:'1px solid #ffffff12' }}>
                <span style={{ fontSize:'0.7rem', color:'#7ee787', fontFamily:'monospace' }}>        Validity:</span>
                <div style={{ marginLeft:16 }}>
                  {termLine('            Not Before', CERTS[selected].notBefore)}
                  {termLine('            Not After', CERTS[selected].notAfter, CERTS[selected].label==='End-Entity (Leaf)')}
                </div>
              </div>
              {termLine('        Subject', CERTS[selected].subject)}
              {termLine('        Public Key Algorithm', CERTS[selected].keyAlg)}
              <div style={{ padding:'0.3rem 0', borderBottom:'1px solid #ffffff12' }}>
                <span style={{ fontSize:'0.7rem', color:'#7ee787', fontFamily:'monospace' }}>        X509v3 Extensions:</span>
                <div style={{ marginLeft:16 }}>
                  {termLine('            Basic Constraints: critical', CERTS[selected].basicConstraints)}
                  {termLine('            Key Usage: critical', CERTS[selected].keyUsage)}
                  {CERTS[selected].extKeyUsage && termLine('            Extended Key Usage', CERTS[selected].extKeyUsage)}
                  {CERTS[selected].san          && termLine('            Subject Alt Name', CERTS[selected].san, true)}
                  {CERTS[selected].cdp          && termLine('            CRL Distribution Points', CERTS[selected].cdp)}
                  {CERTS[selected].ocsp         && termLine('            Authority Info Access (OCSP)', CERTS[selected].ocsp)}
                </div>
              </div>
              {termLine('    Signature Algorithm', CERTS[selected].sigAlg)}
              <p style={{ margin:'0.4rem 0 0', fontFamily:'monospace', fontSize:'0.7rem', color:'#8b949e' }}>        49:2a:f1:7e:... [signature bytes omitted]</p>
            </div>
            {/* Insight bar */}
            <div style={{ background:T.cardBg, padding:'0.9rem 1.25rem', borderTop:`1px solid ${T.borderColor}` }}>
              <p style={{ margin:0, fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.65 }}>
                <strong style={{ color:CERTS[selected].color }}>
                  {INSIGHT[selected].heading}:{' '}
                </strong>
                {INSIGHT[selected].body}
              </p>
            </div>
          </div>
        )}

        {/* ── Revocation ── */}
        {chainValid && stage !== 'revoked' && (
          <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.5rem', animation:'pki-fade 0.3s ease-out' }}>
            <h3 style={{ margin:'0 0 1rem', fontSize:'0.9rem', fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
              <span>🔍</span> Revocation Check
            </h3>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
              {(['ocsp','crl'] as const).map(m => (
                <button key={m} onClick={() => setRevokeCheck(m)} style={{ cursor:'pointer', padding:'0.35rem 0.9rem', borderRadius:8, border:`1px solid ${revokeCheck===m?T.accent:T.borderColor}`, background:revokeCheck===m?T.accentSubtle:T.panelBg, color:revokeCheck===m?T.accent:T.textMuted, fontWeight:700, fontSize:'0.75rem', fontFamily:'inherit', transition:'all 0.15s' }}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ background:T.panelBg, border:`1px solid ${T.borderColor}`, borderRadius:9, padding:'0.85rem 1rem', marginBottom:'1rem', fontSize:'0.78rem', color:T.textSecondary, lineHeight:1.65 }}>
              {revokeCheck==='ocsp'
                ? <><strong style={{ color:T.textPrimary }}>OCSP</strong> — client sends a real-time stapled query to <code style={{ background:T.insetBg, padding:'1px 4px', borderRadius:3, fontFamily:'monospace', fontSize:'0.72rem' }}>http://ocsp.netforge.example</code>. Faster than CRL. OCSP stapling has the server pre-fetch and cache the response, reducing latency and protecting privacy.</>
                : <><strong style={{ color:T.textPrimary }}>CRL</strong> — a signed list of revoked serial numbers published by the CA at <code style={{ background:T.insetBg, padding:'1px 4px', borderRadius:3, fontFamily:'monospace', fontSize:'0.72rem' }}>http://crl.netforge.example/intermediate.crl</code>. Downloaded periodically by clients. Can be megabytes for large CAs — OCSP is preferred for performance.</>}
            </div>

            {/* Progress bar (during check) */}
            {revokeState==='checking' && (
              <div style={{ marginBottom:'1rem', animation:'pki-fade 0.2s ease-out' }}>
                <div style={{ height:4, borderRadius:2, background:T.borderColor, overflow:'hidden', marginBottom:6 }}>
                  <div style={{ height:'100%', background:T.accent, borderRadius:2, width:`${revokeProgress}%`, transition:'width 0.15s ease-out' }} />
                </div>
                <p style={{ margin:0, fontSize:'0.72rem', color:T.textMuted }}>Querying {revokeCheck==='ocsp'?'OCSP responder':'CRL distribution point'}…</p>
              </div>
            )}

            {revokeState==='valid' && (
              <div style={{ marginBottom:'1rem', background:'#3fb95012', border:'1px solid #3fb95040', borderRadius:8, padding:'0.7rem 1rem', display:'flex', alignItems:'center', gap:8, animation:'pki-fade 0.25s ease-out' }}>
                <span style={{ fontSize:'1rem' }}>✅</span>
                <div>
                  <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'0.8rem', color:'#3fb950' }}>Certificate Status: GOOD</p>
                  <p style={{ margin:0, fontSize:'0.7rem', color:T.textSecondary, fontFamily:'monospace' }}>Serial 03:A9:F2:44:C1:88:2B:11 — not present in revocation list. Status: &#123; certStatus: good (0) &#125;</p>
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
              <button onClick={checkRevocation} disabled={revokeState==='checking'} style={{ cursor:'pointer', background:T.accent, color:'#fff', border:'none', borderRadius:8, padding:'0.55rem 1.1rem', fontWeight:700, fontSize:'0.8rem', fontFamily:'inherit', opacity:revokeState==='checking'?0.6:1, transition:'opacity 0.2s' }}>
                {revokeState==='checking' ? '⏳ Querying…' : `Check via ${revokeCheck.toUpperCase()}`}
              </button>
              <button onClick={revokeLeaf} style={{ cursor:'pointer', background:`${T.danger}15`, color:T.danger, border:`1px solid ${T.danger}40`, borderRadius:8, padding:'0.55rem 1.1rem', fontWeight:700, fontSize:'0.8rem', fontFamily:'inherit' }}>
                ⛔ Simulate Revocation
              </button>
            </div>
          </div>
        )}
        <LabEduPanel cards={PKI_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default PkiLab;
