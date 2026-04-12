import { useState, useCallback } from "react";
import { Shield } from "lucide-react";
import { MicButton } from "@/components/arena/MicButton";
import { TranscriptCard } from "@/components/arena/TranscriptCard";
import { ThreatAssessment } from "@/components/arena/ThreatAssessment";
import { AgentResponse } from "@/components/arena/AgentResponse";
import { MetricCards } from "@/components/arena/MetricCards";
import { AttackHistory } from "@/components/arena/AttackHistory";
import { AttackDistribution } from "@/components/arena/AttackDistribution";
import { QuickTest } from "@/components/arena/QuickTest";
import { SettingsPanel } from "@/components/arena/SettingsPanel";
import {
  PRESET_ATTACKS,
  INITIAL_HISTORY,
  makeId,
  type AttackEntry,
  type ResultType,
} from "@/data/mockData";

type MicState = "idle" | "recording" | "processing";

const Index = () => {
  const [micState, setMicState] = useState<MicState>("idle");
  const [history, setHistory] = useState<AttackEntry[]>([...INITIAL_HISTORY].reverse());
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType | null>(null);
  const [attackLabel, setAttackLabel] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");

  const handleMicTranscript = useCallback((text: string) => {
    setTranscript(text);
    // For now, real mic transcripts don't run classification — just show the text
    setResult(null);
    setAttackLabel(null);
    setConfidence(null);
    setExplanation(null);
    setAgentResponse(null);
  }, []);

  const handleRunTest = useCallback((presetIndex: number) => {
    const preset = PRESET_ATTACKS[presetIndex];
    if (!preset) return;

    setMicState("processing");
    setTranscript(preset.transcript);

    setTimeout(() => {
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      const entry: AttackEntry = {
        id: makeId(),
        timestamp: ts,
        transcript: preset.transcript,
        category: preset.category,
        result: preset.result,
        confidence: preset.confidence,
        agentResponse: preset.agentResponse,
        explanation: preset.explanation,
        attackLabel: preset.attackLabel,
      };

      setResult(preset.result);
      setAttackLabel(preset.attackLabel);
      setConfidence(preset.confidence);
      setExplanation(preset.explanation);
      setAgentResponse(preset.agentResponse);
      setHistory((prev) => [entry, ...prev]);
      setMicState("idle");
    }, 800);
  }, []);

  const handleSelectEntry = useCallback((entry: AttackEntry) => {
    setTranscript(entry.transcript);
    setResult(entry.result);
    setAttackLabel(entry.attackLabel);
    setConfidence(entry.confidence);
    setExplanation(entry.explanation);
    setAgentResponse(entry.agentResponse);
  }, []);

  return (
    <div className="relative min-h-screen bg-background scanline">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--cyan)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--cyan)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] p-4 lg:p-6">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/10 glow-cyan">
            <Shield className="h-5 w-5 text-cyan" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">
              Voice Safeguard Arena
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              AI Voice Safety Guardrail Testing
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-5 lg:flex-row">
          {/* LEFT PANEL */}
          <div className="flex flex-col gap-4 lg:w-[40%]">
            <div className="glass-card flex justify-center p-8">
              <MicButton
                state={micState}
                onStateChange={setMicState}
                onTranscript={handleMicTranscript}
                elevenLabsKey={elevenLabsKey}
              />
            </div>
            <TranscriptCard transcript={transcript} />
            <ThreatAssessment
              result={result}
              attackLabel={attackLabel}
              confidence={confidence}
              explanation={explanation}
            />
            <AgentResponse response={agentResponse} />
            <SettingsPanel
              elevenLabsKey={elevenLabsKey}
              anthropicKey={anthropicKey}
              onElevenLabsKeyChange={setElevenLabsKey}
              onAnthropicKeyChange={setAnthropicKey}
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-4 lg:w-[60%]">
            <MetricCards history={history} />
            <AttackHistory history={history} onSelect={handleSelectEntry} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AttackDistribution history={history} />
              <QuickTest onRun={handleRunTest} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
