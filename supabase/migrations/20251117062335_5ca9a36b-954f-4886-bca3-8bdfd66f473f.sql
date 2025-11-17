-- Remove hardcoded admin email from handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'voter' -- Default role for all new users
  );
  RETURN NEW;
END;
$$;

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('candidate-documents', 'candidate-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']::text[]),
  ('election-assets', 'election-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for candidate documents
CREATE POLICY "Authenticated users can upload their candidate documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own candidate documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all candidate documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Users can update their own candidate documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'candidate-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own candidate documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policies for election assets
CREATE POLICY "Public can view election assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'election-assets');

CREATE POLICY "Admins can upload election assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'election-assets'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update election assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'election-assets'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete election assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'election-assets'
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add encrypted password support for SMTP (using pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encryption key column for SMTP passwords
ALTER TABLE smtp_config ADD COLUMN IF NOT EXISTS password_encrypted bytea;

-- Function to encrypt SMTP password
CREATE OR REPLACE FUNCTION encrypt_smtp_password()
RETURNS trigger AS $$
BEGIN
  IF NEW.password IS NOT NULL AND NEW.password <> '' THEN
    -- Encrypt password using pgcrypto
    NEW.password_encrypted := pgp_sym_encrypt(NEW.password, current_setting('app.settings.smtp_encryption_key', true));
    -- Clear plaintext password
    NEW.password := '[ENCRYPTED]';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically encrypt passwords
DROP TRIGGER IF EXISTS encrypt_smtp_password_trigger ON smtp_config;
CREATE TRIGGER encrypt_smtp_password_trigger
  BEFORE INSERT OR UPDATE ON smtp_config
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_smtp_password();

-- Function to decrypt SMTP password (for edge functions)
CREATE OR REPLACE FUNCTION get_smtp_password(config_id uuid)
RETURNS text AS $$
DECLARE
  decrypted_password text;
BEGIN
  SELECT pgp_sym_decrypt(password_encrypted, current_setting('app.settings.smtp_encryption_key', true))
  INTO decrypted_password
  FROM smtp_config
  WHERE id = config_id;
  
  RETURN decrypted_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add request logging table
CREATE TABLE IF NOT EXISTS public.request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  endpoint text NOT NULL,
  method text NOT NULL,
  ip_address text,
  user_agent text,
  user_id uuid REFERENCES auth.users(id),
  status_code int,
  response_time_ms int,
  error_message text,
  request_body jsonb,
  CONSTRAINT valid_http_method CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'))
);

-- Index for request logs
CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint ON request_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON request_logs(user_id);

-- RLS for request logs
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view request logs"
ON request_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add failed login attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email_ip ON failed_login_attempts(email, ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempted_at ON failed_login_attempts(attempted_at DESC);

-- RLS for failed login attempts
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view failed login attempts"
ON failed_login_attempts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Function to check for suspicious login patterns
CREATE OR REPLACE FUNCTION check_login_attempts(p_email text, p_ip_address text)
RETURNS jsonb AS $$
DECLARE
  recent_attempts int;
  is_blocked boolean := false;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*)
  INTO recent_attempts
  FROM failed_login_attempts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint to prevent duplicate admin roles
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin_per_election ON user_roles(role) 
WHERE role = 'admin';

-- Add session tracking table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- RLS for user sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON user_sessions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
ON user_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND role = 'admin'
  )
);