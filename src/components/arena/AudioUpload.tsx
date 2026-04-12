import { useState, useRef } from "react";
import { Upload, FileAudio, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AudioUploadProps {
  onFileAnalyze: (audioUrl: string, transcript: string) => void;
  isProcessing: boolean;
}

export function AudioUpload({ onFileAnalyze, isProcessing }: AudioUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const audioFiles = selected.filter((f) =>
      f.type.startsWith("audio/") || f.name.match(/\.(wav|mp3|m4a|ogg|webm|flac|aac)$/i)
    );
    if (audioFiles.length === 0) {
      toast.error("Please select audio files (WAV, MP3, M4A, OGG, WEBM, FLAC, AAC)");
      return;
    }
    setFiles((prev) => [...prev, ...audioFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i);
      const file = files[i];
      const fileName = `${Date.now()}-${file.name}`;

      try {
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("audio-files")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("audio-files")
          .getPublicUrl(fileName);

        // Transcribe via edge function
        const formData = new FormData();
        formData.append("file", file);

        const { data: sttData, error: sttError } = await supabase.functions.invoke(
          "elevenlabs-stt",
          { body: formData }
        );

        if (sttError) throw sttError;

        const transcript = sttData?.text || "(No transcript available)";
        onFileAnalyze(urlData.publicUrl, transcript);
      } catch (err: any) {
        console.error("File processing error:", err);
        toast.error(`Failed to process ${file.name}: ${err.message || "Unknown error"}`);
      }
    }

    setFiles([]);
    setCurrentFileIndex(null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Upload Audio Files
      </h3>

      <div
        className="mb-3 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/50 p-6 transition-colors hover:border-cyan/40 hover:bg-cyan/5"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="font-mono text-xs text-muted-foreground">
          Click to select audio files
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/60">
          WAV, MP3, M4A, OGG, WEBM, FLAC, AAC
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm,.flac,.aac"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 space-y-1.5"
          >
            {files.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 rounded-md bg-secondary/30 px-3 py-1.5"
              >
                <FileAudio className="h-3.5 w-3.5 text-cyan" />
                <span className="flex-1 truncate font-mono text-xs text-foreground">
                  {file.name}
                </span>
                {currentFileIndex === i && uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan" />
                ) : (
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={processFiles}
        disabled={files.length === 0 || uploading || isProcessing}
        className="w-full bg-cyan/20 font-mono text-xs text-cyan hover:bg-cyan/30"
        variant="ghost"
      >
        {uploading
          ? `Processing ${(currentFileIndex ?? 0) + 1}/${files.length}...`
          : `Analyze ${files.length} file${files.length !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
