import { isProef } from './eilandbezorgerProef.ts';
import { planningBlokkade } from './eilandbezorgerPlanning.ts';
import { meld, overgang, verzend } from './eilandbezorgerVerzend.ts';

const vestiging = 'Midsland';

export async function ronde(admin: any) {
  const grens = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data: vast } = await admin.from('externe_bestellingen').select('id,versie,extern_id')
    .eq('vestiging', vestiging).eq('merchant_id', '36864').eq('modus', 'live').eq('bron', 'eilandbezorger')
    .eq('status', 'verzenden').lt('updated_at', grens).throwOnError();
  let vastgelopen = 0;
  for (const r of vast) {
    const x = await overgang(admin, r.id, r.versie, ['verzenden'], 'uitkomst_onbekend', {}, 'Verzending bleef hangen');
    if (x) {
      vastgelopen++;
      await meld(admin, vestiging, 'Eilandbezorger vastgelopen', `${r.extern_id}: controleer de kassa`);
    }
  }

  const { data: vlag } = await admin.from('fase2_vlag').select('aan,gewijzigd_op')
    .eq('vestiging', vestiging).eq('vlag', 'eilandbezorger_live').maybeSingle().throwOnError();
  let verstuurd = 0, geblokkeerd = 0;
  if (!vlag?.aan) return { vastgelopen, verstuurd, geblokkeerd };
  const { data: cfg } = await admin.from('externe_kassa_config').select('venster_minuten')
    .eq('vestiging', vestiging).eq('merchant_id', '36864').single().throwOnError();
  const tot = new Date(Date.now() + cfg.venster_minuten * 60_000).toISOString();
  const { data: klaar } = await admin.from('externe_bestellingen').select('*')
    .eq('vestiging', vestiging).eq('merchant_id', '36864').eq('modus', 'live').eq('bron', 'eilandbezorger')
    .eq('status', 'gepland').lte('ophaaltijd', tot).order('ophaaltijd').throwOnError();
  for (const r of klaar) {
    if (isProef(r)) continue;
    const { data: poging } = await admin.from('externe_bestelling_poging').select('id')
      .eq('bestelling_id', r.id).eq('soort', 'verzenden').limit(1).maybeSingle().throwOnError();
    let reden = planningBlokkade(r, Date.now());
    if (poging) {
      reden = 'Er staat al een verzendpoging geregistreerd. Controleer eerst de kassa.';
    } else if (!reden && Date.parse(r.created_at) < Date.parse(vlag.gewijzigd_op)) {
      // Een wijziging van alleen de ophaaltijd mag een oude wachtrij niet vrijgeven.
      const { data: vrijgave } = await admin.from('externe_bestelling_log').select('bestelling_id')
        .eq('bestelling_id', r.id).eq('van_status', 'geblokkeerd').eq('naar_status', 'gepland')
        .not('door', 'is', null).gte('created_at', vlag.gewijzigd_op).limit(1).maybeSingle().throwOnError();
      if (!vrijgave) reden = 'Deze planning hoort bij een eerdere liveperiode. Geef de bestelling handmatig vrij.';
    }
    if (reden) {
      const status = poging ? 'uitkomst_onbekend' : 'geblokkeerd';
      if (await overgang(admin, r.id, r.versie, ['gepland'], status, {}, reden)) {
        geblokkeerd++;
        await meld(admin, vestiging, 'Eilandbezorger vraagt aandacht', `${r.extern_id}: ${reden}`);
      }
      continue;
    }
    const claim = await overgang(admin, r.id, r.versie, ['gepland'], 'verzenden', {});
    if (claim) {
      const uitkomst = await verzend(admin, claim, fetch, undefined, vlag.gewijzigd_op);
      if (uitkomst.status === 'verzonden') verstuurd++;
      if (uitkomst.status === 'geblokkeerd') geblokkeerd++;
    }
  }
  return { vastgelopen, verstuurd, geblokkeerd };
}
