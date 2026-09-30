# RIVET-DOM-021 — reactive table-section rendering

Discovered by the cross-framework benchmark during the first real-browser Rivet run.

## Failure

A reactive/keyed interpolation inside table parsing contexts such as `<tbody>` could throw a browser `NotFoundError` from `insertBefore()`. Two browser behaviours exposed the bug:

1. text sentinel markers are not stable children in HTML table parsing contexts; and
2. root reactive regions initially belong to a `DocumentFragment`, then move into their mount target, so update closures must follow the live anchor parent rather than retaining the transient fragment parent.

Nested table-row templates also need to be parsed against the live insertion context so `<tr>` is created with `<tbody>` semantics.

## Regression

`browser/certification.html` mounts a reactive keyed list directly into `<tbody>`, inserts two `<tr>` rows, and reverses them. The Chromium lane must complete without an invalid insertion anchor and preserve keyed reorder behaviour.
