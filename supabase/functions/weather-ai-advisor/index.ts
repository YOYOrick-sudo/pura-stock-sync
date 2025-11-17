import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location } = await req.json();
    
    if (!location) {
      throw new Error('Location is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Coordinates for Terschelling
    const lat = 53.3906;
    const lon = 5.2142;

    // Fetch current weather from Open-Meteo (free API)
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m,precipitation&timezone=Europe/Amsterdam&forecast_days=1`
    );

    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    
    // Map weather codes to conditions
    const weatherCodeMap: Record<number, string> = {
      0: 'sunny',
      1: 'partly_cloudy',
      2: 'partly_cloudy',
      3: 'cloudy',
      45: 'foggy',
      48: 'foggy',
      51: 'rainy',
      53: 'rainy',
      55: 'rainy',
      61: 'rainy',
      63: 'rainy',
      65: 'rainy',
      71: 'snowy',
      73: 'snowy',
      75: 'snowy',
      80: 'rainy',
      81: 'rainy',
      82: 'rainy',
      95: 'stormy',
      96: 'stormy',
      99: 'stormy',
    };

    const condition = weatherCodeMap[current.weathercode] || 'cloudy';
    const temperature = Math.round(current.temperature_2m);
    const windSpeed = Math.round(current.windspeed_10m);
    const precipitation = current.precipitation;

    // Store weather data
    await supabase.from('weather_data').upsert({
      location,
      date: new Date().toISOString().split('T')[0],
      temperature,
      condition,
      wind_speed: windSpeed,
      precipitation,
    }, {
      onConflict: 'location,date'
    });

    // Fetch historical successful suggestions (last 10 accepted)
    const { data: historicalSuggestions } = await supabase
      .from('ai_suggestions')
      .select('suggestion_text, reasoning, weather_condition, temperature')
      .eq('location', location)
      .eq('user_feedback', 'accepted')
      .order('created_at', { ascending: false })
      .limit(10);

    const historicalContext = historicalSuggestions && historicalSuggestions.length > 0
      ? `\n\nHistorisch succesvolle acties bij vergelijkbaar weer:\n${historicalSuggestions.map((s, i) => 
          `${i + 1}. "${s.suggestion_text}" (${s.weather_condition}, ${s.temperature}°C)\n   Reden: ${s.reasoning}`
        ).join('\n')}`
      : '';

    // Generate AI suggestions using OpenAI
    const prompt = `Je bent een restaurant operations advisor voor Pura Vida op Terschelling.

Context:
- Locatie: ${location}
- Weer vandaag: ${condition}, ${temperature}°C, wind ${windSpeed} km/h, neerslag ${precipitation}mm
${historicalContext}

Genereer 3-5 concrete, uitvoerbare suggesties voor:
1. Operationele taken (terras, voorraad, decoratie, etc)
2. Menu/verkoop optimalisatie
3. Personeel/planning

Focus op acties die bewezen impact hebben gehad of logisch zijn voor dit weer.

Antwoord in dit exacte JSON formaat:
{
  "suggestions": [
    {
      "type": "task",
      "text": "Korte, concrete actie",
      "reasoning": "Waarom deze suggestie relevant is"
    }
  ]
}`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'Je bent een expert restaurant operations advisor. Antwoord altijd in valide JSON formaat.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error('Failed to generate AI suggestions');
    }

    const aiData = await openAIResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    // Store suggestions in database
    const suggestionPromises = parsedResponse.suggestions.map((s: any) =>
      supabase.from('ai_suggestions').insert({
        location,
        weather_condition: condition,
        temperature,
        suggestion_type: s.type || 'task',
        suggestion_text: s.text,
        reasoning: s.reasoning,
      })
    );

    await Promise.all(suggestionPromises);

    return new Response(
      JSON.stringify({
        weather: {
          condition,
          temperature,
          windSpeed,
          precipitation,
        },
        suggestions: parsedResponse.suggestions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in weather-ai-advisor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
