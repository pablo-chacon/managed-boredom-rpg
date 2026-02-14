import express from "express";
import path from "path";
import { RNG } from "./game/rng";
import { resolveWeeklyStep } from "./game/weekly";
import { ECONOMY } from "./config/economy";
import { JOBS } from "./config/jobs";
import { ILLEGAL_WORK_CFG } from "./config/illegal";
import { DOCTOR_CFG } from "./config/doctor";

const app = express();
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/step", async (req, res) => {
  const { state, choice, seed } = req.body;

  const rng = new RNG(seed);

  const next = await resolveWeeklyStep(
    rng,
    state,
    choice,
    ECONOMY,
    JOBS,
    ILLEGAL_WORK_CFG,
    DOCTOR_CFG,
    { caseManagerMode: "live" }
  );

  res.json(next);
});

app.listen(3000, () => {
  console.log("Web interface running on http://localhost:3000");
});
