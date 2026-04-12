import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { transcribeAudio, TranscriptionError } from "@/lib/elevenlabs";

type MicState = "idle" | "recording" | "processing";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface MicButtonProps {
  state: MicState;
  onStateChange: (state: MicState) => void;
  onTranscript: (text: string) => void;
}

export function MicButton({ state, onStateChange, onTranscript }: MicButtonProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const browserTranscriptRef = useRef("");

  const stopBrowserRecognition = useCallback(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
  }, []);

  const startBrowserRecognition = useCallback(() => {
    const recognitionCtor = (
      window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).SpeechRecognition ?? (
      window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition;

    browserTranscriptRef.current = "";

    if (!recognitionCtor) {
      return;
    }

    try {
      const recognition = new recognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results || [])
          .map((result: any) => result?.[0]?.transcript || "")
          .join(" ")
          .trim();

        if (transcript) {
          browserTranscriptRef.current = transcript;
        }
      };
      recognition.onerror = (event) => {
        console.warn("Browser speech recognition error:", event?.error || event);
      };
      recognition.onend = () => {
        speechRecognitionRef.current = null;
      };
      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.warn("Could not start browser speech recognition:", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    stopBrowserRecognition();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [stopBrowserRecognition]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startBrowserRecognition();

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        const browserTranscript = browserTranscriptRef.current.trim();
        onStateChange("processing");

        try {
          const result = await transcribeAudio(audioBlob);
          const transcript = result.text.trim() || browserTranscript;

          if (!transcript) {
            throw new TranscriptionError("No speech detected.", {
              fallback: Boolean(browserTranscript),
              code: "empty_transcript",
            });
          }

          onTranscript(transcript);
        } catch (err) {
          console.error("STT error:", err);

          if (browserTranscript) {
            toast.info("Using browser speech recognition fallback.");
            onTranscript(browserTranscript);
          } else if (err instanceof TranscriptionError && err.code === "missing_stt_permission") {
            toast.error("This ElevenLabs account does not have Speech-to-Text enabled.");
          } else if (err instanceof Error) {
            toast.error(err.message || "Transcription failed");
          } else {
            toast.error("Transcription failed");
          }
        } finally {
          browserTranscriptRef.current = "";
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
  }, [onStateChange, onTranscript, startBrowserRecognition]);

  const handleClick = useCallback(() => {
    if (state === "idle") {
      startRecording();
    } else if (state === "recording") {
      stopRecording();
    }
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
