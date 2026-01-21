import readline from "readline";
import { RNG } from "./game/rng";
import { resolveMonthlyStep } from "./game/monthly";
import { GameState } from "./game/state";
import { ECONOMY } from "./config/economy";
import { JOBS } from "./config/jobs";
import { ILLEGAL_WORK_CFG } from "./config/illegal";
import { DOCTOR_CFG } from "./config/doctor";
import { UNEMPLOYMENT_CFG } from "./config/unemployment";
import { respondWithAI } from "./game/aiWrapper";
import { MockGate } from "./adapters/mock";

type MonthlyChoice =
  | "work"
  | "unemployment"
  | "illegal_work"
  | "visit_doctor"
  | "rest"
  | "quit";

const VALID_CHOICES: readonly MonthlyChoice[] = [
  "work",
  "unemployment",
  "illegal_work",
  "visit_doctor",
  "rest",
  "quit",
];

function parseChoice(input: string): MonthlyChoice | null {
  const trimmed = input.trim();
  return (VALID_CHOICES as readonly string[]).includes(trimmed)
    ? (trimmed as MonthlyChoice)
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
  console.log("Managed Boredom");
  console.log("");

  const gate = new MockGate();

  const params = {
    chainId: 1,
    contract: "0xdeadbeef",
    tokenId: "1",
    player: "0xplayer",
  };

  const hasAccess = await gate.hasAccess(params);
  if (!hasAccess) {
    console.log("Access denied.");
    process.exit(1);
  }

  const seed = await gate.seedFor(params);
  const rng = new RNG(seed);

  let state: GameState = {
    month: 0,
    energy: 55,
    cash: 0,
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
    distressLog: [],
    log: [],
  };

  console.log("Due to reconstruction, your position has been terminated.");
  console.log("Record high bonuses for board members...");
  console.log("");

  const finalGross = JOBS.find(j => j.id === state.jobId)!.grossMonthly;
  const tax = Math.round(finalGross * ECONOMY.income.taxRate);
  state.cash += finalGross - tax;
  state.jobId = "";
  console.log(`Final salary paid: $${finalGross - tax} after tax.`);
  console.log("");

  while (!state.exited) {
    console.log("");
    console.log(`Month: ${state.month + 1}`);
    console.log(`Cash: $${state.cash}`);
    console.log(`Energy: ${state.energy}`);
    console.log(`Status: ${state.jobId ? "Employed" : "Unemployed"}`);
    console.log("");

    console.log("Choose action:");
    if (state.jobId) console.log("  work");
    if (!state.jobId) console.log("  unemployment");
    console.log("  illegal_work");
    console.log("  visit_doctor");
    console.log("  rest");
    console.log("  quit");

    const raw = await ask("> ");
    const choice = parseChoice(raw);

   if (!choice) {
      const reply = await respondWithAI(raw, "system", state);
      console.log(reply.text);
      state = reply.state;
      continue;
  }


    if (choice === "quit") {
      console.log("Session ended.");
      break;
    }

    state = resolveMonthlyStep(
      rng,
      state,
      choice,
      ECONOMY,
      JOBS,
      ILLEGAL_WORK_CFG,
      DOCTOR_CFG,
      UNEMPLOYMENT_CFG
    );

    const recent = state.log.slice(-12);
    for (const line of recent) {
      console.log(line);
    }

    if (state.exited) {
      console.log("");
      console.log("Exit achieved.");
      console.log("Session complete.");
      break;
    }
  }

  rl.close();
}

main();
