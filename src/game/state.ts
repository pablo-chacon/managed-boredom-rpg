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
  week: number;
  energy: number;              // 0..100
  cash: number;
  onWelfare: boolean;
  welfareWeeksThisMonth: number;
  welfareCooldownMonths: number; // job chance penalty after exit
  jobId: string;
  hasPassport: boolean;
  passportMonthsLeft: number;  // if > 0, processing
  hasTicket: boolean;
  antidepressantMonthsLeft: number;
  log: string[];
  exited: boolean;
  unemployedMonths: number;
  applicationsThisMonth: number;
  weeksWithoutAgency: number;
  jobChance: number;
  attendingAgency: boolean;
  pendingCvCourse: boolean;
  distressLog: DistressEvent[];
  workWeeksThisMonth: number;
  highEnergyWorkWeeksThisMonth: number;
  weeksSinceLastPromotionReview: number;
  onPerformanceGracePeriod: boolean
  performanceGraceWeeksLeft: number

};
