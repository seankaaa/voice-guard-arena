import { motion } from "framer-motion";
import { Shield, ShieldAlert, AudioLines, BarChart3 } from "lucide-react";
import type { CallEntry } from "@/data/types";
import { useAnimatedNumber } from "@/hooks/use-animated-number";

interface MetricCardsProps {
  history: CallEntry[];
}

function AnimatedValue({ value, suffix = "" }: { value: number; suffix?: string }) {
  const animated = useAnimatedNumber(value);
  return <>{animated}{suffix}</>;
}

export function MetricCards({ history }: MetricCardsProps) {
  const total = history.length;
  const flagged = history.filter((h) => h.result !== "AUTHENTIC").length;
  const flagRate = total > 0 ? Math.round((flagged / total) * 100) : 0;
  const avgScore =
    total > 0 ? Math.round((history.reduce((s, h) => s + h.cloneScore, 0) / total) * 100) : 0;

  const metrics = [
    { label: "Calls Analyzed", value: total, suffix: "", icon: AudioLines },
    { label: "Flagged Rate", value: flagRate, suffix: "%", icon: ShieldAlert },
    { label: "Avg Clone Score", value: avgScore, suffix: "%", icon: BarChart3 },
    { label: "Authentic", value: total - flagged, suffix: "", icon: Shield },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card relative overflow-hidden p-4"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-foreground">
                <AnimatedValue value={m.value} suffix={m.suffix} />
              </p>
            </div>
            <m.icon className="h-4 w-4 text-cyan/50" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
