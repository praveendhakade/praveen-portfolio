import { describe, expect, it } from "vitest";
import { summarizeRetrievalEvaluation, type RetrievalEvaluationResult } from "../src/lib/rag/evaluation";

describe("retrieval threshold evaluation", () => {
  it("proposes a cutoff only when positive evidence scores separate from unsupported queries", () => {
    const results: RetrievalEvaluationResult[] = [
      { query: "supported", expectedSourceId: "project-codifi", retrievedSourceIds: ["project-codifi:0"], expectedRank: 1, relevantScore: 0.81, topScore: 0.81 },
      { query: "unsupported", expectedSourceId: null, retrievedSourceIds: ["profile:0"], expectedRank: null, relevantScore: null, topScore: 0.32 },
    ];
    const summary = summarizeRetrievalEvaluation(results);
    expect(summary.passRate).toBe(1);
    expect(summary.suggestedThreshold).toBeCloseTo(0.565);
    expect(summary.separable).toBe(true);
  });

  it("refuses to invent one threshold for overlapping results", () => {
    const results: RetrievalEvaluationResult[] = [
      { query: "supported", expectedSourceId: "project-codifi", retrievedSourceIds: ["project-codifi:0"], expectedRank: 1, relevantScore: 0.58, topScore: 0.58 },
      { query: "unsupported", expectedSourceId: null, retrievedSourceIds: ["profile:0"], expectedRank: null, relevantScore: null, topScore: 0.61 },
    ];
    expect(summarizeRetrievalEvaluation(results).suggestedThreshold).toBeNull();
  });
});
