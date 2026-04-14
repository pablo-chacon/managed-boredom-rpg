"use strict";
// Env vars:
// - RPC_URLS: comma-separated list of JSON-RPC endpoints
//   Example: RPC_URLS="https://eth-mainnet.g.alchemy.com/v2/KEY,https://mainnet.infura.io/v3/KEY,https://cloudflare-eth.com"
// - RPC_TIMEOUT_MS: optional, default 6000
//
// Usage:
//   import { EvmGate } from "./adapters/evm";
//   const gate = EvmGate.fromEnv();
//   const ok = await gate.hasAccess({ chainId, contract, tokenId, player });
//   const seed = await gate.seedFor({ chainId, contract, tokenId, player });
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmGate = void 0;
const gate_1 = require("../game/gate");
function assertHexAddress(addr, label) {
    const a = addr.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(a))
        throw new Error(`Invalid ${label} address: ${addr}`);
    return a.toLowerCase();
}
function assertTokenId(tokenId) {
    const t = tokenId.trim();
    // Accept decimal or hex token ids
    if (/^0x[0-9a-fA-F]+$/.test(t))
        return t.toLowerCase();
    if (/^[0-9]+$/.test(t))
        return BigInt(t).toString(16).padStart(1, "0").replace(/^/, "0x");
    throw new Error(`Invalid tokenId: ${tokenId}`);
}
function toUint256Hex(v) {
    const hex = v.toString(16);
    return "0x" + hex.padStart(64, "0");
}
function normalizeTokenIdToUint256Hex(tokenId) {
    const t = assertTokenId(tokenId);
    const asBig = BigInt(t);
    return toUint256Hex(asBig);
}
function padAddressTo32(addr) {
    // 32-byte left padded, without 0x
    return addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}
function encodeBalanceOfData(owner, tokenIdUint256Hex) {
    // ERC-1155 balanceOf(address,uint256)
    // function selector = first 4 bytes of keccak256("balanceOf(address,uint256)")
    // selector: 0x00fdd58e
    const selector = "00fdd58e";
    const ownerPadded = padAddressTo32(owner);
    const tokenPadded = tokenIdUint256Hex.replace(/^0x/, "");
    return "0x" + selector + ownerPadded + tokenPadded;
}
function parseHexUint(resultHex) {
    if (typeof resultHex !== "string" || !/^0x[0-9a-fA-F]*$/.test(resultHex)) {
        throw new Error(`Invalid hex result: ${String(resultHex)}`);
    }
    return BigInt(resultHex);
}
async function fetchWithTimeout(url, body, timeoutMs) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    try {
        return await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
            signal: ac.signal,
        });
    }
    finally {
        clearTimeout(t);
    }
}
async function jsonRpcCall(url, method, params, timeoutMs, id) {
    const resp = await fetchWithTimeout(url, { jsonrpc: "2.0", id, method, params }, timeoutMs);
    if (!resp.ok) {
        throw new Error(`RPC HTTP ${resp.status} at ${url}`);
    }
    const data = (await resp.json());
    if (data.error) {
        throw new Error(`RPC error ${data.error.code} at ${url}: ${data.error.message}`);
    }
    if (data.result === undefined) {
        throw new Error(`RPC missing result at ${url}`);
    }
    return data.result;
}
async function ethCallBalanceOf(url, contract, owner, tokenId, timeoutMs, id) {
    const tokenUint256 = normalizeTokenIdToUint256Hex(tokenId);
    const data = encodeBalanceOfData(owner, tokenUint256);
    // eth_call params: [{to, data}, "latest"]
    const resultHex = await jsonRpcCall(url, "eth_call", [{ to: contract, data }, "latest"], timeoutMs, id);
    return parseHexUint(resultHex);
}
class EvmGate {
    constructor(cfg) {
        if (!cfg.urls?.length)
            throw new Error("EvmGate requires at least one RPC URL");
        this.cfg = cfg;
    }
    static fromEnv() {
        const urlsRaw = process.env.RPC_URLS ?? "";
        const urls = urlsRaw
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);
        if (!urls.length) {
            throw new Error('RPC_URLS not set. Example: RPC_URLS="https://...,https://..."');
        }
        const timeoutMs = Number(process.env.RPC_TIMEOUT_MS ?? "6000");
        const safeTimeout = Number.isFinite(timeoutMs) && timeoutMs > 100 ? timeoutMs : 6000;
        return new EvmGate({
            urls,
            timeoutMs: safeTimeout,
            maxRetriesPerUrl: 1,
        });
    }
    async hasAccess(p) {
        const contract = assertHexAddress(p.contract, "contract");
        const player = assertHexAddress(p.player, "player");
        const tokenId = p.tokenId;
        const balance = await this.balanceOfWithFallback(contract, player, tokenId);
        return balance > 0n;
    }
    async seedFor(p) {
        // Seed should not require RPC. It should be derived from deterministic identifiers.
        const contract = assertHexAddress(p.contract, "contract");
        const player = assertHexAddress(p.player, "player");
        const tokenIdNorm = assertTokenId(p.tokenId);
        return (0, gate_1.seedFromStrings)([
            String(p.chainId),
            contract,
            tokenIdNorm,
            player,
        ]);
    }
    async balanceOfWithFallback(contract, player, tokenId) {
        let lastErr = null;
        let rpcId = 1;
        for (const url of this.cfg.urls) {
            for (let attempt = 0; attempt <= this.cfg.maxRetriesPerUrl; attempt++) {
                try {
                    const bal = await ethCallBalanceOf(url, contract, player, tokenId, this.cfg.timeoutMs, rpcId++);
                    return bal;
                }
                catch (err) {
                    lastErr = err;
                }
            }
        }
        const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
        throw new Error(`All RPC endpoints failed. Last error: ${msg}`);
    }
}
exports.EvmGate = EvmGate;
// src/adapters/evm.example-usage.ts
//
// Example wiring in src/index.ts:
//
// import { EvmGate } from "./adapters/evm";
// const gate = EvmGate.fromEnv();
//
// const params = {
//   chainId: 1,
//   contract: process.env.ERC1155_CONTRACT!,
//   tokenId: process.env.ERC1155_TOKEN_ID!,
//   player: process.env.PLAYER_ADDRESS!,
// };
//
// const hasAccess = await gate.hasAccess(params);
// if (!hasAccess) { console.log("Access denied."); process.exit(1); }
//
// const seed = await gate.seedFor(params);
// const rng = new RNG(seed);
