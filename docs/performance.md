# Performance Strategy

## Targets
- FCP < 1.5s
- LCP < 2.5s
- TTI < 3.5s
- INP < 200ms
- CLS < 0.1

## Strategies

### Server Side
- Server Components for static/dynamic data
- Streaming with Suspense boundaries
- `React.cache()` for deduplicated requests
- Prisma query optimization with `select`/`include`
- Connection pooling

### Client Side
- Code splitting by route and feature
- Lazy load non-critical components
- Virtualization for lists > 50 items
- Editor lazy-loaded on note pages
- Images: Next.js Image with optimization

### Bundle
- Tree-shake unused code
- Dynamic imports for heavy libraries
- Tiptap extensions imported individually
- Date-fns: import specific functions

### Runtime
- `useMemo`/`useCallback` where profiling shows benefit
- `useTransition` for non-urgent updates
- Debounce for search and autosave
- RAF for smooth animations

### Storage
- IndexedDB for large local data
- localStorage only for small preferences
- LRU cache for search indices

## Monitoring
- Web Vitals reporting
- Error boundary logging
- Performance marks for key interactions
