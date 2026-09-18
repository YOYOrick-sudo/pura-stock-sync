import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

/** Vaste ontvangers van een nieuw idee uit de Ideeënbus. */
const ONTVANGERS = [
  'josefien@puravidafoodbar.nl',
  'jorian@puravidafoodbar.nl',
  'yorick@puravidafoodbar.nl',
]

const TEMPLATE = 'idea-box-notification'

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
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing required environment variables')
    return json({ error: 'Server configuration error' }, 500)
  }

  let ideaText = ''
  let location = ''
  try {
    const body = await req.json()
    ideaText = typeof body.ideaText === 'string' ? body.ideaText.trim() : ''
    location = typeof body.location === 'string' ? body.location.trim() : ''
  } catch {
    return json({ error: 'Invalid JSON in request body' }, 400)
  }

  if (ideaText.length < 2 || ideaText.length > 500) {
    return json({ error: 'Idee moet tussen 2 en 500 tekens zijn' }, 400)
  }
  if (!location) {
    return json({ error: 'Vestiging ontbreekt' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const submissionId = crypto.randomUUID()
  const { error: insertError } = await supabase
    .from('idea_box_submissions')
    .insert({ id: submissionId, idea_text: ideaText, location })

  if (insertError) {
    console.error('Failed to store idea', { error: insertError })
    return json({ error: 'Opslaan mislukt' }, 500)
  }

  // Elk MT-lid krijgt zijn eigen bericht over dit ene idee.
  let verstuurd = 0
  let mislukt = 0

  for (const adres of ONTVANGERS) {
    try {
      const result = await sendTemplateEmail(TEMPLATE, adres, {
        templateData: { ideaText, location },
        idempotencyKey: `idea-${submissionId}-${adres}`,
      })

      if (result.sent) {
        verstuurd++
        const { error } = await supabase.from('email_send_log').insert({
          template_name: TEMPLATE,
          recipient_email: adres,
          status: 'sent',
        })
        if (error) console.error('Failed to log sent email', { error })
      } else {
        const { error } = await supabase.from('email_send_log').insert({
          template_name: TEMPLATE,
          recipient_email: adres,
          status: 'suppressed',
        })
        if (error) console.error('Failed to log suppressed email', { error })
      }
    } catch (error) {
      mislukt++
      const message = error instanceof Error ? error.message : String(error)
      console.error('Idea notification send failed', { message })
      const { error: logError } = await supabase.from('email_send_log').insert({
        template_name: TEMPLATE,
        recipient_email: adres,
        status: 'failed',
        error_message: message.slice(0, 1000),
      })
      if (logError) console.error('Failed to log failed email', { error: logError })
    }
  }

  return json({ success: true, verstuurd, mislukt, ontvangers: ONTVANGERS.length })
})
