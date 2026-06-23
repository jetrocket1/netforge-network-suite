import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

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
  const T = getLabTheme(isDarkMode);

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
    setPorts(Array.from({ length: size }, (_, i) => ({
      id: i + 1, mode: i === size - 1 ? 'trunk' : 'access', vlanId: 1, nativeVlan: 1
    })));
    setSelectedPortId(1);
  };

  const handleCreateVlan = (e: React.FormEvent) => {
    e.preventDefault();
    const vid = parseInt(newVlanId);
    if (isNaN(vid) || vid < 1 || vid > 4094) { alert('VLAN ID must be between 1 and 4094.'); return; }
    if (vlanProfiles.some(p => p.id === vid)) { alert(`VLAN ${vid} already exists.`); return; }
    if (!newVlanName.trim()) { alert('Enter a valid label name.'); return; }
    setVlanProfiles([...vlanProfiles, { id: vid, name: newVlanName.trim(), color: newVlanColor }].sort((a, b) => a.id - b.id));
    setNewVlanId(''); setNewVlanName('');
  };

  const updatePortConfig = (updated: Partial<SwitchPort>) => {
    setPorts(ports.map(p => p.id === selectedPortId ? { ...p, ...updated } : p));
  };

  const tabBtn = (key: typeof vlanTab): React.CSSProperties => ({
    padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.75rem',
    backgroundColor: vlanTab === key ? T.accent : 'transparent',
    color: vlanTab === key ? '#fff' : T.textSecondary,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '0.45rem', borderRadius: '6px',
    border: T.border, backgroundColor: T.insetBg, color: T.textPrimary, outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '0.5rem', borderRadius: '6px',
    border: T.border, backgroundColor: T.insetBg, color: T.textPrimary, outline: 'none', fontWeight: 600,
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', backgroundColor: T.cardBg, borderRadius: '16px', border: T.border, color: T.textPrimary, boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>VLAN Switchport Configuration</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0 0', fontSize: '0.875rem' }}>Map broadcast domains to physical interfaces, inspect 802.1Q frames, and generate router-on-a-stick CLI.</p>
        </div>
        <div style={{ display: 'flex', backgroundColor: T.insetBg, padding: '4px', borderRadius: '8px', border: T.border }}>
          <button type="button" onClick={() => setVlanTab('switch')} style={tabBtn('switch')}>Switchport map</button>
          <button type="button" onClick={() => setVlanTab('frame')} style={tabBtn('frame')}>Frame inspector</button>
          <button type="button" onClick={() => setVlanTab('roas')} style={tabBtn('roas')}>Router CLI</button>
        </div>
      </div>

      {/* TAB 1 */}
      {vlanTab === 'switch' && (
        <div>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <form onSubmit={handleCreateVlan} style={{ flex: '2 1 450px', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end', backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
              <div style={{ flex: '1 1 70px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>VLAN ID</label>
                <input type="number" min="1" max="4094" value={newVlanId} onChange={e => setNewVlanId(e.target.value)} placeholder="50" style={inputStyle} />
              </div>
              <div style={{ flex: '2 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Label</label>
                <input type="text" value={newVlanName} onChange={e => setNewVlanName(e.target.value)} placeholder="e.g. DMZ_Servers" style={inputStyle} />
              </div>
              <div style={{ flex: '0 1 50px' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textSecondary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Color</label>
                <input type="color" value={newVlanColor} onChange={e => setNewVlanColor(e.target.value)} style={{ width: '100%', height: '34px', border: 'none', padding: 0, cursor: 'pointer', backgroundColor: 'transparent' }} />
              </div>
              <button type="submit" style={{ padding: '0.45rem 1rem', backgroundColor: T.success, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', height: '34px' }}>+ Add VLAN</button>
            </form>

            <div style={{ flex: '1 1 250px', backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textSecondary, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Chassis density</span>
              <div style={{ display: 'flex', backgroundColor: T.insetBg, padding: '3px', borderRadius: '6px', border: T.border }}>
                {([8, 24, 48] as const).map(size => (
                  <button key={size} type="button" onClick={() => handleChassisResize(size)} style={{ flex: 1, padding: '6px 0', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', backgroundColor: chassisSize === size ? T.accent : 'transparent', color: chassisSize === size ? '#fff' : T.textSecondary }}>
                    {size}-Port
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chassis */}
          <div style={{ backgroundColor: T.insetBg, padding: '1.5rem', borderRadius: '12px', border: `4px solid ${T.borderColor}`, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `1px solid ${T.borderSubtle}`, paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: T.textMuted, fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Managed switch chassis</span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: T.success, display: 'inline-block' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: chassisSize === 8 ? 'repeat(4, 1fr)' : 'repeat(12, 1fr)', gap: '8px 12px', padding: '0 0.5rem' }}>
              {ports.map((port) => {
                const isSelected = port.id === selectedPortId;
                const activeProfile = vlanProfiles.find(p => p.id === port.vlanId);
                const portBgColor = port.mode === 'trunk'
                  ? `repeating-linear-gradient(45deg, ${T.borderColor}, ${T.borderColor} 4px, ${T.textMuted} 4px, ${T.textMuted} 8px)`
                  : (activeProfile?.color || '#64748b');
                return (
                  <div key={port.id} onClick={() => setSelectedPortId(port.id)}
                    style={{ height: '42px', background: portBgColor, borderRadius: '4px', border: isSelected ? `3px solid ${T.accent}` : `2px solid ${T.borderColor}`, boxShadow: isSelected ? `0 0 12px ${T.accent}` : '0 2px 4px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.15s ease', transform: isSelected ? 'scale(1.04)' : 'scale(1)' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: port.mode === 'trunk' ? '#7c3aed' : T.success, position: 'absolute', top: '4px', left: '4px' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{port.id}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Port config */}
          <div style={{ backgroundColor: T.panelBg, padding: '1.5rem', borderRadius: '10px', border: T.border, display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: T.textPrimary, fontSize: '1rem', fontWeight: 700 }}>Port Fa0/{selectedPort.id} configuration</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: T.textSecondary }}>Select a mode and VLAN assignment for the selected port.</p>
            </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: T.textSecondary, marginBottom: '0.25rem' }}>Port mode</label>
              <select value={selectedPort.mode} onChange={e => updatePortConfig({ mode: e.target.value as any })} style={selectStyle}>
                <option value="access">Access (single VLAN)</option>
                <option value="trunk">Trunk (802.1Q)</option>
              </select>
            </div>
            {selectedPort.mode === 'access' ? (
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: T.textSecondary, marginBottom: '0.25rem' }}>Assigned VLAN</label>
                <select value={selectedPort.vlanId} onChange={e => updatePortConfig({ vlanId: Number(e.target.value) })} style={selectStyle}>
                  {vlanProfiles.map(p => <option key={p.id} value={p.id}>VLAN {p.id} — {p.name}</option>)}
                </select>
              </div>
            ) : (
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: T.textSecondary, marginBottom: '0.25rem' }}>Native VLAN</label>
                <select value={selectedPort.nativeVlan} onChange={e => updatePortConfig({ nativeVlan: Number(e.target.value) })} style={selectStyle}>
                  {vlanProfiles.map(p => <option key={p.id} value={p.id}>VLAN {p.id} — {p.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Frame Inspector */}
      {vlanTab === 'frame' && (
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1rem' }}>802.1Q Frame Structure</h4>
          <p style={{ color: T.textSecondary, fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>The 802.1Q tag inserts 4 bytes between the source MAC and EtherType fields, carrying the VLAN ID and priority bits.</p>
          <div style={{ display: 'flex', gap: '4px', width: '100%', overflowX: 'auto', paddingBottom: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>
            <div style={{ flex: '1 1 80px', backgroundColor: T.panelBg, border: T.border, padding: '1rem 0.5rem', borderRadius: '4px', color: T.textSecondary }}>Preamble [8B]</div>
            <div style={{ flex: '1 1 90px', backgroundColor: T.accentSubtle, border: `1px solid ${T.accent}`, padding: '1rem 0.5rem', borderRadius: '4px', color: T.accent }}>Dest MAC [6B]</div>
            <div style={{ flex: '1 1 90px', backgroundColor: T.accentSubtle, border: `1px solid ${T.accent}`, padding: '1rem 0.5rem', borderRadius: '4px', color: T.accent }}>Src MAC [6B]</div>
            <div style={{ flex: '2 1 180px', backgroundColor: 'rgba(124,58,237,0.12)', padding: '1rem 0.5rem', borderRadius: '4px', border: '2px solid #7c3aed' }}>
              <span style={{ color: '#a78bfa' }}>802.1Q Tag [4 Bytes]</span>
              <div style={{ display: 'flex', gap: '2px', marginTop: '0.5rem', fontSize: '0.65rem' }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(76,29,149,0.6)', padding: '4px 1px', borderRadius: '2px', color: '#c4b5fd' }}>TPID 0x8100</div>
                <div style={{ flex: 1, backgroundColor: 'rgba(76,29,149,0.6)', padding: '4px 1px', borderRadius: '2px', color: '#c4b5fd' }}>PCP (3b)</div>
                <div style={{ flex: 2, backgroundColor: T.successSubtle, padding: '4px 1px', borderRadius: '2px', border: `1px solid ${T.success}`, color: T.success }}>VID: VLAN {selectedPort.mode === 'access' ? selectedPort.vlanId : selectedPort.nativeVlan}</div>
              </div>
            </div>
            <div style={{ flex: '1 1 80px', backgroundColor: T.panelBg, border: T.border, padding: '1rem 0.5rem', borderRadius: '4px', color: T.textSecondary }}>Type [2B]</div>
            <div style={{ flex: '3 1 150px', backgroundColor: T.panelBg, border: T.border, color: T.textPrimary, padding: '1rem 0.5rem', borderRadius: '4px' }}>Data Payload [46-1500 B]</div>
            <div style={{ flex: '1 1 80px', backgroundColor: T.dangerSubtle, border: `1px solid ${T.danger}`, padding: '1rem 0.5rem', borderRadius: '4px', color: T.danger }}>FCS [4B]</div>
          </div>
        </div>
      )}

      {/* TAB 3: Router CLI */}
      {vlanTab === 'roas' && (
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1rem' }}>Router-on-a-Stick — CLI configuration</h4>
          <p style={{ color: T.textSecondary, fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>Generated from your active VLAN database. Paste into global configuration mode on an upstream router.</p>
          <pre style={{ backgroundColor: T.termBg, border: `1px solid ${T.termBorder}`, padding: '1.5rem', borderRadius: '10px', color: T.accent, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.5', overflowX: 'auto', margin: 0 }}>
{`! Inter-VLAN routing (Router-on-a-Stick)
interface GigabitEthernet0/0
 no shutdown
 exit
!`}
{vlanProfiles.map(p => `
interface GigabitEthernet0/0.${p.id}
 description ${p.name}
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
