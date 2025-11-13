-- =====================================================
-- CRITICAL SECURITY & PERFORMANCE IMPROVEMENTS
-- =====================================================

-- 1. Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_election_status ON candidates(election_id, status);
CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_eligible_voters_election_email ON eligible_voters(election_id, email);
CREATE INDEX IF NOT EXISTS idx_eligible_voters_google_email ON eligible_voters(election_id, google_email);
CREATE INDEX IF NOT EXISTS idx_votes_election_candidate ON votes(election_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_vote_submissions_election_email ON vote_submissions(election_id, voter_email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status) WHERE deleted_at IS NULL;

-- 2. Add unique constraint to prevent duplicate votes
ALTER TABLE vote_submissions
ADD CONSTRAINT unique_voter_per_election UNIQUE (election_id, voter_email);

-- 3. Add check constraints for valid statuses
ALTER TABLE elections DROP CONSTRAINT IF EXISTS valid_election_status;
ALTER TABLE elections ADD CONSTRAINT valid_election_status 
CHECK (status IN ('draft', 'active', 'completed', 'cancelled'));

ALTER TABLE candidates DROP CONSTRAINT IF EXISTS valid_candidate_status;
ALTER TABLE candidates ADD CONSTRAINT valid_candidate_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE candidates DROP CONSTRAINT IF EXISTS valid_verification_status;
ALTER TABLE candidates ADD CONSTRAINT valid_verification_status 
CHECK (verification_status IN ('pending', 'verified', 'failed'));

-- 4. Create vote_results table for storing aggregated vote counts
CREATE TABLE IF NOT EXISTS vote_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5, 2),
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(election_id, candidate_id, position)
);

-- Enable RLS on vote_results
ALTER TABLE vote_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for vote_results
CREATE POLICY "Admins can manage vote results"
ON vote_results FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Public can view results for completed elections"
ON vote_results FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM elections
    WHERE elections.id = vote_results.election_id
    AND elections.status = 'completed'
    AND elections.deleted_at IS NULL
  )
);

-- 5. Create function to calculate vote results
CREATE OR REPLACE FUNCTION calculate_vote_results(p_election_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete existing results for this election
  DELETE FROM vote_results WHERE election_id = p_election_id;
  
  -- Calculate and insert new results
  INSERT INTO vote_results (election_id, candidate_id, position, vote_count, percentage, rank)
  SELECT 
    v.election_id,
    v.candidate_id,
    c.position,
    COUNT(v.id) as vote_count,
    ROUND((COUNT(v.id)::NUMERIC / NULLIF(total_votes.count, 0)) * 100, 2) as percentage,
    RANK() OVER (PARTITION BY c.position ORDER BY COUNT(v.id) DESC) as rank
  FROM votes v
  JOIN candidates c ON v.candidate_id = c.id
  CROSS JOIN (
    SELECT COUNT(*) as count 
    FROM votes v2 
    JOIN candidates c2 ON v2.candidate_id = c2.id
    WHERE v2.election_id = p_election_id 
    AND c2.position = c.position
  ) as total_votes
  WHERE v.election_id = p_election_id
  GROUP BY v.election_id, v.candidate_id, c.position, total_votes.count;
END;
$$;

-- 6. Create rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint ON rate_limits(identifier, endpoint, window_start);

-- RLS for rate_limits (admin only)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view rate limits"
ON rate_limits FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 7. Add trigger to auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to vote_results
DROP TRIGGER IF EXISTS update_vote_results_updated_at ON vote_results;
CREATE TRIGGER update_vote_results_updated_at
  BEFORE UPDATE ON vote_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Improve RLS policies for better security
-- Update profiles RLS to allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 9. Add constraint to ensure email domains are valid for eligible voters
ALTER TABLE eligible_voters DROP CONSTRAINT IF EXISTS valid_email_format;
ALTER TABLE eligible_voters ADD CONSTRAINT valid_email_format
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 10. Create audit logging function for sensitive operations
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);

-- RLS for security audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view security audit log"
ON security_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 11. Add missing NOT NULL constraints where appropriate
ALTER TABLE candidates ALTER COLUMN election_id SET NOT NULL;
ALTER TABLE candidates ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE votes ALTER COLUMN election_id SET NOT NULL;
ALTER TABLE votes ALTER COLUMN candidate_id SET NOT NULL;
ALTER TABLE votes ALTER COLUMN voter_id SET NOT NULL;