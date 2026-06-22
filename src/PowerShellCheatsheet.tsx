import React, { useState } from 'react';

interface CheatCmd {
  id: string;
  cmd: string;
  category: 'foundations' | 'networking' | 'admin';
  summary: string;
  syntax: string;
  legacyEquivalent?: string;
  realWorldScenario: string;
  objectOutputExample: string;
}

interface PowerShellCheatsheetProps {
  isDarkMode?: boolean;
}

export const PowerShellCheatsheet: React.FC<PowerShellCheatsheetProps> = ({ isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'foundations' | 'networking' | 'admin'>('all');
  const [selectedCmdId, setSelectedCmdId] = useState<string>('tnc-port');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const styles = {
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    terminalBg: '#05050a',
    terminalText: '#38bdf8',
    accent: isDarkMode ? '#06b6d4' : '#0284c7',
    fwd: '#10b981',
    blk: '#f43f5e',
    lst: '#eab308'
  };

  const commands: CheatCmd[] = [
    {
      id: 'get-help',
      cmd: 'Get-Help',
      category: 'foundations',
      summary: 'Displays built-in manual documentation and parameter structures.',
      syntax: 'Get-Help <Cmdlet-Name> -Examples',
      realWorldScenario: 'Get-Help Get-Content -Examples',
      objectOutputExample: 'NAME\n    Get-Content\nSYNOPSIS\n    Gets the content of the item at the specified location.\n\n    --------------  Example 1  --------------\n    PS C:\\> Get-Content -Path "C:\\logs\\dhcp.log" -Tail 20'
    },
    {
      id: 'get-member',
      cmd: 'Get-Member',
      category: 'foundations',
      summary: 'Reveals hidden methods, structural properties, and .NET types attached to pipeline objects.',
      syntax: '<Cmdlet-Output> | Get-Member',
      realWorldScenario: 'Get-NetIPAddress | Get-Member',
      objectOutputExample: 'TypeName: Microsoft.Management.Infrastructure.CimInstance#root/StandardCimv2/MSFT_NetIPAddress\n\nName               MemberType Definition\n----               ---------- ----------\nEquals             Method     bool Equals(System.Object obj)\nIPAddress          Property   string IPAddress {get;set;}\nInterfaceAlias     Property   string InterfaceAlias {get;set;}'
    },
    {
      id: 'tnc-port',
      cmd: 'Test-NetConnection (Port)',
      category: 'networking',
      summary: 'Executes TCP handshake verification to determine if firewalls are dropping a specific service port.',
      syntax: 'Test-NetConnection -ComputerName <String> -Port <Int32>',
      legacyEquivalent: 'telnet <host> <port>',
      realWorldScenario: 'Test-NetConnection -ComputerName "192.168.10.254" -Port 443',
      objectOutputExample: 'ComputerName     : 192.168.10.254\nRemoteAddress    : 192.168.10.254\nRemotePort       : 443\nInterfaceAlias   : Ethernet0\nTcpTestSucceeded : True'
    },
    {
      id: 'tnc-trace',
      cmd: 'Test-NetConnection (TraceRoute)',
      category: 'networking',
      summary: 'Performs path discovery auditing to expose the absolute network layer hop latency bounds.',
      syntax: 'Test-NetConnection -ComputerName <String> -TraceRoute',
      legacyEquivalent: 'tracert <host>',
      realWorldScenario: 'Test-NetConnection -ComputerName "google.com" -TraceRoute',
      objectOutputExample: 'ComputerName           : google.com\nRemoteAddress          : 142.250.200.46\nTraceRoute             : 192.168.1.1\n                         10.0.50.1\n                         142.250.200.46\nInterfaceAlias         : Wi-Fi'
    },
    {
      id: 'get-ip',
      cmd: 'Get-NetIPAddress',
      category: 'networking',
      summary: 'Audits network adapter interfaces and filters IP configuration properties programmatically.',
      syntax: 'Get-NetIPAddress -AddressFamily IPv4',
      legacyEquivalent: 'ipconfig /all',
      realWorldScenario: 'Get-NetIPAddress -AddressFamily IPv4 | Format-Table IPAddress, InterfaceAlias, AddressState',
      objectOutputExample: 'IPAddress      InterfaceAlias AddressState\n---------      -------------- ------------\n192.168.1.45   Ethernet0      Preferred\n127.0.0.1      Loopback PseudoAddress'
    },
    {
      id: 'get-tcp',
      cmd: 'Get-NetTCPConnection',
      category: 'networking',
      summary: 'Inspects the local TCP state machine, mapping active, established sockets and listening process tracking IDs.',
      syntax: 'Get-NetTCPConnection -State <String>',
      legacyEquivalent: 'netstat -ano',
      realWorldScenario: 'Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -eq 8080}',
      objectOutputExample: 'LocalAddress   LocalPort RemoteAddress RemotePort State  OwningProcess\n------------   --------- ------------- ---------- -----  -------------\n0.0.0.0        8080      0.0.0.0       0          Listen 4122'
    },
    {
      id: 'resolve-dns',
      cmd: 'Resolve-DnsName',
      category: 'networking',
      summary: 'Queries explicit local or remote authoritative name servers for precise infrastructure DNS mapping records.',
      syntax: 'Resolve-DnsName -Name <String> -Type <RecordType>',
      legacyEquivalent: 'nslookup <name>',
      realWorldScenario: 'Resolve-DnsName -Name "microsoft.com" -Type MX -Server "8.8.8.8"',
      objectOutputExample: 'Name             Type   TTL   Section    NameExchange              Preference\n----             ----   ---   -------    ------------              ----------\nmicrosoft.com    MX     3600  Answer     microsoft-com.mail.protection.outlook.com 10'
    },
    {
      id: 'restart-service',
      cmd: 'Restart-Service',
      category: 'admin',
      summary: 'Gracefully bounces system background execution daemons.',
      syntax: 'Restart-Service -Name <String> -Force',
      realWorldScenario: 'Restart-Service -Name "Spooler" -Force',
      objectOutputExample: '# Output is void if successful, use -Verbose parameter to review pipe execution vectors:\nVERBOSE: Performing the operation "Restart-Service" on target "Print Spooler (Spooler)".'
    }
  ];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredCommands = activeTab === 'all' 
    ? commands 
    : commands.filter(c => c.category === activeTab);

  const selectedCmd = commands.find(c => c.id === selectedCmdId) || commands[0];

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SECTION HEADER */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: "800", margin: 0 }}>PowerShell Systems & Diagnostics Matrix</h3>
          <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Master object-oriented terminal scripting, legacy utility translation tables, and network interface troubleshooting pipelines.</p>
        </div>
        
        {/* CATEGORY NAV FILTERS */}
        <div style={{ display: 'flex', backgroundColor: styles.setupBg, padding: '4px', borderRadius: '8px', border: styles.border }}>
          {(['all', 'foundations', 'networking', 'admin'] as const).map(tab => (
            <button
              type="button"
              key={tab}
              onClick={() => { setActiveTab(tab); }}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: "bold",
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                backgroundColor: activeTab === tab ? styles.accent : 'transparent',
                color: activeTab === tab ? '#fff' : styles.textMuted,
                transition: 'all 0.15s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* TWO COLUMN INTERACTIVE TERMINAL HUB */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* LEFT COLUMN: COMMAND SELECTOR INDEX */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredCommands.map(item => {
            const isSelected = item.id === selectedCmdId;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedCmdId(item.id)}
                style={{
                  padding: '10px 12px',
                  backgroundColor: isSelected ? styles.setupBg : 'rgba(255,255,255,0.01)',
                  border: isSelected ? `1px solid ${styles.accent}` : '1px solid rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: "bold", fontFamily: 'monospace', color: isSelected ? styles.accent : styles.textPrimary }}>
                    {item.cmd}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: styles.textMuted, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                    {item.summary}
                  </div>
                </div>
                <span style={{ fontSize: '0.55rem', fontWeight: "bold", textTransform: 'uppercase', padding: '2px 5px', borderRadius: '4px', backgroundColor: item.category === 'networking' ? `${styles.fwd}22` : `${styles.lst}22`, color: item.category === 'networking' ? styles.fwd : styles.lst }}>
                  {item.category.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: DETAIL ENGINE INSPECTOR SCREEN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: styles.setupBg, padding: '1.2rem', borderRadius: '10px', border: styles.border }}>
          
          <div>
            <span style={{ fontSize: '0.6rem', color: styles.accent, fontWeight: "bold", textTransform: 'uppercase', display: 'block' }}>Active Object Inspection</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '1.1rem', fontWeight: "700", fontFamily: 'monospace' }}>{selectedCmd.cmd}</h4>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: styles.textMuted, lineHeight: '1.4' }}>{selectedCmd.summary}</p>
          </div>

          {selectedCmd.legacyEquivalent && (
            <div style={{ fontSize: '0.75rem', borderLeft: `3px solid ${styles.lst}`, paddingLeft: '8px', color: styles.textMuted }}>
              Legacy Command Line equivalent: <code style={{ fontFamily: 'monospace', color: styles.lst, fontWeight: "bold" }}>{selectedCmd.legacyEquivalent}</code>
            </div>
          )}

          {/* PARAMETER SYNTAX BLOCK */}
          <div>
            <span style={{ fontSize: '0.6rem', color: styles.textMuted, fontWeight: "bold", textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Cmdlet Blueprint Syntax</span>
            <div style={{ backgroundColor: styles.chartBg, padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.03)', color: '#cbd5e1' }}>
              {selectedCmd.syntax}
            </div>
          </div>

          {/* REAL WORLD HANDS ON LAB STRING */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.6rem', color: styles.textMuted, fontWeight: "bold", textTransform: 'uppercase' }}>Real-World Deployment Execution</span>
              <button
                type="button"
                onClick={() => handleCopy(selectedCmd.realWorldScenario, selectedCmd.id)}
                style={{ background: 'transparent', border: 'none', color: copiedId === selectedCmd.id ? styles.fwd : styles.accent, fontSize: '0.65rem', fontWeight: "bold", cursor: 'pointer' }}
              >
                {copiedId === selectedCmd.id ? '✓ Copied to Clipboard' : '📋 Copy String'}
              </button>
            </div>
            <div style={{ backgroundColor: styles.terminalBg, padding: '10px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.75rem', color: styles.terminalText, border: '1px solid #1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
              PS C:\&gt; {selectedCmd.realWorldScenario}
            </div>
          </div>

          {/* .NET RUNTIME PIPELINE LAYER OBJECT STRUCTURE SCREEN */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: styles.textMuted, fontWeight: "bold", textTransform: 'uppercase', marginBottom: '4px' }}>Structured .NET Object Pipeline Return Output</span>
            <div style={{ flexGrow: 1, backgroundColor: '#020205', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)', overflowX: 'auto' }}>
              <pre style={{ margin: 0, padding: 0, fontFamily: 'monospace', fontSize: '0.65rem', color: '#a3e635', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                {selectedCmd.objectOutputExample}
              </pre>
            </div>
          </div>

        </div>

      </div>

      {/* CORE OBJECT PIPELINE THEORY CARD ACCORDION */}
      <div style={{ marginTop: '1.5rem', borderTop: '2px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.8rem', lineHeight: '1.5' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: "700", color: styles.accent }}>🌊 The Object-Oriented Pipeline Difference</h4>
          <p style={{ margin: 0, color: styles.textMuted }}>
            Unlike standard Bash or Command Prompt shells which stream raw flat text output lines, PowerShell passes **complete structural .NET objects** down the pipe. This allows engineers to instantly filter, slice, or convert diagnostic lists into formatted CSV files natively without complicated string parsing logic.
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: "700", color: styles.fwd }}>🧠 The Discovery Core (RRM)</h4>
          <p style={{ margin: 0, color: styles.textMuted }}>
            Teach your learners to rely on the discovery triad if they lose their footing: <code>Get-Command</code> to identify names, <code>Get-Help</code> to audit parameter syntaxes and real operational scenarios, and <code>Get-Member</code> to expose hidden object elements streaming across the active session pipe.
          </p>
        </div>
      </div>

    </div>
  );
};

export default PowerShellCheatsheet;