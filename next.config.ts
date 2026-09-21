import type { NextConfig } from "next";

const securityHeaders = [
  // Empêche l'application d'être chargée dans une <iframe> tierce (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Empêche le navigateur de deviner un type MIME différent de celui déclaré.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limite les informations envoyées dans l'en-tête Referer vers d'autres origines.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Désactive par défaut les API sensibles (caméra, micro, géoloc) non utilisées par l'app.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Force HTTPS pendant 2 ans une fois servi en HTTPS (sans effet en dev HTTP).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "192.168.178.129:3000",
        "suivi-horaire.vercel.app",
        "*.vercel.app",
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
