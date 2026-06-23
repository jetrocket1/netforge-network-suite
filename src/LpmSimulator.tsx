import React, { useState, useEffect } from 'react';
import { getLabTheme } from './labTheme';

interface LpmSimulatorProps {
  isDarkMode?: boolean;
}

const LpmSimulatorComponent: React.FC<LpmSimulatorProps> = ({ isDarkMode = true }) => {
  const [inputIp, setInputIp] = useState<string>('192.168.1.55');
  const [targetIpBin, setTargetIpBin] = useState<string>('11000000101010000000000100110111');
  const [winningRow, setWinningRow] = useState<number | null>(null);
  const [analysisLog, setAnalysisLog] = useState<string>("");
  const [activeInstructionTab, setActiveInstructionTab] = useState<'overview' | 'labs' | 'table'>('overview');

  const T = getLabTheme(isDarkMode);

  const routingTable = [
    { id: 1, prefix: '0.0.0.0/0', maskLength: 0, binPrefix: '00000000000000000000000000000000', nextHop: '10.0.0.1', interface: 'Fa0/0', type: 'Static (Default Route)' },
    { id: 2, prefix: '192.168.1.0/24', maskLength: 24, binPrefix: '11000000101010000000000100000000', nextHop: '10.0.0.2', interface: 'Gi0/1', type: 'OSPF Summary' },
    { id: 3, prefix: '192.168.1.0/26', maskLength: 26, binPrefix: '11000000101010000000000100000000', nextHop: '10.0.0.6', interface: 'Gi0/2', type: 'Connected Subnet' },
    { id: 4, prefix: '10.1.1.0/24', maskLength: 24, binPrefix: '00001010000000010000000100000000', nextHop: '10.0.0.10', interface: 'Se0/0', type: 'EIGRP Route' }
  ];

  const ipToRawBinary = (ip: string): string => {
    try {
      return ip.split('.').map(octet => parseInt(octet, 10).toString(2).padStart(8, '0')).join('');
    } catch {
      return '0'.repeat(32);
    }
  };

  useEffect(() => {
    const octets = inputIp.split('.');
    if (octets.length !== 4 || octets.some(o => isNaN(parseInt(o)) || parseInt(o) < 0 || parseInt(o) > 255)) {
      setAnalysisLog("Invalid IP notation. Awaiting valid 32-bit dotted-decimal structure.");
      return;
    }

    const rawBin = ipToRawBinary(inputIp);
    setTargetIpBin(rawBin);

    let currentWinner: number | null = null;
    let maximumMaskSeen = -1;
    let matchingDetails = "";

    routingTable.forEach((row) => {
      let actualMatches = true;
      for (let i = 0; i < row.maskLength; i++) {
        if (rawBin[i] !== row.binPrefix[i]) {
          actualMatches = false;
          break;
        }
      }

      if (actualMatches) {
        matchingDetails += ` MATCH ${row.prefix} (${row.maskLength} matching bits checked)\n`;
        if (row.maskLength > maximumMaskSeen) {
          maximumMaskSeen = row.maskLength;
          currentWinner = row.id;
        }
      } else {
        matchingDetails += ` FAIL ${row.prefix} bit-matching constraint boundary\n`;
      }
    });

    setWinningRow(currentWinner);
    const winObj = routingTable.find(r => r.id === currentWinner);
    
    setAnalysisLog(
      `[INGRESS DESTINATION]: ${inputIp}\n\n` +
      `[CEF LOOKUP COMPILATION]:\n` +
      matchingDetails + '\n' +
      `[FORWARDING DECISION]:\n` +
      `The router chose line entry ${winObj?.prefix} via egress link interface ${winObj?.interface}.\n\nReason: /${maximumMaskSeen} represents the longest precise continuous string of matching network prefix bits.`
    );
  }, [inputIp]);

  const renderBitsArray = (binStr: string, maskLen: number, highlightMatch = false) => {
    return (
      <div style={{ display: 'flex', gap: '3px', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, flexWrap: 'wrap' }}>
        {binStr.split('').map((bit, idx) => {
          const isNetworkBit = idx < maskLen;
          const isMatchingTarget = highlightMatch && isNetworkBit && bit === targetIpBin[idx];
          
          let color = T.textMuted;
          if (maskLen === 32) color = T.accent;
          else if (isMatchingTarget) color = T.success;
          else if (isNetworkBit) color = T.danger;

          return (
            <span key={idx} style={{ 
              color: color, 
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              padding: '1px 3px', 
              borderRadius: '2px',
              marginRight: (idx + 1) % 8 === 0 ? '4px' : '0px'
            }}>
              {bit}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: T.cardBg, borderRadius: '16px', border: `1px solid ${T.borderColor}`, color: T.textPrimary }}>
      
      <div style={{ marginBottom: '1.5rem', borderBottom: `2px solid ${T.borderColor}`, paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Longest Prefix Match Binary Grid</h3>
        <p style={{ color: T.textSecondary, margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>Trace exactly how a router evaluates overlapping network prefix bitmasks simultaneously.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: T.panelBg, padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Target Destination IP Address</label>
            <input type="text" value={inputIp} onChange={(e) => setInputIp(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '4px', border: `1px solid ${T.borderColor}`, backgroundColor: T.insetBg, color: T.accent, fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, outline: 'none' }} />
            
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: T.textSecondary, textTransform: 'uppercase', width: '75px' }}>Packet Bits:</span>
              {renderBitsArray(targetIpBin, 32)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: T.textMuted, fontWeight: 'bold', textTransform: 'uppercase' }}>Routing Table (RIB) Prefix Bit Tracks</span>
            
            {routingTable.map((row) => {
              const isWinner = winningRow === row.id;
              return (
                <div key={row.id} style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: isWinner ? T.successSubtle : T.panelBg,
                  border: isWinner ? `2px solid ${T.success}` : `1px solid ${T.borderColor}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: isWinner ? T.success : T.textPrimary }}>{row.prefix}</span>
                      <span style={{ fontSize: '0.65rem', color: T.textSecondary, marginLeft: '8px', fontFamily: 'monospace' }}>via {row.interface} ({row.type})</span>
                    </div>
                    {isWinner && <span style={{ fontSize: '0.65rem', fontWeight: 900, color: T.success, backgroundColor: T.successSubtle, padding: '2px 6px', borderRadius: '4px' }}>SELECTED PATH</span>}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.6rem', fontFamily: 'monospace', color: T.textMuted, width: '75px' }}>Mask Range:</span>
                    {renderBitsArray(row.binPrefix, row.maskLength, true)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', backgroundColor: T.panelBg, padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button type="button" onClick={() => setActiveInstructionTab('overview')} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: activeInstructionTab === 'overview' ? T.accent : 'transparent', color: activeInstructionTab === 'overview' ? '#fff' : T.textSecondary }}>Guide</button>
            <button type="button" onClick={() => setActiveInstructionTab('labs')} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: activeInstructionTab === 'labs' ? T.accent : 'transparent', color: activeInstructionTab === 'labs' ? '#fff' : T.textSecondary }}>Lab Tasks</button>
            <button type="button" onClick={() => setActiveInstructionTab('table')} style={{ flex: 1, padding: '6px', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', backgroundColor: activeInstructionTab === 'table' ? T.accent : 'transparent', color: activeInstructionTab === 'table' ? '#fff' : T.textSecondary }}>Live Output</button>
          </div>

          <div style={{ backgroundColor: T.insetBg, padding: '1.25rem', borderRadius: '12px', border: `1px solid ${T.borderColor}`, minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            
            {activeInstructionTab === 'overview' && (
              <div style={{ fontSize: '0.85rem', color: T.textPrimary, lineHeight: '1.6' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: T.accent, fontWeight: 800 }}>How Longest Prefix Match Works</h4>
                <p style={{ margin: '0 0 1rem 0', color: T.textSecondary }}>When an IP packet arrives, a router does not stop searching at the first row it matches. Instead, it parses the entire table to see which valid network pathway shares the <strong>highest count of consecutive network bits</strong>.</p>
                <h5 style={{ margin: '0 0 0.25rem 0', fontWeight: 700 }}>Color Significance:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: T.textSecondary }}>
                  <li><strong style={{ color: T.success }}>Green bits:</strong> Physical match verified inside the subnet mask range boundary.</li>
                  <li><strong style={{ color: T.danger }}>Red bits:</strong> Explicit network parameter conflict. Pathway invalid.</li>
                  <li><strong>Gray bits:</strong> Host space outside mask limits (ignored during matching checks).</li>
                </ul>
              </div>
            )}

            {activeInstructionTab === 'labs' && (
              <div style={{ fontSize: '0.8rem', color: T.textSecondary, lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: T.warning }}>TASK 1: Deep Specifier Matching</span>
                  <p style={{ margin: '2px 0 0 0' }}>Type <strong>192.168.1.40</strong> in the address input box. Notice that rows 1, 2, and 3 all turn green. Row 3 wins because /26 uses a longer prefix mask than /24.</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: T.warning }}>TASK 2: Subnet Boundary Spillover</span>
                  <p style={{ margin: '2px 0 0 0' }}>Type <strong>192.168.1.100</strong>. Notice how the final bits in row 3 turn red, dropping its validity. The route gracefully rolls back to row 2 (/24) via Gi0/1.</p>
                </div>
                <div>
                  <span style={{ fontWeight: 'bold', color: T.warning }}>TASK 3: Gateway of Last Resort</span>
                  <p style={{ margin: '2px 0 0 0' }}>Type <strong>8.8.8.8</strong>. Every single targeted prefix track turns red. The engine relies on the default entry route <strong>0.0.0.0/0</strong> to prevent a packet drop.</p>
                </div>
              </div>
            )}

            {activeInstructionTab === 'table' && (
              <div style={{ backgroundColor: T.termBg, padding: '0.75rem', borderRadius: '6px', border: `1px solid ${T.termBorder}`, flexGrow: 1, fontFamily: 'monospace', fontSize: '0.75rem', color: T.termText, whiteSpace: 'pre-wrap' }}>
                {analysisLog}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default LpmSimulatorComponent;
