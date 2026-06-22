import React, { useState } from 'react';

interface NetServicesLabProps {
  isDarkMode?: boolean;
}

export const NetServicesLab: React.FC<NetServicesLabProps> = ({ isDarkMode = true }) => {
  const [activeService, setActiveService] = useState<'DHCP' | 'DNS'>('DHCP');
  const [dhcpStage, setDhcpStage] = useState<number>(0);
  const [dnsStage, setDnsStage] = useState<number>(0);

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

  const dhcpMatrix = [
    { label: "1. DISCOVER", arrow: "▶ ▶ ▶ 🎛️ ▶ ▶ ▶", activeNode: "client", packetTxt: "📦 DHCP Discover (Broadcast)", log: "PC1 shouts to the entire local network: 'I don't have an IP address! Is there a DHCP Server out there?'", ip: "0.0.0.0", mask: "0.0.0.0", gw: "0.0.0.0", dns: "0.0.0.0" },
    { label: "2. OFFER", arrow: "◀ ◀ ◀ 🎛️ ◀ ◀ ◀", activeNode: "dhcp", packetTxt: "📥 DHCP Offer (Unicast)", log: "DHCP_Server hears the shout and replies: 'I have an available slot! Would you like to lease IP 10.0.0.100?'", ip: "0.0.0.0 (Offered: 10.0.0.100)", mask: "0.0.0.0", gw: "0.0.0.0", dns: "0.0.0.0" },
    { label: "3. REQUEST", arrow: "▶ ▶ ▶ 🎛️ ▶ ▶ ▶", activeNode: "client", packetTxt: "📦 DHCP Request (Broadcast)", log: "PC1 responds publicly: 'Yes please! I officially request a lease for IP 10.0.0.100!'", ip: "0.0.0.0 (Requested)", mask: "0.0.0.0", gw: "0.0.0.0", dns: "0.0.0.0" },
    { label: "4. ACKNOWLEDGE", arrow: "◀ ◀ ◀ 🎛️ ◀ ◀ ◀", activeNode: "dhcp", packetTxt: "✅ DHCP Ack (Unicast)", log: "DHCP_Server locks it in: 'Confirmed! IP 10.0.0.100 is yours for the next 8 days.'", ip: "10.0.0.100", mask: "255.255.255.0", gw: "10.0.0.1", dns: "10.0.0.2" }
  ];

  const dnsMatrix = [
    { label: "1. CLIENT QUERY", arrow: "▶ ▶ ▶ 🎛️ ▶ ▶ ▶", activeNode: "client", packetTxt: "🔍 DNS Query (UDP 53)", log: "User types 'netforge.com'. The client checks its local cache, finds nothing, and shoots a query out to the Local DNS Server.", resolvedIp: "Searching local pipeline..." },
    { label: "2. ROOT LOOKUP", arrow: "🎛️ 🔄 [Traversing Internet Roots] 🔄 🎛️", activeNode: "switch", packetTxt: "🛰️ Root Hint Navigation", log: "The Local DNS Server queries global Root (.) and TLD (.com) name registries over the internet backbone to trace down the domain ownership.", resolvedIp: "Locating Authoritative maps..." },
    { label: "3. AUTHORITATIVE HIT", arrow: "◀ ◀ ◀ 🎛️ ◀ ◀ ◀", activeNode: "dns", packetTxt: "🎯 A-Record Found", log: "The Authoritative Server answers back to your Local DNS Server with the exact map: netforge.com lives at IP 104.26.10.23.", resolvedIp: "104.26.10.23" },
    { label: "4. RETURN TO CLIENT", arrow: "◀ ◀ ◀ 🎛️ ◀ ◀ ◀", activeNode: "dns", packetTxt: "✅ Map Delivered", log: "The Local DNS Server delivers the mapping back to PC1. The client caches it locally and launches its browser tab instantly.", resolvedIp: "104.26.10.23 (Successfully Cached)" }
  ];

  const currentDhcp = dhcpMatrix[dhcpStage];
  const currentDns = dnsMatrix[dnsStage];

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER BLOCK */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>⚙️ Core Network Infrastructure Services Visualizer</h3>
        <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Track live message patterns and interface conversions across dynamic hardware protocols.</p>
      </div>

      {/* COMPONENT SELECTOR BUTTONS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', backgroundColor: styles.setupBg, padding: '6px', borderRadius: '8px' }}>
        <button
          type="button" onClick={() => setActiveService('DHCP')}
          style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeService === 'DHCP' ? styles.accent : 'transparent', color: activeService === 'DHCP' ? '#fff' : styles.textMuted }}
        >
          📥 DHCP Lease Visualizer (D.O.R.A.)
        </button>
        <button
          type="button" onClick={() => setActiveService('DNS')}
          style={{ flex: 1, padding: '12px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: activeService === 'DNS' ? '#10b981' : 'transparent', color: activeService === 'DNS' ? '#fff' : styles.textMuted }}
        >
          🔍 DNS Application Layer Resolution
        </button>
      </div>

      {/* DYNAMIC TOPOLOGY DIAGRAM */}
      <div style={{ backgroundColor: '#05070f', border: '1px solid #1e293b', padding: '2rem 1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
          
          {/* HOST COMPONENT */}
          <div style={{ 
            padding: '15px 10px', 
            borderRadius: '8px', 
            border: `2px solid ${((activeService === 'DHCP' && currentDhcp.activeNode === 'client') || (activeService === 'DNS' && currentDns.activeNode === 'client')) ? styles.accent : '#1e293b'}`,
            backgroundColor: ((activeService === 'DHCP' && currentDhcp.activeNode === 'client') || (activeService === 'DNS' && currentDns.activeNode === 'client')) ? 'rgba(6,182,212,0.15)' : '#0f172a'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>💻</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PC1 (Client Host)</div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace', marginTop: '4px' }}>Fa0/1</div>
          </div>

          {/* CABLE / WIRE LANE CHANNEL */}
          <div style={{ padding: '0 10px' }}>
            <div style={{ fontSize: '0.7rem', color: '#eab308', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '6px', backgroundColor: '#111827', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', border: '1px solid rgba(234,179,8,0.15)' }}>
              {activeService === 'DHCP' ? currentDhcp.packetTxt : currentDns.packetTxt}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#475569', letterSpacing: '4px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {activeService === 'DHCP' ? currentDhcp.arrow : currentDns.arrow}
            </div>
          </div>

          {/* TARGET SERVER ENDPOINT */}
          {activeService === 'DHCP' ? (
            <div style={{ 
              padding: '15px 10px', 
              borderRadius: '8px', 
              border: `2px solid ${currentDhcp.activeNode === 'dhcp' ? styles.accent : '#1e293b'}`,
              backgroundColor: currentDhcp.activeNode === 'dhcp' ? 'rgba(6,182,212,0.15)' : '#0f172a'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🗄️</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>DHCP Server</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace', marginTop: '4px' }}>Fa0/24</div>
            </div>
          ) : (
            <div style={{ 
              padding: '15px 10px', 
              borderRadius: '8px', 
              border: `2px solid ${currentDns.activeNode === 'dns' ? '#10b981' : '#1e293b'}`,
              backgroundColor: currentDns.activeNode === 'dns' ? 'rgba(16,185,129,0.15)' : '#0f172a'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🌐</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981' }}>DNS Server</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace', marginTop: '4px' }}>Fa0/22</div>
            </div>
          )}

        </div>
      </div>

      {/* ACTIONS & CONTROLS ROW PANEL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* STEP CONTROLS BOX */}
        <div style={{ backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '4px' }}>
            {activeService === 'DHCP' ? "Interactive Handshake Protocol Sequence" : "Interactive Domain Lookup Sequence"}
          </span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {activeService === 'DHCP' ? (
              dhcpMatrix.map((item, idx) => (
                <button 
                  key={idx} type="button" onClick={() => setDhcpStage(idx)}
                  style={{ padding: '12px 6px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: dhcpStage === idx ? styles.accent : styles.chartBg, color: dhcpStage === idx ? '#fff' : styles.textMuted, transition: 'all 0.1s ease' }}
                >
                  {item.label}
                </button>
              ))
            ) : (
              dnsMatrix.map((item, idx) => (
                <button 
                  key={idx} type="button" onClick={() => setDnsStage(idx)}
                  style={{ padding: '12px 6px', fontSize: '0.7rem', fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', backgroundColor: dnsStage === idx ? '#10b981' : styles.chartBg, color: dnsStage === idx ? '#fff' : styles.textMuted, transition: 'all 0.1s ease' }}
                >
                  {item.label}
                </button>
              ))
            )}
          </div>
        </div>

        {/* DATA PACKET INSPECTOR LOG BOX */}
        <div style={{ backgroundColor: styles.terminalBg, padding: '1.2rem', borderRadius: '8px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.5', color: styles.terminalText }}>
          <span style={{ color: '#475569', display: 'block', borderBottom: '1px solid #1e293b', paddingBottom: '4px', marginBottom: '10px', fontWeight: 'bold' }}>WIRE MESSAGE INTERCEPTOR LOG</span>
          <div style={{ color: '#cbd5e1' }}>
            {activeService === 'DHCP' ? currentDhcp.log : currentDns.log}
          </div>
        </div>

      </div>

      {/* STATE METADATA REGISTER FOOTER DATA TABLES */}
      <div style={{ backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '8px', border: styles.border }}>
        {activeService === 'DHCP' ? (
          <>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>PC1 Client Network Adapter State Properties (`ipconfig /all`)</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontFamily: 'monospace', fontSize: '0.7rem' }}>
              <div style={{ padding: '8px', backgroundColor: styles.chartBg, borderRadius: '4px' }}><span style={{ color: '#64748b' }}>IP Address:</span> <span style={{ color: currentDhcp.ip !== '0.0.0.0' ? '#10b981' : '#fff', fontWeight: 'bold' }}>{currentDhcp.ip}</span></div>
              <div style={{ padding: '8px', backgroundColor: styles.chartBg, borderRadius: '4px' }}><span style={{ color: '#64748b' }}>Subnet Mask:</span> <span style={{ color: '#cbd5e1' }}>{currentDhcp.mask}</span></div>
              <div style={{ padding: '8px', backgroundColor: styles.chartBg, borderRadius: '4px' }}><span style={{ color: '#64748b' }}>Gateway IP:</span> <span style={{ color: '#cbd5e1' }}>{currentDhcp.gw}</span></div>
              <div style={{ padding: '8px', backgroundColor: styles.chartBg, borderRadius: '4px' }}><span style={{ color: '#64748b' }}>DNS Server:</span> <span style={{ color: '#38bdf8' }}>{currentDhcp.dns}</span></div>
            </div>
          </>
        ) : (
          <>
            <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>Application Workspace Directory Lookup Cache Registry</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', fontFamily: 'monospace', fontSize: '0.7rem' }}>
              <div style={{ padding: '10px', backgroundColor: styles.chartBg, borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Requested URL Domain:</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>netforge.com</span>
              </div>
              <div style={{ padding: '10px', backgroundColor: styles.chartBg, borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Resolved IPv4 A-Record Matrix:</span>
                <span style={{ color: currentDns.resolvedIp.startsWith('104') ? '#10b981' : '#eab308', fontWeight: 'bold' }}>{currentDns.resolvedIp}</span>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default NetServicesLab;