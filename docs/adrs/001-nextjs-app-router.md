# ADR 001: Next.js App Router

## Status
Accepted

## Context
Need a React framework with SSR, API routes, and excellent DX.

## Decision
Use Next.js 15 with App Router.

## Rationale
- Server Components by default = less client JS
- Built-in caching and revalidation
- Server Actions for mutations without API boilerplate
- Excellent TypeScript support
- Largest ecosystem

## Consequences
- Learning curve for App Router patterns
- Must carefully manage "use client" boundaries
