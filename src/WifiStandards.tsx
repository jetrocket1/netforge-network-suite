import React, { useState } from 'react';

interface WifiStandardsProps {
  isDarkMode?: boolean;
}

export const WifiStandards: React.FC<WifiStandardsProps> = ({ isDarkMode = true }) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'features' | 'amendments'>('timeline');

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    cardBg: isDarkMode ? '#1e293b' : '#f8fafc',
    tableHeaderBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    tableRowBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    textHighlight: '#38bdf8',
    textMuted: isDarkMode ? '#64748b' : '#94a3b8',
    subTabActiveBg: '#0284c7'
  };

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
      
      {/* Header Block with Sub-Navigation Matrix */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem', 
        borderBottom: `2px solid ${styles.panelBorder}`, 
        paddingBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ color: styles.titleText, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            📚 802.11 Wireless Standard Matrix
          </h3>
          <p style={{ color: styles.descText, margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Cross-reference generations, PHY data rates, protocol mechanisms, and roaming amendments.
          </p>
        </div>

        {/* Sub-Tabs Selector */}
        <div style={{ display: 'flex', backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', padding: '4px', borderRadius: '8px', border: `1px solid ${styles.panelBorder}` }}>
          <button onClick={() => setActiveSubTab('timeline')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeSubTab === 'timeline' ? styles.subTabActiveBg : 'transparent', color: activeSubTab === 'timeline' ? '#ffffff' : styles.descText }}>Timeline</button>
          <button onClick={() => setActiveSubTab('features')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeSubTab === 'features' ? styles.subTabActiveBg : 'transparent', color: activeSubTab === 'features' ? '#ffffff' : styles.descText }}>Feature Compare</button>
          <button onClick={() => setActiveSubTab('amendments')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeSubTab === 'amendments' ? styles.subTabActiveBg : 'transparent', color: activeSubTab === 'amendments' ? '#ffffff' : styles.descText }}>Roaming / QoS</button>
        </div>
      </div>

      {/* SUB-TAB 1: CORE AMENDMENT TIMELINE MAP */}
      {activeSubTab === 'timeline' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: styles.tableHeaderBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>AMENDMENT</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>WI-FI GEN</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>YEAR</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>BANDS</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#eab308' }}>MAX PHY RATE</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>KEY TECH</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '802.11', gen: '—', year: '1997', bands: '2.4 GHz', rate: '2 Mbps', tech: 'DSSS / FHSS', status: 'Obsolete', color: '#64748b' },
                { name: '802.11b', gen: 'Wi-Fi 1', year: '1999', bands: '2.4 GHz', rate: '11 Mbps', tech: 'DSSS, CCK', status: 'Obsolete', color: '#64748b' },
                { name: '802.11a', gen: 'Wi-Fi 2', year: '1999', bands: '5 GHz', rate: '54 Mbps', tech: 'OFDM, 52 subcarriers', status: 'Obsolete', color: '#64748b' },
                { name: '802.11g', gen: 'Wi-Fi 3', year: '2003', bands: '2.4 GHz', rate: '54 Mbps', tech: 'OFDM (backward compat b)', status: 'Legacy', color: '#a855f7' },
                { name: '802.11n', gen: 'Wi-Fi 4', year: '2009', bands: '2.4 / 5 GHz', rate: '600 Mbps', tech: 'MIMO (4x4), 40 MHz ch', status: 'Legacy / IoT', color: '#a855f7' },
                { name: '802.11ac', gen: 'Wi-Fi 5', year: '2013', bands: '5 GHz only', rate: '6.9 Gbps', tech: 'MU-MIMO DL, 160 MHz, 256-QAM', status: 'Widely Deployed', color: '#10b981' },
                { name: '802.11ax', gen: 'Wi-Fi 6 / 6E', year: '2021', bands: '2.4 / 5 / 6 GHz', rate: '9.6 Gbps', tech: 'OFDMA, MU-MIMO UL+DL, BSS Color', status: 'Current Standard', color: '#10b981' },
                { name: '802.11be', gen: 'Wi-Fi 7', year: '2024', bands: '2.4 / 5 / 6 GHz', rate: '46 Gbps', tech: 'MLO, 320 MHz ch, 4096-QAM', status: 'Emerging standard', color: '#38bdf8' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${styles.tableRowBorder}`, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: styles.textHighlight }}>{row.name}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{row.gen}</td>
                  <td style={{ padding: '12px', color: styles.descText }}>{row.year}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.bands}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#eab308', fontFamily: 'monospace' }}>{row.rate}</td>
                  <td style={{ padding: '12px', color: styles.descText }}>{row.tech}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: row.color }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 2: DEEP PROTOCOL CAPABILITY GENERATION MATRIX */}
      {activeSubTab === 'features' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: styles.tableHeaderBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>FEATURE Capability</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#a855f7' }}>WI-FI 4 (N)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#10b981' }}>WI-FI 5 (AC)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#eab308' }}>WI-FI 6/6E (AX)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#38bdf8' }}>WI-FI 7 (BE)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Modulation', n: '64-QAM', ac: '256-QAM', ax: '1024-QAM', be: '4096-QAM' },
                { name: 'Max channel width', n: '40 MHz', ac: '160 MHz', ax: '160 MHz', be: '320 MHz' },
                { name: 'Max spatial streams', n: '4', ac: '8', ax: '8', be: '16' },
                { name: 'MU-MIMO (Downlink)', n: '✕', ac: '✓ (4 users)', ax: '✓ (8 users)', be: '✓ (16 users)' },
                { name: 'MU-MIMO (Uplink)', n: '✕', ac: '✕', ax: '✓', be: '✓' },
                { name: 'OFDMA resource blocks', n: '✕', ac: '✕', ax: '✓', be: '✓ (+ Multi-RU)' },
                { name: 'Target Wake Time (TWT)', n: '✕', ac: '✕', ax: '✓', be: '✓' },
                { name: 'BSS Coloring mechanism', n: '✕', ac: '✕', ax: '✓', be: '✓' },
                { name: 'Multi-Link Operation (MLO)', n: '✕', ac: '✕', ax: '✕', be: '✓' },
                { name: '6 GHz Frequency band support', n: '✕', ac: '✕', ax: '✓ (6E only)', be: '✓' },
                { name: 'Security Baseline Minimum', n: 'WPA2', ac: 'WPA2', ax: 'WPA3 (6E mandatory)', be: 'WPA3 mandatory' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${styles.tableRowBorder}`, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: '12px', color: row.n === '✕' ? styles.textMuted : 'inherit' }}>{row.n}</td>
                  <td style={{ padding: '12px', color: row.ac === '✕' ? styles.textMuted : 'inherit' }}>{row.ac}</td>
                  <td style={{ padding: '12px', color: row.ax === '✕' ? styles.textMuted : 'inherit' }}>{row.ax}</td>
                  <td style={{ padding: '12px', color: row.be === '✕' ? styles.textMuted : 'inherit', fontWeight: row.be.includes('✓') ? 700 : 'normal' }}>{row.be}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ backgroundColor: styles.tableHeaderBg, padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', fontSize: '0.8rem', borderLeft: `4px solid #10b981`, color: styles.descText, lineHeight: '1.5' }}>
            ℹ️ <strong>Deployment Note:</strong> Wi-Fi 6E explicitly extends Wi-Fi 6 architectures into the wide open 6 GHz space, providing up to 1200 MHz of clear radio spectrum without legacy interference. Wi-Fi 7's Multi-Link Operation (MLO) allows dynamic link aggregation across multiple bands at once.
          </div>
        </div>
      )}

      {/* SUB-TAB 3: NON-SPEED OPERATIONS & SUBSIDIARY AMENDMENTS */}
      {activeSubTab === 'amendments' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: styles.tableHeaderBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>AMENDMENT</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>RELEASE YEAR</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>OPERATIONAL FRAMEWORK PURPOSE</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '802.11e', year: '2005', purpose: 'Quality of Service (QoS) / WMM — priorpoint queue allocations for Voice/Video traffic optimization (EDCA).' },
                { name: '802.11i', year: '2004', purpose: 'Advanced Security Architecture — introduces RSN frameworks and forms the absolute basis for WPA2 (CCMP/AES).' },
                { name: '802.11r', year: '2008', purpose: 'Fast BSS Transition (FT) — skips full re-authentication overhead to allow seamless, sub-50ms roaming handoffs.' },
                { name: '802.11k', year: '2008', purpose: 'Radio Resource Measurement — allows APs to push optimized neighbor reports to client radios to fasttrack candidate choice discovery.' },
                { name: '802.11v', year: '2011', purpose: 'Wireless Network Management — allows infrastructure layers to steer sticky client devices to adjacent operational nodes.' },
                { name: '802.11w', year: '2009', purpose: 'Protected Management Frames (PMF) — seals management frames against malicious de-authentication or disassociation spoofing attacks.' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${styles.tableRowBorder}`, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: styles.textHighlight }}>{row.name}</td>
                  <td style={{ padding: '12px', color: styles.descText }}>{row.year}</td>
                  <td style={{ padding: '12px', lineHeight: '1.4' }}>{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};