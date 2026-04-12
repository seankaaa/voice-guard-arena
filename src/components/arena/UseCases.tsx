import { Phone, Headphones, Building2, ShieldCheck, Radio, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const USE_CASES = [
  {
    id: "call-center",
    label: "Call Center",
    description: "Monitor inbound/outbound calls for social engineering & vishing",
    icon: Phone,
    color: "#00E5FF",
  },
  {
    id: "customer-support",
    label: "Customer Support",
    description: "Screen support calls for scam attempts & impersonation",
    icon: Headphones,
    color: "#a78bfa",
  },
  {
    id: "banking",
    label: "Banking & Finance",
    description: "Detect fraud, vishing, and unauthorized access attempts",
    icon: Building2,
    color: "#FFAB00",
  },
  {
    id: "compliance",
    label: "Compliance & Audit",
    description: "Automated review of recorded interactions for policy violations",
    icon: ShieldCheck,
    color: "#4ade80",
  },
  {
    id: "telecom",
    label: "Telecom & IVR",
    description: "Protect IVR systems from voice-based exploits",
    icon: Radio,
    color: "#f472b6",
  },
  {
    id: "enterprise",
    label: "Enterprise Security",
    description: "Internal voice channel monitoring and threat detection",
    icon: Briefcase,
    color: "#FF3D3D",
  },
];

interface UseCasesProps {
  activeUseCase: string | null;
  onSelect: (useCase: string) => void;
}

export function UseCases({ activeUseCase, onSelect }: UseCasesProps) {
  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Connect to Use Case
      </h3>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {USE_CASES.map((uc) => {
          const Icon = uc.icon;
          const isActive = activeUseCase === uc.id;
          return (
            <button
              key={uc.id}
              onClick={() => {
                onSelect(uc.id);
                toast.success(`Connected to ${uc.label}`);
              }}
              className={`group flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
                isActive
                  ? "border-cyan/50 bg-cyan/10"
                  : "border-border/30 bg-secondary/20 hover:border-border/60 hover:bg-secondary/40"
              }`}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: uc.color }}
              />
              <span className="font-mono text-[11px] font-semibold text-foreground">
                {uc.label}
              </span>
              <span className="font-body text-[10px] leading-tight text-muted-foreground">
                {uc.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
