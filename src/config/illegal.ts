export const ILLEGAL_WORK_CFG = {
  bustChance: 0.20,
  incomeCoveragePct: 1.40,

  energyDrainRange: [8, 26] as const,

  postBustEnergyMin: 5,
  postBustEnergyMax: 8,

  activities: [
    {
      id: "host",
      label: "Hosted a underground rave",
      energyDrain: [8, 12] as const,
    },
    {
      id: "dealing",
      label: "Sell prohibited stuff",
      energyDrain: [14, 18] as const,
    },
    {
      id: "fraud_assist",
      label: "Administrative fraud assistance",
      energyDrain: [14, 18] as const,
    },
    {
      id: "courier",
      label: "Unregistered courier work",
      energyDrain: [10, 14] as const,
    },
    {
      id: "cash_labor",
      label: "Cash-in-hand labor",
      energyDrain: [12, 16] as const,
    },
    {
      id: "smuggling",
      label: "Low-level smuggling task",
      energyDrain: [18, 22] as const,
    },
    {
      id: "violent_collection",
      label: "Debt collection activity",
      energyDrain: [20, 26] as const,
    },
  ],
};
