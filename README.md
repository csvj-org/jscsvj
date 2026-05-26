# jscsvj

[![CI](https://github.com/csvj-org/jscsvj/actions/workflows/ci.yml/badge.svg)](https://github.com/csvj-org/jscsvj/actions/workflows/ci.yml)

JavaScript / TypeScript reader and writer for [CSVJ](https://csvj.org)
files. Runs in both browsers and Node.js; ships as dual ESM/CJS with
TypeScript declarations.

> **Status (2026-05-26):** the reader and writer are implemented and
> pass every conformance vector currently published by
> [csvj-org/conformance](https://github.com/csvj-org/conformance). No
> tagged release yet — pin against the `master` branch if you want to
> experiment.

## Overview

CSVJ is a tabular data format where each value is a JSON literal. The
spec is at <https://csvj.org>; the Go reference implementation lives at
[csvj-org/gocsvj](https://github.com/csvj-org/gocsvj) and the
language-agnostic conformance suite at
[csvj-org/conformance](https://github.com/csvj-org/conformance).

This package targets parity with `gocsvj` on every conformance vector
once §3.2 lands.

## Parse

```ts
import { parse } from "jscsvj";

const table = parse(`"name","age"\n"alice",30\n"bob",null\n`);
// {
//   header: ["name", "age"],
//   rows: [
//     ["alice", 30],
//     ["bob", null],
//   ],
// }
```

The returned `CsvjTable` has a `header: string[]` (zero or more column
names) and `rows: CsvjValue[][]` where every row has exactly
`header.length` values. `CsvjValue` is `string | number | boolean | null`.

Parsing rejects every input the spec says must be rejected — see the
[conformance suite](https://github.com/csvj-org/conformance) for the
full list.

## Serialize

```ts
import { stringify } from "jscsvj";

const bytes = stringify({
  header: ["name", "age"],
  rows: [
    ["alice", 30],
    ["bob", null],
  ],
});
// `"name","age"\n"alice",30\n"bob",null\n`
```

The output is always spec-compliant CSVJ: terminated by `\n`, every row
has exactly `header.length` values, and every value is encoded as a JSON
literal.

## Install

```sh
npm install jscsvj
```

## License

MIT — see [LICENSE](LICENSE).
