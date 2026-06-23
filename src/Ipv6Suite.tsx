import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface Ipv6SuiteProps { isDarkMode?: boolean; }

export const Ipv6Suite: React.FC<Ipv6SuiteProps> = ({ isDarkMode = true }) => {
  const [tab, setTab] = useState<'compress' | 'visualizer' | 'types'>('compress');
  const [rawAddress, setRawAddress] = useState('2001:0db8:0000:0000:0008:0000:0000:417a');
  const [subnetBits, setSubnetBits] = useState(64);
  const T = getLabTheme(isDarkMode);

  const compressAddress = (address: string) => {
    try {
      const segments = address.trim().split(':');
      if (segments.length !== 8) return { error: 'Address must contain exactly 8 hex groups separated by colons.' };
      const step1 = segments.map(s => { const c = s.replace(/^0+/, ''); return c === '' ? '0' : c; });
      let maxLen = 0, maxStart = -1, curLen = 0, curStart = -1;
      step1.forEach((s, i) => {
        if (s === '0') { if (curLen === 0) curStart = i; curLen++; if (curLen > maxLen) { maxLen = curLen; maxStart = curStart; } }
        else curLen = 0;
      });
      const compressed = maxLen > 1
        ? `${step1.slice(0, maxStart).join(':')}::${step1.slice(maxStart + maxLen).join(':')}`
        : step1.join(':');
      return { step1: step1.join(':'), final: compressed };
    } catch {
      return { error: 'Invalid hexadecimal format.' };
    }
  };

  const result = compressAddress(rawAddress);

  const ADDRESS_TYPES = [
    { type: 'Global Unicast (GUA)',  prefix: '2000::/3',       ipv4: 'Public IP',         purpose: 'Publicly routable internet traffic. Globally unique, allocated by RIRs.' },
    { type: 'Link-Local (LLA)',      prefix: 'fe80::/10',      ipv4: 'APIPA 169.254.x.x', purpose: 'Mandatory non-routable link address. Auto-configured on every interface for local-link neighbour discovery.' },
    { type: 'Unique Local (ULA)',    prefix: 'fc00::/7',       ipv4: 'RFC 1918 private',  purpose: 'Private addressing for internal networks. Not routable on the public internet.' },
    { type: 'Multicast',            prefix: 'ff00::/8',       ipv4: 'Class D 224.0.0.0/4','purpose': 'One-to-many delivery. Replaces IPv4 broadcast entirely.' },
    { type: 'Loopback',             prefix: '::1/128',        ipv4: '127.0.0.1',         purpose: 'Internal software loopback interface.' },
    { type: 'Unspecified',          prefix: '::/128',         ipv4: '0.0.0.0',           purpose: 'Placeholder before address assignment is complete.' },
  ];

  const tabBtn = (id: typeof tab, label: string) => (
    <button key={id} type="button" onClick={() => setTab(id)}
      style={{ flex: 1, padding: '7px 8px', fontWeight: 700, fontSize: '0.78rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: tab === id ? T.accent : 'transparent', color: tab === id ? '#fff' : T.textSecondary, transition: 'all 0.12s' }}>
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>IPv6 Address Basics</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>Compress 128-bit addresses, visualize prefix boundaries, and look up address type ranges.</p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
          {tabBtn('compress', 'Shorthand')}
          {tabBtn('visualizer', 'Structure')}
          {tabBtn('types', 'Address types')}
        </div>
      </div>

      {/* Tab 1: Compression */}
      {tab === 'compress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>Uncompressed IPv6 address (8 groups)</label>
            <input type="text" value={rawAddress} onChange={e => setRawAddress(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem', borderRadius: '6px', border: T.border, backgroundColor: T.insetBg, color: T.textPrimary, fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, outline: 'none' }} />
          </div>

          {!result.error ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '1rem', backgroundColor: T.panelBg, borderRadius: '8px', borderLeft: `4px solid ${T.warning}`, border: T.border }}>
                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: '5px' }}>Rule 1 — Omit leading zeros within each group</span>
                <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: T.warning }}>{result.step1}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: T.panelBg, borderRadius: '8px', borderLeft: `4px solid ${T.success}`, border: T.border }}>
                <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', marginBottom: '5px' }}>Rule 2 — Collapse longest run of all-zero groups with ::</span>
                <div style={{ fontFamily: 'monospace', fontSize: '1.35rem', fontWeight: 900, color: T.success }}>{result.final}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: T.dangerSubtle, color: T.danger, borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem', border: `1px solid ${T.danger}` }}>
              {result.error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {[
              { rule: 'Leading zeros', ex: '0db8 → db8', note: 'Strip leading zeros from each 16-bit group individually.' },
              { rule: 'All-zero group', ex: '0000 → 0', note: 'A group of all zeros collapses to a single 0.' },
              { rule: 'Double colon ::', ex: '0:0:0 → ::', note: 'Only one :: per address — use it for the longest run of zero groups.' },
            ].map(r => (
              <div key={r.rule} style={{ backgroundColor: T.panelBg, padding: '10px 12px', borderRadius: '8px', border: T.border }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: T.textPrimary, marginBottom: 3 }}>{r.rule}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: T.accent, marginBottom: 3 }}>{r.ex}</div>
                <div style={{ fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Structure visualizer */}
      {tab === 'visualizer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: T.textSecondary }}>Prefix length</label>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: T.accent, fontSize: '1rem' }}>/{subnetBits}</span>
            </div>
            <input type="range" min="16" max="128" step="4" value={subnetBits} onChange={e => setSubnetBits(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
          </div>

          <div style={{ display: 'flex', height: '64px', borderRadius: '8px', overflow: 'hidden', border: T.border }}>
            <div style={{ flex: 48, backgroundColor: '#1d6af5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
              <span>Global prefix</span>
              <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', opacity: 0.8 }}>48 bits (ISP)</span>
            </div>
            <div style={{ flex: 16, backgroundColor: subnetBits >= 64 ? '#7c3aed' : T.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px', borderLeft: `2px solid ${T.borderColor}`, color: subnetBits >= 64 ? '#fff' : T.textMuted, fontWeight: 700, fontSize: '0.8rem', transition: 'background-color 0.3s' }}>
              <span>Subnet ID</span>
              <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', opacity: 0.8 }}>16 bits</span>
            </div>
            <div style={{ flex: 64, backgroundColor: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '4px', borderLeft: `2px solid ${T.borderColor}`, color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
              <span>Interface ID</span>
              <span style={{ fontSize: '0.62rem', fontFamily: 'monospace', opacity: 0.8 }}>64 bits (SLAAC/EUI-64)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, justifyContent: 'center', flexWrap: 'wrap', padding: '1rem', backgroundColor: T.panelBg, borderRadius: '8px', border: T.border }}>
            <span style={{ color: '#4493f8' }}>2001:0db8:3c4d</span>
            <span style={{ color: subnetBits >= 64 ? '#a855f7' : T.textMuted, transition: 'color 0.3s' }}>:0015</span>
            <span style={{ color: '#0d9488' }}>:0000:0000:0000:1a2f</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Global prefix (48 bits)', color: '#1d6af5', desc: 'Assigned by the ISP. Identifies the subscriber organisation on the internet.' },
              { label: 'Subnet ID (16 bits)', color: '#7c3aed', desc: 'Used internally to number VLANs or segments. Gives 65,536 subnets.' },
              { label: 'Interface ID (64 bits)', color: '#0d9488', desc: 'Host identifier. Often set by SLAAC using the EUI-64 MAC derivation method.' },
            ].map(f => (
              <div key={f.label} style={{ backgroundColor: T.panelBg, padding: '10px 12px', borderRadius: '8px', border: T.border, borderLeft: `4px solid ${f.color}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: f.color, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: '0.72rem', color: T.textSecondary, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Address types */}
      {tab === 'types' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: T.panelBg }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textPrimary, borderBottom: T.border }}>Address type</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.accent, borderBottom: T.border, fontFamily: 'monospace' }}>Prefix</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textSecondary, borderBottom: T.border }}>IPv4 equivalent</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: T.textSecondary, borderBottom: T.border }}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              {ADDRESS_TYPES.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.borderColor}`, backgroundColor: i % 2 === 0 ? 'transparent' : T.panelBg }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: T.textPrimary }}>{row.type}</td>
                  <td style={{ padding: '10px 12px', color: T.accent, fontWeight: 700, fontFamily: 'monospace' }}>{row.prefix}</td>
                  <td style={{ padding: '10px 12px', color: T.textSecondary }}>{row.ipv4}</td>
                  <td style={{ padding: '10px 12px', color: T.textSecondary, lineHeight: 1.5 }}>{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Ipv6Suite;
