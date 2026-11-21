// Ontvangfunctie voor Eilandbezorger. Alleen aanleveren, ophaaltijd wijzigen en status opvragen.
// Eén sleutel (EILANDBEZORGER_SLEUTEL) in kop x-eilandbezorger-sleutel. Elke aanroep vermeldt verplicht
// modus test|live; de modus wordt bij ontvangst onveranderlijk vastgelegd. Test gaat nooit naar Lightspeed.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { BestellingSchema, OphaaltijdSchema, VESTIGING_PER_MERCHANT, beginStatus, controleer, gelijkeSleutel, orderbericht, vingerafdruk } from '../_shared/eilandbezorgerLogica.ts';
import { meld, verzend } from '../_shared/eilandbezorgerVerzend.ts';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, x-eilandbezorger-sleutel', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

function antwoord(r: any) {
  return { bestelnummer: r.extern_id, vestiging: r.merchant_id, modus: r.modus, status: r.status, reden: r.reden ?? null, referentie: r.referentie, ophaaltijd: r.ophaaltijd, bijgewerkt_op: r.updated_at };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = Deno.env.get('SUPABASE_URL'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !service) return json({ fout: 'serverconfiguratie ontbreekt' }, 500);
  const sleutel = req.headers.get('x-eilandbezorger-sleutel') ?? '';
  if (!gelijkeSleutel(sleutel, Deno.env.get('EILANDBEZORGER_SLEUTEL') ?? '')) return json({ fout: 'sleutel ongeldig' }, 401);
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    if (req.method === 'GET') {
      const u = new URL(req.url);
      const merchant = u.searchParams.get('vestiging') ?? '', nr = u.searchParams.get('bestelnummer') ?? '', modus = u.searchParams.get('modus') ?? '';
      if (!VESTIGING_PER_MERCHANT[merchant] || !nr || !['test', 'live'].includes(modus)) return json({ fout: 'vestiging, bestelnummer en modus (test|live) verplicht' }, 400);
      const { data } = await admin.from('externe_bestellingen').select('*').eq('bron', 'eilandbezorger').eq('modus', modus).eq('merchant_id', merchant).eq('extern_id', nr).maybeSingle();
      return data ? json(antwoord(data)) : json({ fout: 'onbekend' }, 404);
    }
    if (req.method !== 'POST') return json({ fout: 'methode niet toegestaan' }, 405);
    let ruw: any; try { ruw = await req.json(); } catch { return json({ fout: 'geen geldige JSON' }, 400); }

    if (ruw?.actie === 'ophaaltijd') {
      const p = OphaaltijdSchema.safeParse(ruw);
      if (!p.success) return json({ fout: 'ongeldig', velden: p.error.flatten().fieldErrors }, 400);
      const modus = p.data.modus;
      const { data: r } = await admin.from('externe_bestellingen').select('*').eq('bron', 'eilandbezorger').eq('modus', modus).eq('merchant_id', p.data.vestiging).eq('extern_id', p.data.bestelnummer).maybeSingle();
      if (!r) return json({ fout: 'onbekend' }, 404);
      const magWijzigen = ['gepland', 'geblokkeerd', 'test_ok', 'afgekeurd'];
      if (!magWijzigen.includes(r.status)) {
        await meld(admin, r.vestiging, 'Eilandbezorger: tijd gewijzigd na verzending', `${r.extern_id}: pas de tijd handmatig aan in de kassa`);
        return json({ fout: 'al naar de kassa; wijzig telefonisch', ...antwoord(r) }, 409);
      }
      const { data: nieuw } = await admin.from('externe_bestellingen').update({ ophaaltijd: p.data.ophaaltijd, bezorgtijd: p.data.bezorgtijd ?? r.bezorgtijd, versie: r.versie + 1, updated_at: new Date().toISOString(),
        orderbericht: r.orderbericht ? { ...r.orderbericht, deliveryDate: p.data.ophaaltijd } : null })
        .eq('id', r.id).eq('versie', r.versie).in('status', magWijzigen).select('*').maybeSingle();
      if (!nieuw) return json({ fout: 'tegelijk gewijzigd, probeer opnieuw' }, 409);
      await admin.from('externe_bestelling_log').insert({ bestelling_id: r.id, van_status: r.status, naar_status: r.status, reden: `Ophaaltijd gewijzigd naar ${p.data.ophaaltijd}` });
      return json(antwoord(nieuw));
    }

    const p = BestellingSchema.safeParse(ruw);
    if (!p.success) return json({ fout: 'ongeldig', velden: p.error.flatten().fieldErrors }, 400);
    const b = p.data;
    const modus = b.modus;
    const vestiging = VESTIGING_PER_MERCHANT[b.vestiging];
    const vinger = await vingerafdruk(b);

    const bestaand = async () => (await admin.from('externe_bestellingen').select('*').eq('bron', 'eilandbezorger').eq('modus', modus).eq('merchant_id', b.vestiging).eq('extern_id', b.bestelnummer).maybeSingle()).data;
    const herhaling = (r: any) => (r.vingerafdruk === vinger && new Date(r.ophaaltijd).getTime() === new Date(b.ophaaltijd).getTime())
      ? json(antwoord(r), 200)
      : json({ fout: 'bestelnummer bestaat al met andere inhoud; wijzigingen via afgesproken procedure', ...antwoord(r) }, 409);
    const oud = await bestaand(); if (oud) return herhaling(oud);

    const [{ data: kop }, { data: cfg }, { data: vlag }, { data: conn }] = await Promise.all([
      admin.from('externe_product_koppeling').select('*').eq('vestiging', vestiging),
      admin.from('externe_kassa_config').select('*').eq('vestiging', vestiging).maybeSingle(),
      admin.from('fase2_vlag').select('aan').eq('vestiging', vestiging).eq('vlag', 'eilandbezorger_live').maybeSingle(),
      admin.from('lightspeed_connections').select('status').eq('merchant_id', b.vestiging).maybeSingle(),
    ]);
    const c = controleer(b, (kop ?? []) as any);
    const referentie = `EB-${modus === 'test' ? 'T' : 'L'}-${b.vestiging}-${b.bestelnummer}`.slice(0, 100);
    let status: string, reden: string | undefined;
    if (!conn || !['gekoppeld', 'token_verlopen'].includes(conn.status)) { status = 'afgekeurd'; reden = 'Vestiging heeft geen actieve kassakoppeling.'; }
    else if (!c.ok) { status = 'afgekeurd'; reden = c.reden; }
    else ({ status, reden } = beginStatus({ modus, liveAan: vlag?.aan === true, configCompleet: !!cfg?.lightspeed_klant_id && !!cfg?.lightspeed_betaalwijze_id && !!cfg?.lightspeed_betaalwijze_type_id && (cfg?.order_route !== 'establishment_order' || !!cfg?.lightspeed_company_id), ophaaltijd: b.ophaaltijd, nu: Date.now(), vensterMin: cfg?.venster_minuten ?? 45 }));

    const regels = c.ok ? c.regels : null;
    const { data: rij, error } = await admin.from('externe_bestellingen').insert({
      modus, vestiging, merchant_id: b.vestiging, extern_id: b.bestelnummer, referentie, vingerafdruk: vinger,
      status: status === 'verzenden' ? 'ontvangen' : status, reden: reden ?? null, ophaaltijd: b.ophaaltijd, bezorgtijd: b.bezorgtijd ?? null,
      restaurant_cent: b.bedragen.restaurant_cent, bezorgkosten_cent: b.bedragen.bezorgkosten_cent, fooi_cent: b.bedragen.fooi_cent, korting: b.bedragen.korting ?? null,
      invoer: ruw, regels,
      orderbericht: regels ? orderbericht({ referentie, ophaaltijd: b.ophaaltijd, klant: b.klant, opmerking: b.opmerking, regels, restaurant_cent: b.bedragen.restaurant_cent, betaalwijzeId: cfg?.lightspeed_betaalwijze_id ?? null, betaalwijzeTypeId: cfg?.lightspeed_betaalwijze_type_id ?? null, klantId: cfg?.lightspeed_klant_id ?? null, route: cfg?.order_route, companyId: cfg?.lightspeed_company_id ?? null }) : null,
    }).select('*').single();
    if (error) {
      if (error.code === '23505') { const r = await bestaand(); if (r) return herhaling(r); }
      console.error('eilandbezorger: opslaan mislukt', error.code);
      return json({ fout: 'opslaan mislukt' }, 500);
    }
    await admin.from('externe_bestelling_log').insert({ bestelling_id: rij.id, naar_status: rij.status, reden: rij.reden });
    if (rij.status === 'geblokkeerd') await meld(admin, vestiging, 'Eilandbezorger geblokkeerd', `${b.bestelnummer}: ${reden}`);

    let eind = rij;
    if (status === 'verzenden') {
      const { data: claim } = await admin.from('externe_bestellingen').update({ status: 'verzenden', versie: rij.versie + 1, updated_at: new Date().toISOString() }).eq('id', rij.id).eq('versie', rij.versie).eq('status', 'ontvangen').select('*').maybeSingle();
      if (claim) { await admin.from('externe_bestelling_log').insert({ bestelling_id: rij.id, van_status: 'ontvangen', naar_status: 'verzenden' }); eind = await verzend(admin, claim); }
    }
    return json(antwoord(eind), rij.status === 'afgekeurd' ? 422 : 201);
  } catch (e) {
    console.error('eilandbezorger: onverwacht', e instanceof Error ? e.name : 'fout');
    return json({ fout: 'interne fout' }, 500);
  }
});
