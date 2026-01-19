import { clamp } from "./rules";
import { GameState } from "./state";


export type DoctorConfig = {
  antidepressantCost: number;     // 30
  durationMonths: number;         // 1
  energyFloorBoost: number;       // raises minimum energy slightly
  energyCeilingCap: number;       // caps max energy while medicated
};

export type DoctorResult = {
  prescribed: boolean;
  purchased: boolean;
  notes: string[];
};

export function resolveDoctorAppointment(
  state: GameState,
  cfg: DoctorConfig
): { state: GameState; result: DoctorResult } {
  const notes: string[] = [];

  // Appointment always proceeds
  notes.push("Doctor appointment completed.");
  notes.push("Experience acknowledged.");
  notes.push("Standard treatment recommended.");

  // Prescription is always issued
  const prescribed = true;

  // Check if player can afford medication
  const canAfford = state.cash >= cfg.antidepressantCost;

  if (!canAfford) {
    // Care provided, treatment inaccessible
    notes.push("Prescription issued.");
    notes.push("Medication not purchased.");
    notes.push("Follow-up recommended.");

    const next: GameState = {
      ...state,
      // No money change
      // No antidepressant months applied
      // Energy unchanged here. Stabilization happens only if medicated
      log: [...state.log, ...notes],
    };

    return {
      state: next,
      result: {
        prescribed: true,
        purchased: false,
        notes,
      },
    };
  }

  // Medication is purchased
  notes.push(`Medication purchased for $${cfg.antidepressantCost}.`);
  notes.push("Wellbeing plan activated.");

  // Apply stabilizing effects
  const newCash = state.cash - cfg.antidepressantCost;

  // Raise the floor slightly if energy is critically low
  const stabilizedEnergy =
    state.energy < cfg.energyFloorBoost
      ? cfg.energyFloorBoost
      : state.energy;

  const next: GameState = {
    ...state,
    cash: newCash,
    energy: clamp(stabilizedEnergy, 0, cfg.energyCeilingCap),
    antidepressantMonthsLeft: cfg.durationMonths,
    log: [...state.log, ...notes],
  };

  return {
    state: next,
    result: {
      prescribed: true,
      purchased: true,
      notes,
    },
  };
}
