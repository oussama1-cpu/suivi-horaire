import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/firebase";

// Proxy (formerly "middleware") always runs on the Node.js runtime in
// Next.js 16, so firebase-admin works fine here without extra config.

// Cache en mémoire des validations de session (TTL court) : sinon chaque
// requête authentifiée (page, navigation RSC, server action) fait une lecture
// Firestore, ce qui épuise rapidement le quota quotidien gratuit.
const SESSION_CACHE_TTL_MS = 60_000;
const sessionCache = new Map<string, { valid: boolean; checkedAt: number }>();

async function isSessionValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const cached = sessionCache.get(token);
  if (cached && Date.now() - cached.checkedAt < SESSION_CACHE_TTL_MS) return cached.valid;
  const snap = await getDb().collection("sessions").doc(token).get();
  const session = snap.data() as { expires: number } | undefined;
  const valid = !!session && session.expires > Date.now();
  if (sessionCache.size > 5000) sessionCache.clear();
  sessionCache.set(token, { valid, checkedAt: Date.now() });
  return valid;
}

// ---------------------------------------------------------------------------
// Content Security Policy (générée par requête, avec nonce)
// ---------------------------------------------------------------------------
//
//  default-src 'none'
//    Deny everything not explicitly allowed. Fail-safe baseline.
//
//  script-src 'self' 'nonce-<random>' 'strict-dynamic'
//    Next.js (App Router) injecte des <script> inline sans attribut src pour
//    le streaming des données RSC ("self.__next_f.push(...)") à chaque
//    requête : ils n'ont pas de hash stable et doivent donc être autorisés
//    via un nonce unique généré ici et transmis à Next.js (qui l'applique
//    automatiquement à ses propres scripts quand il le détecte dans cet
//    en-tête). 'strict-dynamic' autorise les scripts chargés par un script
//    déjà autorisé par nonce (les chunks Next.js), tout en ignorant 'self'
//    pour les navigateurs qui le supportent ; les navigateurs plus anciens
//    retombent sur 'self' + nonce.
//
//  style-src 'self' 'unsafe-inline'
//    Tailwind v4 output is bundled and served from /_next/static/ ('self').
//    However, two React components inject dynamic inline style= attributes:
//      • mobile-nav.tsx  → style={{ gridTemplateColumns: `repeat(…)` }}
//      • stat-cards.tsx  → style={{ width: `${pct}%` }}
//    React writes these as inline style attributes which require 'unsafe-inline'.
//    A nonce cannot be applied to element-level style= props.
//
//  img-src 'self' data:
//    All images are self-hosted; data: kept for small inlined images.
//
//  font-src 'self' / connect-src 'self' / worker-src 'self' / manifest-src 'self'
//    Everything (fonts, Server Actions, the PWA service worker, the web app
//    manifest) is served from the same origin. No third-party calls.
//
//  frame-ancestors 'none' / base-uri 'none' / form-action 'self' / object-src 'none'
//    Standard hardening: no clickjacking, no <base> hijack, forms only POST
//    to the same origin, no plugins/objects embedded.
// ---------------------------------------------------------------------------
function buildCsp(nonce: string): string {
  return [
    "default-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export default async function proxy(request: NextRequest) {
  // Force HTTPS en production. Derrière un proxy/CDN (Vercel, etc.), la requête
  // entrante au runtime Node est en HTTP mais porte l'en-tête `x-forwarded-proto`
  // indiquant le protocole d'origine réel utilisé par le client.
  const proto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && proto && proto !== "https") {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

  const path = request.nextUrl.pathname;
  const isPublic =
    path === "/login" ||
    path === "/forgot-password" ||
    path === "/sw.js" ||
    path === "/manifest.json" ||
    path === "/robots.txt" ||
    path.startsWith("/reset-password") ||
    path.startsWith("/_next") ||
    path.startsWith("/api");
  const token = request.cookies.get("session")?.value;
  // Si Firestore est indisponible/quota épuisé, on traite la session comme
  // invalide (redirection /login) plutôt que de faire planter la requête —
  // l'utilisateur voit la page de connexion au lieu d'un écran blanc.
  let authenticated = false;
  try {
    authenticated = await isSessionValid(token);
  } catch {
    authenticated = false;
  }

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

  // Nonce unique par requête, transmis à Next.js via l'en-tête de requête
  // `x-nonce` : le framework le réutilise automatiquement pour ses propres
  // <script> inline quand la CSP posée en réponse le contient.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
