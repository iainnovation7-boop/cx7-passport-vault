// The published server runtime provides a native WebSocket; this replaces the Node-only "ws" package
// pulled in by @solana/kit so the server can start. Only RPC over HTTP is used by CX7.
const WS = globalThis.WebSocket;
export default WS;
export { WS as WebSocket };
