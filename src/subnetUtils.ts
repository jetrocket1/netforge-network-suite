export interface SubnetResults {
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  firstUsableHost: string;
  lastUsableHost: string;
  totalHosts: number;
  binaryString: string;
}

export function ipToLong(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

export function longToIp(long: number): string {
  return [(long >>> 24) & 255, (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.');
}

export function ipToBinaryString(ipStr: string): string {
  try {
    const long = ipToLong(ipStr);
    return (long >>> 0).toString(2).padStart(32, '0');
  } catch {
    return '0'.repeat(32);
  }
}

export function calculateSubnet(ipStr: string, cidr: number): SubnetResults {
  const ipLong = ipToLong(ipStr);
  const maskLong = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  
  const networkLong = (ipLong & maskLong) >>> 0;
  const broadcastLong = (networkLong | ~maskLong) >>> 0;
  
  const isSpecialSubnet = cidr >= 31;
  const totalHosts = cidr === 32 ? 1 : cidr === 31 ? 2 : Math.pow(2, 32 - cidr) - 2;

  return {
    subnetMask: longToIp(maskLong),
    networkAddress: longToIp(networkLong),
    broadcastAddress: longToIp(broadcastLong),
    firstUsableHost: longToIp(isSpecialSubnet ? networkLong : networkLong + 1),
    lastUsableHost: longToIp(isSpecialSubnet ? broadcastLong : broadcastLong - 1),
    totalHosts,
    binaryString: ipToBinaryString(ipStr),
  };
}

export function isIpInSubnet(ipToCheck: string, networkAddress: string, cidr: number): boolean {
  try {
    const checkLong = ipToLong(ipToCheck);
    const networkLong = ipToLong(networkAddress);
    const maskLong = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    return (checkLong & maskLong) === (networkLong & maskLong);
  } catch {
    return false;
  }
}