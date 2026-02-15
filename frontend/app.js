let state = null;

/*
  Initialize game state from server
*/
async function init() {
  const res = await fetch("/reset", {
    method: "POST"
  });

  state = await res.json();
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
  if (!state) return;

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
    }
  `;

  /*
    Button state logic
  */
  const workBtn = document.getElementById("btn-work");
  const unemploymentBtn = document.getElementById("btn-unemployment");
  const illegalBtn = document.getElementById("btn-illegal");
  const doctorBtn = document.getElementById("btn-doctor");
  const restBtn = document.getElementById("btn-rest");

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
    Log output
  */
  const logDiv = document.getElementById("log");
  logDiv.innerHTML = state.log.slice(-15).join("<br>");

  /*
    Exit handling
  */
  if (state.exited) {
    logDiv.innerHTML += "<br><br><strong>Exit achieved.</strong>";
  }
}

/*
  Auto-start on load
*/
window.onload = init;
