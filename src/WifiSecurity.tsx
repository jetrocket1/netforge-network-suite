import React, { useState } from 'react';

interface WifiSecurityProps {
  isDarkMode?: boolean;
}

export const WifiSecurity: React.FC<WifiSecurityProps> = ({ isDarkMode = true }) => {
  const [secTab, setSecTab] = useState<'matrix' | 'handshake'>('matrix');
  const [handshakeStep, setHandshakeStep] = useState<number>(0);

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    setupBg: isDarkMode ? '#1e293b' : '#f8fafc',
    chartBg: isDarkMode ? '#0f172a' : '#f8fafc',
    tableHeaderBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    tableRowBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    toggleActiveBg: '#0284c7',
    textHighlight: '#38bdf8'
  };

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

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: styles.panelBg,
      borderRadius: '16px',
      boxShadow: isDarkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${styles.panelBorder}`,
      transition: 'all 0.3s ease',
      color: styles.titleText
    }}>
      
      {/* Upper sub tab controls toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `2px solid ${styles.panelBorder}`, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ color: styles.titleText, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            🔒 WPA2 vs. WPA3 Wireless Security Matrix
          </h3>
          <p style={{ color: styles.descText, margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Audit authentication handshake vulnerabilities, cryptographic baselines, and frame-sealing requirements.
          </p>
        </div>

        <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '8px', border: `1px solid ${styles.panelBorder}` }}>
          <button type="button" onClick={() => setSecTab('matrix')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: secTab === 'matrix' ? styles.toggleActiveBg : 'transparent', color: secTab === 'matrix' ? '#ffffff' : styles.descText }}>1. Capability Matrix</button>
          <button type="button" onClick={() => setSecTab('handshake')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: secTab === 'handshake' ? styles.toggleActiveBg : 'transparent', color: secTab === 'handshake' ? '#ffffff' : styles.descText }}>2. Handshake Inspector</button>
        </div>
      </div>

      {/* VIEWPORT 1: CAPABILITY COMPARISON MATRIX TABLE */}
      {secTab === 'matrix' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: styles.tableHeaderBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>SECURITY PARAMETER</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#f59e0b' }}>WPA2 STANDARD (LEGACY)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#10b981' }}>WPA3 STANDARD (MODERN)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'Personal Key Exchange Protocol', wpa2: 'Pre-Shared Key (PSK) via 4-Way Handshake', wpa3: 'Simultaneous Authentication of Equals (SAE)' },
                { metric: 'Core Encryption Algorithm', wpa2: 'AES-CCMP (128-Bit Baseline standard)', wpa3: 'AES-GCMP (128-Bit Personal / 192-Bit Enterprise CNSA)' },
                { metric: 'Offline Dictionary / Brute-Force Vulnerability', wpa2: '🚨 HIGH — Capturing 4-way handshake allows rapid offline cracking attempts.', wpa3: '🛡️ IMMUNE — Cryptographic mechanics prevent guess attempts from scaling offline.' },
                { metric: 'Protected Management Frames (PMF)', wpa2: 'Optional (Rarely deployed outside specialized setups)', wpa3: '🔒 MANDATORY (Protects against de-auth/spoofing attacks)' },
                { metric: 'Forward Secrecy Enforcements', wpa2: '✕ None. Compromising password decrypts captured airtime history.', wpa3: '✓ Active. Unique ephemeral session keys protect historic streams.' },
                { metric: 'Open Network Guest Encryption', wpa2: 'None (Clear text packet sniffing completely unencrypted)', wpa3: 'Opportunistic Wireless Encryption (OWE) — Seals individual lines' }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${styles.tableRowBorder}`, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{row.metric}</td>
                  <td style={{ padding: '12px', color: row.wpa2.includes('🚨') ? '#ef4444' : styles.descText }}>{row.wpa2}</td>
                  <td style={{ padding: '12px', color: row.wpa3.includes('🛡️') || row.wpa3.includes('✓') ? '#10b981' : 'inherit', fontWeight: row.wpa3.includes('🛡️') ? 700 : 'normal' }}>{row.wpa3}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEWPORT 2: STEP-BY-STEP HANDSHAKE COMPARISON VISUALIZER */}
      {secTab === 'handshake' && (
        <div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', backgroundColor: styles.setupBg, padding: '0.75rem', borderRadius: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: styles.descText }}>Use the controls to step through the sequence and compare protocol behaviors side-by-side:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button disabled={handshakeStep === 0} onClick={() => setHandshakeStep(p => p - 1)} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Prev</button>
              <button disabled={handshakeStep === 3} onClick={() => setHandshakeStep(p => p + 1)} style={{ padding: '4px 12px', borderRadius: '4px', border: 'none', fontWeight: 700, cursor: 'pointer', backgroundColor: '#0284c7', color: '#ffffff' }}>Next Step</button>
            </div>
          </div>

          {/* SPLIT CORES GRID DISPLAY */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
            
            {/* WPA2 HANDSHAKE WINDOW BLOCK CONTAINER */}
            <div style={{ backgroundColor: styles.chartBg, border: '2px solid #f59e0b', borderRadius: '10px', padding: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f59e0b' }}>WPA2 (Pre-Shared Key 4-Way)</span>
                <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Vulnerable to Sniffing</span>
              </div>
              
              {wpa2Steps.map((step, i) => {
                const isActive = i === handshakeStep;
                return (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', border: isActive ? '1px solid #f59e0b' : '1px solid transparent', backgroundColor: isActive ? 'rgba(245,158,11,0.04)' : 'transparent', transition: 'all 0.2s', opacity: i <= handshakeStep ? 1 : 0.25 }}>
                    <h5 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#f59e0b' : styles.titleText }}>{step.title}</h5>
                    {isActive && <p style={{ margin: 0, fontSize: '0.8rem', color: styles.descText, lineHeight: '1.4' }}>{step.desc}</p>}
                  </div>
                );
              })}
            </div>

            {/* WPA3 SAE DRAGONFLY CONTEXT CONTAINER */}
            <div style={{ backgroundColor: styles.chartBg, border: '2px solid #10b981', borderRadius: '10px', padding: '1.5rem' }}>
              <div style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#10b981' }}>WPA3 (Simultaneous Authentication of Equals)</span>
                <span style={{ fontSize: '0.7rem', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Zero-Knowledge Proof</span>
              </div>

              {wpa3Steps.map((step, i) => {
                const isActive = i === handshakeStep;
                return (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', border: isActive ? '1px solid #10b981' : '1px solid transparent', backgroundColor: isActive ? 'rgba(16,185,129,0.04)' : 'transparent', transition: 'all 0.2s', opacity: i <= handshakeStep ? 1 : 0.25 }}>
                    <h5 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#10b981' : styles.titleText }}>{step.title}</h5>
                    {isActive && <p style={{ margin: 0, fontSize: '0.8rem', color: styles.descText, lineHeight: '1.4' }}>{step.desc}</p>}
                  </div>
                );
              })}
            </div>

          </div>
          
          {/* CRITICAL ATTACK SURFACE LESSON NOTE BOX */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', borderLeft: '4px solid #ef4444', fontSize: '0.8rem', color: styles.descText, lineHeight: '1.5' }}>
            💡 <strong>Why WPA2 Cracking Occurs:</strong> In WPA2, an attacker does not need to guess your password while connected to the router. They simply capture the ANonce and SNonce frames during Step 1 & 2 as a client authenticates. Once captured, they can carry out billions of password guesses per second <em>offline</em> against the cryptographic hash on their own computer graphics cards. WPA3's SAE Dragonfly handshake ensures that even if an attacker sniffs the airtime session, the mathematical proof contains no data that can be taken offline and brute-forced.
          </div>
        </div>
      )}

    </div>
  );
};