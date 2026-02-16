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
    exitReserveMonths
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
    }
  }

  // INFLATION DRIFT
  const inflationMultiplier =
    1 + economy.inflation.monthlyRate;


  const baseLiving =
    economy.living.monthlyCost * inflationMultiplier;

  // EXCELLENCE COST DRIFT
  let stabilityMultiplier = 1.0;

  // MEDIOCRITY LOOP
  // Reflects Swedish median income stability and slow mobility
  const inMediocrity =
    jobId &&
    !onWelfare &&
    stabilityMultiplier === 1.0;

  if (inMediocrity) {

    // Small upward drift in jobChance
    jobChance = Math.min(0.25, jobChance + 0.01);

    // Slow aspiration erosion
    if (weeksSinceLastPromotionReview > 16) {
      energy = Math.max(0, energy - 1);
      log.push("Career progression remains gradual.");
    }

    // Limited promotion probability
    const eligibleForPromotion =
      highEnergyWorkWeeksThisMonth >= 3 &&
      energy >= 60 &&
      !onPerformanceGracePeriod;

      if (eligibleForPromotion) {

        const promotionProbability = 0.02; // 2% monthly

        if (rng.nextFloat() < promotionProbability) {
          log.push(
            "A higher responsibility opportunity has been assigned.",
            "Increased expectations will apply."
          );

          // Increase effective jobChance slightly
          jobChance += 0.05;
        }
      }
    }


  if (!onWelfare && jobId) {
    if (cash > 2500) stabilityMultiplier = 1.25;
    else if (cash > 1800) stabilityMultiplier = 1.15;
    else if (cash > 1200) stabilityMultiplier = 1.08;
  }


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


  // WELFARE DRAG
  // Stable support with long-term erosion
  if (onWelfare) {
    energy = Math.max(0, energy - 2);
    log.push("Ongoing dependency impacts long-term motivation.");
  }

  // EXCELLENCE LOOP PRESSURE
  // Must work at least 3 weeks to remain stable
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

  // ENERGY CAP IN HIGH TIER
  if (!onWelfare && jobId && stabilityMultiplier > 1.0 && energy > 45) {
    energy = 45;
    log.push("Sustained workload limits recovery.");
  }

  // WELFARE ENTRY
  if (!onWelfare && cash < -450) {
    onWelfare = true;
    jobId = "";
    jobChance = jobChance * 0.8;

    log.push(
      "Financial review completed.",
      "Temporary welfare assistance granted."
    );
  }

  // UNEMPLOYMENT COMPLIANCE
  // Welfare requires full compliance to avoid further suppression
  if (!jobId) {
    const complianceRatio = Math.min(1, applicationsThisMonth / 14);

    if (complianceRatio < 1) {
      log.push(
        "Insufficient job search activity recorded.",
        `Applications submitted: ${applicationsThisMonth}/14.`
      );
    }

    if (onWelfare) {
      const welfareCompliancePenalty = 0.15 + 0.85 * complianceRatio;
      jobChance = jobChance * welfareCompliancePenalty;
    } else {
      jobChance = jobChance * complianceRatio;
    }
  }

  // JOB MATCHING
  // Welfare reduces exit probability and worsens over time
  if (!jobId && !onWelfare && applicationsThisMonth > 0) {
    const macroAdjustment =
      1 - economy.labor.unemploymentRate;

    const chance = Math.min(1, jobChance * macroAdjustment);

    if (rng.nextFloat() < chance) {
      const job = jobs[Math.floor(rng.nextFloat() * jobs.length)];
      jobId = job.id;

      log.push(
        "Employment opportunity matched.",
        `You have been hired as ${job.label}.`
      );
    }
  }

  // JOB MATCHING (WELFARE PATH)
  if (!jobId && onWelfare && applicationsThisMonth > 0) {
    const macroAdjustment =
      1 - economy.labor.unemploymentRate;

    const welfarePenaltyBase = 0.6;

    const monthsFactor = Math.min(0.5, state.unemployedMonths * 0.02);

    const welfarePenalty =
      Math.max(0.10, welfarePenaltyBase - monthsFactor);

    const chance = Math.min(
      1,
      jobChance * macroAdjustment * welfarePenalty
    );

    if (rng.nextFloat() < chance) {
      const job = jobs[Math.floor(rng.nextFloat() * jobs.length)];
      jobId = job.id;
      onWelfare = false;

      log.push(
        "Employment opportunity matched.",
        `You have been hired as ${job.label}.`,
        "Welfare support has been closed."
      );
    }
  }

  // PASSPORT PROCESSING
  if (passportMonthsLeft > 0) {
    passportMonthsLeft -= 1;
    if (passportMonthsLeft === 0) {
      hasPassport = true;
      log.push("Passport approved.");
    }
  }

  // EXIT RESERVE REQUIREMENT (SCB grounded)
  const exitCost =
    economy.exit.passport.cost +
    economy.exit.travel.ticketCost +
    economy.exit.travel.flightTax;

  const reserveRequirement =
    economy.living.monthlyCost *
    economy.living.exitReserveMonths;

  const reserveSatisfied =
    hasPassport &&
    hasTicket &&
    cash >= exitCost + reserveRequirement;

  if (reserveSatisfied) {
    exitReserveMonths += 1;
    log.push("Financial stability verification in progress.");
  } else {
    exitReserveMonths = 0;
  }

  const exited = exitReserveMonths >= 1;

  if (exited) {
    log.push(
      "Exit conditions sustained.",
      "Departure authorization granted."
    );
  }

  // Build next state
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
    exitReserveMonths,
    log: state.log
  };

  // CASE MANAGER
  const caseManagerLine = await managedBoredomAgent({
    state: draftNext,
    economy,
    lastAction: "monthly_settlement",
    lastEvent: undefined,
    userInput: "",
    rng,
    mode: caseManagerMode
  });


  log.push(caseManagerLine);


  return {
    ...draftNext,
    log: [...state.log, ...log]
  };
}
