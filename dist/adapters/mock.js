"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGate = void 0;
const gate_1 = require("../game/gate");
class MockGate {
    async hasAccess(_) {
        return true; // for local demo
    }
    async seedFor(p) {
        return (0, gate_1.seedFromStrings)([String(p.chainId), p.contract.toLowerCase(), p.tokenId, p.player.toLowerCase()]);
    }
}
exports.MockGate = MockGate;
