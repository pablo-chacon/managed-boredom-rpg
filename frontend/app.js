let state = null;
let seed = 1337;

async function step(choice) {
  const res = await fetch("/step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, choice, seed })
  });

  state = await res.json();
  render();
}

function render() {
  document.getElementById("status").innerHTML = `
    Month ${state.month + 1}, Week ${state.week}<br>
    Cash: $${state.cash}<br>
    Energy: ${state.energy}<br>
    Status: ${state.onWelfare ? "On Welfare" : state.jobId ? "Employed" : "Unemployed"}
  `;

  const logDiv = document.getElementById("log");
  logDiv.innerHTML = state.log.slice(-15).join("<br>");
}
