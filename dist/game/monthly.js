"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyMonthlySettlement = applyMonthlySettlement;
const news_1 = require("./content/news");
const narrator_1 = require("./narrator");
async function applyMonthlySettlement(state, economy, jobs, rng) {
    const log = [];
    let cash = state.cash;
    let energy = state.energy;
    log.push(`--- Month ${state.month} settlement ---`);
    // NEWS
    const NEWS_BORDER = "-".repeat(23);
    const newsFlash = news_1.NEWS_FLASHES[Math.floor(rng.nextFloat() * news_1.NEWS_FLASHES.length)];
    log.push(`${NEWS_BORDER}\n${newsFlash}\n${NEWS_BORDER}`);
    let { jobId, onWelfare, onPerformanceGracePeriod, performanceGraceWeeksLeft, highEnergyWorkWeeksThisMonth, workWeeksThisMonth, applicationsThisMonth, weeksSinceLastPromotionReview, jobChance, hasPassport, passportMonthsLeft, hasTicket, exitReserveMonths } = state;
    // HARD INVARIANT
    if (onWelfare && jobId) {
        jobId = "";
    }
    // SALARY
    if (jobId && !onWelfare) {
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            const net = job.grossMonthly -
                Math.round(job.grossMonthly * economy.income.taxRate);
            cash += net;
            log.push(`Salary paid: +$${net} after tax.`);
        }
    }
    // INFLATION DRIFT
    const inflationMultiplier = 1 + economy.inflation.monthlyRate;
    const baseLiving = economy.living.monthlyCost * inflationMultiplier;
    // EXCELLENCE COST DRIFT
    let stabilityMultiplier = 1.0;
    if (!onWelfare && jobId) {
        if (cash > 2500)
            stabilityMultiplier = 1.25;
        else if (cash > 1800)
            stabilityMultiplier = 1.15;
        else if (cash > 1200)
            stabilityMultiplier = 1.08;
    }
    // EXPECTATION ESCALATION
    let expectationDrift = 1.0;
    if (stabilityMultiplier >= 1.15) {
        expectationDrift = 1.05;
        log.push("Increased expectations recalibrated living standards.");
    }
    const living = Math.round(baseLiving * stabilityMultiplier * expectationDrift);
    const vat = Math.round(living * economy.vat.rate);
    cash -= living + vat;
    if (stabilityMultiplier > 1.0) {
        log.push("Adjusted cost of living applied.", `Living costs updated: $${living} + VAT $${vat}.`);
    }
    else {
        log.push(`Living costs deducted: $${living} + VAT $${vat}.`);
    }
    // WELFARE DRAG
    if (onWelfare) {
        energy = Math.max(0, energy - 2);
        log.push("Ongoing dependency impacts long-term motivation.");
    }
    // EXCELLENCE LOOP PRESSURE
    if (!onWelfare && jobId && stabilityMultiplier > 1.0) {
        if (workWeeksThisMonth < 3) {
            log.push("Performance expectations were not met.", "Sustained output is required in this tier.");
            onPerformanceGracePeriod = true;
            performanceGraceWeeksLeft = 4;
        }
    }
    // PERFORMANCE GRACE RESOLUTION
    if (onPerformanceGracePeriod) {
        performanceGraceWeeksLeft -= 4;
        if (performanceGraceWeeksLeft <= 0) {
            if (highEnergyWorkWeeksThisMonth >= 3) {
                log.push("Performance review completed.", "Improvement acknowledged.", "Expectations reinstated.");
                onPerformanceGracePeriod = false;
                performanceGraceWeeksLeft = 0;
            }
            else {
                log.push("Performance review concluded.", "Required standards were not met.", "Your position has been terminated.");
                jobId = "";
                onPerformanceGracePeriod = false;
                performanceGraceWeeksLeft = 0;
            }
        }
    }
    // WELFARE ENTRY
    if (!onWelfare && cash < -550) {
        onWelfare = true;
        jobId = "";
        jobChance = jobChance * 0.8;
        log.push("Financial review completed.", "Temporary welfare assistance granted.");
    }
    // UNEMPLOYMENT COMPLIANCE
    if (!jobId) {
        const complianceRatio = Math.min(1, applicationsThisMonth / 14);
        if (complianceRatio < 1) {
            log.push("Insufficient job search activity recorded.", `Applications submitted: ${applicationsThisMonth}/14.`);
        }
        if (onWelfare) {
            const welfarePenalty = 0.15 + 0.85 * complianceRatio;
            jobChance *= welfarePenalty;
        }
        else {
            jobChance *= complianceRatio;
        }
    }
    // JOB MATCHING
    if (!jobId && applicationsThisMonth > 0) {
        const macroAdjustment = 1 - economy.labor.unemploymentRate;
        const welfarePenalty = onWelfare
            ? Math.max(0.10, 0.6 - Math.min(0.5, state.unemployedMonths * 0.02))
            : 1;
        const chance = Math.min(1, jobChance * macroAdjustment * welfarePenalty);
        if (rng.nextFloat() < chance) {
            const job = jobs[Math.floor(rng.nextFloat() * jobs.length)];
            jobId = job.id;
            onWelfare = false;
            log.push("Employment opportunity matched.", `You have been hired as ${job.label}.`);
        }
    }
    // PASSPORT APPLICATION POSSIBILITY
    if (!hasPassport &&
        passportMonthsLeft === 0 &&
        !onWelfare &&
        cash >= economy.exit.passport.cost &&
        energy >= 25) {
        cash -= economy.exit.passport.cost;
        passportMonthsLeft = economy.exit.passport.processingMonths;
        log.push("Passport application submitted.");
    }
    // PASSPORT PROCESSING
    if (passportMonthsLeft > 0) {
        passportMonthsLeft -= 1;
        if (passportMonthsLeft === 0) {
            hasPassport = true;
            log.push("Passport approved.");
        }
    }
    // TICKET PURCHASE POSSIBILITY
    if (hasPassport &&
        !hasTicket &&
        !onWelfare &&
        cash >=
            economy.exit.travel.ticketCost +
                economy.exit.travel.flightTax) {
        cash -=
            economy.exit.travel.ticketCost +
                economy.exit.travel.flightTax;
        hasTicket = true;
        log.push("Travel ticket purchased.");
    }
    // EXIT RESERVE REQUIREMENT
    const reserveRequirement = economy.living.monthlyCost *
        economy.living.exitReserveMonths;
    // VERIFICATION COST (only if verification already started)
    if (exitReserveMonths > 0) {
        const verificationCost = Math.round(economy.living.monthlyCost * 0.1);
        cash -= verificationCost;
        log.push("Exit verification incurs administrative expenses.");
    }
    // Optional: stochastic bureaucratic failure during verification
    const auditFailure = exitReserveMonths > 0 && rng.nextFloat() < 0.10;
    const reserveSatisfied = !auditFailure &&
        hasPassport &&
        hasTicket &&
        energy >= 20 &&
        cash >= reserveRequirement;
    if (reserveSatisfied) {
        exitReserveMonths += 1;
        log.push("Financial stability verification in progress.");
    }
    else {
        // Consecutive-month requirement (makes threshold actually matter)
        exitReserveMonths = 0;
        if (auditFailure) {
            log.push("Verification could not be completed this month.");
        }
    }
    const exited = exitReserveMonths >= 5;
    if (exited) {
        log.push("Exit conditions sustained.", "Departure authorization granted.");
    }
    const draftNext = {
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
    const narratorLine = await (0, narrator_1.monthlyNarration)({
        month: state.month,
        monthLog: log,
        energy,
        cash,
        employed: !!jobId,
        onWelfare,
        unemployedMonths: state.unemployedMonths,
        exitReserveMonths,
        exited,
    });
    log.push(narratorLine);
    return {
        ...draftNext,
        log: [...state.log, ...log]
    };
}
