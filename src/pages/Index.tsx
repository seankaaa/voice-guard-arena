import { useState, useCallback, useRef, useEffect } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
import { WelcomeOverlay } from "@/components/arena/WelcomeOverlay";
import { AudioUpload } from "@/components/arena/AudioUpload";
import { UseCases } from "@/components/arena/UseCases";
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
  violence_harm: "Violence/Harm",
  jailbreak: "Jailbreak",
  coded_language: "Coded Language",
  code_switch: "Code-Switch",
  scam_vishing: "Scam/Vishing",
  authority_spoof: "Authority Spoof",
  safe: "Safe",
};

function makeTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function saveEntryToDb(entry: AttackEntry) {
  try {
    await supabase.from("attack_history").insert({
      timestamp: entry.timestamp,
      transcript: entry.transcript,
      category: entry.category,
      result: entry.result,
      confidence: entry.confidence,
      explanation: entry.explanation,
      attack_label: entry.attackLabel,
      agent_response: entry.agentResponse,
      audio_file_url: entry.audioFileUrl || null,
      use_case: entry.useCase || null,
    });
  } catch (err) {
    console.error("Failed to save to DB:", err);
  }
}

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(true);
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
  const [anthropicKey, setAnthropicKey] = useState(() => localStorage.getItem("anthropicKey") || "");
  const [activeUseCase, setActiveUseCase] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved history from DB on mount
  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from("attack_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data && data.length > 0) {
        const dbEntries: AttackEntry[] = data.map((row: any) => ({
          id: row.id,
          timestamp: row.timestamp,
          transcript: row.transcript,
          category: row.category as AttackCategory,
          result: row.result as ResultType,
          confidence: Number(row.confidence),
          agentResponse: row.agent_response || "",
          explanation: row.explanation || "",
          attackLabel: row.attack_label || "",
          audioFileUrl: row.audio_file_url || undefined,
          useCase: row.use_case || undefined,
        }));
        setHistory(dbEntries);
      }
    }
    loadHistory();
  }, []);

  const addEntry = useCallback((entry: AttackEntry) => {
    setHistory((prev) => [entry, ...prev]);
    saveEntryToDb(entry);
  }, []);

  const handleMicTranscript = useCallback(
    async (text: string) => {
      setTranscript(text);
      setJudgeResult(null);
      setAudioUrl(null);
      setIsGenerating(true);

      setPipelineStage("Analyzing...");
      const keywordResult = scanKeywords(text);
      const keywordOnlyResult: ResultType = keywordResult.matched
        ? keywordResult.severity >= 5
          ? "BLOCKED"
          : "WARNING"
        : "SAFE";
      const keywordOnlyCategory = keywordResult.matched
        ? (CATEGORY_MAP[keywordResult.category!] || "Unknown")
        : "Safe";
      const keywordOnlyLabel = keywordResult.matched
        ? `${keywordOnlyCategory} — keyword_match`
        : "No Threat Detected";
      const keywordOnlyExplanation = keywordResult.matched
        ? `Keyword match${anthropicKey ? "" : " (no Anthropic key)"}: ${keywordResult.terms.join(", ")}`
        : anthropicKey
          ? "No threats detected (LLM unavailable)"
          : "Add Anthropic key for deeper analysis.";
      const keywordOnlyAgentResponse = keywordResult.matched
        ? "Potential risk detected via keyword scan."
        : "Request appears safe.";

      if (!anthropicKey) {
        setResult(keywordOnlyResult);
        setAttackLabel(keywordOnlyLabel);
        setConfidence(keywordResult.matched ? (keywordResult.severity >= 5 ? 0.92 : 0.5) : 1);
        setExplanation(keywordOnlyExplanation);
        setAgentResponse(keywordOnlyAgentResponse);
        setIsGenerating(false);
        setPipelineStage(null);
        return;
      }

      try {
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

        setPipelineStage("Generating response...");
        const agentText = await generateAgentResponse(text, anthropicKey);
        setAgentResponse(agentText);

        setPipelineStage("Speaking...");
        try {
          const url = await textToSpeech(agentText);
          setAudioUrl(url);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.play().catch(() => {});
        } catch (err: any) {
          console.error("TTS error:", err);
        }

        setPipelineStage("Judging...");
        try {
          const judge = await judgeGuardrail(text, agentText, anthropicKey);
          setJudgeResult(judge);
        } catch (err: any) {
          console.error("Judge error:", err);
        }

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
          useCase: activeUseCase || undefined,
        };
        addEntry(entry);
      } catch (err: any) {
        console.error("Pipeline error:", err);
        toast.error("Pipeline failed: " + (err.message || "Unknown error"));
        setResult(keywordOnlyResult);
        setAttackLabel(keywordOnlyLabel);
        setConfidence(keywordResult.matched ? (keywordResult.severity >= 5 ? 0.92 : 0.5) : 1);
        setExplanation(keywordOnlyExplanation);
        setAgentResponse(keywordOnlyAgentResponse);
      } finally {
        setIsGenerating(false);
        setPipelineStage(null);
      }
    },
    [anthropicKey, activeUseCase, addEntry]
  );

  const handleFileAnalyze = useCallback(
    async (audioFileUrl: string, transcribedText: string) => {
      setTranscript(transcribedText);
      setJudgeResult(null);
      setAudioUrl(null);
      setIsGenerating(true);

      setPipelineStage("Analyzing uploaded audio...");
      const keywordResult = scanKeywords(transcribedText);
      const keywordOnlyResult: ResultType = keywordResult.matched
        ? keywordResult.severity >= 5
          ? "BLOCKED"
          : "WARNING"
        : "SAFE";
      const keywordOnlyCategory = keywordResult.matched
        ? (CATEGORY_MAP[keywordResult.category!] || "Unknown")
        : "Safe";
      const keywordOnlyLabel = keywordResult.matched
        ? `${keywordOnlyCategory} — keyword_match`
        : "No Threat Detected";
      const keywordOnlyExplanation = keywordResult.matched
        ? `Keyword match${anthropicKey ? "" : " (no Anthropic key)"}: ${keywordResult.terms.join(", ")}`
        : anthropicKey
          ? "No threats detected (LLM unavailable)"
          : "Add Anthropic key for deeper analysis.";
      const keywordOnlyAgentResponse = keywordResult.matched
        ? "Potential risk detected via keyword scan."
        : "Request appears safe.";
      const keywordOnlyConfidence = keywordResult.matched
        ? keywordResult.severity >= 5
          ? 0.92
          : 0.5
        : 1;

      if (!anthropicKey) {
        setResult(keywordOnlyResult);
        setAttackLabel(keywordOnlyLabel);
        setConfidence(keywordOnlyConfidence);
        setExplanation(keywordOnlyExplanation);
        setAgentResponse(keywordOnlyAgentResponse);

        addEntry({
          id: makeId(),
          timestamp: makeTimestamp(),
          transcript: transcribedText,
          category: keywordOnlyCategory as AttackCategory,
          result: keywordOnlyResult,
          confidence: keywordOnlyConfidence,
          agentResponse: keywordOnlyAgentResponse,
          explanation: keywordOnlyExplanation,
          attackLabel: keywordOnlyLabel,
          audioFileUrl,
          useCase: activeUseCase || undefined,
        });

        setIsGenerating(false);
        setPipelineStage(null);
        return;
      }

      try {
        const llmResult = await classifyWithLLM(transcribedText, anthropicKey);
        const combined = combineResults(keywordResult, llmResult);
        const category = CATEGORY_MAP[combined.category] || "Safe";
        const label = combined.subtype === "none"
          ? "No Threat Detected"
          : `${category} — ${combined.subtype}`;

        setResult(combined.status);
        setAttackLabel(label);
        setConfidence(combined.confidence);
        setExplanation(combined.explanation);

        setPipelineStage("Generating response...");
        const agentText = await generateAgentResponse(transcribedText, anthropicKey);
        setAgentResponse(agentText);

        addEntry({
          id: makeId(),
          timestamp: makeTimestamp(),
          transcript: transcribedText,
          category,
          result: combined.status,
          confidence: combined.confidence,
          agentResponse: agentText,
          explanation: combined.explanation,
          attackLabel: label,
          audioFileUrl,
          useCase: activeUseCase || undefined,
        });
      } catch (err: any) {
        console.error("File analysis error:", err);
        toast.error("Analysis failed: " + (err.message || "Unknown error"));

        setResult(keywordOnlyResult);
        setAttackLabel(keywordOnlyLabel);
        setConfidence(keywordOnlyConfidence);
        setExplanation(keywordOnlyExplanation);
        setAgentResponse(keywordOnlyAgentResponse);

        addEntry({
          id: makeId(),
          timestamp: makeTimestamp(),
          transcript: transcribedText,
          category: keywordOnlyCategory as AttackCategory,
          result: keywordOnlyResult,
          confidence: keywordOnlyConfidence,
          agentResponse: keywordOnlyAgentResponse,
          explanation: keywordOnlyExplanation,
          attackLabel: keywordOnlyLabel,
          audioFileUrl,
          useCase: activeUseCase || undefined,
        });
      } finally {
        setIsGenerating(false);
        setPipelineStage(null);
      }
    },
    [anthropicKey, activeUseCase, addEntry]
  );

  const handleRunTest = useCallback(async (presetIndex: number) => {
    const preset = PRESET_ATTACKS[presetIndex];
    if (!preset) return;

    setResult(null);
    setAttackLabel(null);
    setConfidence(null);
    setExplanation(null);
    setAgentResponse(null);
    setJudgeResult(null);
    setAudioUrl(null);
    setIsGenerating(true);

    setMicState("processing");
    setPipelineStage("Transcribing...");
    await delay(1000);
    setTranscript(preset.transcript);

    setPipelineStage("Analyzing safety...");
    await delay(1000);
    setResult(preset.result);
    setAttackLabel(preset.attackLabel);
    setConfidence(preset.confidence);
    setExplanation(preset.explanation);

    setPipelineStage("Agent responding...");
    await delay(1000);
    setAgentResponse(preset.agentResponse);

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
      useCase: activeUseCase || undefined,
    };
    addEntry(entry);

    setMicState("idle");
    setIsGenerating(false);
    setPipelineStage(null);
  }, [activeUseCase, addEntry]);

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
      <WelcomeOverlay open={showWelcome} onStart={() => setShowWelcome(false)} />

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
              />
            </div>
            <AudioUpload onFileAnalyze={handleFileAnalyze} isProcessing={isGenerating} />
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
              anthropicKey={anthropicKey}
              onAnthropicKeyChange={(k) => { setAnthropicKey(k); localStorage.setItem("anthropicKey", k); }}
            />
          </div>

          {/* RIGHT PANEL */}
          <div className="flex flex-col gap-4 lg:w-[60%]">
            <UseCases activeUseCase={activeUseCase} onSelect={setActiveUseCase} />
            <MetricCards history={history} />
            <AttackHistory history={history} onSelect={handleSelectEntry} />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <AttackDistribution history={history} />
              <QuickTest onRun={handleRunTest} />
            </div>
          </div>
        </div>

        <footer className="mt-8 pb-4 text-center">
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground/50">
            Built by Anna Karpenko | Stanford '26 | ElevenLabs x Lovable Hackathon
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
