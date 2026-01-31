import { RNG } from "./rng";
import { GameState, Economy } from "./state";
import { Job } from "../config/jobs";
import { NEWS_FLASHES } from "./content/news";

export function applyMonthlySettlement(
  state: GameState,
  economy: Economy,
  jobs: readonly Job[],
  rng: RNG
): GameState {
  const log: string[] = [];
  let cash = state.cash;
  let energy = state.energy;

  log.push(`--- Month ${state.month + 1} settlement ---`);

  // NEWS
  const news =
    NEWS_FLASHES[Math.floor(rng.nextFloat() * NEWS_FLASHES.length)];
  log.push(news);
  

  let {
    jobId,
    onWelfare,
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    highEnergyWorkWeeksThisMonth,
    applicationsThisMonth,
    weeksSinceLastPromotionReview,
  } = state;

  // HARD INVARIANT
  if (onWelfare && jobId) {
    jobId = "";
  }

  // PERFORMANCE GRACE RESOLUTION
  if (onPerformanceGracePeriod) {
    performanceGraceWeeksLeft -= 4;

    if (performanceGraceWeeksLeft <= 0) {
      if (highEnergyWorkWeeksThisMonth >= 3) {
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
      }
    }
  }

  // SALARY
  if (jobId && !onWelfare) {
    const job = jobs.find(j => j.id === jobId)!;
    const net =
      job.grossMonthly -
      Math.round(job.grossMonthly * economy.income.taxRate);

    cash += net;
    log.push(`Salary paid: +$${net} after tax.`);
  }

  // STABILITY / EXCELLENCE LOOP
  let stabilityMultiplier = 1.0;

  if (!onWelfare && jobId) {
    if (cash > 2500) stabilityMultiplier = 1.25;
    else if (cash > 1800) stabilityMultiplier = 1.15;
    else if (cash > 1200) stabilityMultiplier = 1.08;
  }

  const baseLiving = economy.living.monthlyCost;
  const living = Math.round(baseLiving * stabilityMultiplier);
  const vat = Math.round(living * economy.vat.rate);

  cash -= living + vat;

  if (stabilityMultiplier > 1.0) {
    log.push(
      "Adjusted cost of living applied.",
      `Living costs updated: $${living} + VAT $${vat}.`
    );
  } else {
    log.push(`Living costs deducted: $${living} + VAT $${vat}.`);
  }

  // STABILITY ENERGY CAP
  if (!onWelfare && jobId && cash > 1800 && energy > 45) {
    energy = 45;
    log.push("Sustained workload limits recovery.");
  }

  // WELFARE ENTRY (MONTHLY ONLY)
  if (!onWelfare && cash < -150) {
    onWelfare = true;
    jobId = "";
    log.push(
      "Financial review completed.",
      "Temporary welfare assistance granted."
    );
  }

  // UNEMPLOYMENT COMPLIANCE
  if (!jobId) {
    const complianceRatio = Math.min(1, applicationsThisMonth / 14);

    if (complianceRatio < 1) {
      log.push(
        "Insufficient job search activity recorded.",
        `Applications submitted: ${applicationsThisMonth}/14.`
      );
      state.jobChance *= complianceRatio;
    }
  }

  // JOB MATCHING (MONTHLY ONLY)
  if (!jobId && !onWelfare && applicationsThisMonth > 0) {
    const chance = Math.min(1, state.jobChance);

    if (rng.nextFloat() < chance) {
      const job = jobs[Math.floor(rng.nextFloat() * jobs.length)];
      jobId = job.id;

      log.push(
        "Employment opportunity matched.",
        `You have been hired as ${job.label}.`
      );
    }
  }

  // PASSPORT
  let passportMonthsLeft = state.passportMonthsLeft;
  let hasPassport = state.hasPassport;

  if (passportMonthsLeft > 0) {
    passportMonthsLeft -= 1;
    if (passportMonthsLeft === 0) {
      hasPassport = true;
      log.push("Passport approved.");
    }
  }

  const exitCost =
    economy.exit.passport.cost +
    economy.exit.travel.ticketCost +
    economy.exit.travel.flightTax;

  const exited = hasPassport && cash >= exitCost;
  if (exited) log.push("Exit conditions satisfied.");

  return {
    ...state,
    cash,
    energy,
    jobId,
    onWelfare,
    welfareWeeksThisMonth: onWelfare ? 0 : state.welfareWeeksThisMonth,
    hasPassport,
    hasTicket: state.hasTicket,
    passportMonthsLeft,
    exited,
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    workWeeksThisMonth: 0,
    applicationsThisMonth: 0,
    highEnergyWorkWeeksThisMonth: 0,
    weeksSinceLastPromotionReview,
    log: [...state.log, ...log],
  };
}
