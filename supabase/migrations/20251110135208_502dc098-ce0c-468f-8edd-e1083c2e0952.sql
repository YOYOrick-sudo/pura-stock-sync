-- Add INSERT policy for notifications table
-- Only admins can create notifications to prevent fake notifications
CREATE POLICY "Only admins can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);