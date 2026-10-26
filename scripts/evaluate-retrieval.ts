import "./load-env";
import { getAiConfiguration } from "../src/lib/ai/provider";
import { getServerEnvironment } from "../src/lib/env";
import { retrieveVectorCandidates } from "../src/lib/knowledge";
import { summarizeRetrievalEvaluation, type RetrievalEvaluationCase, type RetrievalEvaluationResult } from "../src/lib/rag/evaluation";

const cases: RetrievalEvaluationCase[] = [
  { query: "What work shows .NET, SQL, and tested data transformations?", expectedSourceId: "project-data-transformation-workflows" },
  { query: "Which technologies and contributions are documented for AlignOps mobile and web?", expectedSourceId: "project-alignops-platform-work" },
  { query: "What did the Home Insurance Tool use and allow users to do?", expectedSourceId: "project-home-insurance-tool" },
  { query: "What is Praveen's degree and where did he study?", expectedSourceId: "education" },
  { query: "Which project collects links or text in a Chrome extension?", expectedSourceId: "project-leads-tracker" },
  { query: "What is Praveen's favorite movie?", expectedSourceId: null },
];

const environment = getServerEnvironment();
const ai = getAiConfiguration(environment);
if (!ai || !environment.DATABASE_URL) throw new Error("Set AI_PROVIDER_API_KEY and DATABASE_URL, apply migrations, and ingest knowledge before evaluating vector retrieval.");

const results: RetrievalEvaluationResult[] = [];
for (const item of cases) {
  const retrieved = await retrieveVectorCandidates(item.query, ai, 8);
  const expectedRank = item.expectedSourceId === null ? null : retrieved.findIndex((source) => source.id.startsWith(`${item.expectedSourceId}:`)) + 1;
  const foundRank = expectedRank === 0 ? null : expectedRank;
  const relevant = foundRank === null ? null : retrieved[foundRank - 1];
  results.push({
    query: item.query,
    expectedSourceId: item.expectedSourceId,
    retrievedSourceIds: retrieved.map((source) => source.id),
    expectedRank: foundRank,
    relevantScore: relevant?.score ?? null,
    topScore: retrieved[0]?.score ?? null,
  });
}

const summary = summarizeRetrievalEvaluation(results);
for (const result of results) {
  const passes = result.expectedSourceId === null
    ? summary.suggestedThreshold !== null && (result.topScore === null || result.topScore < summary.suggestedThreshold)
    : result.expectedRank !== null && result.expectedRank <= 3 && result.relevantScore !== null && summary.suggestedThreshold !== null && result.relevantScore >= summary.suggestedThreshold;
  console.log(`${passes ? "PASS" : "REVIEW"}\t${result.expectedSourceId ?? "no evidence expected"}\trank=${result.expectedRank ?? "none"}\tscore=${result.relevantScore?.toFixed(4) ?? result.topScore?.toFixed(4) ?? "none"}\t${result.query}`);
}
console.log(`Top-3 positive retrieval rate: ${(summary.passRate * 100).toFixed(1)}%`);
console.log(summary.suggestedThreshold === null ? "No single threshold separates these positives from the unsupported query; inspect retrieval and content before enabling vector answers." : `Evaluation-derived candidate RAG_MIN_SIMILARITY=${summary.suggestedThreshold.toFixed(4)}`);
if (results.some((result) => result.expectedSourceId && result.expectedRank === null)) process.exitCode = 1;
