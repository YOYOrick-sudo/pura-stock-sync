import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders as baseCors } from 'npm:@supabase/supabase-js@2/cors'

const corsHeaders = {
  ...baseCors,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-bridge-token',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const expected = Deno.env.get('PRINT_BRIDGE_TOKEN') ?? ''
  const provided = req.headers.get('x-bridge-token') ?? ''
  if (!expected || !provided || !timingSafeEqual(expected, provided)) {
    return json({ error: 'unauthorized' }, 401)
  }
  if (!expected || !provided || !timingSafeEqual(expected, provided)) {
    return json({ error: 'unauthorized' }, 401)
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const action = body?.action

  if (action === 'claim') {
    const { data, error } = await supabase.rpc('claim_next_print_job')
    if (error) return json({ error: error.message }, 500)
    const row = Array.isArray(data) && data.length > 0 ? data[0] : null
    return json({
      job: row
        ? { id: row.id, zpl: row.zpl, label_omschrijving: row.label_omschrijving }
        : null,
    })
  }

  if (action === 'complete') {
    const id = body?.id
    const success = body?.success
    if (typeof id !== 'string' || typeof success !== 'boolean') {
      return json({ error: 'invalid_body' }, 400)
    }

    const patch = success
      ? { status: 'done', geprint_op: new Date().toISOString(), foutmelding: null }
      : { status: 'error', foutmelding: typeof body?.error === 'string' ? body.error : 'unknown' }

    const { data, error } = await supabase
      .from('print_jobs')
      .update(patch)
      .eq('id', id)
      .eq('status', 'printing')
      .select('id')
      .maybeSingle()

    if (error) return json({ error: error.message }, 500)
    if (!data) return json({ error: 'not_printing_or_not_found' }, 409)
    return json({ ok: true, id: data.id })
  }

  return json({ error: 'unknown_action' }, 400)
})
