import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/firebase";

// Proxy (formerly "middleware") always runs on the Node.js runtime in
// Next.js 16, so firebase-admin works fine here without extra config.

async function isSessionValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const snap = await getDb().collection("sessions").doc(token).get();
  const session = snap.data() as { expires: number } | undefined;
  return !!session && session.expires > Date.now();
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/login" ||
    path === "/forgot-password" ||
    path.startsWith("/reset-password") ||
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/checkin");
  const token = request.cookies.get("session")?.value;
  const authenticated = await isSessionValid(token);

  if (!authenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authenticated && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
