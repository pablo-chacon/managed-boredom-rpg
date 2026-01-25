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

  // RESET MONTHLY COUNTERS
  let {
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    highEnergyWorkWeeksThisMonth,
    workWeeksThisMonth,
    weeksSinceLastPromotionReview,
    jobId,
    onWelfare,
  } = state;

  let welfareWeeksThisMonth = onWelfare ? 0 : state.welfareWeeksThisMonth;

  // PERFORMANCE GRACE RESOLUTION
  if (onPerformanceGracePeriod) {
    performanceGraceWeeksLeft -= 4;

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

  
  // SALARY + PROMOTION REVIEW
  if (jobId) {
    const job = jobs.find(j => j.id === jobId)!;

    // Salary payout
    const gross = job.grossMonthly;
    const tax = Math.round(gross * economy.income.taxRate);
    const net = gross - tax;

    cash += net;
    log.push(`Salary paid: +$${net} after tax.`);

    // Promotion review
    if (
      job.promotion &&
      weeksSinceLastPromotionReview >= job.promotion.reviewCooldownWeeks &&
      workWeeksThisMonth >= 3
    ) {
      weeksSinceLastPromotionReview = 0;

      if (highEnergyWorkWeeksThisMonth >= job.promotion.minHighEnergyWeeks) {
        const successChance = 0.25;

        if (rng.next() < successChance) {
          const nextJob = jobs.find(j => j.id === job.promotion!.nextJobId)!;
          log.push("Management is impressed with your consistency.");
          log.push(`You have been promoted to ${nextJob.label}.`);

          jobId = nextJob.id;
        } else {
          log.push("Management appreciates your effort.");
          log.push("This opportunity was assigned elsewhere.");
        }
      } else {
        log.push("Performance expectations were not fully met.");
      }
    }
  }

  // LIVING COSTS
  const living = economy.living.monthlyCost;
  const vat = Math.round(living * economy.vat.rate);
  cash -= living + vat;

  log.push(`Living costs deducted: $${living} + VAT $${vat}.`);

  
  // WELFARE ENTRY (MONTHLY ONLY)
  if (!onWelfare && cash < -150) {
    onWelfare = true;
    welfareWeeksThisMonth = 0;

    log.push(
      "Financial review completed.",
      "Temporary welfare assistance granted."
    );
  }

  // PASSPORT PROCESSING
  let passportMonthsLeft = state.passportMonthsLeft;
  let hasPassport = state.hasPassport;

  if (passportMonthsLeft > 0) {
    passportMonthsLeft -= 1;
    if (passportMonthsLeft === 0) {
      hasPassport = true;
      log.push("Passport approved.");
    }
  }

  // EXIT CHECK     
  const exitCost =
    economy.exit.passport.cost +
    economy.exit.travel.ticketCost +
    economy.exit.travel.flightTax;

  const exited = hasPassport && cash >= exitCost;

  if (exited) {
    log.push("Exit conditions satisfied.");
  }

  
  // RETURN STATE
  return {
    ...state,
    cash,
    jobId,
    hasPassport,
    passportMonthsLeft,
    exited,
    onWelfare,
    welfareWeeksThisMonth,
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    workWeeksThisMonth: 0,
    highEnergyWorkWeeksThisMonth: 0,
    weeksSinceLastPromotionReview,
    log: [...state.log, ...log],
  };
}
