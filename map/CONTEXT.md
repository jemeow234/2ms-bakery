# Walking and maintaining the system map

## Purpose

This map is a repository navigation layer for later changes. It records durable nouns, executed movements, representation boundaries, and first-order change impact. It is not an independent product specification.

## Inputs

- Application source in `app/`, `components/`, `context/`, `hooks/`, `lib/`, and `middleware.ts`.
- Dependency and runtime configuration in `package.json`, `next.config.mjs`, and Supabase client modules.
- Historical claims in `_archive/prior-integration-notes/`; these are evidence of prior intent, not evidence of deployed state.

## How to walk

1. Start at `CLAUDE.md` and choose one shelf.
2. For a noun, open `objects/_index.md` and then one card.
3. For a workflow, open only the process card and its consumed/produced object cards.
4. Before changing code, open `effects/CONTEXT.md` and the listed cards.
5. Follow `path:line` citations back to source and re-verify them at the current revision.

## Universes

- `live`: statically wired into a current page, provider, route, or middleware path.
- `leftover`: present but not referenced by the main static import/call graph found in this audit.
- `ghost`: a claim or call edge whose described target does not exist.

Universe is about wiring, not quality. A live path may still be internally inconsistent.

## Known collisions

| Product term | Code/storage meanings |
|---|---|
| User | Supabase Auth user; `users` row; `User`; page-local `RegisteredUser` |
| Product | `Product`; `initialProducts`; `products` row |
| Order | client `Order`; `orders` row; joined `order_items` rows |
| Migration | browser flag flow; admin product seed endpoint; broader archived claims |
| Inventory update | order-time stock decrement; unimplemented `POST /api/admin/inventory` client edge |

## Verification scope and limitations

Cards were verified on 2026-09-04 against branch `Siegfred`, commit `abb7373b5ea22d2381dec93e8a74f066519670a2`. The repository has no committed Supabase migrations or declarative database schema and no test files were found. Therefore this map cannot confirm deployed columns, constraints, indexes, RLS policies, seed accounts, or runtime correctness. `schemas/supabase-data-model.md` is explicitly code-inferred.

## Maintenance contract

- Keep one fact in one card and link to it elsewhere.
- Mark a card `verified` only after checking every load-bearing citation.
- Move obsolete cards to `stale`; do not silently rewrite history.
- Keep `CLAUDE.md`, `AGENTS.md`, and `routing.md` byte-identical.
- Update the revision and verification date when re-auditing.

## Human check

A cold reader should reach the definition and first-order impact of any indexed noun from `CLAUDE.md` plus one card. If more reads are required, fix routing instead of expanding the catalog.
