import React, { useState, useEffect, useRef } from 'react';
import { getLabTheme } from './labTheme';

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
        detail: 'The server picks a cipher suite, responds with its own ECDH public key, and that is the last plaintext message. Both sides can now independently compute the same ECDH shared secret (x25519 Diffie-Hellman) and derive Handshake Traffic Keys from it using HKDF. Everything after this is encrypted.',
        fields: [
          { k: 'Chosen Cipher', v: 'TLS_AES_256_GCM_SHA384' },
          { k: 'Key Share (x25519)', v: '0x4f7a9c... (32-byte ECDH public key)' },
          { k: 'TLS Version Selected', v: 'TLS 1.3' },
        ],
        keyEvent: { label: 'ECDH → Handshake Keys derived (both sides)', color: '#4493f8' },
      },
      {
        dir: 'sc', name: '{EncryptedExtensions}', enc: 'handshake',
        title: 'EncryptedExtensions — server sends hidden extensions',
        detail: 'In TLS 1.2, all extensions were sent plaintext. In TLS 1.3 the server moves extensions into this encrypted message, hiding details about the negotiated connection from passive observers. This is the first encrypted record in the handshake.',
        fields: [
          { k: 'ALPN', v: 'h2 (HTTP/2 negotiated)' },
          { k: 'Max Fragment Length', v: '16384 bytes' },
          { k: 'Encrypted', v: 'Yes — using server_handshake_traffic_secret' },
        ],
      },
      {
        dir: 'sc', name: '{Certificate}', enc: 'handshake',
        title: 'Certificate — server proves its identity (encrypted)',
        detail: 'The server sends its certificate chain. Unlike TLS 1.2, this is fully encrypted — a passive attacker cannot determine which certificate (and therefore which domain) the server is presenting, even if they can see the IP. The client verifies the chain against its trusted root CA store.',
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
        detail: 'Owning a certificate is not enough — the server must prove it also has the matching private key. It signs a hash of the complete handshake transcript so far using the certificate\'s private key. The client verifies this signature against the public key in the certificate.',
        fields: [
          { k: 'Algorithm', v: 'rsa_pss_rsae_sha256' },
          { k: 'Signs Over', v: 'SHA-256 of full handshake transcript' },
          { k: 'Purpose', v: 'Proves server holds the cert private key' },
        ],
      },
      {
        dir: 'sc', name: '{Finished}', enc: 'handshake',
        title: 'Server Finished — handshake transcript MAC',
        detail: 'The server sends an HMAC over the entire handshake transcript using the server_finished_key derived from the handshake secret. The client verifies this to confirm neither side has been tampered with. After verification, both sides independently derive Application Traffic Keys.',
        fields: [
          { k: 'Verify Data', v: 'HMAC-SHA384 over handshake transcript' },
          { k: 'Key', v: 'Derived from server_handshake_traffic_secret' },
        ],
        keyEvent: { label: 'Handshake verified → Application Traffic Keys derived', color: '#3fb950' },
      },
      {
        dir: 'cs', name: '{Finished}', enc: 'handshake',
        title: 'Client Finished — client confirms the handshake',
        detail: 'The client sends its own Finished message using the client_finished_key. This confirms the client received and verified everything correctly. The handshake is now complete and fully authenticated on both sides. Application data can flow immediately.',
        fields: [
          { k: 'Verify Data', v: 'HMAC-SHA384 over handshake transcript' },
          { k: 'Key', v: 'Derived from client_handshake_traffic_secret' },
          { k: 'RTT Count', v: '1 round trip from ClientHello to this point' },
        ],
      },
      {
        dir: 'cs', name: '[Application Data]', enc: 'app',
        title: 'Application Data — encrypted HTTP/2 traffic flows',
        detail: 'All application data (HTTP requests, responses, headers, body) is encrypted using AES-256-GCM with per-record nonces. Each TLS record has authentication tags that detect any tampering. The connection also provides forward secrecy — if the server private key is later stolen, past sessions cannot be decrypted because the ephemeral ECDH key was discarded.',
        fields: [
          { k: 'Encryption', v: 'AES-256-GCM (AEAD)' },
          { k: 'Key Source', v: 'client/server_application_traffic_secret_0' },
          { k: 'Forward Secrecy', v: 'Yes — ephemeral x25519 keys discarded' },
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
        detail: 'If the client has a session ticket from a previous connection (a Pre-Shared Key), it can send application data alongside the ClientHello — before the server responds. This eliminates the 1-RTT delay. Early data is encrypted with a key derived from the PSK, but has reduced security: it is not forward-secret and is vulnerable to replay attacks if not mitigated server-side.',
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
        detail: 'The server selects the PSK, derives handshake keys, and sends EncryptedExtensions with early_data accepted. If the server rejects 0-RTT (e.g., replay detected), it sends early_data rejected and the client must retransmit that data in normal 1-RTT flow.',
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
        detail: 'Server sends Certificate (omitted for PSK resumption — identity already established) and Finished. Both sides derive Application Traffic Keys.',
        fields: [
          { k: 'Certificate', v: 'Omitted (PSK proves prior authentication)' },
          { k: 'Finished', v: 'HMAC over handshake transcript' },
        ],
        keyEvent: { label: 'Application Traffic Keys derived', color: '#3fb950' },
      },
      {
        dir: 'cs', name: '{Finished} + [App Data]', enc: 'app',
        title: 'Client Finished and full application data',
        detail: 'Client sends its Finished and continues with normal application data. Total handshake overhead: 0 additional round trips if 0-RTT was accepted. Net result: the first HTTP request arrives at the server before the TLS handshake even completes from the server\'s perspective.',
        fields: [
          { k: 'Effective RTT', v: '0 (data sent with ClientHello)' },
          { k: 'Use Case', v: 'Repeat connections to same server (CDNs, APIs)' },
          { k: 'Security Note', v: 'Only safe for idempotent requests (GET, HEAD)' },
        ],
      },
    ],
  },
  {
    name: 'TLS 1.2 (compare)', desc: 'Legacy 2-RTT handshake — certificate and extensions sent in plaintext',
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
        detail: 'Server picks the cipher suite and returns a server random. No key material is exchanged yet.',
        fields: [
          { k: 'Chosen Cipher', v: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384' },
          { k: 'Server Random', v: '32 bytes (used in key derivation)' },
        ],
      },
      {
        dir: 'sc', name: 'Certificate', enc: 'plain',
        title: 'Certificate — SENT IN PLAINTEXT (TLS 1.2 weakness)',
        detail: 'In TLS 1.2 the certificate is sent in plaintext. Any passive observer on the network can see exactly which certificate (and domain) the server is presenting — even if they cannot read the application data. TLS 1.3 encrypts the certificate. SNI already leaks the hostname in both versions (unless ECH is used).',
        fields: [
          { k: 'Subject', v: 'CN=www.example.com (VISIBLE to attacker)' },
          { k: 'Certificate Chain', v: 'End Entity → Intermediate → Root (all plaintext)' },
          { k: 'TLS 1.3 Fix', v: 'Certificate moved into encrypted EncryptedExtensions' },
        ],
      },
      {
        dir: 'sc', name: 'ServerKeyExchange', enc: 'plain',
        title: 'ServerKeyExchange — ECDHE parameters (plaintext)',
        detail: 'For ECDHE cipher suites, the server sends its ephemeral key exchange parameters signed with its private key. This message does not exist in TLS 1.3 (folded into ServerHello key_share). If RSA key exchange was used instead, this message is skipped — but RSA exchange means no forward secrecy.',
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
        detail: 'A legacy compatibility message signalling the switch to encrypted communication. In TLS 1.3 this is only sent for middlebox compatibility and carries no semantic meaning — the actual key schedule transition is implicit.',
        fields: [
          { k: 'Message', v: 'ChangeCipherSpec (legacy signal)' },
          { k: 'Followed by', v: 'Finished (encrypted with derived session keys)' },
        ],
        keyEvent: { label: 'Session Keys derived (master_secret → PRF)', color: '#4493f8' },
      },
      {
        dir: 'sc', name: 'ChangeCipherSpec + {Finished}', enc: 'handshake',
        title: 'Server ChangeCipherSpec + Server Finished',
        detail: 'Server sends its own ChangeCipherSpec and Finished. After mutual Finished verification, both sides are authenticated and the handshake is complete. Application data can now flow — but this is the second full round trip since ClientHello.',
        fields: [
          { k: 'Total Round Trips', v: '2 (vs 1 for TLS 1.3)' },
          { k: 'TLS 1.3 Advantage', v: 'Saves ~20–50ms per connection' },
        ],
        keyEvent: { label: 'Handshake complete — Application Data can flow', color: '#3fb950' },
      },
      {
        dir: 'cs', name: '[Application Data]', enc: 'app',
        title: 'Application Data — encrypted but weaker guarantees',
        detail: 'Application data flows encrypted. However, if the server\'s RSA private key is ever compromised (or compelled), an attacker who recorded past sessions could decrypt them — because RSA key exchange does not provide forward secrecy. ECDHE does provide forward secrecy, but TLS 1.2 still allowed RSA. TLS 1.3 mandates ephemeral key exchange, removing this risk entirely.',
        fields: [
          { k: 'Encryption', v: 'AES-256-GCM (if ECDHE suite chosen)' },
          { k: 'Forward Secrecy', v: 'Yes IF ECDHE was negotiated (not RSA)' },
          { k: 'Weak Ciphers Allowed', v: 'RC4, 3DES, CBC — still negotiable in TLS 1.2' },
        ],
      },
    ],
  },
];

function easeInOut(t: number): number { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

const CX = 115;  // client x
const SX = 545;  // server x
const STEP_H = 68;
const START_Y = 90;

function stepY(i: number): number { return START_Y + i * STEP_H; }
function svgH(n: number): number { return START_Y + n * STEP_H + 30; }

interface TlsLabProps { isDarkMode?: boolean; }

export const TlsLab: React.FC<TlsLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [scenario,  setScenario]  = useState(0);
  const [step,      setStep]      = useState(0);
  const [dotT,      setDotT]      = useState(1);
  const [autoPlay,  setAutoPlay]  = useState(false);
  const rafRef = useRef<number>(undefined);
  const t0Ref  = useRef<number>(0);

  const sc  = SCENARIOS[scenario];
  const cur = sc.steps[step];

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setDotT(0);
    t0Ref.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0Ref.current) / 700, 1);
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
    }, 600);
    return () => clearTimeout(id);
  }, [autoPlay, dotT, step, sc.steps.length]);

  const changeScenario = (i: number) => { setScenario(i); setStep(0); setAutoPlay(false); setDotT(1); };
  const prevStep = () => { setStep(s => Math.max(0, s - 1)); setAutoPlay(false); };
  const nextStep = () => { setStep(s => Math.min(sc.steps.length - 1, s + 1)); };

  const encColor = (e: TlsEnc) => ({
    plain: T.warning, handshake: T.accent, app: T.success, early: '#a855f7'
  }[e]);

  const et   = easeInOut(dotT);
  const curY = stepY(step);
  const fromX = cur.dir === 'cs' ? CX : SX;
  const toX   = cur.dir === 'cs' ? SX : CX;
  const dotX  = lerp(fromX, toX, et);
  const ec    = encColor(cur.enc);
  const H     = svgH(sc.steps.length);

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui,sans-serif' }}>

      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px' }}>TLS Handshake Visualiser</h3>
        <p style={{ color: T.textSecondary, margin: 0, fontSize: '0.875rem' }}>Step through TLS 1.3 and TLS 1.2 handshakes and see exactly which messages are encrypted, when keys are derived, and why TLS 1.3 is faster and more secure.</p>
      </div>

      {/* Scenario tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        {SCENARIOS.map((s, i) => (
          <button key={i} onClick={() => changeScenario(i)}
            style={{ padding: '6px 14px', borderRadius: '6px', border: `1px solid ${scenario === i ? T.accent : T.borderColor}`, backgroundColor: scenario === i ? T.accentSubtle : T.panelBg, color: scenario === i ? T.accent : T.textSecondary, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
            {s.name}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: T.textMuted, fontStyle: 'italic' }}>{sc.desc}</span>
      </div>

      {/* Enc legend */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {(['plain', 'handshake', 'app', 'early'] as TlsEnc[]).map(e => (
          <div key={e} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: T.textMuted }}>
            <div style={{ width: 28, height: 3, backgroundColor: encColor(e), borderRadius: 2, opacity: e === 'plain' ? 0.7 : 1 }} />
            {ENC_LABEL[e]}
          </div>
        ))}
      </div>

      {/* Sequence diagram SVG */}
      <div style={{ backgroundColor: T.insetBg, borderRadius: '10px', border: T.border, overflow: 'hidden', marginBottom: '1rem' }}>
        <svg viewBox={`0 0 660 ${H}`} style={{ width: '100%', display: 'block' }}>

          {/* Client / Server nodes */}
          <rect x={CX - 55} y={10} width={110} height={36} rx={7}
            fill={isDarkMode ? '#161b22' : '#ffffff'} stroke={T.accent} strokeWidth={1.5} />
          <text x={CX} y={33} textAnchor="middle" fill={T.accent} fontSize={11} fontWeight="700" fontFamily="system-ui,sans-serif">CLIENT</text>

          <rect x={SX - 55} y={10} width={110} height={36} rx={7}
            fill={isDarkMode ? '#161b22' : '#ffffff'} stroke={T.success} strokeWidth={1.5} />
          <text x={SX} y={33} textAnchor="middle" fill={T.success} fontSize={11} fontWeight="700" fontFamily="system-ui,sans-serif">SERVER</text>

          {/* Timeline bars */}
          <line x1={CX} y1={46} x2={CX} y2={H - 10} stroke={T.borderColor} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.5} />
          <line x1={SX} y1={46} x2={SX} y2={H - 10} stroke={T.borderColor} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.5} />

          {/* All steps */}
          {sc.steps.map((s, i) => {
            const y = stepY(i);
            const isDone = i < step;
            const isCur  = i === step;
            const isFut  = i > step;
            const fX = s.dir === 'cs' ? CX : SX;
            const tX = s.dir === 'cs' ? SX : CX;
            const col = encColor(s.enc);
            const op  = isDone ? 0.45 : isCur ? 1 : 0.2;

            return (
              <g key={i} onClick={() => { setStep(i); setAutoPlay(false); }} style={{ cursor: 'pointer' }}>
                {/* Key derivation line */}
                {s.keyEvent && (
                  <g opacity={isDone || isCur ? 0.85 : 0.2}>
                    <line x1={60} y1={y - 12} x2={600} y2={y - 12} stroke={s.keyEvent.color} strokeWidth={1} strokeDasharray="6 4" />
                    <rect x={200} y={y - 22} width={260} height={14} rx={3} fill={s.keyEvent.color} opacity={0.15} />
                    <text x={330} y={y - 12} textAnchor="middle" fill={s.keyEvent.color} fontSize={8} fontWeight="700" fontFamily="monospace" dominantBaseline="middle">{s.keyEvent.label}</text>
                  </g>
                )}

                {/* Arrow */}
                <defs>
                  <marker id={`ah-${i}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M 0 1 L 7 4 L 0 7 z" fill={col} opacity={op} />
                  </marker>
                </defs>
                <line x1={fX} y1={y} x2={tX} y2={y}
                  stroke={col} strokeWidth={isCur ? 2 : 1.5}
                  strokeDasharray={s.enc === 'plain' ? '5 4' : 'none'}
                  opacity={op}
                  markerEnd={`url(#ah-${i})`} />

                {/* Message label */}
                <rect x={263} y={y - 11} width={134} height={20} rx={4}
                  fill={isDarkMode ? '#161b22' : '#ffffff'} opacity={isFut ? 0.5 : 0.95} />
                <text x={330} y={y + 4} textAnchor="middle" fill={isCur ? col : (isDone ? col : T.textMuted)}
                  fontSize={isCur ? 9.5 : 8.5} fontWeight={isCur ? '800' : '600'} fontFamily="monospace"
                  opacity={op * (isFut ? 0.6 : 1)}>
                  {s.name}
                </text>

                {/* Enc badge */}
                {(isCur || isDone) && (
                  <text x={s.dir === 'cs' ? 145 : 510} y={y + 4} textAnchor="middle" fill={col}
                    fontSize={7.5} fontWeight="700" fontFamily="monospace" opacity={op}>
                    {ENC_LABEL[s.enc]}
                  </text>
                )}
              </g>
            );
          })}

          {/* Animated dot */}
          {dotT > 0 && dotT < 1 && (
            <>
              <circle cx={dotX} cy={curY} r={9}  fill={ec} opacity={0.12} />
              <circle cx={dotX} cy={curY} r={5}  fill={ec} opacity={0.35} />
              <circle cx={dotX} cy={curY} r={2.5} fill={ec} />
            </>
          )}

          {/* Step counter */}
          <text x={12} y={H - 6} fill={T.textMuted} fontSize={9} fontFamily="monospace">
            Step {step + 1}/{sc.steps.length}
          </text>
        </svg>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button onClick={prevStep} disabled={step === 0}
          style={{ padding: '6px 14px', borderRadius: '6px', border: T.border, backgroundColor: T.panelBg, color: T.textPrimary, fontWeight: 600, fontSize: '0.8rem', cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.4 : 1 }}>
          Prev
        </button>
        <button onClick={() => { if (step === sc.steps.length - 1) { setStep(0); setAutoPlay(true); } else setAutoPlay(a => !a); }}
          style={{ padding: '6px 18px', borderRadius: '6px', border: 'none', backgroundColor: autoPlay ? T.warning : T.accent, color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
          {autoPlay ? 'Pause' : step === sc.steps.length - 1 ? 'Replay' : 'Play'}
        </button>
        <button onClick={nextStep} disabled={step === sc.steps.length - 1}
          style={{ padding: '6px 14px', borderRadius: '6px', border: T.border, backgroundColor: T.panelBg, color: T.textPrimary, fontWeight: 600, fontSize: '0.8rem', cursor: step === sc.steps.length - 1 ? 'not-allowed' : 'pointer', opacity: step === sc.steps.length - 1 ? 0.4 : 1 }}>
          Next
        </button>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {sc.steps.map((_, i) => (
            <button key={i} onClick={() => { setStep(i); setAutoPlay(false); }}
              style={{ width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                backgroundColor: i === step ? ec : i < step ? `${ec}55` : T.borderColor, transition: 'background-color 0.15s' }} />
          ))}
        </div>
      </div>

      {/* Detail panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>

        {/* Step explanation */}
        <div style={{ backgroundColor: T.panelBg, borderRadius: '8px', padding: '1.1rem', border: T.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: ec, backgroundColor: `${ec}18`, padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.06em' }}>
              {ENC_LABEL[cur.enc]}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: T.textMuted, backgroundColor: T.insetBg, padding: '2px 8px', borderRadius: '10px' }}>
              {cur.dir === 'cs' ? 'CLIENT → SERVER' : 'SERVER → CLIENT'}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: T.textPrimary, marginBottom: '6px' }}>{cur.title}</div>
          <p style={{ margin: 0, fontSize: '0.82rem', color: T.textSecondary, lineHeight: 1.65 }}>{cur.detail}</p>
        </div>

        {/* Fields panel */}
        <div style={{ backgroundColor: T.termBg, borderRadius: '8px', padding: '1rem', border: `1px solid ${T.termBorder}` }}>
          <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: T.termMuted, fontWeight: 700, borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '5px', marginBottom: '8px', letterSpacing: '0.06em' }}>
            MESSAGE FIELDS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {cur.fields.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.76rem', lineHeight: 1.5 }}>
                <span style={{ color: T.termMuted, fontFamily: 'monospace', flexShrink: 0, minWidth: 140 }}>{f.k}:</span>
                <span style={{ color: f.v.includes('VISIBLE') || f.v.includes('Replay') ? T.danger : f.v.includes('Yes') ? T.success : T.termText, fontFamily: 'monospace', wordBreak: 'break-all' }}>{f.v}</span>
              </div>
            ))}
          </div>
          {cur.keyEvent && (
            <div style={{ marginTop: '10px', padding: '6px 10px', backgroundColor: `${cur.keyEvent.color}18`, borderRadius: '5px', border: `1px solid ${cur.keyEvent.color}40`, fontSize: '0.75rem', color: cur.keyEvent.color, fontWeight: 700 }}>
              {cur.keyEvent.label}
            </div>
          )}
        </div>
      </div>

      {/* Theory footer */}
      <div style={{ borderTop: T.border, paddingTop: '1.1rem', marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
        <div>
          <h4 style={{ margin: '0 0 5px', fontSize: '0.875rem', fontWeight: 700, color: T.accent }}>Why 1-RTT matters</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.8rem', lineHeight: 1.6 }}>TLS 1.2 required 2 full round trips before any application data could flow. On a 50ms RTT connection (e.g. London to New York), that adds 100ms to every new HTTPS connection. TLS 1.3 reduced this to 1 RTT, and 0-RTT session resumption effectively eliminates it for repeat connections.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 5px', fontSize: '0.875rem', fontWeight: 700, color: T.success }}>Forward secrecy</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.8rem', lineHeight: 1.6 }}>TLS 1.3 mandates ephemeral key exchange (ECDHE). The ECDH private keys are generated fresh for each session and discarded after use. If an attacker records encrypted traffic today and later steals the server's RSA private key, they still cannot decrypt past sessions — the session keys depended on a key that no longer exists.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 5px', fontSize: '0.875rem', fontWeight: 700, color: T.warning }}>Certificate chain validation</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.8rem', lineHeight: 1.6 }}>Clients trust a set of Root CAs pre-installed in the OS or browser. The server's certificate must chain up to one of those roots via intermediate CAs. Each link is verified by checking the digital signature of the issuer. OCSP stapling lets the server include a timestamped revocation proof so the client does not need to make a separate revocation check.</p>
        </div>
      </div>
    </div>
  );
};

export default TlsLab;
