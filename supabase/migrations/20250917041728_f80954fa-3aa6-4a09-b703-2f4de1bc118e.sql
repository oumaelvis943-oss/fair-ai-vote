-- Create admin user with specified credentials
-- First, check if the user already exists and update if needed
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if user exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'elvis.ouma@mpesafoundationacademy.ac.ke';
    
    -- If user doesn't exist, we'll need to handle this in the application
    -- For now, just ensure the profile exists if the user is created
    IF admin_user_id IS NOT NULL THEN
        -- Update or insert profile
        INSERT INTO public.profiles (user_id, email, full_name, role)
        VALUES (
            admin_user_id,
            'elvis.ouma@mpesafoundationacademy.ac.ke',
            'Elvis Ouma',
            'admin'
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'admin',
            full_name = 'Elvis Ouma',
            updated_at = now();
    END IF;
END $$;