export type GateParams = {
  chainId: number;
  contract: string;
  tokenId: string;
  player: string;
};

export interface OwnershipGate {
  hasAccess(p: GateParams): Promise<boolean>;
  seedFor(p: GateParams): Promise<number>;
}

// Seed derivation must be deterministic and stable.
export function seedFromStrings(parts: string[]): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      h ^= part.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h >>> 0;
}
