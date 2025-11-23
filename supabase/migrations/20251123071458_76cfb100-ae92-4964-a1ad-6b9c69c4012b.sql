-- Fix RLS policy for eligible_voters to use user_roles table instead of profiles.role
DROP POLICY IF EXISTS "Admins can manage eligible voters" ON public.eligible_voters;

CREATE POLICY "Admins can manage eligible voters" 
ON public.eligible_voters 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Also fix other policies that incorrectly use profiles.role
-- Fix candidates table policies
DROP POLICY IF EXISTS "Admins can view all candidates" ON public.candidates;
CREATE POLICY "Admins can view all candidates" 
ON public.candidates 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix elections table policies  
DROP POLICY IF EXISTS "Admins can manage elections" ON public.elections;
DROP POLICY IF EXISTS "Admins can manage their own elections" ON public.elections;
CREATE POLICY "Admins can manage elections" 
ON public.elections 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix other admin policies using profiles.role
DROP POLICY IF EXISTS "Admins can manage evaluation criteria" ON public.candidate_evaluation_criteria;
CREATE POLICY "Admins can manage evaluation criteria" 
ON public.candidate_evaluation_criteria 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage interviews" ON public.candidate_interviews;
CREATE POLICY "Admins can manage interviews" 
ON public.candidate_interviews 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all interviews" ON public.candidate_interviews;
CREATE POLICY "Admins can view all interviews" 
ON public.candidate_interviews 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all analytics" ON public.election_analytics;
CREATE POLICY "Admins can view all analytics" 
ON public.election_analytics 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage reports" ON public.election_reports;
CREATE POLICY "Admins can manage reports" 
ON public.election_reports 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view encrypted votes" ON public.encrypted_votes;
CREATE POLICY "Admins can view encrypted votes" 
ON public.encrypted_votes 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view audit trail" ON public.vote_audit_trail;
CREATE POLICY "Admins can view audit trail" 
ON public.vote_audit_trail 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage vote blocks" ON public.vote_blocks;
CREATE POLICY "Admins can manage vote blocks" 
ON public.vote_blocks 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view vote submissions" ON public.vote_submissions;
CREATE POLICY "Admins can view vote submissions" 
ON public.vote_submissions 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all applications" ON public.candidate_applications;
CREATE POLICY "Admins can view all applications" 
ON public.candidate_applications 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view AI audit trail" ON public.ai_audit_trail;
CREATE POLICY "Admins can view AI audit trail" 
ON public.ai_audit_trail 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage SMTP config" ON public.smtp_config;
CREATE POLICY "Admins can manage SMTP config" 
ON public.smtp_config 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all verifications" ON public.user_verification;
CREATE POLICY "Admins can view all verifications" 
ON public.user_verification 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));