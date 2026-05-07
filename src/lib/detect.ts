import type { ResultType } from "@/data/types";

export type DetectorVerdict = {
  name: string;
  score: number;
  notes?: string;
};

export type DetectionResult = {
  cloneScore: number;
  verdict: ResultType;
  detectorVerdicts: DetectorVerdict[];
  rationale: string;
};

// Replace with real detector calls (Pindrop, Resemble Detect, AASIST, custom).
async function realtimeDetector(_audio: Blob): Promise<DetectorVerdict> {
  return { name: "realtime", score: 0, notes: "stub" };
}

async function forensicDetector(_audio: Blob): Promise<DetectorVerdict> {
  return { name: "forensic", score: 0, notes: "stub" };
}

async function multimodalDetector(_audio: Blob, _transcript: string): Promise<DetectorVerdict> {
  return { name: "multimodal", score: 0, notes: "stub" };
}

async function provenanceCheck(_audio: Blob): Promise<DetectorVerdict> {
  return { name: "c2pa", score: 0, notes: "stub" };
}

function classify(score: number): ResultType {
  if (score >= 0.7) return "LIKELY_CLONED";
  if (score >= 0.35) return "SUSPICIOUS";
  return "AUTHENTIC";
}

export async function detectClone(audio: Blob, transcript: string): Promise<DetectionResult> {
  const verdicts = await Promise.all([
    realtimeDetector(audio),
    forensicDetector(audio),
    multimodalDetector(audio, transcript),
    provenanceCheck(audio),
  ]);

  const cloneScore = verdicts.reduce((s, v) => s + v.score, 0) / verdicts.length;

  return {
    cloneScore,
    verdict: classify(cloneScore),
    detectorVerdicts: verdicts,
    rationale: "Stub: wire real detectors and a calibrated fusion model.",
  };
}
