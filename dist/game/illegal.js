"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveIllegalWorkWeek = resolveIllegalWorkWeek;
const rules_1 = require("./rules");
function resolveIllegalWorkWeek(rng, state, livingWeeklyCost, cfg) {
    const notes = [];
    const illegalIncome = Math.round(livingWeeklyCost * cfg.incomeCoveragePct);
    const busted = rng.nextFloat() < cfg.bustChance;
    const activity = cfg.activities && cfg.activities.length > 0
        ? cfg.activities[Math.floor(rng.nextFloat() * cfg.activities.length)]
        : null;
    const energyDrain = activity
        ? Math.floor(activity.energyDrain[0] +
            rng.nextFloat() *
                (activity.energyDrain[1] - activity.energyDrain[0]))
        : Math.floor(cfg.energyDrainRange[0] +
            rng.nextFloat() *
                (cfg.energyDrainRange[1] - cfg.energyDrainRange[0]));
    if (!busted) {
        const next = {
            ...state,
            cash: state.cash + illegalIncome,
            energy: (0, rules_1.clamp)(state.energy - energyDrain, 0, 100),
            log: [
                ...state.log,
                activity
                    ? `Engaged in ${activity.label}.`
                    : "Engaged in irregular activity.",
                "Energy drained by high-risk work.",
                `Illegal income received: +$${illegalIncome}.`,
            ],
        };
        return {
            state: next,
            result: {
                busted: false,
                cashDelta: illegalIncome,
                energyDelta: -energyDrain,
                notes,
            },
        };
    }
    const postBustEnergy = Math.floor(cfg.postBustEnergyMin +
        rng.nextFloat() *
            (cfg.postBustEnergyMax - cfg.postBustEnergyMin));
    const next = {
        ...state,
        jobId: "",
        onWelfare: false,
        attendingAgency: true,
        unemployedMonths: 0,
        jobChance: 0,
        workWeeksThisMonth: 0,
        highEnergyWorkWeeksThisMonth: 0,
        weeksSinceLastPromotionReview: 0,
        onPerformanceGracePeriod: false,
        performanceGraceWeeksLeft: 0,
        cash: 0,
        energy: (0, rules_1.clamp)(postBustEnergy, 0, 100),
        log: [
            ...state.log,
            "Irregular activity detected.",
            "Support review initiated.",
            "Employment terminated.",
            "All funds reset.",
            `Energy reduced to ${postBustEnergy}.`,
            "Prescription issued. Follow-up recommended.",
        ],
    };
    return {
        state: next,
        result: {
            busted: true,
            cashDelta: -state.cash,
            energyDelta: postBustEnergy - state.energy,
            notes,
        },
    };
}
