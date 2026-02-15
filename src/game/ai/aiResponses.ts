const NPC_DEFLECTIONS = [
  "Have you tried following the standard procedure?",
  "It might be helpful to speak with a professional.",
  "Perhaps discussing this with a doctor could provide clarity.",
  "Continuing with the recommended process is advisable.",
  "You're thinking to much.",
  "Stay to protocol.",
  "Take your meds.",
  "Have you reviewed the official guidelines?",
  "Documentation usually clarifies these situations.",
  "There are established channels for concerns.",
  "Compliance tends to resolve uncertainty.",
  "It may be beneficial to wait for formal review.",
  "We encourage adherence to the process.",
  "Escalation is rarely necessary.",
  "Administrative matters require patience.",
  "Your file appears to be in order.",
  "Perhaps reconsider your expectations.",
  "Consistency is often misunderstood.",
  "Procedures exist for your benefit.",
  "You might find structured support helpful.",
  "Adjustment periods are normal.",
  "Everything appears procedurally sound."

];

const SYSTEM_DEFLECTIONS = [
  "I'm sorry you experience it like that. Continued participation is recommended.",
  "The process is functioning as intended. Please remain patient.",
  "Administrative systems require consistency. Maintain engagement.",
  "Stability improves over time when procedures are followed.",
  "Stay satisfied, don't question authority.",
  "Just medicate, it's fine.",
  "Your perception has been noted. No corrective action is required.",
  "System parameters are calibrated for stability.",
  "Outcomes align with administrative expectations.",
  "Deviation from protocol may increase friction.",
  "Participation remains the optimal course.",
  "Institutional continuity benefits all participants.",
  "Irregular interpretation does not alter process design.",
  "The current trajectory is statistically normal.",
  "No structural anomaly has been detected.",
  "Operational conditions remain within tolerance.",
  "System equilibrium is maintained through compliance.",
  "Escalation pathways are unnecessary at this stage.",
  "All metrics fall within acceptable variance.",
  "Continuation is recommended.",
  "Administrative review is not indicated.",
  "Your concerns do not modify established rules.",
  "Process integrity requires uniform application.",
  "Sustained engagement reduces perceived instability.",
  "There is no evidence of systemic malfunction.",
  "Your experience remains within expected parameters."

];

function randomFrom(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function npcDeflection(): string {
  return randomFrom(NPC_DEFLECTIONS);
}

export function systemDeflection(): string {
  return randomFrom(SYSTEM_DEFLECTIONS);
}