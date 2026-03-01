import { NextResponse } from "next/server";
import { getCurrentSession } from "./auth";

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Ikke innlogget" }, { status: 401 }) };
  }
  return { userId: session.sub, email: session.email };
}
