import { Nav, Footer } from './MarketingPages';

const ACCENT = '#4493f8';

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Nav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 'clamp(5rem,15vw,9rem)', fontWeight: 900, color: `${ACCENT}30`, fontFamily: 'monospace', lineHeight: 1, marginBottom: '1rem' }}>404</div>
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Page not found</h1>
        <p style={{ margin: '0 0 2.5rem', color: '#8b949e', maxWidth: 400, lineHeight: 1.7 }}>
          The page you're looking for doesn't exist. It may have moved, or you may have followed a broken link.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/" style={{ padding: '0.75rem 1.5rem', background: `linear-gradient(135deg,${ACCENT},#2563eb)`, color: '#fff', textDecoration: 'none', borderRadius: 10, fontWeight: 700 }}>Go to homepage</a>
          <a href="/app" style={{ padding: '0.75rem 1.5rem', border: '1px solid #30363d', color: '#e6edf3', textDecoration: 'none', borderRadius: 10, fontWeight: 600 }}>Open app</a>
          <a href="/networking-labs" style={{ padding: '0.75rem 1.5rem', border: '1px solid #30363d', color: '#e6edf3', textDecoration: 'none', borderRadius: 10, fontWeight: 600 }}>Browse labs</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
