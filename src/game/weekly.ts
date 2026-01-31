import { RNG } from "./rng";
import { clamp } from "./rules";
import { GameState, Economy } from "./state";
import { applyMonthlySettlement } from "./monthly";
import { resolveIllegalWorkMonth, IllegalWorkConfig } from "./illegal";
import { resolveDoctorAppointment, DoctorConfig } from "./doctor";
import { Job } from "../config/jobs";
import { HR_MESSAGES } from "./content/hr";

export type WeeklyChoice =
  | "work"
  | "unemployment"
  | "illegal_work"
  | "visit_doctor"
  | "rest";

/**
 * Welfare choreography.
 * Enforcement only. No economy or job logic here.
 *
 * Rules:
 * Week 1 -> meeting
 * Week 2 -> applications
 * Week 3 -> none (no enforcement)
 * Week 4 -> filing (mandatory)
 */
export function welfarePhase(
  state: GameState
): "meeting" | "applications" | "none" | "filing" {
  switch (state.welfareWeeksThisMonth) {
    case 1:
      return "meeting";
    case 2:
      return "applications";
    case 4:
      return "filing";
    default:
      return "none";
  }
}

export function resolveWeeklyStep(
  rng: RNG,
  state: GameState,
  choice: WeeklyChoice,
  economy: Economy,
  jobs: readonly Job[],
  illegalCfg: IllegalWorkConfig,
  doctorCfg: DoctorConfig
): GameState {
  let next: GameState = { ...state };
  const log: string[] = [];

  log.push(`--- Week ${state.week} ---`);

  // HARD INVARIANT
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

  // UNEMPLOYMENT (APPLICATION ACCUMULATION ONLY)
  if (choice === "unemployment" && !next.jobId) {
    const remainingCapacity = Math.max(0, 14 - next.applicationsThisMonth);
    const applicationsThisWeek = Math.min(next.energy, remainingCapacity);

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

  // WELFARE ENFORCEMENT (NON-ECONOMIC)
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

      case "filing":
        log.push("Monthly welfare eligibility filed.");
        break;

      case "none":
        log.push("No scheduled welfare obligations this week.");
        break;
    }
  }

  // TIME ADVANCE
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
