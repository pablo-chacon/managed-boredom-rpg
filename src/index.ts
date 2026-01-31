import readline from "readline";
import { RNG } from "./game/rng";
import { resolveWeeklyStep } from "./game/weekly";
import { GameState } from "./game/state";
import { ECONOMY } from "./config/economy";
import { JOBS } from "./config/jobs";
import { ILLEGAL_WORK_CFG } from "./config/illegal";
import { DOCTOR_CFG } from "./config/doctor";
import { UNEMPLOYMENT_CFG } from "./config/unemployment";
import { respondWithAI } from "./game/ai/aiWrapper";
import { MockGate } from "./adapters/mock";


type WeeklyChoice =
  | "work"
  | "unemployment"
  | "illegal_work"
  | "visit_doctor"
  | "rest"
  | "quit";


const VALID_CHOICES: readonly WeeklyChoice[] = [
  "work",
  "unemployment",
  "illegal_work",
  "visit_doctor",
  "rest",
  "quit",
];


function getStatusLabel(state: GameState): string {
  if (state.onWelfare) return "On Welfare";
  if (state.jobId) return "Employed";
  return "Unemployed";
}


function parseChoice(input: string): WeeklyChoice | null {
  const trimmed = input.trim();
  return VALID_CHOICES.includes(trimmed as WeeklyChoice)
    ? (trimmed as WeeklyChoice)
    : null;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log("Managed Boredom\n");

  const gate = new MockGate();
  const params = {
    chainId: 1,
    contract: "0xdeadbeef",
    tokenId: "1",
    player: "0xplayer",
  };

  if (!(await gate.hasAccess(params))) {
    console.log("Access denied.");
    process.exit(1);
  }

  const rng = new RNG(await gate.seedFor(params));

  let state: GameState = {
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

  console.log("Due to reconstruction, your position has been terminated.");
  console.log("Record high bonuses for board members...\n");

  const finalGross = JOBS.find(j => j.id === state.jobId)!.grossMonthly;
  const tax = Math.round(finalGross * ECONOMY.income.taxRate);
  state.cash += finalGross - tax;
  state.jobId = "";

  console.log(`Final salary paid: $${finalGross - tax} after tax.\n`);

  while (!state.exited) {
    console.log(`\nMonth ${state.month + 1}, Week ${state.week}`);
    console.log(`Cash: $${state.cash}`);
    console.log(`Energy: ${state.energy}`);
    console.log(`Status: ${getStatusLabel(state)}`);

    if (state.onWelfare) {
      console.log(
        `Welfare compliance: week ${state.welfareWeeksThisMonth}/4`
      );
    }

    console.log("\nChoose action:");

    if (state.onWelfare) {
      console.log("  unemployment  // mandatory welfare compliance");
      console.log("  rest");
      console.log("  visit_doctor");
    } else {
      if (state.jobId) console.log("  work");
      if (!state.jobId) console.log("  unemployment");
      console.log("  illegal_work");
      console.log("  visit_doctor");
      console.log("  rest");
    }

    console.log("  quit");

    const raw = await ask("> ");
    const choice = parseChoice(raw);

    if (!choice) {
      // Prevent AI from swallowing turns during welfare
      if (state.onWelfare) {
        console.log("Invalid input. Welfare compliance requires a valid action.");
        continue;
      }

      const reply = await respondWithAI(raw, "system", state);
      console.log(reply.text);
      state = reply.state;
      continue;
    }

    if (choice === "quit") {
      console.log("Session ended.");
      break;
    }

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

    for (const line of state.log.slice(-12)) {
      console.log(line);
    }

    if (state.exited) {
      console.log("\nExit achieved.\nSession complete.");
      break;
    }
  }

  rl.close();
}

main();
