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
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: corsHeaders });
    }

    const { location } = await req.json();
    
    if (!location) {
      throw new Error('Location is required');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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

    // Check hoeveel suggesties we al hebben voor vandaag
    const today = new Date().toISOString().split('T')[0];
    const { data: todaySuggestions, count } = await supabase
      .from('ai_suggestions')
      .select('*', { count: 'exact' })
      .eq('location', location)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .eq('suggestion_type', 'inspiration')
      .is('user_feedback', null);

    const TARGET_SUGGESTIONS = 2;
    const missingCount = Math.max(0, TARGET_SUGGESTIONS - (count || 0));

    // Als we al genoeg hebben, return bestaande
    if (missingCount === 0 && todaySuggestions) {
      console.log('Returning existing suggestions');
      return new Response(
        JSON.stringify({
          weather: { condition, temperature, windSpeed, precipitation },
          suggestions: todaySuggestions.map(s => ({
            id: s.id,
            text: s.suggestion_text,
            reasoning: s.reasoning
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating ${missingCount} new suggestions...`);
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

GENEREER ${missingCount} concrete suggesties:
- Elk kan zijn: productidee, kwaliteitscheck, margin-verhogend idee, service, sfeer
- KORTE titel (3-6 woorden)
- KORTE beschrijving (max 1-2 zinnen) met duidelijk doel
- Direct uitvoerbaar vandaag

Stijl: Kort, bondig, concreet, professioneel. Geen lange uitleg.`;

    console.log('Calling Lovable AI Gateway...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Je bent een expert horeca-adviseur voor Pura Vida op Terschelling.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_suggestions",
            description: `Genereer ${missingCount} korte, concrete suggesties voor Pura Vida`,
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  description: `${missingCount} verschillende suggesties (product, kwaliteit, margin, service, sfeer)`,
                  items: {
                    type: "object",
                    properties: {
                      title: { 
                        type: "string",
                        description: "Korte, pakkende titel (3-6 woorden)"
                      },
                      description: { 
                        type: "string",
                        description: "Korte beschrijving (max 1-2 zinnen) met duidelijk doel"
                      }
                    },
                    required: ["title", "description"],
                    additionalProperties: false
                  },
                  minItems: missingCount,
                  maxItems: missingCount
                }
              },
              required: ["suggestions"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_suggestions" } },
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
    console.log('Successfully parsed suggestions:', JSON.stringify(parsedResponse, null, 2));

    // Store elke suggestie als aparte record
    const suggestionRecords = parsedResponse.suggestions.map((s: any) => ({
      location,
      weather_condition: condition,
      temperature,
      suggestion_type: 'inspiration',
      suggestion_text: s.title,
      reasoning: s.description,
    }));

    const { error: insertError } = await supabase
      .from('ai_suggestions')
      .insert(suggestionRecords);

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log(`Stored ${suggestionRecords.length} new suggestions`);

    // Return alle suggesties (oude + nieuwe)
    const { data: allSuggestions } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('location', location)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .eq('suggestion_type', 'inspiration')
      .is('user_feedback', null);

    return new Response(
      JSON.stringify({
        weather: { condition, temperature, windSpeed, precipitation },
        suggestions: allSuggestions?.map(s => ({
          id: s.id,
          text: s.suggestion_text,
          reasoning: s.reasoning
        })) || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in weather-ai-advisor:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An internal error occurred'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
