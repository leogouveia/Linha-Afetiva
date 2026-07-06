import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { SESSION_DURATION_SECONDS } from "./constants";

function getSecret() {
  const value = process.env.APP_SECRET;
  if (!value || value.length < 32) throw new Error("APP_SECRET deve ter pelo menos 32 caracteres.");
  return new TextEncoder().encode(value);
}

export async function createToken(user: { id: number; email: string }) {
  return new SignJWT({ email: user.email }).setProtectedHeader({ alg: "HS256" }).setSubject(String(user.id)).setIssuedAt().setExpirationTime(`${SESSION_DURATION_SECONDS}s`).sign(getSecret());
}

export async function verifyToken(token: string) {
  return (await jwtVerify(token, getSecret(), { algorithms: ["HS256"] })).payload;
}
