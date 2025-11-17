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

    // Check for today's active suggestions (without user_feedback)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const { data: todaySuggestions } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('location', location)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .is('user_feedback', null)
      .order('created_at', { ascending: false });

    const activeCount = todaySuggestions?.length || 0;

    // If we have 2+ active suggestions, return them
    if (todaySuggestions && activeCount >= 2) {
      console.log(`Returning ${activeCount} active suggestions from today`);
      return new Response(
        JSON.stringify({
          weather: {
            condition,
            temperature,
            windSpeed,
            precipitation,
          },
          suggestions: todaySuggestions.slice(0, 2).map(s => ({
            type: s.suggestion_type,
            text: s.suggestion_text,
            reasoning: s.reasoning,
          })),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate how many new suggestions we need
    const missingCount = 2 - activeCount;
    console.log(`Only ${activeCount} active suggestions, generating ${missingCount} new ones...`);

    // Fetch historical successful suggestions for context
    const { data: historicalSuggestions } = await supabase
      .from('ai_suggestions')
      .select('suggestion_text, reasoning, weather_condition, temperature')
      .eq('location', location)
      .eq('user_feedback', 'accepted')
      .order('created_at', { ascending: false })
      .limit(5);

    const historicalContext = historicalSuggestions && historicalSuggestions.length > 0
      ? `\n\nEerdere succesvolle ideeën:\n${historicalSuggestions.map((s, i) => 
          `${i + 1}. "${s.suggestion_text}" (${s.weather_condition}, ${s.temperature}°C)`
        ).join('\n')}`
      : '';

    // Generate AI suggestions using OpenAI with new inspirational prompt
    const season = getSeason();
    const prompt = `Je bent een creatieve inspiratiebron voor Pura Vida op Terschelling.

Context:
- Locatie: ${location}
- Weer vandaag: ${condition}, ${temperature}°C, wind ${windSpeed} km/h
- Seizoen: ${season}
${historicalContext}

Genereer exact ${missingCount} **inspirerende product/sfeer ideeën** die passen bij het weer en seizoen:
- Denk aan: warme dranken, specials, seizoensproducten, sfeer/decoratie
- Geef de suggestie in 1-2 zinnen, conceptueel maar niet te specifiek
- Laat ruimte voor eigen creativiteit

Voorbeelden van goede suggesties:
- "Het is fris buiten, de tijd van pompoenen is aangebroken. Idee: laten we een leuke warme drank special gaan verkopen."
- "Perfect terrasweer! Misschien tijd voor een frisse lunch special of ijskoffie actie?"
- "Grijs weer vandaag. Een warme drank met iets zoets kan de sfeer opfleuren."

Wees creatief maar niet te specifiek - geef inspiratie, geen volledige uitwerking.`;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'Je bent een creatieve inspiratiebron voor restaurants. Je geeft korte, inspirerende ideeën gebaseerd op weer en seizoen.' },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_ideas",
            description: `Genereer exact ${missingCount} inspirerende product/sfeer ideeën`,
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { 
                        type: "string", 
                        enum: ["inspiration"],
                        description: "Het type suggestie, altijd 'inspiration'"
                      },
                      text: { 
                        type: "string",
                        description: "De inspirerende suggestie in 1-2 zinnen"
                      },
                      reasoning: { 
                        type: "string",
                        description: "Korte uitleg waarom dit past bij het weer/seizoen"
                      }
                    },
                    required: ["type", "text", "reasoning"]
                  },
                  minItems: missingCount,
                  maxItems: missingCount
                }
              },
              required: ["suggestions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "suggest_ideas" } },
        max_completion_tokens: 800,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      throw new Error('Failed to generate AI suggestions');
    }

    const aiData = await openAIResponse.json();
    console.log('OpenAI full response:', JSON.stringify(aiData, null, 2));
    
    // Parse tool call response with detailed error handling
    let parsedResponse;
    try {
      // Check if response structure exists
      if (!aiData.choices || !aiData.choices[0]) {
        console.error('Invalid AI response structure - no choices:', aiData);
        throw new Error('No choices in AI response');
      }

      const message = aiData.choices[0].message;
      console.log('Message object:', JSON.stringify(message, null, 2));

      if (!message.tool_calls || message.tool_calls.length === 0) {
        console.error('No tool calls in message:', message);
        throw new Error('No tool call in response');
      }

      const toolCall = message.tool_calls[0];
      console.log('Tool call:', JSON.stringify(toolCall, null, 2));

      if (!toolCall.function || !toolCall.function.arguments) {
        console.error('Invalid tool call structure:', toolCall);
        throw new Error('Invalid tool call structure');
      }

      parsedResponse = JSON.parse(toolCall.function.arguments);
      console.log('Successfully parsed suggestions:', JSON.stringify(parsedResponse, null, 2));

      // Validate parsed response has suggestions array
      if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions)) {
        console.error('Parsed response missing suggestions array:', parsedResponse);
        throw new Error('Invalid suggestions format');
      }

    } catch (e) {
      console.error('Failed to parse AI response:', e);
      console.error('Error details:', e instanceof Error ? e.message : String(e));
      throw new Error(`Invalid AI response format: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Store suggestions in database
    const suggestionPromises = parsedResponse.suggestions.map((s: any) =>
      supabase.from('ai_suggestions').insert({
        location,
        weather_condition: condition,
        temperature,
        suggestion_type: s.type || 'inspiration',
        suggestion_text: s.text,
        reasoning: s.reasoning,
      })
    );

    await Promise.all(suggestionPromises);
    console.log('Stored suggestions in database');

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
