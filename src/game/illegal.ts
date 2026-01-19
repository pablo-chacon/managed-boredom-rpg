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

  // 1) Monthly illegal income
  const illegalIncome = Math.round(livingMonthlyCost * cfg.incomeCoveragePct);

  // 2) Bust check
  const roll = rng.nextFloat();
  const busted = roll < cfg.bustChance;

  
  if (!busted) {
    // Successful month
    const cashDelta = illegalIncome;
    const energyDelta = -cfg.energyCost;


    notes.push(`Illegal income received: +$${illegalIncome}.`);
    notes.push(`Energy drained by high-risk work.`);


    const next: GameState = {
      ...state,
      cash: state.cash + cashDelta,
      energy: clamp(state.energy + energyDelta, 0, 100),
      // Illegal income cannot be used for exit
      // Do not mark any exit-related flags here
      log: [
        ...state.log,
        ...notes,
      ],
    };

    return {
      state: next,
      result: { busted: false, cashDelta, energyDelta, notes },
    };
  }

  // 3) Bust resolution framed as care
  notes.push(`Irregular activity detected.`);
  notes.push(`Support review initiated.`);
  notes.push(`A healthcare follow-up has been scheduled.`);

  // Financial reset
  const cashReset = -state.cash;

  // Energy collapse to a survivable floor
  const postBustEnergy =
    Math.floor(
      cfg.postBustEnergyMin +
      rng.nextFloat() * (cfg.postBustEnergyMax - cfg.postBustEnergyMin)
    );

  // Doctor appointment is scheduled, but no forced purchase
  // Player likely has no funds to buy medication
  const next: GameState = {
    ...state,
    cash: 0,
    energy: clamp(postBustEnergy, 0, 100),
    antidepressantMonthsLeft: 0, // prescription may be issued elsewhere, purchase not automatic
    // Re-enter unemployment flow implicitly by losing illegal income
    log: [
      ...state.log,
      ...notes,
      `All funds reset.`,
      `Energy reduced to ${postBustEnergy}.`,
      `Prescription issued. Follow-up recommended.`,
    ],
  };

  return {
    state: next,
    result: {
      busted: true,
      cashDelta: cashReset,
      energyDelta: postBustEnergy - state.energy,
      notes,
    },
  };
}
