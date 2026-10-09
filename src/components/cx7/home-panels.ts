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

export type HomeLanguage = "en" | "pt-BR";

const portuguesePanels = {
  platform: {
    kicker: '01 · Sua plataforma',
    title: 'Reconciliação da política de descontos.',
    subtitle: 'Versões independentes · revisão humana',
    metrics: [
      ['Caso', 'Política de descontos'],
      ['Fonte de autoridade', 'CX7 Decision Passport v5'],
      ['Revisão', 'Governada por pessoas'],
      ['Conteúdo sensível', 'Fora da blockchain'],
    ],
    note: 'O CX7 reconcilia o entendimento dos processos e representa a autoridade de decisão governada por pessoas. A Solana registra a integridade da prova; não decide se as regras de negócio estão corretas.',
  },
  passport: {
    kicker: '02 · Passaporte de decisão',
    title: 'Autoridade que expira quando a realidade muda.',
    subtitle: 'Limitada pelo tempo · pelas premissas · governada por pessoas',
    metrics: [
      ['Passaporte', `${homeV5.passport} · ${homeV5.status}`],
      ['Válido até', homeV5.validUntil],
      ['Versão anterior', `${homeV5.predecessor} · ${homeV5.predecessorStatus}`],
      ['Autoridade', 'Governada por pessoas'],
    ],
    note: 'Registro do caso v5, não uma nova consulta de validade em tempo real. A permissão expira quando a realidade muda.',
  },
  gate: {
    kicker: '03 · Controle de execução',
    title: 'Autoridade / Execução.',
    subtitle: 'Resultados registrados do caso v5',
    metrics: homeV5.outcomes.map(({ percent, exception, result }) => [
      `${percent}%${exception ? ' · exceção válida' : ''}`, result,
    ]),
    note: 'O resultado de 10% exige uma exceção válida para um cliente com mais de cinco anos de histórico. Estes são resultados registrados do caso, não uma nova execução nem um controle simulado.',
  },
  proof: {
    kicker: '04 · Prova Solana',
    title: 'Prova verificável sem expor dados empresariais.',
    subtitle: 'Camada externa de integridade',
    metrics: [
      ['Rede', 'Solana Devnet'],
      ['Estado da transação', homeV5.transactionStatus],
      ['Leitura de confirmação', homeV5.readBack],
      ['Dados sensíveis', 'Nunca na blockchain'],
    ],
    note: 'Evidência v5 registrada anteriormente, não uma nova verificação em tempo real. A Solana ancora a prova criptográfica; não avalia regras de desconto nem valida sua correção empresarial. O conteúdo sensível dos processos permanece fora da blockchain.',
  },
} as const;

export const homeLanguages = {
  en: {
    panels: homePanels,
    start: 'START', close: 'Close', open: 'Open', navigation: 'Home navigation',
    reconciliation: 'Reconciliation', language: 'Language', explorer: 'open Solana Explorer',
    imageAlt: 'IA Innovation — CX7 Decision Passport — Governed authority for autonomous systems',
    proofLabels: ['Evidence hash', 'Transaction', 'Attestation', 'Authority', 'Credential', 'Schema'],
  },
  'pt-BR': {
    panels: portuguesePanels,
    start: 'COMEÇAR', close: 'Fechar', open: 'Abrir', navigation: 'Navegação da Home',
    reconciliation: 'Reconciliação', language: 'Idioma', explorer: 'abrir Solana Explorer',
    imageAlt: 'IA Innovation — CX7 Decision Passport — Autoridade governada para sistemas autônomos',
    proofLabels: ['Hash da evidência', 'Transação', 'Atestação', 'Autoridade', 'Credencial', 'Schema'],
  },
} as const;

export const scenarioEvents = [
  ["14:07", "Premise Changed", "PREMISE CHANGED"],
  ["14:07:03", "Execution Blocked", "EXECUTION BLOCKED"],
  ["14:09", "Human Review Started", "UNDER REVIEW"],
  ["14:10", "New Passport Issued", "VALID NOW"],
  ["14:11", "Solana Proof History Available", "HISTORICAL EVIDENCE"],
] as const;
