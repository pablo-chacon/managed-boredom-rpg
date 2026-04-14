"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const rng_1 = require("./game/rng");
const weekly_1 = require("./game/weekly");
const economy_1 = require("./config/economy");
const jobs_1 = require("./config/jobs");
const illegal_1 = require("./config/illegal");
const doctor_1 = require("./config/doctor");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Serve frontend
app.use(express_1.default.static(path_1.default.join(__dirname, "../frontend")));
/*
  Initial Game State Factory
*/
function createInitialState() {
    const initialJob = "clerk";
    const job = jobs_1.JOBS.find(j => j.id === initialJob);
    const gross = job.grossMonthly;
    const tax = Math.round(gross * economy_1.ECONOMY.income.taxRate);
    const net = gross - tax;
    return {
        month: 0,
        week: 1,
        energy: 55,
        cash: net, // initial payout
        onWelfare: false,
        welfareWeeksThisMonth: 0,
        welfareCooldownMonths: 0,
        jobId: "", // terminated immediately
        hasPassport: false,
        passportMonthsLeft: 0,
        hasTicket: false,
        antidepressantMonthsLeft: 0,
        unemployedMonths: 0,
        applicationsThisMonth: 0,
        lastMonthApplications: 0,
        weeksWithoutAgency: 0,
        jobChance: 0,
        attendingAgency: true,
        pendingCvCourse: false,
        exited: false,
        workWeeksThisMonth: 0,
        highEnergyWorkWeeksThisMonth: 0,
        weeksSinceLastPromotionReview: 0,
        onPerformanceGracePeriod: false,
        performanceGraceWeeksLeft: 0,
        distressLog: [],
        exitReserveMonths: 0,
        log: [
            "Due to reconstruction, your position has been terminated.",
            "Record high bonuses for board members...",
            `Final salary paid: $${net} after tax.`
        ],
    };
}
/*
  Server-owned state
*/
let state = createInitialState();
const rng = new rng_1.RNG(1337); // deterministic seed
/*
  Exit requirements
*/
app.get("/config", (_req, res) => {
    res.json({
        passportCost: economy_1.ECONOMY.exit.passport.cost,
        passportProcessingMonths: economy_1.ECONOMY.exit.passport.processingMonths,
        ticketCost: economy_1.ECONOMY.exit.travel.ticketCost,
        flightTax: economy_1.ECONOMY.exit.travel.flightTax,
        monthlyLivingCost: economy_1.ECONOMY.living.monthlyCost
    });
});
/*
  Reset Endpoint
*/
app.post("/reset", (_req, res) => {
    state = createInitialState();
    res.json(state);
});
/*
  Weekly Step Endpoint
*/
app.post("/step", async (req, res) => {
    const { choice } = req.body;
    if (!choice) {
        return res.status(400).json({ error: "Choice is required." });
    }
    try {
        state = await (0, weekly_1.resolveWeeklyStep)(rng, state, choice, economy_1.ECONOMY, jobs_1.JOBS, illegal_1.ILLEGAL_WORK_CFG, doctor_1.DOCTOR_CFG);
        res.json(state);
    }
    catch (err) {
        console.error("Step error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
});
app.listen(3000, () => {
    console.log("Web interface running on http://localhost:3000");
});
