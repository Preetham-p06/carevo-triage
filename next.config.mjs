/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production'

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  // Serverless deploys (Vercel): bundle the runtime-read clinical data with
  // the API functions — the 444-chunk knowledge overlay, the clinician-
  // promoted calibration artifact, and embeddings. Without this, fs reads
  // silently fail in production and the app degrades to seed corpus with
  // calibration disabled.
  outputFileTracingIncludes: {
    '/api/**': ['./data/knowledge/**', './data/calibration/**', './data/cost/**'],
  },
  // Serve the static landing page AT the root URL — beforeFiles so it wins
  // over the app router's / route. The URL stays clean: usecarevo.com, not
  // usecarevo.com/landing-v2.html.
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', destination: '/landing-v2.html' }],
      afterFiles: [],
      fallback: [],
    }
  },
  // Old direct links to the filename bounce to the clean root (no loop:
  // the rewrite above is internal and never issues a new request).
  async redirects() {
    return [{ source: '/landing-v2.html', destination: '/', permanent: true }]
  },
  async headers() {
    return [
      {
        // API responses carry health-adjacent content — never cache them
        // anywhere (browser, CDN, shared proxies).
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'X-XSS-Protection', value: '0' },
        ],
      },
      {
        source: '/((?!triage-embed).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https:",
              "connect-src 'self'",
              "frame-src 'self'",
              "base-uri 'self'",
              "form-action 'self' mailto:",
              "frame-ancestors 'none'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/triage-embed',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(self), payment=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https:",
              "connect-src 'self'",
              "base-uri 'self'",
              "form-action 'self' mailto:",
              "frame-ancestors 'self'",
              "object-src 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
