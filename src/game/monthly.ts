import { RNG } from "./rng";
import { GameState, Economy } from "./state";
import { Job } from "../config/jobs";
import { NEWS_FLASHES } from "./content/news";
import { managedBoredomAgent } from "./managedBoredomAgent";

type CaseManagerMode = "live" | "deterministic";

export async function applyMonthlySettlement(
  state: GameState,
  economy: Economy,
  jobs: readonly Job[],
  rng: RNG,
  opts?: { caseManagerMode?: CaseManagerMode }
): Promise<GameState> {
  const log: string[] = [];
  let cash = state.cash;
  let energy = state.energy;


  const caseManagerMode: CaseManagerMode =
    opts?.caseManagerMode ?? "deterministic";

  log.push(`--- Month ${state.month} settlement ---`);

  // NEWS
  const NEWS_BORDER = "-".repeat(23);
  const newsFlash =
    NEWS_FLASHES[Math.floor(rng.nextFloat() * NEWS_FLASHES.length)];
  log.push(`${NEWS_BORDER}\n${newsFlash}\n${NEWS_BORDER}`);


  let {
    jobId,
    onWelfare,
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    highEnergyWorkWeeksThisMonth,
    workWeeksThisMonth,
    applicationsThisMonth,
    weeksSinceLastPromotionReview,
    jobChance,
    hasPassport,
    passportMonthsLeft,
    hasTicket,
  } = state;

  // HARD INVARIANT
  if (onWelfare && jobId) {
    jobId = "";
  }

  // SALARY
  if (jobId && !onWelfare) {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const net =
        job.grossMonthly -
        Math.round(job.grossMonthly * economy.income.taxRate);

      cash += net;
      log.push(`Salary paid: +$${net} after tax.`);
    } else {
      log.push("Salary processing failed.");
    }
  }

  // EXCELLENCE COST DRIFT
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

  // EXCELLENCE LOOP PRESSURE
  if (!onWelfare && jobId && stabilityMultiplier > 1.0) {
    if (workWeeksThisMonth < 3) {
      log.push(
        "Performance expectations were not met.",
        "Sustained output is required in this tier."
      );

      onPerformanceGracePeriod = true;
      performanceGraceWeeksLeft = 4;
    }
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

  // ENERGY CAP IN EXCELLENCE TIER
  if (!onWelfare && jobId && cash > 1800 && energy > 45) {
    energy = 45;
    log.push("Sustained workload limits recovery.");
  }

  // WELFARE ENTRY
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
      jobChance = jobChance * complianceRatio;
    }
  }


  // JOB MATCHING
  if (!jobId && !onWelfare && applicationsThisMonth > 0) {
    const chance = Math.min(1, jobChance);

    if (rng.nextFloat() < chance) {
      const job = jobs[Math.floor(rng.nextFloat() * jobs.length)];
      jobId = job.id;

      log.push(
        "Employment opportunity matched.",
        `You have been hired as ${job.label}.`
      );
    }
  }
  
  //  PASSPORT PROCESSING
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

  // Draft next state before narration
  const draftNext: GameState = {
    ...state,
    cash,
    energy,
    jobId,
    onWelfare,
    welfareWeeksThisMonth: onWelfare ? 0 : state.welfareWeeksThisMonth,
    hasPassport,
    hasTicket,
    passportMonthsLeft,
    exited,
    onPerformanceGracePeriod,
    performanceGraceWeeksLeft,
    workWeeksThisMonth: 0,
    applicationsThisMonth: 0,
    highEnergyWorkWeeksThisMonth: 0,
    weeksSinceLastPromotionReview,
    jobChance,
    log: state.log,
  };

  // CASE MANAGER
  const caseManagerLine = await managedBoredomAgent({
    state: draftNext,
    economy,
    lastAction: "monthly_settlement",
    lastEvent: undefined,
    userInput: "",
    rng,
    mode: caseManagerMode,
  });

  log.push(caseManagerLine);

  return {
    ...draftNext,
    log: [...state.log, ...log],
  };
}
