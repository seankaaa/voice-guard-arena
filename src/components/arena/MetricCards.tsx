import { motion } from "framer-motion";
import { Shield, TrendingUp, Target, BarChart3 } from "lucide-react";
import type { AttackEntry } from "@/data/mockData";

interface MetricCardsProps {
  history: AttackEntry[];
}

export function MetricCards({ history }: MetricCardsProps) {
  const total = history.length;
  const blocked = history.filter((h) => h.result === "BLOCKED").length;
  const blockRate = total > 0 ? Math.round((blocked / total) * 100) : 0;

  const catCounts: Record<string, number> = {};
  history.forEach((h) => {
    catCounts[h.category] = (catCounts[h.category] || 0) + 1;
  });
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const avgConf =
    total > 0 ? Math.round((history.reduce((s, h) => s + h.confidence, 0) / total) * 100) : 0;

  const metrics = [
    { label: "Total Attempts", value: total.toString(), icon: Target },
    { label: "Block Rate", value: `${blockRate}%`, icon: Shield },
    { label: "Top Attack Type", value: topCategory, icon: TrendingUp, small: true },
    { label: "Avg Confidence", value: `${avgConf}%`, icon: BarChart3 },
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
              <p className={`mt-1 font-mono font-bold text-foreground ${m.small ? "text-sm" : "text-2xl"}`}>
                {m.value}
              </p>
            </div>
            <m.icon className="h-4 w-4 text-cyan/50" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
