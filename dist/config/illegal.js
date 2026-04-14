"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ILLEGAL_WORK_CFG = void 0;
exports.ILLEGAL_WORK_CFG = {
    bustChance: 0.20,
    incomeCoveragePct: 1.40,
    energyDrainRange: [8, 26],
    postBustEnergyMin: 5,
    postBustEnergyMax: 8,
    activities: [
        {
            id: "host",
            label: "Hosted a underground rave",
            energyDrain: [8, 12],
        },
        {
            id: "dealing",
            label: "Sell prohibited stuff",
            energyDrain: [14, 18],
        },
        {
            id: "fraud_assist",
            label: "Administrative fraud assistance",
            energyDrain: [14, 18],
        },
        {
            id: "courier",
            label: "Unregistered courier work",
            energyDrain: [10, 14],
        },
        {
            id: "cash_labor",
            label: "Cash-in-hand labor",
            energyDrain: [12, 16],
        },
        {
            id: "smuggling",
            label: "Low-level smuggling task",
            energyDrain: [18, 22],
        },
        {
            id: "violent_collection",
            label: "Debt collection activity",
            energyDrain: [20, 26],
        },
    ],
};
