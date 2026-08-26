import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { METHODE_TYPES, useMethodes, useSaveMethode } from '@/hooks/useHalffabricaatMethodes';
import {
  useArtikelen,
  useEenheden,
  useLogboek,
  useLogboekAfronden,
  useSaveArtikel,
} from '@/hooks/useKeten';

function MethodeRij({ artikel }: { artikel: { id: string; naam: string; recept_id: string | null } }) {
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
      } as any);

      // Basis-eenheid volgt automatisch uit de output-eenheid.
      const eenheid = eenheden.find((e) => e.code === outputEenheid);
      if (eenheid) {
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
      <div className="min-w-[180px] flex-1 text-sm font-medium">{artikel.naam}</div>
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
      <Button className="h-11" onClick={opslaan} disabled={save.isPending}>Opslaan</Button>
    </div>
  );
}

export function MethodesTab() {
  const { data: artikelen = [], isLoading } = useArtikelen();
  const [zoek, setZoek] = useState('');

  const halffabricaten = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return artikelen
      .filter((a) => a.soort === 'halffabricaat' || a.recept_id)
      .filter((a) => (q ? a.naam.toLowerCase().includes(q) : true));
  }, [artikelen, zoek]);

  return (
    <Card className="p-4 sm:p-5">
      <h3 className="font-semibold mb-1">Halffabricaat-methodes</h3>
      <p className="text-xs text-muted-foreground mb-3">
        De output-eenheid wordt automatisch de basis-eenheid van het artikel.
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
    </Card>
  );
}
