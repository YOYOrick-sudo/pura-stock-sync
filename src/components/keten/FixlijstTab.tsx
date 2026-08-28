import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAlleMethodes } from '@/hooks/useHalffabricaatMethodes';
import {
  useArtikelen,
  useEenheden,
  useLogboek,
  useLogboekAfronden,
  useReceptRegels,
  useSaveArtikel,
  useUpdateReceptRegel,
  type LogboekRegel,
} from '@/hooks/useKeten';

function PrioBadge() {
  return (
    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
      Methode
    </Badge>
  );
}

function ReceptRegel({ regel, log, prioriteit }: { regel: any; log: LogboekRegel; prioriteit?: boolean }) {

  const { data: eenheden = [] } = useEenheden();
  const update = useUpdateReceptRegel();
  const afronden = useLogboekAfronden();
  const [waarde, setWaarde] = useState(
    regel?.hoeveelheid_num != null ? String(regel.hoeveelheid_num) : '',
  );
  const [eenheidId, setEenheidId] = useState<string>(regel?.eenheid_id ?? '');

  const opslaan = async () => {
    const patch: Record<string, unknown> = {};
    if (waarde.trim()) {
      const n = Number(waarde.replace(',', '.'));
      if (!Number.isFinite(n)) {
        toast.error('Vul één exact getal in (geen bereik)');
        return;
      }
      patch.hoeveelheid_num = n;
    }
    if (eenheidId) patch.eenheid_id = eenheidId;
    if (Object.keys(patch).length === 0) {
      toast.error('Niets ingevuld');
      return;
    }
    try {
      await update.mutateAsync({ id: regel.id, ...patch });
      await afronden.mutateAsync(log.id);
      toast.success('Opgelost');
    } catch (e: any) {
      toast.error(e?.message ?? 'Opslaan mislukt');
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border py-3">
      <div className="min-w-[220px] flex-1">
        <div className="text-sm font-medium">{regel?.naam ?? '—'}</div>
        <div className="text-xs text-muted-foreground">
          {regel?.recipes?.name ?? 'onbekend recept'} · oorspronkelijk: "{log.ruwe_waarde || '(leeg)'}"
        </div>
      </div>
      <div className="w-28">
        <Input
          value={waarde}
          onChange={(e) => setWaarde(e.target.value)}
          placeholder="hoeveelheid"
          inputMode="decimal"
          className="h-11"
        />
      </div>
      <div className="w-40">
        <Select value={eenheidId} onValueChange={setEenheidId}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Eenheid" /></SelectTrigger>
          <SelectContent>
            {eenheden.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.naam} ({e.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="h-11" onClick={opslaan} disabled={update.isPending}>Opslaan</Button>
    </div>
  );
}

function ArtikelBasisEenheid({ log }: { log: LogboekRegel }) {
  const { data: eenheden = [] } = useEenheden();
  const { data: artikelen = [] } = useArtikelen();
  const artikel = artikelen.find((a) => a.id === log.bron_id);
  const save = useSaveArtikel();
  const afronden = useLogboekAfronden();
  const [eenheidId, setEenheidId] = useState<string>(artikel?.basis_eenheid_id ?? '');

  const opslaan = async () => {
    if (!eenheidId) {
      toast.error('Kies een eenheid');
      return;
    }
    try {
      await save.mutateAsync({ id: log.bron_id, naam: artikel?.naam ?? '', basis_eenheid_id: eenheidId } as any);
      await afronden.mutateAsync(log.id);
      toast.success('Opgelost');
    } catch (e: any) {
      toast.error(e?.message ?? 'Opslaan mislukt');
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 border-b border-border py-3">
      <div className="min-w-[220px] flex-1">
        <div className="text-sm font-medium">{artikel?.naam ?? log.ruwe_waarde}</div>
        <div className="text-xs text-muted-foreground">{log.reden}</div>
      </div>
      <div className="w-40">
        <Select value={eenheidId} onValueChange={setEenheidId}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Basis-eenheid" /></SelectTrigger>
          <SelectContent>
            {eenheden.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.naam} ({e.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="h-11" onClick={opslaan} disabled={save.isPending}>Opslaan</Button>
    </div>
  );
}

export function FixlijstTab() {
  const { data: logboek = [], isLoading } = useLogboek(true);
  const { data: alleMethodes = [] } = useAlleMethodes();
  const { data: alleArtikelen = [] } = useArtikelen();
  const receptIds = useMemo(
    () => logboek.filter((l) => l.bron_tabel === 'recept_ingredienten').map((l) => l.bron_id),
    [logboek],
  );
  const { data: regels = [] } = useReceptRegels(receptIds);
  const regelMap = useMemo(() => new Map(regels.map((r: any) => [r.id, r])), [regels]);

  /** Recepten waarvoor een methode bestaat — die regels blokkeren straks het boeken van verbruik. */
  const methodeRecepten = useMemo(
    () => new Set(alleMethodes.map((m) => m.recept_id)),
    [alleMethodes],
  );
  const artikelMap = useMemo(
    () => new Map(alleArtikelen.map((a: any) => [a.id, a])),
    [alleArtikelen],
  );

  const heeftMethode = (l: LogboekRegel) => {
    if (l.bron_tabel === 'recept_ingredienten') {
      const receptId = regelMap.get(l.bron_id)?.recept_id;
      return !!receptId && methodeRecepten.has(receptId);
    }
    if (l.bron_tabel === 'artikelen') {
      const receptId = artikelMap.get(l.bron_id)?.recept_id;
      return !!receptId && methodeRecepten.has(receptId);
    }
    return false;
  };

  /** Standaardsortering: regels van recepten mét methode bovenaan. */
  const sorteer = (rijen: LogboekRegel[]) =>
    [...rijen].sort((a, b) => Number(heeftMethode(b)) - Number(heeftMethode(a)));

  const recept = sorteer(logboek.filter((l) => l.bron_tabel === 'recept_ingredienten'));
  const artikel = sorteer(logboek.filter((l) => l.bron_tabel === 'artikelen'));

  if (isLoading) return <div className="py-10 text-center text-sm text-muted-foreground">Laden…</div>;

  if (logboek.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="h-8 w-8 mx-auto text-primary mb-2" />
        <p className="text-sm font-medium">Alle logboekregels zijn opgelost.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recept.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold mb-1">Receptregels ({recept.length})</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Regels van recepten met een methode staan bovenaan — die blokkeren straks het boeken van verbruik.
          </p>
          {recept.map((l) => (
            <ReceptRegel
              key={l.id}
              log={l}
              regel={regelMap.get(l.bron_id)}
              prioriteit={heeftMethode(l)}
            />
          ))}
        </Card>
      )}

      {artikel.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h3 className="font-semibold mb-1">Basiseenheden ({artikel.length})</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Bij halffabricaten vult het invullen van de methode dit automatisch. Artikelen van een recept met
            methode staan bovenaan.
          </p>
          {artikel.map((l) => (
            <ArtikelBasisEenheid key={l.id} log={l} prioriteit={heeftMethode(l)} />
          ))}
        </Card>
      )}

    </div>
  );
}
