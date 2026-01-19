export const JOBS = 
[
  { id: "clerk", label: "Clerk", grossMonthly: 1500, energyCost: 12 },
  { id: "night_shift", label: "Night Shift", grossMonthly: 1700, energyCost: 18 },
  { id: "temp", label: "Temp Worker", grossMonthly: 1400, energyCost: 10 }
] as const;


export type Job = typeof JOBS[number];

