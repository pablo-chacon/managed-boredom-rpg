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

  // Auto-enter welfare with tolerance buffer
  if (next.cash < -150 && !next.onWelfare) {
    next.onWelfare = true;
    next.welfareWeeksThisMonth = 0;
    log.push("Welfare support activated.");
  }
  
  // WEEKLY ACTION
  if (state.jobId && choice === "work") {
    const job = jobs.find(j => j.id === state.jobId)!;

    next.workWeeksThisMonth += 1;
    next.weeksSinceLastPromotionReview += 1;

    const isHighEnergy = next.energy >= 5;

    if (isHighEnergy) {
      next.highEnergyWorkWeeksThisMonth += 1;
    }

    next.energy = clamp(
      next.energy - job.energyCost,
      0,
      100
    );

    log.push("Worked this week.");

    
    // PERFORMANCE GRACE TRIGGER
    if (
      !next.onPerformanceGracePeriod &&
      !next.onWelfare &&
      !isHighEnergy
    ) {
      const lowEnergyWeeks =
        next.workWeeksThisMonth - next.highEnergyWorkWeeksThisMonth;

      if (!next.onPerformanceGracePeriod) {
        next.onPerformanceGracePeriod = true;
        next.performanceGraceWeeksLeft = 4;

        log.push(...HR_MESSAGES.graceStarted);
      }
    }
  }


  if (!state.jobId && choice === "unemployment") {
    const res = resolveUnemploymentMonth(rng, next, unemploymentCfg);
    next = res.state;

    if (res.result.gotJob) {
      const job = rng.pick(jobs);
      next.jobId = job.id;
      log.push(`Job assigned: ${job.label}.`);
    }

    log.push("Unemployment activity recorded.");
  }


  if (choice === "illegal_work") {
    const res = resolveIllegalWorkMonth(
      rng,
      next,
      economy.living.monthlyCost / 3,
      illegalCfg
    );
    next = res.state;
    log.push("Irregular income activity processed.");
  }


  if (choice === "visit_doctor") {
    const res = resolveDoctorAppointment(next, doctorCfg);
    next = res.state;
    log.push("Healthcare follow-up processed.");
  }

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

  //WELFARE TRACKING
  if (next.onWelfare) {
    next.welfareWeeksThisMonth += 1;

    if (choice === "unemployment") {
      next.energy = clamp(next.energy - 6, 0, 100);
      log.push("Welfare compliance meeting attended.");
    }
  }

  //TIME PROGRESSION
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
