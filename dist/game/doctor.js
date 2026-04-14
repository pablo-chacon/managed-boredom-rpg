"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDoctorAppointment = resolveDoctorAppointment;
const rules_1 = require("./rules");
const content_1 = require("./content");
function resolveDoctorAppointment(state, cfg) {
    const notes = [];
    notes.push(content_1.DOCTOR_TEXT.appointment);
    notes.push(content_1.DOCTOR_TEXT.acknowledged);
    notes.push(content_1.DOCTOR_TEXT.treatment);
    const prescribed = true;
    const canAfford = state.cash >= cfg.antidepressantCost;
    if (!canAfford) {
        notes.push(content_1.DOCTOR_TEXT.prescription);
        notes.push(content_1.DOCTOR_TEXT.notPurchased);
        notes.push(content_1.DOCTOR_TEXT.followUp);
        const next = {
            ...state,
            log: [...state.log, ...notes],
        };
        return {
            state: next,
            result: { prescribed, purchased: false, notes },
        };
    }
    notes.push(content_1.DOCTOR_TEXT.purchased(cfg.antidepressantCost));
    notes.push(content_1.DOCTOR_TEXT.activated);
    const stabilizedEnergy = state.energy < cfg.energyFloorBoost
        ? cfg.energyFloorBoost
        : state.energy;
    const next = {
        ...state,
        cash: state.cash - cfg.antidepressantCost,
        energy: (0, rules_1.clamp)(stabilizedEnergy, 0, cfg.energyCeilingCap),
        antidepressantMonthsLeft: cfg.durationMonths,
        log: [...state.log, ...notes],
    };
    return {
        state: next,
        result: { prescribed, purchased: true, notes },
    };
}
