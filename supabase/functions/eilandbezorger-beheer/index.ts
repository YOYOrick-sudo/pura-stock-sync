// Beheeracties voor Eilandbezorger-bestellingen. Alleen ingelogde managers (eigen vestiging) en eigenaren;
// de ronde alleen via service role of CRON_SYNC_TOKEN. Karins sleutels werken hier niet.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';
import { kassaBlokkade, orderbericht } from '../_shared/eilandbezorgerLogica.ts';
import { actuelePrijsRegels, KASSA_SCHEMA } from '../_shared/eilandbezorgerPrijzen.ts';
import { geldigToken } from '../_shared/lightspeedToken.ts';
import { meld, overgang, teruglezen, verzend } from '../_shared/eilandbezorgerVerzend.ts';
import { EERSTE_PROEF, TWEEDE_PROEF, DERDE_PROEF, VIERDE_PROEF, VIJFDE_PROEF, ZESDE_PROEF, ZEVENDE_PROEF, FRIET_PROEF, isProef, PROEF_REFERENTIE } from '../_shared/eilandbezorgerProef.ts';
import { gingerBeerProef, hervatGingerBeerProef } from './proef.ts';
import { kassaInspectie } from './inspectie.ts';

const functieHeaders = { ...corsHeaders, 'X-Pura-Kassa-Schema': KASSA_SCHEMA };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...functieHeaders, 'Content-Type': 'application/json' } });
const Schema = z.discriminatedUnion('actie', [
  z.object({ actie: z.literal('ginger_beer_proef'), referentie: z.literal(PROEF_REFERENTIE), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('ginger_beer_proef_gb02'), referentie: z.literal(TWEEDE_PROEF.referentie), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('ginger_beer_proef_gb03'), referentie: z.literal(DERDE_PROEF.referentie), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('ginger_beer_proef_gb04'), referentie: z.literal(VIERDE_PROEF.referentie), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('ginger_beer_proef_gb05'), referentie: z.literal(VIJFDE_PROEF.referentie), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('ginger_beer_proef_gb06'), referentie: z.literal(ZESDE_PROEF.referentie), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('ginger_beer_proef_gb07'), referentie: z.literal(ZEVENDE_PROEF.referentie), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('print_proef_fr01'), referentie: z.literal(FRIET_PROEF.referentie), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('ginger_beer_proef_hervatten'), referentie: z.literal(PROEF_REFERENTIE), bevestiging: z.literal(true) }).strict(),
  z.object({ actie: z.literal('annuleren'), id: z.string().uuid(), reden: z.string().trim().min(3).max(300) }),
  z.object({ actie: z.literal('vrijgeven'), id: z.string().uuid(), tijd_voorbij_akkoord: z.boolean().optional() }),
  z.object({ actie: z.literal('teruglezen'), id: z.string().uuid() }),
  z.object({ actie: z.literal('herverzenden'), id: z.string().uuid(), bevestiging: z.literal(true), reden: z.string().trim().min(10).max(300) }),
  z.object({ actie: z.literal('in_kassa'), id: z.string().uuid(), reden: z.string().trim().min(3).max(300) }),
  z.object({ actie: z.literal('live'), vestiging: z.enum(['Midsland']), aan: z.boolean() }),
  z.object({ actie: z.literal('ronde') }),
  z.object({ actie: z.literal('kassa_instellingen'), alleen_betaalwijzen: z.boolean().optional() }),
  z.object({ actie: z.literal('kaart'), bron: z.enum(['product', 'productgroup', 'modifierClass', 'modifier']), prijscontrole: z.literal(true).optional() }),
  z.object({ actie: z.literal('kassa_inspectie'), soort: z.enum(['kaart', 'orders', 'bon', 'order']), order_ids: z.array(z.string().regex(/^[1-9][0-9]{0,11}$/)).min(1).max(10).optional(),
    product_ids: z.array(z.string().regex(/^[1-9][0-9]{0,9}$/)).min(1).max(20).optional(),
    datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), bon_id: z.number().int().positive().optional(),
    offset: z.number().int().min(0).max(20000).optional(), status: z.enum(['PAID', 'ACCEPTED', 'DONE', 'CANCELED']).optional() }).strict(),
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: functieHeaders });
  if (req.method !== 'POST') return json({ fout: 'alleen POST' }, 405);
  const url = Deno.env.get('SUPABASE_URL'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !service || !anon) return json({ fout: 'serverconfiguratie ontbreekt' }, 500);
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  let ruw: unknown; try { ruw = await req.json(); } catch { return json({ fout: 'geen geldige JSON' }, 400); }
  const p = Schema.safeParse(ruw);
  if (!p.success) return json({ fout: 'ongeldig', velden: p.error.flatten().fieldErrors }, 400);
  const a = p.data;
  if (a.actie === 'kassa_inspectie' && ((a.soort === 'kaart' && !a.product_ids) || (a.soort === 'order' && !a.order_ids) || (a.soort === 'bon' && (!a.datum || !a.bon_id)))) {
    return json({ fout: 'ongeldig', velden: { kassa_inspectie: ['kaart vraagt product_ids; bon vraagt datum en bon_id'] } }, 400);
  }
  const auth = req.headers.get('Authorization') ?? '';
  const cron = Deno.env.get('CRON_SYNC_TOKEN') ?? '';

  try {
    if (a.actie === 'ronde') {
      const ok = auth === `Bearer ${service}` || (cron.length > 0 && req.headers.get('x-sync-token') === cron);
      if (!ok) return json({ fout: 'niet toegestaan' }, 401);
      return json(await ronde(admin));
    }
    // Alleen-lezen kassabewijs: eigenaar, of de server-side cron-sleutel voor geautoriseerde nacontrole.
    if (a.actie === 'kassa_inspectie' && cron.length > 0 && req.headers.get('x-sync-token') === cron) {
      return json(await kassaInspectie(admin, a));
    }
    if (!auth.startsWith('Bearer ')) return json({ fout: 'niet ingelogd' }, 401);
    const { data: u } = await createClient(url, anon, { global: { headers: { Authorization: auth } } }).auth.getUser();
    if (!u?.user) return json({ fout: 'niet ingelogd' }, 401);
    const { data: rollen } = await admin.from('user_roles').select('role, location').eq('user_id', u.user.id).eq('is_active', true);
    const eigenaar = (rollen ?? []).some((r: any) => ['owner', 'admin'].includes(r.role));
    const magVestiging = (v: string) => eigenaar || (rollen ?? []).some((r: any) => r.role === 'manager' && r.location === v);

    if (a.actie === 'print_proef_fr01' || a.actie === 'ginger_beer_proef' || a.actie === 'ginger_beer_proef_gb02' || a.actie === 'ginger_beer_proef_gb03' || a.actie === 'ginger_beer_proef_gb07' || a.actie === 'ginger_beer_proef_gb06' || a.actie === 'ginger_beer_proef_gb05' || a.actie === 'ginger_beer_proef_gb04' || a.actie === 'ginger_beer_proef_hervatten') {
      if (!eigenaar) return json({ fout: 'alleen eigenaar' }, 403);
      const proef = a.actie === 'print_proef_fr01' ? FRIET_PROEF : a.actie === 'ginger_beer_proef_gb07' ? ZEVENDE_PROEF : a.actie === 'ginger_beer_proef_gb06' ? ZESDE_PROEF : a.actie === 'ginger_beer_proef_gb05' ? VIJFDE_PROEF : a.actie === 'ginger_beer_proef_gb04' ? VIERDE_PROEF : a.actie === 'ginger_beer_proef_gb03' ? DERDE_PROEF : a.actie === 'ginger_beer_proef_gb02' ? TWEEDE_PROEF : EERSTE_PROEF;
      const uit = a.actie === 'ginger_beer_proef_hervatten' ? await hervatGingerBeerProef(admin, u.user.id) : await gingerBeerProef(admin, u.user.id, proef);
      return json(uit, 'fout' in uit ? 409 : 200);
    }

    if (a.actie === 'kassa_instellingen') {
      if (!eigenaar) return json({ fout: 'alleen eigenaar' }, 403);
      return json(await kassaInstellingen(admin, a.alleen_betaalwijzen === true));
    }
    if (a.actie === 'kassa_inspectie') {
      if (!eigenaar) return json({ fout: 'alleen eigenaar' }, 403);
      return json(await kassaInspectie(admin, a));
    }
    if (a.actie === 'kaart') {
      if (!eigenaar) return json({ fout: 'alleen eigenaar' }, 403);
      if (a.prijscontrole) {
        if (a.bron !== 'product') return json({ fout: 'Prijscontrole vereist bron product.' }, 400);
        // Alleen-lezen bewijs door de echte shared writer; geen opslag, poging of order-POST.
        const prijzen = await actuelePrijsRegels(admin, 'Midsland', [{ lightspeed_product_id: '4636894', naam: 'Naturfrisk Ginger beer', aantal: 1, stukprijs_cent: 490, extras: [] }]);
        if ('fout' in prijzen) return json({ schema: KASSA_SCHEMA, fout: prijzen.fout }, 409);
        const voorbeeld = orderbericht({ referentie: 'BTW-VOORBEELD-GINGER', klant: { naam: 'Pura Test' }, opmerking: 'TEST – niet klaarmaken', ophaaltijd: new Date().toISOString(), regels: prijzen.regels, restaurant_cent: 490, betaalwijzeId: '285794', betaalwijzeTypeId: '4' });
        const p = prijzen.producten[0];
        return json({ schema: KASSA_SCHEMA, merchant_id: '36864', product: { id: p.id, deliveryPrice: p.deliveryPrice, deliveryPriceWithoutVat: p.deliveryPriceWithoutVat, deliveryTaxClass: p.deliveryTaxClass, takeawayPrice: p.takeawayPrice, takeawayPriceWithoutVat: p.takeawayPriceWithoutVat, takeawayTaxClass: p.takeawayTaxClass }, btw: prijzen.klassen.filter(k => k.id === p.deliveryTaxClass), orderItems: voorbeeld.orderItems, orderPayments: voorbeeld.orderPayments, alleen_lezen: true });
      }
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
    if (isProef(r) && ['vrijgeven', 'herverzenden'].includes(a.actie)) return json({ fout: 'Eenmalige proef: normale vrijgave en herverzending zijn uitgesloten.' }, 409);
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
