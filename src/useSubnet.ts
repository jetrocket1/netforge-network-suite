import { useState, useMemo } from 'react';
import { calculateSubnet, type SubnetResults } from './subnetUtils';

export interface UseSubnetReturn {
  ipAddress: string;
  cidr: number;
  setIpAddress: (ip: string) => void;
  setCidr: (cidr: number) => void;
  results: SubnetResults | null;
  error: string | null;
}

export function useSubnet(): UseSubnetReturn {
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.1');
  const [cidr, setCidr] = useState<number>(24);

  const { results, error } = useMemo(() => {
    const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      return { results: null, error: 'Invalid IP format (e.g., 192.168.1.1)' };
    }
    try {
      const calculated = calculateSubnet(ipAddress, cidr);
      return { results: calculated, error: null };
    } catch {
      return { results: null, error: 'Calculation error' };
    }
  }, [ipAddress, cidr]);

  return { ipAddress, cidr, setIpAddress, setCidr, results, error };
}
