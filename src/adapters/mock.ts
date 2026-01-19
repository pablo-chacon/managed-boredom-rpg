import { OwnershipGate, GateParams, seedFromStrings } from "../game/gate";

export class MockGate implements OwnershipGate {
  async hasAccess(_: GateParams): Promise<boolean> {
    return true; // for local demo
  }
  async seedFor(p: GateParams): Promise<number> {
    return seedFromStrings([String(p.chainId), p.contract.toLowerCase(), p.tokenId, p.player.toLowerCase()]);
  }
}
