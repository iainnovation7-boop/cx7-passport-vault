import { homeV5 } from "./home-v5";

export const homePanels = {
  platform: {
    kicker: '01 · Your Platform',
    title: 'Discount Policy Reconciliation.',
    subtitle: 'Independent versions · human review',
    metrics: [
      ['Case','Discount policy'],
      ['Authority source','CX7 Decision Passport v5'],
      ['Review','Human-governed'],
      ['Sensitive content','Off-chain']
    ],
    note: 'CX7 reconciles process understanding and represents human-governed decision authority. Solana records proof integrity; it does not decide business correctness.'
  },
  passport: {
    kicker: '02 · Decision Passport',
    title: 'Authority that expires when reality changes.',
    subtitle: 'Time-bound · premise-bound · human-governed',
    metrics: [
      ['Passport',`${homeV5.passport} · ${homeV5.status}`],
      ['Valid until',homeV5.validUntil],
      ['Previous version',`${homeV5.predecessor} · ${homeV5.predecessorStatus}`],
      ['Authority','Human-governed']
    ],
    note: 'Recorded v5 case, not a new live validity check. Permission expires when reality changes.'
  },
  gate: {
    kicker: '03 · Execution Gate',
    title: 'Authority / Execution.',
    subtitle: 'Recorded v5 case results',
    metrics: homeV5.outcomes.map(({ percent, exception, result }) => [
      `${percent}%${exception ? ' · valid exception' : ''}`, result,
    ]),
    note: 'The 10% result requires a valid exception for a customer with more than five years of history. These are recorded case results, not a new execution or simulated gate.'
  },
  proof: {
    kicker: '04 · Solana Proof',
    title: 'Verifiable proof without exposing corporate data.',
    subtitle: 'External integrity layer',
    metrics: [
      ['Network','Solana Devnet'],
      ['Transaction status',homeV5.transactionStatus],
      ['Read-back',homeV5.readBack],
      ['Sensitive data','Never on-chain'],
    ],
    note: 'Previously recorded v5 evidence, not a new live verification. Solana anchors cryptographic proof; it does not evaluate discount rules or validate business correctness. Sensitive process content stays off-chain.'
  }
} as const;

export const scenarioEvents = [
  ["14:07", "Premise Changed", "PREMISE CHANGED"],
  ["14:07:03", "Execution Blocked", "EXECUTION BLOCKED"],
  ["14:09", "Human Review Started", "UNDER REVIEW"],
  ["14:10", "New Passport Issued", "VALID NOW"],
  ["14:11", "Solana Proof History Available", "HISTORICAL EVIDENCE"],
] as const;
