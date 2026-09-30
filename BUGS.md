# Historical Rivet bugs

The historical corpus begins at CP57.

| ID | Fixed in | Area | Original failure | Reproduction |
| --- | --- | --- | --- | --- |
| `RIVET-DOM-021` | pre-v0.1 performance hold | table-context rendering | Reactive keyed output inside table sections could lose its insertion boundary after HTML parser context handling. | `test/history/RIVET-DOM-021-table-context.md` + Chromium browser certification |
| `RIVET-DOM-022` | pre-v0.1 performance hold | keyed reconciliation | Reusing a key preserved the old template values, so changed labels/attributes for retained keys did not update. | `RIVET-DOM-015` in `test/render.test.js` |

New bug fixes must add a row and, when practical, a matching black-box test under `test/history/` or a stable public-behaviour regression ID.

## Security invariants established at CP70

- `SEC-001`: normal interpolation must never parse an untrusted string as HTML.
- `SEC-002`: Rivet property binding must reject `innerHTML`, `outerHTML`, and `srcdoc` sinks.

These are baseline security regressions rather than reports of an exploited release; Rivet is still pre-release.
