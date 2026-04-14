"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECONOMY = void 0;
const scbBaseline_1 = require("./scbBaseline");
/*
  Scaling strategy:
  We divide SEK values by 100 to match game scale (1–10 wage ratio system).
  Median wage ~37100 SEK → ~371 game units.
  Household spend ~32000 SEK → ~320 game units.
*/
const SCALE = 100;
/*
  Monthly inflation derived from annual CPI.
*/
const MONTHLY_INFLATION = scbBaseline_1.SCB_BASELINE.annualCPI / 12;
/*
  Baseline living cost grounded in SCB household expenditure.
*/
const BASE_LIVING_COST = Math.round(scbBaseline_1.SCB_BASELINE.avgHouseholdSpend / SCALE);
/*
  Exit reserve rule:
  Player must hold 5 × monthly living cost to exit.
*/
const EXIT_RESERVE_MONTHS = 5;
exports.ECONOMY = {
    time: {
        daysPerMonth: 30
    },
    income: {
        taxRate: 0.30,
        medianMonthlyWage: Math.round(scbBaseline_1.SCB_BASELINE.medianMonthlyWage / SCALE)
    },
    vat: {
        rate: 0.25
    },
    inflation: {
        annualCPI: scbBaseline_1.SCB_BASELINE.annualCPI,
        monthlyRate: MONTHLY_INFLATION
    },
    living: {
        monthlyCost: BASE_LIVING_COST,
        exitReserveMonths: EXIT_RESERVE_MONTHS
    },
    labor: {
        unemploymentRate: scbBaseline_1.SCB_BASELINE.unemploymentRate,
        socialSupportRate: scbBaseline_1.SCB_BASELINE.socialSupportRate
    },
    exit: {
        passport: {
            cost: 50,
            processingMonths: 2
        },
        travel: {
            ticketCost: 100,
            flightTax: 400
        }
    },
    doctor: {
        antidepressantCost: 35,
        durationMonths: 1
    }
};
