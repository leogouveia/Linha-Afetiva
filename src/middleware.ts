import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth/constants";
import { verifyToken } from "@/lib/auth/token";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  try { await verifyToken(token); return NextResponse.next(); }
  catch { const response = NextResponse.redirect(new URL("/login", request.url)); response.cookies.delete(AUTH_COOKIE); return response; }
}
export const config = { matcher: ["/app/:path*"] };
