-- =============================================
-- KITCHEN/MISE-EN-PLACE SYSTEM - COMPLETE SCHEMA
-- =============================================

-- 1. USER ROLES SYSTEM
-- =============================================

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'kitchen_staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role, location)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user location
CREATE OR REPLACE FUNCTION public.get_user_location(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT location
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Insert default user role for existing user
INSERT INTO public.user_roles (user_id, role, location)
SELECT id, 'admin', 'West'
FROM auth.users
WHERE email = 'purawestkeuken@puravidafoodbar.nl'
ON CONFLICT DO NOTHING;


-- 2. RECIPES SYSTEM
-- =============================================

-- Recipes table
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  prep_time_minutes INTEGER,
  location TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipe steps table
CREATE TABLE public.recipe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, step_number)
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for recipes
CREATE POLICY "Anyone can view recipes for their location"
  ON public.recipes FOR SELECT
  USING (
    location = public.get_user_location(auth.uid()) 
    OR location = 'Both'
  );

CREATE POLICY "Users can create recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete recipes"
  ON public.recipes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for recipe_steps
CREATE POLICY "Anyone can view recipe steps"
  ON public.recipe_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE id = recipe_id
      AND (location = public.get_user_location(auth.uid()) OR location = 'Both')
    )
  );

CREATE POLICY "Recipe creators can manage steps"
  ON public.recipe_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE id = recipe_id AND created_by = auth.uid()
    )
  );


-- 3. MEP PLANNING SYSTEM
-- =============================================

-- MEP planning table
CREATE TABLE public.mep_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  location TEXT NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'planned',
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(date, location, recipe_id)
);

-- Enable RLS
ALTER TABLE public.mep_planning ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view MEP for their location"
  ON public.mep_planning FOR SELECT
  USING (location = public.get_user_location(auth.uid()));

CREATE POLICY "Users can create MEP entries"
  ON public.mep_planning FOR INSERT
  WITH CHECK (location = public.get_user_location(auth.uid()));

CREATE POLICY "Users can update MEP for their location"
  ON public.mep_planning FOR UPDATE
  USING (location = public.get_user_location(auth.uid()));

CREATE POLICY "Admins can delete MEP entries"
  ON public.mep_planning FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_mep_planning_date_location ON public.mep_planning(date, location);


-- 4. INTERNAL ORDERS SYSTEM
-- =============================================

-- Internal orders table
CREATE TABLE public.internal_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL,
  approved_by UUID,
  delivery_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (from_location != to_location)
);

-- Internal order items table
CREATE TABLE public.internal_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.internal_orders(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'stuks',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.internal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Users can view orders involving their location"
  ON public.internal_orders FOR SELECT
  USING (
    from_location = public.get_user_location(auth.uid()) 
    OR to_location = public.get_user_location(auth.uid())
  );

CREATE POLICY "Users can create orders from their location"
  ON public.internal_orders FOR INSERT
  WITH CHECK (
    from_location = public.get_user_location(auth.uid())
    AND auth.uid() = requested_by
  );

CREATE POLICY "Users can update orders for their location"
  ON public.internal_orders FOR UPDATE
  USING (
    from_location = public.get_user_location(auth.uid()) 
    OR to_location = public.get_user_location(auth.uid())
  );

-- RLS policies for order items
CREATE POLICY "Users can view order items"
  ON public.internal_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_orders o
      WHERE o.id = order_id
      AND (o.from_location = public.get_user_location(auth.uid()) 
           OR o.to_location = public.get_user_location(auth.uid()))
    )
  );

CREATE POLICY "Users can create order items"
  ON public.internal_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.internal_orders o
      WHERE o.id = order_id
      AND o.from_location = public.get_user_location(auth.uid())
      AND o.requested_by = auth.uid()
    )
  );

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
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
$$;

-- Trigger to auto-generate order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.internal_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Trigger to create MEP entries when order is approved
CREATE OR REPLACE FUNCTION create_mep_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

CREATE TRIGGER trigger_create_mep_from_order
  AFTER UPDATE ON public.internal_orders
  FOR EACH ROW
  EXECUTE FUNCTION create_mep_from_order();


-- 5. KITCHEN TASKS SYSTEM
-- =============================================

-- Kitchen tasks table
CREATE TABLE public.kitchen_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  frequency TEXT NOT NULL,
  assigned_to UUID,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.kitchen_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view tasks for their location"
  ON public.kitchen_tasks FOR SELECT
  USING (location = public.get_user_location(auth.uid()));

CREATE POLICY "Users can create tasks"
  ON public.kitchen_tasks FOR INSERT
  WITH CHECK (location = public.get_user_location(auth.uid()));

CREATE POLICY "Users can update tasks for their location"
  ON public.kitchen_tasks FOR UPDATE
  USING (location = public.get_user_location(auth.uid()));

CREATE POLICY "Admins can delete tasks"
  ON public.kitchen_tasks FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_kitchen_tasks_location_date ON public.kitchen_tasks(location, due_date);
CREATE INDEX idx_kitchen_tasks_completed ON public.kitchen_tasks(completed, location);