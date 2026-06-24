import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

declare global {
  interface Window { adsbygoogle: unknown[]; }
}

export function AdBanner({ slot }: { slot: string }) {
  const { adFree } = useAuth();

  useEffect(() => {
    if (adFree) return;
    try { (window.adsbygoogle = window.adsbygoogle ?? []).push({}); } catch { /* ignore */ }
  }, [adFree]);

  if (adFree) return null;

  return (
    <div style={{ textAlign: 'center', overflow: 'hidden', padding: '6px 0', lineHeight: 0 }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 90 }}
        data-ad-client="ca-pub-REPLACE_WITH_PUBLISHER_ID"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
