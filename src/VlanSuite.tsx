import React, { useState } from 'react';

interface VlanSuiteProps {
  isDarkMode?: boolean;
}

interface SwitchPort {
  id: number;
  mode: 'access' | 'trunk';
  vlanId: number;
  nativeVlan: number;
}

interface VlanProfile {
  id: number;
  name: string;
  color: string;
}

export const VlanSuite: React.FC<VlanSuiteProps> = ({ isDarkMode = true }) => {
  const [vlanTab, setVlanTab] = useState<'switch' | 'frame' | 'roas'>('switch');
  
  const [vlanProfiles, setVlanProfiles] = useState<VlanProfile[]>([
    { id: 1, name: 'Default / Native', color: '#64748b' },
    { id: 10, name: 'Corporate Data', color: '#2563eb' },
    { id: 20, name: 'VoIP Voice', color: '#0d9488' },
    { id: 99, name: 'Management Domain', color: '#7c3aed' }
  ]);

  const [newVlanId, setNewVlanId] = useState<string>('');
  const [newVlanName, setNewVlanName] = useState<string>('');
  const [newVlanColor, setNewVlanColor] = useState<string>('#3b82f6');
  const [chassisSize, setChassisSize] = useState<8 | 24 | 48>(24);

  const [ports, setPorts] = useState<SwitchPort[]>(
    Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      mode: i === 23 ? 'trunk' : 'access', 
      vlanId: i < 8 ? 10 : i < 16 ? 20 : 1,
      nativeVlan: 1
    }))
  );

  const [selectedPortId, setSelectedPortId] = useState<number>(1);
  const selectedPort = ports.find(p => p.id === selectedPortId) || ports[0];

  const handleChassisResize = (size: 8 | 24 | 48) => {
    setChassisSize(size);
    setPorts(
      Array.from({ length: size }, (_, i) => ({
        id: i + 1,
        mode: i === size - 1 ? 'trunk' : 'access', 
        vlanId: 1,
        nativeVlan: 1
      }))
    );
    setSelectedPortId(1);
  };

  const handleCreateVlan = (e: React.FormEvent) => {
    e.preventDefault();
    const vid = parseInt(newVlanId);

    if (isNaN(vid) || vid < 1 || vid > 4094) {
      alert('VLAN ID must be between 1 and 4094.');
      return;
    }
    if (vlanProfiles.some(p => p.id === vid)) {
      alert(`VLAN ${vid} already exists.`);
      return;
    }
    if (!newVlanName.trim()) {
      alert('Enter a valid label name.');
      return;
    }

    setVlanProfiles([...vlanProfiles, { id: vid, name: newVlanName.trim(), color: newVlanColor }].sort((a, b) => a.id - b.id));
    setNewVlanId('');
    setNewVlanName('');
  };

  const updatePortConfig = (updated: Partial<SwitchPort>) => {
    setPorts(ports.map(p => p.id === selectedPortId ? { ...p, ...updated } : p));
  };

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    inputLabel: isDarkMode ? '#cbd5e1' : '#475569',
    inputFieldBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputFieldText: isDarkMode ? '#ffffff' : '#0f172a',
    inputFieldBorder: isDarkMode ? '#475569' : '#cbd5e1',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    toggleActiveBg: '#0284c7'
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', backgroundColor: styles.panelBg, borderRadius: '16px', border: styles.panelBorder, color: styles.titleText, boxSizing: 'border-box' }}>
      
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: styles.panelBorder, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>🔌 VLAN Infrastructure &amp; Switchport Provisioning Suite</h3>
          <p style={{ color: styles.descText, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Map logical broadcast domains to physical interfaces, analyze frames, and export subinterface trees.</p>
        </div>

        <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '4px', borderRadius: '8px', border: `1px solid ${styles.inputFieldBorder}` }}>
          <button type="button" onClick={() => setVlanTab('switch')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: vlanTab === 'switch' ? styles.toggleActiveBg : 'transparent', color: vlanTab === 'switch' ? '#ffffff' : styles.descText }}>1. Switchport Map</button>
          <button type="button" onClick={() => setVlanTab('frame')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: vlanTab === 'frame' ? styles.toggleActiveBg : 'transparent', color: vlanTab === 'frame' ? '#ffffff' : styles.descText }}>2. Frame Inspector</button>
          <button type="button" onClick={() => setVlanTab('roas')} style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', backgroundColor: vlanTab === 'roas' ? styles.toggleActiveBg : 'transparent', color: vlanTab === 'roas' ? '#ffffff' : styles.descText }}>3. Router CLI</button>
        </div>
      </div>

      {vlanTab === 'switch' && (
        <div>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {/* VLAN Database Form */}
            <form onSubmit={handleCreateVlan} style={{ flex: '2 1 450px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', border: `1px dashed ${styles.inputFieldBorder}` }}>
              <div style={{ flex: '1 1 70px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.inputLabel, marginBottom: '0.25rem', textTransform: 'uppercase' }}>VLAN ID</label>
                <input type="number" min="1" max="4094" value={newVlanId} onChange={e => setNewVlanId(e.target.value)} placeholder="50" style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', borderRadius: '6px', border: `2px solid ${styles.inputFieldBorder}`, backgroundColor: styles.inputFieldBg, color: styles.inputFieldText, outline: 'none' }} />
              </div>
              <div style={{ flex: '2 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.inputLabel, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Label Name</label>
                <input type="text" value={newVlanName} onChange={e => setNewVlanName(e.target.value)} placeholder="e.g. DMZ_Servers" style={{ width: '100%', boxSizing: 'border-box', padding: '0.45rem', borderRadius: '6px', border: `2px solid ${styles.inputFieldBorder}`, backgroundColor: styles.inputFieldBg, color: styles.inputFieldText, outline: 'none' }} />
              </div>
              <div style={{ flex: '0 1 50px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.inputLabel, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Color</label>
                <input type="color" value={newVlanColor} onChange={e => setNewVlanColor(e.target.value)} style={{ width: '100%', height: '34px', border: 'none', padding: 0, cursor: 'pointer', backgroundColor: 'transparent' }} />
              </div>
              <button type="submit" style={{ padding: '0.45rem 1rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', height: '34px' }}>+ Add VLAN</button>
            </form>

            {/* Chassis density controls */}
            <div style={{ flex: '1 1 250px', backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', border: styles.panelBorder, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.inputLabel, marginBottom: '0.5rem', textTransform: 'uppercase' }}>⚙️ Chassis Density</span>
              <div style={{ display: 'flex', backgroundColor: styles.chartBg, padding: '3px', borderRadius: '6px', border: `1px solid ${styles.inputFieldBorder}` }}>
                <button type="button" onClick={() => handleChassisResize(8)} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', backgroundColor: chassisSize === 8 ? styles.toggleActiveBg : 'transparent', color: chassisSize === 8 ? '#ffffff' : styles.descText }}>8-Port</button>
                <button type="button" onClick={() => handleChassisResize(24)} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', backgroundColor: chassisSize === 24 ? styles.toggleActiveBg : 'transparent', color: chassisSize === 24 ? '#ffffff' : styles.descText }}>24-Port</button>
                <button type="button" onClick={() => handleChassisResize(48)} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', backgroundColor: chassisSize === 48 ? styles.toggleActiveBg : 'transparent', color: chassisSize === 48 ? '#ffffff' : styles.descText }}>48-Port</button>
              </div>
            </div>
          </div>

          {/* CHASSIS BLADE GRID */}
          <div style={{ backgroundColor: isDarkMode ? '#0f172a' : '#1e293b', padding: '1.5rem', borderRadius: '12px', border: '4px solid #475569', boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, fontFamily: 'monospace' }}>MANAGED SWITCH PORTS CHASSIS INTERFACES</span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: chassisSize === 8 ? 'repeat(4, 1fr)' : 'repeat(12, 1fr)', gap: '8px 12px', padding: '0 0.5rem' }}>
              {ports.map((port) => {
                const isSelected = port.id === selectedPortId;
                const activeProfile = vlanProfiles.find(p => p.id === port.vlanId);
                const portBgColor = port.mode === 'trunk' 
                  ? 'repeating-linear-gradient(45deg, #475569, #475569 4px, #94a3b8 4px, #94a3b8 8px)' 
                  : (activeProfile?.color || '#64748b');

                return (
                  <div
                    key={port.id}
                    onClick={() => setSelectedPortId(port.id)}
                    style={{
                      height: '42px', background: portBgColor, borderRadius: '4px',
                      border: isSelected ? '3px solid #38bdf8' : '2px solid #0f172a',
                      boxShadow: isSelected ? '0 0 12px #38bdf8' : '0 2px 4px rgba(0,0,0,0.2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', transition: 'all 0.15s ease', transform: isSelected ? 'scale(1.04)' : 'scale(1)'
                    }}
                  >
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: port.mode === 'trunk' ? '#7c3aed' : '#10b981', position: 'absolute', top: '4px', left: '4px' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{port.id}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INTERFACE CONFIGURATION PANEL */}
          <div style={{ backgroundColor: styles.setupBg, padding: '1.5rem', borderRadius: '10px', border: styles.panelBorder, display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: styles.titleText, fontSize: '1.1rem', fontWeight: 700 }}>⚡ Interface FastEthernet0/{selectedPort.id} Configuration</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: styles.descText }}>Adjust encapsulation values to view layout alterations update fluidly down across the architecture arrays.</p>
            </div>

            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: styles.inputLabel, marginBottom: '0.25rem' }}>Port VLAN Mode</label>
              <select value={selectedPort.mode} onChange={e => updatePortConfig({ mode: e.target.value as any })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: `2px solid ${styles.inputFieldBorder}`, backgroundColor: styles.inputFieldBg, color: styles.inputFieldText, outline: 'none', fontWeight: 600 }}>
                <option value="access">Access (Single VLAN Host)</option>
                <option value="trunk">Trunk (802.1Q Multiplexing Link)</option>
              </select>
            </div>

            {selectedPort.mode === 'access' ? (
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: styles.inputLabel, marginBottom: '0.25rem' }}>Assigned VLAN Membership</label>
                <select value={selectedPort.vlanId} onChange={e => updatePortConfig({ vlanId: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: `2px solid ${styles.inputFieldBorder}`, backgroundColor: styles.inputFieldBg, color: styles.inputFieldText, outline: 'none', fontWeight: 600 }}>
                  {vlanProfiles.map(p => <option key={p.id} value={p.id}>VLAN {p.id} — {p.name}</option>)}
                </select>
              </div>
            ) : (
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: styles.inputLabel, marginBottom: '0.25rem' }}>Native VLAN Fallback</label>
                <select value={selectedPort.nativeVlan} onChange={e => updatePortConfig({ nativeVlan: Number(e.target.value) })} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: `2px solid ${styles.inputFieldBorder}`, backgroundColor: styles.inputFieldBg, color: styles.inputFieldText, outline: 'none', fontWeight: 600 }}>
                  {vlanProfiles.map(p => <option key={p.id} value={p.id}>VLAN {p.id} — {p.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEWPORT 2: HEADER SEGMENTS */}
      {vlanTab === 'frame' && (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 700, fontSize: '1.1rem' }}>🔬 802.1Q Encapsulated Ethernet Frame Structure Analysis</h4>
          <p style={{ color: styles.descText, fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>Hover over segments to visualize how tagging alters standard Layer 2 frame payload lengths across trunk links.</p>

          <div style={{ display: 'flex', gap: '4px', width: '100%', overflowX: 'auto', paddingBottom: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>
            <div style={{ flex: '1 1 80px', backgroundColor: '#334155', padding: '1rem 0.5rem', borderRadius: '4px' }}>Preamble [8B]</div>
            <div style={{ flex: '1 1 90px', backgroundColor: '#1e3a8a', padding: '1rem 0.5rem', borderRadius: '4px' }}>Dest MAC [6B]</div>
            <div style={{ flex: '1 1 90px', backgroundColor: '#1e3a8a', padding: '1rem 0.5rem', borderRadius: '4px' }}>Src MAC [6B]</div>
            
            <div style={{ flex: '2 1 180px', backgroundColor: '#7c3aed', padding: '1rem 0.5rem', borderRadius: '4px', border: '2px solid #a855f7', boxShadow: '0 0 10px rgba(124,58,237,0.4)' }}>
              <span>🔒 802.1Q Tag [4 Bytes Inserted]</span>
              <div style={{ display: 'flex', gap: '2px', marginTop: '0.5rem', fontSize: '0.65rem' }}>
                <div style={{ flex: 1, backgroundColor: '#4c1d95', padding: '4px 1px', borderRadius: '2px' }}>TPID (0x8100)</div>
                <div style={{ flex: 1, backgroundColor: '#4c1d95', padding: '4px 1px', borderRadius: '2px' }}>PCP (3b)</div>
                <div style={{ flex: 2, backgroundColor: '#065f46', padding: '4px 1px', borderRadius: '2px', border: '1px solid #34d399' }}>VID: VLAN {selectedPort.mode === 'access' ? selectedPort.vlanId : selectedPort.nativeVlan}</div>
              </div>
            </div>

            <div style={{ flex: '1 1 80px', backgroundColor: '#334155', padding: '1rem 0.5rem', borderRadius: '4px' }}>Type [2B]</div>
            <div style={{ flex: '3 1 150px', backgroundColor: isDarkMode ? '#1e293b' : '#cbd5e1', color: styles.titleText, padding: '1rem 0.5rem', borderRadius: '4px', border: `1px dashed ${styles.inputFieldBorder}` }}>Data Payload [46 - 1500 Bytes]</div>
            <div style={{ flex: '1 1 80px', backgroundColor: '#7f1d1d', padding: '1rem 0.5rem', borderRadius: '4px' }}>FCS [4B]</div>
          </div>
        </div>
      )}

      {/* VIEWPORT 3: INTEGRATED ROUTER SUBINTERFACE EXPORTER */}
      {vlanTab === 'roas' && (
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.1rem' }}>💻 Cisco IOS Router-on-a-Stick Subinterface CLI Tree Provisioning Script</h4>
          <p style={{ color: styles.descText, fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>This loop dynamically builds the precise subinterface CLI commands required on an upstream router using your active database profiles.</p>

          <pre style={{ backgroundColor: styles.chartBg, border: `1px solid ${styles.panelBorder}`, padding: '1.5rem', borderRadius: '10px', color: isDarkMode ? '#38bdf8' : '#0284c7', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', overflowX: 'auto', margin: 0 }}>
{`! --- Core Inter-VLAN Gateway RoaS Infrastructure Script ---
! Paste these commands into global configuration mode on your router terminal
!
interface GigabitEthernet0/0
 no shutdown
 exit
!`}
{vlanProfiles.map(p => `
interface GigabitEthernet0/0.${p.id}
 description Gateway subinterface for ${p.name}
 encapsulation dot1Q ${p.id}${p.id === 1 ? ' native' : ''}
 ip address 10.0.${p.id}.1 255.255.255.0
 exit
!`).join('')}
{`end
write memory`}
          </pre>
        </div>
      )}

    </div>
  );
};