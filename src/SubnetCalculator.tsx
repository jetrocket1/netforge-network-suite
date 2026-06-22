import React, { useState } from 'react';
import { useSubnet } from './useSubnet';
import { isIpInSubnet } from './subnetUtils';

interface SubnetCalculatorProps {
  isDarkMode?: boolean;
}

interface ResultCardProps {
  label: string;
  value: string;
  icon: string;
  isHighlight?: boolean;
  isFullWidth?: boolean;
  isDarkMode?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ label, value, icon, isHighlight, isFullWidth, isDarkMode }) => {
  // Card-level dark mode variables
  const cardBg = isHighlight 
    ? (isDarkMode ? '#1e3a8a' : '#eff6ff') 
    : (isDarkMode ? '#1e293b' : '#ffffff');
  const cardBorder = isHighlight 
    ? (isDarkMode ? '#3b82f6' : '#bfdbfe') 
    : (isDarkMode ? '#334155' : '#e2e8f0');
  const labelText = isHighlight 
    ? (isDarkMode ? '#93c5fd' : '#1d4ed8') 
    : (isDarkMode ? '#94a3b8' : '#475569');
  const valText = isHighlight 
    ? (isDarkMode ? '#ffffff' : '#1e40af') 
    : (isDarkMode ? '#f8fafc' : '#0f172a');

  return (
    <div style={{
      gridColumn: isFullWidth ? '1 / -1' : 'auto',
      padding: '1.25rem',
      backgroundColor: cardBg,
      borderRadius: '12px',
      border: `2px solid ${cardBorder}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: labelText, tracking: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <span style={{ 
        fontSize: isFullWidth ? '1.25rem' : '1.15rem', 
        fontWeight: 700, 
        color: valText, 
        fontFamily: isHighlight ? 'sans-serif' : 'monospace' 
      }}>
        {value}
      </span>
    </div>
  );
};

export const SubnetCalculator: React.FC<SubnetCalculatorProps> = ({ isDarkMode = true }) => {
  const { ipAddress, cidr, setIpAddress, setCidr, results, error } = useSubnet();
  const [showBinary, setShowBinary] = useState<boolean>(true);
  const [checkIp, setCheckIp] = useState<string>('192.168.1.50');

  const getOctets = (binStr: string) => {
    return [
      binStr.slice(0, 8),
      binStr.slice(8, 16),
      binStr.slice(16, 24),
      binStr.slice(24, 32)
    ];
  };

  const isMatch = results ? isIpInSubnet(checkIp, results.networkAddress, cidr) : false;
  const isValidCheckIp = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(checkIp);

  // Layout Palettes mapping objects based on true/false toggle state
  const styles = {
    panelBg: isDarkMode ? '#111827' : '#ffffff',
    panelBorder: isDarkMode ? '#1e293b' : '#f1f5f9',
    heading: isDarkMode ? '#f8fafc' : '#0f172a',
    subheading: isDarkMode ? '#94a3b8' : '#475569',
    inputBoxBg: isDarkMode ? '#1e293b' : '#f8fafc',
    inputBoxBorder: isDarkMode ? '#334155' : '#cbd5e1',
    inputTextLabel: isDarkMode ? '#cbd5e1' : '#1e293b',
    inputFieldBg: isDarkMode ? '#0f172a' : '#ffffff',
    inputFieldText: isDarkMode ? '#ffffff' : '#0f172a',
    dividerLine: isDarkMode ? '#334155' : '#cbd5e1'
  };

  const getScannerStyles = () => {
    if (!isValidCheckIp) return isDarkMode ? { bg: '#1e293b', border: '#334155', text: '#cbd5e1' } : { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' };
    if (isMatch) {
      return isDarkMode 
        ? { bg: '#064e3b', border: '#10b981', text: '#a7f3d0' } // Deep rich emerald matrix on dark background
        : { bg: '#dcfce7', border: '#4ade80', text: '#14532d' };
    } else {
      return isDarkMode 
        ? { bg: '#7f1d1d', border: '#f43f5e', text: '#fecaca' } // Deep high-contrast crimson on dark background
        : { bg: '#fee2e2', border: '#f87171', text: '#7f1d1d' };
    }
  };

  const scannerStyle = getScannerStyles();

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
      <div style={{ marginBottom: '2rem', borderBottom: `2px solid ${styles.panelBorder}`, paddingBottom: '1rem' }}>
        <h2 style={{ color: styles.heading, fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.025em' }}>
          Subnet Calculator
        </h2>
        <p style={{ color: styles.subheading, margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 500 }}>
          Enter an IPv4 address and adjust the prefix length to compute network boundaries instantly.
        </p>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '2rem', 
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: styles.inputBoxBg,
        borderRadius: '12px',
        border: `1px solid ${styles.inputBoxBorder}`,
        transition: 'all 0.3s ease'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: styles.inputTextLabel, marginBottom: '0.5rem' }}>
            IP Address
          </label>
          <input
            type="text"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              fontSize: '1rem',
              fontWeight: 600,
              boxSizing: 'border-box', 
              border: error ? '2px solid #ef4444' : `2px solid ${styles.inputBoxBorder}`, 
              borderRadius: '8px',
              outline: 'none',
              fontFamily: 'monospace',
              backgroundColor: styles.inputFieldBg,
              color: styles.inputFieldText
            }}
            placeholder="e.g., 192.168.1.1"
          />
          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, margin: '0.5rem 0 0 0' }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 700, color: styles.inputTextLabel, marginBottom: '0.5rem' }}>
              <span>CIDR Prefix</span>
              <span style={{ backgroundColor: '#1d4ed8', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace' }}>
                /{cidr}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="32"
              value={cidr}
              onChange={(e) => setCidr(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', marginTop: '0.5rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: styles.subheading, fontWeight: 600, marginTop: '0.25rem', fontFamily: 'monospace' }}>
              <span>/0</span>
              <span>/16</span>
              <span>/32</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', borderTop: `1px solid ${styles.dividerLine}`, paddingTop: '0.75rem' }}>
            <input
              type="checkbox"
              id="binaryToggle"
              checked={showBinary}
              onChange={(e) => setShowBinary(e.target.checked)}
              style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }}
            />
            <label htmlFor="binaryToggle" style={{ fontSize: '0.875rem', fontWeight: 600, color: styles.inputTextLabel, cursor: 'pointer', userSelect: 'none' }}>
              Show Binary Bit Visualizer
            </label>
          </div>
        </div>
      </div>

      {results && showBinary && (
        <div style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2.5rem',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          border: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', margin: '0 0 1rem 0' }}>
            <span>BINARY BIT VISUALIZER</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ color: '#38bdf8' }}>■ Network ({cidr})</span>
              <span style={{ color: '#94a3b8' }}>■ Host ({32 - cidr})</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', fontFamily: 'monospace', fontSize: '1.25rem' }}>
            {getOctets(results.binaryString).map((octet, octetIdx) => (
              <React.Fragment key={octetIdx}>
                <div style={{ display: 'flex', gap: '2px', backgroundColor: '#1e293b', padding: '6px 10px', borderRadius: '6px', border: '1px solid #475569' }}>
                  {octet.split('').map((bit, bitIdx) => {
                    const dynamicGlobalBitIndex = octetIdx * 8 + bitIdx;
                    const isNetworkBit = dynamicGlobalBitIndex < cidr;
                    return (
                      <span
                        key={bitIdx}
                        style={{
                          color: isNetworkBit ? '#38bdf8' : '#94a3b8',
                          fontWeight: 'bold',
                          transition: 'color 0.1s ease'
                        }}
                      >
                        {bit}
                      </span>
                    );
                  })}
                </div>
                {octetIdx < 3 && <span style={{ color: '#475569', fontWeight: 'bold' }}>.</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {results ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <ResultCard label="Subnet Mask" value={results.subnetMask} icon="🎛️" isDarkMode={isDarkMode} />
          <ResultCard label="Network ID" value={results.networkAddress} icon="🌐" isDarkMode={isDarkMode} />
          <ResultCard label="Broadcast Address" value={results.broadcastAddress} icon="📢" isDarkMode={isDarkMode} />
          <ResultCard label="Total Usable Hosts" value={results.totalHosts.toLocaleString()} icon="💻" isHighlight isFullWidth isDarkMode={isDarkMode} />
          <ResultCard label="Usable Host Range" value={`${results.firstUsableHost} — ${results.lastUsableHost}`} icon="🚀" isFullWidth isDarkMode={isDarkMode} />
          
          <div style={{
            gridColumn: '1 / -1',
            marginTop: '1rem',
            padding: '1.75rem',
            backgroundColor: scannerStyle.bg,
            border: `2px solid ${scannerStyle.border}`,
            borderRadius: '14px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🔍</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isDarkMode ? '#f8fafc' : '#1e293b', tracking: '0.05em', textTransform: 'uppercase' }}>
                IP Range Boundary Validation Matcher
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              alignItems: 'center',
              gap: '1.25rem'
            }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '0.85rem', fontWeight: 700 }}>HOST:</span>
                <input
                  type="text"
                  value={checkIp}
                  onChange={(e) => setCheckIp(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.65rem 0.75rem 0.65rem 3.4rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    border: `2px solid ${isDarkMode ? '#475569' : '#475569'}`,
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    backgroundColor: styles.inputFieldBg,
                    color: styles.inputFieldText
                  }}
                  placeholder="e.g., 192.168.1.50"
                />
              </div>

              <div style={{ display: 'flex', width: '100%' }}>
                {!isValidCheckIp ? (
                  <div style={{ color: scannerStyle.text, fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', padding: '0.6rem 1.2rem', borderRadius: '8px', border: `1px solid ${scannerStyle.border}`, width: '100%', boxSizing: 'border-box' }}>
                    <span>⚠️</span> Awaiting Full IPv4 String...
                  </div>
                ) : isMatch ? (
                  <div style={{ 
                    color: scannerStyle.text, 
                    fontWeight: 800, 
                    fontSize: '0.95rem', 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    padding: '0.6rem 1.2rem', 
                    borderRadius: '8px', 
                    border: `2px solid ${scannerStyle.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <span>✅</span> MATCH: Sits inside subnet space.
                  </div>
                ) : (
                  <div style={{ 
                    color: scannerStyle.text, 
                    fontWeight: 800, 
                    fontSize: '0.95rem', 
                    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                    padding: '0.6rem 1.2rem', 
                    borderRadius: '8px', 
                    border: `2px solid ${scannerStyle.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <span>❌</span> MISMATCH: Different network block.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>⚠️</span>
          Please resolve the formatting errors above to view subnet outputs.
        </div>
      )}
    </div>
  );
};