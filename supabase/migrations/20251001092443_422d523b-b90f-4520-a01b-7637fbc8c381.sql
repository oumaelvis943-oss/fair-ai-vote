-- Add application form schema to elections table
ALTER TABLE public.elections
ADD COLUMN application_form_fields jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.elections.application_form_fields IS 'Admin-defined form fields for candidate applications. Each field has: id, label, type, required, options, validation';

-- Update candidates table to store form responses
ALTER TABLE public.candidates
ADD COLUMN form_responses jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.candidates.form_responses IS 'Stores candidate responses to custom application form fields';