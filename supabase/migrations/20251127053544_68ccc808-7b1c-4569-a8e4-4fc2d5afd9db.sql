-- ============================================
-- PRODUCTION READINESS: Performance & Security Improvements
-- ============================================

-- Add missing performance indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_eligible_voters_additional_info_gin ON public.eligible_voters USING GIN (additional_info);
CREATE INDEX IF NOT EXISTS idx_candidates_form_responses_gin ON public.candidates USING GIN (form_responses);
CREATE INDEX IF NOT EXISTS idx_candidates_evaluation_data_gin ON public.candidates USING GIN (evaluation_data);
CREATE INDEX IF NOT EXISTS idx_elections_positions_gin ON public.elections USING GIN (positions);
CREATE INDEX IF NOT EXISTS idx_elections_eligibility_criteria_gin ON public.elections USING GIN (eligibility_criteria);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_eligible_voters_election_email ON public.eligible_voters (election_id, email);
CREATE INDEX IF NOT EXISTS idx_eligible_voters_election_google_email ON public.eligible_voters (election_id, google_email) WHERE google_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vote_submissions_election_voter ON public.vote_submissions (election_id, voter_email);
CREATE INDEX IF NOT EXISTS idx_votes_election_candidate ON public.votes (election_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_election_status ON public.candidates (election_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);

-- Add index for security audit queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_created ON public.security_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON public.request_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email_time ON public.failed_login_attempts (email, attempted_at DESC);

-- Fix search_path in all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_latest_block()
RETURNS vote_blocks
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.vote_blocks 
  ORDER BY block_number DESC 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_election_status(p_election_id uuid, p_new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update election status
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can update election status';
  END IF;
  
  -- Validate status
  IF p_new_status NOT IN ('draft', 'active', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid election status';
  END IF;
  
  -- Update the election status
  UPDATE public.elections
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_election_id
  AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Election not found or already deleted';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.encrypt_smtp_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.password IS NOT NULL AND NEW.password <> '' AND NEW.password <> '[ENCRYPTED]' THEN
    -- Encrypt password using pgcrypto
    NEW.password_encrypted := pgp_sym_encrypt(NEW.password, current_setting('app.settings.smtp_encryption_key', true));
    -- Clear plaintext password
    NEW.password := '[ENCRYPTED]';
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Password encryption failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_smtp_password(config_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_password text;
BEGIN
  -- Only admins can retrieve SMTP passwords
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized access to SMTP configuration';
  END IF;

  SELECT pgp_sym_decrypt(password_encrypted, current_setting('app.settings.smtp_encryption_key', true))
  INTO decrypted_password
  FROM public.smtp_config
  WHERE id = config_id;
  
  RETURN decrypted_password;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Password decryption failed: %', SQLERRM;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_login_attempts(p_email text, p_ip_address text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_attempts int;
  is_blocked boolean := false;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*)
  INTO recent_attempts
  FROM public.failed_login_attempts
  WHERE email = p_email
    AND ip_address = p_ip_address
    AND attempted_at > now() - interval '15 minutes';
  
  -- Block if more than 5 attempts
  IF recent_attempts >= 5 THEN
    is_blocked := true;
  END IF;
  
  RETURN jsonb_build_object(
    'blocked', is_blocked,
    'attempts', recent_attempts,
    'message', CASE 
      WHEN is_blocked THEN 'Too many failed login attempts. Please try again later.'
      ELSE 'Login allowed'
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_vote_results(p_election_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can calculate results
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can calculate vote results';
  END IF;

  -- Delete existing results for this election
  DELETE FROM public.vote_results WHERE election_id = p_election_id;
  
  -- Calculate and insert new results
  INSERT INTO public.vote_results (election_id, candidate_id, position, vote_count, percentage, rank)
  SELECT 
    v.election_id,
    v.candidate_id,
    c.position,
    COUNT(v.id) as vote_count,
    ROUND((COUNT(v.id)::NUMERIC / NULLIF(total_votes.count, 0)) * 100, 2) as percentage,
    RANK() OVER (PARTITION BY c.position ORDER BY COUNT(v.id) DESC) as rank
  FROM public.votes v
  JOIN public.candidates c ON v.candidate_id = c.id
  CROSS JOIN (
    SELECT COUNT(*) as count 
    FROM public.votes v2 
    JOIN public.candidates c2 ON v2.candidate_id = c2.id
    WHERE v2.election_id = p_election_id 
    AND c2.position = c.position
  ) as total_votes
  WHERE v.election_id = p_election_id
  GROUP BY v.election_id, v.candidate_id, c.position, total_votes.count;
  
  RAISE NOTICE 'Vote results calculated for election %', p_election_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to calculate vote results: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_voting_eligibility(p_election_id uuid, p_voter_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voter record;
  v_election record;
  v_already_voted boolean;
BEGIN
  -- Validate inputs
  IF p_election_id IS NULL OR p_voter_email IS NULL THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Invalid input parameters'
    );
  END IF;

  -- Check if voter exists and is eligible
  SELECT * INTO v_voter 
  FROM public.eligible_voters 
  WHERE election_id = p_election_id 
  AND (email = p_voter_email OR google_email = p_voter_email);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Not in eligible voters list'
    );
  END IF;
  
  -- Check if election is active
  SELECT * INTO v_election 
  FROM public.elections 
  WHERE id = p_election_id 
  AND status = 'active'
  AND start_date <= now()
  AND end_date >= now()
  AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Election is not currently active'
    );
  END IF;
  
  -- Check if already voted
  SELECT EXISTS(
    SELECT 1 FROM public.vote_submissions 
    WHERE election_id = p_election_id 
    AND voter_email = p_voter_email
  ) INTO v_already_voted;
  
  IF v_already_voted THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'You have already voted in this election'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'eligible', true,
    'voter_id', v_voter.id,
    'eligible_posts', v_voter.eligible_posts,
    'voter_name', v_voter.full_name
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error checking voting eligibility: %', SQLERRM;
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'System error. Please try again.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_candidate_ai_score(candidate_uuid uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_weighted_score DECIMAL := 0;
    total_weight DECIMAL := 0;
    app_record RECORD;
BEGIN
    FOR app_record IN 
        SELECT ca.normalized_score, cec.weight
        FROM public.candidate_applications ca
        JOIN public.candidate_evaluation_criteria cec ON ca.criterion_id = cec.id
        WHERE ca.candidate_id = candidate_uuid 
        AND ca.normalized_score IS NOT NULL
    LOOP
        total_weighted_score := total_weighted_score + (app_record.normalized_score * app_record.weight);
        total_weight := total_weight + app_record.weight;
    END LOOP;
    
    IF total_weight > 0 THEN
        RETURN ROUND(total_weighted_score / total_weight, 2);
    ELSE
        RETURN NULL;
    END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error calculating AI score: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- Add trigger for automatic cleanup of old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Add constraint to ensure valid election status transitions
ALTER TABLE public.elections
DROP CONSTRAINT IF EXISTS valid_election_status;

ALTER TABLE public.elections
ADD CONSTRAINT valid_election_status 
CHECK (status IN ('draft', 'active', 'completed', 'cancelled'));

-- Add constraint for vote integrity
ALTER TABLE public.votes
DROP CONSTRAINT IF EXISTS unique_voter_candidate_election;

ALTER TABLE public.votes
ADD CONSTRAINT unique_voter_candidate_election 
UNIQUE (election_id, voter_id, candidate_id);

-- Add email validation constraints
ALTER TABLE public.eligible_voters
DROP CONSTRAINT IF EXISTS valid_email_format;

ALTER TABLE public.eligible_voters
ADD CONSTRAINT valid_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Comment for documentation
COMMENT ON INDEX idx_eligible_voters_additional_info_gin IS 'GIN index for fast JSONB queries on additional voter info';
COMMENT ON INDEX idx_candidates_form_responses_gin IS 'GIN index for candidate application form responses';
COMMENT ON FUNCTION public.calculate_vote_results IS 'Calculates and stores vote results with rankings per position. Only callable by admins.';