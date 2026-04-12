export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<{ text: string; entities: any[] }> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("model_id", "scribe_v2");
  formData.append("language_code", "en");
  formData.append("entity_detection", "all");
  formData.append("tag_audio_events", "true");

  const keyterms = JSON.stringify([
    "ignore previous instructions",
    "you are now",
    "DAN mode",
    "bypass safety",
    "act as unrestricted",
    "no restrictions",
    "wire transfer",
    "verify your identity",
    "gift card",
    "federal agent",
    "IRS calling",
    "account compromised",
  ]);
  formData.append("keyterms", keyterms);

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs STT failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return {
    text: data.text,
    entities: data.entities || [],
  };
}

export async function textToSpeech(
  text: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(
    "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_flash_v2_5",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${response.status} ${errorText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
  return URL.createObjectURL(audioBlob);
}
