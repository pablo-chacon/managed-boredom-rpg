"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUnemploymentMonth = resolveUnemploymentMonth;
const rules_1 = require("./rules");
const content_1 = require("./content");
function resolveUnemploymentMonth(rng, state, cfg) {
    const notes = [];
    let next = { ...state };
    let gotJob = false;
    next.unemployedMonths += 1;
    // JOB CHANCE SETUP
    if (next.unemployedMonths === 1) {
        next.jobChance =
            cfg.baseJobChanceMin +
                rng.next() * (cfg.baseJobChanceMax - cfg.baseJobChanceMin);
    }
    if (next.unemployedMonths % 3 === 0) {
        next.jobChance = (0, rules_1.clamp)(next.jobChance - cfg.decayPerQuarter, 0, 1);
        notes.push(content_1.UNEMPLOYMENT_TEXT.probabilityAdjusted);
    }
    // AGENCY PATH
    if (state.attendingAgency) {
        notes.push(content_1.UNEMPLOYMENT_TEXT.participation);
        next.energy = (0, rules_1.clamp)(next.energy - cfg.monthlyParticipationEnergyCost, 0, 100);
        notes.push(content_1.UNEMPLOYMENT_TEXT.applications(cfg.applicationsRequired));
        next.energy = (0, rules_1.clamp)(next.energy -
            cfg.applicationEnergyCost * cfg.applicationsRequired, 0, 100);
        const stipend = Math.round(cfg.participationStipend * (1 - cfg.stipendTaxRate));
        next.cash += stipend;
        notes.push(content_1.UNEMPLOYMENT_TEXT.stipend(stipend));
        next.weeksWithoutAgency = 0;
    }
    // INDEPENDENT PATH
    else {
        notes.push(content_1.UNEMPLOYMENT_TEXT.independentSearch);
        next.weeksWithoutAgency += 4;
        if (next.weeksWithoutAgency >= cfg.forcedCourseAfterWeeks) {
            next.pendingCvCourse = true;
            notes.push(content_1.UNEMPLOYMENT_TEXT.forcedSupport);
            next.weeksWithoutAgency = 0;
        }
    }
    // CV COURSE
    if (next.pendingCvCourse) {
        notes.push(content_1.CV_COURSE_TEXT.attended);
        notes.push(content_1.CV_COURSE_TEXT.delivered);
        notes.push(content_1.CV_COURSE_TEXT.placeholder);
        notes.push(content_1.CV_COURSE_TEXT.loremHint);
        next.energy = (0, rules_1.clamp)(next.energy - cfg.cvCourseEnergyCost, 0, 100);
        next.pendingCvCourse = false;
    }
    // JOB ROLL
    let effectiveJobChance = next.jobChance;
    if (next.onWelfare || next.welfareCooldownMonths > 0) {
        effectiveJobChance = Math.min(effectiveJobChance, 0.15);
    }
    if (!state.attendingAgency) {
        effectiveJobChance = Math.min(effectiveJobChance, cfg.independentJobChance);
    }
    if (rng.next() < effectiveJobChance) {
        gotJob = true;
        notes.push(content_1.UNEMPLOYMENT_TEXT.matchFound);
    }
    // WELFARE EXIT EFFECT
    if (!next.onWelfare && state.onWelfare) {
        next.welfareCooldownMonths = 3;
    }
    // JOB OBTAINED
    if (gotJob) {
        next.attendingAgency = false;
        next.unemployedMonths = 0;
        next.jobChance = 0;
        notes.push(content_1.UNEMPLOYMENT_TEXT.caseClosed);
    }
    next.log = [...next.log, ...notes];
    return {
        state: next,
        result: { gotJob, notes },
    };
}
