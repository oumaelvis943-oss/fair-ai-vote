-- Phase 3: Secure Voting & Blockchain Integration
-- Create blockchain-like vote storage with encryption and verification

-- Create vote_blocks table for blockchain-like structure
CREATE TABLE public.vote_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_number INTEGER NOT NULL,
  previous_block_hash TEXT,
  merkle_root TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  votes_count INTEGER NOT NULL DEFAULT 0,
  nonce TEXT NOT NULL,
  block_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create encrypted_votes table for secure vote storage
CREATE TABLE public.encrypted_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL,
  vote_hash TEXT NOT NULL UNIQUE,
  encrypted_vote TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  voter_public_key TEXT NOT NULL,
  block_id UUID REFERENCES public.vote_blocks(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vote_audit_trail for security monitoring
CREATE TABLE public.vote_audit_trail (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  election_id UUID,
  voter_id UUID,
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.vote_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vote_blocks (public read, admin write)
CREATE POLICY "Anyone can view vote blocks" 
ON public.vote_blocks 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage vote blocks" 
ON public.vote_blocks 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create RLS policies for encrypted_votes (restricted access)
CREATE POLICY "Users can create encrypted votes" 
ON public.encrypted_votes 
FOR INSERT 
WITH CHECK (true); -- Will be validated by the system

CREATE POLICY "Admins can view encrypted votes" 
ON public.encrypted_votes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create RLS policies for audit trail (admin only)
CREATE POLICY "Admins can view audit trail" 
ON public.vote_audit_trail 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Create indexes for performance
CREATE INDEX idx_vote_blocks_number ON public.vote_blocks(block_number);
CREATE INDEX idx_vote_blocks_hash ON public.vote_blocks(block_hash);
CREATE INDEX idx_encrypted_votes_election ON public.encrypted_votes(election_id);
CREATE INDEX idx_encrypted_votes_hash ON public.encrypted_votes(vote_hash);
CREATE INDEX idx_audit_trail_election ON public.vote_audit_trail(election_id);
CREATE INDEX idx_audit_trail_timestamp ON public.vote_audit_trail(timestamp);

-- Create function to get latest block
CREATE OR REPLACE FUNCTION public.get_latest_block()
RETURNS public.vote_blocks
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.vote_blocks 
  ORDER BY block_number DESC 
  LIMIT 1;
$$;