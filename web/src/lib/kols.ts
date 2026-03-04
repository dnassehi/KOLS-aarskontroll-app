export type KolsInput = {
  catScore?: number | null;
  mmrc?: number | null;
  exacerbationsLast12m?: number | null;
  hospitalizationsLast12m?: number | null;
  fev1PercentPred?: number | null;
  eosinophils?: number | null;
  spo2?: number | null;

  medLaba?: boolean;
  medLama?: boolean;
  medIcs?: boolean;
  medSama?: boolean;
  medSaba?: boolean;
  medPde4?: boolean;

  influenzaDate?: string | Date | null;
  pneumococcalDate?: string | Date | null;
  covidDate?: string | Date | null;
  rsvDate?: string | Date | null;
};

export function obstructionGrade(fev1PercentPred?: number | null) {
  if (fev1PercentPred == null) return "Mangler data";
  if (fev1PercentPred > 80) return "Mild grad";
  if (fev1PercentPred >= 50) return "Moderat grad";
  if (fev1PercentPred >= 30) return "Alvorlig grad";
  return "Svært alvorlig grad";
}

export function symptomBurden(catScore?: number | null, mmrc?: number | null) {
  if (catScore == null && mmrc == null) return "Mangler data";
  if ((catScore ?? -1) >= 10 || (mmrc ?? -1) >= 2) return "Høy symptombelastning";
  return "Lav symptombelastning";
}

export function riskLevel(exacerbations?: number | null, hospitalizations?: number | null) {
  if (exacerbations == null && hospitalizations == null) return "Mangler data";
  if ((exacerbations ?? 0) >= 2 || (hospitalizations ?? 0) >= 1) return "Høy risiko";
  return "Lav risiko";
}

function hasDate(v?: string | Date | null) {
  if (!v) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

function dateWithinMonths(v?: string | Date | null, months = 12) {
  if (!v) return false;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return false;
  const limit = new Date();
  limit.setMonth(limit.getMonth() - months);
  return d >= limit;
}

// Sammenligner registrert behandling/vaksiner med nasjonale hovedforslag for stabil KOLS.
export function treatmentStep(i: KolsInput) {
  const highSymptoms = (i.catScore ?? -1) >= 10 || (i.mmrc ?? -1) >= 2;
  const highRisk = (i.exacerbationsLast12m ?? 0) >= 2 || (i.hospitalizationsLast12m ?? 0) >= 1;

  const hasBronchodilator = !!(i.medLama || i.medLaba);
  const hasDualBronchodilator = !!(i.medLama && i.medLaba);
  const hasIcs = !!i.medIcs;

  const medAdvice: string[] = [];
  if (!highSymptoms && !highRisk) {
    if (!(i.medSaba || i.medSama)) medAdvice.push("Vurder behovsmedisin (SABA/SAMA)");
  }

  if (highSymptoms && !hasBronchodilator) {
    medAdvice.push("Anbefalt vedlikehold: start LAMA eller LABA");
  }

  if (highSymptoms && highRisk && !hasDualBronchodilator) {
    medAdvice.push("Anbefalt vedlikehold: LAMA + LABA");
  }

  const icsIndication = ((i.exacerbationsLast12m ?? 0) > 2) || ((i.hospitalizationsLast12m ?? 0) > 1) || ((i.eosinophils ?? 0) >= 300);
  if (highRisk && icsIndication && !hasIcs) {
    medAdvice.push("Vurder tillegg av ICS (høy risiko/eosinofile)");
  }

  const vaccineAdvice: string[] = [];
  if (!dateWithinMonths(i.influenzaDate, 12)) vaccineAdvice.push("Influensavaksine (årlig)");
  if (!hasDate(i.pneumococcalDate)) vaccineAdvice.push("Pneumokokkvaksine");
  if (!hasDate(i.covidDate)) vaccineAdvice.push("Oppdatert covid-vaksine iht. gjeldende råd");
  if (!hasDate(i.rsvDate)) vaccineAdvice.push("Vurder RSV-vaksine");

  const baseStep = !highSymptoms && !highRisk
    ? "Trinn 1: Lav symptom/risiko"
    : highSymptoms && !highRisk
      ? "Trinn 2: Symptomdrevet behandling"
      : highSymptoms && highRisk
        ? "Trinn 3: Høy symptom + høy risiko"
        : "Trinn 2: Behov for vedlikeholdsbehandling";

  const gaps: string[] = [];
  if (medAdvice.length) gaps.push(`Medikasjon: ${medAdvice.join("; ")}`);
  if (vaccineAdvice.length) gaps.push(`Vaksiner: ${vaccineAdvice.join("; ")}`);

  return gaps.length ? `${baseStep}. Forslag basert på registrerte aktive tiltak -> ${gaps.join(" | ")}.` : `${baseStep}. Registrerte aktive medisiner/vaksiner er i tråd med hovedforslag.`;
}

export function compactJournalNote(data: {
  year: number;
  catScore?: number | null;
  mmrc?: number | null;
  exacerbationsLast12m?: number | null;
  hospitalizationsLast12m?: number | null;
  fev1L?: number | null;
  fev1PercentPred?: number | null;
  fvcL?: number | null;
  fev1Fvc?: number | null;
  smokingActive?: boolean | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  chestXrayYear?: number | null;
  chestXrayMonth?: number | null;
  spirometryDate?: string | null;
  reviewDate?: string | null;
  comorbidities?: string[];
  meds: string[];
  plan?: string | null;
}) {
  const bmiCategory = data.bmi == null
    ? "ikke vurderbar"
    : data.bmi < 18.5
      ? "undervekt"
      : data.bmi < 25
        ? "normalvekt"
        : data.bmi < 30
          ? "overvekt"
          : "fedme";
  const obstruction = obstructionGrade(data.fev1PercentPred);
  const sym = symptomBurden(data.catScore, data.mmrc);
  const risk = riskLevel(data.exacerbationsLast12m, data.hospitalizationsLast12m);
  return [
    `KOLS årskontroll ${data.year}`,
    "",
    "Symptomer og risiko",
    `- CAT: ${data.catScore ?? "mangler"}`,
    `- mMRC: ${data.mmrc ?? "mangler"}`,
    `- Eksaserbasjoner siste 12 mnd: ${data.exacerbationsLast12m ?? "mangler"}`,
    `- Innleggelser siste 12 mnd: ${data.hospitalizationsLast12m ?? "mangler"}`,
    `- Obstruksjonsgrad: ${obstruction}`,
    `- Symptombelastning: ${sym}`,
    `- Risiko: ${risk}`,
    "",
    "Spirometri og målinger",
    `- Dato for utfylling: ${data.reviewDate ?? "ikke registrert"}`,
    `- Dato for spirometri: ${data.spirometryDate ?? "ikke registrert"}`,
    `- FEV1: ${data.fev1L ?? "mangler"} L/s`,
    `- FEV1 % pred: ${data.fev1PercentPred ?? "mangler"}`,
    `- FVC: ${data.fvcL ?? "mangler"} L`,
    `- FEV1/FVC: ${data.fev1Fvc ?? "mangler"}`,
    `- Røyker nå: ${data.smokingActive == null ? "ikke registrert" : data.smokingActive ? "Ja" : "Nei"}`,
    `- Høyde/vekt/BMI: ${data.heightCm ?? "mangler"} cm / ${data.weightKg ?? "mangler"} kg / ${data.bmi == null ? "mangler" : data.bmi.toFixed(2)} (${bmiCategory})`,
    `- Røntgen thorax sist tatt: ${data.chestXrayMonth && data.chestXrayYear ? `${String(data.chestXrayMonth).padStart(2, "0")}/${data.chestXrayYear}` : (data.chestXrayYear ?? "ikke registrert")}`,
    "",
    "Komorbiditet og behandling",
    `- Komorbiditeter: ${data.comorbidities && data.comorbidities.length ? data.comorbidities.join(", ") : "ingen registrert"}`,
    `- Medikamenter: ${data.meds.length ? data.meds.join(", ") : "ingen registrert"}`,
    "",
    "Plan",
    `- ${data.plan || "Revurdering ved neste kontroll."}`,
  ].join("\n");
}
