-- Add deleted_at column for soft delete functionality
ALTER TABLE public.elections 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Create index for better performance on non-deleted elections
CREATE INDEX IF NOT EXISTS idx_elections_deleted_at ON public.elections(deleted_at) WHERE deleted_at IS NULL;

-- Update the elections viewing policy to exclude deleted elections
DROP POLICY IF EXISTS "Users can view appropriate elections" ON public.elections;

CREATE POLICY "Users can view appropriate elections" ON public.elections
FOR SELECT
USING (
  deleted_at IS NULL AND (
    (EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )) 
    OR status = 'active' 
    OR is_public = true 
    OR auth.uid() = created_by
  )
);

-- Add function to pause/reactivate elections
CREATE OR REPLACE FUNCTION public.update_election_status(
  p_election_id uuid,
  p_new_status text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only admins can update election status
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update election status';
  END IF;
  
  -- Update the election status
  UPDATE public.elections
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_election_id
  AND deleted_at IS NULL;
END;
$$;