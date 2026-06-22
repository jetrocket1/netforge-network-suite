import React, { useState } from 'react';

interface AclLabProps {
  isDarkMode?: boolean;
}

export const AclLab: React.FC<AclLabProps> = ({ isDarkMode = true }) => {
  const [aclType, setAclType] = useState<'standard' | 'extended'>('extended');
  const [aclAction, setAclAction] = useState<'permit' | 'deny'>('deny');
  const [sourceType, setSourceType] = useState<'any' | 'host' | 'subnet'>('host');
  const [sourceIp, setSourceIp] = useState<string>('10.0.0.5');
  const [appFilter, setAppFilter] = useState<'none' | '22' | '80' | '443' | '53' | 'ping'>('22');
  
  const [targetInterface, setTargetInterface] = useState<string>('GigabitEthernet0/0');
  const [direction, setDirection] = useState<'in' | 'out'>('in');

  const styles = {
    cardBg: isDarkMode ? '#111827' : '#ffffff',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.06)',
    textPrimary: isDarkMode ? '#f8fafc' : '#0f172a',
    textMuted: isDarkMode ? '#94a3b8' : '#475569',
    setupBg: isDarkMode ? '#161f30' : '#f1f5f9',
    chartBg: isDarkMode ? '#0b0f19' : '#f8fafc',
    syntaxBg: '#05050a',
    syntaxText: '#eab308',
    accent: isDarkMode ? '#06b6d4' : '#0284c7'
  };

  const getAclMetadata = () => {
    const aclNum = aclType === 'standard' ? '10' : '101';
    const actionStr = aclAction;
    
    // Dynamic Source IP Syntax Mapping
    let srcStr = 'any';
    if (sourceType === 'host') srcStr = `host ${sourceIp}`;
    if (sourceType === 'subnet') srcStr = `10.0.0.0 0.0.0.255`;

    let protocolKeyword = 'ip';
    let portSuffix = '';

    if (aclType === 'extended') {
      if (appFilter === '22') { protocolKeyword = 'tcp'; portSuffix = ' eq 22'; }
      else if (appFilter === '80') { protocolKeyword = 'tcp'; portSuffix = ' eq 80'; }
      else if (appFilter === '443') { protocolKeyword = 'tcp'; portSuffix = ' eq 443'; }
      else if (appFilter === '53') { protocolKeyword = 'udp'; portSuffix = ' eq 53'; }
      else if (appFilter === 'ping') { protocolKeyword = 'icmp'; }
    }

    const definitionCmd = aclType === 'standard'
      ? `access-list ${aclNum} ${actionStr} ${srcStr}`
      : `access-list ${aclNum} ${actionStr} ${protocolKeyword} ${srcStr} any${portSuffix}`;

    return {
      definition: definitionCmd,
      binding: [
        `router(config)# interface ${targetInterface}`,
        `router(config-if)# ip access-group ${aclNum} ${direction}`
      ],
      explanation: sourceType === 'host'
        ? `This rule targets traffic originating explicitly from the individual device at ${sourceIp}. It uses the 'host' keyword, which implies a strict wildcard match of 0.0.0.0.`
        : `This rule captures any traffic generated within the entire 10.0.0.0/24 boundary using the inverse wildcard mask 0.0.0.255.`
    };
  };

  const meta = getAclMetadata();

  return (
    <div style={{ padding: '2rem', backgroundColor: styles.cardBg, borderRadius: '12px', border: styles.border, color: styles.textPrimary, fontFamily: 'system-ui, sans-serif' }}>
      
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>🛡️ Access Control List (ACL) Reference Studio</h3>
          <p style={{ color: styles.textMuted, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Master packet filtering rules, structural logic, and valid Cisco IOS syntax generation.</p>
        </div>
        <a 
          href="https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ fontSize: '0.72rem', fontWeight: 'bold', color: styles.accent, textDecoration: 'none', border: `1px solid ${styles.accent}`, padding: '4px 10px', borderRadius: '4px', backgroundColor: `${styles.accent}0a` }}
        >
          Official Cisco ACL Guide ↗
        </a>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        
        {/* INTERACTIVE CONTROLS CONTAINER */}
        <div style={{ flex: '1 1 400px', backgroundColor: styles.setupBg, padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>1. Interactive Rule Builder</span>

          {/* ACL TYPE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>ACL Type (Standard vs. Extended)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setAclType('standard')} style={{ flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: aclType === 'standard' ? styles.accent : styles.chartBg, color: aclType === 'standard' ? '#fff' : styles.textMuted }}>Standard (1-99)</button>
              <button type="button" onClick={() => setAclType('extended')} style={{ flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: aclType === 'extended' ? styles.accent : styles.chartBg, color: aclType === 'extended' ? '#fff' : styles.textMuted }}>Extended (100-199)</button>
            </div>
          </div>

          {/* ACTION STATEMENT */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Action Statement</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setAclAction('permit')} style={{ flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: aclAction === 'permit' ? '#10b981' : styles.chartBg, color: aclAction === 'permit' ? '#fff' : styles.textMuted }}>PERMIT (Allow)</button>
              <button type="button" onClick={() => setAclAction('deny')} style={{ flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: aclAction === 'deny' ? '#f43f5e' : styles.chartBg, color: aclAction === 'deny' ? '#fff' : styles.textMuted }}>DENY (Block)</button>
            </div>
          </div>

          {/* SOURCE IP ADDRESS TYPE & VALUE FIELD */}
          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Source Traffic Address Scope</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button type="button" onClick={() => setSourceType('any')} style={{ flex: 1, padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: sourceType === 'any' ? styles.accent : styles.chartBg, color: sourceType === 'any' ? '#fff' : styles.textMuted }}>Any Address</button>
              <button type="button" onClick={() => setSourceType('host')} style={{ flex: 1, padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: sourceType === 'host' ? styles.accent : styles.chartBg, color: sourceType === 'host' ? '#fff' : styles.textMuted }}>Single Host</button>
              <button type="button" onClick={() => setSourceType('subnet')} style={{ flex: 1, padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: sourceType === 'subnet' ? styles.accent : styles.chartBg, color: sourceType === 'subnet' ? '#fff' : styles.textMuted }}>Full Subnet</button>
            </div>

            {sourceType === 'host' && (
              <select 
                value={sourceIp} onChange={(e) => setSourceIp(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: styles.chartBg, color: styles.textPrimary, border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', fontFamily: 'monospace' }}
              >
                <option value="10.0.0.5">10.0.0.5 (Management Admin Node)</option>
                <option value="10.0.0.99">10.0.0.99 (Standard Subnet Client)</option>
                <option value="172.16.50.12">172.16.50.12 (External Partner Link)</option>
              </select>
            )}
            {sourceType === 'subnet' && (
              <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: styles.textMuted, padding: '4px' }}>
                Evaluates entire subnet: <strong>10.0.0.0 0.0.0.255</strong>
              </div>
            )}
          </div>

          {/* SERVICE SELECTION ROW (EXTENDED ONLY) */}
          {aclType === 'extended' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '6px' }}>Application Service Profile Filter</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <button type="button" onClick={() => setAppFilter('none')} style={{ padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: appFilter === 'none' ? styles.accent : styles.chartBg, color: appFilter === 'none' ? '#fff' : styles.textMuted }}>All IP Traffic</button>
                <button type="button" onClick={() => setAppFilter('22')} style={{ padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: appFilter === '22' ? styles.accent : styles.chartBg, color: appFilter === '22' ? '#fff' : styles.textMuted }}>SSH (TCP 22)</button>
                <button type="button" onClick={() => setAppFilter('80')} style={{ padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: appFilter === '80' ? styles.accent : styles.chartBg, color: appFilter === '80' ? '#fff' : styles.textMuted }}>HTTP (TCP 80)</button>
                <button type="button" onClick={() => setAppFilter('443')} style={{ padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: appFilter === '443' ? styles.accent : styles.chartBg, color: appFilter === '443' ? '#fff' : styles.textMuted }}>HTTPS (TCP 443)</button>
                <button type="button" onClick={() => setAppFilter('53')} style={{ padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: appFilter === '53' ? styles.accent : styles.chartBg, color: appFilter === '53' ? '#fff' : styles.textMuted }}>DNS (UDP 53)</button>
                <button type="button" onClick={() => setAppFilter('ping')} style={{ padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: appFilter === 'ping' ? styles.accent : styles.chartBg, color: appFilter === 'ping' ? '#fff' : styles.textMuted }}>Ping (ICMP)</button>
              </div>
            </div>
          )}

          {/* INTERFACE BINDING */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: styles.textMuted, textTransform: 'uppercase', marginBottom: '8px' }}>2. Interface Application Hook</span>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <select 
                value={targetInterface} onChange={(e) => setTargetInterface(e.target.value)}
                style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: styles.chartBg, color: styles.textPrimary, border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem' }}
              >
                <option value="GigabitEthernet0/0">GigabitEthernet0/0</option>
                <option value="GigabitEthernet0/1">GigabitEthernet0/1</option>
                <option value="Serial0/0/0">Serial0/0/0 (WAN)</option>
              </select>

              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <button type="button" onClick={() => setDirection('in')} style={{ flex: 1, padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: direction === 'in' ? '#06b6d4' : styles.chartBg, color: '#fff' }}>IN</button>
                <button type="button" onClick={() => setDirection('out')} style={{ flex: 1, padding: '6px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', border: 'none', backgroundColor: direction === 'out' ? '#eab308' : styles.chartBg, color: direction === 'out' ? '#000' : styles.textMuted }}>OUT</button>
              </div>
            </div>
          </div>
        </div>

        {/* OUTPUT MONITOR SHELL PANEL */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: styles.syntaxBg, padding: '1.2rem', borderRadius: '8px', border: '1px solid #1e293b', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ color: '#475569', display: 'block', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 'bold', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>CISCO RUNNING CONFIGURATION SYNTAX OUTPUT</span>
            
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '4px 0', lineHeight: '1.5' }}>
              <div style={{ color: '#64748b', fontStyle: 'italic' }}># Step A: Define the filter rule parameters</div>
              <div style={{ color: styles.syntaxText, marginBottom: '12px', fontWeight: 'bold' }}>{meta.definition}</div>
              
              <div style={{ color: '#64748b', fontStyle: 'italic' }}># Step B: Bind access rule matrix to target path interface</div>
              {meta.binding.map((cmd, i) => (
                <div key={i} style={{ color: '#38bdf8', fontWeight: 'bold' }}>{cmd}</div>
              ))}
            </div>

            <div style={{ fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid #1e293b', paddingTop: '10px', lineHeight: '1.4' }}>
              <strong>📋 Configuration Analysis:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#64748b' }}>
                {meta.explanation}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AclLab;