import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get current season
const getSeason = () => {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'lente';
  if (month >= 6 && month <= 8) return 'zomer';
  if (month >= 9 && month <= 11) return 'herfst';
  return 'winter';
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

    // Check for today's active advice set (1 complete set with products + checks)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAdvice } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('location', location)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .eq('suggestion_type', 'daily_advice')
      .is('user_feedback', null)
      .order('created_at', { ascending: false })
      .limit(1);

    // If we already have a complete set for today, return it
    if (todayAdvice && todayAdvice.length > 0) {
      console.log('Returning today\'s advice set');
      return new Response(
        JSON.stringify({
          weather: { condition, temperature, windSpeed, precipitation },
          advice: JSON.parse(todayAdvice[0].suggestion_text),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise generate new set
    console.log('Generating new advice set...');

    // Fetch historical accepted suggestions for learning
    const { data: acceptedSuggestions } = await supabase
      .from('ai_suggestions')
      .select('suggestion_text, weather_condition, temperature')
      .eq('location', location)
      .eq('user_feedback', 'accepted')
      .order('created_at', { ascending: false })
      .limit(5);

    const historicalContext = acceptedSuggestions && acceptedSuggestions.length > 0
      ? `\n\nEerdere succesvolle ideeën:\n${acceptedSuggestions.map((s, i) => 
          `${i + 1}. "${s.suggestion_text}" (${s.weather_condition}, ${s.temperature}°C)`
        ).join('\n')}`
      : '';

    // Fetch historical rejected suggestions to learn from
    const { data: rejectedSuggestions } = await supabase
      .from('ai_suggestions')
      .select('suggestion_text, feedback_note, weather_condition, temperature')
      .eq('location', location)
      .eq('user_feedback', 'rejected')
      .not('feedback_note', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    const rejectedContext = rejectedSuggestions && rejectedSuggestions.length > 0
      ? `\n\nAfgewezen ideeën (NIET dit soort dingen):\n${rejectedSuggestions.map((s, i) => 
          `${i + 1}. "${s.suggestion_text}" - Reden: ${s.feedback_note} (${s.weather_condition}, ${s.temperature}°C)`
        ).join('\n')}`
      : '';

    const season = getSeason();
    const prompt = `Je genereert direct uitvoerbare horeca-ideeën voor Pura Vida op Terschelling die omzet verhogen, service verbeteren en de totale uitstraling versterken.

Context:
- Locatie: ${location}
- Weer vandaag: ${condition}, ${temperature}°C, wind ${windSpeed} km/h
- Seizoen: ${season}
${historicalContext}
${rejectedContext}

PURA VIDA IDENTITEIT (altijd meenemen):
- Kleur, warmte, vrolijk, laagdrempelig
- Snel, praktisch, max 1-2 extra handelingen
- Bestaande voorraad: chai, koffie, lemonades, smoothies, zoet, snacks
- Gasten: wandelaars, toeristen, locals
- Focus: omzet, gastbeleving, uitstraling van de zaak

DENK ALTIJD NA OVER:
- Het actuele weer (temperatuur, wind, regen, zon)
- Margeverhoging (bundel, upsell, premium toevoeging)
- Snelheid & haalbaarheid
- Beleving & uitstraling (presentatie, zichtbaarheid, sfeer)
- Servicechecks (bar netjes, kaarten schoon, counter presentatie)

GENEREER:
1. Productideeën (1-3 stuks):
   - Elk idee: naam, beschrijving, waarom het past bij het weer, marge/deal info
   - Kort en concreet, direct uitvoerbaar

2. Kwaliteitschecks (2-4 stuks):
   - Service & uitstraling checks
   - Bar, counter, menukaarten, schoonmaak, presentatie
   - Kleine ingrepen die groot effect hebben

Stijl: Kort, concreet, creatief, professioneel. Toepasbaar vandaag.`;

    console.log('Calling OpenAI API...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'Je bent een expert horeca-adviseur voor Pura Vida op Terschelling.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_daily_advice",
            description: "Genereer 1 complete adviesset met productideeën en kwaliteitschecks",
            parameters: {
              type: "object",
              properties: {
                product_ideas: {
                  type: "array",
                  description: "1-3 concrete productideeën voor vandaag",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string",
                        description: "Korte, pakkende naam van het product/idee"
                      },
                      description: { 
                        type: "string",
                        description: "Volledige uitleg: ingrediënten, bereiding, presentatie, waarom het past bij het weer, marge/deal info"
                      }
                    },
                    required: ["title", "description"],
                    additionalProperties: false
                  },
                  minItems: 1,
                  maxItems: 3
                },
                quality_checks: {
                  type: "array",
                  description: "2-4 kwaliteitschecks voor service & uitstraling",
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string",
                        description: "Wat moet gecheckt worden (bijv. 'Barpresentatie', 'Menukaarten')"
                      },
                      description: { 
                        type: "string",
                        description: "Concrete actie: wat checken, waarom belangrijk, wat aanpassen"
                      }
                    },
                    required: ["title", "description"],
                    additionalProperties: false
                  },
                  minItems: 2,
                  maxItems: 4
                }
              },
              required: ["product_ideas", "quality_checks"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_daily_advice" } },
        max_completion_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI full response:', JSON.stringify(openAIData, null, 2));

    const message = openAIData.choices[0].message;
    console.log('Message object:', JSON.stringify(message, null, 2));

    if (!message.tool_calls || message.tool_calls.length === 0) {
      throw new Error('No tool calls in response');
    }

    const toolCall = message.tool_calls[0];
    console.log('Tool call:', JSON.stringify(toolCall, null, 2));

    const parsedResponse = JSON.parse(toolCall.function.arguments);
    console.log('Successfully parsed advice:', JSON.stringify(parsedResponse, null, 2));

    // Store as 1 record
    const { error: insertError } = await supabase
      .from('ai_suggestions')
      .insert({
        location,
        weather_condition: condition,
        temperature,
        suggestion_type: 'daily_advice',
        suggestion_text: JSON.stringify(parsedResponse),
        reasoning: `Gebaseerd op ${condition}, ${temperature}°C, wind ${windSpeed} km/h, seizoen: ${season}`,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Stored daily advice set in database');

    return new Response(
      JSON.stringify({
        weather: { condition, temperature, windSpeed, precipitation },
        advice: parsedResponse,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in weather-ai-advisor:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
