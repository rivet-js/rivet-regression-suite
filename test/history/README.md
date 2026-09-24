# Historical bug corpus

This directory is the permanent home for minimal public reproductions of bugs fixed after CP57.

## Rules

1. Give each bug a stable ID: `RIVET-BUG-YYYY-NNN`.
2. Keep the reproduction as small as possible and use only Rivet's public package API.
3. Name the test file `<id>-<short-description>.test.js` using lowercase for the filename.
4. The test title must start with the stable bug ID.
5. Record the fixing Rivet commit and a one-line failure description in `BUGS.md`.
6. Never delete an old reproduction merely because internals changed. Rewrite only enough to preserve the original public failure condition.
7. If a bug cannot reasonably be automated, record why in `BUGS.md` and preserve a manual reproduction fixture.

No historical bugs are backfilled here: CP57 establishes the corpus from this point forward rather than inventing bug provenance for failures that were simply found during initial implementation.
