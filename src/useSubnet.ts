import { useState, useMemo, useEffect } from 'react';
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
  // 1. On initial load, check the browser URL for existing '?ip=...' or '?cidr=...' parameters
  const [ipAddress, setIpAddress] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('ip') || '192.168.1.1'; // Fallback to default if empty
  });

  const [cidr, setCidr] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const cidrParam = params.get('cidr');
    return cidrParam ? Number(cidrParam) : 24; // Fallback to default if empty
  });

  // 2. Automatically update the browser's address bar whenever the user changes the IP or CIDR
  useEffect(() => {
    const params = new URLSearchParams();
    if (ipAddress) params.set('ip', ipAddress);
    params.set('cidr', cidr.toString());

    // Dynamically update the URL without triggering a full page refresh
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [ipAddress, cidr]);

  // 3. Keep the same optimized calculation engine
  const { results, error } = useMemo(() => {
    const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      return { results: null, error: 'Invalid IP format (e.g., 192.168.1.1)' };
    }
    try {
      const calculated = calculateSubnet(ipAddress, cidr);
      return { results: calculated, error: null };
    } catch (err) {
      return { results: null, error: 'Calculation error' };
    }
  }, [ipAddress, cidr]);

  return { ipAddress, cidr, setIpAddress, setCidr, results, error };
}