import type { PremiseReading } from "@/lib/pyth-premise";

export type Row = [label: string, value: string, changed?: boolean];

/** Rows shown by the Premise Monitor — every value comes straight from the Pyth reading. */
export function premiseRows(r: PremiseReading): Row[] {
  return [
    ["Source", "Pyth Network"],
    ["Pair", "SOL/USD"],
    ["Live value", `US$ ${r.value.toFixed(4)}`],
    ["Published at", new Date(r.publishTime * 1000).toUTCString()],
    ["Condition", r.condition.replace(/ \(max age.*\)$/, "")],
    ["Premise result", r.stale ? "FALSE (STALE PRICE)" : r.result ? "TRUE" : "FALSE", !r.result],
  ];
}
