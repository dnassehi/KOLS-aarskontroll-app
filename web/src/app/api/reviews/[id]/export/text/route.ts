import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { compactJournalNote } from "@/lib/kols";
import { calculateGli } from "@/lib/gli";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const review = await prisma.annualReview.findUnique({ where: { id }, include: { patient: true } });
  if (!review || review.patient.ownerId !== auth.userId) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  const meds: string[] = [];
  if (review.medLaba) meds.push("LABA");
  if (review.medLama) meds.push("LAMA");
  if (review.medIcs) meds.push("ICS");
  if (review.medSama) meds.push("SAMA");
  if (review.medSaba) meds.push("SABA");
  if (review.medPde4) meds.push("PDE4");

  const comorbidities: string[] = [];
  if (review.comorbCvd) comorbidities.push("Hjerte-karsykdom");
  if (review.comorbKidneyDisease) comorbidities.push("Nyresykdom");
  if (review.comorbDiabetesMetSyn) comorbidities.push("Diabetes/metabolsk syndrom");
  if (review.comorbOsteoporosis) comorbidities.push("Osteoporose");
  if (review.comorbAnxietyDepression) comorbidities.push("Angst/depresjon");

  const gliPre = calculateGli(
    review.gliAge,
    review.heightCm,
    review.gliSex,
    review.gliEthnicity,
    review.fev1L,
    review.fvcL,
  );
  const gliPost = calculateGli(
    review.gliAge,
    review.heightCm,
    review.gliSex,
    review.gliEthnicity,
    review.postFev1L,
    review.postFvcL,
  );
  const gliPreStatus = gliPre ? (gliPre.ratio.zScore < -1.645 ? "Under LLN" : "Innenfor normalområde") : null;
  const gliPostStatus = gliPost ? (gliPost.ratio.zScore < -1.645 ? "Under LLN" : "Innenfor normalområde") : null;

  const text = compactJournalNote({
    year: review.reviewYear,
    catScore: review.catScore,
    mmrc: review.mmrc,
    exacerbationsLast12m: review.exacerbationsLast12m,
    hospitalizationsLast12m: review.hospitalizationsLast12m,
    fev1L: review.fev1L,
    fev1PercentPred: review.fev1PercentPred,
    fvcL: review.fvcL,
    fev1Fvc: review.fev1Fvc,
    responseTestSaba: review.responseTestSaba,
    responseTestSama: review.responseTestSama,
    postFev1L: review.postFev1L,
    postFev1PercentPred: review.postFev1PercentPred,
    postFvcL: review.postFvcL,
    postFev1Fvc: review.postFev1Fvc,
    gliAge: review.gliAge,
    gliSex: review.gliSex,
    gliEthnicity: review.gliEthnicity,
    receivesPhysiotherapy: review.receivesPhysiotherapy,
    lastRehabYear: review.lastRehabYear,
    gliPreStatus,
    gliPostStatus,
    smokingActive: review.smokingActive,
    heightCm: review.heightCm,
    weightKg: review.weightKg,
    bmi: review.bmi,
    chestXrayYear: review.chestXrayYear,
    chestXrayMonth: review.chestXrayMonth,
    spirometryDate: review.spirometryDate ? review.spirometryDate.toISOString().slice(0, 10) : null,
    reviewDate: review.reviewDate ? review.reviewDate.toISOString().slice(0, 10) : null,
    comorbidities,
    meds,
    treatmentSuggestion: review.treatmentStepSuggestion,
    plan: review.planOrTiltak || review.notes,
  });

  return new NextResponse(text, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
