import React, { useState } from 'react';

interface HeaderInspectorProps {
  isDarkMode?: boolean;
}

export const HeaderInspector: React.FC<HeaderInspectorProps> = ({ isDarkMode = true }) => {
  const [activeLayer, setActiveLayer] = useState<'L3' | 'L2' | 'MTU'>('L3');
  const [inspectField, setInspectField] = useState<string>('Click any protocol field below to inspect its structural header properties.');

  // MTU Simulator States
  const [packetSize, setPacketSize] = useState<number>(2800);
  const [linkMtu, setLinkMtu] = useState<number>(1500);
  const [dfBit, setDfBit] = useState<boolean>(false);

  const styles = {
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    accent: isDarkMode ? '#06b6d4' : '#0284c7'
  };

  const fieldData = {
    // Layer 3 Packet Fields
    version: "🔹 Version (4 bits): Identifies the IP protocol version. For standard IPv4, this binary value is always 0100.",
    ihl: "🔹 Internet Header Length (4 bits): Specifies the length of the L3 header. The baseline size is 20 bytes.",
    tos: "🔹 Type of Service / DSCP (8 bits): Used for Quality of Service (QoS) packet prioritization. It flags critical traffic streams like VoIP.",
    totLen: "🔹 Total Length (16 bits): Defines the entire packet size (Header + Payload) in bytes. Maximum theoretical size is 65,535 bytes, though MTU usually limits this physically.",
    id: "🔹 Identification (16 bits): Used for reassembling fragmented packets. All fragments of a single original packet share this same ID number.",
    flags: "🔹 Flags (3 bits): Controls fragmentation. The 'Don't Fragment' (DF) bit prevents slicing. The 'More Fragments' (MF) bit alerts the receiver that another slice is coming.",
    fragOffset: "🔹 Fragment Offset (13 bits): Tells the receiving device exactly where this specific fragment belongs in the reassembly sequence of the original packet.",
    ttl: "🔹 Time to Live (8 bits): A hop-counter safety mechanism. Every Layer 3 router decrements this by 1. If it hits 0, the packet is discarded to prevent infinite routing loops.",
    protocol: "🔹 Protocol (8 bits): Identifies the Layer 4 payload transport type passing up the stack (e.g., TCP = 0x06, UDP = 0x11, ICMP = 0x01).",
    checksum: "🔹 Header Checksum (16 bits): Verifies the integrity of the IP header itself. Routers recalculate this at every hop because the TTL value changes.",
    srcIp: "🔹 Source IP Address (32 bits): The logical network layer identity of the original originating host node interface.",
    dstIp: "🔹 Destination IP Address (32 bits): The logical network layer destination coordinates used by routers to execute path determinations.",
    
    // Layer 2 Frame Fields
    preamble: "🔸 Preamble & SFD (8 bytes): A synchronization pattern ending in '11' that alerts the physical network card adapter that a frame is arriving.",
    dstMac: "🔸 Destination MAC Address (48 bits / 6 bytes): The physical burned-in hardware address of the next immediate layer 2 interface receiver hop.",
    srcMac: "🔸 Source MAC Address (48 bits / 6 bytes): The physical hardware address of the node interface that generated and dispatched this frame container.",
    type: "🔸 EtherType (2 bits): Flags which Layer 3 protocol payload is encapsulated inside the frame chassis (e.g., 0x0800 denotes an IPv4 Packet).",
    payload: "📦 Encapsulated Layer 3 Payload (46 - 1500 Bytes): The inner nested protocol packet data. If this exceeds the interface MTU, it must be fragmented at Layer 3 before framing.",
    fcs: "🔸 Frame Check Sequence / CRC (4 bytes): A cyclic redundancy check calculation used by hardware interfaces to verify data integrity. Corrupt frames are dropped silently."
  };

  // MTU Simulation Logic
  const getMtuResult = () => {
    if (packetSize <= linkMtu) {
      return {
        status: "✅ CLEAN TRANSIT",
        color: "#10b981",
        log: `The ${packetSize}B packet fits perfectly within the ${linkMtu}B interface limit. No fragmentation required.`
      };
    }
    
    if (packetSize > linkMtu && dfBit) {
      return {
        status: "❌ DROPPED (BLACK HOLE)",
        color: "#f43f5e",
        log: `FATAL: Packet size (${packetSize}B) exceeds MTU (${linkMtu}B), but the Don't Fragment (DF) bit is ENABLED. The router drops the packet and sends an ICMP Type 3 Code 4 message.`
      };
    }

    const chunks = Math.ceil(packetSize / (linkMtu - 20)); // Rough estimation assuming 20B IP header duplication
    return {
      status: `✂️ FRAGMENTED (${chunks} PIECES)`,
      color: "#eab308",
      log: `Packet size (${packetSize}B) exceeds MTU (${linkMtu}B). The router slices the payload into ${chunks} separate packets, copying the IP header onto each one and using the MF (More Fragments) flag.`
    };
  };

  const mtuResult = getMtuResult();

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary }}>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>🔄 Deep Header & MTU Inspector</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Deconstruct data payloads down to raw header fields and analyze physical transmission boundaries.</p>
      </div>

      {/* LAYER CONTROLLER SWITCH DECK */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', backgroundColor: styles.setupBg, padding: '6px', borderRadius: '8px', flexWrap: 'wrap' }}>
        <button
          type="button" onClick={() => { setActiveLayer('L3'); setInspectField('Click any protocol field below to inspect its structural header properties.'); }}
          style={{ flex: 1, minWidth: '150px', padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeLayer === 'L3' ? styles.accent : 'transparent', color: activeLayer === 'L3' ? '#fff' : styles.textMuted }}
        >
          🔍 L3 IP Packet Structure
        </button>
        <button
          type="button" onClick={() => { setActiveLayer('L2'); setInspectField('Click any protocol field below to inspect its structural header properties.'); }}
          style={{ flex: 1, minWidth: '150px', padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeLayer === 'L2' ? '#10b981' : 'transparent', color: activeLayer === 'L2' ? '#fff' : styles.textMuted }}
        >
          ⛓️ L2 Ethernet Frame Structure
        </button>
        <button
          type="button" onClick={() => setActiveLayer('MTU')}
          style={{ flex: 1, minWidth: '150px', padding: '10px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeLayer === 'MTU' ? '#eab308' : 'transparent', color: activeLayer === 'MTU' ? '#000' : styles.textMuted }}
        >
          ✂️ MTU & Fragmentation Lab
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        
        {/* DYNAMIC VISUALIZATION BLOCK */}
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {activeLayer === 'L3' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#070a13', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b', fontFamily: 'monospace' }}>
              <span style={{ fontSize: '0.65rem', color: styles.accent, fontWeight: 'bold', marginBottom: '4px' }}>IPv4 DATA PACKET HEADER MAP (20 BYTES MINIMUM)</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.7rem' }}>
                {/* Row 1 */}
                <div onClick={() => setInspectField(fieldData.version)} style={{ backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid #06b6d477', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px' }}>Version</div>
                <div onClick={() => setInspectField(fieldData.ihl)} style={{ backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid #06b6d477', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px' }}>IHL</div>
                <div onClick={() => setInspectField(fieldData.tos)} style={{ backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid #06b6d477', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px' }}>Type of Service</div>
                <div onClick={() => setInspectField(fieldData.totLen)} style={{ backgroundColor: 'rgba(6,182,212,0.12)', border: '1px solid #06b6d477', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px' }}>Total Length</div>
                
                {/* Row 2 - Fragmentation Controls */}
                <div onClick={() => setInspectField(fieldData.id)} style={{ backgroundColor: 'rgba(234,179,8,0.15)', border: '1px solid #eab30877', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px', gridColumn: 'span 2', color: '#fef08a' }}>Identification (16 bit)</div>
                <div onClick={() => setInspectField(fieldData.flags)} style={{ backgroundColor: 'rgba(234,179,8,0.15)', border: '1px solid #eab30877', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px', color: '#fef08a' }}>Flags (DF/MF)</div>
                <div onClick={() => setInspectField(fieldData.fragOffset)} style={{ backgroundColor: 'rgba(234,179,8,0.15)', border: '1px solid #eab30877', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px', color: '#fef08a' }}>Fragment Offset</div>

                {/* Row 3 */}
                <div onClick={() => setInspectField(fieldData.ttl)} style={{ backgroundColor: 'rgba(6,182,212,0.18)', border: '1px solid #06b6d499', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px' }}>Time to Live (TTL)</div>
                <div onClick={() => setInspectField(fieldData.protocol)} style={{ backgroundColor: 'rgba(6,182,212,0.18)', border: '1px solid #06b6d499', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px' }}>Protocol</div>
                <div onClick={() => setInspectField(fieldData.checksum)} style={{ backgroundColor: 'rgba(6,182,212,0.18)', border: '1px solid #06b6d499', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px', gridColumn: 'span 2' }}>Header Checksum</div>
                
                {/* Row 4 & 5 */}
                <div onClick={() => setInspectField(fieldData.srcIp)} style={{ backgroundColor: 'rgba(6,182,212,0.25)', border: '1px solid #06b6d4', padding: '14px 4px', cursor: 'pointer', borderRadius: '4px', gridColumn: 'span 4', fontWeight: 'bold' }}>Source IP Coordinates (32 bits)</div>
                <div onClick={() => setInspectField(fieldData.dstIp)} style={{ backgroundColor: 'rgba(6,182,212,0.25)', border: '1px solid #06b6d4', padding: '14px 4px', cursor: 'pointer', borderRadius: '4px', gridColumn: 'span 4', fontWeight: 'bold' }}>Destination IP Coordinates (32 bits)</div>
              </div>
            </div>
          )}

          {activeLayer === 'L2' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: '#070a13', padding: '1.5rem', borderRadius: '12px', border: '1px solid #1e293b', fontFamily: 'monospace' }}>
              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>ETHERNET II FRAME HARDWARE CHASSIS</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', fontSize: '0.7rem' }}>
                <div onClick={() => setInspectField(fieldData.preamble)} style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid #10b98144', padding: '10px', cursor: 'pointer', borderRadius: '4px' }}>Preamble & Start Frame Delimiter (8 Bytes)</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <div onClick={() => setInspectField(fieldData.dstMac)} style={{ backgroundColor: 'rgba(16,185,129,0.2)', border: '1px solid #10b981bb', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Dst MAC Hardware (6B)</div>
                  <div onClick={() => setInspectField(fieldData.srcMac)} style={{ backgroundColor: 'rgba(16,185,129,0.2)', border: '1px solid #10b981bb', padding: '12px 4px', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>Src MAC Hardware (6B)</div>
                </div>

                <div onClick={() => setInspectField(fieldData.type)} style={{ backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid #10b98166', padding: '10px', cursor: 'pointer', borderRadius: '4px' }}>EtherType Indicator Field (2 Bytes)</div>
                <div onClick={() => setInspectField(fieldData.payload)} style={{ backgroundColor: 'rgba(6,182,212,0.08)', border: '1px dashed #06b6d488', padding: '18px', cursor: 'pointer', borderRadius: '4px', color: '#06b6d4', fontWeight: 'bold' }}>INNER ENCAPSULATED IP PAYLOAD (MTU BOUNDARY)</div>
                <div onClick={() => setInspectField(fieldData.fcs)} style={{ backgroundColor: 'rgba(244,63,94,0.1)', border: '1px solid #f43f5e55', padding: '10px', cursor: 'pointer', borderRadius: '4px', color: '#f43f5e' }}>Frame Check Sequence / Trailer FCS (4 Bytes)</div>
              </div>
            </div>
          )}

          {activeLayer === 'MTU' && (
            <div style={{ backgroundColor: styles.setupBg, padding: '1.5rem', borderRadius: '12px', border: styles.border }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '12px' }}>Maximum Transmission Unit (MTU) Simulator</span>
              
              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px' }}>
                    <span>Inbound Packet Size:</span>
                    <span style={{ color: styles.accent }}>{packetSize} Bytes</span>
                  </label>
                  <input type="range" min="500" max="9500" step="100" value={packetSize} onChange={(e) => setPacketSize(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px' }}>Outbound Interface MTU Limit</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setLinkMtu(1492)} style={{ flex: 1, padding: '8px 4px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: linkMtu === 1492 ? '#eab308' : styles.chartBg, color: linkMtu === 1492 ? '#000' : styles.textMuted }}>1492B (PPPoE/VPN)</button>
                    <button onClick={() => setLinkMtu(1500)} style={{ flex: 1, padding: '8px 4px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: linkMtu === 1500 ? styles.accent : styles.chartBg, color: linkMtu === 1500 ? '#fff' : styles.textMuted }}>1500B (Standard)</button>
                    <button onClick={() => setLinkMtu(9000)} style={{ flex: 1, padding: '8px 4px', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '4px', border: 'none', cursor: 'pointer', backgroundColor: linkMtu === 9000 ? '#10b981' : styles.chartBg, color: linkMtu === 9000 ? '#fff' : styles.textMuted }}>9000B (Jumbo)</button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '6px' }}>Don't Fragment (DF) Bit Flag</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setDfBit(false)} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', backgroundColor: !dfBit ? styles.chartBg : 'transparent', color: !dfBit ? '#fff' : styles.textMuted, border: !dfBit ? `1px solid ${styles.border}` : '1px solid transparent' }}>Disabled (Allow Slicing)</button>
                    <button onClick={() => setDfBit(true)} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', backgroundColor: dfBit ? '#f43f5e' : 'transparent', color: dfBit ? '#fff' : styles.textMuted, border: dfBit ? `1px solid #f43f5e` : '1px solid transparent' }}>Enabled (Drop if Too Big)</button>
                  </div>
                </div>
              </div>

              {/* Visual Result Box */}
              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#070a13', border: `1px solid ${mtuResult.color}`, textAlign: 'center' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: mtuResult.color, marginBottom: '8px' }}>{mtuResult.status}</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>{mtuResult.log}</div>
              </div>

            </div>
          )}

        </div>

        {/* ANALYTICS HUD READOUT */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: styles.terminalBg, borderRadius: '8px', padding: '1.2rem', border: '1px solid #1e293b', flexGrow: 1, minHeight: '160px', fontFamily: 'monospace', fontSize: '0.75rem', color: styles.terminalText, lineHeight: '1.6' }}>
            <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {activeLayer === 'MTU' ? 'FRAG ALGORITHM ENGINE' : 'FIELD SPECIFICATION'}
            </span>
            <div style={{ color: '#cbd5e1' }}>
              {activeLayer === 'MTU' ? (
                <>
                  <p style={{ margin: '0 0 10px 0' }}>When a packet exceeds an interface MTU limit, the router checks the IPv4 <strong>Flags</strong> field.</p>
                  <p style={{ margin: '0 0 10px 0' }}>If DF is 0: It divides the payload, copies the original IP header to each slice, sets the MF (More Fragments) bit to 1 on all but the final slice, and updates the <strong>Fragment Offset</strong> field so the receiving PC can rebuild it.</p>
                  <p style={{ margin: 0, color: '#f43f5e' }}>If DF is 1: It kills the packet instantly to save CPU cycles.</p>
                </>
              ) : inspectField}
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED LESSON CHEATSHEET ACCORDION FABRIC */}
      <div style={{ borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        
        {activeLayer === 'L3' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.accent }}>🎯 End-to-End Routing</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                Layer 3 handles end-to-end delivery. The Source and Destination IP addresses in this header generally remain completely unchanged from the moment the packet leaves the sender until it reaches the final server, regardless of how many routers it crosses.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: styles.accent }}>⏳ TTL Loop Protection</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                If a routing misconfiguration causes a packet to bounce endlessly between two routers, the <strong>Time to Live (TTL)</strong> field acts as a fail-safe. Decremented by 1 at every hop, the packet is automatically dropped when it hits 0 to prevent network storms.
              </p>
            </div>
          </>
        )}

        {activeLayer === 'L2' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#10b981' }}>🔗 Hop-to-Hop Delivery</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                Unlike IP addresses, MAC addresses are only locally significant. Every time a router processes a packet, it strips off the old Layer 2 frame and generates a brand new one, updating the Source and Destination MACs for the next immediate physical hop.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#f43f5e' }}>🛡️ The Silent FCS Drop</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                The Frame Check Sequence (FCS) protects against physical wire corruption (like electrical interference). If the math doesn't match upon receipt, the switch drops the frame silently. Ethernet does not ask for retransmissions; it leaves that job to higher-level protocols like TCP.
              </p>
            </div>
          </>
        )}

        {activeLayer === 'MTU' && (
          <>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#eab308' }}>📦 The Fragmentation Penalty</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                Fragmentation heavily spikes a router's CPU load. If a large packet is sliced into three pieces, and just <em>one</em> of those pieces drops during transit, the destination host will time out waiting for the missing fragment, forcing the sender to retransmit the entire original sequence.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#eab308' }}>🧱 The "Black Hole" Exploit</h4>
              <p style={{ margin: 0, color: styles.textMuted }}>
                VPN tunnels (like IPsec) encapsulate packets, adding extra header weight that forces interface MTUs down. If modern applications set the <strong>DF Bit</strong>, oversized packets are dropped. If security firewalls block the resulting ICMP error messages, the connection silently "black holes."
              </p>
            </div>
          </>
        )}
        
      </div>

    </div>
  );
};

export default HeaderInspector;