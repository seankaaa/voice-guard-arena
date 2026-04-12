
-- Create attack_history table
CREATE TABLE public.attack_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TEXT NOT NULL,
  transcript TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Safe',
  result TEXT NOT NULL DEFAULT 'SAFE',
  confidence NUMERIC NOT NULL DEFAULT 1,
  explanation TEXT,
  attack_label TEXT,
  agent_response TEXT,
  audio_file_url TEXT,
  use_case TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attack_history ENABLE ROW LEVEL SECURITY;

-- Public read/insert policies (no auth required for this demo app)
CREATE POLICY "Anyone can read attack history"
ON public.attack_history FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert attack history"
ON public.attack_history FOR INSERT
WITH CHECK (true);

-- Create audio-files storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);

-- Storage policies
CREATE POLICY "Anyone can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-files');

CREATE POLICY "Anyone can view audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');
