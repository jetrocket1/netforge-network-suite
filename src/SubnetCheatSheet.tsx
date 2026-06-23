import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface SubnetCheatSheetProps { isDarkMode?: boolean; }

export const SubnetCheatSheet: React.FC<SubnetCheatSheetProps> = ({ isDarkMode = true }) => {
  const [activeRange, setActiveRange] = useState<'8-15' | '16-23' | '24-32'>('24-32');
  const T = getLabTheme(isDarkMode);

  const subnetData = {
    '8-15': [
      { cidr: '/8',  mask: '255.0.0.0',     hosts: '16,777,214', wildcard: '0.255.255.255', binary: '11111111.00000000.00000000.00000000' },
      { cidr: '/9',  mask: '255.128.0.0',   hosts: '8,388,606',  wildcard: '0.127.255.255', binary: '11111111.10000000.00000000.00000000' },
      { cidr: '/10', mask: '255.192.0.0',   hosts: '4,194,302',  wildcard: '0.63.255.255',  binary: '11111111.11000000.00000000.00000000' },
      { cidr: '/11', mask: '255.224.0.0',   hosts: '2,097,150',  wildcard: '0.31.255.255',  binary: '11111111.11100000.00000000.00000000' },
      { cidr: '/12', mask: '255.240.0.0',   hosts: '1,048,574',  wildcard: '0.15.255.255',  binary: '11111111.11110000.00000000.00000000' },
      { cidr: '/13', mask: '255.248.0.0',   hosts: '524,286',    wildcard: '0.7.255.255',   binary: '11111111.11111000.00000000.00000000' },
      { cidr: '/14', mask: '255.252.0.0',   hosts: '262,142',    wildcard: '0.3.255.255',   binary: '11111111.11111100.00000000.00000000' },
      { cidr: '/15', mask: '255.254.0.0',   hosts: '131,070',    wildcard: '0.1.255.255',   binary: '11111111.11111110.00000000.00000000' },
    ],
    '16-23': [
      { cidr: '/16', mask: '255.255.0.0',   hosts: '65,534',     wildcard: '0.0.255.255',   binary: '11111111.11111111.00000000.00000000' },
      { cidr: '/17', mask: '255.255.128.0', hosts: '32,766',     wildcard: '0.0.127.255',   binary: '11111111.11111111.10000000.00000000' },
      { cidr: '/18', mask: '255.255.192.0', hosts: '16,382',     wildcard: '0.0.63.255',    binary: '11111111.11111111.11000000.00000000' },
      { cidr: '/19', mask: '255.255.224.0', hosts: '8,190',      wildcard: '0.0.31.255',    binary: '11111111.11111111.11100000.00000000' },
      { cidr: '/20', mask: '255.255.240.0', hosts: '4,094',      wildcard: '0.0.15.255',    binary: '11111111.11111111.11110000.00000000' },
      { cidr: '/21', mask: '255.255.248.0', hosts: '2,046',      wildcard: '0.0.7.255',     binary: '11111111.11111111.11111000.00000000' },
      { cidr: '/22', mask: '255.255.252.0', hosts: '1,022',      wildcard: '0.0.3.255',     binary: '11111111.11111111.11111100.00000000' },
      { cidr: '/23', mask: '255.255.254.0', hosts: '510',        wildcard: '0.0.1.255',     binary: '11111111.11111111.11111110.00000000' },
    ],
    '24-32': [
      { cidr: '/24', mask: '255.255.255.0',   hosts: '254',         wildcard: '0.0.0.255', binary: '11111111.11111111.11111111.00000000' },
      { cidr: '/25', mask: '255.255.255.128', hosts: '126',         wildcard: '0.0.0.127', binary: '11111111.11111111.11111111.10000000' },
      { cidr: '/26', mask: '255.255.255.192', hosts: '62',          wildcard: '0.0.0.63',  binary: '11111111.11111111.11111111.11000000' },
      { cidr: '/27', mask: '255.255.255.224', hosts: '30',          wildcard: '0.0.0.31',  binary: '11111111.11111111.11111111.11100000' },
      { cidr: '/28', mask: '255.255.255.240', hosts: '14',          wildcard: '0.0.0.15',  binary: '11111111.11111111.11111111.11110000' },
      { cidr: '/29', mask: '255.255.255.248', hosts: '6',           wildcard: '0.0.0.7',   binary: '11111111.11111111.11111111.11111000' },
      { cidr: '/30', mask: '255.255.255.252', hosts: '2',           wildcard: '0.0.0.3',   binary: '11111111.11111111.11111111.11111100' },
      { cidr: '/31', mask: '255.255.255.254', hosts: '2 (P2P)',     wildcard: '0.0.0.1',   binary: '11111111.11111111.11111111.11111110' },
      { cidr: '/32', mask: '255.255.255.255', hosts: '1 (host)',    wildcard: '0.0.0.0',   binary: '11111111.11111111.11111111.11111111' },
    ],
  } as const;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>IPv4 Subnet Reference</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>Subnet mask, wildcard, binary bit map and host counts for every CIDR prefix.</p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
          {(['8-15', '16-23', '24-32'] as const).map(range => (
            <button key={range} type="button" onClick={() => setActiveRange(range)}
              style={{ padding: '6px 14px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', backgroundColor: activeRange === range ? T.accent : 'transparent', color: activeRange === range ? '#fff' : T.textSecondary, transition: 'all 0.12s', fontFamily: 'monospace' }}>
              /{range.replace('-', '–/')}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
          <thead>
            <tr style={{ backgroundColor: T.panelBg }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.accent, borderBottom: T.border, fontFamily: 'monospace' }}>CIDR</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textPrimary, borderBottom: T.border }}>Subnet mask</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.success, borderBottom: T.border }}>Usable hosts</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textSecondary, borderBottom: T.border }}>Wildcard mask</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textSecondary, borderBottom: T.border, fontFamily: 'monospace' }}>Binary bit map</th>
            </tr>
          </thead>
          <tbody>
            {subnetData[activeRange].map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.borderColor}`, backgroundColor: i % 2 === 0 ? 'transparent' : T.panelBg }}>
                <td style={{ padding: '10px 12px', fontWeight: 800, color: T.accent, fontSize: '0.95rem', fontFamily: 'monospace' }}>{row.cidr}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: T.textPrimary }}>{row.mask}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: T.success }}>{row.hosts}</td>
                <td style={{ padding: '10px 12px', color: T.textSecondary, fontFamily: 'monospace' }}>{row.wildcard}</td>
                <td style={{ padding: '10px 12px', color: T.textMuted, fontFamily: 'monospace', fontSize: '0.74rem', letterSpacing: '0.02em' }}>{row.binary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: T.border }}>
        <div style={{ backgroundColor: T.panelBg, padding: '12px', borderRadius: '8px', border: T.border }}>
          <h5 style={{ margin: '0 0 5px', fontSize: '0.82rem', fontWeight: 700, color: T.accent }}>Usable hosts = 2ⁿ - 2</h5>
          <p style={{ margin: 0, fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>Where n = host bits (32 minus the prefix). Subtract 2 for the network address and broadcast address, which are reserved and cannot be assigned to hosts.</p>
        </div>
        <div style={{ backgroundColor: T.panelBg, padding: '12px', borderRadius: '8px', border: T.border }}>
          <h5 style={{ margin: '0 0 5px', fontSize: '0.82rem', fontWeight: 700, color: T.success }}>Wildcard = inverse of mask</h5>
          <p style={{ margin: 0, fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>Flip each bit of the subnet mask. Wildcards are used in Cisco ACLs and OSPF network statements to specify which bits must match.</p>
        </div>
        <div style={{ backgroundColor: T.panelBg, padding: '12px', borderRadius: '8px', border: T.border }}>
          <h5 style={{ margin: '0 0 5px', fontSize: '0.82rem', fontWeight: 700, color: T.warning }}>/31 and /32 special cases</h5>
          <p style={{ margin: 0, fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>/31 has no broadcast, used for point-to-point links (RFC 3021). /32 is a host route — a single IP address, used in loopback and summarisation.</p>
        </div>
      </div>
    </div>
  );
};

export default SubnetCheatSheet;
