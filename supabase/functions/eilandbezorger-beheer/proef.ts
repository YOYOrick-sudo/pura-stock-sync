import { proefControle, PROEF_ORDER_ID, PROEF_REFERENTIE, PROEF_VRIJGAVE } from '../_shared/eilandbezorgerProef.ts';
import { vingerafdruk } from '../_shared/eilandbezorgerLogica.ts';
import { overgang, verzend } from '../_shared/eilandbezorgerVerzend.ts';

/** Alleen na de bestaande auth.getUser + actieve eigenaarscontrole. Nooit bestaande rijen vrijgeven. */
export async function gingerBeerProef(admin: any, eigenaarId: string) {
  const c = await proefControle(admin, Date.now());
  if ('fout' in c) return { fout: c.fout };
  const bestaand = await admin.from('externe_bestellingen').select('id, modus, status, referentie').eq('merchant_id', '36864').eq('extern_id', PROEF_REFERENTIE);
  if (bestaand.error) return { fout: 'Bestaande proef kon niet veilig worden gecontroleerd.' };
  if (bestaand.data?.length) return { fout: 'Proef bestaat al; geen nieuwe verzending of testconversie.', bestelling: bestaand.data };
  const { data: rij, error } = await admin.from('externe_bestellingen').insert({
    id: PROEF_ORDER_ID, modus: 'live', vestiging: 'Midsland', merchant_id: '36864', extern_id: PROEF_REFERENTIE,
    referentie: PROEF_REFERENTIE, vingerafdruk: await vingerafdruk(c.b), status: 'ontvangen',
    reden: 'Eenmalige fysieke owner-proef; gewone liveverzending blijft uit.', vrijgegeven_door: eigenaarId,
    ophaaltijd: c.b.ophaaltijd, restaurant_cent: 490, bezorgkosten_cent: 0, fooi_cent: 0, korting: null,
    invoer: c.b, regels: c.regels,
  }).select('*').single();
  if (error || !rij) return { fout: error?.code === '23505' ? 'Proef is al geclaimd; geen tweede verzending.' : 'Proef opslaan mislukt; niets verzonden.' };
  const log = await admin.from('externe_bestelling_log').insert({ bestelling_id: rij.id, naar_status: 'ontvangen', reden: rij.reden, door: eigenaarId });
  if (log.error) return { fout: 'Auditregistratie mislukt; proef blijft ongezonden.' };
  const claim = await overgang(admin, rij.id, rij.versie, ['ontvangen'], 'verzenden', {}, rij.reden, eigenaarId);
  if (!claim) return { fout: 'Proef niet geclaimd; niets verzonden.' };
  const eind = await verzend(admin, claim, fetch, PROEF_VRIJGAVE);
  return { referentie: PROEF_REFERENTIE, modus: eind.modus, status: eind.status, reden: eind.reden ?? null };
}