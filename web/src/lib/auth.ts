import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "kols_session";

function getSecret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET mangler");
  return s;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: string, email: string) {
  return jwt.sign({ sub: userId, email }, getSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string): { sub: string; email: string } | null {
  try {
    return jwt.verify(token, getSecret()) as { sub: string; email: string };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  const appUrl = process.env.APP_URL || "";
  const isHttpsDeployment = appUrl.startsWith("https://");

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttpsDeployment,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
