const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface TranscribeSuccessResponse {
  ok?: true;
  text: string;
  entities: any[];
}

interface TranscribeErrorResponse {
  ok: false;
  error: string;
  fallback?: boolean;
  code?: string;
  status?: number;
  details?: string;
}

export class TranscriptionError extends Error {
  fallback: boolean;
  code?: string;
  status?: number;
  details?: string;

  constructor(
    message: string,
    options?: { fallback?: boolean; code?: string; status?: number; details?: string }
  ) {
    super(message);
    this.name = "TranscriptionError";
    this.fallback = options?.fallback ?? false;
    this.code = options?.code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

export async function transcribeAudio(
  audioBlob: Blob
): Promise<{ text: string; entities: any[] }> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-stt`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | TranscribeSuccessResponse
    | TranscribeErrorResponse
    | null;

  if (payload && typeof payload === "object" && "ok" in payload) {
    if (payload.ok === false) {
      throw new TranscriptionError(payload.error || "Transcription failed", {
        fallback: payload.fallback,
        code: payload.code,
        status: payload.status ?? response.status,
        details: payload.details,
      });
    }

    return {
      text: payload.text ?? "",
      entities: payload.entities ?? [],
    };
  }

  if (!response.ok) {
    throw new TranscriptionError(`STT failed: ${response.status}`, {
      fallback: true,
      code: "unexpected_http_error",
      status: response.status,
    });
  }

  if (payload && typeof payload === "object" && "text" in payload) {
    return {
      text: payload.text ?? "",
      entities: Array.isArray((payload as TranscribeSuccessResponse).entities)
        ? (payload as TranscribeSuccessResponse).entities
        : [],
    };
  }

  throw new TranscriptionError("Unexpected STT response.", {
    fallback: true,
    code: "unexpected_response",
    status: response.status,
  });
}

export async function textToSpeech(text: string): Promise<string> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `TTS failed: ${response.status}`);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}
