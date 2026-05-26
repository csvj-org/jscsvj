import { describe, expect, it } from "vitest";

import {
  type CsvjTable,
  VERSION,
  parse,
  stringify,
} from "../src/index.js";

describe("jscsvj scaffolding", () => {
  it("exports a VERSION string", () => {
    expect(typeof VERSION).toBe("string");
  });
});

describe("parse", () => {
  it("reads a simple all-strings table", () => {
    const csvj =
      `"Header1", "Header2", "Header3"` +
      "\n" +
      `"Row1", "Row2", "Row3"` +
      "\n";
    expect(parse(csvj)).toEqual({
      header: ["Header1", "Header2", "Header3"],
      rows: [["Row1", "Row2", "Row3"]],
    });
  });

  it("reads mixed JSON value types", () => {
    const csvj =
      `"Header1", "Header2", "Header3"` +
      "\n" +
      `42, 3.14, false` +
      "\n" +
      `null, true, "trailing"` +
      "\n";
    expect(parse(csvj)).toEqual({
      header: ["Header1", "Header2", "Header3"],
      rows: [
        [42, 3.14, false],
        [null, true, "trailing"],
      ],
    });
  });

  it("accepts CRLF line endings", () => {
    const csvj = `"h1","h2","h3"\r\n2,4,5\r\n`;
    expect(parse(csvj)).toEqual({
      header: ["h1", "h2", "h3"],
      rows: [[2, 4, 5]],
    });
  });

  it("accepts a single trailing blank line", () => {
    const csvj =
      `"Header1", "Header2", "Header3"` +
      "\n" +
      `"Row1", "Row2", "Row3"` +
      "\n" +
      " ";
    expect(parse(csvj).rows).toEqual([["Row1", "Row2", "Row3"]]);
  });

  it("accepts a header-only file with no data rows", () => {
    expect(parse(`"a","b","c"\n`)).toEqual({
      header: ["a", "b", "c"],
      rows: [],
    });
  });

  it("preserves UTF-8 multi-byte values", () => {
    const csvj =
      `"Header1", "Header2", "Header3"` +
      "\n" +
      `"héllo", "日本語", "🚀"` +
      "\n";
    expect(parse(csvj).rows[0]).toEqual(["héllo", "日本語", "🚀"]);
  });

  it("resolves JSON string escapes", () => {
    const csvj =
      `"h1","h2","h3","h4"` +
      "\n" +
      `"line1\\nline2","tab\\there","quote\\"end","backslash\\\\"` +
      "\n";
    expect(parse(csvj).rows[0]).toEqual([
      "line1\nline2",
      "tab\there",
      `quote"end`,
      `backslash\\`,
    ]);
  });

  it("resolves \\uXXXX escapes including surrogate pairs", () => {
    const csvj = `"h1","h2"` + "\n" + `"\\u00e9","\\uD83D\\uDE00"` + "\n";
    expect(parse(csvj).rows[0]).toEqual(["é", "😀"]);
  });

  it("accepts the RFC 8259 number forms", () => {
    const csvj =
      `"h1","h2","h3","h4","h5"` + "\n" + `-1,0,1.5,1e10,-2.5e-3` + "\n";
    expect(parse(csvj).rows[0]).toEqual([-1, 0, 1.5, 1e10, -2.5e-3]);
  });

  it("rejects non-string header values", () => {
    const csvj = `"Header1", 1, "Header2", "Header3"` + "\n";
    expect(() => parse(csvj)).toThrow(/header/);
  });

  it("rejects invalid value tokens", () => {
    const csvj =
      `"Header1", "Header2", "Header3"` + "\n" + `42, $, false` + "\n";
    expect(() => parse(csvj)).toThrow(/parse error/);
  });

  it("rejects array values (only scalars allowed)", () => {
    const csvj =
      `"Header1", "Header2", "Header3"` + "\n" + `42, [], false` + "\n";
    expect(() => parse(csvj)).toThrow(/parse error/);
  });

  it("rejects object values (only scalars allowed)", () => {
    const csvj =
      `"Header1", "Header2"` + "\n" + `42, {"k":"v"}` + "\n";
    expect(() => parse(csvj)).toThrow(/parse error/);
  });

  it("rejects an empty input", () => {
    expect(() => parse("")).toThrow(/empty/);
  });

  it("handles a 64 KiB value", () => {
    const long = "a".repeat(64 * 1024);
    const csvj = `"h1"` + "\n" + `"` + long + `"` + "\n";
    const row = parse(csvj).rows[0]!;
    expect(row).toHaveLength(1);
    expect(row[0]).toBe(long);
  });
});

describe("stringify", () => {
  it("writes a simple all-strings table", () => {
    expect(
      stringify({
        header: ["Header1", "Header2", "Header3"],
        rows: [["Row1", "Row2", "Row3"]],
      }),
    ).toBe(`"Header1","Header2","Header3"\n"Row1","Row2","Row3"\n`);
  });

  it("writes mixed JSON value types", () => {
    expect(
      stringify({
        header: ["a", "b", "c"],
        rows: [
          [42, 3.14, false],
          [null, true, "trailing"],
        ],
      }),
    ).toBe(`"a","b","c"\n42,3.14,false\nnull,true,"trailing"\n`);
  });

  it("writes a header-only file", () => {
    expect(stringify({ header: ["x", "y"], rows: [] })).toBe(`"x","y"\n`);
  });

  it("escapes special characters in strings", () => {
    expect(
      stringify({
        header: ["a"],
        rows: [['has "quotes" and \n newline']],
      }),
    ).toBe(`"a"\n"has \\"quotes\\" and \\n newline"\n`);
  });

  it("rejects rows that do not match the header length", () => {
    expect(() =>
      stringify({
        header: ["a", "b"],
        rows: [[1, 2, 3]],
      }),
    ).toThrow(/row 0 has 3 values, expected 2/);
  });

  it("rejects non-finite numbers", () => {
    expect(() =>
      stringify({
        header: ["a"],
        rows: [[Number.NaN]],
      }),
    ).toThrow(/non-finite/);
    expect(() =>
      stringify({
        header: ["a"],
        rows: [[Number.POSITIVE_INFINITY]],
      }),
    ).toThrow(/non-finite/);
  });

  it("rejects unsupported value types", () => {
    expect(() =>
      stringify({
        header: ["a"],
        // Force the type system to look past CsvjValue so we can verify
        // the runtime guard refuses array values.
        rows: [[[1, 2] as unknown as null]],
      }),
    ).toThrow(/not CSVJ type-safe/);
  });
});

describe("round-trip", () => {
  it("parse∘stringify is identity on parsed content", () => {
    const table: CsvjTable = {
      header: ["name", "age", "active"],
      rows: [
        ["alice", 30, true],
        ["bob", null, false],
        ["héllo 🚀", 1e10, true],
      ],
    };
    expect(parse(stringify(table))).toEqual(table);
  });

  it("stringify∘parse normalises whitespace but preserves content", () => {
    const input =
      `"name", "age"` + "\n" + `"alice", 30` + "\n" + `"bob", null` + "\n";
    const normalised = `"name","age"\n"alice",30\n"bob",null\n`;
    expect(stringify(parse(input))).toBe(normalised);
  });
});
