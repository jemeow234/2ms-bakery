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
| User | Supabase Auth user; `users` row; `User` |
| Product | `Product`; `initialProducts`; `products` row |
| Order | client `Order`; `orders` row; joined `order_items` rows |
| Migration | browser flag flow; admin product seed endpoint; broader archived claims |
| Inventory update | order-time `sale` decrement; admin `POST /api/admin/inventory` add/remove/adjustment |
| Order status update | live `PUT /api/admin/orders/[id]`; leftover `PATCH /api/orders/[id]` |

## Verification scope and limitations

Cards were re-verified on 2026-09-14 against branch `main`, merge commit `6106902a6e119efb2618c157ca3d9e10d6b82bd3`. The previous pin was `main@54998ac6c451df883db082bf8cc72ca78f61e854` (verified 2026-09-04); 53 application files changed between the two, so every card's `path:line` citations were re-read at the new revision. The repository still has no committed Supabase migrations, declarative database schema, or Storage definition (the tracked `supabase/` folder holds only CLI state files), and no test files were found. Therefore this map cannot confirm deployed columns, constraints, indexes, RLS or Storage policies, Auth URL/email settings, seed accounts, or runtime correctness. `schemas/supabase-data-model.md` is explicitly code-inferred.

## Maintenance contract

- After each significant committed change, run the reusable synchronization prompt in `_meta/update-prompt.md`.
- Keep one fact in one card and link to it elsewhere.
- Mark a card `verified` only after checking every load-bearing citation.
- Move obsolete cards to `stale`; do not silently rewrite history.
- Keep `CLAUDE.md`, `AGENTS.md`, and `routing.md` byte-identical.
- Update the revision and verification date when re-auditing.

## Human check

A cold reader should reach the definition and first-order impact of any indexed noun from `CLAUDE.md` plus one card. If more reads are required, fix routing instead of expanding the catalog.
