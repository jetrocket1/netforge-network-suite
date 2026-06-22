import React, { useState } from 'react';

interface ProtocolMapperProps {
  isDarkMode?: boolean;
}

export const ProtocolMapper: React.FC<ProtocolMapperProps> = ({ isDarkMode = true }) => {
  const [hoveredOsi, setHoveredOsi] = useState<number | null>(null);
  const [hoveredTcp, setHoveredTcp] = useState<string | null>(null);

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    setupBg: isDarkMode ? '#1e293b' : '#f8fafc',
    chartBg: isDarkMode ? '#0f172a' : '#f8fafc',
    textHighlight: '#38bdf8'
  };

  // Maps the OSI Layers with flags pointing to their respective TCP/IP structural parent blocks
  const osiLayers = [
    { num: 7, name: 'Application', tcpParent: 'Application', color: '#ef4444', details: 'Handles end-user application protocols, formatting, encryption, and user-to-network presentation.' },
    { num: 6, name: 'Presentation', tcpParent: 'Application', color: '#ef4444', details: 'Sits under Application in OSI but is consolidated natively directly into the TCP/IP Application layer.' },
    { num: 5, name: 'Session', tcpParent: 'Application', color: '#ef4444', details: 'Manages logical session teardowns and host connection persistence, bundled into TCP/IP Application space.' },
    { num: 4, name: 'Transport', tcpParent: 'Transport', color: '#10b981', details: 'Identical across both models. Coordinates host-to-host multiplexing via reliable TCP or lightweight UDP channels.' },
    { num: 3, name: 'Network', tcpParent: 'Internet', color: '#06b6d4', details: 'Known as the Internet Layer in TCP/IP. Packs logical routing components, matching packets to optimal IP paths.' },
    { num: 2, name: 'Data Link', tcpParent: 'Network Access', color: '#3b82f6', details: 'Maps out hardware MAC addressing constraints and frame framing parameters inside the TCP/IP Network Access layer.' },
    { num: 1, name: 'Physical', tcpParent: 'Network Access', color: '#3b82f6', details: 'Deals with the raw transmission of bits over wire, fiber, or air frequencies, abstracted away in TCP/IP.' }
  ];

  const tcpLayers = [
    { name: 'Application', osiChildren: [7, 6, 5], color: '#ef4444', protocols: ['HTTP', 'DNS', 'DHCP', 'SSH', 'TLS'] },
    { name: 'Transport', osiChildren: [4], color: '#10b981', protocols: ['TCP', 'UDP'] },
    { name: 'Internet', osiChildren: [3], color: '#06b6d4', protocols: ['IPv4', 'IPv6', 'ICMP', 'OSPF'] },
    { name: 'Network Access', osiChildren: [2, 1], color: '#3b82f6', protocols: ['Ethernet', '802.11 Wi-Fi', 'ARP'] }
  ];

  // Logic checks for rendering matching highlight borders across the stacks
  const isOsiHighlighted = (layerNum: number, tcpParent: string) => {
    if (hoveredOsi === layerNum) return true;
    if (hoveredTcp === tcpParent) return true;
    return false;
  };

  const isTcpHighlighted = (layerName: string, children: number[]) => {
    if (hoveredTcp === layerName) return true;
    if (hoveredOsi !== null && children.includes(hoveredOsi)) return true;
    return false;
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: styles.panelBg,
      borderRadius: '16px',
      border: `1px solid ${styles.panelBorder}`,
      color: styles.titleText
    }}>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: `2px solid ${styles.panelBorder}`, paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          🔄 TCP/IP vs. OSI Reference Model Stack Mapper
        </h3>
        <p style={{ color: styles.descText, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
          Hover over any architectural layer block to visualize how historical abstractions cross-map directly to modern real-world protocol suites.
        </p>
      </div>

      {/* STACK COLUMNS WORKSPACE SPLIT CONTAINER */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        
        {/* LEFT COLUMN: THE 7-LAYER OSI STACK */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', textAlign: 'center', marginBottom: '4px' }}>Theoretical OSI Model</span>
          
          {osiLayers.map((l) => {
            const active = isOsiHighlighted(l.num, l.tcpParent);
            return (
              <div
                key={l.num}
                onMouseEnter={() => setHoveredOsi(l.num)}
                onMouseLeave={() => setHoveredOsi(null)}
                style={{
                  padding: '12px',
                  backgroundColor: styles.setupBg,
                  borderRadius: '6px',
                  border: active ? `2px solid ${l.color}` : `1px solid ${styles.panelBorder}`,
                  cursor: 'help',
                  transition: 'all 0.15s ease',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: active ? `0 0 10px ${l.color}30` : 'none',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  <span style={{ color: l.color, marginRight: '8px', fontFamily: 'monospace' }}>L{l.num}</span>
                  {l.name}
                </div>
                <span style={{ fontSize: '0.7rem', color: styles.descText, fontFamily: 'monospace' }}>{l.tcpParent} block</span>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: THE 4-LAYER TCP/IP ARTIFACT STACK */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', textAlign: 'center', marginBottom: '4px' }}>Production TCP/IP Suite</span>
          
          {tcpLayers.map((t) => {
            const active = isTcpHighlighted(t.name, t.osiChildren);
            
            // Flex sizing modifier dynamically stretches heights to perfectly balance adjacent 7 layers proportionally on screen
            const heightMultiplier = t.name === 'Application' ? 3 : t.name === 'Network Access' ? 2 : 1;

            return (
              <div
                key={t.name}
                onMouseEnter={() => setHoveredTcp(t.name)}
                onMouseLeave={() => setHoveredTcp(null)}
                style={{
                  flex: heightMultiplier,
                  padding: '16px 12px',
                  backgroundColor: styles.setupBg,
                  borderRadius: '6px',
                  border: active ? `2px solid ${t.color}` : `1px solid ${styles.panelBorder}`,
                  cursor: 'help',
                  transition: 'all 0.15s ease',
                  transform: active ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: active ? `0 0 10px ${t.color}30` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontWeight: 800, color: t.color, fontSize: '1rem', marginBottom: '4px' }}>{t.name}</div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {t.protocols.map(p => (
                    <span key={p} style={{ fontSize: '0.65rem', fontFamily: 'monospace', backgroundColor: styles.chartBg, padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{p}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* DYNAMIC CONTEXTUAL FIELD BREAKDOWN SUMMARY BAR */}
      <div style={{ 
        backgroundColor: styles.chartBg, 
        padding: '1rem 1.25rem', 
        borderRadius: '8px', 
        borderLeft: `4px solid ${hoveredOsi !== null ? osiLayers.find(o => o.num === hoveredOsi)?.color : hoveredTcp !== null ? tcpLayers.find(t => t.name === hoveredTcp)?.color : '#475569'}`,
        fontSize: '0.85rem',
        lineHeight: '1.5',
        minHeight: '40px',
        transition: 'all 0.2s ease'
      }}>
        {hoveredOsi !== null ? (
          <div><strong>OSI Layer {hoveredOsi} Insight:</strong> {osiLayers.find(o => o.num === hoveredOsi)?.details}</div>
        ) : hoveredTcp !== null ? (
          <div><strong>TCP/IP {hoveredTcp} Stack Insight:</strong> Consolidates the architectural responsibilities of OSI Layer(s): <strong>{tcpLayers.find(t => t.name === hoveredTcp)?.osiChildren.map(n => `L${n}`).join(', ')}</strong> to map raw user application interactions efficiently straight to protocol sockets.</div>
        ) : (
          <div style={{ color: styles.descText }}>💡 <em>Hover over individual blocks inside either matrix hierarchy to extract granular mapping rules and cross-layer mechanics.</em></div>
        )}
      </div>

    </div>
  );
};