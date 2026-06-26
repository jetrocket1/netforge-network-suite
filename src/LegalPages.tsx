import React from 'react';

const ACCENT = '#4493f8';
const LAST_UPDATED = '25 June 2026';

/* ─── Shared layout ─────────────────────────────────────────────── */
function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid #21262d', padding: '0.9rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#010409', zIndex: 10 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${ACCENT},#a855f7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🌐</div>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: '#e6edf3' }}>NetForge</span>
        </a>
        <a href="/" style={{ fontSize: '0.78rem', color: '#8b949e', textDecoration: 'none', border: '1px solid #21262d', padding: '0.35rem 0.85rem', borderRadius: 8, transition: 'color 0.15s' }}>← Back to app</a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</p>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ margin: '0 0 3rem', fontSize: '0.8rem', color: '#6e7681' }}>Last updated: {LAST_UPDATED}</p>
        {children}
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: '2.5rem 0 0.75rem', fontSize: '1.1rem', fontWeight: 800, color: '#e6edf3', paddingBottom: '0.5rem', borderBottom: '1px solid #21262d' }}>{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#8b949e', lineHeight: 1.75 }}>{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li style={{ margin: '0 0 0.4rem', fontSize: '0.88rem', color: '#8b949e', lineHeight: 1.75 }}>{children}</li>;
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: '0 0 1rem', paddingLeft: '1.5rem' }}>{children}</ul>;
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: 10, padding: '0.85rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#c9d1d9', lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

/* ─── Privacy Policy ─────────────────────────────────────────────── */
export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <InfoBox>
        This policy explains what personal data NetForge collects, why we collect it, and your rights under UK GDPR. NetForge is operated as a sole trader based in the United Kingdom.
      </InfoBox>

      <H2>1. Who We Are</H2>
      <P>NetForge ("we", "us", "our") is an online network engineering training platform available at <strong style={{ color: '#e6edf3' }}>netforgens.com</strong>. For data protection queries, contact us at <a href="mailto:admin@netforgens.com" style={{ color: ACCENT }}>admin@netforgens.com</a>.</P>

      <H2>2. What Data We Collect</H2>
      <P><strong style={{ color: '#e6edf3' }}>Account data</strong> — when you sign in with Google, we receive your name, email address, and profile photo via Google OAuth. We store your email and display name in our database (Supabase).</P>
      <P><strong style={{ color: '#e6edf3' }}>Payment data</strong> — if you purchase a Pro or Bundle plan, your payment is processed by <strong style={{ color: '#e6edf3' }}>Stripe</strong>. We never see or store your card details. We receive a record of your purchase status (paid/not paid) from Stripe.</P>
      <P><strong style={{ color: '#e6edf3' }}>Usage data</strong> — we store which labs you have completed in your browser's local storage. This data does not leave your device unless you are signed in, in which case progress may be associated with your account.</P>
      <P><strong style={{ color: '#e6edf3' }}>Technical data</strong> — standard web server logs may record your IP address, browser type, and pages visited. These are retained for security purposes only.</P>

      <H2>3. Why We Use Your Data</H2>
      <Ul>
        <Li>To create and maintain your account</Li>
        <Li>To verify your Pro/Bundle purchase and grant access to premium content</Li>
        <Li>To remember your progress through labs</Li>
        <Li>To respond to support requests</Li>
        <Li>To detect and prevent fraud or abuse</Li>
      </Ul>
      <P>Our legal basis for processing is <strong style={{ color: '#e6edf3' }}>contract</strong> (to deliver the service you signed up for) and <strong style={{ color: '#e6edf3' }}>legitimate interests</strong> (platform security and fraud prevention).</P>

      <H2>4. Third-Party Services</H2>
      <Ul>
        <Li><strong style={{ color: '#e6edf3' }}>Google OAuth</strong> — used for sign-in only. Governed by Google's Privacy Policy.</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Supabase</strong> — our database and authentication backend, hosted in the EU. Data processed under a Data Processing Agreement.</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Stripe</strong> — payment processor. Your card data goes directly to Stripe and is never seen by us. Stripe is PCI-DSS certified.</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Fasthosts</strong> — UK-based web hosting for our static site files.</Li>
      </Ul>
      <P>We do not sell, rent, or share your personal data with advertisers or other third parties.</P>

      <H2>5. Cookies</H2>
      <P>We use minimal cookies. Your theme preference and lab progress are stored in <strong style={{ color: '#e6edf3' }}>localStorage</strong> on your device — not transmitted to our servers. Supabase sets an authentication session cookie when you sign in.</P>
      <P>We do not use advertising cookies or third-party tracking.</P>

      <H2>6. Data Retention</H2>
      <P>We retain your account data for as long as your account is active. If you request deletion, we will remove your personal data from our systems within 30 days, except where we are legally required to retain records (e.g., payment records for HMRC purposes, retained for 6 years).</P>

      <H2>7. Your Rights (UK GDPR)</H2>
      <P>Under UK GDPR you have the right to:</P>
      <Ul>
        <Li><strong style={{ color: '#e6edf3' }}>Access</strong> — request a copy of the data we hold about you</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Rectification</strong> — correct inaccurate data</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Erasure</strong> — request deletion of your data</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Portability</strong> — receive your data in a machine-readable format</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Object</strong> — object to processing based on legitimate interests</Li>
      </Ul>
      <P>To exercise any right, email <a href="mailto:admin@netforgens.com" style={{ color: ACCENT }}>admin@netforgens.com</a>. You also have the right to lodge a complaint with the <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>Information Commissioner's Office (ICO)</a>.</P>

      <H2>8. Security</H2>
      <P>We use HTTPS for all data in transit. Authentication is handled by Supabase and Google, both of which employ industry-standard security practices. We do not store passwords.</P>

      <H2>9. Changes to This Policy</H2>
      <P>We may update this policy from time to time. The date at the top of this page reflects the most recent revision. Continued use of the service after changes constitutes acceptance of the updated policy.</P>

      <H2>10. Contact</H2>
      <P>For any privacy-related queries: <a href="mailto:admin@netforgens.com" style={{ color: ACCENT }}>admin@netforgens.com</a></P>
    </LegalLayout>
  );
}

/* ─── Terms of Service ───────────────────────────────────────────── */
export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service">
      <InfoBox>
        Please read these terms carefully before using NetForge. By creating an account or making a purchase you agree to be bound by them.
      </InfoBox>

      <H2>1. About NetForge</H2>
      <P>NetForge is an online platform providing interactive network engineering and cybersecurity training labs at <strong style={{ color: '#e6edf3' }}>netforgens.com</strong>. It is operated as a sole trader in the United Kingdom.</P>

      <H2>2. Eligibility</H2>
      <P>You must be at least 13 years of age to use NetForge. By using the service you confirm you meet this requirement. If you are under 18, you should have parental or guardian consent before making a purchase.</P>

      <H2>3. Your Account</H2>
      <P>You sign in using Google OAuth. You are responsible for maintaining the security of your Google account. Notify us immediately at <a href="mailto:admin@netforgens.com" style={{ color: ACCENT }}>admin@netforgens.com</a> if you suspect unauthorised access.</P>
      <P>You may not share your account or allow others to access premium content using your credentials.</P>

      <H2>4. Free Content</H2>
      <P>A substantial portion of NetForge's labs and tools are available free of charge without an account. We reserve the right to change which content is free or premium at any time.</P>

      <H2>5. Premium Plans</H2>
      <P>NetForge offers the following one-time purchases:</P>
      <Ul>
        <Li><strong style={{ color: '#e6edf3' }}>Labs Pro</strong> — access to all premium interactive labs, current and future</Li>
        <Li><strong style={{ color: '#e6edf3' }}>Full Bundle</strong> — Labs Pro plus CompTIA N+ and Sec+ exam practice modules</Li>
      </Ul>
      <P>All purchases are <strong style={{ color: '#e6edf3' }}>one-time payments with lifetime access</strong> — there is no recurring subscription. Prices are displayed in GBP and include VAT where applicable.</P>
      <P>Payment is processed securely by Stripe. We do not store your payment card details.</P>

      <H2>6. Refund Policy</H2>
      <P>Under the UK Consumer Contracts Regulations 2013, you have the right to cancel a digital purchase within <strong style={{ color: '#e6edf3' }}>14 days</strong> of purchase for a full refund, provided you have not accessed the premium content.</P>
      <P>By accessing premium labs immediately after purchase, you acknowledge that you are waiving your right to this cancellation period in accordance with Regulation 37 of the Consumer Contracts Regulations.</P>
      <P>To request a refund, contact <a href="mailto:admin@netforgens.com" style={{ color: ACCENT }}>admin@netforgens.com</a> within 14 days of purchase.</P>

      <H2>7. Acceptable Use</H2>
      <P>You agree not to:</P>
      <Ul>
        <Li>Share, redistribute, or resell access to premium content</Li>
        <Li>Attempt to circumvent premium access controls (e.g., via browser developer tools)</Li>
        <Li>Use the platform in any way that violates applicable laws</Li>
        <Li>Scrape, copy, or reproduce lab content for commercial purposes</Li>
        <Li>Interfere with the operation of the platform or its infrastructure</Li>
      </Ul>
      <P>Violation of these terms may result in your account being suspended or terminated without refund.</P>

      <H2>8. Intellectual Property</H2>
      <P>All lab content, diagrams, simulations, and educational material on NetForge are our intellectual property or used with permission. You may use the content for your personal study only. You may not republish, sell, or create derivative works without written permission.</P>

      <H2>9. Disclaimer of Warranties</H2>
      <P>NetForge is provided "as is" without warranty of any kind. We do not guarantee that the platform will be error-free, uninterrupted, or that lab content reflects the most current exam objectives. While we strive for accuracy, you should not rely solely on NetForge for exam preparation.</P>

      <H2>10. Limitation of Liability</H2>
      <P>To the maximum extent permitted by UK law, NetForge shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability for any claim shall not exceed the amount you paid for your purchase.</P>
      <P>Nothing in these terms limits liability for death or personal injury caused by negligence, or for fraudulent misrepresentation.</P>

      <H2>11. Changes to the Service</H2>
      <P>We may add, modify, or remove features at any time. We will not remove access to content categories that were included in your purchase without offering a comparable replacement or refund.</P>

      <H2>12. Governing Law</H2>
      <P>These terms are governed by the laws of <strong style={{ color: '#e6edf3' }}>England and Wales</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</P>

      <H2>13. Contact</H2>
      <P>For any queries regarding these terms: <a href="mailto:admin@netforgens.com" style={{ color: ACCENT }}>admin@netforgens.com</a></P>

      {/* Footer links */}
      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #21262d', display: 'flex', gap: '1rem', fontSize: '0.78rem' }}>
        <a href="/privacy" style={{ color: ACCENT, textDecoration: 'none' }}>Privacy Policy</a>
        <span style={{ color: '#21262d' }}>·</span>
        <a href="/" style={{ color: '#6e7681', textDecoration: 'none' }}>← Back to NetForge</a>
      </div>
    </LegalLayout>
  );
}
