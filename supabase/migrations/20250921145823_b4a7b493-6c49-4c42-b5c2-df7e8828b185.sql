-- Add positions support to elections table
ALTER TABLE public.elections ADD COLUMN positions jsonb DEFAULT '[]'::jsonb;

-- Create notifications table for voter notifications
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  election_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can create notifications
CREATE POLICY "Admins can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add position field to candidates table
ALTER TABLE public.candidates ADD COLUMN position text;