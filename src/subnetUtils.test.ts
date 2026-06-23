import { describe, it, expect } from 'vitest';
import { ipToLong, longToIp, ipToBinaryString, calculateSubnet, isIpInSubnet } from './subnetUtils';

describe('ipToLong', () => {
  it('converts 0.0.0.0 to 0', () => {
    expect(ipToLong('0.0.0.0')).toBe(0);
  });
  it('converts 255.255.255.255 to max uint32', () => {
    expect(ipToLong('255.255.255.255')).toBe(4294967295);
  });
  it('converts 192.168.1.1 correctly', () => {
    expect(ipToLong('192.168.1.1')).toBe(3232235777);
  });
  it('converts 10.0.0.1 correctly', () => {
    expect(ipToLong('10.0.0.1')).toBe(167772161);
  });
  it('converts 172.16.0.1 correctly', () => {
    expect(ipToLong('172.16.0.1')).toBe(2886729729);
  });
});

describe('longToIp', () => {
  it('converts 0 to 0.0.0.0', () => {
    expect(longToIp(0)).toBe('0.0.0.0');
  });
  it('converts max uint32 to 255.255.255.255', () => {
    expect(longToIp(4294967295)).toBe('255.255.255.255');
  });
  it('round-trips with ipToLong for a /24 host', () => {
    const ip = '192.168.100.50';
    expect(longToIp(ipToLong(ip))).toBe(ip);
  });
  it('round-trips with ipToLong for a /8 address', () => {
    const ip = '10.255.0.1';
    expect(longToIp(ipToLong(ip))).toBe(ip);
  });
});

describe('ipToBinaryString', () => {
  it('returns a 32-character string', () => {
    expect(ipToBinaryString('1.2.3.4')).toHaveLength(32);
  });
  it('converts 0.0.0.0 to all zeros', () => {
    expect(ipToBinaryString('0.0.0.0')).toBe('0'.repeat(32));
  });
  it('converts 255.255.255.255 to all ones', () => {
    expect(ipToBinaryString('255.255.255.255')).toBe('1'.repeat(32));
  });
  it('converts 192.0.0.0 to correct binary (class C prefix)', () => {
    expect(ipToBinaryString('192.0.0.0')).toBe('11000000000000000000000000000000');
  });
  it('converts 128.0.0.0 to correct binary', () => {
    expect(ipToBinaryString('128.0.0.0')).toBe('10000000000000000000000000000000');
  });
  it('returns 32 zeros on invalid input', () => {
    expect(ipToBinaryString('bad-input')).toBe('0'.repeat(32));
  });
});

describe('calculateSubnet', () => {
  describe('/24 — typical LAN subnet', () => {
    const result = calculateSubnet('192.168.1.100', 24);
    it('derives network address', () => expect(result.networkAddress).toBe('192.168.1.0'));
    it('derives broadcast address', () => expect(result.broadcastAddress).toBe('192.168.1.255'));
    it('derives subnet mask', () => expect(result.subnetMask).toBe('255.255.255.0'));
    it('derives first usable host', () => expect(result.firstUsableHost).toBe('192.168.1.1'));
    it('derives last usable host', () => expect(result.lastUsableHost).toBe('192.168.1.254'));
    it('counts 254 usable hosts', () => expect(result.totalHosts).toBe(254));
  });

  describe('/16 — class B range', () => {
    const result = calculateSubnet('10.10.5.1', 16);
    it('derives network address', () => expect(result.networkAddress).toBe('10.10.0.0'));
    it('derives broadcast address', () => expect(result.broadcastAddress).toBe('10.10.255.255'));
    it('derives subnet mask', () => expect(result.subnetMask).toBe('255.255.0.0'));
    it('counts 65534 usable hosts', () => expect(result.totalHosts).toBe(65534));
  });

  describe('/8 — class A range', () => {
    const result = calculateSubnet('10.5.5.5', 8);
    it('derives network address', () => expect(result.networkAddress).toBe('10.0.0.0'));
    it('derives broadcast address', () => expect(result.broadcastAddress).toBe('10.255.255.255'));
    it('counts 16,777,214 usable hosts', () => expect(result.totalHosts).toBe(16777214));
  });

  describe('/30 — point-to-point WAN link (4 addresses, 2 hosts)', () => {
    const result = calculateSubnet('192.168.1.4', 30);
    it('derives network address', () => expect(result.networkAddress).toBe('192.168.1.4'));
    it('derives broadcast address', () => expect(result.broadcastAddress).toBe('192.168.1.7'));
    it('derives first usable host', () => expect(result.firstUsableHost).toBe('192.168.1.5'));
    it('derives last usable host', () => expect(result.lastUsableHost).toBe('192.168.1.6'));
    it('counts 2 usable hosts', () => expect(result.totalHosts).toBe(2));
  });

  describe('/31 — RFC 3021 point-to-point (no network/broadcast reserved)', () => {
    const result = calculateSubnet('10.0.0.0', 31);
    it('counts 2 hosts', () => expect(result.totalHosts).toBe(2));
    it('first usable host is network address itself', () => expect(result.firstUsableHost).toBe('10.0.0.0'));
    it('last usable host is broadcast address itself', () => expect(result.lastUsableHost).toBe('10.0.0.1'));
  });

  describe('/32 — host route (single address)', () => {
    const result = calculateSubnet('10.0.0.1', 32);
    it('network address equals the host IP', () => expect(result.networkAddress).toBe('10.0.0.1'));
    it('broadcast address equals the host IP', () => expect(result.broadcastAddress).toBe('10.0.0.1'));
    it('counts 1 host', () => expect(result.totalHosts).toBe(1));
  });

  it('includes the binary string of the input IP', () => {
    const result = calculateSubnet('192.168.0.1', 24);
    expect(result.binaryString).toHaveLength(32);
    expect(result.binaryString).toBe(ipToBinaryString('192.168.0.1'));
  });
});

describe('isIpInSubnet', () => {
  it('returns true for an IP clearly inside the subnet', () => {
    expect(isIpInSubnet('192.168.1.50', '192.168.1.0', 24)).toBe(true);
  });
  it('returns false for an IP clearly outside the subnet', () => {
    expect(isIpInSubnet('192.168.2.1', '192.168.1.0', 24)).toBe(false);
  });
  it('accepts the network address as within the subnet', () => {
    expect(isIpInSubnet('192.168.1.0', '192.168.1.0', 24)).toBe(true);
  });
  it('accepts the broadcast address as within the subnet', () => {
    expect(isIpInSubnet('192.168.1.255', '192.168.1.0', 24)).toBe(true);
  });
  it('works across /8 boundaries', () => {
    expect(isIpInSubnet('10.5.5.5', '10.0.0.0', 8)).toBe(true);
    expect(isIpInSubnet('11.0.0.0', '10.0.0.0', 8)).toBe(false);
  });
  it('handles /32 — only exact match passes', () => {
    expect(isIpInSubnet('10.0.0.1', '10.0.0.1', 32)).toBe(true);
    expect(isIpInSubnet('10.0.0.2', '10.0.0.1', 32)).toBe(false);
  });
  it('returns false safely on invalid IP input', () => {
    expect(isIpInSubnet('not-an-ip', '192.168.1.0', 24)).toBe(false);
  });
});
