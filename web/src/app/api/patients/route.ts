import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { logApi } from "@/lib/api-log";

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const auth = await requireUser();
  if ("error" in auth) {
    logApi(req, "/api/patients", 401, startedAt);
    return auth.error;
  }

  const { patientCode, name } = await req.json();
  if (!patientCode) {
    logApi(req, "/api/patients", 400, startedAt);
    return NextResponse.json({ error: "Mangler pasient-ID" }, { status: 400 });
  }

  try {
    const p = await prisma.patient.create({
      data: { ownerId: auth.userId, patientCode: String(patientCode), name: name || null },
    });
    logApi(req, "/api/patients", 200, startedAt);
    return NextResponse.json(p);
  } catch {
    logApi(req, "/api/patients", 409, startedAt);
    return NextResponse.json({ error: "Pasient-ID finnes allerede for denne brukeren" }, { status: 409 });
  }
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const auth = await requireUser();
  if ("error" in auth) {
    logApi(req, "/api/patients", 401, startedAt);
    return auth.error;
  }

  const code = req.nextUrl.searchParams.get("patientCode");
  if (!code) {
    logApi(req, "/api/patients", 400, startedAt);
    return NextResponse.json({ error: "Mangler patientCode" }, { status: 400 });
  }

  // 1) Exact match first
  let patient = await prisma.patient.findFirst({
    where: { ownerId: auth.userId, patientCode: code },
    include: { reviews: { orderBy: { reviewYear: "desc" } } },
  });

  // 2) Fallback: partial match on patientCode or name
  if (!patient) {
    patient = await prisma.patient.findFirst({
      where: {
        ownerId: auth.userId,
        OR: [
          { patientCode: { contains: code, mode: "insensitive" } },
          { name: { contains: code, mode: "insensitive" } },
        ],
      },
      include: { reviews: { orderBy: { reviewYear: "desc" } } },
      orderBy: { patientCode: "asc" },
    });
  }

  if (!patient) {
    logApi(req, "/api/patients", 404, startedAt);
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }

  logApi(req, "/api/patients", 200, startedAt);
  return NextResponse.json(patient);
}
