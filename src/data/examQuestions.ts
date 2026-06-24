export interface MCQuestion {
  id: string;
  topic: Topic;
  exams: ExamType[];
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
}

export type Topic = 'osi' | 'tcp-ip' | 'subnetting' | 'switching' | 'routing' | 'wireless' | 'security' | 'dns';
export type ExamType = 'network+' | 'security+';

export const TOPIC_META: Record<Topic, { label: string; icon: string; color: string }> = {
  'osi':       { label: 'OSI Model',        icon: '🔵', color: '#4493f8' },
  'tcp-ip':    { label: 'TCP/IP & Protocols',icon: '🔄', color: '#3fb950' },
  'subnetting':{ label: 'Subnetting',        icon: '🔢', color: '#e3b341' },
  'switching': { label: 'Switching & VLANs', icon: '🔀', color: '#a855f7' },
  'routing':   { label: 'Routing',           icon: '🗺️', color: '#f78166' },
  'wireless':  { label: 'Wireless',          icon: '📶', color: '#3fb950' },
  'security':  { label: 'Security',          icon: '🔒', color: '#f85149' },
  'dns':       { label: 'DNS & Services',    icon: '🌐', color: '#4493f8' },
};

export const EXAM_META: Record<ExamType, { label: string; passPercent: number; description: string; color: string }> = {
  'network+':  { label: 'CompTIA Network+',  passPercent: 75, description: 'N10-009 · 20 questions · 75% to pass', color: '#e3b341' },
  'security+': { label: 'CompTIA Security+', passPercent: 83, description: 'SY0-701 · 20 questions · 83% to pass', color: '#f85149' },
};

export const QUESTIONS: MCQuestion[] = [
  // ── OSI Model ─────────────────────────────────────────────────────────────
  {
    id: 'osi-1', topic: 'osi', exams: ['network+'], difficulty: 'easy',
    question: 'At which OSI layer does a router primarily operate?',
    options: ['Layer 1 — Physical', 'Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 4 — Transport'],
    answer: 2,
    explanation: 'Routers operate at Layer 3 (Network), using IP addresses to forward packets between different networks.',
  },
  {
    id: 'osi-2', topic: 'osi', exams: ['network+'], difficulty: 'easy',
    question: 'What is the PDU (Protocol Data Unit) at the Transport layer?',
    options: ['Bit', 'Frame', 'Packet', 'Segment'],
    answer: 3,
    explanation: 'Transport layer PDUs are called Segments (TCP) or Datagrams (UDP). Network layer = Packet, Data Link = Frame, Physical = Bit.',
  },
  {
    id: 'osi-3', topic: 'osi', exams: ['network+'], difficulty: 'easy',
    question: 'Which OSI layer is responsible for MAC addressing and frame delivery within the same network?',
    options: ['Physical (Layer 1)', 'Data Link (Layer 2)', 'Network (Layer 3)', 'Transport (Layer 4)'],
    answer: 1,
    explanation: 'The Data Link layer (Layer 2) uses MAC addresses to deliver frames within a single network segment.',
  },
  {
    id: 'osi-4', topic: 'osi', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'Which protocol operates at the Application layer (Layer 7)?',
    options: ['IP', 'TCP', 'Ethernet', 'HTTP'],
    answer: 3,
    explanation: 'HTTP operates at Layer 7 (Application). IP is Layer 3, TCP is Layer 4, and Ethernet is Layer 2.',
  },
  {
    id: 'osi-5', topic: 'osi', exams: ['network+'], difficulty: 'medium',
    question: 'A technician finds a damaged RJ-45 connector preventing connectivity. Which OSI layer is affected?',
    options: ['Layer 1 — Physical', 'Layer 2 — Data Link', 'Layer 3 — Network', 'Layer 5 — Session'],
    answer: 0,
    explanation: 'Physical connectors, cables, and electrical signals are concerns of Layer 1 (Physical). Always start troubleshooting here.',
  },
  {
    id: 'osi-6', topic: 'osi', exams: ['network+'], difficulty: 'medium',
    question: 'What is encapsulation in networking?',
    options: [
      'Encrypting data before transmission',
      'Adding protocol headers/trailers at each OSI layer as data moves down the stack',
      'Compressing data to reduce packet size',
      'Splitting one packet into multiple smaller packets',
    ],
    answer: 1,
    explanation: 'Encapsulation adds headers (and sometimes trailers) at each OSI layer — e.g., a Transport segment becomes a Network packet, then a Data Link frame.',
  },
  {
    id: 'osi-7', topic: 'osi', exams: ['network+'], difficulty: 'easy',
    question: 'At which OSI layer does a standard Layer 2 switch primarily operate?',
    options: ['Layer 1', 'Layer 2', 'Layer 3', 'Layer 4'],
    answer: 1,
    explanation: 'Layer 2 switches use MAC addresses (Data Link layer) to forward frames. Layer 3 switches can also route.',
  },
  {
    id: 'osi-8', topic: 'osi', exams: ['network+'], difficulty: 'medium',
    question: 'Which OSI layer handles data encryption, compression, and format translation?',
    options: ['Transport (Layer 4)', 'Session (Layer 5)', 'Presentation (Layer 6)', 'Application (Layer 7)'],
    answer: 2,
    explanation: 'The Presentation layer converts data between formats, handles encryption (e.g., TLS), and compression.',
  },

  // ── TCP/IP & Protocols ────────────────────────────────────────────────────
  {
    id: 'tcp-1', topic: 'tcp-ip', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'How many packets are exchanged in a TCP three-way handshake?',
    options: ['2', '3', '4', '6'],
    answer: 1,
    explanation: 'The TCP three-way handshake uses exactly 3 packets: SYN → SYN-ACK → ACK.',
  },
  {
    id: 'tcp-2', topic: 'tcp-ip', exams: ['network+'], difficulty: 'easy',
    question: 'What does the SYN flag in a TCP header indicate?',
    options: ['Synchronise — initiate a connection', 'System error detected', 'Data has been acknowledged', 'Session has been terminated'],
    answer: 0,
    explanation: 'SYN (Synchronise) initiates a TCP connection. It appears in the first packet of the three-way handshake.',
  },
  {
    id: 'tcp-3', topic: 'tcp-ip', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'Which transport-layer protocol is connectionless and provides no delivery guarantee?',
    options: ['TCP', 'UDP', 'ICMP', 'ARP'],
    answer: 1,
    explanation: 'UDP (User Datagram Protocol) is connectionless — it sends data without establishing a session or confirming receipt, making it faster but unreliable.',
  },
  {
    id: 'tcp-4', topic: 'tcp-ip', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'What default port does HTTPS use?',
    options: ['80', '443', '8080', '8443'],
    answer: 1,
    explanation: 'HTTPS uses port 443. Plain HTTP uses port 80.',
  },
  {
    id: 'tcp-5', topic: 'tcp-ip', exams: ['network+'], difficulty: 'easy',
    question: 'Which protocol does the ping command use?',
    options: ['UDP', 'TCP', 'ICMP', 'ARP'],
    answer: 2,
    explanation: 'Ping uses ICMP (Internet Control Message Protocol) Echo Request and Echo Reply messages to test reachability.',
  },
  {
    id: 'tcp-6', topic: 'tcp-ip', exams: ['network+'], difficulty: 'easy',
    question: 'What is the purpose of ARP?',
    options: [
      'Resolve domain names to IP addresses',
      'Resolve IP addresses to MAC addresses',
      'Assign IP addresses dynamically',
      'Route packets between networks',
    ],
    answer: 1,
    explanation: 'ARP (Address Resolution Protocol) maps a known IP address to the corresponding MAC address on the local network.',
  },
  {
    id: 'tcp-7', topic: 'tcp-ip', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'Which port does SSH use by default?',
    options: ['21', '22', '23', '25'],
    answer: 1,
    explanation: 'SSH uses port 22. FTP = 21, Telnet = 23, SMTP = 25.',
  },
  {
    id: 'tcp-8', topic: 'tcp-ip', exams: ['network+'], difficulty: 'easy',
    question: 'What is the purpose of DHCP?',
    options: [
      'Resolve domain names to IP addresses',
      'Dynamically assign IP addresses, masks, gateways, and DNS to clients',
      'Translate private IPs to a public IP',
      'Monitor device availability',
    ],
    answer: 1,
    explanation: 'DHCP (Dynamic Host Configuration Protocol) automatically provides clients with IP configuration (address, mask, gateway, DNS).',
  },

  // ── Subnetting ────────────────────────────────────────────────────────────
  {
    id: 'sub-1', topic: 'subnetting', exams: ['network+'], difficulty: 'medium',
    question: 'How many usable host addresses are in a /28 subnet?',
    options: ['12', '14', '16', '30'],
    answer: 1,
    explanation: '/28 has 4 host bits: 2⁴ = 16 total addresses minus 2 (network and broadcast) = 14 usable hosts.',
  },
  {
    id: 'sub-2', topic: 'subnetting', exams: ['network+'], difficulty: 'medium',
    question: 'What is the wildcard mask for a /24 subnet?',
    options: ['255.255.255.0', '0.0.0.0', '0.0.0.255', '255.0.0.0'],
    answer: 2,
    explanation: 'The wildcard mask is the inverse of the subnet mask. /24 = 255.255.255.0, so the wildcard is 0.0.0.255.',
  },
  {
    id: 'sub-3', topic: 'subnetting', exams: ['network+'], difficulty: 'medium',
    question: 'How many /26 subnets can be created from a single /24 network?',
    options: ['2', '4', '8', '16'],
    answer: 1,
    explanation: 'A /26 borrows 2 bits from a /24 (26−24=2). 2² = 4 subnets, each with 64 addresses (62 usable).',
  },
  {
    id: 'sub-4', topic: 'subnetting', exams: ['network+'], difficulty: 'easy',
    question: 'Which of the following IP addresses is NOT in the private address range?',
    options: ['10.5.5.5', '172.31.0.1', '192.168.1.100', '200.168.1.1'],
    answer: 3,
    explanation: 'Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. 200.168.1.1 is a public IP address.',
  },
  {
    id: 'sub-5', topic: 'subnetting', exams: ['network+'], difficulty: 'medium',
    question: 'A host has IP 192.168.10.130/26. What is its network address?',
    options: ['192.168.10.0', '192.168.10.64', '192.168.10.128', '192.168.10.192'],
    answer: 2,
    explanation: '/26 creates blocks of 64. 130 falls in the 128-191 block, so the network address is 192.168.10.128.',
  },
  {
    id: 'sub-6', topic: 'subnetting', exams: ['network+'], difficulty: 'easy',
    question: 'How many bits are in an IPv6 address?',
    options: ['32', '64', '128', '256'],
    answer: 2,
    explanation: 'IPv6 addresses are 128 bits, written as 8 groups of 4 hexadecimal digits (e.g., 2001:0db8::1).',
  },

  // ── Switching & VLANs ─────────────────────────────────────────────────────
  {
    id: 'sw-1', topic: 'switching', exams: ['network+'], difficulty: 'easy',
    question: 'What is the primary purpose of Spanning Tree Protocol (STP)?',
    options: [
      'Encrypt traffic between switches',
      'Prevent Layer 2 switching loops and broadcast storms',
      'Load-balance traffic across uplinks',
      'Provide redundant power to switches',
    ],
    answer: 1,
    explanation: 'STP prevents broadcast storms and Layer 2 loops by blocking redundant paths while keeping one active forwarding path.',
  },
  {
    id: 'sw-2', topic: 'switching', exams: ['network+'], difficulty: 'easy',
    question: 'What does a switch do when it receives a frame with an unknown destination MAC address?',
    options: [
      'Drops the frame silently',
      'Sends it only to the default gateway',
      'Floods it out all ports except the receiving port',
      'Returns the frame to the sender',
    ],
    answer: 2,
    explanation: 'When a destination MAC is not in the CAM table, the switch floods the frame out all ports (except the ingress port) — this is unknown unicast flooding.',
  },
  {
    id: 'sw-3', topic: 'switching', exams: ['network+'], difficulty: 'easy',
    question: 'What is a VLAN?',
    options: [
      'A type of WAN connection',
      'A logical grouping that creates separate broadcast domains on one physical switch',
      'A routing protocol for enterprise networks',
      'A wireless network type',
    ],
    answer: 1,
    explanation: 'VLANs logically segment a physical switch into separate broadcast domains without requiring separate hardware.',
  },
  {
    id: 'sw-4', topic: 'switching', exams: ['network+'], difficulty: 'easy',
    question: 'Which IEEE standard provides VLAN tagging on trunk links?',
    options: ['802.3', '802.1Q', '802.11', '802.1X'],
    answer: 1,
    explanation: '802.1Q inserts a 4-byte tag into Ethernet frames on trunk ports to identify which VLAN the frame belongs to.',
  },
  {
    id: 'sw-5', topic: 'switching', exams: ['network+'], difficulty: 'easy',
    question: 'What type of switch port carries traffic for multiple VLANs?',
    options: ['Access port', 'Trunk port', 'Mirror port', 'Hybrid port'],
    answer: 1,
    explanation: 'Trunk ports carry tagged traffic for multiple VLANs, typically used between switches or between a switch and a router.',
  },
  {
    id: 'sw-6', topic: 'switching', exams: ['network+'], difficulty: 'medium',
    question: 'What is Link Aggregation (LACP) used for?',
    options: [
      'Encrypting traffic between switches',
      'Bundling multiple physical links into one logical link for more bandwidth and redundancy',
      'Assigning VLANs to switch ports',
      'Preventing ARP spoofing',
    ],
    answer: 1,
    explanation: 'LACP (IEEE 802.3ad) bundles multiple physical interfaces into a single logical channel, increasing bandwidth and providing link redundancy.',
  },
  {
    id: 'sw-7', topic: 'switching', exams: ['network+'], difficulty: 'easy',
    question: 'What is the switch MAC address table also known as?',
    options: ['ARP table', 'Routing table', 'CAM table', 'Forwarding table'],
    answer: 2,
    explanation: 'The CAM (Content Addressable Memory) table maps MAC addresses to switch ports, enabling direct frame forwarding.',
  },

  // ── Routing ───────────────────────────────────────────────────────────────
  {
    id: 'rt-1', topic: 'routing', exams: ['network+'], difficulty: 'medium',
    question: 'What is the administrative distance of a directly connected route?',
    options: ['0', '1', '90', '110'],
    answer: 0,
    explanation: 'Directly connected routes have an AD of 0 — the most trusted. Static routes = 1, EIGRP = 90, OSPF = 110.',
  },
  {
    id: 'rt-2', topic: 'routing', exams: ['network+'], difficulty: 'medium',
    question: 'Which routing protocol uses Dijkstra\'s Shortest Path First (SPF) algorithm?',
    options: ['RIP', 'EIGRP', 'OSPF', 'BGP'],
    answer: 2,
    explanation: 'OSPF (Open Shortest Path First) uses Dijkstra\'s SPF algorithm against a link-state database to calculate the best routes.',
  },
  {
    id: 'rt-3', topic: 'routing', exams: ['network+'], difficulty: 'easy',
    question: 'What does TTL (Time to Live) in an IP packet prevent?',
    options: [
      'Unauthorised access to the packet',
      'Packet duplication on the network',
      'Packets looping indefinitely through routers',
      'Data corruption during transit',
    ],
    answer: 2,
    explanation: 'TTL is decremented by 1 at each router. When it reaches 0, the packet is discarded — preventing routing loops from consuming bandwidth forever.',
  },
  {
    id: 'rt-4', topic: 'routing', exams: ['network+'], difficulty: 'medium',
    question: 'What type of NAT maps multiple private IPs to one public IP using unique source port numbers?',
    options: ['Static NAT', 'Dynamic NAT', 'PAT / NAT Overload', 'Reverse NAT'],
    answer: 2,
    explanation: 'PAT (Port Address Translation), also called NAT Overload, lets many devices share a single public IP by using different source ports to track sessions.',
  },
  {
    id: 'rt-5', topic: 'routing', exams: ['network+'], difficulty: 'easy',
    question: 'What is the purpose of a default route (0.0.0.0/0)?',
    options: [
      'Route only internal traffic between VLANs',
      'Match all destinations when no more-specific route exists',
      'Route only multicast traffic',
      'Define the network broadcast address',
    ],
    answer: 1,
    explanation: 'A default route (gateway of last resort) forwards all traffic that doesn\'t match a more-specific route — typically toward the internet.',
  },
  {
    id: 'rt-6', topic: 'routing', exams: ['network+'], difficulty: 'medium',
    question: 'Which of the following is a distance-vector routing protocol?',
    options: ['OSPF', 'IS-IS', 'RIP', 'BGP'],
    answer: 2,
    explanation: 'RIP (Routing Information Protocol) is distance-vector — it shares entire routing tables with neighbours. OSPF and IS-IS are link-state. BGP is path-vector.',
  },

  // ── Wireless ──────────────────────────────────────────────────────────────
  {
    id: 'wi-1', topic: 'wireless', exams: ['network+'], difficulty: 'easy',
    question: 'Which 802.11 standard operates exclusively on the 5 GHz band and offers speeds up to ~3.5 Gbps?',
    options: ['802.11n (Wi-Fi 4)', '802.11ac (Wi-Fi 5)', '802.11g', '802.11b'],
    answer: 1,
    explanation: '802.11ac (Wi-Fi 5) operates only on 5 GHz and supports theoretical peak speeds of ~3.5 Gbps using MU-MIMO and wide channels.',
  },
  {
    id: 'wi-2', topic: 'wireless', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'Which wireless security protocol is considered critically vulnerable and must never be used?',
    options: ['WPA3-SAE', 'WPA2-AES', 'WEP', 'WPA-TKIP'],
    answer: 2,
    explanation: 'WEP (Wired Equivalent Privacy) has severe cryptographic flaws and can be cracked in minutes. WPA2-AES or WPA3 should be used instead.',
  },
  {
    id: 'wi-3', topic: 'wireless', exams: ['network+'], difficulty: 'easy',
    question: 'What does SSID stand for?',
    options: ['Shared Subnet ID', 'Service Set Identifier', 'Secure Signal ID', 'System Set Identifier'],
    answer: 1,
    explanation: 'SSID (Service Set Identifier) is the human-readable name of a wireless network, broadcast in beacon frames.',
  },
  {
    id: 'wi-4', topic: 'wireless', exams: ['network+'], difficulty: 'medium',
    question: 'Which WPA3 feature prevents offline dictionary attacks against the passphrase?',
    options: ['AES-256-GCM encryption', 'SAE (Simultaneous Authentication of Equals)', 'TKIP', 'WPS'],
    answer: 1,
    explanation: 'SAE (also known as Dragonfly) replaces PSK in WPA3 and ensures that captured handshakes can\'t be used for offline brute-force attacks.',
  },
  {
    id: 'wi-5', topic: 'wireless', exams: ['network+'], difficulty: 'medium',
    question: 'What wireless feature focuses the RF signal in the direction of a client device?',
    options: ['MIMO', 'Channel bonding', 'Beamforming', 'Band steering'],
    answer: 2,
    explanation: 'Beamforming (802.11ac/ax) focuses the antenna signal toward specific clients, improving range and throughput compared to omnidirectional transmission.',
  },

  // ── Security ──────────────────────────────────────────────────────────────
  {
    id: 'sec-1', topic: 'security', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'What does TLS primarily provide for network communications?',
    options: [
      'IP addressing and routing',
      'Encryption, authentication, and data integrity',
      'MAC address resolution',
      'Dynamic IP address assignment',
    ],
    answer: 1,
    explanation: 'TLS (Transport Layer Security) provides encryption (confidentiality), certificate-based authentication, and integrity checking via MACs.',
  },
  {
    id: 'sec-2', topic: 'security', exams: ['network+', 'security+'], difficulty: 'medium',
    question: 'In a TLS handshake, what is the purpose of the server\'s certificate?',
    options: [
      'Encrypt the symmetric session key',
      'Prove the server\'s identity to the client via a trusted CA',
      'Compress transmitted data for performance',
      'Assign a session ID to the client',
    ],
    answer: 1,
    explanation: 'The server presents a digital certificate signed by a trusted Certificate Authority (CA), allowing the client to verify it\'s talking to the genuine server.',
  },
  {
    id: 'sec-3', topic: 'security', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'What does an ACL (Access Control List) do?',
    options: [
      'Manages device user accounts',
      'Filters traffic by permitting or denying packets based on IP, port, and protocol rules',
      'Provides dynamic IP addressing',
      'Encrypts traffic between hosts',
    ],
    answer: 1,
    explanation: 'ACLs filter network traffic using permit/deny rules based on source/destination IP addresses, ports, and protocols.',
  },
  {
    id: 'sec-4', topic: 'security', exams: ['network+', 'security+'], difficulty: 'medium',
    question: 'What attack does Dynamic ARP Inspection (DAI) prevent?',
    options: ['SYN flood', 'ARP spoofing / ARP poisoning', 'VLAN hopping', 'DNS cache poisoning'],
    answer: 1,
    explanation: 'DAI validates ARP packets against the DHCP snooping binding table, blocking attackers from sending fake ARP replies to redirect traffic.',
  },
  {
    id: 'sec-5', topic: 'security', exams: ['network+', 'security+'], difficulty: 'medium',
    question: 'What is the purpose of DHCP snooping?',
    options: [
      'Monitor DNS lookups',
      'Block rogue DHCP servers from assigning malicious IP configurations',
      'Encrypt DHCP messages',
      'Rate-limit DHCP requests per port',
    ],
    answer: 1,
    explanation: 'DHCP snooping designates trusted DHCP server ports and drops responses from untrusted ports, preventing rogue DHCP servers from hijacking IP assignment.',
  },
  {
    id: 'sec-6', topic: 'security', exams: ['network+', 'security+'], difficulty: 'medium',
    question: 'What is a VLAN hopping attack?',
    options: [
      'Moving traffic between wireless VLANs seamlessly',
      'An attack that crosses VLAN security boundaries without authorisation via trunk misconfigurations',
      'A load balancing technique across VLANs',
      'A method to route between VLANs',
    ],
    answer: 1,
    explanation: 'VLAN hopping exploits switch port misconfigurations (switch spoofing) or 802.1Q double-tagging to send traffic into VLANs the attacker shouldn\'t access.',
  },
  {
    id: 'sec-7', topic: 'security', exams: ['network+', 'security+'], difficulty: 'easy',
    question: 'What is a DMZ in network security?',
    options: [
      'A dedicated management VLAN',
      'A network segment hosting public-facing servers, isolated from the internal trusted network',
      'A type of site-to-site VPN tunnel',
      'A guest wireless network zone',
    ],
    answer: 1,
    explanation: 'A DMZ (de-militarised zone) hosts public-facing services (web, email, DNS) while firewalls prevent direct access from the DMZ into the internal network.',
  },
  {
    id: 'sec-8', topic: 'security', exams: ['network+', 'security+'], difficulty: 'medium',
    question: 'Which TLS version introduced the 1-RTT handshake and removed support for weak cipher suites?',
    options: ['TLS 1.0', 'TLS 1.1', 'TLS 1.2', 'TLS 1.3'],
    answer: 3,
    explanation: 'TLS 1.3 reduced the handshake to 1 round trip (vs 2 in TLS 1.2), removed weak ciphers, and introduced 0-RTT session resumption.',
  },

  // ── DNS & Services ────────────────────────────────────────────────────────
  {
    id: 'dns-1', topic: 'dns', exams: ['network+'], difficulty: 'easy',
    question: 'Which DNS record type maps a hostname to an IPv4 address?',
    options: ['AAAA', 'MX', 'CNAME', 'A'],
    answer: 3,
    explanation: 'An A record maps a hostname to an IPv4 address. AAAA records map to IPv6, MX to mail servers, CNAME creates aliases.',
  },
  {
    id: 'dns-2', topic: 'dns', exams: ['network+'], difficulty: 'easy',
    question: 'Which DNS record type specifies mail servers for a domain?',
    options: ['A', 'PTR', 'MX', 'SOA'],
    answer: 2,
    explanation: 'MX (Mail Exchange) records define which mail servers accept email on behalf of a domain.',
  },
  {
    id: 'dns-3', topic: 'dns', exams: ['network+'], difficulty: 'easy',
    question: 'What port does DNS typically use for standard queries?',
    options: ['25', '53', '80', '443'],
    answer: 1,
    explanation: 'DNS uses port 53 for both UDP (standard queries) and TCP (zone transfers and responses over 512 bytes).',
  },
  {
    id: 'dns-4', topic: 'dns', exams: ['network+'], difficulty: 'medium',
    question: 'What is the purpose of a CNAME record?',
    options: [
      'Map an IP address back to a hostname',
      'Create an alias pointing to another canonical hostname',
      'Specify the authoritative name server',
      'Define the email servers for a domain',
    ],
    answer: 1,
    explanation: 'A CNAME (Canonical Name) record creates an alias so that one hostname resolves to another — e.g., www.example.com → example.com.',
  },
  {
    id: 'dns-5', topic: 'dns', exams: ['network+'], difficulty: 'medium',
    question: 'Which type of DNS server holds the actual zone records and gives definitive answers for a domain?',
    options: ['Recursive resolver', 'Root nameserver', 'TLD nameserver', 'Authoritative nameserver'],
    answer: 3,
    explanation: 'Authoritative nameservers hold the definitive DNS records for a zone and respond with the actual values, not cached data.',
  },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getByTopic(topic: Topic): MCQuestion[] {
  return shuffle(QUESTIONS.filter(q => q.topic === topic));
}

export function getForExam(exam: ExamType, count = 20): MCQuestion[] {
  return shuffle(QUESTIONS.filter(q => q.exams.includes(exam))).slice(0, count);
}
