import React, { useState, useEffect } from 'react';

interface OsiModelProps {
  isDarkMode?: boolean;
}

interface OsiLayer {
  number: number;
  name: string;
  pdu: string;
  protocols: string[];
  color: string;
  desc: string;
  encapAction: string;
  terminalLogs: string[];
}

export const OsiModel: React.FC<OsiModelProps> = ({ isDarkMode = true }) => {
  const [selectedLayer, setSelectedLayer] = useState<number>(7);
  const [animationDirection, setAnimationDirection] = useState<'encap' | 'decap'>('encap');
  const [isPlaying, setIsTesting] = useState<boolean>(false);
  const [wavePhase, setWavePhase] = useState<number>(0);

  // Auto-trace tick loop engine
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedLayer(prev => {
          if (animationDirection === 'encap') {
            if (prev <= 1) {
              setIsTesting(false);
              return 1;
            }
            return prev - 1;
          } else {
            if (prev >= 7) {
              setIsTesting(false);
              return 7;
            }
            return prev + 1;
          }
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, animationDirection]);

  // Layer 1 signal bit wave modulation timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase(prev => (prev + 0.2) % (Math.PI * 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    toggleActiveBg: '#0284c7',
    terminalBg: '#05050a',
    terminalText: '#34d399',
    fwd: '#10b981',
    blk: '#ef4444'
  };

  const layers: OsiLayer[] = [
    { 
      number: 7, name: 'Application', pdu: 'Data', protocols: ['HTTP', 'DNS', 'DHCP', 'SSH'], color: '#ef4444', 
      desc: 'Direct interface for end-user network applications. Handles human-to-computer communication mechanics.', 
      encapAction: 'Generates raw socket payload string fields.',
      terminalLogs: [
        "USER: Launched web browser navigation to https://netforge.internal",
        "DHCP: Verifying active local lease scope... OK [10.0.12.45]",
        "DNS: Resolving hostname query 'netforge.internal'...",
        "DNS: Received A record response -> 192.168.1.100",
        "HTTP: Initializing GET request payload profile wrapper..."
      ]
    },
    { 
      number: 6, name: 'Presentation', pdu: 'Data', protocols: ['SSL/TLS', 'JPEG', 'ASCII'], color: '#f97316', 
      desc: 'Translates, encrypts, or compresses raw data formats into a standardized structure readable across diverse systems.', 
      encapAction: 'Converts native datatypes and structures cryptographic TLS handshakes.',
      terminalLogs: [
        "PRESENTATION: Negotiating symmetric encryption parameters...",
        "TLS: ClientHello cipher suites broadcasted securely.",
        "TLS: ServerHello acknowledgment matched -> TLS_AES_256_GCM_SHA384",
        "CRYPTO: Securing outbound stream context loops.",
        "DATA: Converting plaintext ASCII strings into structured JSON streams."
      ]
    },
    { 
      number: 5, name: 'Session', pdu: 'Data', protocols: ['NetBIOS', 'RPC', 'Sockets'], color: '#eab308', 
      desc: 'Manages, synchronizes, and tears down persistent logical connections and authentication dialogues between end hosts.', 
      encapAction: 'Establishes local port allocation bindings to isolate separate network threads.',
      terminalLogs: [
        "SESSION: Requesting authentication handshake link token...",
        "SOCKET: Binding outbound application port element -> Local OS Port: 51042",
        "RPC: Remotely invoking remote procedure calls to backend system storage.",
        "SESSION: Keeping socket piping status persistent... [KEEPALIVE SENT]",
        "SESSION: Logical host-to-host channel stream fully active."
      ]
    },
    { 
      number: 4, name: 'Transport', pdu: 'Segment / Datagram', protocols: ['TCP', 'UDP'], color: '#10b981', 
      desc: 'Handles flow control, segmentation, and end-to-end reliable transmission delivery via multiplexing port configurations.', 
      encapAction: 'Slices data and appends Source/Destination logical Port headers.',
      terminalLogs: [
        "TCP: Initializing 3-way handshake loop -> [SYN] Sent to 192.168.1.100:443",
        "TCP: Received confirmation packet back -> [SYN-ACK] validated",
        "TCP: Returning final channel check -> [ACK] established",
        "FLOW: Sliding Window allocation adjusted to 65535 bytes capacity limit.",
        "SEGMENT: Chopping payload down into sequential MSS-sized chunks (1460 bytes)."
      ]
    },
    { 
      number: 3, name: 'Network', pdu: 'Packet', protocols: ['IPv4', 'IPv6', 'ICMP', 'OSPF'], color: '#06b6d4', 
      desc: 'Determines optimal physical route paths and handles packet switching via logical IP routing schemes.', 
      encapAction: 'Wraps segment data loops with logical Source/Destination IP addresses.',
      terminalLogs: [
        "IP: Packet creation processing engine active.",
        "IP: Injecting SRC: 10.0.12.45 | DST: 192.168.1.100",
        "ROUTING: Inspecting local kernel routing table entries...",
        "OSPF: Best route match identified via Gateway Interface FastEthernet0/2",
        "IP: TTL value set to default 64 counts constraint boundary."
      ]
    },
    { 
      number: 2, name: 'Data Link', pdu: 'Frame', protocols: ['Ethernet', 'ARP', 'STP', 'VLANs'], color: '#3b82f6', 
      desc: 'Structures data packets into clear physical link configurations. Manages error detection boundaries and local hardware node addresses.', 
      encapAction: 'Clips hardware source/destination MAC boundaries and seals with an FCS trailing checksum.',
      terminalLogs: [
        "ARP: Searching local neighbor lookup tables for hardware address mapping...",
        "ARP: Cache Miss! Broadcasting request -> 'Who has 10.0.12.1?'",
        "ARP: Response received -> Gateway MAC mapped to: 00:0a:95:9d:68:16",
        "ETHERNET: Wrapping frame -> SRC MAC: a4:83:e7:bc:11:02 | DST MAC: 00:0a:95:9d:68:16",
        "FCS: Appending 32-bit Cyclic Redundancy Check trailer onto boundaries."
      ]
    },
    { 
      number: 1, name: 'Physical', pdu: 'Bits', protocols: ['Cat6 Copper', 'Fiber Optic', 'RF Air'], color: '#6366f1', 
      desc: 'Transfers unformatted, raw data bit streams across concrete, physical transmission materials via electrical, optical, or radio modulation.', 
      encapAction: 'Converts assembled frames into unformatted electrical voltages or optical wave pulses.',
      terminalLogs: [
        "PHYSICAL: Preamble bit clock sync timing sequences initialized.",
        "MEDIUM: Detecting link carrier signals across copper interfaces... [LINK UP]",
        "HARDWARE: Encoding binary block arrays using 1000BASE-T Line Encoding math.",
        "OUTPUT: Generating raw voltage shifts onto twisted pair copper array structures.",
        "STREAM: 11001010 01110011 11001101 01010110 bit stream sent out onto wires."
      ]
    }
  ];

  const currentLayerObj = layers.find(l => l.number === selectedLayer)!;

  const stepForward = () => {
    if (animationDirection === 'encap') {
      if (selectedLayer > 1) setSelectedLayer(prev => prev - 1);
    } else {
      if (selectedLayer < 7) setSelectedLayer(prev => prev + 1);
    }
  };

  const stepBackward = () => {
    if (animationDirection === 'encap') {
      if (selectedLayer < 7) setSelectedLayer(prev => prev + 1);
    } else {
      if (selectedLayer > 1) setSelectedLayer(prev => prev - 1);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', backgroundColor: styles.panelBg, borderRadius: '16px', border: styles.panelBorder, color: styles.textPrimary, boxSizing: 'border-box' }}>
      
      {/* Top Header Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: styles.panelBorder, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>🗺️ Interactive 7-Layer OSI Model Master Suite</h3>
          <p style={{ color: styles.descText, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Deconstruct protocol data boundaries, track data flow encapsulation hierarchies, and parse real-world stack locations.</p>
        </div>

        {/* Global Pipeline Mode Selectors */}
        <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '8px', border: styles.panelBorder }}>
          <button type="button" onClick={() => { setAnimationDirection('encap'); setSelectedLayer(7); setIsTesting(false); }} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: animationDirection === 'encap' ? styles.toggleActiveBg : 'transparent', color: animationDirection === 'encap' ? '#ffffff' : styles.descText }}>⬇️ Encapsulation (Tx)</button>
          <button type="button" onClick={() => { setAnimationDirection('decap'); setSelectedLayer(1); setIsTesting(false); }} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: animationDirection === 'decap' ? '#10b981' : 'transparent', color: animationDirection === 'decap' ? '#ffffff' : styles.descText }}>⬆️ Decapsulation (Rx)</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* LEFT COLUMN: ACTIVE INTERACTIVE MATRIX STACK */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          
          {/* STEP CONTROLS PANEL CONSOLE INTERFACE */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: styles.setupBg, padding: '6px', borderRadius: '8px', border: styles.panelBorder, marginBottom: '0.5rem' }}>
            <button type="button" onClick={stepBackward} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: styles.chartBg, color: styles.textPrimary }}>⏮️ Prev</button>
            <button type="button" onClick={() => setIsTesting(!isPlaying)} style={{ flex: 2, padding: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: isPlaying ? styles.blk : styles.fwd, color: '#fff' }}>
              {isPlaying ? '🛑 Pause Trace' : '⚡ Auto-Trace Stack'}
            </button>
            <button type="button" onClick={stepForward} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: styles.chartBg, color: styles.textPrimary }}>Next ⏭️</button>
          </div>

          {layers.map((layer) => {
            const isSelected = layer.number === selectedLayer;
            const flowIndicator = animationDirection === 'encap' ? '👇' : '☝️';

            return (
              <div
                key={layer.number}
                onClick={() => { setSelectedLayer(layer.number); setIsTesting(false); }}
                style={{
                  padding: '10px 1rem',
                  backgroundColor: isSelected ? layer.color : styles.setupBg,
                  color: isSelected ? '#ffffff' : styles.textPrimary,
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #ffffff' : '1px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? `0 4px 12px ${layer.color}40` : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.5 }}>L{layer.number}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{layer.name} Layer</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                  <span>{layer.pdu.split(' ')[0]}</span>
                  {isSelected && <span style={{ fontSize: '0.85rem' }}>{flowIndicator}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: ANALYTICS HUD DECONSTRUCTION BLOCKS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Active Blueprint Summary */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '10px', borderLeft: `4px solid ${currentLayerObj.color}`, borderTop: styles.panelBorder, borderRight: styles.panelBorder, borderBottom: styles.panelBorder }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: currentLayerObj.color }}>L{currentLayerObj.number} Context Spectrum</h4>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', backgroundColor: `${currentLayerObj.color}15`, color: currentLayerObj.color, padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>{currentLayerObj.pdu}</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', lineHeight: '1.4', color: styles.textPrimary }}>{currentLayerObj.desc}</p>
            <div style={{ fontSize: '0.7rem', color: styles.descText, marginBottom: '8px', fontWeight: 'bold' }}>⚡ Active Operation: <span style={{ color: '#fff' }}>{currentLayerObj.encapAction}</span></div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {currentLayerObj.protocols.map(proto => (
                <span key={proto} style={{ padding: '2px 6px', backgroundColor: styles.chartBg, border: styles.panelBorder, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{proto}</span>
              ))}
            </div>
          </div>

          {/* REAL TIME PACKET CAPTURE TERMINAL HUD */}
          <div style={{ backgroundColor: styles.terminalBg, borderRadius: '10px', padding: '1rem', border: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '6px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', fontWeight: 'bold', color: '#475569' }}>NETFORGE CORRIDOR INTERFACE BUS SNIFFER</span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: styles.terminalText, lineHeight: '1.5' }}>
              {currentLayerObj.terminalLogs.map((log, idx) => (
                <div key={idx} style={{ borderLeft: idx === currentLayerObj.terminalLogs.length - 1 ? `2px solid ${currentLayerObj.color}` : 'none', paddingLeft: idx === currentLayerObj.terminalLogs.length - 1 ? '4px' : '0' }}>
                  <span style={{ color: '#27354a', marginRight: '6px' }}>[{10 + idx}:04]</span>{log}
                </div>
              ))}
            </div>
          </div>

          {/* DYNAMIC PIPELINE HEADER NESTING STACK CANVAS */}
          <div style={{ backgroundColor: styles.chartBg, padding: '1rem', borderRadius: '10px', border: styles.panelBorder }}>
            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 800, color: styles.descText, textTransform: 'uppercase', marginBottom: '0.5rem' }}>📦 DATA BOUNDARY INTERACTIVE NESTING HARNESS:</span>
            
            {selectedLayer === 1 ? (
              /* REALISTIC PHYSICAL LAYER WAVEFORM SIGNAL CANVASES */
              <div style={{ padding: '0.5rem', backgroundColor: '#02040a', borderRadius: '6px', border: '1px solid #1e293b', textAlign: 'center' }}>
                <svg width="100%" height="45" style={{ display: 'block', margin: '0 auto' }}>
                  <path
                    d={Array.from({ length: 45 }, (_, i) => {
                      const x = (i / 44) * 360;
                      const y = 22 + Math.sin(i * 0.4 + wavePhase) * 16;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none" stroke={layers[6].color} strokeWidth="2"
                  />
                </svg>
                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: styles.descText, display: 'block', marginTop: '4px' }}>
                  1000BASE-T PAM-5 Copper Differential Voltage Modulation Active
                </span>
              </div>
            ) : (
              /* DYNAMIC RE-SHAPING HEADER BLOCKS PARSER */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontFamily: 'monospace', fontSize: '0.7rem', textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>
                <div style={{ backgroundColor: '#3b82f6', padding: '5px', borderRadius: '4px', border: selectedLayer === 2 ? '2px solid #ffffff' : '1px solid transparent', opacity: selectedLayer <= 2 ? 1 : 0.25 }}>
                  <span>{selectedLayer === 2 ? '▶️ [L2 Ethernet MAC Header Target]' : 'L2 Ethernet Encapsulation'}</span>
                  
                  <div style={{ backgroundColor: '#06b6d4', padding: '5px', margin: '4px 8px 0 8px', borderRadius: '4px', border: selectedLayer === 3 ? '2px solid #ffffff' : '1px solid transparent', opacity: selectedLayer >= 3 ? (selectedLayer <= 3 ? 1 : 0.8) : 0.25 }}>
                    <span>{selectedLayer === 3 ? '▶️ [L3 IPv4/IPv6 Packets Header Target]' : 'L3 IP Encapsulation'}</span>
                    
                    <div style={{ backgroundColor: '#10b981', padding: '5px', margin: '4px 8px 0 8px', borderRadius: '4px', border: selectedLayer === 4 ? '2px solid #ffffff' : '1px solid transparent', opacity: selectedLayer >= 4 ? (selectedLayer <= 4 ? 1 : 0.8) : 0.25 }}>
                      <span>{selectedLayer === 4 ? '▶️ [L4 TCP/UDP Port Segment Target]' : 'L4 Segment Multiplexing'}</span>
                      
                      <div style={{ backgroundColor: '#ef4444', padding: '5px', margin: '4px 8px 0 8px', borderRadius: '4px', border: selectedLayer >= 5 ? '2px solid #ffffff' : '1px solid transparent', opacity: selectedLayer >= 5 ? 1 : 0.25 }}>
                        <span style={{ fontSize: '0.65rem' }}>L5-L7 App Socket Payload Stream Data</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default OsiModel;