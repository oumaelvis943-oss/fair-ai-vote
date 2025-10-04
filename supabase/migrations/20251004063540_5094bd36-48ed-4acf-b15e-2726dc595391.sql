-- Update elections table to support position-specific application forms
-- Change positions from array of strings to array of objects with form fields

COMMENT ON COLUMN public.elections.positions IS 'Array of position objects with structure: {name: string, application_form_fields: FormField[]}';

-- Update application_form_fields to be deprecated (kept for backward compatibility)
COMMENT ON COLUMN public.elections.application_form_fields IS 'DEPRECATED: Use position-specific forms in positions array instead';

-- No actual column changes needed since JSONB can store any structure
-- This is a data structure change, not a schema change