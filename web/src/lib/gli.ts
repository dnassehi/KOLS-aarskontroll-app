// GLI-2012 calculations based on CPHCRD/gli-2012 reference implementation.
// Uses gli-2012-data constants package.
// Ethnicity coding:
// 1=Caucasian, 2=African-American, 3=North East Asian, 4=South East Asian, 5=Other

import gli2012DataRaw from "gli-2012-data";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gli2012Data: any = gli2012DataRaw;

const AGE_DECIMAL_INTERVAL = 0.25;
const LLN_CONSTANT = 1.645;

type Sex = "M" | "F";

export type GliResult = {
  zScore: number;
  lln: number;
  percentPred: number;
};

function interpolate(age: number, age1: number, ageInterval: number, spline1: number, spline2: number) {
  return spline1 + ((age - age1) / ageInterval) * (spline2 - spline1);
}

function calcValues(
  age: number,
  heightCm: number,
  sex: Sex,
  ethnicity: number,
  measured: number,
  constants: any,
): GliResult | null {
  const branch = sex === "F" ? constants.females : constants.males;
  const { coefficients, lookupTable } = branch;

  const upperAge = +(Math.ceil(age * (1 / AGE_DECIMAL_INTERVAL)) / (1 / AGE_DECIMAL_INTERVAL)).toFixed(2);
  const lowerAge = +(upperAge - AGE_DECIMAL_INTERVAL).toFixed(2);

  const upperTable = lookupTable[upperAge] ? lookupTable[upperAge] : lookupTable[lowerAge];
  const lowerTable = lookupTable[lowerAge] ? lookupTable[lowerAge] : lookupTable[upperAge];
  if (!upperTable || !lowerTable) return null;

  const Lspline = interpolate(age, lowerAge, AGE_DECIMAL_INTERVAL, lowerTable.Lspline, upperTable.Lspline);
  const Mspline = interpolate(age, lowerAge, AGE_DECIMAL_INTERVAL, lowerTable.Mspline, upperTable.Mspline);
  const Sspline = interpolate(age, lowerAge, AGE_DECIMAL_INTERVAL, lowerTable.Sspline, upperTable.Sspline);

  const { q0, q1 } = coefficients.L;
  const L = q0 + q1 * Math.log(age) + Lspline;

  const { a0, a1, a2, a3, a4, a5, a6 } = coefficients.M;
  const M = Math.exp(
    a0 +
      a1 * Math.log(heightCm) +
      a2 * Math.log(age) +
      a3 * (ethnicity === 2 ? 1 : 0) +
      a4 * (ethnicity === 3 ? 1 : 0) +
      a5 * (ethnicity === 4 ? 1 : 0) +
      a6 * (ethnicity === 5 ? 1 : 0) +
      Mspline,
  );

  const { p0, p1, p2, p3, p4, p5 } = coefficients.S;
  const S = Math.exp(
    p0 +
      p1 * Math.log(age) +
      p2 * (ethnicity === 2 ? 1 : 0) +
      p3 * (ethnicity === 3 ? 1 : 0) +
      p4 * (ethnicity === 4 ? 1 : 0) +
      p5 * (ethnicity === 5 ? 1 : 0) +
      Sspline,
  );

  const lln = Math.exp(Math.log(1 - LLN_CONSTANT * L * S) / L + Math.log(M));
  const zScore = (((measured / M) ** L) - 1) / (L * S);
  const percentPred = (measured / M) * 100;

  return { zScore, lln, percentPred };
}

export function calculateGli(
  age: number | null,
  heightCm: number | null,
  sex: string | null,
  ethnicity: number | null,
  fev1: number | null,
  fvc: number | null,
) {
  if (!age || !heightCm || !sex || !ethnicity || !fev1 || !fvc || fvc <= 0) return null;
  const s = (sex === "M" || sex === "F" ? sex : null) as Sex | null;
  if (!s) return null;

  const ratio = fev1 / fvc;

  const fev1Res = calcValues(age, heightCm, s, ethnicity, fev1, gli2012Data.FEV1);
  const fvcRes = calcValues(age, heightCm, s, ethnicity, fvc, gli2012Data.FVC);
  const ratioRes = calcValues(age, heightCm, s, ethnicity, ratio, gli2012Data.FEV1FVC);
  if (!fev1Res || !fvcRes || !ratioRes) return null;

  return {
    fev1: fev1Res,
    fvc: fvcRes,
    ratio: ratioRes,
  };
}
