export const ECONOMY = 
{
  time: { daysPerMonth: 30 },
  income: { taxRate: 0.30 },
  vat: { rate: 0.25 },
  living: { monthlyCost: 600 },
  exit: {
    passport: { cost: 50, processingMonths: 2 },
    travel: { ticketCost: 100, flightTax: 400 }
  },
  doctor: { antidepressantCost: 30, durationMonths: 1 }
} as const;

export type Economy = typeof ECONOMY;
