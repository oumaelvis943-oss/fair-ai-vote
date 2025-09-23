-- Update RLS policy for elections to allow viewing of draft elections for admins and public elections for users
DROP POLICY IF EXISTS "Everyone can view public or active elections" ON public.elections;

CREATE POLICY "Users can view appropriate elections" 
ON public.elections 
FOR SELECT 
USING (
  -- Admins can see all elections
  (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin')) 
  OR 
  -- Users can see active elections (regardless of public status)
  (status = 'active') 
  OR 
  -- Users can see public elections in any status
  (is_public = true)
  OR 
  -- Users can see elections they created
  (auth.uid() = created_by)
);

-- Update the election to be active and public so it shows up
UPDATE public.elections 
SET 
  status = 'active',
  is_public = true,
  -- Fix the dates - start date should be before end date
  start_date = NOW(),
  end_date = NOW() + INTERVAL '7 days'
WHERE title = 'Student Council 2024–2025';