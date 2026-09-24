# Rivet public regression coverage audit

CP56 maps the documented public surface to black-box regression IDs. The suite imports Rivet only through the package export and is intended to survive internal rewrites.

| Public behaviour | Regression coverage |
| --- | --- |
| Package import/public root | `RIVET-PACKAGE-001` |
| `state()` `.value`, identity, same-value writes | `RIVET-STATE-001..003` |
| `computed()` laziness/cache/chains/errors/cycles | `RIVET-COMPUTED-001..005` |
| `effect()` tracking/cleanup/cycles/synchronous propagation | `RIVET-EFFECT-001..007` |
| `html` + `render()` static/safe text/native nodes/nested templates | `RIVET-DOM-001..004`, `011` |
| Reactive text/expression regions | `RIVET-DOM-005..006`, `012`, `014`, `017`, `020` |
| Dynamic attributes/properties/forms/classes/styles | `RIVET-DOM-007..009`, `018..019` |
| Native event bindings | `RIVET-EVENT-001..002` |
| `mount()` element/selector/unmount | `RIVET-MOUNT-001..002`, `RIVET-COMPONENT-007`, `009` |
| Function components / props / children | `RIVET-COMPONENT-001..004` |
| `onCleanup()` / `ref` / subtree cleanup | `RIVET-COMPONENT-005..009`, `RIVET-CLEANUP-001..002` |
| Arrays and `key()` identity / duplicate keys | `RIVET-DOM-013..017` |
| Shared state / stress-style composition | `RIVET-APP-001..002` |
| Native DOM interoperability | `RIVET-INTEROP-001` |
| `request()` response/errors/native fetch options | `RIVET-HYPER-001..002`, `005`, `012` |
| `swap()` target and all four modes | `RIVET-HYPER-003`, `011` |
| Request/swap lifecycle events | `RIVET-HYPER-004..005` |
| `enhance()` `r-get` / `r-post` / targets / triggers | `RIVET-HYPER-006`, `008`, `010` |
| Progressive POST/GET forms | `RIVET-HYPER-007`, `009` |

## Explicit non-regression items

- TypeScript typings: not shipped.
- Client routing/history: deliberately not shipped at CP53.
- Polling, confirmation DSL, websocket/SSE abstractions, animation/plugin systems: deliberately deferred at CP47.
- Performance and memory characteristics are certification concerns rather than semantic contracts; CP59/CP60 maintain dedicated harnesses instead of treating timing as a normal regression assertion.
- Exact minified byte size is handled by the size gate phase rather than black-box behavioural tests.

When a public behaviour is added, this matrix must be updated in the same checkpoint. A behaviour should not be documented as supported without either an independent regression ID or a specific reason it cannot/should not be black-box tested.
