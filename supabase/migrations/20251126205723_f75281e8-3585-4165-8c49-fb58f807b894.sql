-- Add receiver feedback columns to internal_orders
ALTER TABLE public.internal_orders 
ADD COLUMN IF NOT EXISTS receiver_notes TEXT,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN public.internal_orders.receiver_notes IS 'Feedback from receiving location about delivery (e.g., missing items)';
COMMENT ON COLUMN public.internal_orders.received_at IS 'Timestamp when order was confirmed as received';