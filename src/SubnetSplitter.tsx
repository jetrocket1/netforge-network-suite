import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { ipToLong, longToIp } from './subnetUtils';

interface SubnetSplitterProps { isDarkMode?: boolean; }

interface SubnetBlock {
  id: string;
  networkAddress: string;
  cidr: number;
  name: string;
}

export const SubnetSplitter: React.FC<SubnetSplitterProps> = ({ isDarkMode = true }) => {
  const [baseIp, setBaseIp] = useState('192.168.1.0');
  const [baseCidr, setBaseCidr] = useState(24);
  const [blocks, setBlocks] = useState<SubnetBlock[]>([
    { id: 'root', networkAddress: '192.168.1.0', cidr: 24, name: 'Production LAN' }
  ]);
  const T = getLabTheme(isDarkMode);

  const splitBlock = (targetId: string) => {
    const target = blocks.find(b => b.id === targetId);
    if (!target || target.cidr >= 32) return;
    const newCidr = target.cidr + 1;
    const numHosts = Math.pow(2, 32 - newCidr);
    const baseName = target.name.replace(/ — (A|B)$/, '');
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === targetId);
      const updated = [...prev];
      updated.splice(idx, 1,
        { id: `${targetId}-1`, networkAddress: target.networkAddress, cidr: newCidr, name: `${baseName} — A` },
        { id: `${targetId}-2`, networkAddress: longToIp(ipToLong(target.networkAddress) + numHosts), cidr: newCidr, name: `${baseName} — B` }
      );
      return updated;
    });
  };

  const updateBlockName = (id: string, name: string) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, name } : b));

  const resetBlocks = () => {
    try {
      ipToLong(baseIp);
      setBlocks([{ id: 'root', networkAddress: baseIp, cidr: baseCidr, name: 'Root Network' }]);
    } catch {
      alert('Please enter a valid base network address.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Label', 'Network Address', 'CIDR', 'Total Addresses', 'Usable Hosts'];
    const rows = blocks.map(b => {
      const total = Math.pow(2, 32 - b.cidr);
      return [`"${b.name.replace(/"/g, '""')}"`, b.networkAddress, `/${b.cidr}`, total, total <= 2 ? total : total - 2].join(',');
    });
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subnets_${baseIp.replace(/\./g, '_')}_${baseCidr}.csv`;
    a.style.visibility = 'hidden';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalBaseAddresses = Math.pow(2, 32 - baseCidr);
  const barColors = ['#4493f8', '#3fb950', '#a855f7', '#f0883e', '#e3b341'];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>VLSM Subnet Planner</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>Split a top-level address block into progressively smaller subnets.</p>
        </div>
        <button type="button" onClick={exportToCSV}
          style={{ padding: '0.5rem 1rem', backgroundColor: T.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
          Export CSV
        </button>
      </div>

      {/* Setup row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem', backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px', border: T.border }}>
        <div style={{ flex: '2 1 180px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textSecondary, marginBottom: '5px', textTransform: 'uppercase' }}>Base network IP</label>
          <input type="text" value={baseIp} onChange={e => setBaseIp(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '6px', border: T.border, backgroundColor: T.insetBg, color: T.textPrimary, fontFamily: 'monospace', outline: 'none', fontWeight: 600 }} />
        </div>
        <div style={{ flex: '1 1 90px' }}>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textSecondary, marginBottom: '5px', textTransform: 'uppercase' }}>Prefix</label>
          <input type="number" min="0" max="30" value={baseCidr} onChange={e => setBaseCidr(Number(e.target.value))}
            style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '6px', border: T.border, backgroundColor: T.insetBg, color: T.textPrimary, outline: 'none', fontWeight: 600 }} />
        </div>
        <button type="button" onClick={resetBlocks}
          style={{ padding: '0.5rem 1rem', backgroundColor: T.accent, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
          Initialize
        </button>
      </div>

      {/* Allocation bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Address allocation map</span>
        <div style={{ display: 'flex', width: '100%', height: '38px', backgroundColor: T.insetBg, borderRadius: '8px', overflow: 'hidden', border: T.border }}>
          {blocks.map((block, i) => {
            const w = (Math.pow(2, 32 - block.cidr) / totalBaseAddresses) * 100;
            const color = barColors[i % barColors.length];
            return (
              <div key={block.id} title={`${block.name}  ${block.networkAddress}/${block.cidr}`}
                style={{ width: `${w}%`, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRight: i < blocks.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none', padding: '0 4px', transition: 'all 0.4s ease', userSelect: 'none' }}>
                {w >= 12 ? block.name : w >= 5 ? `/${block.cidr}` : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Block rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {blocks.map((block) => {
          const total = Math.pow(2, 32 - block.cidr);
          const usable = total <= 2 ? total : total - 2;
          return (
            <div key={block.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: T.panelBg, border: T.border, borderRadius: '10px', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 240px' }}>
                <input type="text" value={block.name} onChange={e => updateBlockName(block.id, e.target.value)} placeholder="Name this subnet..."
                  style={{ backgroundColor: 'transparent', border: 'none', borderBottom: `1px dashed ${T.borderColor}`, color: T.accent, fontSize: '0.95rem', fontWeight: 700, outline: 'none', padding: '2px 0', width: '100%', maxWidth: '280px' }} />
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: T.textPrimary }}>{block.networkAddress}/{block.cidr}</span>
                  <span style={{ marginLeft: '10px', fontSize: '0.75rem', color: T.accent, backgroundColor: T.accentSubtle, padding: '3px 8px', borderRadius: '10px', fontWeight: 600 }}>
                    {total === 2 ? '2 addresses (point-to-point)' : `${usable.toLocaleString()} usable hosts`}
                  </span>
                </div>
              </div>
              {block.cidr < 32 ? (
                <button type="button" onClick={() => splitBlock(block.id)}
                  style={{ padding: '7px 14px', backgroundColor: T.panelBg, color: T.accent, border: `1px solid ${T.borderColor}`, borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                  Split in half
                </button>
              ) : (
                <span style={{ fontSize: '0.78rem', color: T.textMuted }}>Max depth</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubnetSplitter;
