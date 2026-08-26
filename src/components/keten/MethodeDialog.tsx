import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { METHODE_TYPES, useMethodes, useSaveMethode } from '@/hooks/useHalffabricaatMethodes';
import { useArtikelen, useEenheden, useLogboek, useLogboekAfronden, useSaveArtikel } from '@/hooks/useKeten';

interface Props {
  receptId: string | null;
  receptNaam: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Methode invullen vanuit het recept zelf: handeling, output, houdbaarheid, leadtime.
 * De output-eenheid wordt automatisch de basis-eenheid van het gekoppelde artikel.
 */
export function MethodeDialog({ receptId, receptNaam, open, onOpenChange }: Props) {
  const { data: methodes = [] } = useMethodes(open && receptId ? receptId : undefined);
  const { data: eenheden = [] } = useEenheden();
  const { data: artikelen = [] } = useArtikelen();
  const { data: logboek = [] } = useLogboek(true);
  const save = useSaveMethode();
  const saveArtikel = useSaveArtikel();
  const afronden = useLogboekAfronden();

  const bestaand = methodes[0];
  const artikel = artikelen.find((a) => a.recept_id === receptId);

  const [type, setType] = useState('Bereiden');
  const [outputHoeveelheid, setOutputHoeveelheid] = useState('');
  const [outputEenheid, setOutputEenheid] = useState('');
  const [houdbaarheid, setHoudbaarheid] = useState('');
  const [leadtime, setLeadtime] = useState('');

  useEffect(() => {
    if (!open) return;
    setType(bestaand?.type ?? 'Bereiden');
    setOutputHoeveelheid(bestaand?.output_hoeveelheid != null ? String(bestaand.output_hoeveelheid) : '');
    setOutputEenheid(bestaand?.output_eenheid ?? '');
    setHoudbaarheid(bestaand?.houdbaarheid != null ? String(bestaand.houdbaarheid) : '');
    setLeadtime(
      (bestaand as any)?.productie_leadtime_dagen != null
        ? String((bestaand as any).productie_leadtime_dagen)
        : '',
    );
  }, [open, bestaand?.id]);

  const opslaan = async () => {
    if (!receptId) return;
    const hoeveelheid = Number(outputHoeveelheid.replace(',', '.'));
    if (!outputEenheid || !Number.isFinite(hoeveelheid) || hoeveelheid <= 0) {
      toast.error('Vul output-hoeveelheid en -eenheid in');
      return;
    }
    try {
      await save.mutateAsync({
        id: bestaand?.id,
        recept_id: receptId,
        type,
        visuele_eenheid: bestaand?.visuele_eenheid ?? outputEenheid,
        output_hoeveelheid: hoeveelheid,
        output_eenheid: outputEenheid,
        standaard_duur: bestaand?.standaard_duur ?? 0,
        houdbaarheid: houdbaarheid ? Number(houdbaarheid) : null,
        productie_leadtime_dagen: leadtime ? Number(leadtime) : 0,
      } as any);

      const eenheid = eenheden.find((e) => e.code === outputEenheid);
      if (artikel && eenheid) {
        await saveArtikel.mutateAsync({
          id: artikel.id,
          naam: artikel.naam,
          basis_eenheid_id: eenheid.id,
        } as any);
        const log = logboek.find((l) => l.bron_tabel === 'artikelen' && l.bron_id === artikel.id);
        if (log) await afronden.mutateAsync(log.id);
      }
      toast.success('Methode opgeslagen');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? 'Opslaan mislukt');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Methode — {receptNaam}</DialogTitle>
          <DialogDescription>
            Hoe wordt dit gemaakt en wat levert het op? De output-eenheid wordt de basis-eenheid van het artikel.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Handeling</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Output-hoeveelheid</Label>
            <Input
              value={outputHoeveelheid}
              onChange={(e) => setOutputHoeveelheid(e.target.value)}
              inputMode="decimal"
              placeholder="bijv. 3"
              className="h-11 mt-1"
            />
          </div>
          <div>
            <Label>Output-eenheid</Label>
            <Select value={outputEenheid} onValueChange={setOutputEenheid}>
              <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Kies" /></SelectTrigger>
              <SelectContent>
                {eenheden.map((e) => <SelectItem key={e.id} value={e.code}>{e.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Houdbaarheid (dagen)</Label>
            <Input
              value={houdbaarheid}
              onChange={(e) => setHoudbaarheid(e.target.value)}
              inputMode="numeric"
              className="h-11 mt-1"
            />
          </div>
          <div>
            <Label>Leadtime (dagen)</Label>
            <Input
              value={leadtime}
              onChange={(e) => setLeadtime(e.target.value)}
              inputMode="numeric"
              className="h-11 mt-1"
            />
          </div>
        </div>

        {!artikel && (
          <p className="text-xs text-muted-foreground">
            Er hangt nog geen voorraadartikel aan dit recept; de basis-eenheid wordt dan niet automatisch gezet.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" className="min-h-[44px]" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button className="min-h-[44px]" onClick={opslaan} disabled={save.isPending}>
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
