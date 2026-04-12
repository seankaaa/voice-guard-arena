import { useState, useCallback, useRef } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { scanKeywords, classifyWithLLM, combineResults, generateAgentResponse, judgeGuardrail } from "@/lib/safety";
import { textToSpeech } from "@/lib/elevenlabs";
import { MicButton } from "@/components/arena/MicButton";
import { TranscriptCard } from "@/components/arena/TranscriptCard";
import { ThreatAssessment } from "@/components/arena/ThreatAssessment";
import { AgentResponse, type JudgeResult } from "@/components/arena/AgentResponse";
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
  type AttackCategory,
} from "@/data/mockData";

type MicState = "idle" | "recording" | "processing";

const CATEGORY_MAP: Record<string, AttackCategory> = {
  jailbreak: "Jailbreak",
  coded_language: "Coded Language",
  scam_vishing: "Scam/Vishing",
  authority_spoof: "Authority Spoof",
  safe: "Safe",
};

function makeTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

const Index = () => {
  const [micState, setMicState] = useState<MicState>("idle");
  const [history, setHistory] = useState<AttackEntry[]>([...INITIAL_HISTORY].reverse());
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType | null>(null);
  const [attackLabel, setAttackLabel] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleMicTranscript = useCallback(
    async (text: string) => {
      setTranscript(text);
      setJudgeResult(null);
      setAudioUrl(null);
      setIsGenerating(true);

      // 1) Keyword scan (instant)
      setPipelineStage("Analyzing...");
      const keywordResult = scanKeywords(text);

      if (!anthropicKey) {
        // Keyword-only fallback
        if (keywordResult.matched) {
          setResult("WARNING");
          setAttackLabel(CATEGORY_MAP[keywordResult.category!] || "Unknown");
          setConfidence(0.5);
          setExplanation("Keyword match (no Anthropic key): " + keywordResult.terms.join(", "));
          setAgentResponse("Potential risk detected via keyword scan.");
        } else {
          setResult("SAFE");
          setAttackLabel("No Threat Detected");
          setConfidence(1);
          setExplanation("Add Anthropic key for deeper analysis.");
          setAgentResponse("Request appears safe.");
        }
        setIsGenerating(false);
        setPipelineStage(null);
        return;
      }

      try {
        // 2) LLM classification
        const llmResult = await classifyWithLLM(text, anthropicKey);
        const combined = combineResults(keywordResult, llmResult);
        const category = CATEGORY_MAP[combined.category] || "Safe";
        const label = combined.subtype === "none"
          ? "No Threat Detected"
          : `${category} — ${combined.subtype}`;

        setResult(combined.status);
        setAttackLabel(label);
        setConfidence(combined.confidence);
        setExplanation(combined.explanation);

        // 3) Generate guarded agent response
        setPipelineStage("Generating response...");
        const agentText = await generateAgentResponse(text, anthropicKey);
        setAgentResponse(agentText);

        // 4) TTS — speak the response
        if (elevenLabsKey) {
          setPipelineStage("Speaking...");
          try {
            const url = await textToSpeech(agentText, elevenLabsKey);
            setAudioUrl(url);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.play().catch(() => {});
          } catch (err: any) {
            console.error("TTS error:", err);
          }
        }

        // 5) Safety judge
        setPipelineStage("Judging...");
        try {
          const judge = await judgeGuardrail(text, agentText, anthropicKey);
          setJudgeResult(judge);
        } catch (err: any) {
          console.error("Judge error:", err);
        }

        // 6) Add to history
        const entry: AttackEntry = {
          id: makeId(),
          timestamp: makeTimestamp(),
          transcript: text,
          category,
          result: combined.status,
          confidence: combined.confidence,
          agentResponse: agentText,
          explanation: combined.explanation,
          attackLabel: label,
        };
        setHistory((prev) => [entry, ...prev]);
      } catch (err: any) {
        console.error("Pipeline error:", err);
        toast.error("Pipeline failed: " + (err.message || "Unknown error"));

        // Keyword fallback on error
        if (keywordResult.matched) {
          setResult("WARNING");
          setAttackLabel(CATEGORY_MAP[keywordResult.category!] || "Unknown");
          setConfidence(0.5);
          setExplanation("Keyword match: " + keywordResult.terms.join(", "));
          setAgentResponse("Potential risk detected via keyword scan.");
        } else {
          setResult("SAFE");
          setAttackLabel("No Threat Detected");
          setConfidence(1);
          setExplanation("No threats detected (LLM unavailable)");
          setAgentResponse("Request appears safe.");
        }
      } finally {
        setIsGenerating(false);
        setPipelineStage(null);
      }
    },
    [anthropicKey, elevenLabsKey]
  );

  const handleRunTest = useCallback((presetIndex: number) => {
    const preset = PRESET_ATTACKS[presetIndex];
    if (!preset) return;

    setMicState("processing");
    setTranscript(preset.transcript);
    setJudgeResult(null);
    setAudioUrl(null);

    setTimeout(() => {
      const entry: AttackEntry = {
        id: makeId(),
        timestamp: makeTimestamp(),
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
    setJudgeResult(null);
    setAudioUrl(null);
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
            <AgentResponse
              response={agentResponse}
              judgeResult={judgeResult}
              audioUrl={audioUrl}
              isGenerating={isGenerating}
              pipelineStage={pipelineStage}
            />
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
