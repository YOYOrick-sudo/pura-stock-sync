// Beheeracties voor Eilandbezorger-bestellingen. Alleen ingelogde managers (eigen vestiging) en eigenaren;
// de ronde alleen via service role of CRON_SYNC_TOKEN. Karins sleutels werken hier niet.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';
import { kassaBlokkade } from '../_shared/eilandbezorgerLogica.ts';
import { geldigToken } from '../_shared/lightspeedToken.ts';
import { meld, overgang, teruglezen, verzend } from '../_shared/eilandbezorgerVerzend.ts';

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const Schema = z.discriminatedUnion('actie', [
  z.object({ actie: z.literal('annuleren'), id: z.string().uuid(), reden: z.string().trim().min(3).max(300) }),
  z.object({ actie: z.literal('vrijgeven'), id: z.string().uuid(), tijd_voorbij_akkoord: z.boolean().optional() }),
  z.object({ actie: z.literal('teruglezen'), id: z.string().uuid() }),
  z.object({ actie: z.literal('herverzenden'), id: z.string().uuid(), bevestiging: z.literal(true), reden: z.string().trim().min(10).max(300) }),
  z.object({ actie: z.literal('in_kassa'), id: z.string().uuid(), reden: z.string().trim().min(3).max(300) }),
  z.object({ actie: z.literal('live'), vestiging: z.enum(['Midsland']), aan: z.boolean() }),
  z.object({ actie: z.literal('ronde') }),
  z.object({ actie: z.literal('kassa_instellingen'), alleen_betaalwijzen: z.boolean().optional() }),
  z.object({ actie: z.literal('kaart'), bron: z.enum(['product', 'productgroup', 'modifierClass', 'modifier']) }),
]);

// Alleen-lezen: volledige Lightspeed-kaart Midsland ophalen, alle pagina's. Nooit schrijven.
async function kaart(admin: any, bron: string) {
  const t = await geldigToken(admin, 'Midsland');
  if ('error' in t) return { fout: t.error };
  const uit: unknown[] = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const r = await fetch(`https://lightspeedapis.com/resto/rest/inventory/${bron}?amount=100&offset=${offset}`, { method: 'GET', headers: { Authorization: `Bearer ${t.token}`, Accept: 'application/json' } });
    const tekst = await r.text();
    if (!r.ok) return { fout: `lightspeed ${r.status}`, detail: tekst.slice(0, 300), opgehaald: uit.length };
    const j = JSON.parse(tekst); const lijst = Array.isArray(j) ? j : (j.results ?? j.data ?? []);
    uit.push(...lijst);
    if (!Array.isArray(lijst) || lijst.length < 100) break;
  }
  return { aantal: uit.length, items: uit };
}

// Alleen-lezen: bedrijfsstructuur, klanten en betaalwijzen van Midsland. Nooit schrijven.
export async function kassaInstellingen(admin: any, alleenBetaalwijzen = false) {
  const t = await geldigToken(admin, 'Midsland');
  if ('error' in t) return { fout: t.error };
  let laatsteStatus: number | null = null;
  const lees = async (pad: string) => {
    const r = await fetch(`https://lightspeedapis.com/resto${pad}`, { method: 'GET', headers: { Authorization: `Bearer ${t.token}`, Accept: 'application/json' } });
    laatsteStatus = r.status;
    const tekst = await r.text();
    if (!r.ok) return { fout: `lightspeed ${r.status}`, http_status: r.status, retry_after: r.headers.get('Retry-After'), detail: tekst.slice(0, 300) };
    try { return JSON.parse(tekst); } catch { return { fout: 'geen JSON' }; }
  };
  const betaalwijzen = await lees('/rest/onlineordering/paymenttype');
  if (alleenBetaalwijzen) return { merchant_id: '36864', bron: 'https://lightspeedapis.com/resto/rest/onlineordering/paymenttype', http_status: laatsteStatus, betaalwijzen };
  const klanten: any[] = [];
  for (let offset = 0; offset < 3000; offset += 100) {
    const j: any = await lees(`/rest/core/customer?amount=100&offset=${offset}`);
    if (j?.fout) { klanten.push(j); break; }
    const l = j.results ?? []; klanten.push(...l.filter((k: any) => JSON.stringify([k.firstName, k.lastName, k.companyName]).toLowerCase().includes('eiland')).map((k: any) => ({ id: k.id, voornaam: k.firstName, achternaam: k.lastName, bedrijf: k.companyName, companyId: k.companyId })));
    if (l.length < 100) break;
  }
  return { company: await lees('/rest/core/company'), establishment: await lees('/rest/core/establishment'), betaalwijzen, eilandbezorgerKlanten: klanten };
}

async function claimVerzend(admin: any, r: any, van: string[], door?: string) {
  const c = await overgang(admin, r.id, r.versie, van, 'verzenden', {}, undefined, door);
  return c ? await verzend(admin, c) : null;
}

async function ronde(admin: any) {
  const grens = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data: vast } = await admin.from('externe_bestellingen').select('*').eq('status', 'verzenden').lt('updated_at', grens);
  for (const r of vast ?? []) {
    const x = await overgang(admin, r.id, r.versie, ['verzenden'], 'uitkomst_onbekend', {}, 'Verzending bleef hangen');
    if (x) await meld(admin, r.vestiging, 'Eilandbezorger vastgelopen', `${r.extern_id}: controleer de kassa`);
  }
  const { data: cfgs } = await admin.from('externe_kassa_config').select('vestiging, venster_minuten');
  const { data: vlaggen } = await admin.from('fase2_vlag').select('vestiging, aan').eq('vlag', 'eilandbezorger_live');
  let verstuurd = 0;
  for (const c of cfgs ?? []) {
    if (!(vlaggen ?? []).some((v: any) => v.vestiging === c.vestiging && v.aan)) continue;
    const tot = new Date(Date.now() + c.venster_minuten * 60_000).toISOString();
    const { data: klaar } = await admin.from('externe_bestellingen').select('*').eq('vestiging', c.vestiging).eq('modus', 'live').eq('status', 'gepland').lte('ophaaltijd', tot);
    for (const r of klaar ?? []) if (await claimVerzend(admin, r, ['gepland'])) verstuurd++;
  }
  return { vastgelopen: (vast ?? []).length, verstuurd };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ fout: 'alleen POST' }, 405);
  const url = Deno.env.get('SUPABASE_URL'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !service || !anon) return json({ fout: 'serverconfiguratie ontbreekt' }, 500);
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  let ruw: unknown; try { ruw = await req.json(); } catch { return json({ fout: 'geen geldige JSON' }, 400); }
  const p = Schema.safeParse(ruw);
  if (!p.success) return json({ fout: 'ongeldig', velden: p.error.flatten().fieldErrors }, 400);
  const a = p.data;
  const auth = req.headers.get('Authorization') ?? '';
  const cron = Deno.env.get('CRON_SYNC_TOKEN') ?? '';

  try {
    if (a.actie === 'ronde') {
      const ok = auth === `Bearer ${service}` || (cron.length > 0 && req.headers.get('x-sync-token') === cron);
      if (!ok) return json({ fout: 'niet toegestaan' }, 401);
      return json(await ronde(admin));
    }
    if (!auth.startsWith('Bearer ')) return json({ fout: 'niet ingelogd' }, 401);
    const { data: u } = await createClient(url, anon, { global: { headers: { Authorization: auth } } }).auth.getUser();
    if (!u?.user) return json({ fout: 'niet ingelogd' }, 401);
    const { data: rollen } = await admin.from('user_roles').select('role, location').eq('user_id', u.user.id).eq('is_active', true);
    const eigenaar = (rollen ?? []).some((r: any) => ['owner', 'admin'].includes(r.role));
    const magVestiging = (v: string) => eigenaar || (rollen ?? []).some((r: any) => r.role === 'manager' && r.location === v);

    if (a.actie === 'kassa_instellingen') {
      if (!eigenaar) return json({ fout: 'alleen eigenaar' }, 403);
      return json(await kassaInstellingen(admin, a.alleen_betaalwijzen === true));
    }
    if (a.actie === 'kaart') {
      if (!eigenaar) return json({ fout: 'alleen eigenaar' }, 403);
      return json(await kaart(admin, a.bron));
    }
    if (a.actie === 'live') {
      if (!eigenaar) return json({ fout: 'alleen eigenaar' }, 403);
      // Aanzetten verstuurt niets automatisch: geblokkeerde bestellingen blijven staan tot vrijgave.
      const { error } = await admin.from('fase2_vlag').update({ aan: a.aan, gewijzigd_op: new Date().toISOString(), gewijzigd_door: u.user.id }).eq('vestiging', a.vestiging).eq('vlag', 'eilandbezorger_live');
      return error ? json({ fout: 'opslaan mislukt' }, 500) : json({ vestiging: a.vestiging, aan: a.aan });
    }

    const { data: r } = await admin.from('externe_bestellingen').select('*').eq('id', a.id).maybeSingle();
    if (!r) return json({ fout: 'onbekend' }, 404);
    if (!magVestiging(r.vestiging)) return json({ fout: 'geen toegang' }, 403);
    const door = u.user.id;

    if (a.actie === 'annuleren') {
      const x = await overgang(admin, r.id, r.versie, ['ontvangen', 'gepland', 'geblokkeerd', 'afgekeurd', 'test_ok', 'ter_beoordeling'], 'geannuleerd', {}, a.reden, door);
      return x ? json({ status: x.status }) : json({ fout: 'kan niet (meer) annuleren', status: r.status }, 409);
    }
    if (a.actie === 'vrijgeven') {
      if (r.modus !== 'live' || r.status !== 'geblokkeerd') return json({ fout: 'alleen geblokkeerde live-bestellingen' }, 409);
      const { data: vlag } = await admin.from('fase2_vlag').select('aan').eq('vestiging', r.vestiging).eq('vlag', 'eilandbezorger_live').maybeSingle();
      if (!vlag?.aan) return json({ fout: 'live staat uit' }, 409);
      const { data: cfg } = await admin.from('externe_kassa_config').select('*').eq('vestiging', r.vestiging).maybeSingle();
      const blokkade = kassaBlokkade(cfg);
      if (blokkade) return json({ fout: blokkade }, 409);
      if (new Date(r.ophaaltijd).getTime() < Date.now() && !a.tijd_voorbij_akkoord) return json({ fout: 'ophaaltijd is voorbij; bevestig bewust', tijd_voorbij: true }, 409);
      const verder = new Date(r.ophaaltijd).getTime() - Date.now() > cfg.venster_minuten * 60_000;
      if (verder) { const x = await overgang(admin, r.id, r.versie, ['geblokkeerd'], 'gepland', {}, 'Vrijgegeven, wacht op venster', door); return x ? json({ status: x.status }) : json({ fout: 'tegelijk gewijzigd' }, 409); }
      const x = await claimVerzend(admin, r, ['geblokkeerd'], door);
      return x ? json({ status: x.status }) : json({ fout: 'tegelijk gewijzigd' }, 409);
    }
    if (a.actie === 'teruglezen') {
      if (r.status !== 'uitkomst_onbekend') return json({ fout: 'alleen bij onzekere uitkomst' }, 409);
      return json({ resultaat: await teruglezen(admin, r) });
    }
    if (a.actie === 'in_kassa') {
      const x = await overgang(admin, r.id, r.versie, ['uitkomst_onbekend'], 'verzonden', {}, `Handmatig: staat in kassa. ${a.reden}`, door);
      return x ? json({ status: x.status }) : json({ fout: 'kan niet', status: r.status }, 409);
    }
    // herverzenden
    if (r.modus !== 'live') return json({ fout: 'testbestellingen gaan nooit naar de kassa' }, 409);
    if (!['geweigerd', 'uitkomst_onbekend'].includes(r.status)) return json({ fout: 'kan niet', status: r.status }, 409);
    if (r.status === 'uitkomst_onbekend') {
      const { data: pg } = await admin.from('externe_bestelling_poging').select('soort, uitkomst, gestart_op').eq('bestelling_id', r.id).order('gestart_op', { ascending: false }).limit(1);
      const laatste = pg?.[0];
      if (!laatste || laatste.soort !== 'teruglezen' || !['niet_gevonden', 'geen_id'].includes(laatste.uitkomst)) return json({ fout: 'eerst teruglezen' }, 409);
    }
    const { data: vlag } = await admin.from('fase2_vlag').select('aan').eq('vestiging', r.vestiging).eq('vlag', 'eilandbezorger_live').maybeSingle();
    if (!vlag?.aan) return json({ fout: 'live staat uit' }, 409);
    await admin.from('externe_bestelling_log').insert({ bestelling_id: r.id, van_status: r.status, naar_status: r.status, reden: `Herverzenden bevestigd: ${a.reden}`, door });
    const x = await claimVerzend(admin, r, ['geweigerd', 'uitkomst_onbekend'], door);
    return x ? json({ status: x.status }) : json({ fout: 'tegelijk gewijzigd' }, 409);
  } catch (e) {
    console.error('eilandbezorger-beheer: onverwacht', e instanceof Error ? e.name : 'fout');
    return json({ fout: 'interne fout' }, 500);
  }
});
