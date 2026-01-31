import { RNG } from "./rng";
import { clamp } from "./rules";
import { GameState, Economy } from "./state";
import { applyMonthlySettlement } from "./monthly";
import { resolveIllegalWorkMonth, IllegalWorkConfig } from "./illegal";
import { resolveDoctorAppointment, DoctorConfig } from "./doctor";
import { resolveUnemploymentMonth, UnemploymentConfig } from "./unemployment";
import { Job } from "../config/jobs";
import { HR_MESSAGES } from "./content/hr";


export type WeeklyChoice =
  | "work"
  | "unemployment"
  | "illegal_work"
  | "visit_doctor"
  | "rest";

/**
 * Welfare month choreography.
 * Not exposed to UI. This is enforcement logic.
 */
export function welfarePhase(
  state: GameState
): "meeting" | "applications" | "recovery" | "filing" {
  if (state.welfareWeeksThisMonth <= 1) return "meeting";
  if (state.welfareWeeksThisMonth === 2) return "applications";
  if (state.welfareWeeksThisMonth === 3) return "recovery";
  return "filing";
}


export function resolveWeeklyStep(
  rng: RNG,
  state: GameState,
  choice: WeeklyChoice,
  economy: Economy,
  jobs: readonly Job[],
  illegalCfg: IllegalWorkConfig,
  doctorCfg: DoctorConfig,
  unemploymentCfg: UnemploymentConfig
): GameState {
  let next: GameState = { ...state };
  const log: string[] = [];

  log.push(`--- Week ${state.week} ---`);

  // INVARIANT ENFORCEMENT
  if (next.onWelfare && next.jobId !== "") {
    next.jobId = "";
  }

  // WORK
  if (choice === "work" && next.jobId && !next.onWelfare) {
    const job = jobs.find(j => j.id === next.jobId)!;

    next.workWeeksThisMonth += 1;
    next.weeksSinceLastPromotionReview += 1;

    const highEnergy = next.energy >= 5;
    if (highEnergy) next.highEnergyWorkWeeksThisMonth += 1;

    next.energy = clamp(next.energy - job.energyCost, 0, 100);
    log.push("Worked this week.");

    if (!highEnergy && !next.onPerformanceGracePeriod) {
      next.onPerformanceGracePeriod = true;
      next.performanceGraceWeeksLeft = 4;
      log.push(...HR_MESSAGES.graceStarted);
    }
  }

  // UNEMPLOYMENT
  if (choice === "unemployment" && !next.jobId) {
    const energyAvailable = next.energy;

    // Global rule:
    // Can only apply as many jobs as energy allows, max 14 per month
    const remainingCapacity = Math.max(0, 14 - next.applicationsThisMonth);
    const applicationsThisWeek = Math.min(
      energyAvailable,
      remainingCapacity
    );

    if (applicationsThisWeek > 0) {
      next.applicationsThisMonth += applicationsThisWeek;
      next.energy = clamp(next.energy - applicationsThisWeek, 0, 100);

      log.push(
        `${applicationsThisWeek} job applications submitted this week.`,
        `Total this month: ${next.applicationsThisMonth}/14.`
      );
    } else {
      log.push("No remaining capacity for job applications this month.");
    }

    // Run unemployment logic (chance, decay, courses, etc.)
    const res = resolveUnemploymentMonth(rng, next, unemploymentCfg);
    next = res.state;

    // Job assignment only if not on welfare
    if (res.result.gotJob && !next.onWelfare) {
      const job = rng.pick(jobs);
      next.jobId = job.id;
      log.push(`Job assigned: ${job.label}.`);
    } else if (res.result.gotJob && next.onWelfare) {
      log.push("Employment opportunity noted. Deferred due to welfare status.");
    }

    log.push("Unemployment activity recorded.");
  }

  // ILLEGAL WORK
  if (choice === "illegal_work" && !next.onWelfare && !next.jobId) {
    const res = resolveIllegalWorkMonth(
      rng,
      next,
      economy.living.monthlyCost / 3,
      illegalCfg
    );
    next = res.state;
    log.push("Irregular income activity processed.");
  }

  // DOCTOR
  if (choice === "visit_doctor") {
    const res = resolveDoctorAppointment(next, doctorCfg);
    next = res.state;
    log.push("Healthcare follow-up processed.");
  }

  // REST
  if (choice === "rest") {
    next.energy = clamp(
      next.energy + (next.onWelfare ? 3 : 5),
      0,
      100
    );
    log.push(
      next.onWelfare
        ? "Rest permitted under welfare conditions."
        : "Rest taken."
    );
  }

  // WELFARE ENFORCEMENT
  if (next.onWelfare) {
    next.welfareWeeksThisMonth += 1;
    const phase = welfarePhase(next);

    switch (phase) {
      case "meeting":
        next.energy = clamp(next.energy - 8, 0, 100);
        log.push("Mandatory welfare review meeting attended.");
        break;

      case "applications":
        next.energy = clamp(next.energy - 10, 0, 100);
        log.push("Job search activity monitored.");
        break;

      case "recovery":
        log.push("Recovery week granted.");
        break;

      case "filing":
        log.push("Monthly welfare eligibility filed.");
        break;
    }
  }

  // TIME
  if (next.week < 4) {
    next.week += 1;
  } else {
    next = applyMonthlySettlement(next, economy, jobs, rng);
    next.week = 1;
    next.month += 1;
  }

  next.log = [...next.log, ...log];
  return next;
}
