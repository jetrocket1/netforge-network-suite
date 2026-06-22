// ScenarioRegistry.ts

export type ScenarioCategory = 'SUBNETTING' | 'PACKET_WALK' | 'ACL_AUDIT';
export type DifficultyLevel = 'Level 3' | 'Level 4';

export interface TopologyNode {
  id: string;
  type: 'client' | 'switch' | 'router' | 'server';
  label: string;
  ipAddress: string;
  runningConfig?: string; // Used strictly by Packet Walk troubleshooting scripts
}

export interface TopologyLink {
  from: string;
  to: string;
}

export interface NetworkScenario {
  id: string;
  category: ScenarioCategory;
  difficulty: DifficultyLevel;
  title: string;
  missionObjective: string;
  topology?: {
    nodes: TopologyNode[];
    links: TopologyLink[];
  };
  correctAnswer: string; // The baseline validation string (e.g., node ID or mask string)
}

export const JetstrahScenarios: NetworkScenario[] = [
  {
    id: 'scen-001',
    category: 'SUBNETTING',
    difficulty: 'Level 3',
    title: 'FLSM Departmental Allocation',
    missionObjective: 'The engineering team requires you to split the address space 192.168.10.0/24 into 4 equal networks. Input the dotted-decimal subnet mask required to provision these custom boundaries.',
    correctAnswer: '255.255.255.192'
  },
  {
    id: 'scen-002',
    category: 'PACKET_WALK',
    difficulty: 'Level 4',
    title: 'The Overlapping Gateway Bug',
    missionObjective: 'A client at PC-Finance cannot establish an outbound link packet handshake to the Server. Inspect the device configurations by clicking on them, find the structural routing anomaly, and click the broken hardware device node to isolate it.',
    topology: {
      nodes: [
        { id: 'pc-1', type: 'client', label: 'PC-Finance', ipAddress: '10.0.1.45/24', runningConfig: 'ip address 10.0.1.45 255.255.255.0\nip default-gateway 10.0.1.1' },
        { id: 'r-core', type: 'router', label: 'R1-Core', ipAddress: '10.0.1.1/24', runningConfig: 'interface Gi0/0\n ip address 10.0.1.1 255.255.255.0\n!\nip route 0.0.0.0 0.0.0.0 192.168.1.2' },
        { id: 'r-branch', type: 'router', label: 'R2-Branch', ipAddress: '10.0.1.1/25', runningConfig: 'interface Gi0/0\n ip address 10.0.1.1 255.255.255.128\n# CRITICAL OVERLAPPING GATEWAY CONFLICT DETECTED' },
        { id: 'srv-1', type: 'server', label: 'HQ-Server', ipAddress: '192.168.1.100/24', runningConfig: 'ip address 192.168.1.100 255.255.255.0' }
      ],
      links: [
        { from: 'pc-1', to: 'r-core' },
        { from: 'r-core', to: 'r-branch' },
        { from: 'r-branch', to: 'srv-1' }
      ]
    },
    correctAnswer: 'r-branch' // Clicking this specific node will validate the challenge successfully
  }
];