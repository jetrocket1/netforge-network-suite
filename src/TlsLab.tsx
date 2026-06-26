import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

type TlsDir = 'cs' | 'sc';
type TlsEnc = 'plain' | 'handshake' | 'app' | 'early';

interface TlsStep {
  dir: TlsDir;
  name: string;
  enc: TlsEnc;
  title: string;
  detail: string;
  fields: { k: string; v: string }[];
  keyEvent?: { label: string; color: string };
}
interface TlsScenario { name: string; desc: string; steps: TlsStep[]; }

const ENC_LABEL: Record<TlsEnc, string> = {
  plain: 'PLAINTEXT', handshake: 'HS ENCRYPTED', app: 'APP ENCRYPTED', early: '0-RTT EARLY',
};

const SCENARIOS: TlsScenario[] = [
  {
    name: 'TLS 1.3 Full', desc: 'Full 1-RTT handshake — new session, no prior PSK',
    steps: [
      {
        dir: 'cs', name: 'ClientHello', enc: 'plain',
        title: 'ClientHello — client advertises capabilities',
        detail: 'The client opens a TCP connection and immediately sends ClientHello. It lists supported cipher suites, TLS versions, and — critically — a key_share extension containing the client\'s ECDH public key for x25519. This means the server can start deriving shared keys after just one message, enabling TLS 1.3\'s 1-RTT improvement.',
        fields: [
          { k: 'TLS Version Offered', v: 'TLS 1.3 (legacy: TLS 1.2 for middlebox compat)' },
          { k: 'Cipher Suites', v: 'TLS_AES_256_GCM_SHA384, TLS_CHACHA20_POLY1305_SHA256' },
          { k: 'Key Share (x25519)', v: '0x8e3b2f... (32-byte ECDH public key)' },
          { k: 'SNI', v: 'www.example.com' },
          { k: 'Supported Groups', v: 'x25519, secp256r1, x448' },
          { k: 'Session Ticket', v: '(none — new session)' },
        ],
      },
      {
        dir: 'sc', name: 'ServerHello', enc: 'plain',
        title: 'ServerHello — server picks cipher and sends key share',
        detail: 'The server picks a cipher suite, responds with its own ECDH public key, and that is the last plaintext message. Both sides can now independently compute the same ECDH shared secret and derive Handshake Traffic Keys using HKDF. Everything after this is encrypted.',
        fields: [
          { k: 'Chosen Cipher', v: 'TLS_AES_256_GCM_SHA384' },
          { k: 'Key Share (x25519)', v: '0x4f7a9c... (32-byte ECDH public key)' },
          { k: 'TLS Version Selected', v: 'TLS 1.3' },
        ],
        keyEvent: { label: 'ECDH → Handshake Traffic Keys derived (both sides)', color: '#4493f8' },
      },
      {
        dir: 'sc', name: '{EncryptedExtensions}', enc: 'handshake',
        title: 'EncryptedExtensions — server sends hidden extensions',
        detail: 'In TLS 1.2, all extensions were sent plaintext. In TLS 1.3 the server moves extensions into this encrypted message, hiding negotiation details from passive observers. This is the first encrypted record in the handshake.',
        fields: [
          { k: 'ALPN', v: 'h2 (HTTP/2 negotiated)' },
          { k: 'Max Fragment Length', v: '16384 bytes' },
          { k: 'Encrypted', v: 'Yes — using server_handshake_traffic_secret' },
        ],
      },
      {
        dir: 'sc', name: '{Certificate}', enc: 'handshake',
        title: 'Certificate — server proves its identity (encrypted)',
        detail: 'The server sends its certificate chain — fully encrypted in TLS 1.3. A passive attacker cannot determine which certificate (and domain) is being presented. The client verifies the chain against its trusted root CA store.',
        fields: [
          { k: 'Subject', v: 'CN=www.example.com' },
          { k: 'Issuer', v: 'DigiCert TLS RSA SHA256 2020 CA1' },
          { k: 'Valid', v: '2025-01-15  →  2026-01-15' },
          { k: 'Public Key', v: 'RSA-2048 / SPKI' },
          { k: 'SANs', v: 'www.example.com, example.com' },
          { k: 'OCSP Staple', v: 'Included (revocation proof)' },
        ],
      },
      {
        dir: 'sc', name: '{CertificateVerify}', enc: 'handshake',
        title: 'CertificateVerify — server proves it holds the private key',
        detail: 'Owning a certificate is not enough — the server must prove it also holds the matching private key. It signs a hash of the complete handshake transcript using the certificate\'s private key. The client verifies this signature against the public key in the certificate.',
        fields: [
          { k: 'Algorithm', v: 'rsa_pss_rsae_sha256' },
          { k: 'Signs Over', v: 'SHA-256 of full handshake transcript' },
          { k: 'Purpose', v: 'Proves server holds the cert private key' },
        ],
      },
      {
        dir: 'sc', name: '{Finished}', enc: 'handshake',
        title: 'Server Finished — handshake transcript MAC',
        detail: 'The server sends an HMAC over the entire handshake transcript using the server_finished_key. The client verifies this to confirm no tampering. After verification, both sides independently derive Application Traffic Keys.',
        fields: [
          { k: 'Verify Data', v: 'HMAC-SHA384 over handshake transcript' },
          { k: 'Key', v: 'Derived from server_handshake_traffic_secret' },
        ],
        keyEvent: { label: 'Handshake verified → Application Traffic Keys derived', color: '#3fb950' },
      },
      {
        dir: 'cs', name: '{Finished}', enc: 'handshake',
        title: 'Client Finished — client confirms the handshake',
        detail: 'The client sends its own Finished message. This confirms the client received and verified everything correctly. The handshake is now fully authenticated on both sides. Application data can flow immediately after.',
        fields: [
          { k: 'Verify Data', v: 'HMAC-SHA384 over handshake transcript' },
          { k: 'Key', v: 'Derived from client_handshake_traffic_secret' },
          { k: 'RTT Count', v: '1 round trip from ClientHello to this point' },
        ],
      },
      {
        dir: 'cs', name: '[Application Data]', enc: 'app',
        title: 'Application Data — encrypted HTTP/2 traffic flows',
        detail: 'All application data is encrypted using AES-256-GCM with per-record nonces. Each TLS record has authentication tags that detect tampering. The connection provides forward secrecy — if the server private key is later stolen, past sessions cannot be decrypted because the ephemeral ECDH key was discarded.',
        fields: [
          { k: 'Encryption', v: 'AES-256-GCM (AEAD)' },
          { k: 'Key Source', v: 'client/server_application_traffic_secret_0' },
          { k: 'Forward Secrecy', v: 'Yes — ephemeral x25519 keys discarded after use' },
          { k: 'Record Auth', v: '16-byte GHASH tag per record' },
        ],
      },
    ],
  },
  {
    name: 'TLS 1.3 0-RTT', desc: 'Session resumption with Pre-Shared Key — sends data before server responds',
    steps: [
      {
        dir: 'cs', name: 'ClientHello + early_data', enc: 'early',
        title: 'ClientHello with 0-RTT early data',
        detail: 'If the client has a session ticket from a previous connection (a Pre-Shared Key), it can send application data alongside the ClientHello — before the server responds. This eliminates the 1-RTT delay. Early data is encrypted with a key derived from the PSK, but is not forward-secret and is vulnerable to replay attacks.',
        fields: [
          { k: 'PSK Identity', v: 'Session ticket from prior connection' },
          { k: 'Early Data', v: 'HTTP GET /index.html (sent immediately)' },
          { k: 'early_data Extension', v: 'max_early_data_size: 16384 bytes' },
          { k: 'Replay Risk', v: 'Server must implement anti-replay (nonce store)' },
        ],
        keyEvent: { label: 'PSK → Early Traffic Key derived (client only)', color: '#a855f7' },
      },
      {
        dir: 'sc', name: 'ServerHello + {EncryptedExtensions}', enc: 'handshake',
        title: 'Server accepts PSK and 0-RTT data',
        detail: 'The server selects the PSK, derives handshake keys, and sends EncryptedExtensions with early_data accepted. If the server rejects 0-RTT (e.g., replay detected), early_data is rejected and the client must retransmit that data in normal 1-RTT flow.',
        fields: [
          { k: 'PSK Selected', v: 'Identity 0 (from session ticket)' },
          { k: 'early_data', v: 'accepted' },
          { k: 'Key Schedule', v: 'PSK-based HKDF derivation' },
        ],
        keyEvent: { label: 'PSK + ECDH → Handshake Keys derived', color: '#4493f8' },
      },
      {
        dir: 'sc', name: '{Finished}', enc: 'handshake',
        title: 'Server Finished — application keys derivable',
        detail: 'Server sends Finished (Certificate omitted for PSK resumption — identity already established from prior session). Both sides derive Application Traffic Keys.',
        fields: [
          { k: 'Certificate', v: 'Omitted (PSK proves prior authentication)' },
          { k: 'Finished', v: 'HMAC over handshake transcript' },
        ],
        keyEvent: { label: 'Application Traffic Keys derived', color: '#3fb950' },
      },
      {
        dir: 'cs', name: '{Finished} + [App Data]', enc: 'app',
        title: 'Client Finished and full application data',
        detail: 'Client sends its Finished and continues with normal application data. Total handshake overhead: 0 additional round trips if 0-RTT was accepted. The first HTTP request arrives at the server before the TLS handshake completes from the server\'s perspective.',
        fields: [
          { k: 'Effective RTT', v: '0 (data sent with ClientHello)' },
          { k: 'Use Case', v: 'Repeat connections to same server (CDNs, APIs)' },
          { k: 'Security Note', v: 'Only safe for idempotent requests (GET, HEAD)' },
        ],
      },
    ],
  },
  {
    name: 'TLS 1.2 (legacy)', desc: 'Legacy 2-RTT handshake — certificate and extensions sent in plaintext',
    steps: [
      {
        dir: 'cs', name: 'ClientHello', enc: 'plain',
        title: 'ClientHello — no key share, just preferences',
        detail: 'TLS 1.2 ClientHello does not include a key share. The client only lists what it supports — the actual key exchange happens later after the server picks a mode. This costs an extra round trip vs TLS 1.3.',
        fields: [
          { k: 'TLS Version', v: 'TLS 1.2 (0x0303)' },
          { k: 'Cipher Suites', v: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384, ...' },
          { k: 'Extensions', v: 'SNI, supported_groups, signature_algorithms' },
          { k: 'Key Share', v: 'None — not in TLS 1.2' },
        ],
      },
      {
        dir: 'sc', name: 'ServerHello', enc: 'plain',
        title: 'ServerHello — picks cipher, returns random',
        detail: 'Server picks the cipher suite and returns a server random. No key material is exchanged yet — that\'s the key cost of TLS 1.2 vs 1.3.',
        fields: [
          { k: 'Chosen Cipher', v: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384' },
          { k: 'Server Random', v: '32 bytes (used in key derivation)' },
        ],
      },
      {
        dir: 'sc', name: 'Certificate', enc: 'plain',
        title: 'Certificate — SENT IN PLAINTEXT (TLS 1.2 weakness)',
        detail: 'In TLS 1.2 the certificate is sent in plaintext. Any passive observer can see exactly which certificate (and domain) the server is presenting, even if they cannot read application data. TLS 1.3 encrypts the certificate.',
        fields: [
          { k: 'Subject', v: 'CN=www.example.com (VISIBLE to attacker)' },
          { k: 'Certificate Chain', v: 'End Entity → Intermediate → Root (all plaintext)' },
          { k: 'TLS 1.3 Fix', v: 'Certificate moved into encrypted EncryptedExtensions' },
        ],
      },
      {
        dir: 'sc', name: 'ServerKeyExchange', enc: 'plain',
        title: 'ServerKeyExchange — ECDHE parameters (plaintext)',
        detail: 'For ECDHE cipher suites, the server sends its ephemeral key exchange parameters signed with its private key. This message does not exist in TLS 1.3 (folded into ServerHello key_share).',
        fields: [
          { k: 'Curve', v: 'secp256r1 (NIST P-256)' },
          { k: 'Server ECDH Pub Key', v: '0x04 3a9f... (65 bytes, uncompressed)' },
          { k: 'Signature', v: 'RSA-PKCS1-SHA256 over server params + randoms' },
        ],
      },
      {
        dir: 'sc', name: 'ServerHelloDone', enc: 'plain',
        title: 'ServerHelloDone — server done with its first flight',
        detail: 'A simple marker message indicating the server has finished its first flight of messages. The client now sends its key exchange material. This message does not exist in TLS 1.3.',
        fields: [{ k: 'Content', v: 'Empty — just a signal' }],
      },
      {
        dir: 'cs', name: 'ClientKeyExchange', enc: 'plain',
        title: 'ClientKeyExchange — client sends its ECDH key',
        detail: 'The client sends its ECDH public key. Both sides can now derive the pre-master secret, then the master secret, then the session keys. This is the second round trip. TLS 1.3 eliminated this by including the key share in ClientHello.',
        fields: [
          { k: 'Client ECDH Pub Key', v: '0x04 8b2c... (65 bytes)' },
          { k: 'Pre-Master Secret', v: 'Derived from ECDH (never transmitted)' },
        ],
      },
      {
        dir: 'cs', name: 'ChangeCipherSpec', enc: 'plain',
        title: 'ChangeCipherSpec + Client Finished',
        detail: 'A legacy compatibility message signalling the switch to encrypted communication. In TLS 1.3 this is only sent for middlebox compatibility and carries no semantic meaning.',
        fields: [
          { k: 'Message', v: 'ChangeCipherSpec (legacy signal)' },
          { k: 'Followed by', v: 'Finished (encrypted with derived session keys)' },
        ],
        keyEvent: { label: 'Session Keys derived (master_secret → PRF)', color: '#4493f8' },
      },
      {
        dir: 'sc', name: 'ChangeCipherSpec + {Finished}', enc: 'handshake',
        title: 'Server ChangeCipherSpec + Server Finished',
        detail: 'Server sends its own ChangeCipherSpec and Finished. After mutual Finished verification, both sides are authenticated and the handshake is complete. This is the second full round trip since ClientHello.',
        fields: [
          { k: 'Total Round Trips', v: '2 (vs 1 for TLS 1.3)' },
          { k: 'TLS 1.3 Advantage', v: 'Saves ~20–50ms per connection' },
        ],
        keyEvent: { label: 'Handshake complete — Application Data can flow', color: '#3fb950' },
      },
      {
        dir: 'cs', name: '[Application Data]', enc: 'app',
        title: 'Application Data — encrypted but weaker guarantees',
        detail: 'Application data flows encrypted. However, TLS 1.2 still allowed RSA key exchange (no forward secrecy) and weak ciphers. TLS 1.3 mandates ephemeral key exchange and removed all weak cipher suites.',
        fields: [
          { k: 'Encryption', v: 'AES-256-GCM (if ECDHE suite chosen)' },
          { k: 'Forward Secrecy', v: 'Yes IF ECDHE was negotiated (not RSA)' },
          { k: 'Weak Ciphers Allowed', v: 'RC4, 3DES, CBC — still negotiable in TLS 1.2' },
        ],
      },
    ],
  },
];

const TLS_EDU: EduCard[] = [
  { type: 'exam', title: 'TLS 1.3 vs TLS 1.2 — Key Exam Differences', body: 'TLS 1.3: 1-RTT handshake, certificate encrypted, forward secrecy mandatory (ECDHE only), weak ciphers removed (no RC4/3DES/CBC). TLS 1.2: 2-RTT handshake, certificate sent in plaintext, RSA key exchange allowed (no forward secrecy), weak ciphers negotiable. Exam question: "Which TLS version sends the server certificate encrypted?" Answer: TLS 1.3 only.' },
  { type: 'exam', title: 'Forward Secrecy — Why It Matters', body: 'TLS 1.3 mandates ephemeral key exchange (ECDHE). Session keys are derived from a freshly-generated ECDH key pair discarded after use. If an attacker records today\'s encrypted traffic and later steals the server\'s RSA private key, they cannot decrypt past sessions — the ephemeral key no longer exists. TLS 1.2 with RSA key exchange has no forward secrecy.' },
  { type: 'gotcha', title: '0-RTT Replay Attack Risk', body: '0-RTT early data is sent before the server responds, so the server cannot include a fresh nonce to prevent replay. An attacker who captures a ClientHello + early_data can resend it to trigger the same server-side action (e.g., a payment or state change). Servers must implement replay detection (nonce stores, time windows) and clients must only send idempotent requests (GET/HEAD) as 0-RTT data.' },
  { type: 'realworld', title: 'Certificate Chain Validation in Practice', body: 'Clients trust Root CAs pre-installed in the OS or browser. The server\'s cert must chain to one of those roots via intermediates. Each link is verified by the issuer\'s digital signature. OCSP stapling lets the server include a timestamped revocation proof so the client doesn\'t need a separate revocation request — critical for performance and privacy (OCSP queries leak browsing history to the CA).' },
  { type: 'config', title: 'Enforcing TLS 1.3 Only — Nginx Config', body: 'Disable older TLS versions and restrict to strong ciphers.', code: `# nginx.conf — TLS hardening
ssl_protocols TLSv1.3;                    # drop 1.2 entirely
ssl_prefer_server_ciphers off;            # TLS 1.3 ignores this anyway

# If you must keep TLS 1.2 for legacy clients:
# ssl_protocols TLSv1.2 TLSv1.3;
# ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

# Enable OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 1.1.1.1 valid=300s;

# HSTS — tell browsers to only use HTTPS for 1 year
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` },
];

const SCENARIO_META = [
  { rtt: '1', version: 'TLS 1.3' },
  { rtt: '0', version: '0-RTT' },
  { rtt: '2', version: 'TLS 1.2' },
];

const encColor = (e: TlsEnc, T: ReturnType<typeof getLabTheme>) =>
  ({ plain: T.warning, handshake: T.accent, app: T.success, early: '#a855f7' }[e]);

const TYPE_COLORS: Record<TlsEnc, string> = { plain: '#d29922', handshake: '#4493f8', app: '#3fb950', early: '#a855f7' };

interface TlsLabProps { isDarkMode?: boolean; }

export const TlsLab: React.FC<TlsLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [scenario, setScenario] = useState(0);
  const [step,     setStep]     = useState(0);   // # of steps revealed
  const [auto,     setAuto]     = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const msgBoxRef = useRef<HTMLDivElement>(null);

  const sc   = SCENARIOS[scenario];
  const meta = SCENARIO_META[scenario];

  // Derive connection state from the last revealed step
  const lastEnc = step > 0 ? sc.steps[step - 1].enc : null;
  const connState: 'idle' | 'handshake' | 'early' | 'secure' =
    step === 0          ? 'idle'
    : lastEnc === 'app' ? 'secure'
    : lastEnc === 'early' ? 'early'
    : 'handshake';

  useEffect(() => { setStep(0); setSelected(null); setAuto(false); }, [scenario]);

  useEffect(() => {
    if (!auto) return;
    if (step >= sc.steps.length) { setAuto(false); return; }
    const id = setTimeout(() => setStep(s => s + 1), 800);
    return () => clearTimeout(id);
  }, [auto, step, sc.steps.length]);

  useEffect(() => {
    if (msgBoxRef.current) msgBoxRef.current.scrollTop = msgBoxRef.current.scrollHeight;
  }, [step]);

  const advance = () => { if (step < sc.steps.length) setStep(s => s + 1); };
  const reset   = () => { setStep(0); setSelected(null); setAuto(false); };

  const selMsg = selected !== null && selected < step ? sc.steps[selected] : null;

  const STATUS = {
    idle:      { color: T.textMuted,  icon: '🔒', label: 'NOT STARTED',                     sub: 'Press Step → or Auto Play to begin the TLS handshake' },
    handshake: { color: '#d29922',    icon: '⏳', label: 'HANDSHAKE IN PROGRESS',            sub: 'Negotiating — no application data flows until the handshake completes' },
    early:     { color: '#a855f7',    icon: '⚡', label: 'EARLY DATA FLOWING (0-RTT)',       sub: '0-RTT data sent with ClientHello — replay risk applies; use only for idempotent requests' },
    secure:    { color: '#3fb950',    icon: '🔓', label: 'SECURE CONNECTION ESTABLISHED',    sub: `Handshake complete — application data encrypted with ${meta.version}` },
  }[connState];

  const ENTITIES = [
    { label: 'Client', sublabel: 'Browser / App', icon: '💻', color: '#4493f8' },
    { label: 'Server', sublabel: 'Web Server',    icon: '🖥️',  color: '#3fb950' },
  ];

  const STEP_H = 68;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui,-apple-system,sans-serif', color: T.textPrimary }}>
      <style>{`
        @keyframes tls-fade   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tls-ltr    { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }
        @keyframes tls-rtl    { from{clip-path:inset(0 0 0 100%)} to{clip-path:inset(0 0 0 0%)} }
        @keyframes tls-pulse  { 0%,100%{box-shadow:0 0 0 0 #3fb95040} 50%{box-shadow:0 0 14px 4px #3fb95025} }
        @keyframes tls-blink  { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${T.cardBg} 0%,${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#4493f8,#3fb950,#a855f7)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔐</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>TLS Handshake Visualiser</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.success}20`, color:T.success, border:`1px solid ${T.success}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Free</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Step through TLS 1.3 and TLS 1.2 handshakes and see exactly which messages are encrypted, when keys are derived, and why 1.3 is faster and more secure.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'Steps', val:String(sc.steps.length)},{label:'Round Trips',val:meta.rtt},{label:'Version',val:meta.version}].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem', fontWeight:800, color:'#4493f8' }}>{s.val}</div>
                <div style={{ fontSize:'0.6rem', color:T.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'0 2rem 2rem' }}>

        {/* ── Controls ── */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.25rem', alignItems:'center', background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'0.75rem 1rem' }}>
          <span style={{ fontSize:'0.7rem', fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em' }}>Scenario:</span>
          {SCENARIOS.map((s, i) => (
            <button key={i} onClick={() => setScenario(i)} style={{ cursor:'pointer', padding:'0.3rem 0.9rem', borderRadius:8, border:`1px solid ${scenario===i ? T.accent : T.borderColor}`, background:scenario===i ? T.accentSubtle : T.panelBg, color:scenario===i ? T.accent : T.textMuted, fontWeight:700, fontSize:'0.75rem', fontFamily:'inherit', transition:'all 0.15s' }}>
              {s.name}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:'0.5rem' }}>
            <button onClick={() => setAuto(true)} disabled={auto || step >= sc.steps.length} style={{ cursor:'pointer', background:T.accent, color:'#fff', border:'none', borderRadius:8, padding:'0.35rem 0.85rem', fontSize:'0.75rem', fontWeight:700, fontFamily:'inherit', opacity:auto||step>=sc.steps.length?0.4:1, transition:'opacity 0.2s' }}>▶ Auto Play</button>
            <button onClick={advance} disabled={auto || step >= sc.steps.length} style={{ cursor:'pointer', background:T.panelBg, color:T.textSecondary, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.35rem 0.85rem', fontSize:'0.75rem', fontWeight:700, fontFamily:'inherit', opacity:auto||step>=sc.steps.length?0.4:1 }}>Step →</button>
            <button onClick={reset} style={{ cursor:'pointer', background:T.panelBg, color:T.textMuted, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.35rem 0.75rem', fontSize:'0.75rem', fontFamily:'inherit' }}>↺ Reset</button>
          </div>
        </div>

        {/* ── Connection Status Banner ── */}
        <div style={{ marginBottom:'1.25rem', padding:'0.75rem 1.25rem', borderRadius:12, background:`${STATUS.color}12`, border:`1px solid ${STATUS.color}40`, display:'flex', alignItems:'center', gap:12, transition:'all 0.4s' }}>
          <span style={{ fontSize:'1.4rem', lineHeight:1, ...(connState==='handshake'?{animation:'tls-blink 1.2s infinite'}:{}) }}>{STATUS.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:'0.82rem', color:STATUS.color, letterSpacing:'0.05em' }}>{STATUS.label}</div>
            <div style={{ fontSize:'0.7rem', color:T.textMuted, marginTop:2 }}>{STATUS.sub}</div>
          </div>
          {/* Enc legend */}
          <div style={{ display:'flex', gap:'0.75rem', flexShrink:0, flexWrap:'wrap' }}>
            {(['plain','handshake','app','early'] as TlsEnc[]).map(e => (
              <div key={e} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:18, height:3, background:encColor(e, T), borderRadius:2, opacity:e==='plain'?0.7:1 }} />
                <span style={{ fontSize:'0.58rem', color:T.textMuted, fontWeight:600 }}>{ENC_LABEL[e]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sequence Diagram ── */}
        <div ref={msgBoxRef} style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, padding:'1.25rem', marginBottom:'1.25rem', ...(connState==='secure'?{animation:'tls-pulse 2s ease-out 1'}:{}) }}>

          {/* Entity headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.75rem' }}>
            {ENTITIES.map((e, ei) => {
              const lastMsg = step > 0 ? sc.steps[step-1] : null;
              const isActive = lastMsg !== null && ((ei === 0 && lastMsg.dir === 'cs') || (ei === 1 && lastMsg.dir === 'sc') || (ei === 0 && lastMsg.dir === 'sc') || (ei === 1 && lastMsg.dir === 'cs'));
              const isSender = lastMsg !== null && ((ei === 0 && lastMsg.dir === 'cs') || (ei === 1 && lastMsg.dir === 'sc'));
              return (
                <div key={e.label} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'0.5rem' }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:`${e.color}15`, border:`2px solid ${isActive ? e.color : e.color+'40'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', transition:'all 0.3s', ...(isSender?{boxShadow:`0 0 16px ${e.color}40`}:{}) }}>
                    {e.icon}
                  </div>
                  <span style={{ fontSize:'0.72rem', fontWeight:700, color:T.textPrimary }}>{e.label}</span>
                  <span style={{ fontSize:'0.6rem', color:T.textMuted }}>{e.sublabel}</span>
                </div>
              );
            })}
          </div>

          {/* Lifelines + messages */}
          <div style={{ position:'relative', minHeight: step > 0 ? step * STEP_H : 52 }}>
            {/* Two lifelines at 25% and 75% */}
            {[25, 75].map(pos => (
              <div key={pos} style={{ position:'absolute', left:`${pos}%`, top:0, bottom:0, width:1, background:T.borderColor, opacity:0.35, transform:'translateX(-50%)' }} />
            ))}

            {step === 0 && (
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ color:T.textMuted, fontSize:'0.82rem' }}>Press Step → or Auto Play to begin the TLS handshake</span>
              </div>
            )}

            {sc.steps.slice(0, step).map((m, i) => {
              const isLTR = m.dir === 'cs';
              const col   = encColor(m.enc, T);
              const isSel = selected === i;

              // Arrow spans from 25% to 75%
              const arrowLeft  = 25;
              const arrowWidth = 50;
              const labelCenter = 50;

              return (
                <div key={i} onClick={() => setSelected(isSel ? null : i)} style={{ position:'absolute', top: i * STEP_H, left:0, right:0, height: STEP_H - 4, cursor:'pointer', animation:'tls-fade 0.3s ease-out' }}>
                  {/* Arrow line */}
                  <div style={{ position:'absolute', top:'40%', left:`${arrowLeft}%`, width:`${arrowWidth}%`, height:2, transform:'translateY(-50%)', animation: isLTR ? 'tls-ltr 0.25s ease-out' : 'tls-rtl 0.25s ease-out' }}>
                    <div style={{ width:'100%', height:'100%', background: isSel ? col : col+'90', transition:'background 0.15s',
                      ...(m.enc === 'plain' ? { backgroundImage:`repeating-linear-gradient(90deg,${isSel?col:col+'90'} 0,${isSel?col:col+'90'} 6px,transparent 6px,transparent 10px)`, background:'transparent' } : {}) }} />
                    {/* Arrowhead */}
                    <div style={{ position:'absolute', ...(isLTR?{right:-1}:{left:-1}), top:'50%', transform:'translateY(-50%)', width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', ...(isLTR?{borderLeft:`6px solid ${isSel?col:col+'90'}`}:{borderRight:`6px solid ${isSel?col:col+'90'}`}) }} />
                  </div>

                  {/* Label above arrow */}
                  <div style={{ position:'absolute', bottom:'55%', left:`${labelCenter}%`, transform:'translate(-50%,-2px)', whiteSpace:'nowrap', textAlign:'center' }}>
                    <span style={{ fontSize:'0.68rem', fontWeight:700, color:isSel?col:T.textPrimary, background:isSel?`${col}18`:T.cardBg, padding:'1px 6px', borderRadius:4, border:isSel?`1px solid ${col}40`:'1px solid transparent', transition:'all 0.15s' }}>{m.name}</span>
                  </div>

                  {/* Type badge + sublabel below arrow */}
                  <div style={{ position:'absolute', top:'48%', left:`${labelCenter}%`, transform:'translate(-50%,6px)', whiteSpace:'nowrap', textAlign:'center', display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                    <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'1px 5px', borderRadius:3, background:`${col}20`, color:col, border:`1px solid ${col}30` }}>{ENC_LABEL[m.enc]}</span>
                    {m.keyEvent && <span style={{ fontSize:'0.55rem', fontWeight:800, padding:'1px 5px', borderRadius:3, background:`${m.keyEvent.color}20`, color:m.keyEvent.color, border:`1px solid ${m.keyEvent.color}30` }}>🔑 {m.keyEvent.label}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:'0.75rem', paddingTop:'0.75rem', borderTop:`1px solid ${T.borderColor}` }}>
            {sc.steps.map((s, i) => {
              const col = encColor(s.enc, T);
              return <div key={i} style={{ width:7, height:7, borderRadius:'50%', background: i < step ? col : T.borderColor, transition:'background 0.3s', cursor:'pointer' }} onClick={() => { setStep(i+1); setSelected(i); setAuto(false); }} />;
            })}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selMsg && (
          <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${TYPE_COLORS[selMsg.enc]}50`, marginBottom:'1.25rem', animation:'tls-fade 0.2s ease-out' }}>
            {/* Terminal title bar */}
            <div style={{ background:'#1a1a2e', padding:'0.55rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width:9,height:9,borderRadius:'50%',background:c }} />)}
              </div>
              <span style={{ fontSize:'0.58rem', fontWeight:800, padding:'2px 7px', borderRadius:20, background:`${TYPE_COLORS[selMsg.enc]}25`, color:TYPE_COLORS[selMsg.enc], border:`1px solid ${TYPE_COLORS[selMsg.enc]}40`, textTransform:'uppercase', flexShrink:0 }}>{ENC_LABEL[selMsg.enc]}</span>
              <span style={{ fontFamily:'monospace', fontSize:'0.65rem', color:'#8b949e', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{selMsg.name}</span>
              <span style={{ fontFamily:'monospace', fontSize:'0.62rem', color:TYPE_COLORS[selMsg.enc], flexShrink:0 }}>{selMsg.dir === 'cs' ? 'CLIENT → SERVER' : 'SERVER → CLIENT'}</span>
            </div>
            <div style={{ background:'#0d1117', padding:'0.9rem 1.25rem' }}>
              <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#e6edf3', marginBottom:'0.6rem' }}>{selMsg.title}</div>
              <p style={{ margin:'0 0 0.9rem', fontSize:'0.77rem', color:'#c9d1d9', lineHeight:1.75 }}>{selMsg.detail}</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {selMsg.fields.map((f, fi) => (
                  <div key={fi} style={{ display:'grid', gridTemplateColumns:'170px 1fr', gap:'0 0.75rem', padding:'0.25rem 0', borderBottom:'1px solid #ffffff10' }}>
                    <span style={{ fontSize:'0.68rem', color:'#7ee787', fontFamily:'monospace' }}>{f.k}:</span>
                    <span style={{ fontSize:'0.68rem', color: f.v.includes('VISIBLE') || f.v.includes('Replay') ? '#f85149' : f.v.startsWith('Yes') ? '#3fb950' : '#ffa657', fontFamily:'monospace', wordBreak:'break-all' }}>{f.v}</span>
                  </div>
                ))}
              </div>
              {selMsg.keyEvent && (
                <div style={{ marginTop:'0.75rem', padding:'0.5rem 0.75rem', background:`${selMsg.keyEvent.color}18`, border:`1px solid ${selMsg.keyEvent.color}40`, borderRadius:6, fontSize:'0.75rem', color:selMsg.keyEvent.color, fontWeight:700 }}>
                  🔑 {selMsg.keyEvent.label}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Comparison Table ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden', marginBottom:'1.25rem' }}>
          <div style={{ padding:'0.9rem 1.25rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:T.textPrimary }}>TLS 1.3 vs TLS 1.2</span>
            <span style={{ fontSize:'0.65rem', color:T.textMuted }}>— key differences for the exam</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:0 }}>
            {[
              ['',                        'TLS 1.3',                   'TLS 1.2 (legacy)'],
              ['Round trips (RTT)',        '1 (or 0 with 0-RTT)',       '2'],
              ['Certificate visibility',  '✅ Encrypted',              '❌ Plaintext'],
              ['Key exchange',            'ECDHE only (mandatory)',     'ECDHE or RSA'],
              ['Forward secrecy',         '✅ Always',                 '⚠️ Only with ECDHE'],
              ['Weak ciphers',            '✅ Removed (RC4, 3DES)',    '❌ Still negotiable'],
              ['Key derivation',          'HKDF (single extract-expand)','PRF (master secret)'],
            ].map((row, ri) =>
              row.map((cell, ci) => (
                <div key={`${ri}-${ci}`} style={{ padding:'0.45rem 0.75rem', borderBottom:`1px solid ${T.borderColor}`, borderRight:ci<2?`1px solid ${T.borderColor}`:'none', fontSize:ci===0?'0.72rem':'0.75rem', fontWeight:ri===0||ci===0?700:400, color:ri===0?T.textMuted:ci===0?T.textSecondary:T.textPrimary, background:ri===0?T.panelBg:ci===1&&scenario!==2?`${T.accent}08`:ci===2&&scenario===2?`${T.accent}08`:'transparent', textTransform:ri===0?'uppercase':'none', letterSpacing:ri===0?'0.05em':'normal', transition:'background 0.2s' }}>
                  {cell}
                </div>
              ))
            )}
          </div>
        </div>

        <LabEduPanel cards={TLS_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default TlsLab;
