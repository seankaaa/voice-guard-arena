import { useState } from "react";
import { Settings, Check } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

interface SettingsPanelProps {
  anthropicKey: string;
  onAnthropicKeyChange: (key: string) => void;
}

export function SettingsPanel({
  anthropicKey,
  onAnthropicKeyChange,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="glass-card overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-center gap-2 p-3 text-left transition-colors hover:bg-secondary/30">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Settings
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col gap-3 border-t border-border/40 p-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Anthropic API Key
              </span>
              <div className="relative">
                <Input
                  type="password"
                  value={anthropicKey}
                  onChange={(e) => onAnthropicKeyChange(e.target.value)}
                  placeholder="sk-ant-..."
                  className="border-border/40 bg-secondary/50 pr-8 font-mono text-xs"
                />
                {anthropicKey && (
                  <Check className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan" />
                )}
              </div>
            </label>
            <p className="font-mono text-[10px] text-muted-foreground/60">
              ElevenLabs is connected via Lovable Cloud — no key needed.
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
