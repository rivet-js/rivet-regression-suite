# Rivet Regression Suite

Independent black-box regression and conformance coverage for Rivet.

This repository intentionally tests Rivet through its **public package API and observable behaviour**. It must not import `rivet/src/*` or depend on private implementation details. This gives Rivet a verification layer that can survive internal rewrites.

## Local development

The default development layout is:

```text
workspace/
├── rivet/
└── rivet-regression-suite/
```

`package.json` points the `rivet` dependency at the sibling checkout with `file:../rivet`.

Install and run:

```sh
npm install --no-audit
npm test
```

After changing the Rivet package metadata, rerun `npm install --no-audit` here if the local package link needs refreshing.

## Regression contract

See [`REGRESSION_CONTRACT.md`](./REGRESSION_CONTRACT.md) for the required coverage rule, stable test IDs, categories, and bug-fix workflow.

## Fixtures

`fixtures/` holds black-box examples and browser fixtures as public behaviour expands. Fixtures should be minimal and named after the contract they exercise.
