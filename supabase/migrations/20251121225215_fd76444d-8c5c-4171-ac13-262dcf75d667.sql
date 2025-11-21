-- Fix search_path for functions to prevent search_path mutable security warning

-- Fix generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  year TEXT;
  count INTEGER;
  new_number TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COUNT(*) + 1 INTO count
  FROM public.internal_orders
  WHERE order_number LIKE 'IO-' || year || '-%';
  
  new_number := 'IO-' || year || '-' || LPAD(count::TEXT, 3, '0');
  
  RETURN new_number;
END;
$function$;

-- Fix set_order_number trigger function
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix update_handover_memos_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_handover_memos_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix create_mep_from_order trigger function
CREATE OR REPLACE FUNCTION public.create_mep_from_order()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO public.mep_planning (date, location, recipe_id, quantity, notes)
    SELECT 
      NEW.delivery_date,
      NEW.to_location,
      r.id,
      oi.quantity,
      'Van interne bestelling ' || NEW.order_number
    FROM public.internal_order_items oi
    LEFT JOIN public.recipes r ON r.name = oi.product_name
    WHERE oi.order_id = NEW.id AND r.id IS NOT NULL
    ON CONFLICT (date, location, recipe_id) 
    DO UPDATE SET 
      quantity = public.mep_planning.quantity + EXCLUDED.quantity,
      notes = public.mep_planning.notes || ' + ' || EXCLUDED.notes;
  END IF;
  
  RETURN NEW;
END;
$function$;