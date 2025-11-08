-- Create staff_members table for managing service staff
CREATE TABLE public.staff_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  role TEXT DEFAULT 'service',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Users can view staff for their location
CREATE POLICY "Users can view staff for their location"
ON public.staff_members
FOR SELECT
USING (location = get_user_location(auth.uid()));

-- Users can create staff for their location
CREATE POLICY "Users can create staff for their location"
ON public.staff_members
FOR INSERT
WITH CHECK (location = get_user_location(auth.uid()) AND created_by = auth.uid());

-- Users can update staff for their location
CREATE POLICY "Users can update staff for their location"
ON public.staff_members
FOR UPDATE
USING (location = get_user_location(auth.uid()));

-- Admins can delete staff
CREATE POLICY "Admins can delete staff"
ON public.staff_members
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add index for better performance
CREATE INDEX idx_staff_members_location ON public.staff_members(location);
CREATE INDEX idx_staff_members_active ON public.staff_members(active);