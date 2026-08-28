import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  METHODE_TYPES,
  useAlleMethodes,
  useMethodes,
  useSaveMethode,
} from '@/hooks/useHalffabricaatMethodes';
import {
  useArtikelen,
  useEenheden,
  useLogboek,
  useLogboekAfronden,
  useSaveArtikel,
} from '@/hooks/useKeten';
import { useRecipes } from '@/hooks/useRecipes';
import { MethodeDialog } from '@/components/keten/MethodeDialog';

const GEEN_REGELS_TEKST =
  'Dit recept heeft nog geen ingrediëntregels — het verbruik kan straks niet geboekt worden.';

function GeenRegelsWaarschuwing({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-warning" title={GEEN_REGELS_TEKST}>
        <AlertTriangle className="h-4 w-4" />
      </span>
    );
  }
  return (
    <div className="flex w-full items-start gap-2 text-xs text-warning">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-px" />
      <span>{GEEN_REGELS_TEKST}</span>
    </div>
  );
}

function MethodeRij({
  artikel,
  regelCount,
}: {
  artikel: { id: string; naam: string; recept_id: string | null };
  regelCount?: number;
}) {
  const { data: methodes = [] } = useMethodes(artikel.recept_id ?? undefined);
  const { data: eenheden = [] } = useEenheden();
  const { data: logboek = [] } = useLogboek(true);
  const save = useSaveMethode();
  const saveArtikel = useSaveArtikel();
  const afronden = useLogboekAfronden();

  const bestaand = methodes[0];
  const [type, setType] = useState<string>(bestaand?.type ?? 'Bereiden');
  const [outputHoeveelheid, setOutputHoeveelheid] = useState(
    bestaand?.output_hoeveelheid != null ? String(bestaand.output_hoeveelheid) : '',
  );
  const [outputEenheid, setOutputEenheid] = useState(bestaand?.output_eenheid ?? '');
  const [houdbaarheid, setHoudbaarheid] = useState(
    bestaand?.houdbaarheid != null ? String(bestaand.houdbaarheid) : '',
  );
  const [leadtime, setLeadtime] = useState(
    (bestaand as any)?.productie_leadtime_dagen != null ? String((bestaand as any).productie_leadtime_dagen) : '',
  );
  const [naarVoorraad, setNaarVoorraad] = useState(bestaand?.output_gaat_op_voorraad ?? true);

  const opslaan = async () => {
    if (!artikel.recept_id) {
      toast.error('Dit artikel hangt niet aan een recept');
      return;
    }
    const hoeveelheid = Number(outputHoeveelheid.replace(',', '.'));
    if (!outputEenheid || !Number.isFinite(hoeveelheid) || hoeveelheid <= 0) {
      toast.error('Vul output-hoeveelheid en -eenheid in');
      return;
    }
    try {
      await save.mutateAsync({
        id: bestaand?.id,
        recept_id: artikel.recept_id,
        type,
        visuele_eenheid: bestaand?.visuele_eenheid ?? outputEenheid,
        output_hoeveelheid: hoeveelheid,
        output_eenheid: outputEenheid,
        standaard_duur: bestaand?.standaard_duur ?? 0,
        houdbaarheid: houdbaarheid ? Number(houdbaarheid) : null,
        productie_leadtime_dagen: leadtime ? Number(leadtime) : 0,
        output_gaat_op_voorraad: naarVoorraad,
      } as any);

      // Alleen bij voorraad-output: output-eenheid wordt basis-eenheid + logboekregel oplossen.
      const eenheid = eenheden.find((e) => e.code === outputEenheid);
      if (naarVoorraad && eenheid) {
        await saveArtikel.mutateAsync({ id: artikel.id, naam: artikel.naam, basis_eenheid_id: eenheid.id } as any);
        const log = logboek.find((l) => l.bron_tabel === 'artikelen' && l.bron_id === artikel.id);
        if (log) await afronden.mutateAsync(log.id);
      }
      toast.success('Methode opgeslagen');
    } catch (e: any) {
      toast.error(e?.message ?? 'Opslaan mislukt');
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border py-3">
      <div className="min-w-[180px] flex-1 text-sm font-medium">
        {artikel.naam}
        {bestaand && (
          <Badge variant={bestaand.output_gaat_op_voorraad ? 'secondary' : 'outline'} className="ml-2 text-xs">
            {bestaand.output_gaat_op_voorraad ? 'Voorraad' : 'Direct'}
          </Badge>
        )}
      </div>
      <div className="w-36">
        <label className="text-xs text-muted-foreground">Handeling</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {METHODE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="w-24">
        <label className="text-xs text-muted-foreground">Output</label>
        <Input value={outputHoeveelheid} onChange={(e) => setOutputHoeveelheid(e.target.value)} inputMode="decimal" className="h-11 mt-1" />
      </div>
      <div className="w-32">
        <label className="text-xs text-muted-foreground">Eenheid</label>
        <Select value={outputEenheid} onValueChange={setOutputEenheid}>
          <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Kies" /></SelectTrigger>
          <SelectContent>
            {eenheden.map((e) => <SelectItem key={e.id} value={e.code}>{e.code}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="w-28">
        <label className="text-xs text-muted-foreground">Houdbaar (d)</label>
        <Input value={houdbaarheid} onChange={(e) => setHoudbaarheid(e.target.value)} inputMode="numeric" className="h-11 mt-1" />
      </div>
      <div className="w-28">
        <label className="text-xs text-muted-foreground">Leadtime (d)</label>
        <Input value={leadtime} onChange={(e) => setLeadtime(e.target.value)} inputMode="numeric" className="h-11 mt-1" />
      </div>
      <div className="w-32">
        <label className="text-xs text-muted-foreground">Output</label>
        <Select value={naarVoorraad ? 'voorraad' : 'direct'} onValueChange={(v) => setNaarVoorraad(v === 'voorraad')}>
          <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="voorraad">Op voorraad</SelectItem>
            <SelectItem value="direct">Direct verkoop</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="h-11" onClick={opslaan} disabled={save.isPending}>Opslaan</Button>
    </div>
  );
}

export function MethodesTab() {
  const { data: artikelen = [], isLoading } = useArtikelen();
  const { data: alleMethodes = [] } = useAlleMethodes();
  const { data: recepten = [] } = useRecipes('', null);
  const [zoek, setZoek] = useState('');
  const [bewerk, setBewerk] = useState<{ id: string; naam: string } | null>(null);

  const halffabricaten = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return artikelen
      .filter((a) => a.soort === 'halffabricaat' || a.recept_id)
      .filter((a) => (q ? a.naam.toLowerCase().includes(q) : true));
  }, [artikelen, zoek]);

  // Methodes op recepten zonder voorraadartikel (bv. croissant afbakken: direct verkoop).
  const overigeMethodes = useMemo(() => {
    const receptMetArtikel = new Set(artikelen.map((a) => a.recept_id).filter(Boolean));
    const namen = new Map(recepten.map((r: any) => [r.id, r.name]));
    const gezien = new Set<string>();
    return alleMethodes
      .filter((m) => !receptMetArtikel.has(m.recept_id))
      .filter((m) => (gezien.has(m.recept_id) ? false : (gezien.add(m.recept_id), true)))
      .map((m) => ({
        recept_id: m.recept_id,
        naam: namen.get(m.recept_id) ?? 'Onbekend recept',
        type: m.type,
        naarVoorraad: m.output_gaat_op_voorraad,
      }));
  }, [alleMethodes, artikelen, recepten]);

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="font-semibold mb-1">Methodes</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Bij "Op voorraad" wordt de output-eenheid automatisch de basis-eenheid van het artikel.
        "Direct verkoop" (bv. afbakken) raakt de voorraad niet.
      </p>
      <Input
        value={zoek}
        onChange={(e) => setZoek(e.target.value)}
        placeholder="Zoek halffabricaat…"
        className="h-11 mb-3 max-w-sm"
      />
      {isLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">Laden…</div>
      ) : halffabricaten.length === 0 ? (
        <p className="text-sm text-muted-foreground">Geen halffabricaten gevonden.</p>
      ) : (
        halffabricaten.map((a) => <MethodeRij key={a.id} artikel={a} />)
      )}

      {overigeMethodes.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Methodes zonder voorraadartikel</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Ingevuld vanuit het receptenscherm (bv. afbakken of ontdooien van ingekocht product).
          </p>
          {overigeMethodes.map((m) => (
            <div key={m.recept_id} className="flex items-center gap-2 border-b border-border py-2.5">
              <span className="flex-1 text-sm font-medium">{m.naam}</span>
              <Badge variant="secondary" className="text-xs">{m.type}</Badge>
              <Badge variant={m.naarVoorraad ? 'secondary' : 'outline'} className="text-xs">
                {m.naarVoorraad ? 'Voorraad' : 'Direct'}
              </Badge>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setBewerk({ id: m.recept_id, naam: m.naam })}>
                Bewerk
              </Button>
            </div>
          ))}
        </div>
      )}

      <MethodeDialog
        receptId={bewerk?.id ?? null}
        receptNaam={bewerk?.naam ?? ''}
        open={!!bewerk}
        onOpenChange={(v) => !v && setBewerk(null)}
      />
    </Card>
  );
}
