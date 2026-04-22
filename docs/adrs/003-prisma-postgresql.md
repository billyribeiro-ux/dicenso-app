# ADR 003: Prisma + PostgreSQL

## Status
Accepted

## Context
Need a typed ORM and relational database.

## Decision
Use Prisma ORM with PostgreSQL.

## Rationale
- Best-in-class TypeScript types from schema
- Excellent migration system
- Built-in connection pooling
- PostgreSQL = robust, proven, excellent full-text search

## Alternatives Considered
- Drizzle: Lighter, less mature migrations
- Supabase: Lock-in concern, more complex
- SQLite: Not suitable for concurrent access

## Consequences
- Schema change requires migration
- Prisma Client bundle size (acceptable)
