-- Add RLS policy for admins to view all candidates
CREATE POLICY "Admins can view all candidates"
ON public.candidates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);