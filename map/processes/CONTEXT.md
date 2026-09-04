# Process shelf

## Job

This shelf records movements that are wired in current source. A process may be live and still contain a broken or mismatched edge; those edges are stated explicitly.

## Inputs

Object cards, schema cards, and the orchestration sources cited by each process.

## Process

Open one process card for Input → Movement → Output. Follow only its consumed and produced object cards. Use `effects/CONTEXT.md` before changing a movement.

## Output

Six verified movement cards cover session bootstrap, authentication, storefront/cart, checkout/order/stock, admin management, and product seeding.

## Human check

Do not infer success from intent or UI copy. Confirm that every called method/path exists and that the caller consumes the response actually returned.
