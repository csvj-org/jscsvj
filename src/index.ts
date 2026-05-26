/**
 * jscsvj — JavaScript / TypeScript implementation of CSVJ.
 *
 * Spec: https://csvj.org
 *
 * This package is in the bootstrap phase: the reader/writer have not been
 * implemented yet. The exports below are placeholders intended to fix the
 * public surface so downstream consumers can pin against it.
 */

export type CsvjValue = string | number | boolean | null;
export type CsvjRow = CsvjValue[];

/**
 * Parsed CSVJ table: a header row of column names plus zero or more data rows.
 * Every data row has exactly `header.length` values per the §1 ragged-row rule.
 */
export interface CsvjTable {
  header: string[];
  rows: CsvjRow[];
}

/**
 * Parse a CSVJ document.
 *
 * Not yet implemented. Tracked under the §3.2 task in
 * https://github.com/csvj-org/csvj/blob/master/PLAN.md.
 */
export function parse(_input: string): CsvjTable {
  throw new Error("jscsvj.parse: not yet implemented");
}

/**
 * Serialize a parsed CSVJ table back to its on-disk form.
 *
 * Not yet implemented. Tracked under the §3.2 task in
 * https://github.com/csvj-org/csvj/blob/master/PLAN.md.
 */
export function stringify(_table: CsvjTable): string {
  throw new Error("jscsvj.stringify: not yet implemented");
}

/**
 * Package version. Kept in sync with package.json by the release tooling.
 */
export const VERSION = "0.0.0";
