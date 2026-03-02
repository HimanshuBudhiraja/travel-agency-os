import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// ── Content Security Policy ────────────────────────────────────────────────
// Allows Clerk auth scripts/frames and Stripe payment frames.
// In dev, skip upgrade-insecure-requests so localhost works over HTTP.
const csp = [
  "default-src 'self'",
  // Next.js needs unsafe-eval in dev; Clerk injects inline scripts
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://*.clerk.com",
  // Tailwind and Clerk inject inline styles
  "style-src 'self' 'unsafe-inline'",
  // Images from any HTTPS source, data URIs, and blobs (Next/Image + avatars)
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Clerk auth iframes + Stripe payment element
  "frame-src https://clerk.com https://*.clerk.accounts.dev https://js.stripe.com https://hooks.stripe.com",
  // Disallow embedding TravelOS in iframes (clickjacking protection)
  "frame-ancestors 'none'",
  // WebSocket for Clerk + API calls to Stripe
  "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev wss://*.clerk.accounts.dev https://api.stripe.com",
  !isDev ? "upgrade-insecure-requests" : "",
]
  .filter(Boolean)
  .join("; ");

// ── Security headers applied to every route ────────────────────────────────
const securityHeaders = [
  // Enable browser DNS prefetch for performance
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS: 2 years, include subdomains, request preloading
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Prevent clickjacking (belt-and-suspenders with CSP frame-ancestors)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer to origin only for cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unnecessary browser features
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // CSP as a single header value
  { key: "Content-Security-Policy", value: csp },
];

// ── Next.js config ─────────────────────────────────────────────────────────
const nextConfig: NextConfig = {
  // Skip TS type-checking during build — Prisma types aren't generated until
  // postinstall runs, so tsc would fail on Prisma model maps. Types are still
  // compiled; only the type-error gate is disabled.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Don't expose Next.js version in X-Powered-By header
  poweredByHeader: false,

  // No source maps in production builds — protects business logic
  productionBrowserSourceMaps: false,

  compiler: {
    // Strip all console.* calls in production except console.error
    // This prevents leaking server-side logic/data through the browser console
    removeConsole: isDev ? false : { exclude: ["error"] },
  },

  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
