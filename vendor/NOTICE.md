# Vendor Notices

## `stallion-mock.mjs`

Vendored copy of the [Stallion](https://github.com/akspro9866-art) mock bridge
(`dist/stallion-mock.mjs`, mock bridge build 0.11.0) from the `stallion` repository
(MIT License, © Cavalry MCP / Stallion authors).

**Why vendored:** the Tier 3 headless verification tests (`test/*.test.mjs`) and the
mock mode of `scripts/apply-effect.mjs` require a headless Cavalry scene mock. Vendoring
keeps this repository fully self-contained — a clean clone passes the complete test
suite with zero external checkouts, zero npm dependencies, and no silent skips.

**Upgrade procedure:** replace this file with the `dist/stallion-mock.mjs` output of a
newer `stallion` build and run `npm test`. The file is a self-contained ES module
bundle importing only Node.js builtins (`node:http`, `node:vm`, `node:crypto`,
`node:fs`, `node:os`, `node:path`, `node:url`, `node:zlib`).

The client used to talk to this mock (and to the live server) lives at
`scripts/lib/stallion-client.mjs` and speaks the documented protocol in
`references/cavalry-api.md` (POST `/post`, poll GET `/get`).
