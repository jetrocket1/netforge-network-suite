import React, { useState } from 'react';

interface WirelessToWiredLabProps {
  isDarkMode?: boolean;
}

interface InfraNode {
  id: string;
  label: string;
  icon: string;
  layer: 'RF Layer' | 'Physical Layer Boundary' | 'Distribution Backbone';
  mediaType: string;
  details: string;
  capsuleState: string;
}

export const WirelessToWiredLab: React.FC<WirelessToWiredLabProps> = ({ isDarkMode = true }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('client');

  const infrastructureNodes: InfraNode[] = [
    {
      id: 'client',
      label: 'Wireless Endpoint (STA)',
      icon: '📱',
      layer: 'RF Layer',
      mediaType: 'Radio Waves (2.4GHz / 5GHz / 6GHz)',
      details: 'The client station translates binary data frames into phase-shifted electromagnetic radio frequencies traversing the air medium.',
      capsuleState: '802.11 Wireless MAC Frame Data'
    },
    {
      id: 'ap',
      label: 'Enterprise Access Point',
      icon: '🛰️',
      layer: 'Physical Layer Boundary',
      mediaType: 'Solid-Core Horizontal Copper Cabling',
      details: 'Terminates the 802.11 radio medium, un-encapsulates the wireless header wrapper, and converts the raw payload onto an 802.3 Ethernet structured run passing through structural ceiling/wall conduits.',
      capsuleState: 'Media Translation: 802.11 Frame ➔ 802.3 Ethernet Packet'
    },
    {
      id: 'patch',
      label: 'Server Cabinet Patch Panel',
      icon: '🔌',
      layer: 'Physical Layer Boundary',
      mediaType: 'Passive 110 Punch-Down Block Connection',
      details: 'Acts as a strict mechanical termination frame protecting the permanent structural wall cables from stress. It passes raw electrical signals without executing any software switching logic.',
      capsuleState: 'Pure Layer 1 Physical Bit Stream Propagation'
    },
    {
      id: 'switch',
      label: 'Layer 2 PoE+ Access Switch',
      icon: '🎛️',
      layer: 'Physical Layer Boundary',
      mediaType: 'Stranded Cat6 Patch Lead (RJ45 Connectivity)',
      details: 'Connected via a flexible patch lead from the front of the patch panel. This device injects standard 802.3at power down the lines to energize the AP while reading destination MAC addresses to switch localized VLAN domain frames.',
      capsuleState: '802.3 Ethernet Frame (VLAN Dot1Q Tagged)'
    },
    {
      id: 'core',
      label: 'Main Distribution Frame (MDF) Core Switch',
      icon: '📟',
      layer: 'Distribution Backbone',
      mediaType: 'OM4 Multimode Fiber Optic LC Link Uplink',
      details: 'The ultimate data concentration aggregator core. Interconnects corporate server blocks and manages inter-VLAN routing tables using high-bandwidth optical laser waves.',
      capsuleState: 'Routed IP Packet Encap / SFP+ Optical Modulation'
    }
  ];

  const currentNode = infrastructureNodes.find(n => n.id === selectedNodeId) || infrastructureNodes[0];

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    accent: isDarkMode ? '#06b6d4' : '#0284c7',
    wireColor: isDarkMode ? '#334155' : '#cbd5e1',
    fwd: '#10b981',
    lst: '#eab308'
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.panelBg, borderRadius: '12px', border: styles.panelBorder, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}>
      
      {/* SECTION HEADER PANEL */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>📟 Wireless-to-Wired Boundary Infrastructure Lab</h3>
        <p style={{ color: styles.descText, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Click on any node item component across the distribution line path to inspect media handshakes and capsule conversions.</p>
      </div>

      {/* HORIZONTAL PHYSICAL TOPOLOGY WIRE MAP */}
      <div style={{ 
        backgroundColor: styles.chartBg, border: '1px solid #1e293b', borderRadius: '12px', 
        padding: '3rem 1.5rem', position: 'relative', display: 'flex', 
        justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', overflowX: 'auto' 
      }}>
        
        {/* PHYSICAL TRUNK CONNECTING VECTOR SYSTEM */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', minWidth: '700px' }}>
          {/* Wireless Link (Dotted RF Air Medium) */}
          <line x1="10%" y1="50%" x2="30%" y2="50%" stroke={styles.accent} strokeWidth="3" strokeDasharray="6 4" />
          {/* Permanent Horizontal Infrastructure Wall Run */}
          <line x1="30%" y1="50%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="3" />
          {/* Flexible Cabinet Patch Cable Lead */}
          <line x1="50%" y1="50%" x2="70%" y2="50%" stroke="#10b981" strokeWidth="3" />
          {/* High-Speed Optical Backbone Link Trunk */}
          <line x1="70%" y1="50%" x2="90%" y2="50%" stroke="#eab308" strokeWidth="3" />
        </svg>

        {infrastructureNodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          return (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              style={{
                textAlign: 'center', width: '120px', zIndex: 2, cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              {/* INTERACTIVE DEVICE AVATAR ICON */}
              <div style={{
                fontSize: '2rem', width: '60px', height: '60px', margin: '0 auto',
                backgroundColor: isSelected ? styles.setupBg : (isDarkMode ? '#111827' : '#ffffff'),
                border: `2px solid ${isSelected ? styles.accent : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isSelected ? `0 0 16px ${styles.accent}` : '0 4px 6px rgba(0,0,0,0.15)',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s ease'
              }}>
                {node.icon}
              </div>
              
              {/* LABEL AND SUBTEXT */}
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginTop: '8px', color: isSelected ? styles.accent : styles.textPrimary }}>
                {node.label.split(' (')[0]}
              </div>
              <div style={{ fontSize: '0.55rem', fontWeight: 'bold', color: styles.descText, textTransform: 'uppercase', marginTop: '2px' }}>
                {node.layer.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* LOWER SECTION: SYSTEM INSPECTION HUB DETAILS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* COMPONENT SPECS BOX */}
        <div style={{ backgroundColor: styles.setupBg, padding: '1.5rem', borderRadius: '10px', border: styles.panelBorder }}>
          <span style={{ fontSize: '0.6rem', color: styles.accent, fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Layer Context Specs</span>
          <h4 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', fontWeight: 800 }}>{currentNode.label}</h4>
          <div style={{ fontSize: '0.75rem', margin: '8px 0', borderLeft: `3px solid ${styles.accent}`, paddingLeft: '8px', color: styles.descText, fontWeight: 'bold' }}>
            Active Layer Topology: {currentNode.layer}
          </div>
          <p style={{ fontSize: '0.85rem', margin: '12px 0 0 0', color: styles.textPrimary, lineHeight: '1.5' }}>{currentNode.details}</p>
        </div>

        {/* CABLE MEDIA AND FRAME HEAD ENCAPSULATION HUB */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* L1 Media Info */}
          <div style={{ backgroundColor: '#05070f', border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <span style={{ fontSize: '0.6rem', color: styles.descText, fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Layer 1 Interface &amp; Physical Media</span>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', marginTop: '4px' }}>
              🧱 {currentNode.mediaType}
            </div>
          </div>

          {/* L2/L3 Encapsulation Protocol Wrap Display */}
          <div style={{ backgroundColor: styles.terminalBg, border: '1px solid #1e293b', borderRadius: '8px', padding: '1rem' }}>
            <span style={{ fontSize: '0.6rem', color: styles.lst, fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Data Encapsulation State Pipeline</span>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: styles.terminalText, fontFamily: 'monospace', marginTop: '4px' }}>
              📦 {currentNode.capsuleState}
            </div>
          </div>

        </div>

      </div>

      {/* PHYSICAL TOPOLOGY LEGEND TRACE MAP */}
      <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', fontSize: '0.75rem', color: styles.descText, display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div><span style={{ color: styles.accent }}>•••</span> Radio RF Boundary</div>
        <div><span style={{ color: '#3b82f6' }}>───</span> Permanent Solid-Core Structural Wall Run</div>
        <div><span style={{ color: '#10b981' }}>───</span> Flexible Cabinets Stranded Patch Lead</div>
        <div><span style={{ color: '#eab308' }}>───</span> High-Bandwidth Core Optical Fiber Uplink</div>
      </div>

    </div>
  );
};

export default WirelessToWiredLab;