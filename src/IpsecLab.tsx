import { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

const IPSEC_EDU: EduCard[] = [
  { type:'exam', title:'IKEv1 Phases vs IKEv2 Exchanges', body:'IKEv1: Phase 1 (ISAKMP SA via 6 Main Mode or 3 Aggressive Mode messages) + Phase 2 (IPsec SA via 3 Quick Mode messages) = 9 total messages. IKEv2 collapses this into 2 exchanges (IKE_SA_INIT + IKE_AUTH) = 4 messages, adds built-in NAT-T, EAP auth, and MOBIKE for mobile clients. Know IKEv1 terminology for CompTIA exams; know IKEv2 for real deployments.' },
  { type:'exam', title:'AH vs ESP — Only ESP Works Through NAT', body:'AH (Protocol 51): integrity + authentication, NO encryption. It authenticates the IP header — this breaks NAT which modifies source IPs. ESP (Protocol 50): encrypts payload + optional authentication. With NAT-T (UDP 4500 encapsulation), ESP traverses NAT. AH is essentially never used in modern networks. All production VPNs use ESP; the exam still tests both.' },
  { type:'config', title:'IKEv2 Site-to-Site on Cisco IOS', body:'Production-grade IKEv2 with PFS and certificate authentication.', code:`crypto ikev2 proposal STRONG
  encryption aes-cbc-256
  integrity sha512
  group 21              ! ECDH 521-bit — avoid group 1/2/5 (broken)

crypto ikev2 profile SITE-B
  match identity remote address 198.51.100.2
  authentication local rsa-sig
  authentication remote rsa-sig
  pki trustpoint ROOT-CA

crypto ipsec transform-set TSET esp-aes 256 esp-sha512-hmac
  mode tunnel

crypto ipsec profile IPSEC-PROF
  set transform-set TSET
  set ikev2-profile SITE-B
  set pfs group21       ! PFS: new DH exchange for each Child SA

interface Tunnel0
  ip address 172.16.0.1 255.255.255.252
  tunnel source GigabitEthernet0/0
  tunnel destination 198.51.100.2
  tunnel mode ipsec ipv4
  tunnel protection ipsec profile IPSEC-PROF` },
  { type:'gotcha', title:'NAT-T Must Be Enabled if Either Peer Is Behind NAT', body:'If either VPN endpoint is behind NAT, IKE will fail without NAT-T configured. IKEv2 auto-detects NAT and switches to UDP 4500. IKEv1 requires "crypto isakmp nat-traversal 20" explicitly. Both UDP 500 (IKE) and UDP 4500 (NAT-T) must be open on every firewall between peers. Forgetting UDP 4500 is the single most common VPN deployment failure.' },
  { type:'gotcha', title:'DH Group Mismatch Fails Silently with "No Proposal Chosen"', body:'If Site A proposes DH Group 14 and Site B only accepts Group 21, IKE_SA_INIT returns "NO_PROPOSAL_CHOSEN" — zero tunnel, no informative error in the logs. Debug with "debug crypto ikev2" on Cisco IOS. Standardise DH groups, encryption algorithms, and PRF across your entire VPN estate to prevent cryptographic mismatch failures.' },
  { type:'realworld', title:'WireGuard: 4× Throughput vs IPsec on the Same Hardware', body:'Cloudflare benchmarks show WireGuard achieving 3–4× IPsec throughput at equivalent CPU usage, because WireGuard lives in the Linux kernel and avoids userspace context switches. Cloudflare, Mullvad, ProtonVPN, and most cloud providers now default to WireGuard. IPsec remains dominant in enterprise site-to-site where FIPS-140 compliance, IKEv2 standards, and existing PKI integration are required.' },
];

interface Props { isDarkMode?: boolean; }
type VpnMode = 'ikev2' | 'wireguard';

interface Step {
  id: number;
  phase: string;
  from: 'A' | 'B' | 'both';
  label: string;
  sublabel: string;
  detail: string;
  packetBefore: string;
  packetAfter: string;
}

const IKEV2_STEPS: Step[] = [
  { id:1, phase:'IKE_SA_INIT', from:'A', label:'IKE_SA_INIT (Request)', sublabel:'SAi1, KEi, Ni',
    detail:'Site A initiates the exchange. Sends: SA proposals (crypto suites it supports), a Diffie-Hellman public value (KEi), and a random nonce (Ni). No encryption yet — this message is in cleartext.',
    packetBefore:'IP: 203.0.113.1 → 198.51.100.2\nUDP: 500 → 500\n\nIKEv2 Header (cleartext):\n  SPIi: a3f1...  SPIr: 00:00...\n  Exchange: IKE_SA_INIT (34)\n  Flags: Initiator\n\nPayloads:\n  SAi1: AES-256-GCM | SHA-384 | DH Group 21 (ECP 521)\n  KEi:  Diffie-Hellman public key (DH Group 21)\n  Ni:   Nonce (256-bit random)',
    packetAfter:'[Cleartext — not yet encrypted]\nIKE_SA_INIT is always sent in the clear.\nEncryption keys have not been derived yet.\n\nDH exchange will complete in step 2.\nAfter step 3, all IKE traffic is encrypted.',
  },
  { id:2, phase:'IKE_SA_INIT', from:'B', label:'IKE_SA_INIT (Response)', sublabel:'SAr1, KEr, Nr, CERTREQ',
    detail:'Site B replies with: the selected SA (chosen crypto suite), its own DH public value (KEr), a nonce (Nr), and optionally a CERTREQ asking for the peer\'s certificate. Both sides can now compute the same shared DH secret (g^ir).',
    packetBefore:'IP: 198.51.100.2 → 203.0.113.1\nUDP: 500 → 500\n\nIKEv2 Header (cleartext):\n  SPIi: a3f1...  SPIr: 7c2d...\n  Exchange: IKE_SA_INIT (34)\n  Flags: Response\n\nPayloads:\n  SAr1: AES-256-GCM selected\n  KEr:  Diffie-Hellman public key (DH Group 21)\n  Nr:   Nonce (256-bit random)\n  CERTREQ: SHA-1 hash of trusted CA cert',
    packetAfter:'[Still cleartext]\nDH exchange now complete on both sides.\n\nBoth peers independently compute:\n  SKEYSEED = prf(Ni | Nr, g^ir)\n\nSession keys derived in next step (local computation — no packet).',
  },
  { id:3, phase:'IKE_SA_INIT', from:'both', label:'Key Derivation (local)', sublabel:'SKEYSEED → SK_e, SK_a, SK_d',
    detail:'Both peers independently derive the same session keys. No packet is sent — this is local computation. The SKEYSEED is used to generate a key stream that is split into individual keys for encryption, integrity, and child SA keying material.',
    packetBefore:'Key derivation inputs:\n  SKEYSEED = prf(Ni | Nr, g^ir)\n\nDerived key material:\n  {SK_d | SK_ai | SK_ar | SK_ei | SK_er | SK_pi | SK_pr}\n    = prf+(SKEYSEED, Ni | Nr | SPIi | SPIr)\n\nKey assignments:\n  SK_ei / SK_er  — IKE encryption (initiator / responder)\n  SK_ai / SK_ar  — IKE integrity authentication\n  SK_d           — Child SA keying material seed\n  SK_pi / SK_pr  — AUTH payload signing',
    packetAfter:'[No packet — local computation only]\n\nAll subsequent IKE_AUTH messages are:\n  - Encrypted with SK_ei (initiator) or SK_er (responder)\n  - Integrity-protected with SK_ai / SK_ar\n\nAES-256-GCM provides both encryption and authentication (AEAD).',
  },
  { id:4, phase:'IKE_AUTH', from:'A', label:'IKE_AUTH (Request)', sublabel:'IDi, CERT, AUTH, SAi2, TSi, TSr',
    detail:'Now encrypted with SK_ei. Site A proves its identity: sends its certificate (IDi + CERT) and AUTH payload (HMAC signature over the IKE_SA_INIT data + Ni). Also proposes the IPsec Child SA (SAi2) and traffic selectors (which subnets to protect).',
    packetBefore:'Original subnets (what we want to protect):\n  LAN A: 10.0.1.0/24\n  LAN B: 10.0.2.0/24\n\nIP: 203.0.113.1 → 198.51.100.2\nUDP: 500 → 500\n\nIKEv2 Header:\n  Exchange: IKE_AUTH (35)',
    packetAfter:'IP: 203.0.113.1 → 198.51.100.2\nUDP: 500 → 500\n\nIKEv2 Header: Exchange: IKE_AUTH (35)\n[Encrypted with SK_ei | Integrity: SK_ai]\n\nPayloads (decrypted):\n  IDi:   CN=site-a.netforge.example\n  CERT:  X.509 certificate chain\n  AUTH:  prf(SK_pi, IKE_SA_INIT_data | Nr | prf(SK_pi, IDi))\n  SAi2:  ESP | AES-256-GCM | SHA-384\n  TSi:   10.0.1.0/24 (any port/proto)\n  TSr:   10.0.2.0/24 (any port/proto)',
  },
  { id:5, phase:'IKE_AUTH', from:'B', label:'IKE_AUTH (Response)', sublabel:'IDr, CERT, AUTH, SAr2, TSi, TSr',
    detail:'Site B verifies Site A\'s AUTH signature, then responds with its own identity proof. SAr2 confirms the ESP Child SA parameters. TSi/TSr confirm the accepted traffic selectors. The IKE SA and Child SA (IPsec tunnel) are now ESTABLISHED.',
    packetBefore:'Site B verifies AUTH_A:\n  prf(SK_pr, IKE_SA_INIT_A_data | Ni | prf(SK_pr, IDi))\n\nCertificate validation:\n  1. Build chain: Leaf → Intermediate → Root CA\n  2. Verify each signature up the chain\n  3. Check CRL / OCSP for revocation\n  4. Confirm SAN matches expected peer identity',
    packetAfter:'IP: 198.51.100.2 → 203.0.113.1\nUDP: 500 → 500\n\nIKEv2 Header: Exchange: IKE_AUTH (35)\n[Encrypted with SK_er | Integrity: SK_ar]\n\nPayloads (decrypted):\n  IDr:   CN=site-b.netforge.example\n  CERT:  X.509 certificate chain\n  AUTH:  prf(SK_pr, IKE_SA_INIT_B_data | Ni)\n  SAr2:  ESP | AES-256-GCM (accepted)\n  TSi:   10.0.1.0/24 ✓ confirmed\n  TSr:   10.0.2.0/24 ✓ confirmed\n\n✅ TUNNEL ESTABLISHED',
  },
  { id:6, phase:'DATA', from:'A', label:'Encrypted Data Transfer', sublabel:'ESP Tunnel Mode · AES-256-GCM',
    detail:'The IPsec tunnel is up. Packets from LAN A (10.0.1.0/24) destined for LAN B (10.0.2.0/24) are intercepted by the VPN gateway, encapsulated in ESP Tunnel Mode, and sent over the internet. The original packet is completely hidden inside.',
    packetBefore:'Original packet (LAN A → LAN B):\n\nIP Header:  Src: 10.0.1.5  Dst: 10.0.2.10\nProtocol:   TCP\nTTL:        63\nLength:     1460B\n\nTCP Header: 52341 → 443\nFlags:      [ACK, PSH]\n\nPayload:\n  HTTP/1.1 GET /api/v1/data\n  Authorization: Bearer eyJ...\n  Content-Length: 0',
    packetAfter:'ESP Tunnel Mode packet (on the internet):\n\nOuter IP:  Src: 203.0.113.1  Dst: 198.51.100.2\nProtocol:  50 (ESP)\nTTL:       64\n\nESP Header:\n  SPI:    0x0a3b2c1d  (identifies the SA)\n  SeqNo:  0x00000042  (anti-replay)\n\n[AES-256-GCM Encrypted + Authenticated]:\n  Inner IP: 10.0.1.5 → 10.0.2.10\n  TCP:      52341 → 443 [ACK,PSH]\n  Payload:  GET /api/v1/data ...\n  Padding:  (to block-size alignment)\n\nESP Auth (ICV):  16-byte GCM tag\n\n✅ Original IP header + payload fully encrypted',
  },
];

const WG_STEPS: Step[] = [
  { id:1, phase:'Setup', from:'both', label:'Key Generation (pre-configured)', sublabel:'Curve25519 static key pairs',
    detail:'WireGuard uses static Curve25519 key pairs. Each peer generates a private key and derives the public key. Peers pre-share public keys out-of-band (config file, management system, or Kubernetes Secrets). No PKI or certificate infrastructure required.',
    packetBefore:'Site A key generation:\n  privkey_A = random 32 bytes\n  pubkey_A  = X25519(privkey_A, G)\n            = base64(...)\n\nSite B key generation:\n  privkey_B = random 32 bytes\n  pubkey_B  = X25519(privkey_B, G)\n            = base64(...)\n\nPublic keys exchanged out-of-band\n(config file / secrets manager)',
    packetAfter:'Site A wg0.conf:\n  [Interface]\n  PrivateKey = <privkey_A>\n  Address    = 10.10.0.1/24\n  ListenPort = 51820\n\n  [Peer]  # Site B\n  PublicKey  = <pubkey_B>\n  AllowedIPs = 10.0.2.0/24\n  Endpoint   = 198.51.100.2:51820\n\nNo certificates. No CA. 1 line of config per peer.',
  },
  { id:2, phase:'Handshake', from:'A', label:'Handshake Initiation', sublabel:'Noise_IKpsk2 — 1 RTT',
    detail:'Site A sends a 92-byte initiation message using the Noise protocol (Noise_IKpsk2 pattern). Includes: an ephemeral public key (encrypted to Site B\'s static key), Site A\'s encrypted static key, and an encrypted timestamp. The timestamp prevents replay attacks.',
    packetBefore:'Site A computes:\n  eph_priv_A, eph_pub_A = X25519.generate()\n  chain_hash = HASH("Noise_IKpsk2...")\n  chain_key  = HKDF(chain_hash, eph_pub_A)\n\nTimestamp = TAI64N(now)\n  → prevents replay (must be newer than last seen)',
    packetAfter:'On the wire (92 bytes):\n\nIP: 203.0.113.1 → 198.51.100.2\nUDP: <ephemeral> → 51820\n\nWireGuard header:\n  Type:             0x01 (Initiation)\n  Sender index:     0x12345678\n  Unencrypted eph:  <eph_pub_A>\n  Encrypted static: AEAD(eph_shared, 0, pubkey_A, chain_hash)\n  Encrypted ts:     AEAD(static_shared, 0, timestamp, chain_hash)\n  MAC1: HASH(MAC1_KEY | msg[:-32])\n  MAC2: 0 (cookie not yet assigned)',
  },
  { id:3, phase:'Handshake', from:'B', label:'Handshake Response', sublabel:'Tunnel keys derived on both sides',
    detail:'Site B verifies the initiation and responds with its own ephemeral key. Both sides now perform a chain of HKDF operations over the ephemeral and static keys to derive the same session send/receive keys. Tunnel is live after 1 RTT — IKEv2 takes 2.',
    packetBefore:'Site B receives initiation:\n  1. Decrypt static key → verify it matches a known peer\n  2. Decrypt timestamp  → verify it is newer than last seen\n  3. Generate eph_priv_B, eph_pub_B\n  4. Compute shared secrets:\n     eph_shared   = X25519(eph_priv_B, eph_pub_A)\n     static_shared= X25519(privkey_B, pubkey_A)\n  5. Derive session keys via HKDF chain',
    packetAfter:'On the wire (60 bytes — smallest VPN handshake):\n\nIP: 198.51.100.2 → 203.0.113.1\nUDP: 51820 → <sender port>\n\nWireGuard header:\n  Type:              0x02 (Response)\n  Sender index:      0x87654321\n  Receiver index:    0x12345678\n  Unencrypted eph:   <eph_pub_B>\n  Encrypted nothing: AEAD(final_key, 0, empty, hash)\n  MAC1 / MAC2\n\nBoth peers now hold:\n  Ts_send = HKDF(chain_key, "send")\n  Ts_recv = HKDF(chain_key, "recv")\n  Keys rotate every 3 min or 2^60 messages',
  },
  { id:4, phase:'DATA', from:'A', label:'Encrypted Data Transfer', sublabel:'ChaCha20-Poly1305 AEAD',
    detail:'WireGuard encapsulates packets in UDP using ChaCha20-Poly1305 AEAD encryption. The entire original IP packet is encrypted. No SPI negotiation, no SPD/SAD lookup, no mode selection — just encrypt and send. Extremely fast, especially on CPUs without AES-NI.',
    packetBefore:'Original packet:\n\nIP Header:  Src: 10.0.1.5  Dst: 10.0.2.10\nProtocol:   TCP\nTTL:        63\n\nTCP: 52341 → 443 [ACK, PSH]\n\nPayload:\n  HTTP/1.1 GET /api/v1/resource\n  Authorization: Bearer eyJ...',
    packetAfter:'WireGuard packet (on the internet):\n\nIP: 203.0.113.1 → 198.51.100.2\nUDP: <ephemeral> → 51820\n\nWireGuard header:\n  Type:           0x04 (Data)\n  Receiver index: 0x87654321\n  Counter:        0x0000000000000001  ← anti-replay\n\n[ChaCha20-Poly1305 Encrypted]:\n  Inner IP: 10.0.1.5 → 10.0.2.10\n  TCP:      52341 → 443 [ACK,PSH]\n  Payload:  GET /api/v1/resource ...\n\nPoly1305 Auth Tag: 16 bytes\n\n✅ No protocol negotiation overhead vs IKEv2/IPsec',
  },
];

const COMPARISON = [
  ['','IKEv2 / IPsec','WireGuard'],
  ['Handshake RTTs','2 RTT','1 RTT'],
  ['Encryption','AES-256-GCM','ChaCha20-Poly1305'],
  ['Key exchange','Diffie-Hellman (MODP/ECP)','Curve25519 (ECDH)'],
  ['Authentication','Certificates / PSK','Static public keys'],
  ['Key rotation','Rekeying (configurable)','Every 3 min or 2^60 msgs'],
  ['Kernel support','strongSwan / Libreswan','Native (Linux 5.6+, iOS, Android)'],
  ['Config complexity','High (IKE policy, SPD, SAD)','Very low (~8 lines)'],
  ['Roaming / IP change','Limited','✅ Seamless'],
  ['RFC standard','✅ RFC 7296','❌ Not standardised'],
  ['Audit surface','Large (many options)','Small (~4k LoC)'],
];

const PHASE_INFO: Record<string, { color: string; label: string }> = {
  IKE_SA_INIT: { color:'#4493f8', label:'IKE SA Init' },
  IKE_AUTH:    { color:'#a855f7', label:'IKE Auth' },
  DATA:        { color:'#3fb950', label:'Data' },
  Setup:       { color:'#4493f8', label:'Setup' },
  Handshake:   { color:'#a855f7', label:'Handshake' },
};

export function IpsecLab({ isDarkMode = true }: Props) {
  const T = getLabTheme(isDarkMode);
  const [mode,     setMode]     = useState<VpnMode>('ikev2');
  const [step,     setStep]     = useState(0);
  const [auto,     setAuto]     = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const steps = mode === 'ikev2' ? IKEV2_STEPS : WG_STEPS;
  const tunnelUp = step >= steps.length;
  const selectedStep = selected !== null ? steps[selected] : null;

  useEffect(() => { setStep(0); setSelected(null); setAuto(false); }, [mode]);

  useEffect(() => {
    if (!auto) return;
    if (step >= steps.length) { setAuto(false); return; }
    const id = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(id);
  }, [auto, step, steps.length]);

  const phases = mode === 'ikev2'
    ? [{ id:'IKE_SA_INIT', count:3 }, { id:'IKE_AUTH', count:2 }, { id:'DATA', count:1 }]
    : [{ id:'Setup', count:1 }, { id:'Handshake', count:2 }, { id:'DATA', count:1 }];

  let phaseOffset = 0;
  const phaseProgress = phases.map(ph => {
    const start = phaseOffset;
    phaseOffset += ph.count;
    const done = Math.max(0, Math.min(step - start, ph.count));
    return { ...ph, start, done };
  });

  return (
    <div style={{ maxWidth:900, margin:'0 auto', fontFamily:'system-ui, -apple-system, sans-serif', color:T.textPrimary }}>
      <style>{`
        @keyframes ipsec-fade  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ipsec-glow  { 0%,100%{box-shadow:0 0 0 0 #3fb95040} 60%{box-shadow:0 0 22px 6px #3fb95020} }
        @keyframes ipsec-flow  { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes ipsec-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg, ${T.cardBg} 0%, ${T.panelBg} 100%)`, borderBottom:`1px solid ${T.borderColor}`, padding:'1.5rem 2rem', marginBottom:'1.5rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #4493f8, #a855f7, #3fb950)' }} />
        <div style={{ display:'flex', alignItems:'flex-start', gap:'1.25rem', flexWrap:'wrap' }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'#4493f815', border:'1px solid #4493f830', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>🔒</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
              <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, letterSpacing:'-0.02em' }}>IPsec / WireGuard VPN</h2>
              <span style={{ fontSize:'0.6rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background:`${T.danger}20`, color:T.danger, border:`1px solid ${T.danger}40`, textTransform:'uppercase', letterSpacing:'0.07em' }}>Advanced</span>
              <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${T.accent}15`, color:T.accent, border:`1px solid ${T.accent}30`, textTransform:'uppercase', letterSpacing:'0.07em' }}>PRO Lab</span>
            </div>
            <p style={{ margin:0, color:T.textSecondary, fontSize:'0.84rem', lineHeight:1.5 }}>Step through site-to-site VPN tunnel establishment. Inspect every IKEv2 message and packet encapsulation side-by-side.</p>
          </div>
          <div style={{ display:'flex', gap:'1.25rem' }}>
            {[{label:'VPN Types', val:'2'},{label:'IKEv2 Steps', val:'6'},{label:'WG Steps', val:'4'}].map(s => (
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
          {(['ikev2','wireguard'] as VpnMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ cursor:'pointer', padding:'0.35rem 1rem', borderRadius:8, border:`1px solid ${mode===m?'#4493f8':T.borderColor}`, background:mode===m?'#4493f815':T.panelBg, color:mode===m?'#4493f8':T.textMuted, fontWeight:700, fontSize:'0.8rem', fontFamily:'inherit', transition:'all 0.15s' }}>
              {m==='ikev2' ? 'IKEv2 / IPsec' : 'WireGuard'}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:'0.5rem' }}>
            <button onClick={() => setAuto(true)} disabled={auto||tunnelUp} style={{ cursor:'pointer', background:'#4493f8', color:'#fff', border:'none', borderRadius:8, padding:'0.35rem 0.85rem', fontSize:'0.75rem', fontWeight:700, fontFamily:'inherit', opacity:auto||tunnelUp?0.4:1 }}>▶ Play</button>
            <button onClick={() => !auto && step < steps.length && setStep(s=>s+1)} disabled={auto||tunnelUp} style={{ cursor:'pointer', background:T.panelBg, color:T.textSecondary, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.35rem 0.85rem', fontSize:'0.75rem', fontWeight:700, fontFamily:'inherit', opacity:auto||tunnelUp?0.4:1 }}>Step →</button>
            <button onClick={() => { setStep(0); setSelected(null); setAuto(false); }} style={{ cursor:'pointer', background:T.panelBg, color:T.textMuted, border:`1px solid ${T.borderColor}`, borderRadius:8, padding:'0.35rem 0.75rem', fontSize:'0.75rem', fontFamily:'inherit' }}>↺</button>
          </div>
        </div>

        {/* ── Phase Progress Bar ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
            {phaseProgress.map(ph => {
              const phCol = PHASE_INFO[ph.id]?.color ?? T.accent;
              const pct   = ph.count > 0 ? (ph.done / ph.count) * 100 : 0;
              return (
                <div key={ph.id} style={{ flex:1, minWidth:80 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:'0.62rem', fontWeight:700, color: ph.done > 0 ? phCol : T.textMuted, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {PHASE_INFO[ph.id]?.label ?? ph.id}
                    </span>
                    <span style={{ fontSize:'0.62rem', color:T.textMuted }}>{ph.done}/{ph.count}</span>
                  </div>
                  <div style={{ height:5, borderRadius:3, background:T.borderColor, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, background:phCol, width:`${pct}%`, transition:'width 0.4s ease-out', ...(pct>0&&pct<100?{animation:'ipsec-pulse 1.5s infinite'}:{}) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Topology ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${tunnelUp?'#3fb95060':T.borderColor}`, borderRadius:14, padding:'1.25rem', marginBottom:'1.25rem', transition:'border-color 0.5s', ...(tunnelUp?{animation:'ipsec-glow 2s ease-out 1'}:{}) }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flexWrap:'wrap' }}>
            {/* Site A */}
            <div style={{ flex:1, minWidth:120, padding:'0.7rem 0.9rem', borderRadius:10, background:T.accentSubtle, border:`1px solid ${T.accent}30`, fontSize:'0.75rem' }}>
              <div style={{ fontWeight:800, color:T.accent, marginBottom:2 }}>🏢 Site A</div>
              <div style={{ color:T.textSecondary, fontSize:'0.65rem' }}>LAN: 10.0.1.0/24</div>
              <div style={{ color:T.textMuted, fontSize:'0.65rem' }}>WAN: 203.0.113.1</div>
              <div style={{ color:T.textMuted, fontSize:'0.65rem' }}>{mode==='ikev2'?'UDP:500':'UDP:51820'}</div>
            </div>

            {/* Internet / tunnel link */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5, minWidth:100 }}>
              {tunnelUp ? (
                <div style={{ width:'100%', height:4, borderRadius:2, background:`linear-gradient(90deg, #3fb950, #4493f8)`, backgroundSize:'200% 100%', animation:'ipsec-flow 1.5s linear infinite' }} />
              ) : (
                <div style={{ width:'100%', height:2, background:T.borderColor, borderRadius:1 }} />
              )}
              <div style={{ padding:'3px 10px', borderRadius:10, background: tunnelUp?'#3fb95020':T.panelBg, border:`1px solid ${tunnelUp?'#3fb95050':T.borderColor}`, fontSize:'0.62rem', fontWeight:800, color: tunnelUp?'#3fb950': step>0?'#d29922':T.textMuted, textTransform:'uppercase', letterSpacing:'0.07em', transition:'all 0.4s' }}>
                {tunnelUp ? '🔒 TUNNEL UP' : step>0 ? '⏳ Negotiating…' : '☁ Internet'}
              </div>
              {tunnelUp && <div style={{ fontSize:'0.6rem', color:'#3fb950', fontFamily:'monospace' }}>{mode==='ikev2'?'ESP / AES-256-GCM':'ChaCha20-Poly1305'}</div>}
            </div>

            {/* Site B */}
            <div style={{ flex:1, minWidth:120, padding:'0.7rem 0.9rem', borderRadius:10, background:T.accentSubtle, border:`1px solid ${T.accent}30`, fontSize:'0.75rem', textAlign:'right' }}>
              <div style={{ fontWeight:800, color:T.accent, marginBottom:2 }}>🏢 Site B</div>
              <div style={{ color:T.textSecondary, fontSize:'0.65rem' }}>LAN: 10.0.2.0/24</div>
              <div style={{ color:T.textMuted, fontSize:'0.65rem' }}>WAN: 198.51.100.2</div>
              <div style={{ color:T.textMuted, fontSize:'0.65rem' }}>{mode==='ikev2'?'UDP:500':'UDP:51820'}</div>
            </div>
          </div>

          {/* Step timeline */}
          <div style={{ marginTop:'1rem', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
            {steps.slice(0, step).map((s, i) => {
              const phCol = PHASE_INFO[s.phase]?.color ?? T.accent;
              const isSel = selected === i;
              return (
                <div key={s.id} onClick={() => setSelected(isSel ? null : i)} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:8, padding:'0.45rem 0.7rem', borderRadius:8, border:`1px solid ${isSel?phCol:'transparent'}`, background: isSel?`${phCol}12`:'transparent', transition:'all 0.15s', animation:'ipsec-fade 0.3s ease-out' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:phCol, flexShrink:0, boxShadow: isSel?`0 0 6px ${phCol}`:'none' }} />
                  <span style={{ fontSize:'0.6rem', fontWeight:700, padding:'1px 5px', borderRadius:4, background:`${phCol}20`, color:phCol, flexShrink:0 }}>{s.phase}</span>
                  <span style={{ fontSize:'0.76rem', fontWeight:600, color: isSel?T.textPrimary:T.textSecondary, flex:1 }}>{s.label}</span>
                  <span style={{ fontSize:'0.65rem', color:T.textMuted, flexShrink:0, fontFamily:'monospace' }}>
                    {s.from==='both' ? 'local' : s.from==='A' ? 'A → B' : 'B → A'}
                  </span>
                </div>
              );
            })}
            {step === 0 && <p style={{ margin:0, textAlign:'center', color:T.textMuted, fontSize:'0.8rem', padding:'1rem' }}>Press Step → or Play to begin tunnel negotiation</p>}
          </div>
        </div>

        {/* ── Packet Inspector (side-by-side) ── */}
        {selectedStep && (
          <div style={{ marginBottom:'1.25rem', borderRadius:14, overflow:'hidden', border:`1px solid ${PHASE_INFO[selectedStep.phase]?.color ?? T.accent}50`, animation:'ipsec-fade 0.25s ease-out' }}>
            {/* Header */}
            <div style={{ background:'#161b22', padding:'0.7rem 1rem', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:5 }}>
                {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width:9, height:9, borderRadius:'50%', background:c }} />)}
              </div>
              <span style={{ fontFamily:'monospace', fontSize:'0.7rem', color:'#8b949e', flex:1 }}>
                {selectedStep.label} — {selectedStep.sublabel}
              </span>
              <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:6, background:`${PHASE_INFO[selectedStep.phase]?.color ?? T.accent}25`, color:PHASE_INFO[selectedStep.phase]?.color ?? T.accent }}>{selectedStep.phase}</span>
            </div>
            {/* Detail text */}
            <div style={{ background:T.cardBg, padding:'0.9rem 1.25rem', borderBottom:`1px solid ${T.borderColor}` }}>
              <p style={{ margin:0, fontSize:'0.82rem', color:T.textSecondary, lineHeight:1.7 }}>{selectedStep.detail}</p>
            </div>
            {/* Side-by-side packets */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', background:'#0d1117' }}>
              {[
                { label:'📦 Plaintext / Original', content:selectedStep.packetBefore, accent:'#d29922' },
                { label:'🔒 Encapsulated / Encrypted', content:selectedStep.packetAfter, accent:'#3fb950' },
              ].map(({ label, content, accent }) => (
                <div key={label} style={{ borderRight:label.includes('Plaintext')?`1px solid #ffffff10`:'none' }}>
                  <div style={{ padding:'0.4rem 0.9rem', borderBottom:'1px solid #ffffff10', display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:'0.65rem', fontWeight:700, color:accent }}>{label}</span>
                  </div>
                  <pre style={{ margin:0, padding:'0.8rem 0.9rem', fontSize:'0.68rem', lineHeight:1.75, color:'#e6edf3', fontFamily:'\'Fira Code\', \'Cascadia Code\', monospace', overflowX:'auto', whiteSpace:'pre-wrap', wordBreak:'break-word', minHeight:180 }}>
                    {content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Comparison Table ── */}
        <div style={{ background:T.cardBg, border:`1px solid ${T.borderColor}`, borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'0.9rem 1.25rem', borderBottom:`1px solid ${T.borderColor}`, background:T.panelBg, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, color:T.textPrimary }}>IKEv2/IPsec vs WireGuard</span>
            <span style={{ fontSize:'0.65rem', color:T.textMuted }}>— choose the right protocol for your architecture</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr 1fr' }}>
            {COMPARISON.map((row, ri) => (
              row.map((cell, ci) => (
                <div key={`${ri}-${ci}`} style={{ padding:'0.45rem 0.75rem', borderBottom: ri<COMPARISON.length-1?`1px solid ${T.borderColor}`:'none', borderRight: ci<2?`1px solid ${T.borderColor}`:'none', fontSize:ci===0?'0.72rem':'0.75rem', fontWeight:ri===0||ci===0?700:400, color:ri===0?T.textMuted:ci===0?T.textSecondary:T.textPrimary, background:ri===0?T.panelBg:ci===1&&mode==='ikev2'?`${T.accent}08`:ci===2&&mode==='wireguard'?`${T.accent}08`:'transparent', textTransform:ri===0?'uppercase':'none', letterSpacing:ri===0?'0.05em':'normal', transition:'background 0.2s' }}>
                  {cell}
                </div>
              ))
            ))}
          </div>
        </div>
        <LabEduPanel cards={IPSEC_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
}

export default IpsecLab;
