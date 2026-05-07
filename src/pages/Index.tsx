import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { MicButton } from "@/components/arena/MicButton";
import { TranscriptCard } from "@/components/arena/TranscriptCard";
import { AudioUpload } from "@/components/arena/AudioUpload";
import { MetricCards } from "@/components/arena/MetricCards";
import { CallHistory } from "@/components/arena/CallHistory";
import { SettingsPanel } from "@/components/arena/SettingsPanel";
import { WelcomeOverlay } from "@/components/arena/WelcomeOverlay";
import { detectClone } from "@/lib/detect";
import { type CallEntry, makeId } from "@/data/types";

type MicState = "idle" | "recording" | "processing";

function timestamp() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export default function Index() {
  const [welcome, setWelcome] = useState(true);
  const [micState, setMicState] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [history, setHistory] = useState<CallEntry[]>([]);
  const [apiKey, setApiKey] = useState("");

  async function analyze(audio: Blob, text: string, audioUrl?: string) {
    const result = await detectClone(audio, text);
    const entry: CallEntry = {
      id: makeId(),
      timestamp: timestamp(),
      transcript: text,
      audioUrl,
      result: result.verdict,
      cloneScore: result.cloneScore,
      detectorVerdicts: Object.fromEntries(
        result.detectorVerdicts.map((v) => [v.name, v.score]),
      ),
    };
    setHistory((h) => [entry, ...h]);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WelcomeOverlay open={welcome} onStart={() => setWelcome(false)} />

      <header className="border-b border-border/40 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyan" />
          <h1 className="font-mono text-sm font-semibold uppercase tracking-widest">
            Clone Detection Arena
          </h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <MetricCards history={history} />

          <div className="glass-card flex flex-col items-center gap-4 p-6">
            <MicButton
              state={micState}
              onStateChange={setMicState}
              onTranscript={(text) => {
                setTranscript(text);
                // TODO: pipe the recorded Blob to analyze() once MicButton exposes it.
              }}
            />
            <TranscriptCard transcript={transcript} />
          </div>

          <CallHistory history={history} onSelect={() => {}} />
        </div>

        <aside className="space-y-4">
          <AudioUpload
            isProcessing={false}
            onFileAnalyze={(url, text) => {
              setTranscript(text);
              // TODO: fetch the uploaded blob and call analyze(blob, text, url).
              void analyze(new Blob(), text, url);
            }}
          />
          <SettingsPanel apiKey={apiKey} onApiKeyChange={setApiKey} />
        </aside>
      </main>
    </div>
  );
}
