import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { obstructionGrade, riskLevel, symptomBurden, treatmentStep } from "@/lib/kols";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { patientId, fromYear, toYear } = await req.json();
  if (!patientId || !fromYear || !toYear) return NextResponse.json({ error: "Mangler data" }, { status: 400 });

  const patient = await prisma.patient.findFirst({ where: { id: patientId, ownerId: auth.userId } });
  if (!patient) return NextResponse.json({ error: "Pasient ikke funnet for innlogget bruker" }, { status: 404 });

  const prev = await prisma.annualReview.findFirst({
    where: { patientId, reviewYear: Number(fromYear) },
  });

  if (!prev) return NextResponse.json({ error: "Fant ikke forrige år" }, { status: 404 });

  const created = await prisma.annualReview.create({
    data: {
      patientId,
      reviewYear: Number(toYear),
      createdById: auth.userId,
      smokeStatus: prev.smokeStatus,
      smokingActive: prev.smokingActive,
      packYears: prev.packYears,
      heightCm: null,
      weightKg: null,
      bmi: null,
      chestXrayYear: prev.chestXrayYear,
      chestXrayMonth: prev.chestXrayMonth,
      spirometryDate: prev.spirometryDate,
      comorbCvd: prev.comorbCvd,
      comorbKidneyDisease: prev.comorbKidneyDisease,
      comorbDiabetesMetSyn: prev.comorbDiabetesMetSyn,
      comorbOsteoporosis: prev.comorbOsteoporosis,
      comorbAnxietyDepression: prev.comorbAnxietyDepression,
      receivesPhysiotherapy: prev.receivesPhysiotherapy,
      lastRehabYear: prev.lastRehabYear,
      medLaba: prev.medLaba,
      medLama: prev.medLama,
      medIcs: prev.medIcs,
      medSama: prev.medSama,
      medSaba: prev.medSaba,
      medPde4: prev.medPde4,
      influenzaDate: prev.influenzaDate,
      pneumococcalDate: prev.pneumococcalDate,
      covidDate: prev.covidDate,
      rsvDate: prev.rsvDate,
      notes: prev.notes,
      planOrTiltak: prev.planOrTiltak,

      // nullstilles alltid
      catScore: null,
      catQ1: null,
      catQ2: null,
      catQ3: null,
      catQ4: null,
      catQ5: null,
      catQ6: null,
      catQ7: null,
      catQ8: null,
      mmrc: null,
      exacerbationsLast12m: null,
      hospitalizationsLast12m: null,
      fev1L: null,
      fev1PercentPred: null,
      fvcL: null,
      fev1Fvc: null,
      responseTestSaba: prev.responseTestSaba,
      responseTestSama: prev.responseTestSama,
      postFev1L: null,
      postFev1PercentPred: null,
      postFvcL: null,
      postFev1Fvc: null,
      gliAge: prev.gliAge,
      gliSex: prev.gliSex,
      gliEthnicity: prev.gliEthnicity,
      spo2: null,
      eosinophils: null,

      obstructionGrade: obstructionGrade(null),
      symptomBurden: symptomBurden(null, null),
      riskLevel: riskLevel(null, null),
      treatmentStepSuggestion: treatmentStep({}),
    },
  });

  return NextResponse.json(created);
}
