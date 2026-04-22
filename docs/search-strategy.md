# Search Strategy

## Two-Tier Search

### Tier 1: Client-Side (Instant)
- **Scope**: Recent 200 items per type loaded into memory
- **Engine**: Fuse.js with fuzzy matching
- **Fields**: Title, tags, plain text extract
- **Latency**: < 50ms
- **Use case**: Quick open, command palette, fast filtering

### Tier 2: Server-Side (Comprehensive)
- **Scope**: Full database with archived content
- **Engine**: PostgreSQL full-text search (tsvector/tsquery)
- **Fields**: Weighted title, content, tags
- **Latency**: < 300ms
- **Use case**: Deep search, global search page, cross-entity search

## Ranking
1. Exact title match (highest)
2. Prefix title match
3. Full-text relevance score
4. Recency (exponential decay)
5. User interaction frequency (future)

## Query Strategy
```sql
-- Full-text search with ranking
SELECT *, ts_rank_cd(search_vector, query) as rank
FROM "Note"
WHERE search_vector @@ plainto_tsquery('english', $1)
ORDER BY rank DESC, updated_at DESC
LIMIT 20;
```

## Frontend Integration
- `Cmd+Shift+F` opens global search modal
- Results grouped by entity type
- Highlighted snippets with matched terms
- Keyboard navigation (arrow keys + enter)
- Filters: type, tag, date range, status

## Future: Semantic Search
- Architecture ready for pgvector extension
- Embeddings generated for notes/prompts
- Hybrid search: keyword + semantic relevance
