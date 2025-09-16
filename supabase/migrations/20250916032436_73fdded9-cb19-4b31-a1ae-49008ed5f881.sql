-- Add new columns to elections table for Phase 1 features
ALTER TABLE public.elections 
ADD COLUMN IF NOT EXISTS voting_algorithm TEXT DEFAULT 'fptp',
ADD COLUMN IF NOT EXISTS max_candidates INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT true;

-- Add check constraint for voting algorithms
ALTER TABLE public.elections 
ADD CONSTRAINT check_voting_algorithm 
CHECK (voting_algorithm IN ('fptp', 'borda_count', 'ranked_choice'));

-- Add check constraint for max candidates
ALTER TABLE public.elections 
ADD CONSTRAINT check_max_candidates 
CHECK (max_candidates > 0 AND max_candidates <= 100);

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_elections_status ON public.elections(status);

-- Add index for better performance on created_by queries
CREATE INDEX IF NOT EXISTS idx_elections_created_by ON public.elections(created_by);

-- Update RLS policies to ensure proper access control
-- Allow admins to manage their own elections
CREATE POLICY "Admins can manage their own elections" 
ON public.elections 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
    AND (auth.uid() = created_by OR profiles.role = 'admin')
  )
);

-- Enable realtime for elections table
ALTER TABLE public.elections REPLICA IDENTITY FULL;

-- Add the table to realtime publication
SELECT pg_catalog.pg_publication_tables('supabase_realtime') WHERE schemaname = 'public' AND tablename = 'elections';
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'elections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.elections;
  END IF;
END $$;