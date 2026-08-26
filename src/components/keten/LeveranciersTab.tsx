import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  LEVERANCIER_KANALEN,
  useArtikelen,
  useBesteldagen,
  useEenheden,
  useLeverancierArtikelen,
  useLeverancierConfigs,
  useLeverancierSubMutatie,
  useLeveranciers,
  useSaveLeverancier,
  VESTIGINGEN,
} from '@/hooks/useKeten';

const DAGEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const BEIDE = '__beide__';

function Besteldagen({ leverancierId }: { leverancierId: string }) {
  const { data: dagen = [] } = useBesteldagen(leverancierId);
  const mut = useLeverancierSubMutatie('leverancier_besteldagen', 'besteldagen');
  const [weekdag, setWeekdag] = useState('1');
  const [vestiging, setVestiging] = useState(BEIDE);
  const [deadline, setDeadline] = useState('10:00');
  const [offset, setOffset] = useState('1');

  return (
    <div>
      <div className="text-sm font-medium mb-2">Besteldagen</div>
      <div className="space-y-2 mb-3">
        {dagen.length === 0 && <p className="text-xs text-muted-foreground">Nog geen besteldagen.</p>}
        {dagen.map((d) => (
          <div key={d.id} className="flex items-center justify-between bg-muted/40 rounded-polar-sm px-3 py-2 text-sm">
            <span>
              {DAGEN[d.weekdag]} · {d.vestiging ?? 'beide vestigingen'}
              {d.deadline_tijd ? ` · deadline ${String(d.deadline_tijd).slice(0, 5)}` : ''} · levering +{d.leverdag_offset}d
            </span>
            <button
              onClick={() => mut.mutate({ id: d.id, verwijder: true })}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Verwijderen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="w-36">
          <Label className="text-xs">Weekdag</Label>
          <Select value={weekdag} onValueChange={setWeekdag}>
            <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{DAGEN.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Label className="text-xs">Vestiging</Label>
          <Select value={vestiging} onValueChange={setVestiging}>
            <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={BEIDE}>Beide</SelectItem>
              {VESTIGINGEN.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <Label className="text-xs">Deadline</Label>
          <Input type="time" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11 mt-1" />
        </div>
        <div className="w-24">
          <Label className="text-xs">Levering +d</Label>
          <Input value={offset} onChange={(e) => setOffset(e.target.value)} inputMode="numeric" className="h-11 mt-1" />
        </div>
        <Button
          className="h-11"
          onClick={() =>
            mut.mutate({
              leverancier_id: leverancierId,
              weekdag: Number(weekdag),
              vestiging: vestiging === BEIDE ? null : vestiging,
              deadline_tijd: deadline || null,
              leverdag_offset: Number(offset) || 1,
            })
          }
        >
          <Plus className="h-4 w-4 mr-1" /> Toevoegen
        </Button>
      </div>
    </div>
  );
}

function VestigingConfigs({ leverancierId }: { leverancierId: string }) {
  const { data: configs = [] } = useLeverancierConfigs(leverancierId);
  const mut = useLeverancierSubMutatie('leverancier_vestiging_config', 'lev-configs');

  return (
    <div>
      <div className="text-sm font-medium mb-1">Per vestiging: klantnummer en sleutel</div>
      <p className="text-xs text-muted-foreground mb-2">
        Vul hier alleen de naam van het opgeslagen secret in (bijv. KOOYMAN_API_KEY_WEST). Nooit wachtwoorden of sleutels zelf.
      </p>
      <div className="space-y-3">
        {VESTIGINGEN.map((v) => {
          const cfg = configs.find((c) => c.vestiging === v);
          return (
            <div key={v} className="rounded-polar-sm border border-border p-3">
              <div className="text-sm font-medium mb-2">{v}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  defaultValue={cfg?.klantnummer ?? ''}
                  placeholder="Klantnummer"
                  className="h-11"
                  onBlur={(e) =>
                    mut.mutate({ id: cfg?.id, leverancier_id: leverancierId, vestiging: v, klantnummer: e.target.value.trim() || null })
                  }
                />
                <Input
                  defaultValue={cfg?.api_sleutel_referentie ?? ''}
                  placeholder="Naam van het secret"
                  className="h-11"
                  onBlur={(e) =>
                    mut.mutate({ id: cfg?.id, leverancier_id: leverancierId, vestiging: v, api_sleutel_referentie: e.target.value.trim() || null })
                  }
                />
                <Input
                  defaultValue={cfg?.portal_login_hint ?? ''}
                  placeholder="Portal-login hint"
                  className="h-11"
                  onBlur={(e) =>
                    mut.mutate({ id: cfg?.id, leverancier_id: leverancierId, vestiging: v, portal_login_hint: e.target.value.trim() || null })
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeverancierArtikelen({ leverancierId }: { leverancierId: string }) {
  const { data: regels = [] } = useLeverancierArtikelen(leverancierId);
  const { data: artikelen = [] } = useArtikelen();
  const { data: eenheden = [] } = useEenheden();
  const mut = useLeverancierSubMutatie('leverancier_artikelen', 'lev-artikelen');
  const naamVan = useMemo(() => new Map(artikelen.map((a) => [a.id, a.naam])), [artikelen]);

  const [artikelId, setArtikelId] = useState('');
  const [nummer, setNummer] = useState('');
  const [besteleenheid, setBesteleenheid] = useState('');
  const [inhoud, setInhoud] = useState('');
  const [prijs, setPrijs] = useState('');

  const toevoegen = () => {
    if (!artikelId) {
      toast.error('Kies een artikel');
      return;
    }
    mut.mutate({
      leverancier_id: leverancierId,
      artikel_id: artikelId,
      artikelnummer: nummer.trim() || null,
      besteleenheid_id: besteleenheid || null,
      inhoud_per_besteleenheid: inhoud ? Number(inhoud.replace(',', '.')) : null,
      netto_prijs: prijs ? Number(prijs.replace(',', '.')) : null,
    });
    setArtikelId('');
    setNummer('');
    setInhoud('');
    setPrijs('');
  };

  return (
    <div>
      <div className="text-sm font-medium mb-2">Artikelen bij deze leverancier</div>
      <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
        {regels.length === 0 && <p className="text-xs text-muted-foreground">Nog geen artikelen gekoppeld.</p>}
        {regels.map((r) => (
          <div key={r.id} className="flex items-center justify-between bg-muted/40 rounded-polar-sm px-3 py-2 text-sm">
            <span>
              {naamVan.get(r.artikel_id) ?? '—'} · {r.artikelnummer ?? 'geen nr'}
              {r.inhoud_per_besteleenheid ? ` · ${r.inhoud_per_besteleenheid} per besteleenheid` : ''}
              {r.netto_prijs ? ` · € ${r.netto_prijs}` : ''}
            </span>
            <button
              onClick={() => mut.mutate({ id: r.id, verwijder: true })}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Verwijderen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <div className="min-w-[200px] flex-1">
          <Label className="text-xs">Artikel</Label>
          <Select value={artikelId} onValueChange={setArtikelId}>
            <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Kies artikel" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {artikelen.map((a) => <SelectItem key={a.id} value={a.id}>{a.naam}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32">
          <Label className="text-xs">Artikelnr.</Label>
          <Input value={nummer} onChange={(e) => setNummer(e.target.value)} className="h-11 mt-1" />
        </div>
        <div className="w-36">
          <Label className="text-xs">Besteleenheid</Label>
          <Select value={besteleenheid} onValueChange={setBesteleenheid}>
            <SelectTrigger className="h-11 mt-1"><SelectValue placeholder="Kies" /></SelectTrigger>
            <SelectContent>{eenheden.map((e) => <SelectItem key={e.id} value={e.id}>{e.code}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-28">
          <Label className="text-xs">Inhoud</Label>
          <Input value={inhoud} onChange={(e) => setInhoud(e.target.value)} inputMode="decimal" className="h-11 mt-1" placeholder="5" />
        </div>
        <div className="w-28">
          <Label className="text-xs">Netto prijs</Label>
          <Input value={prijs} onChange={(e) => setPrijs(e.target.value)} inputMode="decimal" className="h-11 mt-1" />
        </div>
        <Button className="h-11" onClick={toevoegen}><Plus className="h-4 w-4 mr-1" /> Koppelen</Button>
      </div>
    </div>
  );
}

export function LeveranciersTab() {
  const { data: leveranciers = [], isLoading } = useLeveranciers();
  const save = useSaveLeverancier();
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null);
  const [nieuweNaam, setNieuweNaam] = useState('');

  const actief = leveranciers.find((l) => l.id === geselecteerd);

  const aanmaken = async () => {
    if (!nieuweNaam.trim()) return;
    try {
      const id = await save.mutateAsync({ naam: nieuweNaam.trim(), kanaal: 'mail' } as any);
      setNieuweNaam('');
      setGeselecteerd(id);
      toast.success('Leverancier toegevoegd');
    } catch (e: any) {
      toast.error(e?.message ?? 'Toevoegen mislukt');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Leveranciers</h3>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Laden…</div>
        ) : (
          <div className="space-y-1 mb-3">
            {leveranciers.length === 0 && <p className="text-xs text-muted-foreground">Nog geen leveranciers.</p>}
            {leveranciers.map((l) => (
              <button
                key={l.id}
                onClick={() => setGeselecteerd(l.id)}
                className={`w-full text-left px-3 py-2 rounded-polar-sm text-sm min-h-[44px] flex items-center gap-2 ${
                  geselecteerd === l.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                }`}
              >
                <Truck className="h-4 w-4" />
                {l.naam}
                <span className="ml-auto text-xs text-muted-foreground">{l.kanaal}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={nieuweNaam} onChange={(e) => setNieuweNaam(e.target.value)} placeholder="Nieuwe leverancier" className="h-11" />
          <Button className="h-11" onClick={aanmaken}><Plus className="h-4 w-4" /></Button>
        </div>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        {!actief ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Kies een leverancier om de gegevens te beheren.
          </Card>
        ) : (
          <>
            <Card className="p-4 sm:p-5 space-y-3">
              <h3 className="font-semibold">{actief.naam}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Naam</Label>
                  <Input
                    defaultValue={actief.naam}
                    className="h-11 mt-1"
                    onBlur={(e) => e.target.value.trim() && save.mutate({ id: actief.id, naam: e.target.value.trim() } as any)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Kanaal</Label>
                  <Select value={actief.kanaal} onValueChange={(v) => save.mutate({ id: actief.id, naam: actief.naam, kanaal: v } as any)}>
                    <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVERANCIER_KANALEN.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input
                    defaultValue={actief.contact_email ?? ''}
                    className="h-11 mt-1"
                    onBlur={(e) => save.mutate({ id: actief.id, naam: actief.naam, contact_email: e.target.value.trim() || null } as any)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefoon</Label>
                  <Input
                    defaultValue={actief.contact_telefoon ?? ''}
                    className="h-11 mt-1"
                    onBlur={(e) => save.mutate({ id: actief.id, naam: actief.naam, contact_telefoon: e.target.value.trim() || null } as any)}
                  />
                </div>
                {actief.kanaal === 'api' && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs">API basis-URL</Label>
                    <Input
                      defaultValue={actief.api_basis_url ?? ''}
                      className="h-11 mt-1"
                      placeholder="https://api.leverancier.nl"
                      onBlur={(e) => save.mutate({ id: actief.id, naam: actief.naam, api_basis_url: e.target.value.trim() || null } as any)}
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 sm:p-5"><VestigingConfigs leverancierId={actief.id} /></Card>
            <Card className="p-4 sm:p-5"><Besteldagen leverancierId={actief.id} /></Card>
            <Card className="p-4 sm:p-5"><LeverancierArtikelen leverancierId={actief.id} /></Card>
          </>
        )}
      </div>
    </div>
  );
}
