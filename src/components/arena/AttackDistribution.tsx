import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AttackEntry, AttackCategory } from "@/data/mockData";
import { CATEGORY_COLORS } from "@/data/mockData";

interface AttackDistributionProps {
  history: AttackEntry[];
}

export function AttackDistribution({ history }: AttackDistributionProps) {
  const counts: Record<string, number> = {};
  history.forEach((h) => {
    counts[h.category] = (counts[h.category] || 0) + 1;
  });

  const data = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: CATEGORY_COLORS[name as AttackCategory] || "#8B95A5",
  }));

  return (
    <div className="glass-card flex flex-col p-4">
      <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Attack Distribution
      </h3>
      <div className="flex flex-1 items-center">
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 10%)",
                  border: "1px solid hsl(220, 15%, 18%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "hsl(200, 20%, 90%)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-1.5 pr-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                {d.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
