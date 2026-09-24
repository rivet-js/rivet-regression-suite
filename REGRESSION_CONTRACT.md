# Rivet regression contract

This suite protects Rivet's **public behaviour**, not its implementation.

## Required coverage rule

When practical, every new public behaviour and every fixed bug must receive a regression test in this repository before the corresponding Rivet checkpoint or fix is considered complete.

A regression test must:

- import Rivet only through its public package entry points;
- assert observable behaviour rather than private data structures;
- be deterministic and runnable without network access;
- remain valid across internal rewrites that preserve the public contract;
- use a stable regression ID in the test name;
- keep fixtures minimal enough that a human or coding agent can understand the failure quickly.

If a behaviour cannot yet be exercised black-box because its public observation mechanism lands in a later checkpoint, record that deferral next to the framework test and add the independent regression test at the first checkpoint where it becomes observable.

## Stable IDs

Use IDs of the form:

```text
RIVET-<CATEGORY>-NNN
```

Initial categories:

| Category | Scope |
| --- | --- |
| `PACKAGE` | package entry points and public export boundaries |
| `STATE` | reactive state cells |
| `EFFECT` | effects, dependency changes, cleanup and disposal |
| `COMPUTED` | derived reactive values |
| `DOM` | template rendering and targeted DOM updates |
| `EVENT` | native event-handler integration |
| `COMPONENT` | component composition and lifecycle |
| `HYPER` | optional hypermedia request/target/swap behaviour |
| `BUG` | regressions that do not fit a durable feature category |

IDs are never recycled. A test may be rewritten as the implementation evolves, but its ID should continue to describe the same public contract.

## Bug-fix rule

For a reported bug:

1. reproduce it in this suite when practical;
2. confirm the regression test fails against the broken implementation;
3. fix Rivet;
4. confirm the regression test passes;
5. keep the test permanently unless the public behaviour is intentionally removed.

## Failure quality

A failure should make the affected contract obvious from the test name alone. Prefer one contract per test over large scenario tests that obscure the source of a failure.

## CP40 dynamic UI coverage map

The dynamic UI checkpoint is protected by black-box contracts for:

- conditionals: `RIVET-DOM-020`;
- ordinary arrays/map output: `RIVET-DOM-013` and `RIVET-DOM-014`;
- keyed identity/reordering: `RIVET-DOM-015` and `RIVET-DOM-016`;
- nested reactive composition: `RIVET-DOM-017`;
- native form properties/events: `RIVET-DOM-018`;
- class/style attributes: `RIVET-DOM-019`;
- component lifetime/refs around dynamic regions: `RIVET-COMPONENT-005` through `RIVET-COMPONENT-009`.


## Historical bugs

From CP57 onward, every fixed public bug gets a minimal reproduction under `test/history/` when practical and an entry in `BUGS.md`. Stable `RIVET-BUG-YYYY-NNN` IDs make old failures searchable across implementation rewrites.
