import { EERSTE_PROEF, TWEEDE_PROEF, DERDE_PROEF, VIERDE_PROEF, VIJFDE_PROEF, ZESDE_PROEF, ZEVENDE_PROEF, FRIET_PROEF, type VasteProef, eersteProef, eersteProefAudit, proefControle, proefPogingen, PROEF_BLOKKADE, PROEF_EERSTE_HASH, PROEF_EERSTE_TIJD, PROEF_HERVAT_REDEN, PROEF_HERVATTING, PROEF_ORDER_ID, PROEF_OWNER_ID, PROEF_REFERENTIE } from '../_shared/eilandbezorgerProef.ts';
import { vingerafdruk } from '../_shared/eilandbezorgerLogica.ts';
import { overgang, verzend } from '../_shared/eilandbezorgerVerzend.ts';

/** Alleen na de bestaande auth.getUser + actieve eigenaarscontrole. Nooit bestaande rijen vrijgeven. */
export async function gingerBeerProef(admin: any, eigenaarId: string, proef: VasteProef = EERSTE_PROEF) {
  if ((proef === TWEEDE_PROEF || proef === DERDE_PROEF || proef === VIERDE_PROEF || proef === VIJFDE_PROEF || proef === ZESDE_PROEF || proef === ZEVENDE_PROEF || proef === FRIET_PROEF) && eigenaarId !== PROEF_OWNER_ID) return { fout: 'Deze proef is uitsluitend vrijgegeven door de oorspronkelijke eigenaar.' };
  if ((proef === DERDE_PROEF || proef === VIERDE_PROEF || proef === VIJFDE_PROEF || proef === ZESDE_PROEF || proef === ZEVENDE_PROEF || proef === FRIET_PROEF) && !await proefPogingen(admin, false, proef)) return { fout: `${proef === FRIET_PROEF ? 'FR01' : proef === ZEVENDE_PROEF ? 'GB07' : proef === ZESDE_PROEF ? 'GB06' : proef === VIJFDE_PROEF ? 'GB05' : proef === VIERDE_PROEF ? 'GB04' : 'GB03'} heeft al een poging of kon niet veilig worden gecontroleerd; niet herhalen.` };
  const c = await proefControle(admin, Date.now(), proef);
  if ('fout' in c) return { fout: c.fout };
  const bestaand = await admin.from('externe_bestellingen').select('id, modus, status, referentie').eq('merchant_id', '36864').eq('extern_id', proef.referentie);
  if (bestaand.error) return { fout: 'Bestaande proef kon niet veilig worden gecontroleerd.' };
  if (bestaand.data?.length) return { fout: 'Proef bestaat al; geen nieuwe verzending of testconversie.', bestelling: bestaand.data };
  const { data: rij, error } = await admin.from('externe_bestellingen').insert({
    id: proef.orderId, modus: 'live', vestiging: 'Midsland', merchant_id: '36864', extern_id: proef.referentie,
    referentie: proef.referentie, vingerafdruk: await vingerafdruk(c.b), status: 'ontvangen',
    reden: 'Eenmalige fysieke owner-proef; gewone liveverzending blijft uit.', vrijgegeven_door: eigenaarId,
    ophaaltijd: c.b.ophaaltijd, restaurant_cent: c.b.bedragen.restaurant_cent, bezorgkosten_cent: 0, fooi_cent: 0, korting: null,
    invoer: c.b, regels: c.regels,
  }).select('*').single();
  if (error || !rij) return { fout: error?.code === '23505' ? 'Proef is al geclaimd; geen tweede verzending.' : 'Proef opslaan mislukt; niets verzonden.' };
  const log = await admin.from('externe_bestelling_log').insert({ bestelling_id: rij.id, naar_status: 'ontvangen', reden: rij.reden, door: eigenaarId });
  if (log.error) return { fout: 'Auditregistratie mislukt; proef blijft ongezonden.' };
  const claim = await overgang(admin, rij.id, rij.versie, ['ontvangen'], 'verzenden', {}, rij.reden, eigenaarId);
  if (!claim) return { fout: 'Proef niet geclaimd; niets verzonden.' };
  const eind = await verzend(admin, claim, fetch, proef.vrijgave);
  return { referentie: proef.referentie, modus: eind.modus, status: eind.status, reden: eind.reden ?? null };
}

/** Expliciete hervatting van uitsluitend versie 3 van de eerste ongezonden proef. */
export async function hervatGingerBeerProef(admin: any, eigenaarId: string) {
  if (eigenaarId !== PROEF_OWNER_ID) return { fout: 'Alleen de oorspronkelijke eigenaar kan deze eerste proef hervatten.' };
  const owner = await admin.from('user_roles').select('role').eq('user_id', eigenaarId).eq('is_active', true).in('role', ['owner', 'admin']);
  if (owner.error || !owner.data?.length) return { fout: 'Actieve eigenaarsrol ontbreekt; geen hervatting.' };
  const c = await proefControle(admin, Date.now());
  if ('fout' in c) return { fout: c.fout };
  const { data: rij, error } = await admin.from('externe_bestellingen').select('*').eq('id', PROEF_ORDER_ID).maybeSingle();
  if (error || !rij || rij.status !== 'geblokkeerd' || rij.versie !== 3 || rij.reden !== PROEF_BLOKKADE ||
    rij.lightspeed_order_id !== null || rij.orderbericht !== null || rij.lightspeed_klant_id !== null ||
    !eersteProef(rij, c.cfg, c.regels, Date.now())) return { fout: 'Niet de exacte eerste ongezonden vóór-verzendblokkade; geen hervatting.' };
  if (!await proefPogingen(admin) || !await eersteProefAudit(admin)) return { fout: 'Eerdere poging, afwijkende historie of uitleesfout; geen hervatting.' };
  // Compare-and-set op alle bewaarde waarden. PostgreSQL vergelijkt jsonb structureel.
  const { data: claim, error: claimFout } = await admin.from('externe_bestellingen')
    .update({ status: 'verzenden', versie: 4, reden: PROEF_HERVAT_REDEN, updated_at: new Date().toISOString() })
    .eq('id', PROEF_ORDER_ID).eq('status', 'geblokkeerd').eq('versie', 3).eq('reden', PROEF_BLOKKADE)
    .eq('bron', 'eilandbezorger').eq('modus', 'live').eq('vestiging', 'Midsland').eq('merchant_id', '36864')
    .eq('extern_id', PROEF_REFERENTIE).eq('referentie', PROEF_REFERENTIE).eq('vrijgegeven_door', PROEF_OWNER_ID)
    .eq('vingerafdruk', PROEF_EERSTE_HASH).eq('ophaaltijd', PROEF_EERSTE_TIJD)
    .eq('restaurant_cent', 490).eq('bezorgkosten_cent', 0).eq('fooi_cent', 0).is('korting', null).is('bezorgtijd', null)
    .is('lightspeed_order_id', null).is('orderbericht', null).is('lightspeed_klant_id', null)
    .eq('invoer', JSON.stringify(rij.invoer)).eq('regels', JSON.stringify(rij.regels)).select('*').maybeSingle();
  if (claimFout || !claim) return { fout: 'Hervatting niet geclaimd of tegelijk gewijzigd; niets verzonden.' };
  const log = await admin.from('externe_bestelling_log').insert({ bestelling_id: claim.id, van_status: 'geblokkeerd', naar_status: 'verzenden', reden: PROEF_HERVAT_REDEN, door: eigenaarId });
  if (log.error) return { fout: 'Hervattingsaudit mislukt; niets verzonden, niet herhalen.' };
  const eind = await verzend(admin, claim, fetch, PROEF_HERVATTING);
  return { referentie: PROEF_REFERENTIE, modus: eind.modus, status: eind.status, reden: eind.reden ?? null };
}