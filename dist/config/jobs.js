"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOBS = void 0;
exports.JOBS = [
    {
        id: "clerk",
        label: "Clerk",
        grossMonthly: 1500,
        energyCost: 10,
        promotion: {
            nextJobId: "night_shift",
            minHighEnergyWeeks: 3,
            reviewCooldownWeeks: 12,
        },
    },
    {
        id: "night_shift",
        label: "Night Shift",
        grossMonthly: 1700,
        energyCost: 12,
        promotion: {
            nextJobId: "temp",
            minHighEnergyWeeks: 3,
            reviewCooldownWeeks: 12,
        },
    },
    {
        id: "temp",
        label: "Temp Worker",
        grossMonthly: 1400,
        energyCost: 8,
        // promotion intentionally absent
    },
];
