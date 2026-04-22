# ADR 004: Auth.js v5 (NextAuth)

## Status
Accepted

## Context
Need authentication with email/password and future passkey support.

## Decision
Use Auth.js v5 (formerly NextAuth.js).

## Rationale
- Native Next.js App Router integration
- Passkey/WebAuthn support via @auth/prisma-adapter
- Session + JWT strategies
- Excellent security defaults

## Alternatives Considered
- Clerk: Great but paid/lock-in
- Supabase Auth: Tied to Supabase
- Custom auth: Too much risk

## Consequences
- Must configure adapter and callbacks carefully
- Session callback runs frequently
