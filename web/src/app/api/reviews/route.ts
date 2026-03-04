import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { obstructionGrade, riskLevel, symptomBurden, treatmentStep } from "@/lib/kols";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const reviewYear = Number(body.reviewYear);
  if (!body.patientId || !reviewYear) return NextResponse.json({ error: "Mangler patientId/reviewYear" }, { status: 400 });

  const patient = await prisma.patient.findFirst({ where: { id: body.patientId, ownerId: auth.userId } });
  if (!patient) return NextResponse.json({ error: "Pasient ikke funnet for innlogget bruker" }, { status: 404 });

  const generated = {
    obstructionGrade: obstructionGrade(body.fev1PercentPred),
    symptomBurden: symptomBurden(body.catScore, body.mmrc),
    riskLevel: riskLevel(body.exacerbationsLast12m, body.hospitalizationsLast12m),
    treatmentStepSuggestion: treatmentStep(body),
  };

  const created = await prisma.annualReview.create({
    data: {
      patientId: body.patientId,
      reviewYear,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
      createdById: auth.userId,
      catScore: body.catScore ?? null,
      catQ1: body.catQ1 ?? null,
      catQ2: body.catQ2 ?? null,
      catQ3: body.catQ3 ?? null,
      catQ4: body.catQ4 ?? null,
      catQ5: body.catQ5 ?? null,
      catQ6: body.catQ6 ?? null,
      catQ7: body.catQ7 ?? null,
      catQ8: body.catQ8 ?? null,
      mmrc: body.mmrc ?? null,
      exacerbationsLast12m: body.exacerbationsLast12m ?? null,
      hospitalizationsLast12m: body.hospitalizationsLast12m ?? null,
      fev1L: body.fev1L ?? null,
      fev1PercentPred: body.fev1PercentPred ?? null,
      fvcL: body.fvcL ?? null,
      fev1Fvc: body.fev1Fvc ?? null,
      spo2: body.spo2 ?? null,
      eosinophils: body.eosinophils ?? null,
      smokeStatus: body.smokeStatus ? body.smokeStatus : null,
      smokingActive: typeof body.smokingActive === "boolean" ? body.smokingActive : null,
      packYears: body.packYears ?? null,
      heightCm: body.heightCm ?? null,
      weightKg: body.weightKg ?? null,
      bmi: body.bmi ?? null,
      chestXrayYear: body.chestXrayYear ?? null,
      chestXrayMonth: body.chestXrayMonth ?? null,
      spirometryDate: body.spirometryDate ? new Date(body.spirometryDate) : null,
      comorbCvd: !!body.comorbCvd,
      comorbKidneyDisease: !!body.comorbKidneyDisease,
      comorbDiabetesMetSyn: !!body.comorbDiabetesMetSyn,
      comorbOsteoporosis: !!body.comorbOsteoporosis,
      comorbAnxietyDepression: !!body.comorbAnxietyDepression,
      medLaba: !!body.medLaba,
      medLama: !!body.medLama,
      medIcs: !!body.medIcs,
      medSama: !!body.medSama,
      medSaba: !!body.medSaba,
      medPde4: !!body.medPde4,
      influenzaDate: body.influenzaDate ? new Date(body.influenzaDate) : null,
      pneumococcalDate: body.pneumococcalDate ? new Date(body.pneumococcalDate) : null,
      covidDate: body.covidDate ? new Date(body.covidDate) : null,
      rsvDate: body.rsvDate ? new Date(body.rsvDate) : null,
      notes: body.notes ?? null,
      planOrTiltak: body.planOrTiltak ?? null,
      ...generated,
    },
  });

  return NextResponse.json(created);
}
