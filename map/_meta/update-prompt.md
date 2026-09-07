# Prompt: synchronize the system map after a significant change

Run this prompt from the repository root after committing a significant change. Replace the optional change summary if useful; the Git diff remains the evidence.

```text
Synchronize the existing ICM system map in `map/` with the repository's current committed state.

Optional change summary: <describe the significant change, or write "derive from Git history">

Treat source code and committed configuration as authoritative. Treat the map as a navigation and change-impact layer, never as a second product specification.

First read, in order:
1. `map/CLAUDE.md`
2. `map/CONTEXT.md`
3. `map/_meta/schema.md`
4. `map/effects/CONTEXT.md`
5. The relevant shelf indexes or `CONTEXT.md` files

Then perform this maintenance workflow:

1. Establish evidence.
   - Run `git status --short`, `git branch --show-current`, and `git rev-parse HEAD`.
   - Read the previous audit revision from `map/CLAUDE.md`, `map/CONTEXT.md`, and `map/objects/_index.md`.
   - If the working tree contains application, configuration, database, or map changes, do not mark the map verified. Stop and report that the significant change must be committed first. Ignore only clearly generated build artifacts.
   - Confirm the previous audit commit exists. Inspect `git diff --name-status <previous-audit-commit>..HEAD` and the relevant hunks. If that commit is not an ancestor of HEAD, use the merge base and explicitly report the adjusted comparison.

2. Decide whether the change is map-significant. A change is significant if it adds, removes, renames, or changes any of these:
   - a durable domain object or its fields, constraints, ownership, or persistence;
   - a database/table/RLS contract, TypeScript domain type, HTTP request/response contract, local-storage shape, or runtime configuration boundary;
   - a real workflow such as authentication, session loading, storefront/cart behavior, checkout/order/stock movement, admin management, or migration/seeding;
   - a reader, writer, route, provider, middleware edge, external integration, or first-order change impact;
   - whether something is `live`, `leftover`, or `ghost`.
   Pure styling, copy, formatting, dependency-lock churn, generated files, and behavior-preserving refactors are normally not map-significant. Verify that they do not alter a mapped edge before deciding no update is needed.

3. Trace impact before editing.
   - Use the changed files and `map/effects/CONTEXT.md` to select the smallest relevant object, schema, and process cards.
   - Follow each selected card's citations into source.
   - Search for all first-order callers, readers, writers, serializers, persistence keys, API consumers, and route/provider connections affected by the change.
   - Re-check both `Hits` and `Does not hit`; do not infer behavior from names, comments, UI copy, archived notes, or intent.
   - Do not claim deployed Supabase structure, RLS, environment values, or runtime behavior unless directly verified from an authoritative source available in this task. State unverified boundaries explicitly.

4. Make the smallest truthful map update.
   - Update only affected cards and routing catalogs.
   - Correct every affected repository-relative `path:line` or `path:start-end` citation, including citations shifted by the change.
   - Add a new object, schema, or process card only when the source introduces a durable noun, a cross-cutting representation boundary, or a movement that actually runs. Start from the matching file in `map/_templates/`.
   - If an old path is no longer active, mark its card or claim `stale`, `leftover`, or `ghost` as appropriate; do not silently delete history.
   - Keep one fact in one card and link from catalogs. Do not duplicate implementation details across cards.
   - Update `map/objects/_index.md`, shelf `CONTEXT.md` files, and `map/effects/CONTEXT.md` only when their routing or coverage changed.
   - Keep `map/CLAUDE.md`, `map/AGENTS.md`, and `map/routing.md` byte-identical. Edit `map/CLAUDE.md`, then copy its exact bytes to the two twins.

5. Re-baseline verification.
   - Validate every citation in every `status: verified` card, not only the edited cards, because line numbers may have shifted.
   - Confirm that all changes since the previous audit revision are either reflected in the map or demonstrably not map-significant.
   - Run the project's relevant tests, type checks, lint, or build when they can verify mapped behavior. Do not claim runtime verification from static checks alone.
   - Only after those checks pass, update all verified cards and map-level audit markers to today's date and `<current-branch>@<full-HEAD-sha>`.
   - Ensure verified cards satisfy `map/_meta/schema.md`; otherwise downgrade them to `stub` or `stale` and explain why.

6. Run the system-map walk test.
   - From `map/CLAUDE.md`, a cold reader can reach any changed noun, schema, process, or impact route in at most two more reads.
   - Each changed card states source-backed shape or movement, first-order `Hits`, an explicit `Does not hit`, surfaces, and direct source citations.
   - `map/effects/CONTEXT.md` routes to cards rather than copying their waterfalls.
   - No live claim relies on `map/_archive/` as implementation evidence.

Finish with a concise report containing:
- comparison range and current revision;
- why the change was or was not map-significant;
- map files changed;
- citations and checks validated;
- uncertainties or unverified external state;
- `System map synchronized` only if the repository is clean and every verification gate above passed.

Do not modify application code while performing this task. Do not broaden the map beyond evidence in the current repository.
```

## Recommended cadence

Use it after a commit that changes a domain object, schema or storage shape, API contract, workflow, routing/provider boundary, runtime configuration, or live/leftover/ghost status. It is unnecessary for changes verified to be visual-only or copy-only.
