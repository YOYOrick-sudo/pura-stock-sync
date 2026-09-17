import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { BakmaatKiezer } from '@/components/voorraad/BakmaatKiezer';
import { eenheidUitFormaat } from '@/lib/voorraad-formaat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BRON_LABEL,
  PLEK_LABEL,
  vervolgactieVoorRegel,
  useDrukteModus,
  useZetDrukteModus,
  type KoelcelCheckItem,
  type VoorraadBron,
  type VoorraadPlek,
} from '@/hooks/useKoelcelCheck';

const PLEKKEN: VoorraadPlek[] = ['vriezer', 'koelcel', 'werkbank', 'werkblad'];
const BRONNEN: VoorraadBron[] = ['vriezer', 'koelcel_inkoop', 'magazijn', 'zelf_west', 'midsland'];
/** Hoe verse producten bij de leverancier ingekocht worden. */
const BESTEL_EENHEDEN = ['kist', 'doos', 'bak', 'zak', 'krat', 'tray', 'kilo'];


/** Eén schakelaar voor de hele vestiging: rustige of drukke hoeveelheden. */
function DrukteSchakelaar({ location }: { location: string }) {
  const { data: modus = 'rustig' } = useDrukteModus(location);
  const zet = useZetDrukteModus(location);

  return (
    <Card className="p-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold">Hoeveelheden: {modus === 'druk' ? 'druk' : 'rustig'}</p>
        <p className="text-xs text-muted-foreground">
          In een druk seizoen gebruikt de sluitlijst de drukke aantallen. Vul je die niet in, dan
          blijft het rustige aantal gelden.
        </p>
      </div>
      {(['rustig', 'druk'] as const).map((m) => (
        <Button
          key={m}
          variant={modus === m ? 'default' : 'outline'}
          className="h-11 min-w-[96px]"
          disabled={zet.isPending}
          onClick={() =>
            zet.mutate(m, {
              onSuccess: () => toast.success(m === 'druk' ? 'Drukke hoeveelheden actief' : 'Rustige hoeveelheden actief'),
              onError: (e: any) => toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout')),
            })
          }
        >
          {m === 'druk' ? 'Druk' : 'Rustig'}
        </Button>
      ))}
    </Card>
  );
}

/**
 * Beheer van de aanvulketen op de sluitlijst: welk product hoort waar te liggen,
 * in welke hoeveelheid, en waar het vandaan komt als het op is.
 */
export function VoorraadCheckBeheer({ location }: { location: string }) {
  const qc = useQueryClient();
  const [naam, setNaam] = useState('');
  const [aantal, setAantal] = useState('1');
  const [plek, setPlek] = useState<VoorraadPlek>('koelcel');
  const [bron, setBron] = useState<VoorraadBron>('koelcel_inkoop');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['koelcel-check-beheer', location],
    enabled: !!location,
    queryFn: async (): Promise<KoelcelCheckItem[]> => {
      const { data, error } = await supabase
        .from('koelcel_check_items')
        .select('*')
        .eq('vestiging', location)
        .order('volgorde');
      if (error) throw error;
      return (data ?? []) as unknown as KoelcelCheckItem[];
    },
  });

  const ververs = () => {
    qc.invalidateQueries({ queryKey: ['koelcel-check-beheer', location] });
    qc.invalidateQueries({ queryKey: ['koelcel-check-items', location] });
  };

  const toevoegen = useMutation({
    mutationFn: async () => {
      const n = naam.trim();
      if (n.length < 2) throw new Error('Vul een naam in');
      const doel = Math.max(1, Math.min(99, Number(aantal) || 1));
      const maxVolgorde = items
        .filter((i) => i.plek === plek)
        .reduce((m, i) => Math.max(m, Number(i.volgorde ?? 0)), 0);
      const { error } = await supabase.from('koelcel_check_items').insert({
        vestiging: location,
        naam: n,
        doel_aantal: doel,
        eenheid: 'stuks',
        type: plek === 'vriezer' ? 'vriezer' : 'koelcel',
        plek,
        bron,
        volgorde: maxVolgorde + 10,
        product_sleutel: n.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setNaam('');
      setAantal('1');
      toast.success('Product toegevoegd');
      ververs();
    },
    onError: (e: any) => toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout')),
  });

  const bijwerken = useMutation({
    mutationFn: async ({ id, velden }: { id: string; velden: Record<string, unknown> }) => {
      const { error } = await supabase.from('koelcel_check_items').update(velden).eq('id', id);
      if (error) throw error;
    },
    onSuccess: ververs,
    onError: (e: any) => toast.error('Opslaan mislukt: ' + (e?.message ?? 'onbekende fout')),
  });

  return (
    <div className="space-y-4">
      <DrukteSchakelaar location={location} />
      <Card className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Deze lijsten verschijnen op de sluitlijst van {location}. Bij "Op" schuift een product
          automatisch door naar het niveau eronder (koelcel, vriescel). Op het laagste niveau gaat
          het naar de mise-en-place, het bestelbord of de bestellijst voor Midsland.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Bijv. Hüttenkäse"
            className="h-11 flex-1 min-w-[180px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                toevoegen.mutate();
              }
            }}
          />
          <Input
            value={aantal}
            onChange={(e) => setAantal(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            className="h-11 w-16 text-center"
            aria-label="Aantal"
          />
          <Select value={plek} onValueChange={(v) => setPlek(v as VoorraadPlek)}>
            <SelectTrigger className="h-11 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLEKKEN.map((p) => (
                <SelectItem key={p} value={p}>
                  {PLEK_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bron} onValueChange={(v) => setBron(v as VoorraadBron)}>
            <SelectTrigger className="h-11 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BRONNEN.map((b) => (
                <SelectItem key={b} value={b}>
                  {BRON_LABEL[b]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="h-11" onClick={() => toevoegen.mutate()} disabled={toevoegen.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Toevoegen
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : (
        PLEKKEN.map((p) => {
          const groep = items.filter(
            (i) => (i.plek ?? (i.type === 'vriezer' ? 'vriezer' : 'koelcel')) === p,
          );
          return (
            <Card key={p} className="p-4 space-y-2">
              <h3 className="font-semibold text-sm">{PLEK_LABEL[p]}</h3>
              {groep.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nog geen producten</p>
              ) : (
                <div className="divide-y divide-border">
                  {groep.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-2 py-2">
                      <span
                        className={
                          item.actief
                            ? 'text-sm font-medium flex-1 min-w-[140px]'
                            : 'text-sm text-muted-foreground line-through flex-1 min-w-[140px]'
                        }
                      >
                        {item.naam}
                        <span className="block text-xs font-normal text-muted-foreground">
                          Als het op is → {vervolgactieVoorRegel(item, items).label}
                        </span>
                      </span>
                      <Input
                        key={`${item.id}-${item.doel_aantal}`}
                        defaultValue={String(Number(item.doel_aantal))}
                        inputMode="numeric"
                        className="w-14 h-9 text-center"
                        aria-label={`Aantal rustig ${item.naam}`}
                        title="Aantal als het rustig is"
                        onBlur={(e) => {
                          const v = Number(e.target.value.replace(/[^0-9]/g, ''));
                          if (v && v !== Number(item.doel_aantal)) {
                            bijwerken.mutate({ id: item.id, velden: { doel_aantal: v } });
                          }
                        }}
                      />
                      <Input
                        key={`${item.id}-druk-${item.doel_aantal_druk ?? ''}`}
                        defaultValue={item.doel_aantal_druk ? String(Number(item.doel_aantal_druk)) : ''}
                        inputMode="numeric"
                        placeholder="druk"
                        className="w-14 h-9 text-center"
                        aria-label={`Aantal druk ${item.naam}`}
                        title="Aantal als het druk is"
                        onBlur={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          const v = raw ? Number(raw) : null;
                          if (v !== (item.doel_aantal_druk ? Number(item.doel_aantal_druk) : null)) {
                            bijwerken.mutate({ id: item.id, velden: { doel_aantal_druk: v } });
                          }
                        }}
                      />
                      <BakmaatKiezer
                        formaat={item.formaat ?? item.bak_maat}
                        onWijzig={(formaat) => {
                          const eenheid = eenheidUitFormaat(formaat, item.eenheid || 'stuks');
                          bijwerken.mutate({ id: item.id, velden: { formaat, eenheid } });
                        }}
                      />
                      {(item.bron === 'zelf_west' ||
                        item.bron === 'magazijn' ||
                        item.bron === 'vriezer') && (
                        <Input
                          key={`${item.id}-batch-${item.batch_aantal ?? ''}`}
                          defaultValue={item.batch_aantal ? String(Number(item.batch_aantal)) : ''}
                          inputMode="numeric"
                          placeholder="batch"
                          className="w-16 h-9 text-center"
                          aria-label={`Batchgrootte ${item.naam}`}
                          title={`Hoeveel je in één keer maakt (${item.eenheid || 'stuks'})`}
                          onBlur={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '');
                            const v = raw ? Number(raw) : null;
                            if (v !== (item.batch_aantal ? Number(item.batch_aantal) : null)) {
                              bijwerken.mutate({ id: item.id, velden: { batch_aantal: v } });
                            }
                          }}
                        />
                      )}
                      {(item.bron === 'koelcel_inkoop' || item.bron === 'magazijn') && (
                        <>
                          <Input
                            key={`${item.id}-punt-${item.bestelpunt ?? ''}`}
                            defaultValue={item.bestelpunt !== null && item.bestelpunt !== undefined ? String(Number(item.bestelpunt)) : ''}
                            inputMode="numeric"
                            placeholder="bestelpunt"
                            className="w-24 h-9 text-center"
                            aria-label={`Bestelpunt ${item.naam}`}
                            title="Pas melden vanaf dit aantal of minder"
                            onBlur={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const v = raw ? Number(raw) : null;
                              const huidig =
                                item.bestelpunt !== null && item.bestelpunt !== undefined
                                  ? Number(item.bestelpunt)
                                  : null;
                              if (v !== huidig) {
                                bijwerken.mutate({ id: item.id, velden: { bestelpunt: v } });
                              }
                            }}
                          />
                          <Select
                            value={(item.bestel_eenheid ?? '') || 'geen'}
                            onValueChange={(v) =>
                              bijwerken.mutate({
                                id: item.id,
                                velden: { bestel_eenheid: v === 'geen' ? null : v },
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-32" title="Hoe je inkoopt">
                              <SelectValue placeholder="inkoop" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geen">per stuk</SelectItem>
                              {BESTEL_EENHEDEN.map((b) => (
                                <SelectItem key={b} value={b}>
                                  {b}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            key={`${item.id}-inhoud-${item.bestel_inhoud ?? ''}`}
                            defaultValue={item.bestel_inhoud ? String(Number(item.bestel_inhoud)) : ''}
                            inputMode="numeric"
                            placeholder="per kist"
                            className="w-20 h-9 text-center"
                            aria-label={`Inhoud besteleenheid ${item.naam}`}
                            title={`Hoeveel ${item.eenheid || 'stuks'} er in één besteleenheid zit`}
                            onBlur={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const v = raw ? Number(raw) : null;
                              if (v !== (item.bestel_inhoud ? Number(item.bestel_inhoud) : null)) {
                                bijwerken.mutate({ id: item.id, velden: { bestel_inhoud: v } });
                              }
                            }}
                          />
                        </>
                      )}

                      <Select
                        value={item.bron}
                        onValueChange={(v) =>
                          bijwerken.mutate({ id: item.id, velden: { bron: v } })
                        }
                      >
                        <SelectTrigger className="h-9 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BRONNEN.map((b) => (
                            <SelectItem key={b} value={b}>
                              {BRON_LABEL[b]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={item.plek ?? p}
                        onValueChange={(v) =>
                          bijwerken.mutate({
                            id: item.id,
                            velden: { plek: v, type: v === 'vriezer' ? 'vriezer' : 'koelcel' },
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLEKKEN.map((pp) => (
                            <SelectItem key={pp} value={pp}>
                              {PLEK_LABEL[pp]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Switch
                        checked={item.actief}
                        onCheckedChange={() =>
                          bijwerken.mutate({ id: item.id, velden: { actief: !item.actief } })
                        }
                        aria-label={`${item.naam} actief`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
