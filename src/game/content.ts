export type EnergyBand = "LOW" | "MEDIUM" | "HIGH";


export const ENERGY_BANDS: Record<EnergyBand, { min: number; max: number }> = {
  LOW: { min: 0, max: 25 },
  MEDIUM: { min: 26, max: 70 },
  HIGH: { min: 71, max: 100 },
};


export const MONTHLY_HEADERS = [
  "Status review initiated.",
  "Compliance period concluded.",
  "Administrative cycle completed.",
  "Wellbeing assessment recorded.",
  "Productivity interval logged.",
];


export const INVALID_INPUT_MESSAGES = [
  "Invalid input.",
  "Invalid life choice.",
  "Selection not recognized.",
  "Request outside permitted parameters.",
];

export const REST_DESCRIPTIONS = [
  "Rest acknowledged.",
  "Recovery period logged.",
  "Non-productive interval recorded.",
];


export const UNEMPLOYMENT_DESCRIPTIONS = [
  "Active participation recorded.",
  "Engagement metrics updated.",
  "Availability confirmed.",
];


export const EXIT_MESSAGES = [
  "Exit conditions satisfied.",
  "Travel authorization confirmed.",
  "Departure approved.",
];


export const UNEMPLOYMENT_TEXT = {
  participation: "Active participation in employment support program recorded.",
  applications: (n: number) => `${n} job applications submitted.`,
  stipend: (amount: number) => `Participation compensation paid: $${amount}.`,
  probabilityAdjusted: "Employment probability adjusted.",
  matchFound: "Employment opportunity matched.",
  independentSearch: "Independent job search noted.",
  forcedSupport: "Additional support activity scheduled.",
  caseClosed: "Unemployment case closed.",
};


export const CV_COURSE_TEXT = {
  attended: "CV Writing Course attended.",
  delivered: "Course content delivered.",
  placeholder:
    "Course material consists of standardized professional self-descriptions.",
  loremHint:
    "Participants are advised to rephrase existing competencies where applicable.",
};


export const DOCTOR_TEXT = {
  appointment: "Doctor appointment completed.",
  acknowledged: "Experience acknowledged.",
  treatment: "Standard treatment recommended.",
  prescription: "Prescription issued.",
  notPurchased: "Medication not purchased.",
  followUp: "Follow-up recommended.",
  purchased: (cost: number) => `Medication purchased for $${cost}.`,
  activated: "Wellbeing plan activated.",
};

