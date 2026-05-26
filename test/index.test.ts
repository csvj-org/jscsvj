import { describe, expect, it } from "vitest";

import { VERSION, parse, stringify } from "../src/index.js";

describe("jscsvj scaffolding", () => {
  it("exports a VERSION string", () => {
    expect(typeof VERSION).toBe("string");
  });

  it("parse throws not-yet-implemented until §3.2 lands", () => {
    expect(() => parse("")).toThrow(/not yet implemented/);
  });

  it("stringify throws not-yet-implemented until §3.2 lands", () => {
    expect(() => stringify({ header: [], rows: [] })).toThrow(
      /not yet implemented/,
    );
  });
});
