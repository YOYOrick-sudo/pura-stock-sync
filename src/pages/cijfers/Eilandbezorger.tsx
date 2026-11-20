import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { SidebarLayout } from '@/components/SidebarLayout';
import { DetailLade, FoutRegel, LaadRijen, LegeStaat, LijstKaart, PaginaBalk, RijMeta, StatusLabel, kaartRandKlasse, segmentTabsKlasse } from '@/components/pura';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AANDACHT, actiesVoor, euro, statusLabel } from '@/lib/eilandbezorger';

const tijd = (iso: string) => new Date(iso).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const ACTIE_LABEL = { annuleren: 'Annuleren', vrijgeven: 'Vrijgeven', teruglezen: 'Teruglezen', in_kassa: 'Staat in kassa', herverzenden: 'Opnieuw versturen' } as const;

export default function Eilandbezorger() {
  const [filter, setFilter] = useState<'aandacht' | 'alles'>('aandacht');
  const [open, setOpen] = useState<string | null>(null);
  const [reden, setReden] = useState('');
  const qc = useQueryClient();
  const { toast } = useToast();

  const lijst = useQuery({
    queryKey: ['eilandbezorger', filter],
    queryFn: async () => {
      let q = supabase.from('externe_bestellingen').select('id, modus, vestiging, extern_id, status, reden, ophaaltijd, restaurant_cent, regels, korting, created_at').order('created_at', { ascending: false }).limit(100);
      if (filter === 'aandacht') q = q.in('status', [...AANDACHT]);
      const { data, error } = await q; if (error) throw error; return data;
    },
    refetchInterval: 30_000,
  });
  const rij = lijst.data?.find((r) => r.id === open);
  const log = useQuery({
    queryKey: ['eilandbezorger-log', open], enabled: !!open,
    queryFn: async () => { const { data, error } = await supabase.from('externe_bestelling_log').select('id, naar_status, reden, created_at').eq('bestelling_id', open!).order('created_at'); if (error) throw error; return data; },
  });

  const actie = useMutation({
    mutationFn: async (a: keyof typeof ACTIE_LABEL) => {
      const body: Record<string, unknown> = { actie: a, id: open };
      if (a === 'annuleren' || a === 'in_kassa' || a === 'herverzenden') body.reden = reden;
      if (a === 'herverzenden') body.bevestiging = true;
      const { data, error } = await supabase.functions.invoke('eilandbezorger-beheer', { body });
      if (error) { const t = error instanceof FunctionsHttpError ? await error.context.text() : error.message; let f = t; try { f = JSON.parse(t).fout ?? t; } catch { /* tekst */ } throw new Error(f); }
      return data;
    },
    onSuccess: () => { setReden(''); qc.invalidateQueries({ queryKey: ['eilandbezorger'] }); qc.invalidateQueries({ queryKey: ['eilandbezorger-log'] }); toast({ title: 'Bijgewerkt' }); },
    onError: (e: Error) => toast({ title: 'Niet gelukt', description: e.message, variant: 'destructive' }),
  });

  const acties = rij ? actiesVoor(rij.status, rij.modus) : [];
  const redenNodig = acties.some((a) => a === 'annuleren' || a === 'in_kassa' || a === 'herverzenden');

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <PaginaBalk links={
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'aandacht' | 'alles')}>
            <TabsList className={segmentTabsKlasse}><TabsTrigger value="aandacht">Aandacht nodig</TabsTrigger><TabsTrigger value="alles">Alles</TabsTrigger></TabsList>
          </Tabs>} />
        <LijstKaart>
          {lijst.isLoading ? <LaadRijen /> : lijst.isError ? <FoutRegel onOpnieuw={() => lijst.refetch()} /> : !lijst.data?.length ? <LegeStaat tekst={filter === 'aandacht' ? 'Niets dat aandacht nodig heeft.' : 'Nog geen bestellingen.'} /> : (
            <Table className={kaartRandKlasse}>
              <TableHeader><TableRow><TableHead>Bestelling</TableHead><TableHead className="hidden sm:table-cell">Ophalen</TableHead><TableHead className="hidden sm:table-cell text-right">Bedrag</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {lijst.data.map((r) => { const s = statusLabel(r.status); return (
                  <TableRow key={r.id} className="h-12 cursor-pointer" onClick={() => { setOpen(r.id); setReden(''); }}>
                    <TableCell><span className="font-medium">{r.extern_id}</span>{r.modus === 'test' && <span className="ml-2 text-xs text-muted-foreground">test</span>}
                      <RijMeta>{tijd(r.ophaaltijd)} · {euro(r.restaurant_cent)}</RijMeta></TableCell>
                    <TableCell className="hidden sm:table-cell">{tijd(r.ophaaltijd)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right tabular-nums">{euro(r.restaurant_cent)}</TableCell>
                    <TableCell className="text-right"><StatusLabel toon={s.toon}>{s.tekst}</StatusLabel></TableCell>
                  </TableRow>); })}
              </TableBody>
            </Table>)}
        </LijstKaart>
      </div>

      <DetailLade open={!!rij} onOpenChange={(o) => !o && setOpen(null)} titel={rij ? `${rij.extern_id} · ${rij.modus}` : ''}
        voet={acties.length ? acties.map((a, i) => (
          <Button key={a} size="touch" variant={a === 'annuleren' ? 'destructive' : i === 0 ? 'default' : 'outline'} disabled={actie.isPending || (redenNodig && a !== 'vrijgeven' && a !== 'teruglezen' && reden.trim().length < 10)} onClick={() => actie.mutate(a)}>{ACTIE_LABEL[a]}</Button>)) : undefined}>
        {rij && <>
          <div className="flex items-center justify-between"><StatusLabel toon={statusLabel(rij.status).toon}>{statusLabel(rij.status).tekst}</StatusLabel><span className="tabular-nums font-medium">{euro(rij.restaurant_cent)}</span></div>
          {rij.reden && <p className="text-sm text-muted-foreground">{rij.reden}</p>}
          <p className="text-sm">Ophalen {tijd(rij.ophaaltijd)} · {rij.vestiging}</p>
          {Array.isArray(rij.regels) && <ul className="space-y-1 text-sm">{(rij.regels as { naam: string; aantal: number; extras: { naam: string; aantal: number }[] }[]).map((g, i) => (
            <li key={i}>{g.aantal}× {g.naam}{g.extras?.length ? <span className="text-muted-foreground"> + {g.extras.map((e) => `${e.aantal}× ${e.naam}`).join(', ')}</span> : null}</li>))}</ul>}
          {redenNodig && <Textarea value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Reden (minstens 10 tekens)" aria-label="Reden" />}
          <ul className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">{(log.data ?? []).map((l) => <li key={l.id}>{tijd(l.created_at)} · {statusLabel(l.naar_status).tekst}{l.reden ? ` · ${l.reden}` : ''}</li>)}</ul>
        </>}
      </DetailLade>
    </SidebarLayout>
  );
}
