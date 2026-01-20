import { RNG } from "./rng";
import { clamp } from "./rules";
import { GameState, Economy } from "./state";

import { simulateMonth } from "./simulate";
import { resolveIllegalWorkMonth, IllegalWorkConfig } from "./illegal";
import { resolveDoctorAppointment, DoctorConfig } from "./doctor";
import { resolveUnemploymentMonth, UnemploymentConfig } from "./unemployment";

import { Job } from "../config/jobs";

export type MonthlyChoice =
  | "work"
  | "unemployment"
  | "illegal_work"
  | "visit_doctor"
  | "rest";

export function resolveMonthlyStep(
  rng: RNG,
  state: GameState,
  choice: MonthlyChoice,
  economy: Economy,
  jobs: readonly Job[],
  illegalCfg: IllegalWorkConfig,
  doctorCfg: DoctorConfig,
  unemploymentCfg: UnemploymentConfig
): GameState {
  let next: GameState = { ...state };
  const log: string[] = [];

  log.push(`--- Month ${state.month + 1} ---`);

  // Employment
  if (state.jobId && choice === "work") {
    next = simulateMonth(rng, next, economy, jobs, []);
    log.push("Employment month processed.");
  }

  // Unemployment
  if (!state.jobId && choice === "unemployment") {
    const res = resolveUnemploymentMonth(rng, next, unemploymentCfg);
    next = res.state;

    if (res.result.gotJob) {
      const job = rng.pick(jobs);
      next.jobId = job.id;
      log.push(`Job assigned: ${job.label}.`);
    }

    log.push("Unemployment month processed.");
  }

  // Illegal work
  if (choice === "illegal_work") {
    const res = resolveIllegalWorkMonth(
      rng,
      next,
      economy.living.monthlyCost,
      illegalCfg
    );
    next = res.state;
    log.push("Irregular income activity processed.");
  }

  // Doctor
  if (choice === "visit_doctor") {
    const res = resolveDoctorAppointment(next, doctorCfg);
    next = res.state;
    log.push("Healthcare follow-up processed.");
  }

  // Rest
  if (choice === "rest") {
    next.energy = clamp(next.energy + 5, 0, 100);
    log.push("Rest taken.");
  }

  // Mandatory monthly living costs (always applied)
  const living = economy.living.monthlyCost;
  const vat = Math.round(living * economy.vat.rate);
  const totalLivingCost = living + vat;

  next.cash -= totalLivingCost;
  log.push(`Living costs deducted: $${living} + VAT $${vat}.`);

  // Exit check
  const exitCost =
    economy.exit.passport.cost +
    economy.exit.travel.ticketCost +
    economy.exit.travel.flightTax;

  if (next.hasPassport && next.cash >= exitCost) {
    next.exited = true;
    log.push("Exit conditions satisfied.");
  }

  // Advance time
  next.month += 1;
  next.log = [...next.log, ...log];

  return next;
}
