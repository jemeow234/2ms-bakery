# Closed map schema

## Node types

Only these `type` values are valid:

- `object` — a durable domain noun.
- `schema` — a representation or contract spanning one or more nouns.
- `process` — a movement that is wired in the audited source.

Catalogs and folder contracts do not require frontmatter. Archived files retain their original format and are never live nodes.

## Required frontmatter

Every node card must contain:

```yaml
---
type: object | schema | process
status: stub | verified | stale
universe: live | leftover | ghost
verified: YYYY-MM-DD | null
revision: branch@commit | null
---
```

`status: verified` requires a real date, revision, and repository `path:line` citations. A verified card may describe an uncertainty if its scope and evidence are explicit.

## Object body

1. One sentence
2. Why this shape
3. Shape
4. Connected to
5. If you change this — Hits / Does not hit
6. Surfaces
7. See

## Schema body

1. Scope and authority
2. Representations
3. Boundaries or mismatches
4. If you change this — Hits / Does not hit
5. See

## Process body

1. Input
2. Movement — numbered and cited
3. Output
4. Consumes / Produces
5. Failure and mismatch notes
6. If you change this — Hits / Does not hit
7. See

## Citation rule

Use repository-relative `path:line` or `path:start-end`. A card points to source code, not to another explanatory document, for load-bearing behavior.
