# Clone Detection Arena

Starter migrated from `voice-guard-arena` for the CS 152 team-17 project on AI voice
cloning, impersonation, and fraud.

## What carried over

- **Scaffolding** — Vite + React 18 + TypeScript, Tailwind + shadcn/ui, ESLint, Vitest.
- **Supabase wiring** — `src/integrations/supabase/client.ts`, `supabase/config.toml`,
  edge functions for ElevenLabs STT (`elevenlabs-stt`) and TTS (`elevenlabs-tts`).
- **Reusable UI** — all shadcn primitives in `src/components/ui/`, the `arena/`
  shell (mic capture, audio upload, transcript card, metric cards, call history,
  settings panel, welcome overlay).
- **Generic types and a detector stub** — `src/data/types.ts` and
  `src/lib/detect.ts` (replace with real detector calls).

## What was dropped

- The prompt-attack taxonomy and classifier (`src/lib/safety.ts`, `src/data/mockData.ts`).
- Components specific to that taxonomy (`ThreatAssessment`, `AgentResponse`,
  `AttackDistribution`, `QuickTest`, `UseCases`, `AttackHistory`).
- The old `attack_history` migration. Add a fresh schema for clone-fraud calls.

## Next steps for the new project

1. Replace stubs in `src/lib/detect.ts` with real detectors (real-time, forensic,
   multi-model, C2PA provenance).
2. Add a Supabase migration for the new `call_history` table (clone score,
   per-detector verdicts, provenance status, attestation level, safe-word usage).
3. Wire `MicButton` to expose the recorded `Blob` so `Index.tsx` can pass it to
   `detectClone(audio, text)`. Same for `AudioUpload`.
4. Build domain UI: authenticity assessment panel, per-detector breakdown,
   policy/intervention matrix, family safe-word challenge.
5. Update `src/integrations/supabase/types.ts` after running
   `supabase gen types typescript`.

## Dev

```sh
npm install
npm run dev
npm run lint
npm run test
```
