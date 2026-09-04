# 2M's Bakery system map

This shelf maps the as-built repository at `Siegfred@abb7373b5ea22d2381dec93e8a74f066519670a2`. Source code remains authoritative; cards cite it rather than replacing it.

## Route by task

| Question | Open |
|---|---|
| What is a user, product, order, or other durable noun? | `objects/_index.md`, then one object card |
| How is data represented? | `schemas/CONTEXT.md`, then one schema card |
| How does a real workflow move? | `processes/CONTEXT.md`, then one process card |
| What else changes if I touch X? | `effects/CONTEXT.md` |
| How should this map be maintained? | `CONTEXT.md` and `_meta/schema.md` |
| What did the prior integration notes claim? | `_archive/prior-integration-notes/` |

## Colliding names

- **User** can mean a Supabase Auth identity, a `users` table profile, the `User` TypeScript interface, or the browser-local admin record.
- **Product** can mean an `initialProducts` record, the `Product` interface, or a `products` table row.
- **Order** is camelCase in the client model and snake_case in database/API rows; the route does not normalize between them.
- **Migration** currently means an admin-only seed of `initialProducts`, not a general localStorage migration.

## Universes

- **live** — wired into a current route, provider, page, or API.
- **leftover** — present but not on the main statically reachable path.
- **ghost** — documented or called, but not implemented as described.

## Map discipline

Open the smallest relevant card. Follow its source citations before editing code. Treat uncommitted database structure, deployed configuration, and archived claims as unverified until inspected directly.
