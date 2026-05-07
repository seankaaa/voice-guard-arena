export type ResultType = "AUTHENTIC" | "SUSPICIOUS" | "LIKELY_CLONED";

export type CallEntry = {
  id: string;
  timestamp: string;
  transcript: string;
  audioUrl?: string;
  result: ResultType;
  cloneScore: number;
  detectorVerdicts?: Record<string, number>;
  notes?: string;
};

export const RESULT_COLORS: Record<ResultType, string> = {
  AUTHENTIC: "#22c55e",
  SUSPICIOUS: "#f59e0b",
  LIKELY_CLONED: "#ef4444",
};

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}
