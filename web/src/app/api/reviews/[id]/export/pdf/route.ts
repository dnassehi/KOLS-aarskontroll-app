import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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
    gliPreFev1PctPred: gliPre?.fev1.percentPred ?? null,
    gliPreFev1Z: gliPre?.fev1.zScore ?? null,
    gliPreFvcPctPred: gliPre?.fvc.percentPred ?? null,
    gliPreFvcZ: gliPre?.fvc.zScore ?? null,
    gliPreRatioZ: gliPre?.ratio.zScore ?? null,
    gliPreRatioLlnPct: gliPre ? gliPre.ratio.lln * 100 : null,
    gliPostFev1PctPred: gliPost?.fev1.percentPred ?? null,
    gliPostFev1Z: gliPost?.fev1.zScore ?? null,
    gliPostFvcPctPred: gliPost?.fvc.percentPred ?? null,
    gliPostFvcZ: gliPost?.fvc.zScore ?? null,
    gliPostRatioZ: gliPost?.ratio.zScore ?? null,
    gliPostRatioLlnPct: gliPost ? gliPost.ratio.lln * 100 : null,
    smokeStatus: review.smokeStatus,
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
    plan: review.planOrTiltak,
    notes: review.notes,
  });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText("KOLS årskontroll", { x: 50, y: 800, size: 20, font: bold, color: rgb(0.1, 0.2, 0.45) });
  page.drawText(`Pasient-ID: ${review.patient.patientCode}`, { x: 50, y: 770, size: 12, font });
  page.drawText(`År: ${review.reviewYear}`, { x: 50, y: 752, size: 12, font });

  const wrapLine = (line: string, maxLen = 90) => {
    if (!line) return [""];
    const words = line.split(" ");
    const out: string[] = [];
    let current = "";
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (test.length > maxLen && current) {
        out.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) out.push(current);
    return out;
  };

  const lines = text
    .split("\n")
    .flatMap((line) => wrapLine(line));

  let y = 720;
  for (const line of lines) {
    const isSectionHeader = !!line && !line.startsWith("-");
    page.drawText(line || " ", { x: 50, y, size: isSectionHeader ? 12 : 11, font: isSectionHeader ? bold : font });
    y -= line ? 15 : 10;
    if (y < 60) break;
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="kols-${review.patient.patientCode}-${review.reviewYear}.pdf"`,
    },
  });
}
