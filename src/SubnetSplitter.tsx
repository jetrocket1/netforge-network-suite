import React, { useState } from 'react';
import { ipToLong, longToIp } from './subnetUtils';

interface SubnetSplitterProps {
  isDarkMode?: boolean;
}

interface SubnetBlock {
  id: string;
  networkAddress: string;
  cidr: number;
  name: string; // Added custom friendly name property
}

export const SubnetSplitter: React.FC<SubnetSplitterProps> = ({ isDarkMode = true }) => {
  const [baseIp, setBaseIp] = useState<string>('192.168.1.0');
  const [baseCidr, setBaseCidr] = useState<number>(24);
  const [blocks, setBlocks] = useState<SubnetBlock[]>([
    { id: 'root', networkAddress: '192.168.1.0', cidr: 24, name: 'Production LAN Base' }
  ]);

  const splitBlock = (targetId: string) => {
    const targetBlock = blocks.find(b => b.id === targetId);
    if (!targetBlock || targetBlock.cidr >= 32) return;

    const newCidr = targetBlock.cidr + 1;
    const currentLong = ipToLong(targetBlock.networkAddress);
    const numHostsInNewBlock = Math.pow(2, 32 - newCidr);
    const secondHalfLong = currentLong + numHostsInNewBlock;

    // Split blocks inherit a snippet of the parent name + partition ID
    const baseParentName = targetBlock.name.replace(/ -( A|B)$/, '');
    
    const firstHalf: SubnetBlock = { 
      id: `${targetId}-1`, 
      networkAddress: targetBlock.networkAddress, 
      cidr: newCidr,
      name: `${baseParentName} - A` 
    };
    const secondHalf: SubnetBlock = { 
      id: `${targetId}-2`, 
      networkAddress: longToIp(secondHalfLong), 
      cidr: newCidr,
      name: `${baseParentName} - B` 
    };

    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === targetId);
      const updated = [...prev];
      updated.splice(index, 1, firstHalf, secondHalf);
      return updated;
    });
  };

  // Updates the name state property dynamically on keystroke
  const updateBlockName = (id: string, newName: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, name: newName } : b));
  };

  const resetBlocks = () => {
    try {
      ipToLong(baseIp);
      setBlocks([{ id: 'root', networkAddress: baseIp, cidr: baseCidr, name: 'Root Network Space' }]);
    } catch {
      alert('Please enter a valid base network ID address format.');
    }
  };

  const exportToCSV = () => {
    if (blocks.length === 0) return;

    // Added Subnet Name to CSV Header output array
    const headers = ['Subnet Label Name', 'Network Address', 'CIDR Mask', 'Total Address Space', 'Usable Hosts'];
    
    const csvRows = blocks.map((block) => {
      const totalAddresses = Math.pow(2, 32 - block.cidr);
      const usableHosts = totalAddresses <= 2 ? totalAddresses : totalAddresses - 2;
      return [
        `"${block.name.replace(/"/g, '""')}"`, // Sanitizes custom string spaces cleanly
        block.networkAddress,
        `/${block.cidr}`,
        totalAddresses,
        usableHosts
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `subnet_allocation_schema_${baseIp.replace(/\./g, '_')}_${baseCidr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    titleText: isDarkMode ? '#f8fafc' : '#0f172a',
    descText: isDarkMode ? '#94a3b8' : '#64748b',
    setupBg: isDarkMode ? '#1e293b' : '#f8fafc',
    inputLabel: isDarkMode ? '#cbd5e1' : '#475569',
    inputFieldBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputFieldText: isDarkMode ? '#ffffff' : '#0f172a',
    inputFieldBorder: isDarkMode ? '#475569' : '#cbd5e1',
    buttonInitBg: isDarkMode ? '#f8fafc' : '#0f172a',
    buttonInitText: isDarkMode ? '#0f172a' : '#ffffff',
    rowBg: isDarkMode ? '#1e293b' : '#ffffff',
    rowBorder: isDarkMode ? '#334155' : '#e2e8f0',
    rowText: isDarkMode ? '#f8fafc' : '#0f172a',
    badgeBg: isDarkMode ? '#0f172a' : '#f1f5f9',
    badgeText: isDarkMode ? '#38bdf8' : '#475569',
    mapTrackBg: isDarkMode ? '#1e293b' : '#e2e8f0',
    inlineInputText: isDarkMode ? '#38bdf8' : '#2563eb'
  };

  const totalBaseAddresses = Math.pow(2, 32 - baseCidr);

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: styles.panelBg,
      borderRadius: '16px',
      boxShadow: isDarkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
      border: `1px solid ${styles.panelBorder}`,
      transition: 'all 0.3s ease'
    }}>
      
      {/* Header Container */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem', 
        borderBottom: `2px solid ${styles.panelBorder}`, 
        paddingBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3 style={{ color: styles.titleText, fontSize: '1.5rem', fontWeight: 700, margin: 0, lineHeight: '1.2' }}>
            Visual Subnet Block Splitter (VLSM Planner)
          </h3>
          <p style={{ color: styles.descText, margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            Take a top-level IP allocation space and partition it into custom smaller layout blocks.
          </p>
        </div>
        
        <button
          onClick={exportToCSV}
          style={{
            padding: '0.55rem 1.1rem',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
            alignSelf: 'center'
          }}
        >
          📋 Export Sheet (.CSV)
        </button>
      </div>

      {/* Setup Row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '2rem', backgroundColor: styles.setupBg, padding: '1rem', borderRadius: '8px', transition: 'all 0.3s ease' }}>
        <div style={{ flex: '2 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: styles.inputLabel, marginBottom: '0.25rem' }}>Base Network IP</label>
          <input type="text" value={baseIp} onChange={e => setBaseIp(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '6px', border: `2px solid ${styles.inputFieldBorder}`, backgroundColor: styles.inputFieldBg, color: styles.inputFieldText, fontFamily: 'monospace', outline: 'none', fontWeight: 600 }} />
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: styles.inputLabel, marginBottom: '0.25rem' }}>Base Mask</label>
          <input type="number" min="0" max="30" value={baseCidr} onChange={e => setBaseCidr(Number(e.target.value))} style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem', borderRadius: '6px', border: `2px solid ${styles.inputFieldBorder}`, backgroundColor: styles.inputFieldBg, color: styles.inputFieldText, outline: 'none', fontWeight: 600 }} />
        </div>
        <button onClick={resetBlocks} style={{ padding: '0.5rem 1rem', backgroundColor: styles.buttonInitBg, color: styles.buttonInitText, border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}>
          Initialize Space
        </button>
      </div>

      {/* Topology Map */}
      <div style={{ marginBottom: '2.5rem' }}>
        <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDarkMode ? '#cbd5e1' : '#475569', tracking: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
          🗺️ Live Address Allocation Space Topology Map
        </span>
        
        <div style={{
          display: 'flex',
          width: '100%',
          height: '40px',
          backgroundColor: styles.mapTrackBg,
          borderRadius: '10px',
          overflow: 'hidden',
          border: `2px solid ${styles.panelBorder}`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {blocks.map((block, index) => {
            const blockAddresses = Math.pow(2, 32 - block.cidr);
            const widthPercentage = (blockAddresses / totalBaseAddresses) * 100;

            const colors = [
              { bg: '#2563eb', text: '#ffffff' },
              { bg: '#0d9488', text: '#ffffff' },
              { bg: '#7c3aed', text: '#ffffff' },
              { bg: '#db2777', text: '#ffffff' },
              { bg: '#ea580c', text: '#ffffff' }
            ];
            const pair = colors[index % colors.length];

            return (
              <div
                key={block.id}
                title={`[${block.name}] ${block.networkAddress}/${block.cidr}`}
                style={{
                  width: `${widthPercentage}%`,
                  backgroundColor: pair.bg,
                  color: pair.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  borderRight: index < blocks.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                  cursor: 'default',
                  userSelect: 'none',
                  padding: '0 4px'
                }}
              >
                {widthPercentage >= 12 ? block.name : widthPercentage >= 5 ? `/${block.cidr}` : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Slicing Active Grid Rows */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {blocks.map((block) => {
          const totalAddresses = Math.pow(2, 32 - block.cidr);
          return (
            <div key={block.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: styles.rowBg,
              border: `2px solid ${styles.rowBorder}`,
              borderRadius: '10px',
              transition: 'all 0.3s ease',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              {/* Left Column: Inline Label Input & Network ID Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 250px' }}>
                <input
                  type="text"
                  value={block.name}
                  onChange={(e) => updateBlockName(block.id, e.target.value)}
                  placeholder="Name this subnet..."
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `1px dashed ${styles.inputFieldBorder}`,
                    color: styles.inlineInputText,
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none',
                    padding: '2px 0',
                    width: '100%',
                    maxWidth: '280px'
                  }}
                />
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: styles.rowText }}>
                    {block.networkAddress}/{block.cidr}
                  </span>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: styles.badgeText, backgroundColor: styles.badgeBg, padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                    {totalAddresses === 2 ? '2 addresses (Pt-to-Pt)' : `${totalAddresses - 2} usable hosts`}
                  </span>
                </div>
              </div>
              
              {/* Right Column: Actions */}
              {block.cidr < 32 ? (
                <button
                  onClick={() => splitBlock(block.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isDarkMode ? '#334155' : '#eff6ff',
                    color: isDarkMode ? '#38bdf8' : '#2563eb',
                    border: `1px solid ${isDarkMode ? '#475569' : '#bfdbfe'}`,
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ✂️ Split in Half
                </button>
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Max Split reached</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};