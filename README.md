# Voice Guard Arena

A real-time red-teaming arena for testing AI voice-safety guardrails. Speak (or upload) a prompt, and the pipeline transcribes it, screens it for attacks, generates an agent response, speaks it back, and judges whether the guardrail actually held.

Built for the **ElevenLabs x Lovable Hackathon** (Stanford '26).

## How it works

1. **Capture** — record live via the mic or upload an audio file.
2. **Screen** — a local keyword/pattern scanner flags known attack categories (violence/harm, jailbreak, coded language, code-switching, scam/vishing, authority spoofing), then an LLM classifier (Claude, via a user-supplied API key) scores the transcript for a second opinion. The two signals are combined into a single `SAFE` / `WARNING` / `BLOCKED` verdict with a confidence score and explanation.
3. **Respond** — a guarded agent generates a reply to the prompt.
4. **Speak** — the reply is converted to speech through ElevenLabs.
5. **Judge** — a separate pass evaluates whether the agent's response actually respected the guardrail verdict.

Each run is logged with its transcript, category, result, confidence, and agent response, feeding the dashboard's metrics, attack-category distribution, and history views.

## Features

- Live mic capture and audio-file upload, both run through the same pipeline
- Keyword/regex attack scanner across 6 threat categories, with LLM-assisted classification as a second layer
- Guarded agent response generation + text-to-speech playback
- Independent guardrail judge pass on every response
- Quick-test presets for one-click demo scenarios
- Metrics dashboard: attack history, category distribution, and summary cards
- Use-case presets to frame a session (e.g. customer support, voice assistant)
- Session history persisted to Supabase

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- Supabase (Postgres for history, Edge Functions for ElevenLabs TTS/STT proxying)
- ElevenLabs API (speech-to-text and text-to-speech)
- Anthropic Claude API (threat classification, agent response, guardrail judging — key entered client-side in Settings)
- Recharts, Zustand-free state via React hooks, React Hook Form + Zod

## Getting started

```bash
npm install   # or bun install
npm run dev
```

This app expects a connected Supabase project (see `supabase/`, including the `attack_history` table migration and the `elevenlabs-tts` / `elevenlabs-stt` edge functions) and an ElevenLabs account wired into those functions. Configure the corresponding environment variables for your own Supabase project before running — **do not commit real credentials to `.env`.**

A Claude API key can be entered directly in the in-app Settings panel to enable LLM classification, response generation, and judging; without one, the arena still runs on keyword scanning alone.

## Project structure

```text
src/
├── components/arena/   # Mic capture, upload, transcript, threat/response cards, dashboards
├── components/ui/       # shadcn/ui primitives
├── data/                 # Mock/preset attack data
├── integrations/supabase/ # Supabase client
├── lib/                  # safety.ts (scanning + classification), elevenlabs.ts (TTS)
└── pages/                # App routes
supabase/
├── functions/            # elevenlabs-tts, elevenlabs-stt edge functions
└── migrations/           # attack_history table schema
```

## Testing

```bash
npm run test       # vitest run
npm run test:watch
```
