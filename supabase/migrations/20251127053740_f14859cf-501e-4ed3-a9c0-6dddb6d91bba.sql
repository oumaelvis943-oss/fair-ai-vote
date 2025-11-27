-- ============================================
-- SECURITY FIX: Enable Leaked Password Protection
-- ============================================

-- Note: Leaked password protection must be enabled in Supabase Dashboard
-- Auth → Password Protection → Enable "I have been pwned"
-- This cannot be done via SQL migration, it's an auth configuration setting

-- Add comment to track this requirement
COMMENT ON SCHEMA public IS 'Production Security: Enable leaked password protection in Supabase Dashboard > Auth > Password Protection';

-- Additional password security: Ensure minimum password requirements
-- This is handled by Supabase Auth settings, document here for reference:
-- Minimum password length: 8 characters
-- Password strength: Medium or higher
-- Enable "I have been pwned" integration for leaked password detection