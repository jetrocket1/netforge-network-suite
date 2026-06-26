import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { getLabTheme } from './labTheme';

interface AclLabProps {
  isDarkMode?: boolean;
}

const validIp = (v: string) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(v.trim()) &&
  v.trim().split('.').every(o => +o >= 0 && +o <= 255);

export const AclLab: React.FC<AclLabProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);

  const [aclType,   setAclType]   = useState<'standard' | 'extended'>('extended');
  const [aclAction, setAclAction] = useState<'permit' | 'deny'>('deny');

  // Source
  const [sourceType,      setSourceType]      = useState<'any' | 'host' | 'subnet'>('host');
  const [sourceIp,        setSourceIp]        = useState('10.0.0.5');
  const [srcNet,          setSrcNet]          = useState('10.0.0.0');
  const [srcWild,         setSrcWild]         = useState('0.0.0.255');

  // Destination (extended only)
  const [destType,        setDestType]        = useState<'any' | 'host' | 'subnet'>('any');
  const [destIp,          setDestIp]          = useState('192.168.1.1');
  const [dstNet,          setDstNet]          = useState('192.168.1.0');
  const [dstWild,         setDstWild]         = useState('0.0.0.255');

  const [appFilter,       setAppFilter]       = useState<'none' | '22' | '80' | '443' | '53' | 'ping'>('22');
  const [targetInterface, setTargetInterface] = useState('GigabitEthernet0/0');
  const [direction,       setDirection]       = useState<'in' | 'out'>('in');

  // Validation flags
  const srcIpOk  = validIp(sourceIp);
  const srcNetOk = validIp(srcNet) && validIp(srcWild);
  const dstIpOk  = validIp(destIp);
  const dstNetOk = validIp(dstNet) && validIp(dstWild);

  const getAclMetadata = () => {
    const aclNum = aclType === 'standard' ? '10' : '101';

    let srcStr = 'any';
    if (sourceType === 'host')   srcStr = `host ${srcIpOk  ? sourceIp.trim() : '?'}`;
    if (sourceType === 'subnet') srcStr = srcNetOk ? `${srcNet.trim()} ${srcWild.trim()}` : '? ?';

    let dstStr = 'any';
    if (aclType === 'extended') {
      if (destType === 'host')   dstStr = `host ${dstIpOk  ? destIp.trim() : '?'}`;
      if (destType === 'subnet') dstStr = dstNetOk ? `${dstNet.trim()} ${dstWild.trim()}` : '? ?';
    }

    let proto = 'ip';
    let portSuffix = '';
    if (aclType === 'extended') {
      if (appFilter === '22')   { proto = 'tcp'; portSuffix = ' eq 22'; }
      else if (appFilter === '80')  { proto = 'tcp'; portSuffix = ' eq 80'; }
      else if (appFilter === '443') { proto = 'tcp'; portSuffix = ' eq 443'; }
      else if (appFilter === '53')  { proto = 'udp'; portSuffix = ' eq 53'; }
      else if (appFilter === 'ping') { proto = 'icmp'; }
    }

    const definition = aclType === 'standard'
      ? `access-list ${aclNum} ${aclAction} ${srcStr}`
      : `access-list ${aclNum} ${aclAction} ${proto} ${srcStr} ${dstStr}${portSuffix}`;

    const srcExplain = sourceType === 'any'    ? 'all source addresses'
      : sourceType === 'host'   ? `the single host ${sourceIp.trim()}`
      : `the subnet ${srcNet.trim()} (wildcard ${srcWild.trim()})`;

    const dstExplain = aclType !== 'extended' ? ''
      : destType === 'any'    ? 'any destination'
      : destType === 'host'   ? `destination host ${destIp.trim()}`
      : `destination subnet ${dstNet.trim()} (wildcard ${dstWild.trim()})`;

    return {
      aclNum,
      definition,
      binding: [
        `router(config)# interface ${targetInterface}`,
        `router(config-if)# ip access-group ${aclNum} ${direction}`,
      ],
      explanation: aclType === 'standard'
        ? `This standard ACL ${aclAction}s traffic from ${srcExplain}. Standard ACLs match on source IP only — place them close to the destination.`
        : `This extended ACL ${aclAction}s ${proto.toUpperCase()} traffic from ${srcExplain} to ${dstExplain}${portSuffix ? ` on port${portSuffix.replace(' eq', '')}` : ''}. Extended ACLs match source, destination, protocol, and port — place them close to the source.`,
    };
  };

  const meta = getAclMetadata();

  // Reusable styles
  const btn = (active: boolean, color?: string): CSSProperties => ({
    flex: 1, padding: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
    borderRadius: '4px', border: 'none',
    backgroundColor: active ? (color ?? T.accent) : T.insetBg,
    color: active ? '#fff' : T.textSecondary,
  });

  const inputSt = (ok: boolean): CSSProperties => ({
    width: '100%', padding: '5px 8px', borderRadius: '4px', boxSizing: 'border-box',
    backgroundColor: T.insetBg, color: T.textPrimary,
    border: `1px solid ${ok ? T.borderColor : T.danger}`,
    fontSize: '0.78rem', fontFamily: 'monospace', outline: 'none',
  });

  const label: CSSProperties = {
    display: 'block', fontSize: '0.65rem', fontWeight: 800,
    color: T.textSecondary, textTransform: 'uppercase', marginBottom: '6px',
  };

  const sectionHead: CSSProperties = {
    display: 'block', fontSize: '0.7rem', fontWeight: 800,
    color: T.textSecondary, textTransform: 'uppercase',
    borderBottom: T.border, paddingBottom: '4px',
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: T.cardBg, borderRadius: '12px', border: T.border, color: T.textPrimary, fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem', borderBottom: T.border, paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>ACL Rule Builder</h3>
          <p style={{ color: T.textSecondary, margin: '4px 0 0 0', fontSize: '0.85rem' }}>Build, customise, and understand Cisco IOS access control list syntax.</p>
        </div>
        <a href="https://www.cisco.com/c/en/us/support/docs/ip/access-lists/26448-ACLsamples.html" target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '0.72rem', fontWeight: 'bold', color: T.accent, textDecoration: 'none', border: `1px solid ${T.accent}`, padding: '4px 10px', borderRadius: '4px', backgroundColor: T.accentSubtle }}>
          Cisco ACL Reference ↗
        </a>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>

        {/* ── Controls ── */}
        <div style={{ flex: '1 1 400px', backgroundColor: T.panelBg, padding: '1.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1.2rem', border: T.border }}>
          <span style={sectionHead}>1. Rule Parameters</span>

          {/* ACL type */}
          <div>
            <label style={label}>ACL Type</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setAclType('standard')} style={btn(aclType === 'standard')}>Standard (1–99)</button>
              <button type="button" onClick={() => setAclType('extended')} style={btn(aclType === 'extended')}>Extended (100–199)</button>
            </div>
            <div style={{ fontSize: '0.62rem', color: T.textMuted, marginTop: 5 }}>
              {aclType === 'standard'
                ? 'Matches source IP only. Place close to the destination.'
                : 'Matches source, destination, protocol, and port. Place close to the source.'}
            </div>
          </div>

          {/* Action */}
          <div>
            <label style={label}>Action</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setAclAction('permit')} style={btn(aclAction === 'permit', T.success)}>PERMIT — Allow</button>
              <button type="button" onClick={() => setAclAction('deny')}   style={btn(aclAction === 'deny',   T.danger)}>DENY — Block</button>
            </div>
          </div>

          {/* Source */}
          <div>
            <label style={label}>Source Address</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <button type="button" onClick={() => setSourceType('any')}    style={btn(sourceType === 'any')}>Any</button>
              <button type="button" onClick={() => setSourceType('host')}   style={btn(sourceType === 'host')}>Host IP</button>
              <button type="button" onClick={() => setSourceType('subnet')} style={btn(sourceType === 'subnet')}>Subnet</button>
            </div>
            {sourceType === 'host' && (
              <div>
                <input
                  value={sourceIp}
                  onChange={e => setSourceIp(e.target.value)}
                  placeholder="e.g. 10.0.0.5"
                  style={inputSt(srcIpOk)}
                />
                {!srcIpOk && <div style={{ fontSize: '0.6rem', color: T.danger, marginTop: 3 }}>Enter a valid IPv4 address</div>}
              </div>
            )}
            {sourceType === 'subnet' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.6rem', color: T.textMuted, marginBottom: 3 }}>Network address</div>
                  <input value={srcNet} onChange={e => setSrcNet(e.target.value)} placeholder="10.0.0.0" style={inputSt(validIp(srcNet))} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.6rem', color: T.textMuted, marginBottom: 3 }}>Wildcard mask</div>
                  <input value={srcWild} onChange={e => setSrcWild(e.target.value)} placeholder="0.0.0.255" style={inputSt(validIp(srcWild))} />
                </div>
              </div>
            )}
          </div>

          {/* Destination (extended only) */}
          {aclType === 'extended' && (
            <div>
              <label style={label}>Destination Address</label>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <button type="button" onClick={() => setDestType('any')}    style={btn(destType === 'any')}>Any</button>
                <button type="button" onClick={() => setDestType('host')}   style={btn(destType === 'host')}>Host IP</button>
                <button type="button" onClick={() => setDestType('subnet')} style={btn(destType === 'subnet')}>Subnet</button>
              </div>
              {destType === 'host' && (
                <div>
                  <input
                    value={destIp}
                    onChange={e => setDestIp(e.target.value)}
                    placeholder="e.g. 192.168.1.1"
                    style={inputSt(dstIpOk)}
                  />
                  {!dstIpOk && <div style={{ fontSize: '0.6rem', color: T.danger, marginTop: 3 }}>Enter a valid IPv4 address</div>}
                </div>
              )}
              {destType === 'subnet' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: T.textMuted, marginBottom: 3 }}>Network address</div>
                    <input value={dstNet} onChange={e => setDstNet(e.target.value)} placeholder="192.168.1.0" style={inputSt(validIp(dstNet))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: T.textMuted, marginBottom: 3 }}>Wildcard mask</div>
                    <input value={dstWild} onChange={e => setDstWild(e.target.value)} placeholder="0.0.0.255" style={inputSt(validIp(dstWild))} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Protocol/port (extended only) */}
          {aclType === 'extended' && (
            <div>
              <label style={label}>Protocol / Port</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <button type="button" onClick={() => setAppFilter('none')} style={btn(appFilter === 'none')}>All IP</button>
                <button type="button" onClick={() => setAppFilter('22')}   style={btn(appFilter === '22')}>SSH / 22</button>
                <button type="button" onClick={() => setAppFilter('80')}   style={btn(appFilter === '80')}>HTTP / 80</button>
                <button type="button" onClick={() => setAppFilter('443')}  style={btn(appFilter === '443')}>HTTPS / 443</button>
                <button type="button" onClick={() => setAppFilter('53')}   style={btn(appFilter === '53')}>DNS / 53</button>
                <button type="button" onClick={() => setAppFilter('ping')} style={btn(appFilter === 'ping')}>Ping (ICMP)</button>
              </div>
            </div>
          )}

          {/* Interface */}
          <div style={{ borderTop: T.border, paddingTop: '10px' }}>
            <span style={{ ...sectionHead, borderBottom: 'none', paddingBottom: 0, marginBottom: '0.75rem' }}>2. Interface &amp; Direction</span>
            <div style={{ display: 'flex', gap: '6px', marginTop: '0.5rem' }}>
              <div style={{ flex: 2 }}>
                <div style={{ fontSize: '0.6rem', color: T.textMuted, marginBottom: 3 }}>Interface name</div>
                <input
                  value={targetInterface}
                  onChange={e => setTargetInterface(e.target.value)}
                  placeholder="e.g. GigabitEthernet0/0"
                  style={{ ...inputSt(true), fontFamily: 'monospace' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.6rem', color: T.textMuted, marginBottom: 3 }}>Direction</div>
                <div style={{ display: 'flex', gap: '4px', height: 28 }}>
                  <button type="button" onClick={() => setDirection('in')}  style={{ ...btn(direction === 'in',  T.accent),  height: '100%' }}>IN</button>
                  <button type="button" onClick={() => setDirection('out')} style={{ ...btn(direction === 'out', T.warning), height: '100%', color: direction === 'out' ? '#000' : T.textSecondary }}>OUT</button>
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.62rem', color: T.textMuted, marginTop: 5 }}>
              {direction === 'in'
                ? 'IN — filters packets arriving at this interface (from the connected network).'
                : 'OUT — filters packets leaving this interface (towards the connected network).'}
            </div>
          </div>
        </div>

        {/* ── Terminal output ── */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ backgroundColor: T.termBg, padding: '1.2rem', borderRadius: '8px', border: `1px solid ${T.termBorder}`, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ color: T.termMuted, display: 'block', fontSize: '0.65rem', fontFamily: 'monospace', fontWeight: 'bold', borderBottom: `1px solid ${T.termBorder}`, paddingBottom: '4px' }}>CISCO IOS — RUNNING CONFIG</span>

            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '4px 0', lineHeight: '1.6' }}>
              <div style={{ color: T.termMuted, fontStyle: 'italic' }}># Step 1 — define the ACL rule</div>
              <div style={{ color: T.warning, marginBottom: '12px', fontWeight: 'bold' }}>{meta.definition}</div>
              <div style={{ color: T.termMuted, fontStyle: 'italic' }}># Step 2 — apply to interface</div>
              {meta.binding.map((cmd, i) => (
                <div key={i} style={{ color: T.accent, fontWeight: 'bold' }}>{cmd}</div>
              ))}
              {/* Implicit deny */}
              <div style={{ marginTop: '1rem', borderTop: `1px dashed ${T.termBorder}`, paddingTop: '0.75rem' }}>
                <div style={{ color: T.termMuted, fontStyle: 'italic' }}># Always appended — never visible in show run</div>
                <div style={{ color: T.danger, opacity: 0.5, fontWeight: 'bold' }}>
                  {aclType === 'standard'
                    ? `access-list ${meta.aclNum} deny any`
                    : `access-list ${meta.aclNum} deny ip any any`}
                  <span style={{ fontFamily: 'system-ui', fontStyle: 'italic', fontWeight: 400, marginLeft: 10, fontSize: '0.65rem', opacity: 0.85 }}>← implicit deny</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: T.textSecondary, borderTop: `1px solid ${T.termBorder}`, paddingTop: '10px', lineHeight: '1.5' }}>
              <strong>What this rule does:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: T.termMuted }}>{meta.explanation}</p>
            </div>

            <div style={{ background: `${T.danger}12`, border: `1px solid ${T.danger}35`, borderLeft: `3px solid ${T.danger}`, borderRadius: '6px', padding: '0.7rem 0.9rem', fontSize: '0.68rem', lineHeight: 1.6, color: T.textSecondary }}>
              <span style={{ fontWeight: 800, color: T.danger }}>Implicit deny — every ACL ends with one.</span>{' '}
              IOS appends <span style={{ fontFamily: 'monospace', color: T.textPrimary }}>deny any</span> (standard) or{' '}
              <span style={{ fontFamily: 'monospace', color: T.textPrimary }}>deny ip any any</span> (extended) automatically.
              It never appears in <span style={{ fontFamily: 'monospace', color: T.textPrimary }}>show running-config</span> but is always enforced — any unmatched packet is silently dropped.
            </div>
          </div>
        </div>
      </div>

      {/* ── Step-by-step guidance ── */}
      <div style={{ backgroundColor: T.panelBg, border: T.border, borderRadius: '8px', padding: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: T.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1.25rem', borderBottom: T.border, paddingBottom: '6px' }}>
          How to Build an ACL Rule — Step by Step
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            {
              n: '01', color: T.accent, title: 'Choose Standard or Extended',
              body: 'Standard ACLs (1–99) filter on source IP only — simple but blunt. Extended ACLs (100–199) let you match source, destination, protocol, and port. Use extended whenever you need precision.',
              tip: 'Exam tip: Standard ACLs go near the destination. Extended ACLs go near the source.',
            },
            {
              n: '02', color: T.success, title: 'Set the Action',
              body: 'PERMIT allows matching traffic. DENY blocks it. IOS evaluates rules top-to-bottom — the first rule that matches a packet wins. Rules below it are never checked for that packet.',
              tip: 'Exam tip: Order matters. Put more specific rules above general ones.',
            },
            {
              n: '03', color: T.warning, title: 'Define the Source (and Destination)',
              body: 'Use "any" to match all addresses, "host x.x.x.x" for a single IP, or a network + wildcard mask for a range. Wildcard mask = inverse of subnet mask (255.255.255.0 → 0.0.0.255). For extended ACLs, define the destination the same way.',
              tip: 'Wildcard 0.0.0.0 = exact match (same as "host"). Wildcard 255.255.255.255 = match all (same as "any").',
            },
            {
              n: '04', color: T.danger, title: 'Remember the Implicit Deny',
              body: 'Every ACL has an invisible "deny all" at the bottom that you never type. If a packet reaches the end of the ACL without matching any rule, it is dropped silently. This is why a permit-only ACL will block everything you forgot to explicitly allow.',
              tip: 'Always add a permit at the end if you want unmatched traffic to pass.',
            },
            {
              n: '05', color: '#a855f7', title: 'Apply to an Interface',
              body: 'An ACL does nothing until applied to an interface with "ip access-group". IN filters packets arriving at the interface; OUT filters packets leaving it. Think from the router\'s perspective: traffic arriving from a LAN is "in" on that LAN interface.',
              tip: 'Only one ACL per interface per direction (in or out). Applying a second one replaces the first.',
            },
          ].map(step => (
            <div key={step.n} style={{ background: T.cardBg, border: T.border, borderRadius: '8px', padding: '1rem', borderTop: `3px solid ${step.color}` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: `${step.color}40`, fontFamily: 'monospace', lineHeight: 1, marginBottom: '0.4rem' }}>{step.n}</div>
              <div style={{ fontWeight: 800, color: T.textPrimary, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{step.title}</div>
              <div style={{ fontSize: '0.75rem', color: T.textSecondary, lineHeight: 1.65, marginBottom: '0.6rem' }}>{step.body}</div>
              <div style={{ fontSize: '0.68rem', color: step.color, background: `${step.color}10`, border: `1px solid ${step.color}30`, borderRadius: '4px', padding: '5px 8px', lineHeight: 1.5 }}>
                {step.tip}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AclLab;
