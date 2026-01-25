import { RNG } from "../src/game/rng";
import { resolveWeeklyStep, WeeklyChoice } from "../src/game/weekly";
import { GameState } from "../src/game/state";
import { ECONOMY } from "../src/config/economy";
import { JOBS } from "../src/config/jobs";
import { ILLEGAL_WORK_CFG } from "../src/config/illegal";
import { DOCTOR_CFG } from "../src/config/doctor";
import { UNEMPLOYMENT_CFG } from "../src/config/unemployment";

// Run deterministic sequence of choices
function runSimulation(
  seed: number,
  choices: WeeklyChoice[],
  initial?: Partial<GameState>
): GameState {
  const rng = new RNG(seed);

  let state: GameState = {
    month: 0,
    week: 1, // REQUIRED
    energy: 55,
    cash: 0,
    onWelfare: false,
    welfareWeeksThisMonth: 0,
    welfareCooldownMonths: 0,
    jobId: "clerk",
    hasPassport: false,
    passportMonthsLeft: 0,
    hasTicket: false,
    antidepressantMonthsLeft: 0,
    unemployedMonths: 0,
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
    log: [],
    ...initial,
  };

  for (const choice of choices) {
    if (state.exited) break;

    state = resolveWeeklyStep(
      rng,
      state,
      choice,
      ECONOMY,
      JOBS,
      ILLEGAL_WORK_CFG,
      DOCTOR_CFG,
      UNEMPLOYMENT_CFG
    );
  }

  return state;
}

describe("Managed Boredom deterministic core", () => {
  it("produces identical state for identical seed and choices", () => {
    const seed = 1337;
    const choices: WeeklyChoice[] = [
      "work",
      "rest",
      "illegal_work",
      "unemployment",
      "visit_doctor",
    ];

    const a = runSimulation(seed, choices);
    const b = runSimulation(seed, choices);

    expect(a).toEqual(b);
  });

  it("never throws for valid choice sequences", () => {
    const seed = 1;
    const choices: WeeklyChoice[] = [
      "work",
      "work",
      "rest",
      "illegal_work",
      "unemployment",
      "visit_doctor",
      "rest",
    ];

    expect(() => runSimulation(seed, choices)).not.toThrow();
  });

  it("does not exit without formal exit conditions", () => {
    const seed = 42;
    const choices: WeeklyChoice[] = [
      "illegal_work",
      "illegal_work",
      "illegal_work",
      "illegal_work",
    ];

    const end = runSimulation(seed, choices);

    expect(end.exited).toBe(false);
  });

  it("energy always remains within bounds", () => {
    const seed = 999;
    const choices: WeeklyChoice[] = Array(24).fill("illegal_work");

    const end = runSimulation(seed, choices);

    expect(end.energy).toBeGreaterThanOrEqual(0);
    expect(end.energy).toBeLessThanOrEqual(100);
  });

  it("cash never becomes NaN or infinite", () => {
    const seed = 2024;
    const choices: WeeklyChoice[] = [
      "work",
      "illegal_work",
      "rest",
      "unemployment",
      "visit_doctor",
      "work",
    ];

    const end = runSimulation(seed, choices);

    expect(Number.isFinite(end.cash)).toBe(true);
  });

  it("distress log entries are structurally valid if present", () => {
    const seed = 777;
    const choices: WeeklyChoice[] = [
      "illegal_work",
      "illegal_work",
      "illegal_work",
    ];

    const end = runSimulation(seed, choices);

    for (const entry of end.distressLog) {
      expect(entry).toEqual(
        expect.objectContaining({
          month: expect.any(Number),
          input: expect.any(String),
          source: expect.any(String),
        })
      );
    }
  });
});
