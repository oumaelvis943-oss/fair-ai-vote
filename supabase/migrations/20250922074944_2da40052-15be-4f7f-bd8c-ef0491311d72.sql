-- Enhanced database schema for AI Voting Platform

-- Add AI evaluation fields to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS ai_score DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_ranking INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS evaluation_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS application_files TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- Create candidate evaluation criteria table
CREATE TABLE IF NOT EXISTS public.candidate_evaluation_criteria (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    criterion_name TEXT NOT NULL,
    criterion_type TEXT NOT NULL CHECK (criterion_type IN ('text', 'number', 'file', 'dropdown', 'scale')),
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    options JSONB DEFAULT '{}',
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create candidate applications table for detailed applications
CREATE TABLE IF NOT EXISTS public.candidate_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES public.candidate_evaluation_criteria(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL DEFAULT '{}',
    normalized_score DECIMAL(5,2) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ID verification table
CREATE TABLE IF NOT EXISTS public.user_verification (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'id_document', 'phone', 'institutional')),
    verification_data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit trail for AI decisions
CREATE TABLE IF NOT EXISTS public.ai_audit_trail (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    decision_type TEXT NOT NULL,
    ai_model_version TEXT NOT NULL DEFAULT 'v1.0',
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    confidence_score DECIMAL(5,2),
    processing_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.election_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('results', 'analytics', 'audit', 'ai_evaluation')),
    report_data JSONB NOT NULL DEFAULT '{}',
    generated_by UUID NOT NULL REFERENCES public.profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add additional fields to elections table
ALTER TABLE public.elections 
ADD COLUMN IF NOT EXISTS ai_evaluation_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS blockchain_verification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_form_schema JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.candidate_evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for candidate_evaluation_criteria
CREATE POLICY "Admins can manage evaluation criteria" 
ON public.candidate_evaluation_criteria FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Everyone can view criteria for public elections"
ON public.candidate_evaluation_criteria FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.elections 
        WHERE id = election_id AND (is_public = true OR status = 'active')
    )
);

-- RLS policies for candidate_applications
CREATE POLICY "Candidates can manage their own applications"
ON public.candidate_applications FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.candidates 
        WHERE id = candidate_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all applications"
ON public.candidate_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for user_verification
CREATE POLICY "Users can manage their own verification"
ON public.user_verification FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all verifications"
ON public.user_verification FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for ai_audit_trail
CREATE POLICY "Admins can view AI audit trail"
ON public.ai_audit_trail FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- RLS policies for election_reports
CREATE POLICY "Admins can manage reports"
ON public.election_reports FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can view public election reports"
ON public.election_reports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.elections 
        WHERE id = election_id AND is_public = true
    )
);

-- Create updated_at triggers
CREATE TRIGGER update_candidate_applications_updated_at
    BEFORE UPDATE ON public.candidate_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create functions for AI evaluation
CREATE OR REPLACE FUNCTION public.calculate_candidate_ai_score(candidate_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_weighted_score DECIMAL := 0;
    total_weight DECIMAL := 0;
    app_record RECORD;
BEGIN
    -- Calculate weighted average score for candidate
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
        RETURN total_weighted_score / total_weight;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;