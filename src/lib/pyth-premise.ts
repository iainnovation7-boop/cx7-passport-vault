// E3 — Real external premise from Pyth (pure decoding + evaluation; fetching lives in pyth-premise.server.ts).

/** Pyth Solana Receiver program (owner of PriceUpdateV2 accounts). */
export const PYTH_RECEIVER_PROGRAM = "rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ";
/** Sponsored SOL/USD price feed account (shard 0), same address on Devnet and Mainnet. */
export const PYTH_SOL_USD_ACCOUNT = "7UVimffxr9ow1uXYxsr4LHAcV58mLzhmwaeKvJ1pjLiE";
export const PYTH_SOL_USD_FEED_ID = "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";
const PRICE_UPDATE_V2_DISCRIMINATOR = "22f123639d7ef4cd";

export type PythPrice = { feedId: string; price: number; conf: number; publishTime: number; verification: "Full" | "Partial" };

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

/** Decodes a PriceUpdateV2 account. Throws if the bytes are not a genuine price update. */
export function decodePriceUpdateV2(data: Uint8Array): PythPrice {
  if (hex(data.slice(0, 8)) !== PRICE_UPDATE_V2_DISCRIMINATOR) throw new Error("Not a Pyth PriceUpdateV2 account");
  let o = 8 + 32; // discriminator + write_authority
  const level = data[o];
  const verification = level === 1 ? "Full" : "Partial";
  o += level === 1 ? 1 : 2; // Partial carries num_signatures (u8)
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const feedId = hex(data.slice(o, o + 32));
  o += 32;
  const rawPrice = dv.getBigInt64(o, true);
  const rawConf = dv.getBigUint64(o + 8, true);
  const expo = dv.getInt32(o + 16, true);
  const publishTime = Number(dv.getBigInt64(o + 20, true));
  const scale = Math.pow(10, expo);
  return { feedId, price: Number(rawPrice) * scale, conf: Number(rawConf) * scale, publishTime, verification };
}

export type PremiseCondition = { op: ">=" | "<="; threshold: number; maxAgeSec: number };

export type PremiseReading = {
  source: string;
  account: string;
  feedId: string;
  value: number;
  confidence: number;
  publishTime: number;
  readAt: number;
  condition: string;
  stale: boolean;
  result: boolean;
};

/** Evaluates SOL/USD against the condition. A stale or unverified price never evaluates TRUE. */
export function evaluatePremise(p: PythPrice, c: PremiseCondition, nowSec: number): PremiseReading {
  const stale = nowSec - p.publishTime > c.maxAgeSec || p.verification !== "Full";
  const holds = c.op === ">=" ? p.price >= c.threshold : p.price <= c.threshold;
  return {
    source: "Pyth Network — SOL/USD PriceUpdateV2 (Solana Devnet)",
    account: PYTH_SOL_USD_ACCOUNT,
    feedId: p.feedId,
    value: p.price,
    confidence: p.conf,
    publishTime: p.publishTime,
    readAt: nowSec,
    condition: `SOL/USD ${c.op} ${c.threshold} (max age ${c.maxAgeSec}s)`,
    stale,
    result: !stale && holds,
  };
}
