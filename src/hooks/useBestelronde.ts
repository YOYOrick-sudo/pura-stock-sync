import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export type RouteType = 'leverancier' | 'interne_route';

export interface BestelRoute {
  key: string;
  type: RouteType;
  /** leverancier_id bij type leverancier, bron_vestiging bij interne route */
  id: string;
  naam: string;
  kanaal?: string;
}

export interface RouteArtikel {
  artikel_id: string;
  naam: string;
  categorie: string | null;
  tel_volgorde: number | null;
  min_voorraad: number;
  max_voorraad: number;
  basis_eenheid_id: string | null;
  basis_eenheid_code: string;
  /** keuken-eenheid waarin geteld wordt (kan de basiseenheid zijn) */
  tel_eenheid_id: string | null;
  tel_eenheid_code: string;
  factor_naar_basis: number | null;
  /** true = omrekening ontbreekt, invoer wordt gemarkeerd en op de fixlijst gezet */
  conversie_ontbreekt: boolean;
}

export function vandaagNL(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(new Date());
}

/* ---------------- routes ---------------- */

export function useBestelRoutes(vestiging?: string) {
  return useQuery({
    queryKey: ['bestelronde', 'routes', vestiging ?? 'geen'],
    enabled: !!vestiging,
    queryFn: async (): Promise<BestelRoute[]> => {
      const [levRes, intRes] = await Promise.all([
        db.from('leveranciers').select('id, naam, kanaal').eq('actief', true).is('deleted_at', null).order('naam'),
        db
          .from('artikel_locaties')
          .select('bron_vestiging')
          .eq('vestiging', vestiging!)
          .eq('aanvul_bron', 'interne_order')
          .eq('is_actief', true)
          .is('deleted_at', null),
      ]);
      if (levRes.error) throw levRes.error;
      if (intRes.error) throw intRes.error;

      const routes: BestelRoute[] = (levRes.data ?? []).map((l: any) => ({
        key: `lev:${l.id}`,
        type: 'leverancier' as const,
        id: l.id,
        naam: l.naam,
        kanaal: l.kanaal,
      }));

      const bronnen = Array.from(
        new Set((intRes.data ?? []).map((r: any) => r.bron_vestiging).filter(Boolean)),
      ) as string[];
      bronnen.forEach((b) =>
        routes.push({ key: `int:${b}`, type: 'interne_route', id: b, naam: `Intern — ${b}` }),
      );
      return routes;
    },
  });
}

/* ---------------- telronde ---------------- */

export function useTelronde(vestiging?: string, route?: BestelRoute | null, datum?: string) {
  const dag = datum ?? vandaagNL();
  return useQuery({
    queryKey: ['bestelronde', 'telronde', vestiging, route?.key, dag],
    enabled: !!vestiging && !!route,
    queryFn: async () => {
      let q = db
        .from('telrondes')
        .select('*')
        .eq('vestiging', vestiging!)
        .eq('route_type', route!.type)
        .eq('datum', dag)
        .is('deleted_at', null);
      q = route!.type === 'leverancier' ? q.eq('leverancier_id', route!.id) : q.eq('bron_vestiging', route!.id);
      const { data, error } = await q.maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function useStartTelronde() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vestiging, route, datum }: { vestiging: string; route: BestelRoute; datum?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await db
        .from('telrondes')
        .insert({
          vestiging,
          route_type: route.type,
          leverancier_id: route.type === 'leverancier' ? route.id : null,
          bron_vestiging: route.type === 'interne_route' ? route.id : null,
          datum: datum ?? vandaagNL(),
          aangemaakt_door: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bestelronde'] }),
  });
}

export function useTelregels(telrondeId?: string) {
  return useQuery({
    queryKey: ['bestelronde', 'telregels', telrondeId ?? 'geen'],
    enabled: !!telrondeId,
    queryFn: async () => {
      const { data, error } = await db.from('telronde_regels').select('*').eq('telronde_id', telrondeId!);
      if (error) throw error;
      const map = new Map<string, any>();
      (data ?? []).forEach((r: any) => map.set(r.artikel_id, r));
      return map;
    },
  });
}

/** Artikelen van deze route, in telvolgorde, met keuken-eenheid en conversiestatus. */
export function useRouteArtikelen(vestiging?: string, route?: BestelRoute | null) {
  return useQuery({
    queryKey: ['bestelronde', 'route-artikelen', vestiging, route?.key],
    enabled: !!vestiging && !!route,
    queryFn: async (): Promise<RouteArtikel[]> => {
      const bron = route!.type === 'leverancier' ? 'leverancier' : 'interne_order';
      let q = db
        .from('artikel_locaties')
        .select(
          'artikel_id, min_voorraad, max_voorraad, tel_volgorde, artikelen!inner(id, naam, categorie, basis_eenheid_id, deleted_at, eenheden:basis_eenheid_id(id, code))',
        )
        .eq('vestiging', vestiging!)
        .eq('aanvul_bron', bron)
        .eq('is_actief', true)
        .is('deleted_at', null)
        .order('tel_volgorde', { ascending: true });
      if (route!.type === 'interne_route') q = q.eq('bron_vestiging', route!.id);

      const { data, error } = await q;
      if (error) throw error;
      let rijen = (data ?? []).filter((r: any) => !r.artikelen?.deleted_at);

      let levArtikelen = new Map<string, any>();
      if (route!.type === 'leverancier') {
        const { data: la, error: laErr } = await db
          .from('leverancier_artikelen')
          .select('artikel_id, besteleenheid_id, inhoud_per_besteleenheid, artikelnummer')
          .eq('leverancier_id', route!.id)
          .eq('actief', true)
          .is('deleted_at', null);
        if (laErr) throw laErr;
        (la ?? []).forEach((r: any) => levArtikelen.set(r.artikel_id, r));
        rijen = rijen.filter((r: any) => levArtikelen.has(r.artikel_id));
      }

      const ids = rijen.map((r: any) => r.artikel_id);
      const conversies = new Map<string, any[]>();
      if (ids.length) {
        const { data: ae } = await db
          .from('artikel_eenheden')
          .select('artikel_id, eenheid_id, factor_naar_basis, is_keuken, eenheden:eenheid_id(code)')
          .in('artikel_id', ids);
        (ae ?? []).forEach((r: any) => {
          const lijst = conversies.get(r.artikel_id) ?? [];
          lijst.push(r);
          conversies.set(r.artikel_id, lijst);
        });
      }

      return rijen.map((r: any) => {
        const basisId = r.artikelen?.basis_eenheid_id ?? null;
        const basisCode = r.artikelen?.eenheden?.code ?? 'stuk';
        const keuken = (conversies.get(r.artikel_id) ?? []).find((c: any) => c.is_keuken);
        const telEenheidId = keuken?.eenheid_id ?? basisId;
        const telEenheidCode = keuken?.eenheden?.code ?? basisCode;
        const factor = keuken ? Number(keuken.factor_naar_basis) : basisId ? 1 : null;
        return {
          artikel_id: r.artikel_id,
          naam: r.artikelen?.naam ?? 'Onbekend',
          categorie: r.artikelen?.categorie ?? null,
          tel_volgorde: r.tel_volgorde,
          min_voorraad: Number(r.min_voorraad ?? 0),
          max_voorraad: Number(r.max_voorraad ?? 0),
          basis_eenheid_id: basisId,
          basis_eenheid_code: basisCode,
          tel_eenheid_id: telEenheidId,
          tel_eenheid_code: telEenheidCode,
          factor_naar_basis: factor,
          conversie_ontbreekt: factor === null || !Number.isFinite(factor) || factor <= 0,
        } as RouteArtikel;
      });
    },
  });
}

export function useSaveTelregel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      telrondeId,
      artikel,
      aantal,
    }: {
      telrondeId: string;
      artikel: RouteArtikel;
      aantal: number;
    }) => {
      const basis = artikel.conversie_ontbreekt ? null : aantal * (artikel.factor_naar_basis ?? 1);
      const { error } = await db.from('telronde_regels').upsert(
        {
          telronde_id: telrondeId,
          artikel_id: artikel.artikel_id,
          geteld_aantal: aantal,
          eenheid_id: artikel.tel_eenheid_id,
          geteld_basis: basis,
          conversie_ontbreekt: artikel.conversie_ontbreekt,
        },
        { onConflict: 'telronde_id,artikel_id' },
      );
      if (error) throw error;

      // Ontbrekende omrekening nooit stil 1:1 doorrekenen — wel op de fixlijst.
      if (artikel.conversie_ontbreekt) {
        const { data: bestaand } = await db
          .from('migratie_logboek')
          .select('id')
          .eq('bron_tabel', 'artikelen')
          .eq('bron_id', artikel.artikel_id)
          .eq('onderwerp', 'eenheid_conversie_ontbreekt')
          .is('opgelost_op', null)
          .maybeSingle();
        if (!bestaand) {
          await db.from('migratie_logboek').insert({
            onderwerp: 'eenheid_conversie_ontbreekt',
            bron_tabel: 'artikelen',
            bron_id: artikel.artikel_id,
            reden: `Geen omrekening naar de basiseenheid voor "${artikel.naam}" — telling kan niet worden omgerekend.`,
            ruwe_waarde: artikel.tel_eenheid_code,
          });
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bestelronde', 'telregels'] }),
  });
}

export interface VoorstelResultaat {
  vestiging: string;
  datum: string;
  orders: { type: string; order_id: string; regels: number; leverdatum: string | null }[];
  niet_geteld: { artikel_id: string; naam: string; route: string }[];
  geen_leverancier: { artikel_id: string; naam: string }[];
}

/** Rondt de telronde af en draait het bestelvoorstel. Dezelfde functie draait straks via cron. */
export function useAfrondenEnVoorstel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ telrondeId, vestiging, datum }: { telrondeId: string; vestiging: string; datum?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await db
        .from('telrondes')
        .update({ status: 'afgerond', afgerond_op: new Date().toISOString(), afgerond_door: user?.id ?? null })
        .eq('id', telrondeId);
      if (error) throw error;
      const { data, error: rpcErr } = await db.rpc('rpc_genereer_bestelvoorstel', {
        p_vestiging: vestiging,
        p_datum: datum ?? vandaagNL(),
      });
      if (rpcErr) throw rpcErr;
      return data as VoorstelResultaat;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestelronde'] });
      qc.invalidateQueries({ queryKey: ['inkoop'] });
      qc.invalidateQueries({ queryKey: ['internal-orders'] });
    },
  });
}

/* ---------------- inkoopbestellingen ---------------- */

export interface InkoopOrder {
  id: string;
  vestiging: string;
  leverancier_id: string;
  bestelnummer: string;
  kanaal: string;
  status: string;
  leverdatum: string | null;
  laatste_fout: string | null;
  leverancier_naam: string;
}

export const INKOOP_STATUS_LABEL: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  besteld: 'Besteld',
  deels_ontvangen: 'Deels ontvangen',
  ontvangen: 'Ontvangen',
  verzenden_mislukt: 'Verzenden mislukt',
  geannuleerd: 'Geannuleerd',
};

export function useInkoopOrders(vestiging?: string) {
  return useQuery({
    queryKey: ['inkoop', 'orders', vestiging ?? 'geen'],
    enabled: !!vestiging,
    queryFn: async (): Promise<InkoopOrder[]> => {
      const { data, error } = await db
        .from('inkoop_orders')
        .select('*, leveranciers:leverancier_id(naam)')
        .eq('vestiging', vestiging!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((o: any) => ({ ...o, leverancier_naam: o.leveranciers?.naam ?? 'Onbekend' }));
    },
  });
}

export function useInkoopRegels(orderId?: string) {
  return useQuery({
    queryKey: ['inkoop', 'regels', orderId ?? 'geen'],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await db
        .from('inkoop_order_regels')
        .select('*')
        .eq('order_id', orderId!)
        .order('omschrijving');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInkoopStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const patch: Record<string, unknown> = { status, laatste_fout: null };
      if (status === 'verzonden') patch.verzonden_op = new Date().toISOString();
      if (status === 'besteld') {
        patch.besteld_op = new Date().toISOString();
        patch.besteld_door = user?.id ?? null;
      }
      const { error } = await db.from('inkoop_orders').update(patch).eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inkoop'] }),
  });
}

/** Ontvangst per regel; status wordt afgeleid (deels_ontvangen is een echte status). */
export function useInkoopOntvangst() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      regels,
    }: {
      orderId: string;
      regels: { id: string; besteld: number; ontvangen: number | null }[];
    }) => {
      for (const r of regels) {
        const { error } = await db
          .from('inkoop_order_regels')
          .update({
            ontvangen_aantal: r.ontvangen,
            is_backorder: r.ontvangen !== null && r.ontvangen < r.besteld,
          })
          .eq('id', r.id);
        if (error) throw error;
      }
      const compleet = regels.every((r) => r.ontvangen !== null && r.ontvangen >= r.besteld);
      const status = compleet ? 'ontvangen' : 'deels_ontvangen';
      const { error } = await db
        .from('inkoop_orders')
        .update({ status, ontvangen_op: compleet ? new Date().toISOString() : null })
        .eq('id', orderId);
      if (error) throw error;
      return status;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inkoop'] }),
  });
}

/** Kopieerlijst voor portal en mail. */
export function bestelTekst(order: InkoopOrder, regels: any[]): string {
  const kop = `${order.leverancier_naam} — ${order.vestiging} — ${order.bestelnummer}${
    order.leverdatum ? ` — levering ${order.leverdatum}` : ''
  }`;
  const lijnen = regels.map(
    (r) => `${r.artikelnummer ?? '—'}\t${r.omschrijving}\t${Number(r.aantal)} ${r.besteleenheid_code ?? ''}`.trim(),
  );
  return [kop, '', ...lijnen].join('\n');
}
