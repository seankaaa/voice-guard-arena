import { motion, AnimatePresence } from "framer-motion";
import type { CallEntry } from "@/data/types";
import { RESULT_COLORS } from "@/data/types";

interface CallHistoryProps {
  history: CallEntry[];
  onSelect: (entry: CallEntry) => void;
}

export function CallHistory({ history, onSelect }: CallHistoryProps) {
  return (
    <div className="glass-card flex flex-col overflow-hidden">
      <div className="border-b border-border/40 px-4 py-3">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Call History
        </h3>
      </div>
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm">
            <tr className="border-b border-border/30 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Transcript</th>
              <th className="px-4 py-2">Verdict</th>
              <th className="px-4 py-2">Clone Score</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {history.map((entry) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={() => onSelect(entry)}
                  className="cursor-pointer border-b border-border/20 transition-colors hover:bg-secondary/30"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {entry.timestamp}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 font-body text-xs text-foreground">
                    {entry.transcript}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                      style={{
                        backgroundColor: `${RESULT_COLORS[entry.result]}18`,
                        color: RESULT_COLORS[entry.result],
                      }}
                    >
                      {entry.result}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${entry.cloneScore * 100}%`,
                            backgroundColor: RESULT_COLORS[entry.result],
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {Math.round(entry.cloneScore * 100)}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
