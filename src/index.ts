/**
 * jscsvj — JavaScript / TypeScript implementation of CSVJ.
 *
 * Spec: https://csvj.org
 */

export type CsvjValue = string | number | boolean | null;
export type CsvjRow = CsvjValue[];

/**
 * Parsed CSVJ table: a header row of column names plus zero or more data rows.
 */
export interface CsvjTable {
  header: string[];
  rows: CsvjRow[];
}

/**
 * Parse a CSVJ document into a {@link CsvjTable}.
 *
 * Each non-empty line is treated as the body of a JSON array — line
 * `"foo",42` is parsed as `["foo",42]`. The first non-empty line is the
 * header (all values must be strings); subsequent non-empty lines are
 * data rows.
 *
 * Throws on:
 * - non-string values in the header,
 * - values that are not string / number / boolean / null
 *   (e.g. arrays, objects, or anything else JSON would accept),
 * - any RFC 8259 token CSVJ does not permit at value position
 *   (the underlying `JSON.parse` does the rejecting).
 */
export function parse(input: string): CsvjTable {
  const lines = splitLines(input);
  trimTrailingEmpty(lines);

  if (lines.length === 0) {
    throw new Error("csvj: empty input");
  }

  const rawHeader = parseLine(lines[0]!, 0);
  const header = new Array<string>(rawHeader.length);
  for (let i = 0; i < rawHeader.length; i++) {
    const v = rawHeader[i];
    if (typeof v !== "string") {
      throw new Error("csvj: non-string item at csvj header");
    }
    header[i] = v;
  }

  const rows: CsvjRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(parseLine(lines[i]!, i));
  }

  return { header, rows };
}

/**
 * Serialize a {@link CsvjTable} to a CSVJ string.
 *
 * Output is terminated by `\n`. Values are JSON-encoded with no extra
 * whitespace between them — e.g. `["a",1,null]` becomes `"a",1,null`.
 *
 * Throws on:
 * - any value that is not string / number / boolean / null,
 * - non-finite numbers (NaN, ±Infinity — RFC 8259 forbids them),
 * - any row whose length does not match `header.length`.
 */
export function stringify(table: CsvjTable): string {
  const out: string[] = [];
  out.push(serializeRow(table.header));

  const expected = table.header.length;
  for (let i = 0; i < table.rows.length; i++) {
    const row = table.rows[i]!;
    if (row.length !== expected) {
      throw new Error(
        `csvj: row ${i} has ${row.length} values, expected ${expected}`,
      );
    }
    out.push(serializeRow(row));
  }

  return out.join("\n") + "\n";
}

/** Package version. Kept in sync with package.json by the release tooling. */
export const VERSION = "0.0.0";

function splitLines(input: string): string[] {
  const raw = input.split("\n");
  const out = new Array<string>(raw.length);
  for (let i = 0; i < raw.length; i++) {
    let s = raw[i]!;
    if (s.length > 0 && s.charCodeAt(s.length - 1) === 0x0d) {
      s = s.slice(0, -1);
    }
    out[i] = s.trim();
  }
  return out;
}

function trimTrailingEmpty(lines: string[]): void {
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
}

function parseLine(line: string, lineNumber: number): CsvjValue[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse("[" + line + "]");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`csvj: parse error row ${lineNumber}: ${msg}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`csvj: parse error row ${lineNumber}: not an array`);
  }

  for (let i = 0; i < parsed.length; i++) {
    const v = parsed[i];
    if (v === null) continue;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") continue;
    throw new Error(`csvj: row ${lineNumber} parse error at item ${i}`);
  }

  return parsed as CsvjValue[];
}

function serializeRow(row: ReadonlyArray<CsvjValue>): string {
  for (let i = 0; i < row.length; i++) {
    const v = row[i];
    if (v === null) continue;
    const t = typeof v;
    if (t === "string" || t === "boolean") continue;
    if (t === "number") {
      if (!Number.isFinite(v as number)) {
        throw new Error(
          `csvj: item ${i} is not CSVJ type-safe: non-finite number`,
        );
      }
      continue;
    }
    throw new Error(`csvj: item ${i} is not CSVJ type-safe: ${t}`);
  }
  const json = JSON.stringify(row);
  return json.slice(1, -1);
}
