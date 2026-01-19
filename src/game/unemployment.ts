import { RNG } from "./rng";
import { clamp } from "./rules";
import { GameState } from "./state";


export type UnemploymentConfig = {
  participationStipend: number;     // 50
  stipendTaxRate: number;            // same income tax as wages
  applicationsRequired: number;      // 14 per 30 days
  applicationEnergyCost: number;     // low
  monthlyParticipationEnergyCost: number; // medium
  cvCourseEnergyCost: number;        // high
  cvCourseDaysLost: number;          // 3
  forcedCourseAfterWeeks: number;    // 3
  baseJobChanceMin: number;           // 0.25
  baseJobChanceMax: number;           // 0.35
  independentJobChance: number;       // 0.27
  decayPerQuarter: number;            // reduces chance over time
};


export type UnemploymentResult = {
  gotJob: boolean;
  notes: string[];
};


export function resolveUnemploymentMonth(
  rng: RNG,
  state: GameState,
  cfg: UnemploymentConfig
): { state: GameState; result: UnemploymentResult } {
  const notes: string[] = [];
  let next = { ...state };
  let gotJob = false;

  next.unemployedMonths += 1;

  // --- Agency participation path ---
  if (state.attendingAgency) {
    notes.push("Active participation in employment support program recorded.");

    // Energy drain from compliance
    next.energy = clamp(
      next.energy - cfg.monthlyParticipationEnergyCost,
      0,
      100
    );

    // Job applications
    notes.push(
      `${cfg.applicationsRequired} job applications submitted.`
    );
    next.energy = clamp(
      next.energy - cfg.applicationEnergyCost * cfg.applicationsRequired,
      0,
      100
    );

    // Stipend
    const taxedStipend = Math.round(
      cfg.participationStipend * (1 - cfg.stipendTaxRate)
    );
    next.cash += taxedStipend;
    notes.push(`Participation compensation paid: $${taxedStipend}.`);

    // Job chance initialization
    if (next.unemployedMonths === 1) {
      next.jobChance =
        cfg.baseJobChanceMin +
        rng.nextFloat() *
          (cfg.baseJobChanceMax - cfg.baseJobChanceMin);
    }

    // Decay job chance every 3 months
    if (next.unemployedMonths % 3 === 0) {
      next.jobChance = clamp(
        next.jobChance - cfg.decayPerQuarter,
        0,
        1
      );
      notes.push("Employment probability adjusted.");
    }

    // Roll for job
    if (rng.nextFloat() < next.jobChance) {
      gotJob = true;
      notes.push("Employment opportunity matched.");
    }

    // Reset disengagement counter
    next.weeksWithoutAgency = 0;
  }

  // --- Independent path ---
  else {
    notes.push("Independent job search noted.");

    next.weeksWithoutAgency += 4;

    // No stipend
    // Lower energy drain
    // Fixed job chance
    if (rng.nextFloat() < cfg.independentJobChance) {
      gotJob = true;
      notes.push("Employment opportunity identified.");
    }

    // Forced CV course after disengagement
    if (next.weeksWithoutAgency >= cfg.forcedCourseAfterWeeks) {
      next.pendingCvCourse = true;
      notes.push("Additional support activity scheduled.");
      next.weeksWithoutAgency = 0;
    }
  }

  // --- Forced CV course ---
  if (next.pendingCvCourse) {
    notes.push("CV Writing Course attended.");
    notes.push("Course content delivered.");

    next.energy = clamp(
      next.energy - cfg.cvCourseEnergyCost,
      0,
      100
    );

    next.pendingCvCourse = false;
  }

  // --- Job obtained ---
  if (gotJob) {
    next.attendingAgency = false;
    next.unemployedMonths = 0;
    next.jobChance = 0;
    notes.push("Unemployment case closed.");
  }

  next.log = [...next.log, ...notes];

  return {
    state: next,
    result: { gotJob, notes },
  };
}




