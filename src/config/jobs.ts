export type Promotion = {

  nextJobId: string;
  minHighEnergyWeeks: number;
  reviewCooldownWeeks: number;

};


export type Job = {

  readonly id: string;
  readonly label: string;
  readonly grossMonthly: number;
  readonly energyCost: number;
  readonly promotion?: Promotion;

};


export const JOBS: readonly Job[] = [
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

] as const;
