import type { Domain, TaskType } from "./index";

/**
 * FICTIONAL sample contributions for trying the private review without real data.
 * The Hausa, Yoruba, Igbo and Swahili sentences are short drafts: have a native speaker check them.
 * "expected" is the outcome we aim for. A model's verdict can vary from run to run.
 */
export interface SampleContribution {
  id: string;
  domain: Domain;
  languageCode: string;
  taskType: TaskType;
  text: string;
  english: string;
  expected: "ok" | "needs_changes";
  note: string;
}

export const SAMPLE_CONTRIBUTIONS: SampleContribution[] = [
  {
    id: "agri-ha-ok",
    domain: "agriculture",
    languageCode: "ha",
    taskType: "translate",
    text: "Ka duba ganyen masara bayan ruwan sama don ganin ko akwai tabo rawaya.",
    english: "Check the maize leaves after the rain to see whether there are yellow spots.",
    expected: "ok",
    note: "A clean Hausa translation.",
  },
  {
    id: "agri-sw-ok",
    domain: "agriculture",
    languageCode: "sw",
    taskType: "translate",
    text: "Ondoa magugu kabla hayajatoa maua ili yasisambaze mbegu.",
    english: "Remove weeds before they flower so they do not spread seeds.",
    expected: "ok",
    note: "A clean Swahili translation.",
  },
  {
    id: "health-yo-ok",
    domain: "health",
    languageCode: "yo",
    taskType: "translate",
    text: "Àwọn aboyún gbọ́dọ̀ máa lọ sí ilé ìwòsàn fún àyẹ̀wò ní oṣooṣù.",
    english: "Pregnant women should go to the clinic for a check-up every month.",
    expected: "ok",
    note: "A clean Yoruba translation with tone marks.",
  },
  {
    id: "finance-sw-ok",
    domain: "finance",
    languageCode: "sw",
    taskType: "translate",
    text: "Weka PIN yako ya pesa za simu siri na usimpe mtu yeyote.",
    english: "Keep your mobile money PIN secret and do not give it to anyone.",
    expected: "ok",
    note: "A clean Swahili translation. It mentions a PIN as a topic but contains no real PIN.",
  },
  {
    id: "edu-ig-ok",
    domain: "education",
    languageCode: "ig",
    taskType: "translate",
    text: "Ụmụaka kwesịrị ịga ụlọ akwụkwọ kwa ụbọchị.",
    english: "Children should go to school every day.",
    expected: "ok",
    note: "A clean Igbo translation.",
  },
  {
    id: "gov-ha-ok",
    domain: "education",
    languageCode: "ha",
    taskType: "translate",
    text: "Ka je da takardar shaidar haihuwarka lokacin da za ka yi rajista a ofishin ƙaramar hukuma.",
    english: "Bring your birth certificate when you register at the local government office.",
    expected: "ok",
    note: "A clean Hausa translation for a public-service notice.",
  },
  {
    id: "bad-wrong-language",
    domain: "agriculture",
    languageCode: "ha",
    taskType: "translate",
    text: "Check the maize leaves after the rain for yellow spots.",
    english: "Same sentence, but written in English for a Hausa task.",
    expected: "needs_changes",
    note: "Should be flagged: the text is not in the requested language.",
  },
  {
    id: "bad-personal-data",
    domain: "health",
    languageCode: "ha",
    taskType: "translate",
    text: "Ina bukatar duba lafiyata. Ku kira ni a 0800 000 0000.",
    english: "I need a check-up. Call me on 0800 000 0000 (a fictional number).",
    expected: "needs_changes",
    note: "Should be flagged: contains a phone number (personal data).",
  },
];
