import React, { useState } from 'react';
import { getLabTheme } from './labTheme';

interface AclLabProps {
  isDarkMode?: boolean;
}

export const AclLab: React.FC<AclLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);
  const [aclType, setAclType] = useState<'standard' | 'extended'>('extended');
  const [aclAction, setAclAction] = useState<'permit' | 'deny'>('deny');
  const [sourceType, setSourceType] = useState<'any' | 'host' | 'subnet'>('host');
  const [sourceIp, setSourceIp] = useState<string>('10.0.0.5');
  const [appFilter, setAppFilter] = useState<'none' | '22' | '80' | '443' | '53' | 'ping'>('22');
  const [targetInterface, setTargetInterface] = useState<string>('GigabitEthernet0/0');
  const [direction, setDirection] = useState<'in' | 'out'>('in');

  const getAclMetadata = () => {
    const aclNum = aclType === 'standard' ? '10' : '101';
    const actionStr = aclAction;
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
  const btn = (active: boolean, color?: string): React.CSSProperties => ({
    flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
    borderRadius: '4px', border: 'none',
    backgroundColor: active ? (color ?? T.accent) : T.insetBg,
    color: active ? '#fff' : T.textSecondary
  });

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ marginBottom: '2rem', borderBottom: T.border, paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Access Control List (ACL) Reference Studio</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Master packet filtering rules, structural logic, and valid Cisco IOS syntax generation.</p>
        </div>
        <a href="https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.72rem', fontWeight: 'bold', color: T.accent, textDecoration: 'none', border: `1px solid ${T.accent}`, padding: '4px 10px', borderRadius: '4px', backgroundColor: T.accentSubtle }}>
          Official Cisco ACL Guide ↗
        </a>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>

        {/* Controls */}
        <div style={{ flex: '1 1 400px', backgroundColor: T.panelBg, padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1.2rem', border: T.border }}>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', borderBottom: T.border, paddingBottom: '4px' }}>1. Interactive Rule Builder</span>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>ACL Type (Standard vs. Extended)</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setAclType('standard')} style={btn(aclType === 'standard')}>Standard (1-99)</button>
              <button type="button" onClick={() => setAclType('extended')} style={btn(aclType === 'extended')}>Extended (100-199)</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>Action Statement</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setAclAction('permit')} style={btn(aclAction === 'permit', T.success)}>PERMIT (Allow)</button>
              <button type="button" onClick={() => setAclAction('deny')} style={btn(aclAction === 'deny', T.danger)}>DENY (Block)</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>Source Traffic Address Scope</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button type="button" onClick={() => setSourceType('any')} style={btn(sourceType === 'any')}>Any Address</button>
              <button type="button" onClick={() => setSourceType('host')} style={btn(sourceType === 'host')}>Single Host</button>
              <button type="button" onClick={() => setSourceType('subnet')} style={btn(sourceType === 'subnet')}>Full Subnet</button>
            </div>
            {sourceType === 'host' && (
              <select value={sourceIp} onChange={(e) => setSourceIp(e.target.value)}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: T.insetBg, color: T.textPrimary, border: T.border, fontSize: '0.7rem', fontFamily: 'monospace' }}>
                <option value="10.0.0.5">10.0.0.5 (Management Admin Node)</option>
                <option value="10.0.0.99">10.0.0.99 (Standard Subnet Client)</option>
                <option value="172.16.50.12">172.16.50.12 (External Partner Link)</option>
              </select>
            )}
            {sourceType === 'subnet' && (
              <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: T.textSecondary, padding: '4px' }}>
                Evaluates entire subnet: <strong>10.0.0.0 0.0.0.255</strong>
              </div>
            )}
          </div>

          {aclType === 'extended' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>Application Service Profile Filter</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <button type="button" onClick={() => setAppFilter('none')} style={btn(appFilter === 'none')}>All IP Traffic</button>
                <button type="button" onClick={() => setAppFilter('22')} style={btn(appFilter === '22')}>SSH (TCP 22)</button>
                <button type="button" onClick={() => setAppFilter('80')} style={btn(appFilter === '80')}>HTTP (TCP 80)</button>
                <button type="button" onClick={() => setAppFilter('443')} style={btn(appFilter === '443')}>HTTPS (TCP 443)</button>
                <button type="button" onClick={() => setAppFilter('53')} style={btn(appFilter === '53')}>DNS (UDP 53)</button>
                <button type="button" onClick={() => setAppFilter('ping')} style={btn(appFilter === 'ping')}>Ping (ICMP)</button>
              </div>
            </div>
          )}

          <div style={{ borderTop: T.border, paddingTop: '10px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>2. Interface Application Hook</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select value={targetInterface} onChange={(e) => setTargetInterface(e.target.value)}
                style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: T.insetBg, color: T.textPrimary, border: T.border, fontSize: '0.7rem' }}>
                <option value="GigabitEthernet0/0">GigabitEthernet0/0</option>
                <option value="GigabitEthernet0/1">GigabitEthernet0/1</option>
                <option value="Serial0/0/0">Serial0/0/0 (WAN)</option>
              </select>
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <button type="button" onClick={() => setDirection('in')} style={{ ...btn(direction === 'in', T.accent) }}>IN</button>
                <button type="button" onClick={() => setDirection('out')} style={{ ...btn(direction === 'out', T.warning), color: direction === 'out' ? '#000' : T.textSecondary }}>OUT</button>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal output */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: T.termBg, padding: '1.2rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ color: T.termMuted, display: 'block', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 'bold', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px' }}>CISCO RUNNING CONFIGURATION SYNTAX OUTPUT</span>

            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '4px 0', lineHeight: '1.5' }}>
              <div style={{ color: T.termMuted, fontStyle: 'italic' }}># Step A: Define the filter rule parameters</div>
              <div style={{ color: T.warning, marginBottom: '12px', fontWeight: 'bold' }}>{meta.definition}</div>
              <div style={{ color: T.termMuted, fontStyle: 'italic' }}># Step B: Bind access rule matrix to target path interface</div>
              {meta.binding.map((cmd, i) => (
                <div key={i} style={{ color: T.accent, fontWeight: 'bold' }}>{cmd}</div>
              ))}
            </div>

            <div style={{ fontSize: '0.7rem', color: T.textSecondary, borderTop: `1px solid ${T.termBorder}`, paddingTop: '10px', lineHeight: '1.4' }}>
              <strong>Configuration Analysis:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: T.termMuted }}>
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
