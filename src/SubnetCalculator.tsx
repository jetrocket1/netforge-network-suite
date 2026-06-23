import React, { useState } from 'react';
import { getLabTheme, LabTheme } from './labTheme';
import { useSubnet } from './useSubnet';
import { isIpInSubnet } from './subnetUtils';

interface SubnetCalculatorProps { isDarkMode?: boolean; }

const ResultCard = ({ label, value, isHighlight, isFullWidth, T }: {
  label: string; value: string; isHighlight?: boolean; isFullWidth?: boolean; T: LabTheme;
}) => (
  <div style={{ gridColumn: isFullWidth ? '1 / -1' : 'auto', padding: '1.25rem', backgroundColor: isHighlight ? T.accentSubtle : T.panelBg, borderRadius: '10px', border: isHighlight ? `2px solid ${T.accent}` : T.border, display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isHighlight ? T.accent : T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    <span style={{ fontSize: isFullWidth ? '1.15rem' : '1.05rem', fontWeight: 700, color: isHighlight ? T.accent : T.textPrimary, fontFamily: 'monospace' }}>{value}</span>
  </div>
);

export const SubnetCalculator: React.FC<SubnetCalculatorProps> = ({ isDarkMode = true }) => {
  const { ipAddress, cidr, setIpAddress, setCidr, results, error } = useSubnet();
  const [showBinary, setShowBinary] = useState(true);
  const [checkIp, setCheckIp] = useState('192.168.1.50');
  const T = getLabTheme(isDarkMode);

  const getOctets = (b: string) => [b.slice(0,8), b.slice(8,16), b.slice(16,24), b.slice(24,32)];

  const isMatch = results ? isIpInSubnet(checkIp, results.networkAddress, cidr) : false;
  const isValidCheckIp = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(checkIp);

  const scannerBg = !isValidCheckIp ? T.panelBg : isMatch ? T.successSubtle : T.dangerSubtle;
  const scannerBorder = !isValidCheckIp ? T.borderColor : isMatch ? T.success : T.danger;
  const scannerText = !isValidCheckIp ? T.textSecondary : isMatch ? T.success : T.danger;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary }}>

      <div style={{ marginBottom: '1.5rem', borderBottom: T.border, paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>IP Subnet Calculator</h3>
        <p style={{ color: T.textSecondary, margin: '4px 0 0', fontSize: '0.875rem' }}>Enter an IPv4 address and adjust the prefix length to compute network boundaries.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', padding: '1.25rem', backgroundColor: T.panelBg, borderRadius: '10px', border: T.border }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: T.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IP Address</label>
          <input type="text" value={ipAddress} onChange={e => setIpAddress(e.target.value)}
            style={{ width: '100%', padding: '0.65rem', fontSize: '1rem', fontWeight: 600, boxSizing: 'border-box', border: error ? `2px solid ${T.danger}` : T.border, borderRadius: '8px', outline: 'none', fontFamily: 'monospace', backgroundColor: T.insetBg, color: T.textPrimary }}
            placeholder="e.g. 192.168.1.1" />
          {error && <p style={{ color: T.danger, fontSize: '0.82rem', fontWeight: 700, margin: '4px 0 0' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700, color: T.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>CIDR Prefix</span>
              <span style={{ backgroundColor: T.accent, color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace' }}>/{cidr}</span>
            </label>
            <input type="range" min="0" max="32" value={cidr} onChange={e => setCidr(Number(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: T.textMuted, marginTop: '3px', fontFamily: 'monospace' }}>
              <span>/0</span><span>/16</span><span>/32</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: T.border, paddingTop: '10px' }}>
            <input type="checkbox" id="binaryToggle" checked={showBinary} onChange={e => setShowBinary(e.target.checked)} style={{ width: '1rem', height: '1rem', cursor: 'pointer' }} />
            <label htmlFor="binaryToggle" style={{ fontSize: '0.82rem', fontWeight: 600, color: T.textSecondary, cursor: 'pointer', userSelect: 'none' }}>Show binary bit map</label>
          </div>
        </div>
      </div>

      {results && showBinary && (
        <div style={{ backgroundColor: T.termBg, padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: `1px solid ${T.termBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 700, color: T.termMuted, marginBottom: '1rem', fontFamily: 'monospace' }}>
            <span>BINARY BIT MAP</span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ color: T.accent }}>■ Network ({cidr})</span>
              <span>■ Host ({32 - cidr})</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontFamily: 'monospace', fontSize: '1.15rem' }}>
            {getOctets(results.binaryString).map((octet, oi) => (
              <React.Fragment key={oi}>
                <div style={{ display: 'flex', gap: '2px', padding: '5px 8px', borderRadius: '6px', border: `1px solid ${T.termBorder}` }}>
                  {octet.split('').map((bit, bi) => (
                    <span key={bi} style={{ color: oi * 8 + bi < cidr ? T.accent : T.termMuted, fontWeight: 700 }}>{bit}</span>
                  ))}
                </div>
                {oi < 3 && <span style={{ color: T.termMuted, fontWeight: 700 }}>.</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {results ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <ResultCard label="Subnet Mask"       value={results.subnetMask}       T={T} />
          <ResultCard label="Network ID"        value={results.networkAddress}   T={T} />
          <ResultCard label="Broadcast Address" value={results.broadcastAddress} T={T} />
          <ResultCard label="Usable Hosts"      value={results.totalHosts.toLocaleString()} isHighlight isFullWidth T={T} />
          <ResultCard label="Host Range"        value={`${results.firstUsableHost} — ${results.lastUsableHost}`} isFullWidth T={T} />

          <div style={{ gridColumn: '1 / -1', padding: '1.25rem', backgroundColor: scannerBg, border: `2px solid ${scannerBorder}`, borderRadius: '10px', transition: 'all 0.3s' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Host boundary check</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: '0.78rem', fontWeight: 700, fontFamily: 'monospace' }}>HOST:</span>
                <input type="text" value={checkIp} onChange={e => setCheckIp(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.75rem 0.6rem 3.5rem', fontSize: '0.95rem', fontWeight: 600, border: T.border, borderRadius: '8px', fontFamily: 'monospace', outline: 'none', backgroundColor: T.insetBg, color: T.textPrimary }}
                  placeholder="e.g. 192.168.1.50" />
              </div>
              <div style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: `1px solid ${scannerBorder}`, backgroundColor: T.insetBg, fontWeight: 700, fontSize: '0.875rem', color: scannerText }}>
                {!isValidCheckIp ? 'Enter a complete IPv4 address to check' : isMatch ? 'MATCH — within this subnet' : 'NO MATCH — outside this subnet'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, backgroundColor: T.panelBg, borderRadius: '10px', border: T.border, fontSize: '0.85rem' }}>
          Resolve the format error above to see results.
        </div>
      )}
    </div>
  );
};

export default SubnetCalculator;
