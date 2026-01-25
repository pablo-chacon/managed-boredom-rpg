import { RNG } from "./rng";
import { clamp } from "./rules";
import { GameState } from "./state";


export type IllegalWorkConfig = {
  bustChance: number;              // 0.20
  incomeCoveragePct: number;       // 0.40 of living costs
  energyCost: number;              // high drain per month
  postBustEnergyMin: number;       // 5
  postBustEnergyMax: number;       // 10
};


export type IllegalResolutionResult = {
  busted: boolean;
  cashDelta: number;
  energyDelta: number;
  notes: string[];
};


export function resolveIllegalWorkMonth(
  rng: RNG,
  state: GameState,
  livingMonthlyCost: number,
  cfg: IllegalWorkConfig
): { state: GameState; result: IllegalResolutionResult } {
  const notes: string[] = [];

  const illegalIncome = Math.round(livingMonthlyCost * cfg.incomeCoveragePct);
  const busted = rng.nextFloat() < cfg.bustChance;

  if (!busted) {
    const next: GameState = {
      ...state,
      cash: state.cash + illegalIncome,
      energy: clamp(state.energy - cfg.energyCost, 0, 100),
      log: [
        ...state.log,
        `Illegal income received: +$${illegalIncome}.`,
        `Energy drained by high-risk work.`,
      ],
    };

    return {
      state: next,
      result: {
        busted: false,
        cashDelta: illegalIncome,
        energyDelta: -cfg.energyCost,
        notes,
      },
    };
  }

  // BUST: enforced collapse
  const postBustEnergy =
    Math.floor(
      cfg.postBustEnergyMin +
      rng.nextFloat() * (cfg.postBustEnergyMax - cfg.postBustEnergyMin)
    );

  const next: GameState = {
    ...state,
    jobId: "",                    // HARD TERMINATION
    onWelfare: false,              // evaluated later
    attendingAgency: true,
    unemployedMonths: 0,
    jobChance: 0,
    workWeeksThisMonth: 0,
    highEnergyWorkWeeksThisMonth: 0,
    weeksSinceLastPromotionReview: 0,
    onPerformanceGracePeriod: false,
    performanceGraceWeeksLeft: 0,
    cash: 0,
    energy: clamp(postBustEnergy, 0, 100),
    log: [
      ...state.log,
      "Irregular activity detected.",
      "Support review initiated.",
      "Employment terminated.",
      "All funds reset.",
      `Energy reduced to ${postBustEnergy}.`,
      "Prescription issued. Follow-up recommended.",
    ],
  };

  return {
    state: next,
    result: {
      busted: true,
      cashDelta: -state.cash,
      energyDelta: postBustEnergy - state.energy,
      notes,
    },
  };
}
