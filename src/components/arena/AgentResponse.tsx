import { Volume2, Loader2 } from "lucide-react";

export interface JudgeResult {
  guardrail_held: boolean;
  score: number;
  note: string;
}

interface AgentResponseProps {
  response: string | null;
  judgeResult: JudgeResult | null;
  audioUrl: string | null;
  isGenerating?: boolean;
  pipelineStage?: string | null;
}

export function AgentResponse({
  response,
  judgeResult,
  audioUrl,
  isGenerating,
  pipelineStage,
}: AgentResponseProps) {
  const handlePlayAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Agent Response
        </h3>
        <div className="flex items-center gap-2">
          {isGenerating && pipelineStage && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-amber">
              <Loader2 className="h-3 w-3 animate-spin" />
              {pipelineStage}
            </span>
          )}
          {audioUrl && (
            <button
              onClick={handlePlayAudio}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p
        className={`font-body text-sm leading-relaxed ${
          response ? "text-foreground" : "italic text-muted-foreground"
        }`}
      >
        {response || "Agent response will appear here..."}
      </p>

      {judgeResult && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold ${
              judgeResult.guardrail_held
                ? "bg-cyan/15 text-cyan"
                : "bg-red/15 text-red"
            }`}
          >
            {judgeResult.guardrail_held ? "Guardrail held ✓" : "Guardrail breach ✗"}
            {" "}
            ({judgeResult.score.toFixed(2)})
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {judgeResult.note}
          </span>
        </div>
      )}
    </div>
  );
}
