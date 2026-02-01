import { RNG } from "./rng";
import { clamp } from "./rules";
import { GameState } from "./state";

export type IllegalActivity = {
  id: string;
  label: string;
  energyDrain: readonly [number, number];
};

export type IllegalWorkConfig = {
  bustChance: number;
  incomeCoveragePct: number;

  // Accept readonly tuples from config
  energyDrainRange: readonly [number, number];

  postBustEnergyMin: number;
  postBustEnergyMax: number;

  activities?: readonly IllegalActivity[];
};

export type IllegalResolutionResult = {
  busted: boolean;
  cashDelta: number;
  energyDelta: number;
  notes: string[];
};

export function resolveIllegalWorkWeek(
  rng: RNG,
  state: GameState,
  livingWeeklyCost: number,
  cfg: IllegalWorkConfig
): { state: GameState; result: IllegalResolutionResult } {
  const notes: string[] = [];

  const illegalIncome = Math.round(
    livingWeeklyCost * cfg.incomeCoveragePct
  );

  const busted = rng.nextFloat() < cfg.bustChance;

  const activity =
    cfg.activities && cfg.activities.length > 0
      ? cfg.activities[
          Math.floor(rng.nextFloat() * cfg.activities.length)
        ]
      : null;

  const energyDrain = activity
    ? Math.floor(
        activity.energyDrain[0] +
          rng.nextFloat() *
            (activity.energyDrain[1] - activity.energyDrain[0])
      )
    : Math.floor(
        cfg.energyDrainRange[0] +
          rng.nextFloat() *
            (cfg.energyDrainRange[1] - cfg.energyDrainRange[0])
      );

  if (!busted) {
    const next: GameState = {
      ...state,
      cash: state.cash + illegalIncome,
      energy: clamp(state.energy - energyDrain, 0, 100),
      log: [
        ...state.log,
        activity
          ? `Engaged in ${activity.label}.`
          : "Engaged in irregular activity.",
        "Energy drained by high-risk work.",
        `Illegal income received: +$${illegalIncome}.`,
      ],
    };

    return {
      state: next,
      result: {
        busted: false,
        cashDelta: illegalIncome,
        energyDelta: -energyDrain,
        notes,
      },
    };
  }

  const postBustEnergy = Math.floor(
    cfg.postBustEnergyMin +
      rng.nextFloat() *
        (cfg.postBustEnergyMax - cfg.postBustEnergyMin)
  );

  const next: GameState = {
    ...state,
    jobId: "",
    onWelfare: false,
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
