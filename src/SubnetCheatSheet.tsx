import React, { useState } from 'react';

interface SubnetCheatSheetProps {
  isDarkMode?: boolean;
}

export const SubnetCheatSheet: React.FC<SubnetCheatSheetProps> = ({ isDarkMode = true }) => {
  const [activeRange, setActiveRange] = useState<'8-15' | '16-23' | '24-32'>('8-15');

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

  // UNIFIED REFERENCE DICTIONARY: Incrementing cleanly from /8 to /32
  const subnetData = {
    '8-15': [
      { cidr: '/8',  mask: '255.0.0.0',   hosts: '16,777,214 Usable', wildcard: '0.255.255.255', binary: '11111111.00000000.00000000.00000000' },
      { cidr: '/9',  mask: '255.128.0.0', hosts: '8,388,606 Usable', wildcard: '0.127.255.255', binary: '11111111.10000000.00000000.00000000' },
      { cidr: '/10', mask: '255.192.0.0', hosts: '4,194,302 Usable', wildcard: '0.63.255.255', binary: '11111111.11000000.00000000.00000000' },
      { cidr: '/11', mask: '255.224.0.0', hosts: '2,097,150 Usable', wildcard: '0.31.255.255', binary: '11111111.11100000.00000000.00000000' },
      { cidr: '/12', mask: '255.240.0.0', hosts: '1,048,574 Usable', wildcard: '0.15.255.255', binary: '11111111.11110000.00000000.00000000' },
      { cidr: '/13', mask: '255.248.0.0', hosts: '524,286 Usable', wildcard: '0.7.255.255', binary: '11111111.11111000.00000000.00000000' },
      { cidr: '/14', mask: '255.252.0.0', hosts: '262,142 Usable', wildcard: '0.3.255.255', binary: '11111111.11111100.00000000.00000000' },
      { cidr: '/15', mask: '255.254.0.0', hosts: '131,070 Usable', wildcard: '0.1.255.255', binary: '11111111.11111110.00000000.00000000' },
    ],
    '16-23': [
      { cidr: '/16', mask: '255.255.0.0', hosts: '65,534 Usable', wildcard: '0.0.255.255', binary: '11111111.11111111.00000000.00000000' },
      { cidr: '/17', mask: '255.255.128.0', hosts: '32,766 Usable', wildcard: '0.0.127.255', binary: '11111111.11111111.10000000.00000000' },
      { cidr: '/18', mask: '255.255.192.0', hosts: '16,382 Usable', wildcard: '0.0.63.255', binary: '11111111.11111111.11000000.00000000' },
      { cidr: '/19', mask: '255.255.224.0', hosts: '8,190 Usable', wildcard: '0.0.31.255', binary: '11111111.11111111.11100000.00000000' },
      { cidr: '/20', mask: '255.255.240.0', hosts: '4,094 Usable', wildcard: '0.0.15.255', binary: '11111111.11111111.11110000.00000000' },
      { cidr: '/21', mask: '255.255.248.0', hosts: '2,046 Usable', wildcard: '0.0.7.255', binary: '11111111.11111111.11111000.00000000' },
      { cidr: '/22', mask: '255.255.252.0', hosts: '1,022 Usable', wildcard: '0.0.3.255', binary: '11111111.11111111.11111100.00000000' },
      { cidr: '/23', mask: '255.255.254.0', hosts: '510 Usable', wildcard: '0.0.1.255', binary: '11111111.11111111.11111110.00000000' },
    ],
    '24-32': [
      { cidr: '/24', mask: '255.255.255.0', hosts: '254 Usable', wildcard: '0.0.0.255', binary: '11111111.11111111.11111111.00000000' },
      { cidr: '/25', mask: '255.255.255.128', hosts: '126 Usable', wildcard: '0.0.0.127', binary: '11111111.11111111.11111111.10000000' },
      { cidr: '/26', mask: '255.255.255.192', hosts: '62 Usable', wildcard: '0.0.0.63', binary: '11111111.11111111.11111111.11000000' },
      { cidr: '/27', mask: '255.255.255.224', hosts: '30 Usable', wildcard: '0.0.0.31', binary: '11111111.11111111.11111111.11100000' },
      { cidr: '/28', mask: '255.255.255.240', hosts: '14 Usable', wildcard: '0.0.0.15', binary: '11111111.11111111.11111111.11110000' },
      { cidr: '/29', mask: '255.255.255.248', hosts: '6 Usable', wildcard: '0.0.0.7', binary: '11111111.11111111.11111111.11111000' },
      { cidr: '/30', mask: '255.255.255.252', hosts: '2 Usable', wildcard: '0.0.0.3', binary: '11111111.11111111.11111111.11111100' },
      { cidr: '/31', mask: '255.255.255.254', hosts: '2 (P2P Links)', wildcard: '0.0.0.1', binary: '11111111.11111111.11111111.11111110' },
      { cidr: '/32', mask: '255.255.255.255', hosts: '1 (Host Only)', wildcard: '0.0.0.0', binary: '11111111.11111111.11111111.11111111' },
    ]
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
      
      {/* Header Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: `2px solid ${styles.panelBorder}`, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ color: styles.titleText, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            📋 IPv4 Subnet Cheat Sheet & Mask Matrix
          </h3>
          <p style={{ color: styles.descText, margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 500 }}>
            Quickly lookup bit configurations, wildcard parameters, and absolute host capacities across network blocks.
          </p>
        </div>

        {/* Chronological CIDR Tab Layout Buttons */}
        <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '8px', border: `1px solid ${styles.panelBorder}` }}>
          <button onClick={() => setActiveRange('8-15')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeRange === '8-15' ? styles.toggleActiveBg : 'transparent', color: activeRange === '8-15' ? '#ffffff' : styles.descText }}>/8 to /15</button>
          <button onClick={() => setActiveRange('16-23')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeRange === '16-23' ? styles.toggleActiveBg : 'transparent', color: activeRange === '16-23' ? '#ffffff' : styles.descText }}>/16 to /23</button>
          <button onClick={() => setActiveRange('24-32')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: activeRange === '24-32' ? styles.toggleActiveBg : 'transparent', color: activeRange === '24-32' ? '#ffffff' : styles.descText }}>/24 to /32</button>
        </div>
      </div>

      {/* MATRIX TABLE DISPLAY */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: styles.tableHeaderBg }}>
              <th style={{ padding: '12px', fontWeight: 800 }}>CIDR BLOCK</th>
              <th style={{ padding: '12px', fontWeight: 800 }}>SUBNET MASK</th>
              <th style={{ padding: '12px', fontWeight: 800, color: '#10b981' }}>TOTAL USABLE HOSTS</th>
              <th style={{ padding: '12px', fontWeight: 800 }}>WILDCARD MASK</th>
              <th style={{ padding: '12px', fontWeight: 800, fontFamily: 'monospace' }}>BINARY BIT MAPPING</th>
            </tr>
          </thead>
          <tbody>
            {subnetData[activeRange].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${styles.tableRowBorder}`, backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '12px', fontWeight: 800, color: styles.textHighlight, fontSize: '0.95rem' }}>{row.cidr}</td>
                <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{row.mask}</td>
                <td style={{ padding: '12px', fontWeight: 700, color: '#10b981' }}>{row.hosts}</td>
                <td style={{ padding: '12px', color: styles.descText, fontFamily: 'monospace' }}>{row.wildcard}</td>
                <td style={{ padding: '12px', color: styles.descText, fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: '0.02em' }}>{row.binary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};