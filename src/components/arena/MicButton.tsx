import { motion } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";

type MicState = "idle" | "recording" | "processing";

interface MicButtonProps {
  state: MicState;
  onClick: () => void;
}

export function MicButton({ state, onClick }: MicButtonProps) {
  const label =
    state === "idle" ? "Click to speak" : state === "recording" ? "Listening..." : "Processing...";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Outer pulsing rings */}
        {state === "recording" && (
          <>
            <motion.div
              className="absolute inset-[-16px] rounded-full border-2 border-cyan/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-[-8px] rounded-full border border-cyan/50"
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </>
        )}

        {state === "processing" && (
          <motion.div
            className="absolute inset-[-12px] rounded-full border-2 border-amber/40 border-t-amber"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Main button */}
        <motion.button
          onClick={onClick}
          whileTap={{ scale: 0.95 }}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
            state === "idle"
              ? "bg-secondary text-muted-foreground hover:bg-secondary/80"
              : state === "recording"
              ? "bg-cyan/20 text-cyan glow-cyan"
              : "bg-amber/20 text-amber glow-amber"
          }`}
        >
          {state === "processing" ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </motion.button>
      </div>

      <span
        className={`font-mono text-sm ${
          state === "idle"
            ? "text-muted-foreground"
            : state === "recording"
            ? "text-cyan text-glow-cyan"
            : "text-amber text-glow-amber"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
