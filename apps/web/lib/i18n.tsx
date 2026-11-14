"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@afrikcompute/shared";

/**
 * DRAFT TRANSLATIONS: the Hausa, Yoruba and Igbo strings were machine-drafted and have not been
 * reviewed by native speakers. Have a native speaker review them before launch.
 */
const en = {
  start: "Get started", resources: "Resources", proof: "Proof",
  searchPlaceholder: "Search docs, endpoints, tasks", searchLabel: "Search",
  connect: "Connect wallet", signIn: "Sign in", signOut: "Sign out",
  groupDocs: "Docs", groupApi: "API", groupTasks: "Tasks", groupDatasets: "Datasets",
  heroTitle: "Datasets for African languages, reviewed privately and paid for on NEAR.",
  heroSub: "Contribute or request text data in Hausa, Yorùbá, Igbo and more. Every review runs inside a TEE, and you can check the proof yourself.",
  cta1: "Start contributing", cta2: "Read the API docs",
  startTitle: "Get started", startSub: "Pick your role.",
  tabContributor: "I contribute data", tabRequester: "I request data",
  contributor: [
    ["Connect a wallet", "Sign in with your NEAR testnet account."],
    ["Pick a task", "Choose a language and a task type."],
    ["Submit your work", "A TEE reviews it privately. Your text is stored encrypted."],
    ["Get paid", "Approved work pays out through NEAR Intents."],
  ],
  requester: [
    ["Connect a wallet", "Sign in to post requests."],
    ["Post a request", "Set the language, task type and reward."],
    ["Review with proof", "Each review shows what the TEE attested."],
    ["Approve and pay", "Approve good work to release the payout."],
  ],
  proofTitle: "See the proof for yourself",
  proofText: "Run a private review and the Verified panel lists every attestation check. It also lists what we do not check yet.",
  proofCta: "Try a private review",
  resourcesTitle: "Resources and APIs",
  res: [
    ["API reference", "Endpoints for tasks, datasets and payouts."],
    ["Agents on Intents", "Agent API overview for payments."],
    ["TEE verification", "What is checked on every private run."],
    ["Sample datasets", "Fictional data to try the flow."],
  ],
  footer: "Built for the NEAR hackathon, Privacy and Private AI track.",
  proofNone: "No private run yet", proofOk: "Verified in TEE", proofBad: "Not fully verified",
};
type Strings = typeof en;

const ha: Strings = {
  start: "Fara", resources: "Albarkatu", proof: "Shaida",
  searchPlaceholder: "Nemi takardu, API, ayyuka", searchLabel: "Bincike",
  connect: "Haɗa walat", signIn: "Shiga", signOut: "Fita",
  groupDocs: "Takardu", groupApi: "API", groupTasks: "Ayyuka", groupDatasets: "Bayanai",
  heroTitle: "Bayanai na harsunan Afirka, ana duba su a asirce, ana biyan ka a NEAR.",
  heroSub: "Ka bayar ko ka nemi bayanan rubutu cikin Hausa, Yarbanci, Igbo da sauransu. Kowane bincike yana gudana cikin TEE, kuma za ka iya tabbatar da shaidar da kanka.",
  cta1: "Fara bayar da bayanai", cta2: "Karanta takardun API",
  startTitle: "Fara", startSub: "Zaɓi matsayinka.",
  tabContributor: "Ina bayar da bayanai", tabRequester: "Ina neman bayanai",
  contributor: [
    ["Haɗa walat", "Shiga da asusun NEAR na gwaji."],
    ["Zaɓi aiki", "Zaɓi harshe da nau'in aiki."],
    ["Aika aikinka", "TEE yana duba shi a asirce. Ana adana rubutunka a ɓoye."],
    ["Karɓi kuɗi", "Ana biyan aikin da aka amince da shi ta NEAR Intents."],
  ],
  requester: [
    ["Haɗa walat", "Shiga domin sanya buƙata."],
    ["Sanya buƙata", "Saita harshe, nau'in aiki da lada."],
    ["Duba da shaida", "Kowane bincike yana nuna abin da TEE ya tabbatar."],
    ["Amince ka biya", "Amince da aiki mai kyau don a saki biyan."],
  ],
  proofTitle: "Ka ga shaidar da kanka",
  proofText: "Yi bincike na sirri, kuma allon Tabbatarwa zai jera duk binciken shaida. Zai kuma nuna abubuwan da ba mu bincika ba tukuna.",
  proofCta: "Gwada bincike na sirri",
  resourcesTitle: "Albarkatu da API",
  res: [
    ["Takardun API", "Hanyoyin API don ayyuka, bayanai da biyan kuɗi."],
    ["Agents on Intents", "Bayanin Agent API don biyan kuɗi."],
    ["Tabbatar da TEE", "Abin da aka bincika a kowane gudu na sirri."],
    ["Samfurin bayanai", "Bayanan ƙage don gwada tsarin."],
  ],
  footer: "An gina don gasar NEAR, sashen Sirri da AI na Sirri.",
  proofNone: "Ba a yi bincike ba tukuna", proofOk: "An tabbatar a TEE", proofBad: "Ba a tabbatar gaba ɗaya ba",
};

const yo: Strings = {
  start: "Bẹ̀rẹ̀", resources: "Àwọn ohun èlò", proof: "Ẹ̀rí",
  searchPlaceholder: "Wá ìwé, API, iṣẹ́", searchLabel: "Wá",
  connect: "So àpamọ́wọ́ pọ̀", signIn: "Wọlé", signOut: "Jáde",
  groupDocs: "Ìwé", groupApi: "API", groupTasks: "Iṣẹ́", groupDatasets: "Dátà",
  heroTitle: "Dátà fún àwọn èdè Áfíríkà, tí a ṣàyẹ̀wò ní ìkọ̀kọ̀, tí a sì sanwó fún lórí NEAR.",
  heroSub: "Ṣe ìtọrẹ tàbí béèrè dátà ọ̀rọ̀ ní èdè Hausa, Yorùbá, Igbo àti àwọn mìíràn. Gbogbo àyẹ̀wò ń ṣiṣẹ́ nínú TEE, o sì lè jẹ́rìí sí ẹ̀rí náà fúnra rẹ.",
  cta1: "Bẹ̀rẹ̀ ìtọrẹ", cta2: "Ka ìwé API",
  startTitle: "Bẹ̀rẹ̀", startSub: "Yan ipa rẹ.",
  tabContributor: "Mo ń fúnni ní dátà", tabRequester: "Mo ń béèrè dátà",
  contributor: [
    ["So àpamọ́wọ́ pọ̀", "Wọlé pẹ̀lú àkọọ́lẹ̀ NEAR testnet rẹ."],
    ["Yan iṣẹ́", "Yan èdè àti irú iṣẹ́."],
    ["Fi iṣẹ́ rẹ ránṣẹ́", "TEE yóò ṣàyẹ̀wò rẹ̀ ní ìkọ̀kọ̀. A fi ọ̀rọ̀ rẹ pamọ́ ní ìkọ̀kọ̀."],
    ["Gba owó", "A ń san iṣẹ́ tí a fọwọ́sí nípasẹ̀ NEAR Intents."],
  ],
  requester: [
    ["So àpamọ́wọ́ pọ̀", "Wọlé láti fi ìbéèrè sílẹ̀."],
    ["Fi ìbéèrè sílẹ̀", "Yan èdè, irú iṣẹ́ àti owó ẹ̀bùn."],
    ["Ṣàyẹ̀wò pẹ̀lú ẹ̀rí", "Àyẹ̀wò kọ̀ọ̀kan fi ohun tí TEE jẹ́rìí sí hàn."],
    ["Fọwọ́sí kí o sì san owó", "Fọwọ́sí iṣẹ́ tó dára láti tú owó náà sílẹ̀."],
  ],
  proofTitle: "Wo ẹ̀rí fúnra rẹ",
  proofText: "Ṣe àyẹ̀wò ìkọ̀kọ̀, pánẹ́ẹ̀lì Ìjẹ́rìísí yóò sì ṣe àtòjọ gbogbo àyẹ̀wò ẹ̀rí. Yóò tún fi àwọn ohun tí a kò tíì ṣàyẹ̀wò hàn.",
  proofCta: "Gbìyànjú àyẹ̀wò ìkọ̀kọ̀",
  resourcesTitle: "Àwọn ohun èlò àti API",
  res: [
    ["Ìwé API", "Àwọn ọ̀nà API fún iṣẹ́, dátà àti ìsanwó."],
    ["Agents on Intents", "Àkópọ̀ Agent API fún ìsanwó."],
    ["Ìjẹ́rìísí TEE", "Ohun tí a ṣàyẹ̀wò nínú gbogbo ìṣiṣẹ́ ìkọ̀kọ̀."],
    ["Dátà àpẹẹrẹ", "Dátà àròsọ láti gbìyànjú ètò náà."],
  ],
  footer: "A kọ́ ọ fún ìdíje NEAR, ẹ̀ka Ìpamọ́ àti AI Ìkọ̀kọ̀.",
  proofNone: "A kò tíì ṣe àyẹ̀wò", proofOk: "A ti jẹ́rìí sí i nínú TEE", proofBad: "A kò jẹ́rìí sí i pátápátá",
};

const ig: Strings = {
  start: "Malite", resources: "Akụrụngwa", proof: "Ihe akaebe",
  searchPlaceholder: "Chọọ akwụkwọ, API, ọrụ", searchLabel: "Chọọ",
  connect: "Jikọọ wallet", signIn: "Banye", signOut: "Pụọ",
  groupDocs: "Akwụkwọ", groupApi: "API", groupTasks: "Ọrụ", groupDatasets: "Data",
  heroTitle: "Data maka asụsụ Africa, a na-enyocha ya na nzuzo, a na-akwụ gị ụgwọ na NEAR.",
  heroSub: "Nye ma ọ bụ rịọ data ederede n'asụsụ Hausa, Yoruba, Igbo na ndị ọzọ. Nyocha ọ bụla na-eme n'ime TEE, ị nwekwara ike ịlele ihe akaebe n'onwe gị.",
  cta1: "Malite inye data", cta2: "Gụọ akwụkwọ API",
  startTitle: "Malite", startSub: "Họrọ ọrụ gị.",
  tabContributor: "Ana m enye data", tabRequester: "Ana m arịọ data",
  contributor: [
    ["Jikọọ wallet", "Banye site n'akaụntụ NEAR testnet gị."],
    ["Họrọ ọrụ", "Họrọ asụsụ na ụdị ọrụ."],
    ["Zipu ọrụ gị", "TEE ga-enyocha ya na nzuzo. A na-echekwa ederede gị n'ụdị zoro ezo."],
    ["Nweta ụgwọ", "A na-akwụ ọrụ a kwadoro site na NEAR Intents."],
  ],
  requester: [
    ["Jikọọ wallet", "Banye ka i wee tinye arịrịọ."],
    ["Tinye arịrịọ", "Tọọ asụsụ, ụdị ọrụ na ụgwọ ọrụ."],
    ["Lelee ya na ihe akaebe", "Nyocha ọ bụla na-egosi ihe TEE kwadoro."],
    ["Kwado ma kwụọ ụgwọ", "Kwado ọrụ ọma ka a tọhapụ ụgwọ."],
  ],
  proofTitle: "Hụ ihe akaebe n'onwe gị",
  proofText: "Mee nyocha nzuzo, bọọdụ Nkwenye ga-edepụta nyocha akaebe niile. Ọ ga-edepụtakwa ihe anyị anaghị enyocha ugbu a.",
  proofCta: "Nwaa nyocha nzuzo",
  resourcesTitle: "Akụrụngwa na API",
  res: [
    ["Akwụkwọ API", "Ụzọ API maka ọrụ, data na ịkwụ ụgwọ."],
    ["Agents on Intents", "Nchịkọta Agent API maka ịkwụ ụgwọ."],
    ["Nkwenye TEE", "Ihe a nyochara n'ọ bụla n'ime ọrụ nzuzo."],
    ["Data ihe atụ", "Data ụgha iji nwaa usoro a."],
  ],
  footer: "E wuru ya maka asọmpi NEAR, ngalaba Nzuzo na AI Nzuzo.",
  proofNone: "Emebeghị nyocha", proofOk: "Ekwenyela na TEE", proofBad: "Ekwenyeghị kpamkpam",
};

const dict: Record<Locale, Strings> = { en, ha, yo, ig };
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ha", label: "Hausa" },
  { code: "yo", label: "Yorùbá" },
  { code: "ig", label: "Igbo" },
];

const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: Strings }>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("afrik.locale") as Locale | null;
      if (saved && saved in dict) setLocaleState(saved);
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("afrik.locale", l);
    } catch {}
  };
  return <Ctx.Provider value={{ locale, setLocale, t: dict[locale] }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
