import { RNG } from "./rng";
import { GameState, Economy } from "./state";
import { Job } from "../config/jobs";
import { clamp, energyBand, regulatorDrift } from "./rules";

export type Event = { id: string; label: string; energyDelta: number; cost: number; weight: number };

export function simulateMonth(
  rng: RNG,
  s: GameState,
  econ: Economy,
  jobs: readonly Job[],
  events: Event[],
): GameState {
  if (s.exited) return s;

  const job = jobs.find(j => j.id === s.jobId) ?? jobs[0];
  const log: string[] = [];

  // Work: income + energy cost
  const gross = job.grossMonthly;
  const tax = Math.round(gross * econ.income.taxRate);
  const netIncome = gross - tax;

  let cash = s.cash + netIncome;
  let energy = s.energy - job.energyCost;

  log.push(`Month ${s.month}: Worked as ${job.label}. Gross $${gross}, tax $${tax}, net +$${netIncome}.`);

  // Living costs + VAT on consumption
  const living = econ.living.monthlyCost;
  const vat = Math.round(living * econ.vat.rate);
  cash -= (living + vat);
  log.push(`Paid living $${living} + VAT $${vat}.`);

  // Passport processing tick
  let passportMonthsLeft = s.passportMonthsLeft;
  let hasPassport = s.hasPassport;
  if (passportMonthsLeft > 0) {
    passportMonthsLeft -= 1;
    log.push(`Passport processing. Months left: ${passportMonthsLeft}.`);
    if (passportMonthsLeft === 0) {
      hasPassport = true;
      log.push(`Passport approved.`);
    }
  }

  // Antidepressant tick
  let adMonthsLeft = s.antidepressantMonthsLeft;
  if (adMonthsLeft > 0) {
    adMonthsLeft -= 1;
    log.push(`Medication active. Months left: ${adMonthsLeft}.`);
  }

  // Managed boredom events
  const band = energyBand(energy);

  // base one event per month
  let ev = rng.weightedPick(events);

  // energy-dependent extra “help” or “responsibility”
  if (band === "HIGH") {
    // More obligations, small fees. Deterministic and polite.
    const extra = rng.weightedPick(events);
    energy += ev.energyDelta + extra.energyDelta;
    cash -= (ev.cost + extra.cost);
    log.push(`Obligation: ${ev.label} (-E ${-ev.energyDelta}, -$${ev.cost}).`);
    log.push(`Obligation: ${extra.label} (-E ${-extra.energyDelta}, -$${extra.cost}).`);
  } else {
    energy += ev.energyDelta;
    cash -= ev.cost;
    log.push(`Obligation: ${ev.label} (-E ${-ev.energyDelta}, -$${ev.cost}).`);
  }

  // Regulator drift toward medium energy
  energy += regulatorDrift(energy);

  // Clamp
  energy = clamp(Math.round(energy), 0, 100);

  // End state
  const next: GameState = {
    ...s,
    month: s.month + 1,
    cash,
    energy,
    hasPassport,
    passportMonthsLeft,
    antidepressantMonthsLeft: adMonthsLeft,
    log: [...s.log, ...log],
  };
  return next;
}
