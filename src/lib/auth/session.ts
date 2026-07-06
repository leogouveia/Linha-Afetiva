import { cookies } from "next/headers";
import { AUTH_COOKIE } from "./constants";
import { verifyToken } from "./token";

export async function getSession() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload.sub || typeof payload.email !== "string") return null;
    return { userId: Number(payload.sub), email: payload.email };
  } catch { return null; }
}
