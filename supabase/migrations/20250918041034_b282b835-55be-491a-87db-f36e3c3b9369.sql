-- Fix admin user role and ensure proper profile creation
-- Update the handle_new_user function to handle admin user creation correctly

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    CASE 
      WHEN NEW.email = 'elvis.ouma@mpesafoundationacademy.ac.ke' THEN 'admin'
      ELSE 'voter'
    END
  );
  RETURN NEW;
END;
$function$;

-- Update existing profile if it exists for the admin user
UPDATE public.profiles 
SET role = 'admin', full_name = 'Elvis Ouma', updated_at = now()
WHERE email = 'elvis.ouma@mpesafoundationacademy.ac.ke';