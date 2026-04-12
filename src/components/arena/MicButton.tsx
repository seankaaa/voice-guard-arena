import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { transcribeAudio } from "@/lib/elevenlabs";

type MicState = "idle" | "recording" | "processing";

interface MicButtonProps {
  state: MicState;
  onStateChange: (state: MicState) => void;
  onTranscript: (text: string) => void;
  elevenLabsKey: string;
}

export function MicButton({ state, onStateChange, onTranscript, elevenLabsKey }: MicButtonProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!elevenLabsKey) {
      toast.error("Please enter your ElevenLabs API key in Settings first.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        onStateChange("processing");

        try {
          const result = await transcribeAudio(audioBlob, elevenLabsKey);
          onTranscript(result.text);
        } catch (err: any) {
          console.error("STT error:", err);
          toast.error(err.message || "Transcription failed");
        } finally {
          onStateChange("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      onStateChange("recording");
    } catch (err: any) {
      console.error("Mic error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone access denied. Please allow mic access and try again.");
      } else {
        toast.error("Could not access microphone: " + (err.message || "Unknown error"));
      }
    }
  }, [elevenLabsKey, onStateChange, onTranscript]);

  const handleClick = useCallback(() => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
    // Do nothing if processing
  }, [state, startRecording, stopRecording]);

  const label =
    state === "idle" ? "Click to speak" : state === "recording" ? "Listening..." : "Processing...";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
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

        <motion.button
          onClick={handleClick}
          whileTap={{ scale: 0.95 }}
          disabled={state === "processing"}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
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
