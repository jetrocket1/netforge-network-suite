import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface WifiSecurityProps {
  isDarkMode?: boolean;
}

export const WifiSecurity: React.FC<WifiSecurityProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [secTab, setSecTab] = useState<'matrix' | 'handshake'>('matrix');
  const [handshakeStep, setHandshakeStep] = useState<number>(0);

  const wpa2Steps = [
    { title: "1. 4-Way Handshake Begins (ANonce)", desc: "The Access Point sends an Authenticator Nonce (ANonce) to the client machine in unencrypted clear text." },
    { title: "2. Client Computes PTK (SNonce + MIC)", desc: "The client generates its own Nonce (SNonce) and uses the pre-shared key (PSK) password to compute the Pairwise Transient Key (PTK). It returns the SNonce along with a Message Integrity Check (MIC)." },
    { title: "3. AP Validates MIC & Sends GTK", desc: "The AP computes its own matching PTK to verify the client's MIC. If valid, it encrypts and securely passes down the Group Temporal Key (GTK) for multicast traffic." },
    { title: "4. ACK Confirmation", desc: "The client returns a final acknowledgment frame. Port transitions to an authorized state, and data encryption loops activate." }
  ];

  const wpa3Steps = [
    { title: "1. SAE Commit Exchange (The Dragon-Fly)", desc: "Instead of exchanging nonces immediately, the client and AP execute an SAE commit. They perform zero-knowledge proof scalar/vector mathematics based on a shared password pool, without sending the password over the air." },
    { title: "2. Cryptographic Secret Generated", desc: "Both hardware stations securely compute a shared PMK (Pairwise Master Key) completely isolated from offline intercept eavesdropping vectors." },
    { title: "3. 4-Way Confirmation Loop", desc: "A standard 4-way validation routine occurs purely to verify that both sides computed identical cryptographic key states cleanly." },
    { title: "4. Full Forward Secrecy Enforced", desc: "Keys lock down. Even if an attacker records this encrypted airtime traffic and steals the network password later, they cannot decrypt the historic session data." }
  ];

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.75rem',
    backgroundColor: active ? T.accent : 'transparent',
    color: active ? '#ffffff' : T.textSecondary
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: T.cardBg, borderRadius: '16px', border: T.border, color: T.textPrimary }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ color: T.textPrimary, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>WPA2 vs. WPA3 Wireless Security Matrix</h3>
          <p style={{ color: T.textSecondary, margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Audit authentication handshake vulnerabilities, cryptographic baselines, and frame-sealing requirements.
          </p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.insetBg, padding: '4px', borderRadius: '8px', border: T.border }}>
          <button type="button" onClick={() => setSecTab('matrix')} style={tabBtn(secTab === 'matrix')}>1. Capability Matrix</button>
          <button type="button" onClick={() => setSecTab('handshake')} style={tabBtn(secTab === 'handshake')}>2. Handshake Inspector</button>
        </div>
      </div>

      {secTab === 'matrix' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: T.panelBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>SECURITY PARAMETER</th>
                {/* Keep #f59e0b / #10b981 as semantic identifiers for WPA2 / WPA3 branding */}
                <th style={{ padding: '12px', fontWeight: 800, color: '#f59e0b' }}>WPA2 STANDARD (LEGACY)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#10b981' }}>WPA3 STANDARD (MODERN)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Personal Key Exchange Protocol',       wpa2: 'Pre-Shared Key (PSK) via 4-Way Handshake',                        wpa3: 'Simultaneous Authentication of Equals (SAE)' },
                { metric: 'Core Encryption Algorithm',            wpa2: 'AES-CCMP (128-Bit Baseline standard)',                             wpa3: 'AES-GCMP (128-Bit Personal / 192-Bit Enterprise CNSA)' },
                { metric: 'Offline Dictionary / Brute-Force',    wpa2: 'HIGH — Capturing 4-way handshake allows rapid offline cracking attempts.', wpa3: 'IMMUNE — Cryptographic mechanics prevent guess attempts from scaling offline.' },
                { metric: 'Protected Management Frames (PMF)',   wpa2: 'Optional (Rarely deployed outside specialized setups)',            wpa3: 'MANDATORY (Protects against de-auth/spoofing attacks)' },
                { metric: 'Forward Secrecy Enforcements',        wpa2: 'None. Compromising password decrypts captured airtime history.',   wpa3: 'Active. Unique ephemeral session keys protect historic streams.' },
                { metric: 'Open Network Guest Encryption',       wpa2: 'None (Clear text packet sniffing completely unencrypted)',         wpa3: 'Opportunistic Wireless Encryption (OWE) — Seals individual lines' }
              ].map((row, i) => {
                const wpa2IsRisk = row.wpa2.includes('HIGH') || row.wpa2.includes('None');
                const wpa3IsGood = row.wpa3.includes('IMMUNE') || row.wpa3.includes('Active') || row.wpa3.includes('MANDATORY');
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.borderColor}`, backgroundColor: 'transparent' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{row.metric}</td>
                    <td style={{ padding: '12px', color: wpa2IsRisk ? T.danger : T.textSecondary }}>{row.wpa2}</td>
                    <td style={{ padding: '12px', color: wpa3IsGood ? T.success : T.textPrimary, fontWeight: wpa3IsGood ? 700 : 'normal' }}>{row.wpa3}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {secTab === 'handshake' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', backgroundColor: T.panelBg, padding: '0.75rem', borderRadius: '8px', border: T.border, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: T.textSecondary }}>Use the controls to step through the sequence and compare protocol behaviors side-by-side:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button disabled={handshakeStep === 0} onClick={() => setHandshakeStep(p => p - 1)}
                style={{ padding: '4px 12px', borderRadius: '4px', border: T.border, backgroundColor: T.insetBg, color: T.textPrimary, fontWeight: 700, cursor: 'pointer' }}>Prev</button>
              <button disabled={handshakeStep === 3} onClick={() => setHandshakeStep(p => p + 1)}
                style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', fontWeight: 700, cursor: 'pointer', backgroundColor: T.accent, color: '#ffffff' }}>Next Step</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

            {/* WPA2 panel — keep #f59e0b as semantic WPA2 brand color */}
            <div style={{ backgroundColor: T.insetBg, border: '2px solid #f59e0b', borderRadius: '10px', padding: '1.5rem' }}>
              <div style={{ borderBottom: `1px solid ${T.borderColor}`, paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f59e0b' }}>WPA2 (Pre-Shared Key 4-Way)</span>
                <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Vulnerable to Sniffing</span>
              </div>
              {wpa2Steps.map((step, i) => {
                const isActive = i === handshakeStep;
                return (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', border: isActive ? '1px solid #f59e0b' : '1px solid transparent', backgroundColor: isActive ? 'rgba(245,158,11,0.04)' : 'transparent', transition: 'all 0.2s', opacity: i <= handshakeStep ? 1 : 0.25 }}>
                    <h5 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#f59e0b' : T.textPrimary }}>{step.title}</h5>
                    {isActive && <p style={{ margin: 0, fontSize: '0.8rem', color: T.textSecondary, lineHeight: '1.4' }}>{step.desc}</p>}
                  </div>
                );
              })}
            </div>

            {/* WPA3 panel — keep #10b981 as semantic WPA3 brand color */}
            <div style={{ backgroundColor: T.insetBg, border: '2px solid #10b981', borderRadius: '10px', padding: '1.5rem' }}>
              <div style={{ borderBottom: `1px solid ${T.borderColor}`, paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#10b981' }}>WPA3 (Simultaneous Authentication of Equals)</span>
                <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Zero-Knowledge Proof</span>
              </div>
              {wpa3Steps.map((step, i) => {
                const isActive = i === handshakeStep;
                return (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', border: isActive ? '1px solid #10b981' : '1px solid transparent', backgroundColor: isActive ? 'rgba(16,185,129,0.04)' : 'transparent', transition: 'all 0.2s', opacity: i <= handshakeStep ? 1 : 0.25 }}>
                    <h5 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#10b981' : T.textPrimary }}>{step.title}</h5>
                    {isActive && <p style={{ margin: 0, fontSize: '0.8rem', color: T.textSecondary, lineHeight: '1.4' }}>{step.desc}</p>}
                  </div>
                );
              })}
            </div>

          </div>

          <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', borderLeft: `4px solid ${T.danger}`, fontSize: '0.8rem', color: T.textSecondary, lineHeight: '1.5', border: T.border }}>
            <strong>Why WPA2 Cracking Occurs:</strong> In WPA2, an attacker does not need to guess your password while connected to the router. They simply capture the ANonce and SNonce frames during Step 1 & 2 as a client authenticates. Once captured, they can carry out billions of password guesses per second <em>offline</em> against the cryptographic hash on their own computer graphics cards. WPA3's SAE Dragonfly handshake ensures that even if an attacker sniffs the airtime session, the mathematical proof contains no data that can be taken offline and brute-forced.
          </div>
        </div>
      )}

    </div>
  );
};

export default WifiSecurity;
