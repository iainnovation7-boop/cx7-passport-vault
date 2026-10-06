import { address, createSolanaRpc } from "@solana/kit";
import { decodePriceUpdateV2, evaluatePremise, PYTH_RECEIVER_PROGRAM, PYTH_SOL_USD_ACCOUNT, PYTH_SOL_USD_FEED_ID, type PremiseCondition } from "./pyth-premise";

/** Read-only: fetches the real SOL/USD Pyth account from Solana Devnet. No transaction. */
export async function readSolUsdPremise(c: PremiseCondition, rpcUrl = process.env["SOLANA_RPC_URL"] || "https://api.devnet.solana.com") {
  const rpc = createSolanaRpc(rpcUrl);
  const { value } = await rpc.getAccountInfo(address(PYTH_SOL_USD_ACCOUNT), { encoding: "base64" }).send();
  if (!value) throw new Error("Pyth SOL/USD account not found on Devnet");
  if (value.owner !== PYTH_RECEIVER_PROGRAM) throw new Error("Pyth account has an unexpected owner");
  const bytes = Uint8Array.from(atob((value.data as unknown as [string, string])[0]), (ch) => ch.charCodeAt(0));
  const price = decodePriceUpdateV2(bytes);
  if (price.feedId !== PYTH_SOL_USD_FEED_ID) throw new Error("Pyth account is not the SOL/USD feed");
  return evaluatePremise(price, c, Math.floor(Date.now() / 1000));
}
