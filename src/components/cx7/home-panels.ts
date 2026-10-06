export const homePanels = {
  platform: {
    kicker: '01 · Your Platform',
    title: 'Connect what you already use.',
    subtitle: 'AI agent · ERP · CRM · Public system',
    metrics: [
      ['Integration model','API / Event'],
      ['Authority source','CX7 Decision Passport'],
      ['Current state','Ready to connect'],
      ['Data exposure','Private by design']
    ],
    note: 'The platform remains yours. CX7 adds a governed authority layer before autonomous execution.'
  },
  passport: {
    kicker: '02 · Decision Passport',
    title: 'Authority that expires when reality changes.',
    subtitle: 'Time-bound · premise-bound · human-governed',
    metrics: [
      ['Passport status','VALID NOW'],
      ['Authority owner','Human approver'],
      ['Validity','Time + conditions'],
      ['Premises','Continuously monitored']
    ],
    note: 'A Decision Passport is not a permanent permission. It stays valid only while its governing premises remain true.'
  },
  gate: {
    kicker: '03 · Execution Gate',
    title: 'Allow. Block. Review.',
    subtitle: 'Every action is checked against current authority.',
    metrics: [
      ['Requested action','Pending check'],
      ['Passport','Linked'],
      ['Premise state','Current'],
      ['Decision','Allow / Block / Review']
    ],
    note: 'The gate evaluates authority at the moment of execution — not only at the moment permission was first granted.'
  },
  proof: {
    kicker: '04 · Solana Proof',
    title: 'Verifiable proof without exposing corporate data.',
    subtitle: 'External integrity layer',
    metrics: [
      ['Network','Solana'],
      ['Proof status','Not connected yet'],
      ['Sensitive data','Never on-chain'],
      ['Record','Cryptographic proof only']
    ],
    note: 'This screen intentionally does not fake a blockchain transaction. The live Solana connection belongs to the next implementation stage.'
  }
} as const;

export const scenarioEvents = [
  ["14:07", "Premise Changed", "PREMISE CHANGED"],
  ["14:07:03", "Execution Blocked", "EXECUTION BLOCKED"],
  ["14:09", "Human Review Started", "UNDER REVIEW"],
  ["14:10", "New Passport Issued", "VALID NOW"],
  ["14:11", "Solana Proof Pending", "PROOF PENDING"],
] as const;
