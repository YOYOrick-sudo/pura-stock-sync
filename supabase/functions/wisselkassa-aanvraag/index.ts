import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

/** Vaste ontvangers van de wisselkassa-aanvraag. */
const ONTVANGERS = ['helga@puravidafoodbar.nl', 'yorick@puravidafoodbar.nl']

const TEMPLATE = 'wisselkassa-aanvraag'

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceKey || !anonKey) {
    console.error('Missing required environment variables')
    return json({ error: 'Server configuration error' }, 500)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await authClient.auth.getUser()
  const user = userData?.user ?? null

  let vestiging = ''
  let aanvrager = ''
  let tijdstip = ''
  try {
    const body = await req.json()
    vestiging = typeof body.vestiging === 'string' ? body.vestiging.trim() : ''
    aanvrager = typeof body.aanvrager === 'string' ? body.aanvrager.trim() : ''
    tijdstip = typeof body.tijdstip === 'string' ? body.tijdstip.trim() : ''
  } catch {
    return json({ error: 'Invalid JSON in request body' }, 400)
  }

  if (!vestiging || aanvrager.length < 2) {
    return json({ error: 'Vestiging en naam zijn verplicht' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const aanvraagId = crypto.randomUUID()
  const { error: insertError } = await supabase
    .from('wisselkassa_aanvragen')
    .insert({
      id: aanvraagId,
      vestiging,
      aangevraagd_door: user?.id ?? null,
      aangevraagd_door_naam: aanvrager,
    })

  if (insertError) {
    console.error('Failed to store wisselkassa request', { error: insertError })
    return json({ error: 'Opslaan mislukt' }, 500)
  }

  const templateData = { vestiging, aanvrager, tijdstip }
  let mislukt = 0

  for (const adres of ONTVANGERS) {
    try {
      const result = await sendTemplateEmail(TEMPLATE, adres, {
        templateData,
        idempotencyKey: `wisselkassa-${aanvraagId}-${adres}`,
      })

      const { error } = await supabase.from('email_send_log').insert({
        template_name: TEMPLATE,
        recipient_email: adres,
        status: result.sent ? 'sent' : 'suppressed',
      })
      if (error) console.error('Failed to log email result', { error })
    } catch (error) {
      mislukt++
      const message = error instanceof Error ? error.message : String(error)
      console.error('Wisselkassa notification send failed', { message })
      const { error: logError } = await supabase.from('email_send_log').insert({
        template_name: TEMPLATE,
        recipient_email: adres,
        status: 'failed',
        error_message: message.slice(0, 1000),
      })
      if (logError) console.error('Failed to log failed email', { error: logError })
    }
  }

  if (mislukt === ONTVANGERS.length) {
    return json({ error: 'Versturen mislukt' }, 500)
  }

  return json({ success: true, mislukt })
})
