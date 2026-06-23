import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';

interface OsiModelProps { isDarkMode?: boolean; }

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
  const T = getLabTheme(isDarkMode);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedLayer(prev => {
          if (animationDirection === 'encap') {
            if (prev <= 1) { setIsTesting(false); return 1; }
            return prev - 1;
          } else {
            if (prev >= 7) { setIsTesting(false); return 7; }
            return prev + 1;
          }
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, animationDirection]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase(prev => (prev + 0.2) % (Math.PI * 2));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const layers: OsiLayer[] = [
    {
      number: 7, name: 'Application', pdu: 'Data', protocols: ['HTTP', 'DNS', 'DHCP', 'SSH'], color: '#f85149',
      desc: 'The interface between network services and end-user applications. Handles protocols like HTTP, DNS, and SSH that applications use directly.',
      encapAction: 'Generates the raw application payload — e.g. an HTTP GET request.',
      terminalLogs: [
        'Browser navigated to https://netforge.internal',
        'DHCP: Active lease confirmed → 10.0.12.45',
        "DNS: Resolving 'netforge.internal'...",
        'DNS: A record response → 192.168.1.100',
        'HTTP: Building GET request payload...',
      ]
    },
    {
      number: 6, name: 'Presentation', pdu: 'Data', protocols: ['TLS/SSL', 'JPEG', 'ASCII'], color: '#f0883e',
      desc: 'Translates, encrypts, and compresses data so both sides of a connection speak the same format.',
      encapAction: 'Negotiates TLS cipher suite and encrypts the outbound data stream.',
      terminalLogs: [
        'Negotiating encryption parameters...',
        'TLS: ClientHello sent with supported cipher suites',
        'TLS: ServerHello → TLS_AES_256_GCM_SHA384 selected',
        'Encrypting outbound payload...',
        'Plaintext converted to structured JSON stream',
      ]
    },
    {
      number: 5, name: 'Session', pdu: 'Data', protocols: ['NetBIOS', 'RPC', 'Sockets'], color: '#d29922',
      desc: 'Opens, maintains, and closes communication sessions between applications on different hosts.',
      encapAction: 'Binds a local port number to create an isolated socket for this connection.',
      terminalLogs: [
        'Requesting session token...',
        'Socket bound → Local port: 51042',
        'RPC: Remote procedure call dispatched',
        'KEEPALIVE sent to maintain session',
        'Logical channel active',
      ]
    },
    {
      number: 4, name: 'Transport', pdu: 'Segment / Datagram', protocols: ['TCP', 'UDP'], color: '#3fb950',
      desc: 'Responsible for reliable end-to-end delivery, flow control, and port-based multiplexing.',
      encapAction: 'Slices data into segments and adds source/destination port numbers.',
      terminalLogs: [
        'TCP: SYN → 192.168.1.100:443',
        'TCP: SYN-ACK received ✓',
        'TCP: ACK sent — connection established',
        'Flow control window set to 65535 bytes',
        'Payload segmented into 1460-byte MSS chunks',
      ]
    },
    {
      number: 3, name: 'Network', pdu: 'Packet', protocols: ['IPv4', 'IPv6', 'ICMP', 'OSPF'], color: '#4493f8',
      desc: 'Handles logical addressing and routing — deciding the best path across multiple networks.',
      encapAction: 'Wraps the segment with source and destination IP addresses.',
      terminalLogs: [
        'Building IP packet...',
        'SRC: 10.0.12.45 | DST: 192.168.1.100',
        'Checking routing table...',
        'Best route: via FastEthernet0/2 (OSPF)',
        'TTL set to 64',
      ]
    },
    {
      number: 2, name: 'Data Link', pdu: 'Frame', protocols: ['Ethernet', 'ARP', 'STP', 'VLANs'], color: '#388bfd',
      desc: 'Structures packets into frames for hop-to-hop delivery over a physical link using MAC addresses.',
      encapAction: 'Adds source/destination MAC addresses and appends an FCS checksum.',
      terminalLogs: [
        'Checking ARP cache for gateway MAC...',
        'ARP cache miss — broadcasting ARP request',
        "ARP reply: gateway MAC → 00:0a:95:9d:68:16",
        'Frame: SRC a4:83:e7:bc:11:02 | DST 00:0a:95:9d:68:16',
        'FCS (32-bit CRC) appended',
      ]
    },
    {
      number: 1, name: 'Physical', pdu: 'Bits', protocols: ['Cat6 Copper', 'Fibre Optic', 'RF / Air'], color: '#a371f7',
      desc: 'Transmits raw bits over the physical medium — electrical signals, light pulses, or radio waves.',
      encapAction: 'Converts the assembled frame into voltage shifts or optical pulses on the wire.',
      terminalLogs: [
        'Preamble clock sync initialised',
        'Carrier detected on copper interface — LINK UP',
        'Encoding with 1000BASE-T line coding',
        'Generating voltage differentials on twisted pair',
        '11001010 01110011 11001101 01010110 → sent',
      ]
    }
  ];

  const currentLayerObj = layers.find(l => l.number === selectedLayer)!;

  const stepForward = () => {
    if (animationDirection === 'encap') { if (selectedLayer > 1) setSelectedLayer(p => p - 1); }
    else { if (selectedLayer < 7) setSelectedLayer(p => p + 1); }
  };
  const stepBackward = () => {
    if (animationDirection === 'encap') { if (selectedLayer < 7) setSelectedLayer(p => p + 1); }
    else { if (selectedLayer > 1) setSelectedLayer(p => p - 1); }
  };

  const btn: React.CSSProperties = {
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
    fontSize: '0.8rem', transition: 'opacity 0.15s',
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: T.textPrimary }}>OSI 7-Layer Model</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
            Click a layer to explore it, or run an auto-trace to watch data travel through the stack.
          </p>
        </div>

        <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border, gap: '2px' }}>
          <button type="button" onClick={() => { setAnimationDirection('encap'); setSelectedLayer(7); setIsTesting(false); }} style={{ ...btn, padding: '6px 14px', backgroundColor: animationDirection === 'encap' ? T.accent : 'transparent', color: animationDirection === 'encap' ? '#fff' : T.textSecondary }}>
            ↓ Encapsulation (Send)
          </button>
          <button type="button" onClick={() => { setAnimationDirection('decap'); setSelectedLayer(1); setIsTesting(false); }} style={{ ...btn, padding: '6px 14px', backgroundColor: animationDirection === 'decap' ? T.success : 'transparent', color: animationDirection === 'decap' ? '#fff' : T.textSecondary }}>
            ↑ Decapsulation (Receive)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* LEFT — Layer Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '0.25rem' }}>
            <button type="button" onClick={stepBackward} style={{ ...btn, flex: 1, padding: '8px', backgroundColor: T.panelBg, color: T.textPrimary, border: T.border }}>← Back</button>
            <button type="button" onClick={() => setIsTesting(!isPlaying)} style={{ ...btn, flex: 2, padding: '8px', backgroundColor: isPlaying ? T.danger : T.accent, color: '#fff' }}>
              {isPlaying ? 'Pause Trace' : 'Auto-Trace'}
            </button>
            <button type="button" onClick={stepForward} style={{ ...btn, flex: 1, padding: '8px', backgroundColor: T.panelBg, color: T.textPrimary, border: T.border }}>Next →</button>
          </div>

          {layers.map(layer => {
            const isSelected = layer.number === selectedLayer;
            return (
              <div
                key={layer.number}
                onClick={() => { setSelectedLayer(layer.number); setIsTesting(false); }}
                style={{
                  padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: isSelected ? layer.color : T.panelBg,
                  color: isSelected ? '#fff' : T.textPrimary,
                  border: isSelected ? `1px solid ${layer.color}` : T.border,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? `0 2px 12px ${layer.color}40` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, opacity: 0.65 }}>L{layer.number}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{layer.name}</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', opacity: 0.75 }}>{layer.pdu.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>

        {/* RIGHT — Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Layer info card */}
          <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '10px', borderLeft: `3px solid ${currentLayerObj.color}`, border: T.border, borderLeftColor: currentLayerObj.color, borderLeftWidth: '3px', borderLeftStyle: 'solid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: currentLayerObj.color }}>
                L{currentLayerObj.number} — {currentLayerObj.name}
              </h4>
              <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', backgroundColor: T.accentSubtle, color: currentLayerObj.color, padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {currentLayerObj.pdu}
              </span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', lineHeight: '1.6', color: T.textSecondary }}>{currentLayerObj.desc}</p>
            <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: T.textMuted }}>
              <strong style={{ color: T.textPrimary }}>Action:</strong> {currentLayerObj.encapAction}
            </p>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {currentLayerObj.protocols.map(proto => (
                <span key={proto} style={{ padding: '2px 8px', backgroundColor: T.insetBg, border: T.border, borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'monospace', color: T.textPrimary }}>
                  {proto}
                </span>
              ))}
            </div>
          </div>

          {/* Terminal log */}
          <div style={{ backgroundColor: T.termBg, borderRadius: '10px', padding: '1rem', border: `1px solid ${T.termBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '6px', marginBottom: '8px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 700, color: T.termMuted }}>Layer {currentLayerObj.number} log</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f85149', display: 'inline-block' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d29922', display: 'inline-block' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3fb950', display: 'inline-block' }} />
              </div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: T.termText, lineHeight: '1.7' }}>
              {currentLayerObj.terminalLogs.map((log, idx) => (
                <div key={idx} style={{ borderLeft: idx === currentLayerObj.terminalLogs.length - 1 ? `2px solid ${currentLayerObj.color}` : 'none', paddingLeft: idx === currentLayerObj.terminalLogs.length - 1 ? '6px' : '0', color: idx === currentLayerObj.terminalLogs.length - 1 ? '#e6edf3' : T.termText }}>
                  <span style={{ color: T.termMuted, marginRight: '8px' }}>[{String(10 + idx).padStart(2, '0')}:04]</span>{log}
                </div>
              ))}
            </div>
          </div>

          {/* Encapsulation diagram */}
          <div style={{ backgroundColor: T.insetBg, padding: '1rem', borderRadius: '10px', border: T.border }}>
            <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Header Nesting</span>

            {selectedLayer === 1 ? (
              <div style={{ padding: '0.5rem', backgroundColor: T.termBg, borderRadius: '6px', border: `1px solid ${T.termBorder}`, textAlign: 'center' }}>
                <svg width="100%" height="44" style={{ display: 'block' }}>
                  <path
                    d={Array.from({ length: 45 }, (_, i) => {
                      const x = (i / 44) * 360;
                      const y = 22 + Math.sin(i * 0.4 + wavePhase) * 16;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    fill="none" stroke="#a371f7" strokeWidth="2"
                  />
                </svg>
                <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.termMuted, display: 'block', marginTop: '4px' }}>
                  1000BASE-T — Voltage modulation on copper
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontFamily: 'monospace', fontSize: '0.72rem', textAlign: 'center', fontWeight: 700, color: '#fff' }}>
                <div style={{ backgroundColor: '#388bfd', padding: '6px', borderRadius: '4px', outline: selectedLayer === 2 ? '2px solid #fff' : 'none', opacity: selectedLayer <= 2 ? 1 : 0.25 }}>
                  {selectedLayer === 2 ? '▶ L2 Ethernet Frame' : 'L2 Ethernet'}
                  <div style={{ backgroundColor: '#4493f8', padding: '5px', margin: '4px 8px 0', borderRadius: '4px', outline: selectedLayer === 3 ? '2px solid #fff' : 'none', opacity: selectedLayer >= 3 ? 1 : 0.3 }}>
                    {selectedLayer === 3 ? '▶ L3 IP Packet' : 'L3 IP'}
                    <div style={{ backgroundColor: '#3fb950', padding: '5px', margin: '4px 8px 0', borderRadius: '4px', outline: selectedLayer === 4 ? '2px solid #fff' : 'none', opacity: selectedLayer >= 4 ? 1 : 0.3 }}>
                      {selectedLayer === 4 ? '▶ L4 TCP/UDP Segment' : 'L4 Segment'}
                      <div style={{ backgroundColor: '#f85149', padding: '5px', margin: '4px 8px 0', borderRadius: '4px', opacity: selectedLayer >= 5 ? 1 : 0.3 }}>
                        <span style={{ fontSize: '0.65rem' }}>L5–L7 Application Data</span>
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
