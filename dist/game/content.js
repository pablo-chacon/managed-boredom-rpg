"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCTOR_TEXT = exports.CV_COURSE_TEXT = exports.UNEMPLOYMENT_TEXT = exports.EXIT_MESSAGES = exports.UNEMPLOYMENT_DESCRIPTIONS = exports.REST_DESCRIPTIONS = exports.INVALID_INPUT_MESSAGES = exports.MONTHLY_HEADERS = exports.ENERGY_BANDS = void 0;
exports.ENERGY_BANDS = {
    LOW: { min: 0, max: 25 },
    MEDIUM: { min: 26, max: 70 },
    HIGH: { min: 71, max: 100 },
};
exports.MONTHLY_HEADERS = [
    "Status review initiated.",
    "Compliance period concluded.",
    "Administrative cycle completed.",
    "Wellbeing assessment recorded.",
    "Productivity interval logged.",
];
exports.INVALID_INPUT_MESSAGES = [
    "Invalid input.",
    "Invalid life choice.",
    "Selection not recognized.",
    "Request outside permitted parameters.",
];
exports.REST_DESCRIPTIONS = [
    "Rest acknowledged.",
    "Recovery period logged.",
    "Non-productive interval recorded.",
];
exports.UNEMPLOYMENT_DESCRIPTIONS = [
    "Active participation recorded.",
    "Engagement metrics updated.",
    "Availability confirmed.",
];
exports.EXIT_MESSAGES = [
    "Exit conditions satisfied.",
    "Travel authorization confirmed.",
    "Departure approved.",
];
exports.UNEMPLOYMENT_TEXT = {
    participation: "Active participation in employment support program recorded.",
    applications: (n) => `${n} job applications submitted.`,
    stipend: (amount) => `Participation compensation paid: $${amount}.`,
    probabilityAdjusted: "Employment probability adjusted.",
    matchFound: "Employment opportunity matched.",
    independentSearch: "Independent job search noted.",
    forcedSupport: "Additional support activity scheduled.",
    caseClosed: "Unemployment case closed.",
};
exports.CV_COURSE_TEXT = {
    attended: "CV Writing Course attended.",
    delivered: "Course content delivered.",
    placeholder: "Course material consists of standardized professional self-descriptions.",
    loremHint: "Participants are advised to rephrase existing competencies where applicable.",
};
exports.DOCTOR_TEXT = {
    appointment: "Doctor appointment completed.",
    acknowledged: "Experience acknowledged.",
    treatment: "Standard treatment recommended.",
    prescription: "Prescription issued.",
    notPurchased: "Medication not purchased.",
    followUp: "Follow-up recommended.",
    purchased: (cost) => `Medication purchased for $${cost}.`,
    activated: "Wellbeing plan activated.",
};
