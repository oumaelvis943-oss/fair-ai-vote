-- Fix RLS policies to properly handle INSERT operations with WITH CHECK clause
DROP POLICY IF EXISTS "Admins can manage eligible voters" ON public.eligible_voters;

CREATE POLICY "Admins can manage eligible voters" 
ON public.eligible_voters 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix other policies that need WITH CHECK for INSERT
DROP POLICY IF EXISTS "Admins can manage elections" ON public.elections;
CREATE POLICY "Admins can manage elections" 
ON public.elections 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage evaluation criteria" ON public.candidate_evaluation_criteria;
CREATE POLICY "Admins can manage evaluation criteria" 
ON public.candidate_evaluation_criteria 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage interviews" ON public.candidate_interviews;
CREATE POLICY "Admins can manage interviews" 
ON public.candidate_interviews 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage reports" ON public.election_reports;
CREATE POLICY "Admins can manage reports" 
ON public.election_reports 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;
CREATE POLICY "Admins can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view audit trail" ON public.vote_audit_trail;
CREATE POLICY "Admins can view audit trail" 
ON public.vote_audit_trail 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage vote blocks" ON public.vote_blocks;
CREATE POLICY "Admins can manage vote blocks" 
ON public.vote_blocks 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage SMTP config" ON public.smtp_config;
CREATE POLICY "Admins can manage SMTP config" 
ON public.smtp_config 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));