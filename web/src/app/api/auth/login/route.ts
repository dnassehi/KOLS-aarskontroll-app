import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Mangler epost/passord" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user) return NextResponse.json({ error: "Ugyldig innlogging" }, { status: 401 });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Ugyldig innlogging" }, { status: 401 });

  const token = signSession(user.id, user.email);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
