import { useState } from "react";
import { Play } from "lucide-react";
import { PRESET_ATTACKS } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickTestProps {
  onRun: (presetIndex: number) => void;
}

export function QuickTest({ onRun }: QuickTestProps) {
  const [selected, setSelected] = useState<string>("0");

  return (
    <div className="glass-card flex flex-col p-4">
      <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Quick Test
      </h3>
      <div className="flex flex-col gap-3">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="border-border/40 bg-secondary/50 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border/40 bg-card font-mono text-xs">
            {PRESET_ATTACKS.map((p, i) => (
              <SelectItem key={i} value={i.toString()}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => onRun(parseInt(selected))}
          className="w-full gap-2 bg-cyan/15 font-mono text-xs font-semibold text-cyan hover:bg-cyan/25"
        >
          <Play className="h-3.5 w-3.5" />
          Run Test
        </Button>
      </div>
    </div>
  );
}
