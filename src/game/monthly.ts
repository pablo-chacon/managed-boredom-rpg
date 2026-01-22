import { RNG } from "./rng";
import { GameState, Economy } from "./state";
import { Job } from "../config/jobs";

export function applyMonthlySettlement(
  state: GameState,
  economy: Economy,
  jobs: readonly Job[],
  rng: RNG
): GameState {
  const log: string[] = [];
  let cash = state.cash;

  log.push(`--- Month ${state.month + 1} settlement ---`);

  // PERFORMANCE GRACE RESOLUTION 
  let {
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    highEnergyWorkWeeksThisMonth,
    jobId,
  } = state;

  if (onPerformanceGracePeriod) {
    performanceGraceWeeksLeft -= 4; // one full month elapsed

    if (performanceGraceWeeksLeft <= 0) {
      const metRecoveryThreshold = highEnergyWorkWeeksThisMonth >= 3;

      if (metRecoveryThreshold) {
        log.push(
          "Performance review completed.",
          "Improvement acknowledged.",
          "Expectations reinstated."
        );

        onPerformanceGracePeriod = false;
        performanceGraceWeeksLeft = 0;
      } else {
        log.push(
          "Performance review concluded.",
          "Required standards were not met.",
          "Your position has been terminated."
        );

        jobId = "";
        onPerformanceGracePeriod = false;
        performanceGraceWeeksLeft = 0;

        // Forced unemployment path
        state.attendingAgency = true;
        state.unemployedMonths = 0;
        state.jobChance = 0;
      }
    }
  }

  // Salary payout (legal employment only)
  if (state.jobId) {
    const job = jobs.find(j => j.id === state.jobId)!;

    if (
      job.promotion &&
      state.weeksSinceLastPromotionReview >= job.promotion.reviewCooldownWeeks &&
      state.workWeeksThisMonth >= 3
    ) {
      if (state.highEnergyWorkWeeksThisMonth >= job.promotion.minHighEnergyWeeks) {
        // Promotion review
        state.weeksSinceLastPromotionReview = 0;

        // Soft failure bias
        const successChance = 0.25;
        if (rng.next() < successChance) {
          const nextJob = jobs.find(j => j.id === job.promotion!.nextJobId)!;
          log.push("Management is impressed with your consistency.");
          log.push(`You have been promoted to ${nextJob.label}.`);
          return {
            ...state,
            jobId: nextJob.id,
            log: [...state.log, ...log],
          };
        } else {
          log.push("Management appreciates your effort.");
          log.push("This opportunity was assigned elsewhere.");
        }
      } else {
        log.push("Performance expectations were not fully met.");
      }
    }
  }

  // Living costs + VAT (always)
  const living = economy.living.monthlyCost;
  const vat = Math.round(living * economy.vat.rate);
  cash -= living + vat;
  log.push(`Living costs deducted: $${living} + VAT $${vat}.`);

  // Passport processing
  let passportMonthsLeft = state.passportMonthsLeft;
  let hasPassport = state.hasPassport;

  if (passportMonthsLeft > 0) {
    passportMonthsLeft -= 1;
    if (passportMonthsLeft === 0) {
      hasPassport = true;
      log.push("Passport approved.");
    }
  }

  // Exit check
  const exitCost =
    economy.exit.passport.cost +
    economy.exit.travel.ticketCost +
    economy.exit.travel.flightTax;

  const exited = hasPassport && cash >= exitCost;
  if (exited) {
    log.push("Exit conditions satisfied.");
  }

  return {
    ...state,
    cash,
    hasPassport,
    passportMonthsLeft,
    exited,
    jobId,
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    log: [...state.log, ...log],
  };
}
