import type { NextConfig } from 'next';

/**
 * DiCenso is a local-first SPA that ships two ways:
 *
 *   1. `pnpm dev` / `pnpm start`        → standard Next.js (server + client routing)
 *   2. `NEXT_EXPORT=1 pnpm build`       → fully static site in `out/` for Tauri
 *
 * We only enable `output: 'export'` in the static pipeline. In dev we want
 * real dynamic routes (e.g. /notes/[id]) to work without `generateStaticParams`
 * per-id — user IDs live in IndexedDB, not at build time.
 *
 * Security headers are only declared in non-export mode because `next export`
 * ignores them (Tauri/Next.js bake their own CSP via tauri.conf.json). They're
 * scoped to skip `/_next/*` to avoid blocking internal dev assets that are
 * served with a non-script MIME type (e.g. `_clientMiddlewareManifest.js`).
 */
const isStaticExport = process.env.NEXT_EXPORT === '1';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const baseConfig: NextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
};

const nextConfig: NextConfig = isStaticExport
  ? {
      ...baseConfig,
      output: 'export',
      distDir: 'out',
      trailingSlash: true,
    }
  : {
      ...baseConfig,
      async headers() {
        return [
          {
            source: '/((?!_next/|favicon|apple-touch-icon).*)',
            headers: securityHeaders,
          },
        ];
      },
    };

export default nextConfig;
