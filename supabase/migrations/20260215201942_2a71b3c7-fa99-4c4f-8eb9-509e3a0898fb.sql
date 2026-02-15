
-- Create shift_swap_requests table
CREATE TABLE public.shift_swap_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
  target_schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  decided_at TIMESTAMP WITH TIME ZONE,
  decided_by UUID
);

-- Enable RLS
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own swap requests (as requester)
CREATE POLICY "Users can view own swap requests"
ON public.shift_swap_requests FOR SELECT
USING (auth.uid() = requester_id);

-- Target users can view swap requests aimed at them
CREATE POLICY "Target users can view swap requests"
ON public.shift_swap_requests FOR SELECT
USING (auth.uid() = target_user_id);

-- Managers can view all swap requests in their location
CREATE POLICY "Managers can view location swap requests"
ON public.shift_swap_requests FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can create swap requests as themselves
CREATE POLICY "Users can create own swap requests"
ON public.shift_swap_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Managers can update swap requests (approve/reject)
CREATE POLICY "Managers can update swap requests"
ON public.shift_swap_requests FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);
