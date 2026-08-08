import { prisma } from "@/lib/prisma";

export const DEMO_PATIENT_CODE = "11111111";
export const DEMO_PATIENT_NAME = "DEMO TESTPASIENT (IKKE EKTE)";
export const DEMO_REVIEW_YEAR = 2026;

export async function ensureDemoPatientForUser(userId: string) {
  return prisma.patient.upsert({
    where: {
      ownerId_patientCode: {
        ownerId: userId,
        patientCode: DEMO_PATIENT_CODE,
      },
    },
    update: {
      // Keep warning name explicit for safety; leave unchanged if user intentionally renamed.
    },
    create: {
      ownerId: userId,
      patientCode: DEMO_PATIENT_CODE,
      name: DEMO_PATIENT_NAME,
    },
  });
}

export async function ensureDemoReviewForUser(userId: string) {
  const patient = await ensureDemoPatientForUser(userId);

  return prisma.annualReview.upsert({
    where: {
      patientId_reviewYear: {
        patientId: patient.id,
        reviewYear: DEMO_REVIEW_YEAR,
      },
    },
    update: {},
    create: {
      patientId: patient.id,
      reviewYear: DEMO_REVIEW_YEAR,
      createdById: userId,
      reviewDate: new Date("2026-03-01T10:00:00.000Z"),
      spirometryDate: new Date("2026-02-26T10:00:00.000Z"),
      catScore: 14,
      catQ1: 2,
      catQ2: 1,
      catQ3: 2,
      catQ4: 2,
      catQ5: 2,
      catQ6: 1,
      catQ7: 2,
      catQ8: 2,
      mmrc: 2,
      exacerbationsLast12m: 2,
      hospitalizationsLast12m: 0,
      fev1L: 1.72,
      fev1PercentPred: 56.4,
      fvcL: 3.58,
      fev1Fvc: 48.04,
      responseTestSaba: true,
      responseTestSama: false,
      postFev1L: 1.86,
      postFev1PercentPred: 60.9,
      postFvcL: 3.66,
      postFev1Fvc: 50.82,
      gliAge: 68,
      gliSex: "M",
      gliEthnicity: 1,
      spo2: 95,
      eosinophils: 0.18,
      smokeStatus: "TIDLIGERE",
      smokingActive: false,
      packYears: 22,
      heightCm: 176,
      weightKg: 79,
      bmi: 25.5,
      chestXrayYear: 2024,
      chestXrayMonth: 10,
      comorbCvd: true,
      comorbKidneyDisease: false,
      comorbDiabetesMetSyn: false,
      comorbOsteoporosis: false,
      comorbAnxietyDepression: false,
      receivesPhysiotherapy: true,
      lastRehabYear: 2022,
      medLaba: false,
      medLama: true,
      medIcs: true,
      medSama: false,
      medSaba: true,
      medPde4: false,
      influenzaDate: new Date("2025-10-15T00:00:00.000Z"),
      pneumococcalDate: new Date("2021-09-10T00:00:00.000Z"),
      covidDate: new Date("2025-11-02T00:00:00.000Z"),
      rsvDate: null,
      notes:
        "Demo-pasient til opplæring/visning. Ingen ekte pasientopplysninger.",
      planOrTiltak:
        "Fortsette LAMA/ICS. Ny spirometri om 12 mnd. Vurdere røykesluttoppfølging ved behov.",
    },
  });
}

export async function ensureDemoDataForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    await ensureDemoReviewForUser(user.id);
  }
  return users.length;
}
