"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.welfarePhase = welfarePhase;
exports.resolveWeeklyStep = resolveWeeklyStep;
const rules_1 = require("./rules");
const monthly_1 = require("./monthly");
const illegal_1 = require("./illegal");
const doctor_1 = require("./doctor");
const hr_1 = require("./content/hr");
/**
 * Welfare rules.
 *
 * Rules:
 * Week 1 -> meeting (mandatory)
 * Week 2 -> applications (mandatory)
 * Week 3 -> none (no obligation)
 * Week 4 -> filing (mandatory)
 */
function welfarePhase(state) {
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
/**
 * Weekly step resolver.
 */
async function resolveWeeklyStep(rng, state, choice, economy, jobs, illegalCfg, doctorCfg) {
    let next = { ...state };
    const log = [];
    log.push(`--- Week ${state.week} ---`);
    // HARD INVARIANT
    if (next.onWelfare && next.jobId !== "") {
        next.jobId = "";
    }
    /*
      WORK
    */
    if (choice === "work") {
        if (!next.jobId || next.onWelfare) {
            log.push("No active employment contract found.");
        }
        else {
            const job = jobs.find(j => j.id === next.jobId);
            next.workWeeksThisMonth += 1;
            next.weeksSinceLastPromotionReview += 1;
            const highEnergy = next.energy >= 10;
            if (highEnergy)
                next.highEnergyWorkWeeksThisMonth += 1;
            next.energy = (0, rules_1.clamp)(next.energy - job.energyCost, 0, 100);
            log.push("Worked this week.");
            if (!highEnergy && !next.onPerformanceGracePeriod) {
                next.onPerformanceGracePeriod = true;
                next.performanceGraceWeeksLeft = 4;
                log.push(...hr_1.HR_MESSAGES.graceStarted);
            }
        }
    }
    /*
      UNEMPLOYMENT
    */
    if (choice === "unemployment" && !next.jobId) {
        const burnout = next.lastMonthApplications > 25;
        const costPerApplication = burnout ? 1.25 : 1;
        const maxApplicationsThisWeek = Math.floor(next.energy / costPerApplication);
        const applicationsThisWeek = maxApplicationsThisWeek;
        if (applicationsThisWeek > 0) {
            next.applicationsThisMonth += applicationsThisWeek;
            const energyCost = Math.floor(applicationsThisWeek * costPerApplication);
            next.energy = (0, rules_1.clamp)(next.energy - energyCost, 0, 100);
            log.push(`${applicationsThisWeek} job applications submitted this week.`, burnout
                ? "Application fatigue increases effort."
                : "Standard effort applied.");
        }
        else {
            log.push("Insufficient energy for applications.");
        }
        log.push("Unemployment activity recorded.");
    }
    /*
      ILLEGAL WORK
    */
    if (choice === "illegal_work" && !next.onWelfare && !next.jobId) {
        const res = (0, illegal_1.resolveIllegalWorkWeek)(rng, next, economy.living.monthlyCost / 3, illegalCfg);
        next = res.state;
        log.push("Irregular income activity processed.");
    }
    /*
      DOCTOR
    */
    if (choice === "visit_doctor") {
        const res = (0, doctor_1.resolveDoctorAppointment)(next, doctorCfg);
        next = res.state;
        log.push("Healthcare follow-up processed.");
    }
    /*
      REST
    */
    if (choice === "rest") {
        next.energy = (0, rules_1.clamp)(next.energy + (next.onWelfare ? 2 : 4), 0, 100);
        log.push(next.onWelfare
            ? "Rest permitted under welfare conditions."
            : "Rest taken.");
    }
    /*
      WELFARE ENFORCEMENT
    */
    if (next.onWelfare) {
        next.welfareWeeksThisMonth += 1;
        const phase = welfarePhase(next);
        switch (phase) {
            case "meeting":
                next.energy = (0, rules_1.clamp)(next.energy - 6, 0, 100);
                log.push("Mandatory welfare review meeting attended.");
                break;
            case "applications":
                next.energy = (0, rules_1.clamp)(next.energy - 8, 0, 100);
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
    /*
      BASELINE SLEEP RECOVERY
    */
    next.energy = (0, rules_1.clamp)(next.energy + (next.onWelfare ? 3 : next.jobId ? 1 : 2), 0, 100);
    /*
      STRUCTURAL WEEKLY LOAD
      Gentle erosion instead of collapse spiral.
    */
    let weeklyLoad = 0;
    if (next.onWelfare)
        weeklyLoad += 1;
    else if (next.jobId)
        weeklyLoad += 1;
    else
        weeklyLoad += 1;
    // Excellence tier pressure
    if (next.jobId && !next.onWelfare) {
        const highTierCash = economy.living.monthlyCost * 6;
        if (next.cash > highTierCash)
            weeklyLoad += 1;
    }
    next.energy = (0, rules_1.clamp)(next.energy - weeklyLoad, 0, 100);
    /*
      APPEND WEEKLY LOG BEFORE TIME ADVANCE
      Week 4's events must appear before the monthly settlement output.
    */
    next.log = [...next.log, ...log];
    /*
      TIME ADVANCE
    */
    if (next.week < 4) {
        next.week += 1;
    }
    else {
        next = await (0, monthly_1.applyMonthlySettlement)(next, economy, jobs, rng);
        next.week = 1;
        next.month += 1;
    }
    return next;
}
