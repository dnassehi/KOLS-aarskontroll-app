import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const { patientCode, name } = await req.json();
  if (!patientCode) return NextResponse.json({ error: "Mangler pasient-ID" }, { status: 400 });

  try {
    const p = await prisma.patient.create({
      data: { ownerId: auth.userId, patientCode: String(patientCode), name: name || null },
    });
    return NextResponse.json(p);
  } catch {
    return NextResponse.json({ error: "Pasient-ID finnes allerede for denne brukeren" }, { status: 409 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const code = req.nextUrl.searchParams.get("patientCode");
  if (!code) return NextResponse.json({ error: "Mangler patientCode" }, { status: 400 });

  const patient = await prisma.patient.findFirst({
    where: { ownerId: auth.userId, patientCode: code },
    include: { reviews: { orderBy: { reviewYear: "desc" } } },
  });
  if (!patient) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

  return NextResponse.json(patient);
}
