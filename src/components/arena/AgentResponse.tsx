import { Volume2 } from "lucide-react";

interface AgentResponseProps {
  response: string | null;
}

export function AgentResponse({ response }: AgentResponseProps) {
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Agent Response
        </h3>
        {response && (
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p
        className={`font-body text-sm leading-relaxed ${
          response ? "text-foreground" : "italic text-muted-foreground"
        }`}
      >
        {response || "Agent response will appear here..."}
      </p>
    </div>
  );
}
