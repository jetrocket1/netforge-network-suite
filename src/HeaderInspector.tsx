import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface HeaderInspectorProps { isDarkMode?: boolean; }

export const HeaderInspector: React.FC<HeaderInspectorProps> = ({ isDarkMode = true }) => {
  const [activeLayer, setActiveLayer] = useState<'L3' | 'L2' | 'MTU'>('L3');
  const [inspectField, setInspectField] = useState<string>('Click any field in the diagram to learn what it does.');
  const [packetSize, setPacketSize] = useState(2800);
  const [linkMtu, setLinkMtu] = useState(1500);
  const [dfBit, setDfBit] = useState(false);
  const T = getLabTheme(isDarkMode);

  const fields: Record<string, string> = {
    version:    'Version (4 bits) — identifies the IP protocol version. For IPv4, this value is always 4 (binary 0100).',
    ihl:        'Internet Header Length (4 bits) — the number of 32-bit words in the IP header. The minimum is 5, meaning a 20-byte header.',
    tos:        'Type of Service / DSCP (8 bits) — marks packets for Quality of Service prioritisation (e.g., voice traffic over data traffic).',
    totLen:     'Total Length (16 bits) — the combined byte count of the IP header plus its payload. Maximum: 65,535 bytes, though the link MTU is usually the real limit.',
    id:         'Identification (16 bits) — a shared ID stamped on every fragment of a divided packet so the receiver can group them back together.',
    flags:      'Flags (3 bits) — controls fragmentation. DF (Don\'t Fragment) tells routers not to split this packet. MF (More Fragments) signals that more slices follow.',
    fragOffset: 'Fragment Offset (13 bits) — tells the receiver where this fragment sits in the original packet, measured in 8-byte units.',
    ttl:        'Time to Live (8 bits) — a hop counter. Each router decrements this by 1. When it reaches 0, the packet is dropped to prevent infinite routing loops.',
    protocol:   'Protocol (8 bits) — identifies the Layer 4 content inside (TCP = 6, UDP = 17, ICMP = 1). Tells the receiving host which upper-layer process to hand the payload to.',
    checksum:   'Header Checksum (16 bits) — verifies the integrity of the IP header only. Routers must recalculate this at every hop because the TTL changes.',
    srcIp:      'Source IP Address (32 bits) — the logical address of the sending host. Unlike MAC addresses, this remains unchanged across all routers on the path.',
    dstIp:      'Destination IP Address (32 bits) — the logical address of the final destination. Routers use this to make forwarding decisions at each hop.',
    preamble:   'Preamble & SFD (8 bytes) — a known bit pattern that synchronises the receiver\'s clock and signals the start of a new frame. Never seen in packet captures.',
    dstMac:     'Destination MAC (48 bits) — the physical address of the next hop, not the final destination. Replaced at every router with the MAC of the next device on the path.',
    srcMac:     'Source MAC (48 bits) — the physical address of the device that sent this frame. Also updated at every router hop.',
    etherType:  'EtherType (2 bytes) — identifies what is inside the frame. 0x0800 means IPv4, 0x86DD means IPv6, 0x0806 means ARP.',
    payload:    'Payload (46–1500 bytes) — the encapsulated IP packet. The 1500-byte upper limit is the standard Ethernet MTU; going over it forces IP fragmentation or the packet is dropped.',
    fcs:        'Frame Check Sequence (4 bytes) — a CRC computed by the sender. The receiver recalculates it and if it does not match, the frame is silently discarded. Ethernet does not request retransmission.',
  };

  const getMtuResult = () => {
    if (packetSize <= linkMtu) return { status: 'Pass — no fragmentation needed', color: T.success, log: `The ${packetSize} B packet fits within the ${linkMtu} B MTU. It passes through intact.` };
    if (dfBit) return { status: 'Drop — DF bit set (black hole)', color: T.danger, log: `The packet (${packetSize} B) exceeds the MTU (${linkMtu} B) and the DF bit is set. The router drops it and sends ICMP Type 3 Code 4 back to the sender.` };
    const fragments = Math.ceil(packetSize / (linkMtu - 20));
    return { status: `Fragmented into ${fragments} pieces`, color: T.warning, log: `The packet (${packetSize} B) exceeds the MTU (${linkMtu} B). The router splits the payload into ${fragments} fragments, copies the IP header to each one, and sets the MF bit on all but the last.` };
  };

  const mtu = getMtuResult();

  const cell = (key: string, label: string, span?: number, color?: string) => (
    <div key={key} onClick={() => setInspectField(fields[key])}
      style={{ gridColumn: span ? `span ${span}` : undefined, padding: '10px 4px', borderRadius: 4, cursor: 'pointer', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, backgroundColor: color ? `${color}18` : T.accentSubtle, border: `1px solid ${color ?? T.accent}55`, color: color ?? T.accent, lineHeight: '1.3', transition: 'opacity 0.1s' }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
      {label}
    </div>
  );

  const tabBtn = (id: 'L3' | 'L2' | 'MTU', label: string, color: string) => (
    <button key={id} type="button" onClick={() => { setActiveLayer(id); setInspectField('Click any field in the diagram to learn what it does.'); }}
      style={{ flex: 1, padding: '8px 10px', fontWeight: 700, fontSize: '0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeLayer === id ? color : 'transparent', color: activeLayer === id ? (id === 'MTU' ? '#000' : '#fff') : T.textSecondary, transition: 'all 0.12s' }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: T.border }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Header Inspector & MTU Lab</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>
          Click any header field to understand its purpose. Use the MTU tool to see how packet size affects delivery.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', backgroundColor: T.panelBg, padding: '3px', borderRadius: '8px', border: T.border }}>
        {tabBtn('L3', 'IPv4 Packet Header', T.accent)}
        {tabBtn('L2', 'Ethernet Frame', T.success)}
        {tabBtn('MTU', 'MTU & Fragmentation', T.warning)}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Visual */}
        <div style={{ flex: '1 1 380px' }}>

          {activeLayer === 'L3' && (
            <div style={{ backgroundColor: T.insetBg, padding: '1.25rem', borderRadius: '12px', border: T.border, fontFamily: 'monospace' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>IPv4 header — 20 bytes minimum</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {cell('version', 'Version')}
                {cell('ihl', 'IHL')}
                {cell('tos', 'Type of Service')}
                {cell('totLen', 'Total Length')}
                {cell('id', 'Identification', 2, T.warning)}
                {cell('flags', 'Flags DF/MF', 1, T.warning)}
                {cell('fragOffset', 'Fragment Offset', 1, T.warning)}
                {cell('ttl', 'Time to Live')}
                {cell('protocol', 'Protocol')}
                {cell('checksum', 'Checksum', 2)}
                {cell('srcIp', 'Source IP Address (32 bits)', 4)}
                {cell('dstIp', 'Destination IP Address (32 bits)', 4)}
              </div>
            </div>
          )}

          {activeLayer === 'L2' && (
            <div style={{ backgroundColor: T.insetBg, padding: '1.25rem', borderRadius: '12px', border: T.border, fontFamily: 'monospace' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.success, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Ethernet II frame structure</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cell('preamble', 'Preamble & Start Frame Delimiter — 8 bytes')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {cell('dstMac', 'Destination MAC — 6 bytes', undefined, T.success)}
                  {cell('srcMac', 'Source MAC — 6 bytes', undefined, T.success)}
                </div>
                {cell('etherType', 'EtherType — 2 bytes', undefined, T.success)}
                <div onClick={() => setInspectField(fields.payload)}
                  style={{ padding: '16px 8px', textAlign: 'center', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, backgroundColor: T.accentSubtle, border: `1px dashed ${T.accent}`, color: T.accent }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Payload — Encapsulated IP Packet (46–1500 bytes)
                </div>
                {cell('fcs', 'Frame Check Sequence (CRC) — 4 bytes', undefined, T.danger)}
              </div>
            </div>
          )}

          {activeLayer === 'MTU' && (
            <div style={{ backgroundColor: T.panelBg, padding: '1.25rem', borderRadius: '12px', border: T.border, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase' }}>MTU Simulator</span>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  <span>Packet size</span><span style={{ color: T.accent }}>{packetSize} B</span>
                </label>
                <input type="range" min="500" max="9500" step="100" value={packetSize} onChange={e => setPacketSize(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer', accentColor: T.accent }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Link MTU</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[{ v: 1492, label: '1492 B (VPN/PPPoE)' }, { v: 1500, label: '1500 B (Standard)' }, { v: 9000, label: '9000 B (Jumbo)' }].map(o => (
                    <button key={o.v} type="button" onClick={() => setLinkMtu(o.v)}
                      style={{ flex: 1, padding: '7px 4px', fontSize: '0.7rem', fontWeight: 700, borderRadius: 4, border: `1px solid ${linkMtu === o.v ? T.accent : T.borderColor}`, cursor: 'pointer', backgroundColor: linkMtu === o.v ? T.accentSubtle : T.insetBg, color: linkMtu === o.v ? T.accent : T.textSecondary }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Don't Fragment (DF) bit</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => setDfBit(false)} style={{ flex: 1, padding: '7px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 4, border: `1px solid ${!dfBit ? T.success : T.borderColor}`, cursor: 'pointer', backgroundColor: !dfBit ? T.successSubtle : T.insetBg, color: !dfBit ? T.success : T.textSecondary }}>Off — allow fragmentation</button>
                  <button type="button" onClick={() => setDfBit(true)} style={{ flex: 1, padding: '7px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 4, border: `1px solid ${dfBit ? T.danger : T.borderColor}`, cursor: 'pointer', backgroundColor: dfBit ? T.dangerSubtle : T.insetBg, color: dfBit ? T.danger : T.textSecondary }}>On — drop if too big</button>
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: T.insetBg, border: `1px solid ${mtu.color}`, textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: mtu.color, marginBottom: '6px' }}>{mtu.status}</div>
                <div style={{ fontSize: '0.8rem', color: T.textSecondary, lineHeight: '1.5' }}>{mtu.log}</div>
              </div>
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: T.termBg, padding: '1.25rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, flexGrow: 1, minHeight: 160 }}>
            <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: T.termMuted, display: 'block', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px', marginBottom: '10px', fontWeight: 700 }}>
              {activeLayer === 'MTU' ? 'Fragmentation guide' : 'Field details'}
            </span>
            <div style={{ fontFamily: activeLayer === 'MTU' ? 'system-ui' : 'monospace', fontSize: '0.82rem', color: T.termText, lineHeight: '1.6' }}>
              {activeLayer === 'MTU' ? (
                <div style={{ color: T.textSecondary, fontSize: '0.82rem' }}>
                  <p style={{ margin: '0 0 8px' }}>When a packet exceeds an interface MTU, the router checks the <strong style={{ color: T.warning }}>Flags</strong> field.</p>
                  <p style={{ margin: '0 0 8px' }}>If DF = 0: the router slices the payload, attaches a copy of the IP header to each piece, and sets the MF bit on all but the last slice. The receiving host reassembles them using the <strong style={{ color: T.warning }}>Fragment Offset</strong> field.</p>
                  <p style={{ margin: 0, color: T.danger }}>If DF = 1: the router drops the packet immediately and sends an ICMP "fragmentation needed" error back to the sender.</p>
                </div>
              ) : inspectField}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {activeLayer === 'L3' && (<>
              <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.accent }}>End-to-end routing</h4>
                <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: '1.5' }}>Source and destination IP addresses stay the same for the entire journey across the internet, regardless of how many routers the packet passes through.</p>
              </div>
              <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.accent }}>TTL prevents loops</h4>
                <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: '1.5' }}>A routing loop would cause a packet to bounce forever. The TTL field guarantees that any lost packet is automatically discarded once it has crossed 255 hops.</p>
              </div>
            </>)}
            {activeLayer === 'L2' && (<>
              <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.success }}>Hop-to-hop delivery</h4>
                <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: '1.5' }}>MAC addresses only matter for the current link. Every router strips the frame and builds a new one with the next hop's MAC addresses.</p>
              </div>
              <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.danger }}>Silent FCS drop</h4>
                <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: '1.5' }}>If the FCS check fails, the frame is discarded without notification. Retransmission is left to TCP at Layer 4 — Ethernet itself does not recover lost frames.</p>
              </div>
            </>)}
            {activeLayer === 'MTU' && (<>
              <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.warning }}>Fragmentation cost</h4>
                <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: '1.5' }}>If one fragment is lost, the destination must discard all others and the sender retransmits the whole original packet — not just the missing piece.</p>
              </div>
              <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: 700, color: T.warning }}>VPN black hole</h4>
                <p style={{ margin: 0, color: T.textSecondary, fontSize: '0.78rem', lineHeight: '1.5' }}>IPsec adds overhead, reducing effective MTU. If DF=1 and firewalls block ICMP errors, connections stall silently — the classic "PMTUD black hole."</p>
              </div>
            </>)}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeaderInspector;
