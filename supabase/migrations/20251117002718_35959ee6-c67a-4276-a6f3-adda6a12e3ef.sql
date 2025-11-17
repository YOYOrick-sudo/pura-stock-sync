-- Create weather_data table for historical weather tracking
CREATE TABLE IF NOT EXISTS public.weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  date DATE NOT NULL,
  temperature NUMERIC NOT NULL,
  condition TEXT NOT NULL, -- 'sunny', 'rainy', 'cloudy', 'windy', etc.
  wind_speed NUMERIC,
  precipitation NUMERIC,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(location, date)
);

-- Create ai_suggestions table for tracking AI-generated suggestions and feedback
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  weather_condition TEXT NOT NULL,
  temperature NUMERIC NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'task', 'menu', 'staffing'
  suggestion_text TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  user_feedback TEXT, -- 'accepted', 'rejected', 'modified', null
  feedback_note TEXT,
  created_task_id UUID REFERENCES public.foh_tasks(id),
  impact_score NUMERIC
);

-- Enable RLS on weather_data
ALTER TABLE public.weather_data ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_suggestions
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weather_data
CREATE POLICY "Users can view weather data for their location"
  ON public.weather_data
  FOR SELECT
  USING (location = current_user_location());

CREATE POLICY "System can insert weather data"
  ON public.weather_data
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_suggestions
CREATE POLICY "Users can view suggestions for their location"
  ON public.ai_suggestions
  FOR SELECT
  USING (location = current_user_location());

CREATE POLICY "Users can create suggestions for their location"
  ON public.ai_suggestions
  FOR INSERT
  WITH CHECK (location = current_user_location());

CREATE POLICY "Users can update suggestions for their location"
  ON public.ai_suggestions
  FOR UPDATE
  USING (location = current_user_location());

-- Create indexes for better performance
CREATE INDEX idx_weather_data_location_date ON public.weather_data(location, date DESC);
CREATE INDEX idx_ai_suggestions_location_created ON public.ai_suggestions(location, created_at DESC);
CREATE INDEX idx_ai_suggestions_feedback ON public.ai_suggestions(user_feedback) WHERE user_feedback IS NOT NULL;