import { clamp } from "./rules";
import { GameState } from "./state";
import { DOCTOR_TEXT } from "./content";

export type DoctorConfig = {
  antidepressantCost: number;
  durationMonths: number;
  energyFloorBoost: number;
  energyCeilingCap: number;
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

  notes.push(DOCTOR_TEXT.appointment);
  notes.push(DOCTOR_TEXT.acknowledged);
  notes.push(DOCTOR_TEXT.treatment);

  const prescribed = true;
  const canAfford = state.cash >= cfg.antidepressantCost;

  if (!canAfford) {
    notes.push(DOCTOR_TEXT.prescription);
    notes.push(DOCTOR_TEXT.notPurchased);
    notes.push(DOCTOR_TEXT.followUp);

    const next: GameState = {
      ...state,
      log: [...state.log, ...notes],
    };

    return {
      state: next,
      result: { prescribed, purchased: false, notes },
    };
  }

  notes.push(DOCTOR_TEXT.purchased(cfg.antidepressantCost));
  notes.push(DOCTOR_TEXT.activated);

  const stabilizedEnergy =
    state.energy < cfg.energyFloorBoost
      ? cfg.energyFloorBoost
      : state.energy;

  const next: GameState = {
    ...state,
    cash: state.cash - cfg.antidepressantCost,
    energy: clamp(stabilizedEnergy, 0, cfg.energyCeilingCap),
    antidepressantMonthsLeft: cfg.durationMonths,
    log: [...state.log, ...notes],
  };

  return {
    state: next,
    result: { prescribed, purchased: true, notes },
  };
}
