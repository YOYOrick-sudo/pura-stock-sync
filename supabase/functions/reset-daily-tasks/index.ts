import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyTemplate {
  id: string;
  location: string;
  phase: string;
  title: string;
  priority: number;
  category: string;
  estimated_minutes: number | null;
  sort_order: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily task reset at', new Date().toISOString());

    // Get today's date in Amsterdam timezone
    const now = new Date();
    const amsterdamDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    const todayDate = amsterdamDate.toISOString().split('T')[0];
    const dayOfWeek = amsterdamDate.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday

    console.log('Today:', todayDate, 'Day of week:', dayOfWeek);

    // Step 1: Archive old tasks (due_date < today)
    const { error: archiveError, count: archivedCount } = await supabase
      .from('foh_tasks')
      .update({ archived: true })
      .lt('due_date', todayDate)
      .eq('archived', false);

    if (archiveError) {
      console.error('Error archiving old tasks:', archiveError);
      throw archiveError;
    }

    console.log(`Archived ${archivedCount || 0} old tasks`);

    // Step 2: Get all daily templates
    const { data: templates, error: templatesError } = await supabase
      .from('foh_daily_templates')
      .select('*')
      .eq('repeat_type', 'daily');

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      throw templatesError;
    }

    console.log(`Found ${templates?.length || 0} daily templates`);

    const locations = ['Midsland', 'West'];
    let totalGenerated = 0;

    for (const location of locations) {
      // Check if tasks already exist for this location and date
      const { data: existingTasks } = await supabase
        .from('foh_tasks')
        .select('id')
        .eq('location', location)
        .eq('due_date', todayDate)
        .eq('archived', false)
        .limit(1);

      if (existingTasks && existingTasks.length > 0) {
        console.log(`Tasks already exist for ${location} on ${todayDate}, skipping generation`);
        continue;
      }

      // Generate tasks for this location
      const locationTemplates = (templates || []).filter((t: DailyTemplate) => t.location === location);
      console.log(`Generating ${locationTemplates.length} tasks for ${location}`);

      const tasksToInsert = locationTemplates.map((template: DailyTemplate) => ({
        location: template.location,
        title: template.title,
        due_date: todayDate,
        priority: template.priority,
        category: template.category,
        phase: template.phase,
        completed: false,
        archived: false,
        template_id: template.id,
        estimated_minutes: template.estimated_minutes,
        sort_order: template.sort_order,
      }));

      if (tasksToInsert.length > 0) {
        const { error: insertError, count } = await supabase
          .from('foh_tasks')
          .insert(tasksToInsert);

        if (insertError) {
          console.error(`Error inserting tasks for ${location}:`, insertError);
          throw insertError;
        }

        totalGenerated += count || 0;
        console.log(`Generated ${count || 0} tasks for ${location}`);
      }
    }

    const result = {
      success: true,
      date: todayDate,
      archivedCount: archivedCount || 0,
      generatedCount: totalGenerated,
      timestamp: new Date().toISOString(),
    };

    console.log('Reset completed successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in reset-daily-tasks:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
