import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { vandaagNL } from '@/hooks/useBestelronde';

const db = supabase as any;

export type RouteType = 'leverancier' | 'interne_route';

export type RouteStatus =
  | 'te_tellen'
  | 'telling_open'
  | 'niets_nodig'
  | 'concept'
  | 'onderweg';

export interface DashboardRoute {
  key: string;
  type: RouteType;
  /** leverancier_id of bron_vestiging */
  id: string;
  naam: string;
  kanaal: string | null;
  vandaag: boolean;
  deadline: string | null;
  artikelen: number;
  telrondeId: string | null;
  telrondeAfgerond: boolean;
  conceptOrderId: string | null;
  conceptRegels: number;
  conceptLeverdatum: string | null;
  onderweg: number;
  status: RouteStatus;
}

function dowNL(datum: string): number {
  return new Date(`${datum}T12:00:00`).getDay();
}

export function useIsBeheerder() {
  return useQuery({
    queryKey: ['voorraad', 'is-beheerder'],
    queryFn: async () => {
      const { data, error } = await db.rpc('is_inkoop_beheerder');
      if (error) return false;
      return !!data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Alle routes van de vestiging met hun stand van zaken voor vandaag. */
export function useRouteDashboard(vestiging?: string, datum?: string) {
  const dag = datum ?? vandaagNL();
  return useQuery({
    queryKey: ['voorraad', 'dashboard', vestiging ?? 'geen', dag],
    enabled: !!vestiging,
    queryFn: async (): Promise<DashboardRoute[]> => {
      const dow = dowNL(dag);

      const [levRes, locRes, bdRes, ilRes, trRes, inkRes, intRes] = await Promise.all([
        db.from('leveranciers').select('id, naam, kanaal').eq('actief', true).is('deleted_at', null).order('naam'),
        db
          .from('artikel_locaties')
          .select('artikel_id, aanvul_bron, bron_vestiging')
          .eq('vestiging', vestiging!)
          .eq('is_actief', true)
          .is('deleted_at', null),
        db
          .from('leverancier_besteldagen')
          .select('leverancier_id, weekdag, vestiging, deadline_tijd')
          .eq('actief', true)
          .is('deleted_at', null),
        db
          .from('interne_leverdagen')
          .select('van_vestiging, naar_vestiging, weekdag, deadline_tijd')
          .eq('naar_vestiging', vestiging!)
          .eq('actief', true)
          .is('deleted_at', null),
        db.from('telrondes').select('*').eq('vestiging', vestiging!).eq('datum', dag).is('deleted_at', null),
        db
          .from('inkoop_orders')
          .select('id, leverancier_id, status, leverdatum, inkoop_order_regels(id)')
          .eq('vestiging', vestiging!)
          .is('deleted_at', null),
        db
          .from('internal_orders')
          .select('id, to_location, status, delivery_date, internal_order_items(id)')
          .eq('from_location', vestiging!),
      ]);

      for (const r of [levRes, locRes, bdRes, ilRes, trRes, inkRes, intRes]) {
        if (r.error) throw r.error;
      }

      const locaties = locRes.data ?? [];
      const artikelenPerLeverancier = locaties.filter((l: any) => l.aanvul_bron === 'leverancier').length;

      const routes: DashboardRoute[] = [];

      for (const l of levRes.data ?? []) {
        const dagen = (bdRes.data ?? []).filter(
          (b: any) => b.leverancier_id === l.id && (b.vestiging === null || b.vestiging === vestiging),
        );
        const vandaagRegel = dagen.find((b: any) => Number(b.weekdag) === dow);
        const telronde = (trRes.data ?? []).find(
          (t: any) => t.route_type === 'leverancier' && t.leverancier_id === l.id,
        );
        const orders = (inkRes.data ?? []).filter((o: any) => o.leverancier_id === l.id);
        const concept = orders.find((o: any) => o.status === 'concept');
        const onderweg = orders.filter((o: any) =>
          ['verzonden', 'besteld', 'deels_ontvangen'].includes(o.status),
        ).length;

        routes.push({
          key: `lev:${l.id}`,
          type: 'leverancier',
          id: l.id,
          naam: l.naam,
          kanaal: l.kanaal ?? null,
          vandaag: !!vandaagRegel,
          deadline: vandaagRegel?.deadline_tijd ?? null,
          artikelen: artikelenPerLeverancier,
          telrondeId: telronde?.id ?? null,
          telrondeAfgerond: telronde?.status === 'afgerond',
          conceptOrderId: concept?.id ?? null,
          conceptRegels: concept?.inkoop_order_regels?.length ?? 0,
          conceptLeverdatum: concept?.leverdatum ?? null,
          onderweg,
          status: bepaalStatus(!!concept, telronde?.status, onderweg),
        });
      }

      const bronnen = Array.from(
        new Set(
          locaties
            .filter((l: any) => l.aanvul_bron === 'interne_order' && l.bron_vestiging)
            .map((l: any) => l.bron_vestiging as string),
        ),
      );

      for (const bron of bronnen) {
        const aantal = locaties.filter(
          (l: any) => l.aanvul_bron === 'interne_order' && l.bron_vestiging === bron,
        ).length;
        const leverdag = (ilRes.data ?? []).find(
          (i: any) => i.van_vestiging === bron && Number(i.weekdag) === dow,
        );
        const telronde = (trRes.data ?? []).find(
          (t: any) => t.route_type === 'interne_route' && t.bron_vestiging === bron,
        );
        const orders = (intRes.data ?? []).filter((o: any) => o.to_location === bron);
        const concept = orders.find((o: any) => o.status === 'concept');
        const onderweg = orders.filter((o: any) =>
          ['pending', 'approved', 'partially_delivered'].includes(o.status),
        ).length;

        routes.push({
          key: `int:${bron}`,
          type: 'interne_route',
          id: bron,
          naam: bron,
          kanaal: 'intern',
          vandaag: !!leverdag,
          deadline: leverdag?.deadline_tijd ?? null,
          artikelen: aantal,
          telrondeId: telronde?.id ?? null,
          telrondeAfgerond: telronde?.status === 'afgerond',
          conceptOrderId: concept?.id ?? null,
          conceptRegels: concept?.internal_order_items?.length ?? 0,
          conceptLeverdatum: concept?.delivery_date ?? null,
          onderweg,
          status: bepaalStatus(!!concept, telronde?.status, onderweg),
        });
      }

      return routes.sort((a, b) => Number(b.vandaag) - Number(a.vandaag) || a.naam.localeCompare(b.naam));
    },
  });
}

function bepaalStatus(concept: boolean, telrondeStatus: string | undefined, onderweg: number): RouteStatus {
  if (concept) return 'concept';
  if (telrondeStatus === 'afgerond') return onderweg > 0 ? 'onderweg' : 'niets_nodig';
  if (telrondeStatus) return 'telling_open';
  return onderweg > 0 ? 'onderweg' : 'te_tellen';
}

export const ROUTE_STATUS_LABEL: Record<RouteStatus, string> = {
  te_tellen: 'Te tellen',
  telling_open: 'Telling bezig',
  niets_nodig: 'Niets nodig',
  concept: 'Voorstel klaar',
  onderweg: 'Onderweg',
};

/** Draait het bestelvoorstel; idempotent, dus veilig bij elk bezoek. */
export function useVoorstelDraaien() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vestiging, datum }: { vestiging: string; datum?: string }) => {
      const { data, error } = await db.rpc('rpc_genereer_bestelvoorstel', {
        p_vestiging: vestiging,
        p_datum: datum ?? vandaagNL(),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voorraad'] });
      qc.invalidateQueries({ queryKey: ['inkoop'] });
    },
  });
}

/* ---------------- concept-order per route ---------------- */

export interface ConceptRegel {
  id: string;
  artikel_id: string | null;
  artikelnummer: string | null;
  omschrijving: string;
  aantal: number;
  eenheid: string;
  bron: string;
  handmatig_aangepast: boolean;
}

export interface ConceptOrder {
  type: 'inkoop' | 'intern';
  id: string;
  titel: string;
  kanaal: string;
  status: string;
  leverdatum: string | null;
  bestelnummer: string | null;
  vestiging: string;
  regels: ConceptRegel[];
}

export function useConceptOrder(route?: DashboardRoute | null, vestiging?: string) {
  return useQuery({
    queryKey: ['voorraad', 'concept', route?.key ?? 'geen', route?.conceptOrderId ?? 'geen'],
    enabled: !!route?.conceptOrderId && !!vestiging,
    queryFn: async (): Promise<ConceptOrder | null> => {
      if (route!.type === 'leverancier') {
        const { data, error } = await db
          .from('inkoop_orders')
          .select('*, leveranciers:leverancier_id(naam), inkoop_order_regels(*)')
          .eq('id', route!.conceptOrderId!)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return {
          type: 'inkoop',
          id: data.id,
          titel: data.leveranciers?.naam ?? 'Leverancier',
          kanaal: data.kanaal,
          status: data.status,
          leverdatum: data.leverdatum,
          bestelnummer: data.bestelnummer,
          vestiging: data.vestiging,
          regels: (data.inkoop_order_regels ?? [])
            .map((r: any) => ({
              id: r.id,
              artikel_id: r.artikel_id,
              artikelnummer: r.artikelnummer,
              omschrijving: r.omschrijving,
              aantal: Number(r.aantal),
              eenheid: r.besteleenheid_code ?? '',
              bron: r.bron,
              handmatig_aangepast: r.handmatig_aangepast,
            }))
            .sort((a: ConceptRegel, b: ConceptRegel) => a.omschrijving.localeCompare(b.omschrijving)),
        };
      }

      const { data, error } = await db
        .from('internal_orders')
        .select('*, internal_order_items(*)')
        .eq('id', route!.conceptOrderId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        type: 'intern',
        id: data.id,
        titel: data.to_location,
        kanaal: 'intern',
        status: data.status,
        leverdatum: data.delivery_date,
        bestelnummer: data.order_number || null,
        vestiging: data.from_location,
        regels: (data.internal_order_items ?? [])
          .map((r: any) => ({
            id: r.id,
            artikel_id: r.artikel_id,
            artikelnummer: null,
            omschrijving: r.product_name,
            aantal: Number(r.quantity),
            eenheid: r.unit ?? '',
            bron: r.bron,
            handmatig_aangepast: r.handmatig_aangepast,
          }))
          .sort((a: ConceptRegel, b: ConceptRegel) => a.omschrijving.localeCompare(b.omschrijving)),
      };
    },
  });
}

/** Aantal met de hand aanpassen — markeert de regel zodat hergeneratie hem met rust laat. */
export function useRegelAantal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      type,
      regelId,
      aantal,
    }: {
      type: 'inkoop' | 'intern';
      regelId: string;
      aantal: number;
    }) => {
      const tabel = type === 'inkoop' ? 'inkoop_order_regels' : 'internal_order_items';
      const patch =
        type === 'inkoop'
          ? { aantal, handmatig_aangepast: true }
          : { quantity: aantal, handmatig_aangepast: true };
      const { data, error } = await db.from(tabel).update(patch).eq('id', regelId).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Aanpassen niet toegestaan voor jouw account.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voorraad'] }),
  });
}

export function useRegelVerwijderen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, regelId }: { type: 'inkoop' | 'intern'; regelId: string }) => {
      const tabel = type === 'inkoop' ? 'inkoop_order_regels' : 'internal_order_items';
      const { data, error } = await db.from(tabel).delete().eq('id', regelId).select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Alleen een manager kan een regel verwijderen.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voorraad'] }),
  });
}

/** Ad-hoc artikel op de bestelling van een route zetten. */
export function useExtraBestellen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vestiging,
      route,
      artikelId,
      aantal,
    }: {
      vestiging: string;
      route: DashboardRoute;
      artikelId: string;
      aantal: number;
    }) => {
      const { data, error } = await db.rpc('rpc_extra_bestellen', {
        p_vestiging: vestiging,
        p_route_type: route.type === 'leverancier' ? 'leverancier' : 'interne_route',
        p_route_id: route.id,
        p_artikel_id: artikelId,
        p_aantal: aantal,
      });
      if (error) throw error;
      return data as { type: string; order_id: string; melding: string | null };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voorraad'] });
      qc.invalidateQueries({ queryKey: ['inkoop'] });
    },
  });
}

/** Interne aanvraag versturen — dagelijkse flow, mag door elk teamlid. */
export function useInternVersturen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await db
        .from('internal_orders')
        .update({ status: 'approved', requested_by: user?.id ?? null, approved_by: user?.id ?? null })
        .eq('id', orderId)
        .select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Versturen niet gelukt — vernieuw de pagina en probeer opnieuw.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['voorraad'] }),
  });
}

/* ---------------- ontvangen ---------------- */

export interface OnderwegRegel {
  id: string;
  omschrijving: string;
  aantal: number;
  eenheid: string;
  ontvangen: number | null;
  backorder: boolean;
}

export interface OnderwegOrder {
  type: 'inkoop' | 'intern';
  id: string;
  titel: string;
  richting: string;
  nummer: string;
  status: string;
  statusLabel: string;
  leverdatum: string | null;
  aangevraagdDoor: string | null;
  regels: OnderwegRegel[];
  historie: boolean;
}

const INTERN_LABEL: Record<string, string> = {
  concept: 'Concept',
  pending: 'In afwachting',
  approved: 'Onderweg',
  partially_delivered: 'Deels ontvangen',
  delivered: 'Ontvangen',
  rejected: 'Afgewezen',
};

const INKOOP_LABEL: Record<string, string> = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  besteld: 'Besteld',
  deels_ontvangen: 'Deels ontvangen',
  ontvangen: 'Ontvangen',
  verzenden_mislukt: 'Verzenden mislukt',
  geannuleerd: 'Geannuleerd',
};

/** Alles wat onderweg is (en de historie), inkoop en intern door elkaar. */
export function useOnderweg(vestiging?: string) {
  return useQuery({
    queryKey: ['voorraad', 'onderweg', vestiging ?? 'geen'],
    enabled: !!vestiging,
    queryFn: async (): Promise<OnderwegOrder[]> => {
      const [inkRes, intRes] = await Promise.all([
        db
          .from('inkoop_orders')
          .select('*, leveranciers:leverancier_id(naam), inkoop_order_regels(*)')
          .eq('vestiging', vestiging!)
          .is('deleted_at', null)
          .neq('status', 'concept')
          .order('leverdatum', { ascending: true }),
        db
          .from('internal_orders')
          .select('*, internal_order_items(*)')
          .or(`from_location.eq.${vestiging},to_location.eq.${vestiging}`)
          .neq('status', 'concept')
          .order('delivery_date', { ascending: true }),
      ]);
      if (inkRes.error) throw inkRes.error;
      if (intRes.error) throw intRes.error;

      const userIds = Array.from(
        new Set((intRes.data ?? []).map((o: any) => o.requested_by).filter(Boolean)),
      ) as string[];
      const namen = new Map<string, string>();
      if (userIds.length) {
        const { data: profielen } = await db
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);
        (profielen ?? []).forEach((p: any) => {
          const naam = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
          if (naam) namen.set(p.user_id, naam);
        });
      }

      const inkoop: OnderwegOrder[] = (inkRes.data ?? []).map((o: any) => ({
        type: 'inkoop',
        id: o.id,
        titel: o.leveranciers?.naam ?? 'Leverancier',
        richting: `Levering aan ${o.vestiging}`,
        nummer: o.bestelnummer,
        status: o.status,
        statusLabel: INKOOP_LABEL[o.status] ?? o.status,
        leverdatum: o.leverdatum,
        aangevraagdDoor: null,
        historie: ['ontvangen', 'geannuleerd'].includes(o.status),
        regels: (o.inkoop_order_regels ?? []).map((r: any) => ({
          id: r.id,
          omschrijving: r.omschrijving,
          aantal: Number(r.aantal),
          eenheid: r.besteleenheid_code ?? '',
          ontvangen: r.ontvangen_aantal === null ? null : Number(r.ontvangen_aantal),
          backorder: !!r.is_backorder,
        })),
      }));

      const intern: OnderwegOrder[] = (intRes.data ?? []).map((o: any) => ({
        type: 'intern',
        id: o.id,
        titel: o.from_location === vestiging ? `Aanvraag aan ${o.to_location}` : `Aanvraag van ${o.from_location}`,
        richting: `${o.from_location} → ${o.to_location}`,
        nummer: o.order_number ?? '—',
        status: o.status,
        statusLabel: INTERN_LABEL[o.status] ?? o.status,
        leverdatum: o.delivery_date,
        aangevraagdDoor: o.requested_by ? namen.get(o.requested_by) ?? 'Onbekend' : null,
        historie: ['delivered', 'rejected'].includes(o.status),
        regels: (o.internal_order_items ?? []).map((r: any) => ({
          id: r.id,
          omschrijving: r.product_name,
          aantal: Number(r.quantity),
          eenheid: r.unit ?? '',
          ontvangen: r.ontvangen_aantal === null || r.ontvangen_aantal === undefined ? null : Number(r.ontvangen_aantal),
          backorder: false,
        })),
      }));

      return [...inkoop, ...intern].sort((a, b) => (a.leverdatum ?? '9999').localeCompare(b.leverdatum ?? '9999'));
    },
  });
}

/** Ontvangst vastleggen — mag door elk ingelogd teamlid. */
export function useOntvangstVastleggen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      order,
      regels,
    }: {
      order: OnderwegOrder;
      regels: { id: string; besteld: number; ontvangen: number | null }[];
    }) => {
      const compleet = regels.every((r) => r.ontvangen !== null && r.ontvangen >= r.besteld);

      if (order.type === 'inkoop') {
        for (const r of regels) {
          const { data, error } = await db
            .from('inkoop_order_regels')
            .update({
              ontvangen_aantal: r.ontvangen,
              is_backorder: r.ontvangen !== null && r.ontvangen < r.besteld,
            })
            .eq('id', r.id)
            .select('id');
          if (error) throw error;
          if (!data?.length) throw new Error('Ontvangst vastleggen lukte niet — vernieuw de pagina.');
        }
        const status = compleet ? 'ontvangen' : 'deels_ontvangen';
        const { data: ord, error } = await db
          .from('inkoop_orders')
          .update({ status, ontvangen_op: compleet ? new Date().toISOString() : null })
          .eq('id', order.id)
          .select('id');
        if (error) throw error;
        if (!ord?.length) throw new Error('De status van deze bestelling kon niet worden bijgewerkt.');
        return status;
      }

      for (const r of regels) {
        const { data, error } = await db
          .from('internal_order_items')
          .update({ ontvangen_aantal: r.ontvangen })
          .eq('id', r.id)
          .select('id');
        if (error) throw error;
        if (!data?.length) throw new Error('Ontvangst vastleggen lukte niet — vernieuw de pagina.');
      }
      const status = compleet ? 'delivered' : 'partially_delivered';
      const { data: ord, error } = await db
        .from('internal_orders')
        .update({ status, received_at: new Date().toISOString() })
        .eq('id', order.id)
        .select('id');
      if (error) throw error;
      if (!ord?.length) throw new Error('De status van deze bestelling kon niet worden bijgewerkt.');
      return status;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voorraad'] });
      qc.invalidateQueries({ queryKey: ['inkoop'] });
    },
  });
}

/* ---------------- laatst geteld ---------------- */

export interface LaatstGeteldRegel {
  artikel_id: string;
  naam: string;
  categorie: string | null;
  route: string;
  eenheid: string;
  aantal: number | null;
  datum: string | null;
}

/** Laatst getelde stand per artikel — bewust géén actuele voorraad. */
export function useLaatstGeteld(vestiging?: string) {
  return useQuery({
    queryKey: ['voorraad', 'laatst-geteld', vestiging ?? 'geen'],
    enabled: !!vestiging,
    queryFn: async (): Promise<LaatstGeteldRegel[]> => {
      const [locRes, levRes, rondeRes] = await Promise.all([
        db
          .from('artikel_locaties')
          .select(
            'artikel_id, aanvul_bron, bron_vestiging, tel_volgorde, artikelen!inner(naam, categorie, deleted_at, eenheden:basis_eenheid_id(code))',
          )
          .eq('vestiging', vestiging!)
          .eq('is_actief', true)
          .is('deleted_at', null)
          .order('tel_volgorde', { ascending: true }),
        db.from('leveranciers').select('id, naam'),
        db
          .from('telrondes')
          .select('id, datum, route_type, leverancier_id, bron_vestiging, telronde_regels(artikel_id, geteld_aantal)')
          .eq('vestiging', vestiging!)
          .is('deleted_at', null)
          .order('datum', { ascending: false })
          .limit(60),
      ]);
      if (locRes.error) throw locRes.error;
      if (rondeRes.error) throw rondeRes.error;

      const laatste = new Map<string, { aantal: number; datum: string }>();
      for (const ronde of rondeRes.data ?? []) {
        for (const regel of ronde.telronde_regels ?? []) {
          const bestaand = laatste.get(regel.artikel_id);
          if (!bestaand || bestaand.datum < ronde.datum) {
            laatste.set(regel.artikel_id, { aantal: Number(regel.geteld_aantal), datum: ronde.datum });
          }
        }
      }

      const levNamen = new Map<string, string>((levRes.data ?? []).map((l: any) => [l.id, l.naam]));

      return (locRes.data ?? [])
        .filter((r: any) => !r.artikelen?.deleted_at)
        .map((r: any) => {
          const geteld = laatste.get(r.artikel_id);
          return {
            artikel_id: r.artikel_id,
            naam: r.artikelen?.naam ?? 'Onbekend',
            categorie: r.artikelen?.categorie ?? null,
            route:
              r.aanvul_bron === 'interne_order'
                ? `Intern — ${r.bron_vestiging ?? '?'}`
                : r.aanvul_bron === 'eigen_productie'
                  ? 'Eigen productie'
                  : 'Leverancier',
            eenheid: r.artikelen?.eenheden?.code ?? 'stuk',
            aantal: geteld?.aantal ?? null,
            datum: geteld?.datum ?? null,
          };
        });
    },
  });
}

/** Artikelen die op een route besteld kunnen worden (voor Extra bestellen). */
export function useRouteArtikelKeuze(vestiging?: string, route?: DashboardRoute | null) {
  return useQuery({
    queryKey: ['voorraad', 'artikelkeuze', vestiging ?? 'geen', route?.key ?? 'geen'],
    enabled: !!vestiging && !!route,
    queryFn: async () => {
      if (route!.type === 'leverancier') {
        const { data, error } = await db
          .from('leverancier_artikelen')
          .select('artikel_id, artikelen!inner(naam, deleted_at)')
          .eq('leverancier_id', route!.id)
          .eq('actief', true)
          .is('deleted_at', null);
        if (error) throw error;
        return (data ?? [])
          .filter((r: any) => !r.artikelen?.deleted_at)
          .map((r: any) => ({ id: r.artikel_id, naam: r.artikelen.naam }))
          .sort((a: any, b: any) => a.naam.localeCompare(b.naam));
      }
      const { data, error } = await db
        .from('artikel_locaties')
        .select('artikel_id, artikelen!inner(naam, deleted_at)')
        .eq('vestiging', vestiging!)
        .eq('aanvul_bron', 'interne_order')
        .eq('bron_vestiging', route!.id)
        .eq('is_actief', true)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? [])
        .filter((r: any) => !r.artikelen?.deleted_at)
        .map((r: any) => ({ id: r.artikel_id, naam: r.artikelen.naam }))
        .sort((a: any, b: any) => a.naam.localeCompare(b.naam));
    },
  });
}
