# Schema shelf

## Job

This shelf maps representations that cut across object cards: client types, inferred Supabase rows, HTTP contracts, browser/provider state, and runtime configuration.

## Inputs

- `lib/types.ts` for named client interfaces.
- `app/api/**/route.ts` for request, response, authorization, and inferred database fields.
- `context/*.tsx` for consumer expectations and browser persistence.
- Supabase client modules, middleware, `next.config.mjs`, and `package.json` for runtime boundaries.

## Process

Choose the boundary being changed and open one schema card. If the change affects a noun, follow the linked object card. If it affects a workflow, follow the linked process card.

## Output

Schema cards state what is authoritative, what is only inferred, and where representations currently disagree.

## Human check

Do not upgrade `supabase-data-model.md` into an authoritative database schema without committed SQL/migrations or a directly inspected database definition.
