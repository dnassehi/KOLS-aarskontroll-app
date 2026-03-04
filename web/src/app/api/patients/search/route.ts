import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ matches: [] });

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

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      patientCode: m.patientCode,
      name: m.name,
      reviewCount: m._count.reviews,
    })),
  });
}
