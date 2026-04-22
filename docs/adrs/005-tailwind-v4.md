# ADR 005: Tailwind CSS v4

## Status
Accepted

## Context
Need a maintainable, tokenized styling system.

## Decision
Use Tailwind CSS v4 with CSS-first configuration.

## Rationale
- CSS-based config = no JS config file
- Built-in support for CSS custom properties
- Better performance with new engine
- Excellent with shadcn/ui

## Alternatives Considered
- CSS Modules: More manual work
- Styled Components: Runtime overhead
- Panda CSS: Less ecosystem

## Consequences
- Must use @import syntax
- Some plugins may need updates
