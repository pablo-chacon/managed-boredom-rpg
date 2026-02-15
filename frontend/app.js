let state = null;
let config = null;

/*
  Initialize game state and config
*/
async function init() {
  const [stateRes, configRes] = await Promise.all([
    fetch("/reset", { method: "POST" }),
    fetch("/config")
  ]);

  state = await stateRes.json();
  config = await configRes.json();

  render();
}

/*
  Execute weekly step
*/
async function step(choice) {
  if (!state || state.exited) return;

  const res = await fetch("/step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ choice })
  });

  state = await res.json();
  render();
}

/*
  Render UI
*/
function render() {
  if (!state || !config) return;

  const exitCost =
    config.passportCost +
    config.ticketCost +
    config.flightTax;

  const reserveRequirement =
    config.monthlyLivingCost * 5;

  const reserveSatisfied =
    state.hasPassport &&
    state.hasTicket &&
    state.cash >= exitCost + reserveRequirement;

  document.getElementById("status").innerHTML = `
    Month ${state.month + 1}, Week ${state.week}<br>
    Cash: $${state.cash}<br>
    Energy: ${state.energy}<br>
    Status: ${
      state.onWelfare
        ? "On Welfare"
        : state.jobId
        ? "Employed"
        : "Unemployed"
    }<br><br>
    Reserve verification: ${state.exitReserveMonths}/1 month
  `;

  /*
    Button references
  */
  const workBtn = document.getElementById("btn-work");
  const unemploymentBtn = document.getElementById("btn-unemployment");
  const illegalBtn = document.getElementById("btn-illegal");
  const doctorBtn = document.getElementById("btn-doctor");
  const restBtn = document.getElementById("btn-rest");
  const passportBtn = document.getElementById("btn-passport");
  const ticketBtn = document.getElementById("btn-ticket");

  /*
    Core weekly logic buttons
  */
  if (workBtn) {
    workBtn.disabled = !state.jobId || state.onWelfare || state.exited;
  }

  if (unemploymentBtn) {
    unemploymentBtn.disabled = !!state.jobId || state.exited;
  }

  if (illegalBtn) {
    illegalBtn.disabled = state.onWelfare || !!state.jobId || state.exited;
  }

  if (doctorBtn) {
    doctorBtn.disabled = state.exited;
  }

  if (restBtn) {
    restBtn.disabled = state.exited;
  }

  /*
    Passport logic
  */
  if (passportBtn) {
    passportBtn.disabled =
      state.hasPassport ||
      state.passportMonthsLeft > 0 ||
      state.cash < config.passportCost ||
      state.energy < 20 ||
      state.exited;
  }

  /*
    Ticket logic
  */
  if (ticketBtn) {
    ticketBtn.disabled =
      !state.hasPassport ||
      state.cash < (config.ticketCost + config.flightTax) ||
      state.exited;
  }

  /*
    Log output
  */
  const logDiv = document.getElementById("log");
  logDiv.innerHTML = state.log.slice(-20).join("<br>");

  /*
    Exit display
  */
  if (state.exited) {
    logDiv.innerHTML += "<br><br><strong>Exit achieved.</strong>";
  } else if (reserveSatisfied) {
    logDiv.innerHTML += "<br><br><em>Reserve condition currently satisfied.</em>";
  }
}

/*
  Auto-start
*/
window.onload = init;
