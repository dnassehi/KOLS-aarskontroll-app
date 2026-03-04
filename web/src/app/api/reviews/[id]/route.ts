import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { obstructionGrade, riskLevel, symptomBurden, treatmentStep } from "@/lib/kols";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const review = await prisma.annualReview.findUnique({ where: { id }, include: { patient: true } });
  if (!review || review.patient.ownerId !== auth.userId) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  return NextResponse.json(review);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.annualReview.findUnique({ where: { id }, include: { patient: true } });
  if (!existing || existing.patient.ownerId !== auth.userId) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }

  const generated = {
    obstructionGrade: obstructionGrade(body.fev1PercentPred),
    symptomBurden: symptomBurden(body.catScore, body.mmrc),
    riskLevel: riskLevel(body.exacerbationsLast12m, body.hospitalizationsLast12m),
    treatmentStepSuggestion: treatmentStep(body),
  };

  const updated = await prisma.annualReview.update({
    where: { id },
    data: {
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      catScore: body.catScore ?? null,
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

  return NextResponse.json(updated);
}
