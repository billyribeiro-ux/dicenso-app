# Security Strategy

## Authentication
- Auth.js v5 with bcrypt password hashing
- CSRF protection built-in
- Secure session cookies (httpOnly, secure, sameSite)
- Rate limiting on auth endpoints

## Authorization
- Row-level security via userId checks in every query
- Server Actions validate session before operations
- No trust in client-provided userId

## Data Validation
- Zod schemas for all inputs
- Server-side validation is canonical
- Client validation for UX only

## File Uploads
- Size limits (10MB default)
- MIME type whitelist
- Virus scanning stub (future)
- Private file serving via signed URLs or auth check

## Input Sanitization
- Tiptap handles HTML sanitization via ProseMirror schema
- No raw HTML stored in database
- Plain text extracts are escaped

## Secrets
- `.env.local` for secrets, never committed
- `.env.example` for documentation
- No secrets exposed to browser

## Rate Limiting
- `rate-limiter-flexible` on sensitive endpoints
- Auth: 5 attempts per 15 minutes
- API: 100 requests per minute per user
