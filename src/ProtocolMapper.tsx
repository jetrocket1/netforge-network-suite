import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface ProtocolMapperProps { isDarkMode?: boolean; }

export const ProtocolMapper: React.FC<ProtocolMapperProps> = ({ isDarkMode = true }) => {
  const [hoveredOsi, setHoveredOsi] = useState<number | null>(null);
  const [hoveredTcp, setHoveredTcp] = useState<string | null>(null);
  const T = getLabTheme(isDarkMode);

  const osiLayers = [
    { num: 7, name: 'Application',  tcpParent: 'Application',     color: '#f85149', details: 'Provides network services directly to end-user applications — HTTP, DNS, SMTP, FTP.' },
    { num: 6, name: 'Presentation', tcpParent: 'Application',     color: '#f85149', details: 'Data formatting, encryption, and compression. In practice, merged into the Application layer in TCP/IP.' },
    { num: 5, name: 'Session',      tcpParent: 'Application',     color: '#f85149', details: 'Manages session setup, maintenance, and teardown between applications. Also merged into TCP/IP Application.' },
    { num: 4, name: 'Transport',    tcpParent: 'Transport',       color: '#3fb950', details: 'Host-to-host delivery using port numbers. TCP provides reliability; UDP provides speed. Identical in both models.' },
    { num: 3, name: 'Network',      tcpParent: 'Internet',        color: T.accent,  details: 'Logical addressing and routing between networks. Called "Internet" in TCP/IP. IPv4, IPv6, and ICMP live here.' },
    { num: 2, name: 'Data Link',    tcpParent: 'Network Access',  color: '#388bfd', details: 'Frame delivery on a single network segment using MAC addresses. Ethernet, Wi-Fi, and ARP operate here.' },
    { num: 1, name: 'Physical',     tcpParent: 'Network Access',  color: '#388bfd', details: 'Raw bit transmission over cables, fibre, or radio waves. Abstracted away in the TCP/IP Network Access layer.' },
  ];

  const tcpLayers = [
    { name: 'Application',    osiNums: [7, 6, 5], color: '#f85149', protocols: ['HTTP', 'DNS', 'DHCP', 'SSH', 'TLS'] },
    { name: 'Transport',      osiNums: [4],       color: '#3fb950', protocols: ['TCP', 'UDP'] },
    { name: 'Internet',       osiNums: [3],       color: T.accent,  protocols: ['IPv4', 'IPv6', 'ICMP', 'OSPF'] },
    { name: 'Network Access', osiNums: [2, 1],    color: '#388bfd', protocols: ['Ethernet', '802.11', 'ARP'] },
  ];

  const osiActive = (num: number, tcpParent: string) => hoveredOsi === num || hoveredTcp === tcpParent;
  const tcpActive = (name: string, kids: number[]) => hoveredTcp === name || (hoveredOsi !== null && kids.includes(hoveredOsi));

  const detail = hoveredOsi !== null
    ? `OSI Layer ${hoveredOsi} — ${osiLayers.find(o => o.num === hoveredOsi)?.details}`
    : hoveredTcp !== null
      ? `TCP/IP ${hoveredTcp} — maps to OSI layer(s): ${tcpLayers.find(t => t.name === hoveredTcp)?.osiNums.map(n => `L${n}`).join(', ')}. ${hoveredTcp === 'Application' ? 'Combines application, presentation, and session concerns.' : hoveredTcp === 'Network Access' ? 'Combines data link (framing, MAC addressing) and physical (bit transmission) concerns.' : ''}`
      : null;

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>OSI vs TCP/IP Models</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Hover over any layer to see how the theoretical OSI model maps to the practical TCP/IP suite used on the internet today.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>

        {/* OSI */}
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 4 }}>OSI model — 7 layers</span>
          {osiLayers.map(l => {
            const active = osiActive(l.num, l.tcpParent);
            return (
              <div key={l.num} onMouseEnter={() => setHoveredOsi(l.num)} onMouseLeave={() => setHoveredOsi(null)}
                style={{ padding: '10px 12px', borderRadius: '6px', border: active ? `2px solid ${l.color}` : T.border, backgroundColor: active ? `${l.color}14` : T.panelBg, cursor: 'help', transition: 'all 0.12s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transform: active ? 'scale(1.02)' : 'scale(1)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  <span style={{ color: l.color, marginRight: '8px', fontFamily: 'monospace', fontSize: '0.75rem' }}>L{l.num}</span>
                  {l.name}
                </div>
                <span style={{ fontSize: '0.65rem', color: T.textMuted, fontFamily: 'monospace' }}>{l.tcpParent}</span>
              </div>
            );
          })}
        </div>

        {/* TCP/IP */}
        <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 4 }}>TCP/IP suite — 4 layers</span>
          {tcpLayers.map(t => {
            const active = tcpActive(t.name, t.osiNums);
            const flex = t.name === 'Application' ? 3 : t.name === 'Network Access' ? 2 : 1;
            return (
              <div key={t.name} onMouseEnter={() => setHoveredTcp(t.name)} onMouseLeave={() => setHoveredTcp(null)}
                style={{ flex, padding: '14px 12px', borderRadius: '6px', border: active ? `2px solid ${t.color}` : T.border, backgroundColor: active ? `${t.color}14` : T.panelBg, cursor: 'help', transition: 'all 0.12s', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, transform: active ? 'scale(1.02)' : 'scale(1)' }}>
                <div style={{ fontWeight: 700, color: t.color, fontSize: '0.95rem' }}>{t.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {t.protocols.map(p => (
                    <span key={p} style={{ fontSize: '0.65rem', fontFamily: 'monospace', backgroundColor: T.insetBg, padding: '2px 6px', borderRadius: 3, fontWeight: 700, color: T.textSecondary }}>{p}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Info bar */}
      <div style={{ padding: '1rem 1.25rem', borderRadius: '8px', backgroundColor: T.panelBg, borderLeft: `4px solid ${hoveredOsi !== null ? osiLayers.find(o => o.num === hoveredOsi)?.color : hoveredTcp !== null ? tcpLayers.find(t => t.name === hoveredTcp)?.color : T.borderColor}`, fontSize: '0.85rem', lineHeight: '1.5', transition: 'border-color 0.2s', minHeight: 48 }}>
        {detail ? <div style={{ color: T.textPrimary }}>{detail}</div> : <div style={{ color: T.textMuted, fontStyle: 'italic' }}>Hover over a layer block on either side to see how they correspond to each other and which protocols live there.</div>}
      </div>

      {/* Key insight */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: T.border }}>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: T.accent }}>Why two models?</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>The OSI model was designed as a vendor-neutral reference in the 1980s. TCP/IP had already been deployed widely before OSI was finalised, so TCP/IP became the actual standard. OSI is still taught because its layer names provide a precise vocabulary for troubleshooting.</p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: '#3fb950' }}>Where they differ</h4>
          <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.82rem', lineHeight: '1.6' }}>TCP/IP collapses OSI's top three layers (Application, Presentation, Session) into one Application layer, and collapses the bottom two (Data Link, Physical) into Network Access. The middle two layers map 1:1.</p>
        </div>
      </div>

    </div>
  );
};

export default ProtocolMapper;
