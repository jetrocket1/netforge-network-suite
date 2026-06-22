import React, { useState } from 'react';

interface Ipv6SuiteProps {
  isDarkMode?: boolean;
}

export const Ipv6Suite: React.FC<Ipv6SuiteProps> = ({ isDarkMode = true }) => {
  const [ipv6Tab, setIpv6Tab] = useState<'compress' | 'visualizer' | 'cheat'>('compress');
  const [rawAddress, setRawAddress] = useState('2001:0db8:0000:0000:0008:0000:0000:417a');
  const [subnetBits, setSubnetBits] = useState<number>(64);

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    inputLabel: isDarkMode ? '#cbd5e1' : '#475569', // FIXED: Added missing theme hook definition here
    setupBg: isDarkMode ? '#1e293b' : '#f8fafc',
    chartBg: isDarkMode ? '#0f172a' : '#f8fafc',
    tableHeaderBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    tableRowBorder: isDarkMode ? '#1e293b' : '#e2e8f0',
    toggleActiveBg: '#0284c7',
    textHighlight: '#38bdf8'
  };

  const compressAddress = (address: string) => {
    try {
      const segments = address.trim().split(':');
      if (segments.length !== 8) return { error: "Address must contain exactly 8 hex blocks separated by colons." };

      const step1 = segments.map(seg => {
        const cleaned = seg.replace(/^0+/, '');
        return cleaned === '' ? '0' : cleaned;
      });

      let maxZeroCount = 0;
      let maxZeroStartIndex = -1;
      let currentZeroCount = 0;
      let currentZeroStartIndex = -1;

      step1.forEach((seg, idx) => {
        if (seg === '0') {
          if (currentZeroCount === 0) currentZeroStartIndex = idx;
          currentZeroCount++;
          if (currentZeroCount > maxZeroCount) {
            maxZeroCount = currentZeroCount;
            maxZeroStartIndex = currentZeroStartIndex;
          }
        } else {
          currentZeroCount = 0;
        }
      });

      let compressed = "";
      if (maxZeroCount > 1) {
        const left = step1.slice(0, maxZeroStartIndex).join(':');
        const right = step1.slice(maxZeroStartIndex + maxZeroCount).join(':');
        compressed = `${left}::${right}`;
      } else {
        compressed = step1.join(':');
      }

      return {
        step1: step1.join(':'),
        final: compressed
      };
    } catch {
      return { error: "Invalid hexadecimal format entries detected." };
    }
  };

  const compressionResult = compressAddress(rawAddress);

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
      
      {/* Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `2px solid ${styles.panelBorder}`, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ color: styles.titleText, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            🌐 IPv6 Next-Gen Address & Subnet Suite
          </h3>
          <p style={{ color: styles.descText, margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Master 128-bit hexadecimal compression laws, visualize address space scopes, and calculate network allocation bounds.
          </p>
        </div>

        <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '8px', border: `1px solid ${styles.panelBorder}` }}>
          <button type="button" onClick={() => setIpv6Tab('compress')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: ipv6Tab === 'compress' ? styles.toggleActiveBg : 'transparent', color: ipv6Tab === 'compress' ? '#ffffff' : styles.descText }}>1. Shorthand Compressor</button>
          <button type="button" onClick={() => setIpv6Tab('visualizer')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: ipv6Tab === 'visualizer' ? styles.toggleActiveBg : 'transparent', color: ipv6Tab === 'visualizer' ? '#ffffff' : styles.descText }}>2. Field Boundary Visualizer</button>
          <button type="button" onClick={() => setIpv6Tab('cheat')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: ipv6Tab === 'cheat' ? styles.toggleActiveBg : 'transparent', color: ipv6Tab === 'cheat' ? '#ffffff' : styles.descText }}>3. Address Cheat Sheet</button>
        </div>
      </div>

      {/* VIEWPORT 1: COMPRESSION SHORTHAND LAB */}
      {ipv6Tab === 'compress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: styles.inputLabel, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Input Full 32-Character Uncompressed IPv6 Address</label>
            <input 
              type="text" 
              value={rawAddress} 
              onChange={e => setRawAddress(e.target.value)} 
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem', borderRadius: '6px', border: `2px solid ${styles.panelBorder}`, backgroundColor: styles.chartBg, color: styles.titleText, fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, outline: 'none' }}
            />
          </div>

          {!compressionResult.error ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: styles.chartBg, borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Rule 1 Applied: Omit Leading Zeros inside Blocks</span>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{compressionResult.step1}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: styles.chartBg, borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Rule 2 Applied: Double-Colon (::) Contiguous Zero Collapse</span>
                <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>{compressionResult.final}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
              ⚠️ {compressionResult.error}
            </div>
          )}
        </div>
      )}

      {/* VIEWPORT 2: BOUNDARY VISUALIZER */}
      {ipv6Tab === 'visualizer' && (
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: styles.inputLabel }}>Adjust Allocation Prefix Mask Length Boundary</label>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: styles.textHighlight, fontSize: '1rem' }}>/{subnetBits} Prefix</span>
            </div>
            <input type="range" min="16" max="128" step="4" value={subnetBits} onChange={e => setSubnetBits(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase' }}>128-Bit Architectural Allocation Topology:</span>
            
            <div style={{ display: 'flex', height: '60px', borderRadius: '8px', overflow: 'hidden', textAlign: 'center', color: '#ffffff', fontWeight: 700, fontSize: '0.8rem' }}>
              <div style={{ flex: '48', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px' }}>
                <span>Global Routing Prefix</span>
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', opacity: 0.8 }}>First 48 Bits (ISP)</span>
              </div>
              <div style={{ 
                flex: '16', 
                backgroundColor: subnetBits >= 64 ? '#7c3aed' : '#475569', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexDirection: 'column', 
                padding: '4px',
                borderLeft: '2px solid #0f172a' 
              }}>
                <span>Subnet ID</span>
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', opacity: 0.8 }}>16 Bits (Site)</span>
              </div>
              <div style={{ flex: '64', backgroundColor: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px', borderLeft: '2px solid #0f172a' }}>
                <span>Interface ID (Host)</span>
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', opacity: 0.8 }}>Last 64 Bits (SLAAC/EUI-64)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: '#2563eb' }}>2001:0db8:3c4d</span>
              <span style={{ color: subnetBits >= 64 ? '#7c3aed' : '#64748b' }}>:0015</span>
              <span style={{ color: '#0d9488' }}>:0000:0000:0000:1a2f</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEWPORT 3: SCOPE MATRIX CHEAT SHEET */}
      {ipv6Tab === 'cheat' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: styles.tableHeaderBg }}>
                <th style={{ padding: '12px', fontWeight: 800 }}>ADDRESS TYPE / SCOPE</th>
                <th style={{ padding: '12px', fontWeight: 800, color: styles.textHighlight }}>HEX PREFIX RANGE</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>IPv4 INTERNET EQUIVALENT</th>
                <th style={{ padding: '12px', fontWeight: 800 }}>CORE OPERATIONAL PURPOSE</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Global Unicast (GUA)', prefix: '2000:: /3', ipv4: 'Public IP address space', purpose: 'Publicly routable internet traffic allocations spanning standard wide-area infrastructure networks.' },
                { type: 'Link-Local (LLA)', prefix: 'fe80:: /10', ipv4: 'APIPA (169.254.0.0/16)', purpose: 'Mandatory non-routable link interfaces used automatically for local broadcast neighbor diagnostics.' },
                { type: 'Unique Local (ULA)', prefix: 'fc00:: /7 to fd00::', ipv4: 'Private IP (RFC 1918)', purpose: 'Internal private multi-site corporate networks isolated cleanly away from direct internet routes.' },
                { type: 'Multicast Range', prefix: 'ff00:: /8', ipv4: 'Class D (224.0.0.0/4)', purpose: 'One-to-many packet broadcasting matrices delivering traffic feeds simultaneously to subscribed host nodes.' },
                { type: 'Loopback Local Host', prefix: '::1 /128', ipv4: '127.0.0.1', purpose: 'Internal kernel software testing interface pipeline mapped completely within the local physical NIC.' },
                { type: 'Unspecified Address', prefix: ':: /128', ipv4: '0.0.0.0', purpose: 'Temporary default address placeholder indicating host software initialization or missing configuration state.' }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${styles.tableRowBorder}`, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{row.type}</td>
                  <td style={{ padding: '12px', color: styles.textHighlight, fontWeight: 800, fontFamily: 'monospace' }}>{row.prefix}</td>
                  <td style={{ padding: '12px', color: styles.descText, fontWeight: 600 }}>{row.ipv4}</td>
                  <td style={{ padding: '12px', color: styles.descText, lineHeight: '1.4' }}>{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};