# Historical Rivet bugs

The historical corpus begins at CP57. There are no entries yet.

| ID | Fixed in | Area | Original failure | Reproduction |
| --- | --- | --- | --- | --- |
| _none yet_ | — | — | — | — |

New bug fixes must add a row and, when practical, a matching black-box test under `test/history/`.

## Security invariants established at CP70

- `SEC-001`: normal interpolation must never parse an untrusted string as HTML.
- `SEC-002`: Rivet property binding must reject `innerHTML`, `outerHTML`, and `srcdoc` sinks.

These are baseline security regressions rather than reports of an exploited release; Rivet is still pre-release.
