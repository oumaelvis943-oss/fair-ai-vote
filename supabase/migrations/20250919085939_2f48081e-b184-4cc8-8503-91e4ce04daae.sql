-- Add public election and voter list features
ALTER TABLE public.elections 
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN voter_list_uploaded BOOLEAN DEFAULT false;

-- Create eligible_voters table for CSV uploaded voters
CREATE TABLE public.eligible_voters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  voter_id_number TEXT,
  additional_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(election_id, email)
);

-- Enable RLS for eligible_voters
ALTER TABLE public.eligible_voters ENABLE ROW LEVEL SECURITY;

-- Create policies for eligible_voters
CREATE POLICY "Admins can manage eligible voters" 
ON public.eligible_voters 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Voters can view their eligibility" 
ON public.eligible_voters 
FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.profiles 
  WHERE email = eligible_voters.email
));

-- Create triggers for eligible_voters timestamps
CREATE TRIGGER update_eligible_voters_updated_at
BEFORE UPDATE ON public.eligible_voters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create election_analytics table for real-time analytics
CREATE TABLE public.election_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'vote_count', 'candidate_registration', 'user_activity'
  metric_value INTEGER NOT NULL DEFAULT 0,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  additional_data JSONB DEFAULT '{}'
);

-- Enable RLS for election_analytics
ALTER TABLE public.election_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for election_analytics
CREATE POLICY "Admins can view all analytics" 
ON public.election_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Voters can view public election analytics" 
ON public.election_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.elections 
  WHERE elections.id = election_analytics.election_id 
  AND (elections.is_public = true OR elections.status = 'active')
));

-- Create indexes for performance
CREATE INDEX idx_eligible_voters_election_email ON public.eligible_voters(election_id, email);
CREATE INDEX idx_election_analytics_election_metric ON public.election_analytics(election_id, metric_type);
CREATE INDEX idx_election_analytics_timestamp ON public.election_analytics(timestamp DESC);

-- Update elections policies to include public elections
DROP POLICY IF EXISTS "Everyone can view active elections" ON public.elections;
CREATE POLICY "Everyone can view public or active elections" 
ON public.elections 
FOR SELECT 
USING (
  (status = 'active' AND is_public = true) OR 
  (auth.uid() = created_by) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);