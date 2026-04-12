import { motion, AnimatePresence } from "framer-motion";
import type { ResultType } from "@/data/mockData";

interface ThreatAssessmentProps {
  result: ResultType | null;
  attackLabel: string | null;
  confidence: number | null;
  explanation: string | null;
}

const resultStyles: Record<ResultType, { bg: string; text: string; glow: string }> = {
  SAFE: { bg: "bg-cyan/15", text: "text-cyan", glow: "glow-cyan" },
  WARNING: { bg: "bg-amber/15", text: "text-amber", glow: "glow-amber" },
  BLOCKED: { bg: "bg-red/15", text: "text-red", glow: "glow-red" },
};

const barColors: Record<ResultType, string> = {
  SAFE: "bg-cyan",
  WARNING: "bg-amber",
  BLOCKED: "bg-red",
};

export function ThreatAssessment({ result, attackLabel, confidence, explanation }: ThreatAssessmentProps) {
  const styles = result ? resultStyles[result] : null;

  return (
    <div className="glass-card p-4 space-y-4">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Threat Assessment
      </h3>

      {result && styles ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Status badge with pulse on change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={result}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`inline-flex items-center rounded-full px-4 py-1.5 font-mono text-sm font-bold ${styles.bg} ${styles.text} ${styles.glow}`}
            >
              {result}
            </motion.div>
          </AnimatePresence>

          {attackLabel && (
            <p className="font-body text-sm font-semibold text-foreground">{attackLabel}</p>
          )}

          {confidence !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>Confidence</span>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className={`h-full rounded-full ${barColors[result]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {explanation && (
            <p className="font-body text-xs leading-relaxed text-muted-foreground">{explanation}</p>
          )}
        </motion.div>
      ) : (
        <p className="italic text-sm text-muted-foreground">Run a test to see assessment...</p>
      )}
    </div>
  );
}
