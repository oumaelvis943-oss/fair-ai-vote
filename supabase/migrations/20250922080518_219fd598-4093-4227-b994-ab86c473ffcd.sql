-- Fix migration - only create what doesn't exist

-- Add AI evaluation fields to candidates table (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'ai_score') THEN
        ALTER TABLE public.candidates ADD COLUMN ai_score DECIMAL(5,2) DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'ai_ranking') THEN
        ALTER TABLE public.candidates ADD COLUMN ai_ranking INTEGER DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'evaluation_data') THEN
        ALTER TABLE public.candidates ADD COLUMN evaluation_data JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'application_files') THEN
        ALTER TABLE public.candidates ADD COLUMN application_files TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'verification_status') THEN
        ALTER TABLE public.candidates ADD COLUMN verification_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Add additional fields to elections table (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elections' AND column_name = 'ai_evaluation_enabled') THEN
        ALTER TABLE public.elections ADD COLUMN ai_evaluation_enabled BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elections' AND column_name = 'blockchain_verification') THEN
        ALTER TABLE public.elections ADD COLUMN blockchain_verification BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elections' AND column_name = 'custom_form_schema') THEN
        ALTER TABLE public.elections ADD COLUMN custom_form_schema JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'elections' AND column_name = 'eligibility_criteria') THEN
        ALTER TABLE public.elections ADD COLUMN eligibility_criteria JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create missing tables only if they don't exist
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

CREATE TABLE IF NOT EXISTS public.candidate_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES public.candidate_evaluation_criteria(id) ON DELETE CASCADE,
    response_data JSONB NOT NULL DEFAULT '{}',
    normalized_score DECIMAL(5,2) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_verification (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('email', 'id_document', 'phone', 'institutional')),
    verification_data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.candidate_evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- Create function for AI evaluation
CREATE OR REPLACE FUNCTION public.calculate_candidate_ai_score(candidate_uuid UUID)
RETURNS DECIMAL AS $$
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
        RETURN total_weighted_score / total_weight;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;