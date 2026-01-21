import { DistressEvent } from "./distress"


export type Economy = {
  time: { daysPerMonth: number };
  income: { taxRate: number };
  vat: { rate: number };
  living: { monthlyCost: number };
  exit: {
    passport: { cost: number; processingMonths: number };
    travel: { ticketCost: number; flightTax: number };
  };
  doctor: { antidepressantCost: number; durationMonths: number };
};


export type GameState = {
  month: number;
  energy: number;              // 0..100
  cash: number;
  jobId: string;
  hasPassport: boolean;
  passportMonthsLeft: number;  // if > 0, processing
  hasTicket: boolean;
  antidepressantMonthsLeft: number;
  log: string[];
  exited: boolean;
  unemployedMonths: number;
  weeksWithoutAgency: number;
  jobChance: number;
  attendingAgency: boolean;
  pendingCvCourse: boolean;
  distressLog: DistressEvent[];
};
