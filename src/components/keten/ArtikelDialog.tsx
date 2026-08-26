import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  ARTIKEL_SOORTEN,
  useArtikelEenheden,
  useArtikelen,
  useDeleteArtikelEenheid,
  useEenheden,
  useSaveArtikel,
  useSaveArtikelEenheid,
} from '@/hooks/useKeten';

const GEEN = '__geen__';

export function ArtikelDialog({
  artikelId,
  open,
  onOpenChange,
}: {
  artikelId: string | null; // null = nieuw
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: artikelen = [] } = useArtikelen();
  const { data: eenheden = [] } = useEenheden();
  const artikel = artikelId ? artikelen.find((a) => a.id === artikelId) : undefined;

  const [naam, setNaam] = useState('');
  const [soort, setSoort] = useState<string>(GEEN);
  const [categorie, setCategorie] = useState('');
  const [basisEenheid, setBasisEenheid] = useState<string>(GEEN);
  const [isVoorraad, setIsVoorraad] = useState(true);

  const saveArtikel = useSaveArtikel();
  const [nieuwId, setNieuwId] = useState<string | null>(null);
  const effectiefId = artikelId ?? nieuwId;

  const { data: artikelEenheden = [] } = useArtikelEenheden(effectiefId ?? undefined);
  const saveEenheid = useSaveArtikelEenheid();
  const delEenheid = useDeleteArtikelEenheid();

  const [nieuwEenheidId, setNieuwEenheidId] = useState<string>('');
  const [nieuwFactor, setNieuwFactor] = useState('');
  const [nieuwRendement, setNieuwRendement] = useState('');

  useEffect(() => {
    if (!open) return;
    setNieuwId(null);
    setNaam(artikel?.naam ?? '');
    setSoort(artikel?.soort ?? GEEN);
    setCategorie(artikel?.categorie ?? '');
    setBasisEenheid(artikel?.basis_eenheid_id ?? GEEN);
    setIsVoorraad(artikel?.is_voorraad_artikel ?? true);
  }, [open, artikelId, artikel?.naam, artikel?.soort, artikel?.categorie, artikel?.basis_eenheid_id, artikel?.is_voorraad_artikel]);

  const opslaan = async () => {
    if (!naam.trim()) {
      toast.error('Naam is verplicht');
      return;
    }
    try {
      const id = await saveArtikel.mutateAsync({
        id: effectiefId ?? undefined,
        naam: naam.trim(),
        soort: soort === GEEN ? null : soort,
        categorie: categorie.trim() || null,
        basis_eenheid_id: basisEenheid === GEEN ? null : basisEenheid,
        is_voorraad_artikel: isVoorraad,
      } as any);
      setNieuwId(id);
      toast.success('Artikel opgeslagen');
    } catch (e: any) {
      toast.error(e?.message ?? 'Opslaan mislukt');
    }
  };

  const eenheidLabel = (id: string) => {
    const e = eenheden.find((x) => x.id === id);
    return e ? `${e.naam} (${e.code})` : '—';
  };

  const voegEenheidToe = async () => {
    if (!effectiefId) {
      toast.error('Sla het artikel eerst op');
      return;
    }
    const factor = Number(nieuwFactor.replace(',', '.'));
    if (!nieuwEenheidId || !Number.isFinite(factor) || factor <= 0) {
      toast.error('Kies een eenheid en vul een geldige factor in');
      return;
    }
    try {
      await saveEenheid.mutateAsync({
        artikel_id: effectiefId,
        eenheid_id: nieuwEenheidId,
        factor_naar_basis: factor,
        rendement_pct: nieuwRendement ? Number(nieuwRendement.replace(',', '.')) : null,
      } as any);
      setNieuwEenheidId('');
      setNieuwFactor('');
      setNieuwRendement('');
    } catch (e: any) {
      toast.error(e?.message ?? 'Toevoegen mislukt');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{artikelId ? 'Artikel bewerken' : 'Nieuw artikel'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Naam</Label>
            <Input value={naam} onChange={(e) => setNaam(e.target.value)} className="h-11 mt-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Soort</Label>
              <Select value={soort} onValueChange={setSoort}>
                <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Kies" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={GEEN}>Onbekend</SelectItem>
                  {ARTIKEL_SOORTEN.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Categorie</Label>
              <Input value={categorie} onChange={(e) => setCategorie(e.target.value)} className="h-11 mt-1" placeholder="bijv. Zuivel" />
            </div>
            <div>
              <Label>Basis-eenheid</Label>
              <Select value={basisEenheid} onValueChange={setBasisEenheid}>
                <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Kies" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={GEEN}>Nog onbekend</SelectItem>
                  {eenheden.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.naam} ({e.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="voorraad" checked={isVoorraad} onCheckedChange={(v) => setIsVoorraad(Boolean(v))} />
              <Label htmlFor="voorraad" className="cursor-pointer">Voorraadartikel</Label>
            </div>
          </div>

          <div className="rounded-polar-md border border-border p-3">
            <div className="text-sm font-medium mb-2">Eenheden van dit artikel</div>
            {!effectiefId ? (
              <p className="text-xs text-muted-foreground">Sla het artikel eerst op om eenheden toe te voegen.</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {artikelEenheden.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nog geen omrekeningen. Bijv. 1 bak = 2,5 kg.</p>
                  )}
                  {artikelEenheden.map((ae) => (
                    <div key={ae.id} className="flex items-center justify-between text-sm bg-muted/40 rounded-polar-sm px-3 py-2">
                      <span>
                        1 {eenheidLabel(ae.eenheid_id)} = {ae.factor_naar_basis} basis
                        {ae.rendement_pct ? ` · rendement ${ae.rendement_pct}%` : ''}
                      </span>
                      <button
                        onClick={() => delEenheid.mutate(ae.id)}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
                        aria-label="Verwijderen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="min-w-[150px] flex-1">
                    <Label className="text-xs">Eenheid</Label>
                    <Select value={nieuwEenheidId} onValueChange={setNieuwEenheidId}>
                      <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Kies" /></SelectTrigger>
                      <SelectContent>
                        {eenheden.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.naam} ({e.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Factor</Label>
                    <Input value={nieuwFactor} onChange={(e) => setNieuwFactor(e.target.value)} className="h-11 mt-1" placeholder="2,5" inputMode="decimal" />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Rendement %</Label>
                    <Input value={nieuwRendement} onChange={(e) => setNieuwRendement(e.target.value)} className="h-11 mt-1" placeholder="optioneel" inputMode="decimal" />
                  </div>
                  <Button onClick={voegEenheidToe} className="h-11">
                    <Plus className="h-4 w-4 mr-1" /> Toevoegen
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>Sluiten</Button>
            <Button className="h-11" onClick={opslaan} disabled={saveArtikel.isPending}>Opslaan</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
