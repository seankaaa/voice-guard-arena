import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeOverlayProps {
  open: boolean;
  onStart: () => void;
}

export function WelcomeOverlay({ open, onStart }: WelcomeOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="glass-card mx-4 max-w-md space-y-6 p-8 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan/10 glow-cyan">
              <Shield className="h-7 w-7 text-cyan" />
            </div>

            <div className="space-y-2">
              <h2 className="font-mono text-xl font-bold tracking-tight text-foreground">
                Clone Detection Arena
              </h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                Probe voice clones against a layered detection pipeline.
              </p>
              <p className="font-body text-xs leading-relaxed text-muted-foreground/70">
                Record live or upload an audio clip to score authenticity.
              </p>
            </div>

            <Button
              onClick={onStart}
              className="w-full gap-2 bg-cyan/15 font-mono text-sm font-semibold text-cyan hover:bg-cyan/25"
            >
              <Zap className="h-4 w-4" />
              Start
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
