import express from "express";
import path from "path";
import { RNG } from "./game/rng";
import { resolveWeeklyStep, WeeklyChoice } from "./game/weekly";
import { GameState } from "./game/state";
import { ECONOMY } from "./config/economy";
import { JOBS } from "./config/jobs";
import { ILLEGAL_WORK_CFG } from "./config/illegal";
import { DOCTOR_CFG } from "./config/doctor";

const app = express();
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

/*
  Initial Game State Factory
*/
function createInitialState(): GameState {
  return {
    month: 0,
    week: 1,
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
    applicationsThisMonth: 0,
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
  };
}

/*
  Server-owned state
*/
let state: GameState = createInitialState();
const rng = new RNG(1337); // deterministic seed for PoC

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
  const { choice } = req.body as { choice: WeeklyChoice };

  if (!choice) {
    return res.status(400).json({ error: "Choice is required." });
  }

  try {
    state = await resolveWeeklyStep(
      rng,
      state,
      choice,
      ECONOMY,
      JOBS,
      ILLEGAL_WORK_CFG,
      DOCTOR_CFG
    );

    res.json(state);
  } catch (err) {
    console.error("Step error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


app.listen(3000, () => {
  console.log("Web interface running on http://localhost:3000");
});
