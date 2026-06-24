import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface WifiStandardsProps {
  isDarkMode?: boolean;
}

export const WifiStandards: React.FC<WifiStandardsProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'features' | 'amendments'>('timeline');

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
          <h3 style={{ color: T.textPrimary, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>802.11 Wireless Standard Matrix</h3>
          <p style={{ color: T.textSecondary, margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Cross-reference generations, PHY data rates, protocol mechanisms, and roaming amendments.
          </p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.insetBg, padding: '4px', borderRadius: '8px', border: T.border }}>
          <button onClick={() => setActiveSubTab('timeline')} style={tabBtn(activeSubTab === 'timeline')}>Timeline</button>
          <button onClick={() => setActiveSubTab('features')} style={tabBtn(activeSubTab === 'features')}>Feature Compare</button>
          <button onClick={() => setActiveSubTab('amendments')} style={tabBtn(activeSubTab === 'amendments')}>Roaming / QoS</button>
        </div>
      </div>

      {activeSubTab === 'timeline' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: T.panelBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>AMENDMENT</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>WI-FI GEN</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>YEAR</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>BANDS</th>
                <th style={{ padding: '12px', fontWeight: 800, color: T.warning }}>MAX PHY RATE</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>KEY TECH</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '802.11',   gen: '—',          year: '1997', bands: '2.4 GHz',          rate: '2 Mbps',    tech: 'DSSS / FHSS',                     status: 'Obsolete',          color: T.textMuted },
                { name: '802.11b',  gen: 'Wi-Fi 1',    year: '1999', bands: '2.4 GHz',          rate: '11 Mbps',   tech: 'DSSS, CCK',                       status: 'Obsolete',          color: T.textMuted },
                { name: '802.11a',  gen: 'Wi-Fi 2',    year: '1999', bands: '5 GHz',            rate: '54 Mbps',   tech: 'OFDM, 52 subcarriers',            status: 'Obsolete',          color: T.textMuted },
                { name: '802.11g',  gen: 'Wi-Fi 3',    year: '2003', bands: '2.4 GHz',          rate: '54 Mbps',   tech: 'OFDM (backward compat b)',        status: 'Legacy',            color: '#a855f7' },
                { name: '802.11n',  gen: 'Wi-Fi 4',    year: '2009', bands: '2.4 / 5 GHz',     rate: '600 Mbps',  tech: 'MIMO (4x4), 40 MHz ch',           status: 'Legacy / IoT',      color: '#a855f7' },
                { name: '802.11ac', gen: 'Wi-Fi 5',    year: '2013', bands: '5 GHz only',       rate: '6.9 Gbps',  tech: 'MU-MIMO DL, 160 MHz, 256-QAM',   status: 'Widely Deployed',   color: T.success },
                { name: '802.11ax', gen: 'Wi-Fi 6/6E', year: '2021', bands: '2.4 / 5 / 6 GHz', rate: '9.6 Gbps',  tech: 'OFDMA, MU-MIMO UL+DL, BSS Color','status': 'Current Standard', color: T.success },
                { name: '802.11be', gen: 'Wi-Fi 7',    year: '2024', bands: '2.4 / 5 / 6 GHz', rate: '46 Gbps',   tech: 'MLO, 320 MHz ch, 4096-QAM',       status: 'Emerging standard', color: T.accent },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderColor}`, backgroundColor: 'transparent' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: T.accent }}>{row.name}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{row.gen}</td>
                  <td style={{ padding: '12px', color: T.textSecondary }}>{row.year}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.bands}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: T.warning, fontFamily: 'monospace' }}>{row.rate}</td>
                  <td style={{ padding: '12px', color: T.textSecondary }}>{row.tech}</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: row.color }}>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'features' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: T.panelBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>FEATURE Capability</th>
                <th style={{ padding: '12px', fontWeight: 800, color: '#a855f7' }}>WI-FI 4 (N)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: T.success }}>WI-FI 5 (AC)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: T.warning }}>WI-FI 6/6E (AX)</th>
                <th style={{ padding: '12px', fontWeight: 800, color: T.accent }}>WI-FI 7 (BE)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Modulation',                    n: '64-QAM',                    ac: '256-QAM',          ax: '1024-QAM',              be: '4096-QAM' },
                { name: 'Max channel width',             n: '40 MHz',                    ac: '160 MHz',          ax: '160 MHz',               be: '320 MHz' },
                { name: 'Max spatial streams',           n: '4',                         ac: '8',                ax: '8',                     be: '16' },
                { name: 'MU-MIMO (Downlink)',            n: '✕',                         ac: '✓ (4 users)',      ax: '✓ (8 users)',           be: '✓ (16 users)' },
                { name: 'MU-MIMO (Uplink)',              n: '✕',                         ac: '✕',                ax: '✓',                     be: '✓' },
                { name: 'OFDMA resource blocks',        n: '✕',                         ac: '✕',                ax: '✓',                     be: '✓ (+ Multi-RU)' },
                { name: 'Target Wake Time (TWT)',        n: '✕',                         ac: '✕',                ax: '✓',                     be: '✓' },
                { name: 'BSS Coloring mechanism',       n: '✕',                         ac: '✕',                ax: '✓',                     be: '✓' },
                { name: 'Multi-Link Operation (MLO)',   n: '✕',                         ac: '✕',                ax: '✕',                     be: '✓' },
                { name: '6 GHz band support',           n: '✕',                         ac: '✕',                ax: '✓ (6E only)',           be: '✓' },
                { name: 'Security Baseline',            n: 'WPA2',                      ac: 'WPA2',             ax: 'WPA3 (6E mandatory)',   be: 'WPA3 mandatory' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderColor}`, backgroundColor: 'transparent' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: '12px', color: row.n === '✕' ? T.textMuted : T.textPrimary }}>{row.n}</td>
                  <td style={{ padding: '12px', color: row.ac === '✕' ? T.textMuted : T.textPrimary }}>{row.ac}</td>
                  <td style={{ padding: '12px', color: row.ax === '✕' ? T.textMuted : T.textPrimary }}>{row.ax}</td>
                  <td style={{ padding: '12px', color: row.be === '✕' ? T.textMuted : T.textPrimary, fontWeight: row.be.includes('✓') ? 700 : 'normal' }}>{row.be}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', fontSize: '0.8rem', borderLeft: `4px solid ${T.success}`, color: T.textSecondary, lineHeight: '1.5' }}>
            <strong>Deployment Note:</strong> Wi-Fi 6E explicitly extends Wi-Fi 6 architectures into the wide open 6 GHz space, providing up to 1200 MHz of clear radio spectrum without legacy interference. Wi-Fi 7's Multi-Link Operation (MLO) allows dynamic link aggregation across multiple bands at once.
          </div>
        </div>
      )}

      {activeSubTab === 'amendments' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: T.panelBg }}>
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
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderColor}`, backgroundColor: 'transparent' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: T.accent }}>{row.name}</td>
                  <td style={{ padding: '12px', color: T.textSecondary }}>{row.year}</td>
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

export default WifiStandards;
