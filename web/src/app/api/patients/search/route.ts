import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { logApi } from "@/lib/api-log";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const auth = await requireUser();
  if ("error" in auth) {
    logApi(req, "/api/patients/search", 401, startedAt);
    return auth.error;
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) {
    logApi(req, "/api/patients/search", 200, startedAt, { matches: 0 });
    return NextResponse.json({ matches: [] });
  }

  const matches = await prisma.patient.findMany({
    where: {
      ownerId: auth.userId,
      OR: [
        { patientCode: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      patientCode: true,
      name: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { patientCode: "asc" },
    take: 10,
  });

  const out = {
    matches: matches.map((m) => ({
      id: m.id,
      patientCode: m.patientCode,
      name: m.name,
      reviewCount: m._count.reviews,
    })),
  };
  logApi(req, "/api/patients/search", 200, startedAt, { matches: out.matches.length });
  return NextResponse.json(out);
}
