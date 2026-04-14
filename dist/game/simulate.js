"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rng_1 = require("./rng");
const weekly_1 = require("./weekly");
const economy_1 = require("../config/economy");
const jobs_1 = require("../config/jobs");
const illegal_1 = require("../config/illegal");
const doctor_1 = require("../config/doctor");
const PLAYERS = 1000;
const MAX_MONTHS = 48;
function initialState() {
    return {
        month: 0,
        week: 1,
        energy: 55,
        cash: 0,
        onWelfare: false,
        welfareWeeksThisMonth: 0,
        welfareCooldownMonths: 0,
        jobId: "",
        hasPassport: false,
        passportMonthsLeft: 0,
        hasTicket: false,
        antidepressantMonthsLeft: 0,
        unemployedMonths: 0,
        lastMonthApplications: 0,
        applicationsThisMonth: 0,
        weeksWithoutAgency: 0,
        jobChance: 0.1,
        attendingAgency: true,
        pendingCvCourse: false,
        exited: false,
        workWeeksThisMonth: 0,
        highEnergyWorkWeeksThisMonth: 0,
        weeksSinceLastPromotionReview: 0,
        onPerformanceGracePeriod: false,
        performanceGraceWeeksLeft: 0,
        distressLog: [],
        log: [],
        exitReserveMonths: 0
    };
}
function policy(state) {
    if (state.exited)
        return "rest";
    if (state.hasPassport && state.hasTicket === false)
        return "buy_ticket";
    if (!state.hasPassport && state.cash > economy_1.ECONOMY.exit.passport.cost)
        return "apply_passport";
    if (state.energy < 15)
        return "visit_doctor";
    if (state.jobId && state.energy >= 25)
        return "work";
    if (state.jobId && state.energy < 25)
        return "rest";
    return "unemployment";
}
async function simulateOne(seed) {
    let rng = new rng_1.RNG(seed);
    let state = initialState();
    while (!state.exited && state.month < MAX_MONTHS) {
        const choice = policy(state);
        state = await (0, weekly_1.resolveWeeklyStep)(rng, state, choice, economy_1.ECONOMY, jobs_1.JOBS, illegal_1.ILLEGAL_WORK_CFG, doctor_1.DOCTOR_CFG);
    }
    return state;
}
(async () => {
    let exits = 0;
    let welfareCount = 0;
    let excellenceCount = 0;
    let totalEnergy = 0;
    let totalCash = 0;
    for (let i = 0; i < PLAYERS; i++) {
        const finalState = await simulateOne(i + 1);
        if (finalState.exited)
            exits++;
        if (finalState.onWelfare)
            welfareCount++;
        if (finalState.cash > economy_1.ECONOMY.living.monthlyCost * 8)
            excellenceCount++;
        totalEnergy += finalState.energy;
        totalCash += finalState.cash;
    }
    console.log("Players:", PLAYERS);
    console.log("Exit rate:", exits / PLAYERS);
    console.log("Welfare rate:", welfareCount / PLAYERS);
    console.log("Excellence reach rate:", excellenceCount / PLAYERS);
    console.log("Average final energy:", totalEnergy / PLAYERS);
    console.log("Average final cash:", totalCash / PLAYERS);
})();
