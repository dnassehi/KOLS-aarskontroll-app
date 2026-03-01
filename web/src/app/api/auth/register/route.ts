import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Mangler epost/passord" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Bruker finnes allerede" }, { status: 409 });

  const user = await prisma.user.create({
    data: { email: String(email).toLowerCase(), passwordHash: await hashPassword(password) },
  });

  const token = signSession(user.id, user.email);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
