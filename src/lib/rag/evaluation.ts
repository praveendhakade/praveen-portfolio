export type RetrievalEvaluationCase = { query: string; expectedSourceId: string | null };
export type RetrievalEvaluationResult = { query: string; expectedSourceId: string | null; retrievedSourceIds: string[]; expectedRank: number | null; relevantScore: number | null; topScore: number | null };

export function summarizeRetrievalEvaluation(results: RetrievalEvaluationResult[]): { passRate: number; suggestedThreshold: number | null; separable: boolean } {
  if (!results.length) return { passRate: 0, suggestedThreshold: null, separable: false };
  const positiveScores = results.flatMap((result) => result.expectedSourceId && result.relevantScore !== null ? [result.relevantScore] : []);
  const negativeScores = results.flatMap((result) => !result.expectedSourceId && result.topScore !== null ? [result.topScore] : []);
  const positiveFloor = positiveScores.length ? Math.min(...positiveScores) : null;
  const negativeCeiling = negativeScores.length ? Math.max(...negativeScores) : 0;
  const separable = positiveFloor !== null && positiveFloor > negativeCeiling;
  const suggestedThreshold = separable ? (positiveFloor + negativeCeiling) / 2 : null;
  const passes = results.filter((result) => result.expectedSourceId === null
    ? suggestedThreshold !== null && (result.topScore === null || result.topScore < suggestedThreshold)
    : result.expectedRank !== null && result.expectedRank <= 3 && result.relevantScore !== null && suggestedThreshold !== null && result.relevantScore >= suggestedThreshold).length;
  return { passRate: passes / results.length, suggestedThreshold, separable };
}
