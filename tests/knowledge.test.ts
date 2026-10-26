import { describe, expect, it } from "vitest";
import { retrieve } from "../src/lib/knowledge";

describe("portfolio knowledge retrieval", () => {
  it("returns evidence about .NET and SQL work", () => {
    const sources = retrieve("What experience with .NET and SQL?");
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.some((source) => source.href === "/experience" || source.href.startsWith("/projects/"))).toBe(true);
  });

  it("returns no source for unsupported questions", () => {
    expect(retrieve("What is Praveen's favorite movie?")).toHaveLength(0);
  });

  it("bounds the number of results", () => {
    expect(retrieve("React TypeScript C# SQL mobile", 2)).toHaveLength(2);
  });
});
