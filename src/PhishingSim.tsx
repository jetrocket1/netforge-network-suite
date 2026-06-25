import React, { useState } from 'react';
import { getLabTheme } from './labTheme';
import { LabEduPanel, type EduCard } from './LabEduPanel';

/* ─── Types ─────────────────────────────────────────────────────── */
type PhishTab = 'inbox' | 'url' | 'score';

interface RedFlag {
  id: string;
  label: string;
  explanation: string;
  severity: 'critical' | 'high' | 'medium';
}

interface BodyPart {
  text: string;
  flagId?: string;
  mono?: boolean;
}

interface PhishEmail {
  id: number;
  isPhishing: boolean;
  category: string;
  from: string;
  fromAddr: string;
  replyTo?: string;
  to: string;
  subject: string;
  date: string;
  body: BodyPart[];
  flags: RedFlag[];
}

interface UrlFlag {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'danger';
  note: string;
}

/* ─── Email Data ─────────────────────────────────────────────────── */
const EMAILS: PhishEmail[] = [
  {
    id: 1,
    isPhishing: true,
    category: 'Mass Phishing',
    from: 'PayPal Security',
    fromAddr: 'security-alert@paypal-secure.net',
    to: 'you@example.com',
    subject: '⚠️ Your PayPal Account Has Been Limited',
    date: 'Wed, 18 Jun 2025 09:14:32 +0000',
    body: [
      { text: 'Dear PayPal Customer,', flagId: 'pp-generic' },
      { text: '\n\nWe have detected unusual activity on your account. Your access has been limited and you must verify your identity within ' },
      { text: '24 hours or your account will be permanently suspended', flagId: 'pp-urgency' },
      { text: '.\n\nPlease click the link below to restore your account access immediately:\n\n' },
      { text: 'https://paypal-secure.net/verify/account?token=cx8f2a1', flagId: 'pp-link', mono: true },
      { text: '\n\nIf you do not verify within 24 hours, your account will be permanently closed and any pending funds held for 180 days.\n\nThank you for being a valued PayPal customer.\n\nPayPal Security Team' },
    ],
    flags: [
      { id: 'pp-domain', label: 'Spoofed sender domain', explanation: 'The sending address uses "paypal-secure.net" — not "paypal.com". Attackers register lookalike domains to impersonate trusted brands. The real PayPal always sends from @paypal.com.', severity: 'critical' },
      { id: 'pp-generic', label: 'Generic greeting', explanation: '"Dear PayPal Customer" is a tell-tale sign of mass phishing. Legitimate PayPal emails always address you by your registered first and last name.', severity: 'medium' },
      { id: 'pp-urgency', label: 'Artificial urgency', explanation: 'Threatening permanent suspension within 24 hours is a classic social engineering technique. The pressure is designed to make you act without thinking critically.', severity: 'high' },
      { id: 'pp-link', label: 'Malicious link', explanation: 'The hyperlink points to "paypal-secure.net" — the attacker\'s server. Hovering (or long-pressing on mobile) the link reveals the true destination before you click.', severity: 'critical' },
    ],
  },
  {
    id: 2,
    isPhishing: true,
    category: 'Internal Impersonation',
    from: 'IT Helpdesk',
    fromAddr: 'it-support@corp-helpdesk.support',
    to: 'you@example.com',
    subject: 'ACTION REQUIRED: Password Expires in 24 Hours',
    date: 'Thu, 19 Jun 2025 07:52:11 +0000',
    body: [
      { text: 'Hello ' },
      { text: '[Employee]', flagId: 'it-template', mono: true },
      { text: ',\n\nThis is an automated notification from IT Helpdesk. Your network password will expire in ' },
      { text: '24 hours', flagId: 'it-urgency' },
      { text: '. Failure to reset your password will result in you being ' },
      { text: 'locked out of all systems', flagId: 'it-vague' },
      { text: ' including email, VPN, and Slack.\n\nClick the link below to reset your password now. This link expires in 60 minutes:\n\n' },
      { text: 'https://corp-helpdesk.support/reset?emp=7f2a9c', flagId: 'it-domain', mono: true },
      { text: '\n\nIf you have already reset your password, please disregard this message.\n\nKind regards,\nIT Helpdesk\nCorporate IT Support' },
    ],
    flags: [
      { id: 'it-domain', label: 'External domain impersonating IT', explanation: '"corp-helpdesk.support" is an external domain — not your company\'s internal domain. Legitimate internal IT systems always use your company\'s own domain (e.g., @yourcompany.com), never a third-party .support domain.', severity: 'critical' },
      { id: 'it-template', label: 'Unfilled mail-merge placeholder', explanation: 'The greeting contains "[Employee]" — a template placeholder that was never filled in. Automated corporate systems always personalise emails with your actual name. This is a strong indicator of a mass phishing campaign.', severity: 'high' },
      { id: 'it-urgency', label: 'Double urgency escalation', explanation: 'The email stacks two urgency timers: 24 hours until expiry AND 60 minutes until the reset link expires. Layering time pressure is a manipulation tactic designed to prevent you from pausing to verify.', severity: 'high' },
      { id: 'it-vague', label: 'Vague, sweeping threat', explanation: '"Locked out of all systems" is deliberately vague and alarming. Real IT password reset emails specify only the systems affected and provide a helpdesk phone number for verification.', severity: 'medium' },
    ],
  },
  {
    id: 3,
    isPhishing: true,
    category: 'BEC / CEO Fraud',
    from: 'James Morrison, CEO',
    fromAddr: 'j.morrison@netforge-corp.co',
    replyTo: 'james.morrison.ceo2024@gmail.com',
    to: 'you@example.com',
    subject: 'Confidential – Urgent Wire Transfer',
    date: 'Fri, 20 Jun 2025 11:03:44 +0000',
    body: [
      { text: 'Hi,\n\nI need you to process an urgent wire transfer today. I\'m in back-to-back board meetings and ' },
      { text: 'cannot take any calls until this evening', flagId: 'bec-calls' },
      { text: '.\n\nWe are finalising a time-sensitive acquisition and the transfer needs to clear before market close. The legal team has confirmed the details are correct.\n\nAmount: $142,500\nBeneficiary: Alverton Capital Partners\nAccount: 8821-004-7731\nSort code: 20-44-09\n\nPlease process immediately and ' },
      { text: 'do not discuss this with anyone else in the office', flagId: 'bec-secrecy' },
      { text: ' — this is confidential until the deal is announced next week.\n\nIf you need to reply, use ' },
      { text: 'james.morrison.ceo2024@gmail.com', flagId: 'bec-replyto', mono: true },
      { text: ' (I\'m not accessing my work email today).\n\nJames Morrison\nCEO, NetForge' },
    ],
    flags: [
      { id: 'bec-domain', label: 'CEO lookalike domain (.co not .com)', explanation: 'The sender\'s address is "netforge-corp.co" — not "netforge-corp.com". The .co TLD is a common BEC trick. At a glance the domain looks legitimate, but .co (Colombia\'s country code) is frequently used for fraud.', severity: 'critical' },
      { id: 'bec-replyto', label: 'Reply-To is a personal Gmail', explanation: 'The email asks you to reply to a Gmail address. Legitimate CEO communications always use corporate email. The attacker owns the Gmail address and set it as Reply-To so your response bypasses the spoofed corporate domain.', severity: 'critical' },
      { id: 'bec-calls', label: '"Can\'t take calls" blocks verification', explanation: 'Pre-emptively blocking the standard verification step (a phone call to confirm a wire transfer) is a defining BEC tactic. Any urgent financial request that discourages calling the requester should be treated as fraudulent.', severity: 'high' },
      { id: 'bec-secrecy', label: 'Secrecy request bypasses controls', explanation: 'Instructing you not to discuss the transfer with colleagues is designed to prevent the internal controls (e.g., dual authorisation, finance team review) that would normally catch fraudulent requests.', severity: 'high' },
    ],
  },
  {
    id: 4,
    isPhishing: true,
    category: 'Delivery Phishing',
    from: 'FedEx Express',
    fromAddr: 'track@fedex-delivery-update.com',
    to: 'you@example.com',
    subject: 'Package #FX82736 – Delivery Attempt Failed',
    date: 'Mon, 23 Jun 2025 14:27:09 +0000',
    body: [
      { text: 'Dear Customer,', flagId: 'fedex-generic' },
      { text: '\n\nWe attempted to deliver your package ' },
      { text: '#FX82736', mono: true },
      { text: ' today but nobody was available to receive it.\n\nTo reschedule your delivery, a re-delivery fee of ' },
      { text: '£1.99', flagId: 'fedex-payment' },
      { text: ' is required to cover handling costs. Payment must be received within ' },
      { text: '3 days or your package will be returned to the sender', flagId: 'fedex-threat' },
      { text: '.\n\nPay your re-delivery fee here:\n\n' },
      { text: 'https://fedex-delivery-update.com/redeliver?pkg=FX82736&fee=1.99', flagId: 'fedex-domain', mono: true },
      { text: '\n\nThank you for choosing FedEx.\n\nFedEx Customer Services' },
    ],
    flags: [
      { id: 'fedex-domain', label: 'Fake FedEx domain', explanation: 'The sender and link use "fedex-delivery-update.com" — not "fedex.com". FedEx never sends from third-party domains. Always navigate to fedex.com directly and enter your tracking number manually.', severity: 'critical' },
      { id: 'fedex-payment', label: 'FedEx never charges re-delivery fees', explanation: 'FedEx does not charge customers a re-delivery fee to rebook a missed delivery. This is a payment credential harvesting attack — the £1.99 is trivial but the real goal is capturing your card details.', severity: 'critical' },
      { id: 'fedex-generic', label: 'Generic "Dear Customer" greeting', explanation: 'FedEx emails reference your actual name and the full tracking number with verified shipment details. A generic salutation on a delivery notification is a red flag for a mass phishing campaign.', severity: 'medium' },
      { id: 'fedex-threat', label: '3-day return threat', explanation: 'The 3-day return window creates pressure to pay quickly. Legitimate failed delivery notices give you multiple free rescheduling options online, by phone, or at a pickup location.', severity: 'high' },
    ],
  },
  {
    id: 5,
    isPhishing: false,
    category: 'Legitimate',
    from: 'Barclays',
    fromAddr: 'notifications@emails.barclays.co.uk',
    to: 'john.smith@example.com',
    subject: 'Your October statement is now available',
    date: 'Thu, 24 Jun 2025 08:00:01 +0000',
    body: [
      { text: 'Dear John Smith,\n\nYour Barclays account statement for October 2025 is now available to view in Online Banking.\n\nAccount ending: ' },
      { text: '****4821', mono: true },
      { text: '\nStatement date: 31 October 2025\n\nYou can view and download your statement by logging in to Online Banking at barclays.co.uk or via the Barclays app.\n\nImportant: ' },
      { text: 'We will never ask for your PIN, full password, or card details by email.' },
      { text: '\n\nIf you have questions, please call us on 0345 734 5345 (or +44 1624 684 444 from overseas).\n\nYours sincerely,\nBarclays Bank UK PLC\nRegistered in England. Registered No. 9740322.\n1 Churchill Place, London, E14 5HP' },
    ],
    flags: [],
  },
];

/* ─── URL Preset Pills ───────────────────────────────────────────── */
const URL_PRESETS = [
  { label: 'PayPal Phish',   url: 'https://paypal-secure.login.com/verify?token=a7f2c9b1' },
  { label: 'Microsoft Phish',url: 'http://microsofft.sharepoint-online.net/login/reset' },
  { label: 'Legitimate',     url: 'https://www.barclays.co.uk/online-banking/login/' },
  { label: 'Amazon Phish',   url: 'https://amazon-security-alert.club/account/suspended/verify' },
  { label: 'Homograph',      url: 'https://g00gle.com/accounts/signin' },
];

/* ─── URL Analyser ───────────────────────────────────────────────── */
const SUSPICIOUS_TLDS = ['.club', '.xyz', '.top', '.icu', '.gq', '.tk', '.ml', '.cf', '.ga', '.pw', '.click', '.link', '.work'];
const SENSITIVE_PATHS = ['verify', 'login', 'signin', 'reset', 'suspended', 'account', 'secure', 'update', 'confirm', 'restore'];
const BRANDS = ['paypal', 'microsoft', 'amazon', 'google', 'apple', 'netflix', 'barclays', 'fedex', 'dhl', 'ebay', 'facebook', 'instagram', 'linkedin'];

function analyseUrl(raw: string): UrlFlag[] | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  const proto   = parsed.protocol.replace(':', '');
  const host    = parsed.hostname.toLowerCase();
  const parts   = host.split('.');
  const tld     = '.' + parts.slice(-1)[0];
  const domain  = parts.length >= 2 ? parts.slice(-2).join('.') : host;
  const subdom  = parts.length > 2  ? parts.slice(0, -2).join('.') : '';
  const path    = parsed.pathname;
  const params  = parsed.search;

  const results: UrlFlag[] = [];

  // Protocol
  if (proto === 'https') {
    results.push({ label: 'Protocol', value: proto, status: 'ok', note: 'HTTPS — traffic is encrypted in transit. Note: HTTPS does not mean the site is legitimate, only that the connection is encrypted.' });
  } else {
    results.push({ label: 'Protocol', value: proto, status: 'danger', note: 'HTTP — unencrypted connection. Any data you submit (passwords, card numbers) is sent in plaintext. Legitimate login pages always use HTTPS.' });
  }

  // Domain
  const brandInDomain = BRANDS.find(b => domain.includes(b) && domain !== b + '.com' && domain !== b + '.co.uk');
  const homograph = /[0-9]/.test(domain) && BRANDS.some(b => {
    const digitless = domain.replace(/0/g,'o').replace(/1/g,'l').replace(/3/g,'e');
    return digitless.includes(b);
  });
  const suspTld = SUSPICIOUS_TLDS.some(t => host.endsWith(t));

  if (homograph) {
    results.push({ label: 'Domain', value: domain, status: 'danger', note: 'Homograph attack detected — digits are substituted for similar-looking letters (e.g., "0" for "o", "1" for "l"). This makes the domain look like a trusted brand at a glance.' });
  } else if (brandInDomain) {
    results.push({ label: 'Domain', value: domain, status: 'danger', note: `Brand name "${brandInDomain}" found in a non-official domain. Attackers register domains that include brand names to deceive victims (e.g., "paypal-secure.net", "amazon-security-alert.club").` });
  } else if (suspTld) {
    results.push({ label: 'Domain', value: domain, status: 'warn', note: `The TLD "${tld}" is frequently abused for phishing campaigns due to low registration cost. Legitimate major services very rarely use these TLDs.` });
  } else {
    results.push({ label: 'Domain', value: domain, status: 'ok', note: 'Domain does not contain obvious brand impersonation or suspicious TLD. Always verify the full domain matches the official organisation website.' });
  }

  // Subdomain
  const brandInSub = subdom && BRANDS.some(b => subdom.includes(b));
  if (!subdom) {
    results.push({ label: 'Subdomain', value: '(none)', status: 'ok', note: 'No subdomain present. A missing subdomain is neutral and common for direct domain access.' });
  } else if (brandInSub) {
    results.push({ label: 'Subdomain', value: subdom, status: 'danger', note: `Brand name found in subdomain. Attackers put a trusted brand name in the subdomain (e.g., "paypal.attacker.com") so casual inspection suggests legitimacy. Always read the domain from right to left: TLD → domain → subdomain.` });
  } else if (subdom === 'www') {
    results.push({ label: 'Subdomain', value: subdom, status: 'ok', note: '"www" subdomain is standard for web servers. No concerns here.' });
  } else {
    results.push({ label: 'Subdomain', value: subdom, status: 'warn', note: `Subdomain "${subdom}" present. Non-www subdomains are legitimate for large organisations (e.g., "mail.domain.com") but warrant checking.` });
  }

  // Path
  const sensitivePath = SENSITIVE_PATHS.find(k => path.toLowerCase().includes(k));
  if (sensitivePath) {
    results.push({ label: 'Path', value: path, status: 'warn', note: `Path contains sensitive keyword "${sensitivePath}". Combined with other warning signs, credential-harvesting pages commonly use these paths to mimic legitimate login/verification flows.` });
  } else {
    results.push({ label: 'Path', value: path || '/', status: 'ok', note: 'Path does not contain obviously suspicious keywords. Context-dependent — always evaluate alongside other factors.' });
  }

  // Parameters
  if (!params) {
    results.push({ label: 'Parameters', value: '(none)', status: 'ok', note: 'No URL parameters present.' });
  } else {
    const hasToken = /token|session|id|key|auth/i.test(params);
    if (hasToken) {
      results.push({ label: 'Parameters', value: params, status: 'warn', note: 'URL contains tracking/token parameters. These are used by phishing kits to track victims, pre-fill forms, or invalidate the link after one use (to hinder analysis).' });
    } else {
      results.push({ label: 'Parameters', value: params, status: 'ok', note: 'URL parameters present but no obvious credential/session tokens detected.' });
    }
  }

  return results;
}

/* ─── Score Calculation ─────────────────────────────────────────── */
function calcScore(
  verdicts: Record<number, 'phishing' | 'legit' | null>,
  foundFlags: Set<string>,
) {
  let score = 0;
  let maxScore = 0;
  let correctVerdicts = 0;
  let flagsFound = 0;

  for (const email of EMAILS) {
    maxScore += 15;
    maxScore += email.flags.length * 8;
    const verdict = verdicts[email.id];
    if (verdict !== null && verdict !== undefined) {
      const correct = email.isPhishing ? verdict === 'phishing' : verdict === 'legit';
      if (correct) { score += 15; correctVerdicts++; }
    }
    for (const flag of email.flags) {
      if (foundFlags.has(`${email.id}-${flag.id}`)) { score += 8; flagsFound++; }
    }
  }

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const grade = pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : pct >= 40 ? 'D' : 'F';
  return { score, maxScore, correctVerdicts, flagsFound, pct, grade };
}

/* ─── Edu Cards ─────────────────────────────────────────────────── */
const PHISH_EDU: EduCard[] = [
  {
    type: 'exam',
    title: 'Phishing vs Spear Phishing vs Whaling',
    body: 'Phishing: mass, untargeted emails sent to thousands of recipients (e.g., fake PayPal alerts). Spear Phishing: targeted attack using OSINT reconnaissance — attacker knows your name, employer, colleagues, or recent activity. Whaling: spear phishing aimed at C-suite executives or high-value targets. Exam tip: spear phishing always implies prior OSINT reconnaissance — that is what makes it targeted.',
  },
  {
    type: 'exam',
    title: 'Business Email Compromise (BEC)',
    body: 'BEC losses exceed ransomware globally (FBI IC3 reports). Key patterns: CEO fraud (impersonating executives to authorise wire transfers), vendor impersonation (faking a supplier to redirect payments), and attorney impersonation. Defence: callback verification to a known, pre-stored phone number — never a number provided in the email. Dual authorisation for transfers over a set threshold is the gold standard.',
  },
  {
    type: 'config',
    title: 'Email Authentication: SPF, DKIM, DMARC',
    body: 'SPF (Sender Policy Framework): DNS TXT record listing authorised sending IP addresses for a domain. DKIM (DomainKeys Identified Mail): cryptographic signature in email headers proving the message was not altered in transit. DMARC (Domain-based Message Authentication): policy telling receiving servers what to do when SPF/DKIM fail — none (monitor), quarantine (spam folder), or reject (drop). p=reject is the gold standard.',
    code: `; SPF record — only Google Workspace servers may send
v=spf1 include:_spf.google.com ~all

; DMARC record — reject unauthenticated mail + weekly reports
_dmarc  IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@corp.com; pct=100; adkim=s; aspf=s"

; Note: without DMARC p=reject, attackers can still spoof
; your domain even with SPF + DKIM configured`,
  },
  {
    type: 'gotcha',
    title: 'Lookalike Domains & Homograph Attacks',
    body: 'Digit substitution: paypa1.com (1 not l), g00gle.com (zeros not O). Word addition: paypal-secure.net, apple-support-billing.com. Subdomain trick: paypal.attacker.com — reads left to right as PayPal but the actual domain is attacker.com. Unicode homograph: using Cyrillic "а" (U+0430) instead of Latin "a" — visually identical in most fonts. Always check the full domain in the browser address bar, never just the display name in email.',
  },
  {
    type: 'gotcha',
    title: 'Display Name ≠ Sender Address',
    body: 'Email clients display the friendly "From" name prominently and hide the real sender address. On mobile, only the display name is shown by default — the address is buried one tap away. Attackers exploit this by setting the display name to "PayPal Security" while the actual address is attacker@phish.ru. Always expand the sender details to see the full email address before acting on any security-sensitive email.',
  },
  {
    type: 'realworld',
    title: 'The $47M BEC Wire Transfer — FACC (2016)',
    body: 'Austrian aerospace manufacturer FACC lost €50.6M (~$54M USD) in a single BEC attack. The attacker spoofed the CEO\'s email and instructed an employee in the finance department to wire funds for a fake acquisition project. No callback verification was made. The transfer cleared before fraud was detected. The CEO and CFO were subsequently dismissed. This case remains one of the largest single-transaction BEC losses on record and is referenced in CompTIA Security+ curriculum as a defining BEC case study.',
  },
];

/* ─── Severity badge helper ─────────────────────────────────────── */
function SevBadge({ sev }: { sev: 'critical' | 'high' | 'medium' }) {
  const cfg = sev === 'critical'
    ? { color: '#f85149', bg: 'rgba(248,81,73,0.14)', label: 'CRITICAL' }
    : sev === 'high'
    ? { color: '#f0883e', bg: 'rgba(240,136,62,0.14)', label: 'HIGH' }
    : { color: '#d29922', bg: 'rgba(210,153,34,0.14)', label: 'MEDIUM' };
  return (
    <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
      {cfg.label}
    </span>
  );
}

/* ─── URL Status badge ──────────────────────────────────────────── */
function UrlBadge({ status }: { status: 'ok' | 'warn' | 'danger' }) {
  if (status === 'ok')     return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3fb950' }}>OK</span>;
  if (status === 'warn')   return <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d29922' }}>WARN</span>;
  return                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f85149' }}>DANGER</span>;
}

function urlStatusIcon(status: 'ok' | 'warn' | 'danger') {
  if (status === 'ok')     return '✅';
  if (status === 'warn')   return '⚠️';
  return '🚨';
}

/* ─── Component ─────────────────────────────────────────────────── */
export interface PhishingSimProps {
  isDarkMode?: boolean;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export const PhishingSim: React.FC<PhishingSimProps> = ({ isDarkMode = true }) => {
  const T = getLabTheme(isDarkMode);

  /* ─ State ─ */
  const [tab, setTab]               = useState<PhishTab>('inbox');
  const [sel, setSel]               = useState(0);
  const [verdicts, setVerdicts]     = useState<Record<number, 'phishing' | 'legit' | null>>({});
  const [foundFlags, setFoundFlags] = useState<Set<string>>(new Set());
  const [revealed, setRevealed]     = useState<Set<number>>(new Set());
  const [urlInput, setUrlInput]     = useState('');
  const [urlResult, setUrlResult]   = useState<UrlFlag[] | null>(null);
  const [urlError, setUrlError]     = useState(false);
  const [activeFlag, setActiveFlag] = useState<string | null>(null);

  const email = EMAILS[sel];
  const verdict = verdicts[email.id] ?? null;
  const isRevealed = revealed.has(email.id);

  /* ─ Handlers ─ */
  const clickFlag = (flagId: string) => {
    const key = `${email.id}-${flagId}`;
    setFoundFlags(prev => new Set([...prev, key]));
    setActiveFlag(flagId);
  };

  const submitVerdict = (v: 'phishing' | 'legit') => {
    setVerdicts(prev => ({ ...prev, [email.id]: v }));
    setRevealed(prev => new Set([...prev, email.id]));
    setActiveFlag(null);
  };

  const runUrlAnalyse = () => {
    const raw = urlInput.trim();
    if (!raw) return;
    const result = analyseUrl(raw);
    if (!result) { setUrlError(true); setUrlResult(null); }
    else         { setUrlError(false); setUrlResult(result); }
  };

  const pickPreset = (url: string) => {
    setUrlInput(url);
    const result = analyseUrl(url);
    setUrlError(!result);
    setUrlResult(result ?? null);
  };

  const scoreData = calcScore(verdicts, foundFlags);
  const totalFlags = EMAILS.reduce((acc, e) => acc + e.flags.length, 0);
  const judgedCount = Object.values(verdicts).filter(v => v !== null).length;

  /* ─ Shared input style ─ */
  const inputS: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem',
    borderRadius: 8, border: `1px solid ${T.borderColor}`,
    background: T.insetBg, color: T.textPrimary, outline: 'none',
    fontSize: '0.82rem', fontFamily: 'inherit',
  };

  /* ─── Render ─── */
  return (
    <div style={{ background: T.cardBg, borderRadius: 20, border: `1px solid ${T.borderColor}`, overflow: 'hidden', fontFamily: 'system-ui,-apple-system,sans-serif', color: T.textPrimary }}>
      <style>{`
        @keyframes phish-fade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes phish-pop  { 0%{transform:scale(0.95);opacity:0} 100%{transform:scale(1);opacity:1} }
        .phish-flag-btn:hover { filter:brightness(1.15); }
        .phish-email-row:hover { background: rgba(248,81,73,0.06) !important; }
      `}</style>

      {/* ── Rainbow top bar ── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#f85149,#f0883e,#d29922,#4493f8)' }} />

      {/* ── Header ── */}
      <div style={{ padding: '1.75rem 2rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#f85149,#f0883e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🎣</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Phishing Simulation Lab</h2>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: 'rgba(248,81,73,0.12)', color: '#f85149', border: '1px solid rgba(248,81,73,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Advanced</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: 'rgba(210,153,34,0.15)', color: '#d29922', border: '1px solid rgba(210,153,34,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PRO Lab</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: T.textSecondary, lineHeight: 1.55 }}>Identify phishing emails, discover red flags, analyse suspicious URLs, and learn to spot social engineering attacks before they succeed.</p>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: '1.5rem', borderTop: `1px solid ${T.borderColor}`, paddingTop: '0.9rem', paddingBottom: '0.9rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Emails analysed', value: `${judgedCount}/${EMAILS.length}`,         color: '#f85149' },
            { label: 'Red flags found',  value: `${foundFlags.size}/${totalFlags}`,         color: '#f0883e' },
            { label: 'Current score',    value: `${scoreData.score}/${scoreData.maxScore}`, color: '#d29922' },
            { label: 'Grade',            value: scoreData.pct > 0 ? scoreData.grade : '—', color: '#4493f8' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: '0.62rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {([['inbox', '📧 Email Inbox'], ['url', '🔗 URL Analyser'], ['score', '📊 Score']] as [PhishTab, string][]).map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} style={{ padding: '0.55rem 1rem', border: 'none', borderBottom: tab === id ? '2px solid #f85149' : '2px solid transparent', background: 'none', color: tab === id ? '#f85149' : T.textMuted, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'color 0.15s' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '1.5rem 2rem 2rem' }}>

        {/* ══ INBOX TAB ══ */}
        {tab === 'inbox' && (
          <div style={{ animation: 'phish-fade 0.2s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.25rem' }}>

              {/* Email list sidebar */}
              <div style={{ background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '0.65rem 0.85rem', borderBottom: `1px solid ${T.borderColor}`, fontSize: '0.62rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Inbox — {EMAILS.length} messages</div>
                {EMAILS.map((em, idx) => {
                  const v = verdicts[em.id] ?? null;
                  const isSelected = idx === sel;
                  return (
                    <div
                      key={em.id}
                      className="phish-email-row"
                      onClick={() => { setSel(idx); setActiveFlag(null); }}
                      style={{ padding: '0.65rem 0.85rem', cursor: 'pointer', borderBottom: `1px solid ${T.borderColor}`, background: isSelected ? 'rgba(248,81,73,0.09)' : 'transparent', borderLeft: isSelected ? '3px solid #f85149' : '3px solid transparent', transition: 'background 0.12s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{em.from}</span>
                        {v !== null && (
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 5px', borderRadius: 10, background: v === 'phishing' ? 'rgba(248,81,73,0.15)' : 'rgba(63,185,80,0.15)', color: v === 'phishing' ? '#f85149' : '#3fb950', flexShrink: 0 }}>
                            {v === 'phishing' ? '🎣' : '✅'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: T.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.subject}</div>
                      <div style={{ fontSize: '0.6rem', color: T.textMuted, marginTop: 2 }}>{em.category}</div>
                    </div>
                  );
                })}
              </div>

              {/* Email viewer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

                {/* Email header card */}
                <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.borderColor}` }}>
                  <div style={{ background: '#1a1a2e', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#8b949e', marginLeft: 2 }}>email — message headers</span>
                  </div>
                  <div style={{ background: '#0d1117', padding: '0.85rem 1rem' }}>
                    {[
                      { label: 'From',     value: `${email.from} <${email.fromAddr}>` },
                      ...(email.replyTo ? [{ label: 'Reply-To', value: email.replyTo }] : []),
                      { label: 'To',       value: email.to },
                      { label: 'Subject',  value: email.subject },
                      { label: 'Date',     value: email.date },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        <span style={{ color: '#8b949e', minWidth: 70, flexShrink: 0 }}>{row.label}:</span>
                        <span style={{ color: row.label === 'Reply-To' ? '#f85149' : row.label === 'From' && email.isPhishing ? '#f0883e' : '#e6edf3', wordBreak: 'break-all' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Email body */}
                <div style={{ background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 14, padding: '1rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Message Body</div>
                  <div style={{ fontSize: '0.82rem', color: T.textPrimary, lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: email.body.some(p => p.mono) ? 'inherit' : 'inherit' }}>
                    {email.body.map((part, i) => {
                      if (part.flagId) {
                        const key = `${email.id}-${part.flagId}`;
                        const isFound = foundFlags.has(key);
                        const isActive = activeFlag === part.flagId;
                        return (
                          <mark
                            key={i}
                            onClick={() => clickFlag(part.flagId!)}
                            style={{
                              background: isActive ? 'rgba(248,81,73,0.25)' : isFound ? 'rgba(248,81,73,0.12)' : 'rgba(240,136,62,0.12)',
                              color: isActive ? '#f85149' : isFound ? '#f0883e' : T.textPrimary,
                              borderRadius: 4,
                              padding: '1px 3px',
                              cursor: 'pointer',
                              border: `1px solid ${isActive ? 'rgba(248,81,73,0.5)' : isFound ? 'rgba(248,81,73,0.3)' : 'rgba(240,136,62,0.3)'}`,
                              fontFamily: part.mono ? "'Fira Code',monospace" : 'inherit',
                              fontSize: part.mono ? '0.75rem' : 'inherit',
                              textDecoration: 'none',
                              transition: 'all 0.15s',
                            }}
                          >
                            {part.text}
                          </mark>
                        );
                      }
                      return (
                        <span key={i} style={{ fontFamily: part.mono ? "'Fira Code',monospace" : 'inherit', fontSize: part.mono ? '0.75rem' : 'inherit' }}>
                          {part.text}
                        </span>
                      );
                    })}
                  </div>

                  {/* Flag discovery bar */}
                  {email.flags.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${T.borderColor}` }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Red Flag Discovery</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {email.flags.map(flag => {
                          const key = `${email.id}-${flag.id}`;
                          const found = foundFlags.has(key);
                          const isActive = activeFlag === flag.id;
                          return (
                            <button
                              key={flag.id}
                              type="button"
                              className="phish-flag-btn"
                              onClick={() => { clickFlag(flag.id); }}
                              style={{
                                padding: '4px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                background: found ? (isActive ? 'rgba(248,81,73,0.2)' : 'rgba(63,185,80,0.12)') : T.insetBg,
                                color: found ? (isActive ? '#f85149' : '#3fb950') : T.textMuted,
                                border: `1px solid ${found ? (isActive ? 'rgba(248,81,73,0.5)' : 'rgba(63,185,80,0.4)') : T.borderColor}`,
                              }}
                            >
                              {found ? '✓' : '○'} {flag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active flag explanation panel */}
                  {activeFlag && (() => {
                    const flag = email.flags.find(f => f.id === activeFlag);
                    if (!flag) return null;
                    return (
                      <div style={{ marginTop: '0.75rem', background: T.insetBg, border: '1px solid rgba(248,81,73,0.3)', borderLeft: '4px solid #f85149', borderRadius: 10, padding: '0.75rem 1rem', animation: 'phish-pop 0.15s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <SevBadge sev={flag.severity} />
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: T.textPrimary }}>{flag.label}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.65 }}>{flag.explanation}</p>
                      </div>
                    );
                  })()}

                  {/* Verdict buttons */}
                  {!isRevealed && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${T.borderColor}`, display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={() => submitVerdict('phishing')}
                        style={{ flex: 1, padding: '0.65rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.4)', transition: 'all 0.15s' }}
                      >
                        🎣 Report as Phishing
                      </button>
                      <button
                        type="button"
                        onClick={() => submitVerdict('legit')}
                        style={{ flex: 1, padding: '0.65rem', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(63,185,80,0.1)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.4)', transition: 'all 0.15s' }}
                      >
                        ✅ Mark as Legitimate
                      </button>
                    </div>
                  )}

                  {/* Verdict reveal */}
                  {isRevealed && verdict !== null && (() => {
                    const correct = email.isPhishing ? verdict === 'phishing' : verdict === 'legit';
                    const unfoundCount = email.flags.filter(f => !foundFlags.has(`${email.id}-${f.id}`)).length;
                    return (
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: `1px solid ${T.borderColor}` }}>
                        <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: correct ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', border: `1px solid ${correct ? 'rgba(63,185,80,0.4)' : 'rgba(248,81,73,0.4)'}`, animation: 'phish-pop 0.2s ease-out' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: correct ? '#3fb950' : '#f85149', marginBottom: 4 }}>
                            {correct ? '✅ Correct!' : '❌ Incorrect'} — This email is {email.isPhishing ? 'a phishing attempt' : 'legitimate'}.
                          </div>
                          {email.flags.length > 0 && unfoundCount > 0 && (
                            <div style={{ fontSize: '0.75rem', color: T.textSecondary }}>
                              {unfoundCount} red flag{unfoundCount !== 1 ? 's' : ''} not yet discovered — click the highlighted text or flag buttons above to reveal them.
                            </div>
                          )}
                          {email.flags.length > 0 && unfoundCount === 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#3fb950' }}>All {email.flags.length} red flags discovered!</div>
                          )}
                          {email.flags.length === 0 && (
                            <div style={{ fontSize: '0.75rem', color: T.textSecondary }}>No red flags — this is a genuine notification from a legitimate sender.</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ URL ANALYSER TAB ══ */}
        {tab === 'url' && (
          <div style={{ animation: 'phish-fade 0.2s ease-out' }}>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: T.textSecondary, lineHeight: 1.55 }}>Paste a URL or select a preset to break it down into its components and assess each for phishing indicators.</p>

            {/* Preset pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.85rem' }}>
              {URL_PRESETS.map(p => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => pickPreset(p.url)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: urlInput === p.url ? 'rgba(248,81,73,0.12)' : T.insetBg, color: urlInput === p.url ? '#f85149' : T.textSecondary, border: `1px solid ${urlInput === p.url ? 'rgba(248,81,73,0.4)' : T.borderColor}` }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
              <input
                type="text"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setUrlResult(null); setUrlError(false); }}
                onKeyDown={e => { if (e.key === 'Enter') runUrlAnalyse(); }}
                placeholder="https://example.com/path?param=value"
                style={{ ...inputS, flex: 1, fontFamily: "'Fira Code',monospace", fontSize: '0.78rem' }}
              />
              <button
                type="button"
                onClick={runUrlAnalyse}
                style={{ padding: '0.5rem 1.25rem', background: '#f85149', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                Analyse
              </button>
            </div>

            {/* Error state */}
            {urlError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 10, fontSize: '0.8rem', color: '#f85149', marginBottom: '1rem' }}>
                Invalid URL — ensure it includes a protocol (https:// or http://) and a valid domain.
              </div>
            )}

            {/* Results breakdown */}
            {urlResult && (
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.borderColor}`, animation: 'phish-pop 0.2s ease-out' }}>
                <div style={{ background: '#1a1a2e', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#8b949e', marginLeft: 2 }}>url — component analysis</span>
                </div>
                <div style={{ background: '#0d1117', padding: '0.25rem 0' }}>
                  {urlResult.map((row, i) => (
                    <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px', gap: '0.75rem', alignItems: 'flex-start', padding: '0.7rem 1rem', borderBottom: i < urlResult.length - 1 ? `1px solid #21262d` : 'none' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.06em', paddingTop: 2 }}>{row.label}</span>
                      <div>
                        <div style={{ fontFamily: "'Fira Code',monospace", fontSize: '0.72rem', color: '#e6edf3', marginBottom: 4, wordBreak: 'break-all' }}>{row.value}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8b949e', lineHeight: 1.55 }}>{row.note}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                        <span>{urlStatusIcon(row.status)}</span>
                        <UrlBadge status={row.status} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall verdict bar */}
                {(() => {
                  const dangerCount = urlResult.filter(r => r.status === 'danger').length;
                  const warnCount   = urlResult.filter(r => r.status === 'warn').length;
                  const isDangerous = dangerCount > 0;
                  const isSuspect   = !isDangerous && warnCount > 0;
                  const bg    = isDangerous ? 'rgba(248,81,73,0.12)'  : isSuspect ? 'rgba(210,153,34,0.12)'  : 'rgba(63,185,80,0.12)';
                  const bdr   = isDangerous ? 'rgba(248,81,73,0.4)'   : isSuspect ? 'rgba(210,153,34,0.4)'   : 'rgba(63,185,80,0.4)';
                  const col   = isDangerous ? '#f85149'                : isSuspect ? '#d29922'                : '#3fb950';
                  const label = isDangerous ? `🚨 Likely Phishing — ${dangerCount} critical indicator${dangerCount !== 1 ? 's' : ''} detected` : isSuspect ? `⚠️ Suspicious — ${warnCount} warning${warnCount !== 1 ? 's' : ''} detected, proceed with caution` : '✅ No obvious phishing indicators detected';
                  return (
                    <div style={{ padding: '0.75rem 1rem', background: bg, borderTop: `1px solid ${bdr}` }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: col }}>{label}</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tips when no URL entered */}
            {!urlResult && !urlError && (
              <div style={{ background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 14, padding: '1.25rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>What to look for</div>
                {[
                  { icon: '🔒', tip: 'HTTPS is required but not sufficient — phishing sites use HTTPS too.' },
                  { icon: '🏷️', tip: 'Read domains right to left: TLD → domain name → subdomain. The domain (not subdomain) determines ownership.' },
                  { icon: '🔢', tip: 'Watch for digit substitution: g00gle.com, paypa1.com, amaz0n.com.' },
                  { icon: '➕', tip: 'Brand names added to a domain you don\'t own are a red flag: paypal-secure.net, apple-support.co.' },
                  { icon: '🌐', tip: 'Uncommon TLDs (.club, .xyz, .top, .icu) are frequently used in phishing campaigns due to low cost.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '0.85rem', flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: '0.78rem', color: T.textSecondary, lineHeight: 1.6 }}>{item.tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ SCORE TAB ══ */}
        {tab === 'score' && (
          <div style={{ animation: 'phish-fade 0.2s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.25rem', marginBottom: '1.5rem', alignItems: 'start' }}>

              {/* Grade card */}
              <div style={{ background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Grade</div>
                <div style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, color: scoreData.grade === 'A' ? '#3fb950' : scoreData.grade === 'B' ? '#4493f8' : scoreData.grade === 'C' ? '#d29922' : scoreData.grade === 'D' ? '#f0883e' : '#f85149', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                  {scoreData.pct > 0 ? scoreData.grade : '—'}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: T.textPrimary, fontFamily: 'monospace' }}>{scoreData.pct}%</div>
                <div style={{ fontSize: '0.72rem', color: T.textMuted, marginTop: 4 }}>{scoreData.score} / {scoreData.maxScore} pts</div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { label: 'Score',             value: `${scoreData.score} / ${scoreData.maxScore} pts`, color: '#f85149', icon: '🎯' },
                  { label: 'Correct Verdicts',  value: `${scoreData.correctVerdicts} / ${EMAILS.length}`,           color: '#3fb950', icon: '✅' },
                  { label: 'Red Flags Found',   value: `${scoreData.flagsFound} / ${totalFlags}`,                   color: '#f0883e', icon: '🚩' },
                  { label: 'Percentage',        value: `${scoreData.pct}%`,                                          color: '#4493f8', icon: '📊' },
                ].map(s => (
                  <div key={s.label} style={{ background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 12, padding: '0.9rem 1rem' }}>
                    <div style={{ fontSize: '0.85rem', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: s.color, fontFamily: 'monospace', marginBottom: 2 }}>{s.value}</div>
                    <div style={{ fontSize: '0.62rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scoring guide */}
            <div style={{ background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', alignSelf: 'center' }}>Scoring:</span>
              <span style={{ fontSize: '0.75rem', color: T.textSecondary }}><strong style={{ color: T.textPrimary }}>+15 pts</strong> correct verdict</span>
              <span style={{ fontSize: '0.75rem', color: T.textSecondary }}><strong style={{ color: T.textPrimary }}>+8 pts</strong> per red flag found</span>
              <span style={{ fontSize: '0.75rem', color: T.textSecondary }}><strong style={{ color: '#3fb950' }}>A</strong> ≥85% · <strong style={{ color: '#4493f8' }}>B</strong> ≥70% · <strong style={{ color: '#d29922' }}>C</strong> ≥55% · <strong style={{ color: '#f0883e' }}>D</strong> ≥40% · <strong style={{ color: '#f85149' }}>F</strong> &lt;40%</span>
            </div>

            {/* Per-email breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Per-Email Breakdown</div>
              {EMAILS.map((em, idx) => {
                const v = verdicts[em.id] ?? null;
                const judged = v !== null;
                const correct = judged && (em.isPhishing ? v === 'phishing' : v === 'legit');
                const flagsFoundCount = em.flags.filter(f => foundFlags.has(`${em.id}-${f.id}`)).length;
                const flagPts = flagsFoundCount * 8;
                const verdPts = correct ? 15 : 0;
                return (
                  <div key={em.id} style={{ background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: judged ? (correct ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)') : T.insetBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                      {!judged ? '—' : correct ? '✅' : '❌'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{em.subject}</div>
                      <div style={{ fontSize: '0.68rem', color: T.textMuted }}>{em.from} · {em.category}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      {em.flags.length > 0 && (
                        <span style={{ fontSize: '0.72rem', color: T.textSecondary }}>🚩 {flagsFoundCount}/{em.flags.length}</span>
                      )}
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.accent, fontFamily: 'monospace' }}>{verdPts + flagPts} pts</span>
                      <button
                        type="button"
                        onClick={() => { setSel(idx); setTab('inbox'); setActiveFlag(null); }}
                        style={{ padding: '3px 10px', borderRadius: 6, background: 'none', border: `1px solid ${T.borderColor}`, color: T.textSecondary, fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Not started notice */}
            {judgedCount === 0 && (
              <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: T.panelBg, border: `1px solid ${T.borderColor}`, borderRadius: 14, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>No emails analysed yet</div>
                <div style={{ fontSize: '0.75rem', color: T.textSecondary }}>Head to the Email Inbox tab to start identifying phishing attempts and discovering red flags.</div>
                <button type="button" onClick={() => setTab('inbox')} style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', background: '#f85149', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>Go to Inbox →</button>
              </div>
            )}
          </div>
        )}

        <LabEduPanel cards={PHISH_EDU} isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};
