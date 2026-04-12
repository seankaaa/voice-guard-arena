interface TranscriptCardProps {
  transcript: string | null;
}

export function TranscriptCard({ transcript }: TranscriptCardProps) {
  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Transcript
      </h3>
      <p
        className={`font-body text-sm leading-relaxed ${
          transcript ? "text-foreground" : "italic text-muted-foreground"
        }`}
      >
        {transcript || "Your speech will appear here..."}
      </p>
    </div>
  );
}
