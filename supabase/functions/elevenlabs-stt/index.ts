const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) {
    return jsonResponse({
      ok: false,
      fallback: true,
      code: "missing_api_key",
      error: "ElevenLabs STT is not configured.",
    });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile instanceof File)) {
      return jsonResponse({
        ok: false,
        fallback: false,
        code: "missing_audio",
        error: "No audio file provided.",
      });
    }

    const apiFormData = new FormData();
    apiFormData.append("file", audioFile, "recording.webm");
    apiFormData.append("model_id", "scribe_v2");
    apiFormData.append("language_code", "en");
    apiFormData.append("entity_detection", "all");
    apiFormData.append("tag_audio_events", "true");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
      body: apiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs STT error:", response.status, errorText);

      const isPermissionError =
        response.status === 401 && errorText.includes("speech_to_text");

      return jsonResponse({
        ok: false,
        fallback: true,
        code: isPermissionError ? "missing_stt_permission" : "stt_request_failed",
        status: response.status,
        error: isPermissionError
          ? "Connected ElevenLabs account does not have Speech-to-Text permission."
          : `ElevenLabs STT failed (${response.status}).`,
        details: errorText,
      });
    }

    const data = await response.json();
    return jsonResponse({
      ok: true,
      text: data.text ?? "",
      entities: data.entities ?? [],
    });
  } catch (error) {
    console.error("STT error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({
      ok: false,
      fallback: true,
      code: "stt_function_failed",
      error: message,
    });
  }
});
