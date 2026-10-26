import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizeText, splitIntoChunks } from "../src/lib/rag/chunking";

describe("RAG normalization and chunking", () => {
  it("normalizes newlines and repeated whitespace before hashing", () => {
    expect(normalizeText("one\r\n  two\n\n\nthree")).toBe("one two\n\nthree");
    const first = createHash("sha256").update(normalizeText("one\r\n two")).digest("hex");
    const second = createHash("sha256").update(normalizeText("one\n two")).digest("hex");
    expect(first).toBe(second);
  });

  it("keeps bounded overlapping chunks and handles empty documents", () => {
    const words = Array.from({ length: 80 }, (_, index) => `word${index}`);
    const chunks = splitIntoChunks(words.join(" "), 80, 4);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 90)).toBe(true);
    const firstTokens = chunks[0].split(" ");
    const nextTokens = chunks[1].split(" ");
    expect(nextTokens.slice(0, 4)).toEqual(firstTokens.slice(-4));
    expect(splitIntoChunks("  \n ")).toEqual([]);
  });
});
