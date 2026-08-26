import { useState } from 'react';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserLocation } from '@/contexts/UserLocationContext';
import {
  useMepTemplates,
  useMepHandelingen,
  useMepHandelingenBeheer,
  useMepOpendagenBeheer,
  MepTemplate,
} from '@/hooks/useMepPlanning';

const DAGEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const PRIOS = [
  { waarde: 1, label: 'Moet' },
  { waarde: 2, label: 'Normaal' },
  { waarde: 3, label: 'Later' },
];

function TemplatesTab({ location }: { location: string }) {
  const { templates, opslaan, verwijderen } = useMepTemplates(location);
  const { data: handelingen = [] } = useMepHandelingen(location);
  const [titel, setTitel] = useState('');
  const [weekdag, setWeekdag] = useState('dagelijks');
  const [handeling, setHandeling] = useState('geen');
  const [aantal, setAantal] = useState('1');
  const [eenheid, setEenheid] = useState('');
  const [prioriteit, setPrioriteit] = useState('2');
  const [notitie, setNotitie] = useState('');

  const toevoegen = () => {
    if (!titel.trim()) return;
    opslaan.mutate(
      {
        titel: titel.trim(),
        weekdag: weekdag === 'dagelijks' ? null : Number(weekdag),
        handeling: handeling === 'geen' ? null : handeling,
        aantal: Number(aantal) || 1,
        eenheid: eenheid.trim() || null,
        prioriteit: Number(prioriteit),
        notitie: notitie.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success('Template toegevoegd');
          setTitel('');
          setNotitie('');
          setEenheid('');
          setAantal('1');
        },
        onError: () => toast.error('Opslaan mislukt'),
      },
    );
  };

  const groepen: { key: string; label: string; items: MepTemplate[] }[] = [
    { key: 'dagelijks', label: 'Elke open dag', items: templates.filter((t) => t.weekdag === null) },
    ...DAGEN.map((d, i) => ({ key: String(i), label: d, items: templates.filter((t) => t.weekdag === i) })),
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Nieuwe template</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="tpl-titel">Halfproduct of taak</Label>
            <Input id="tpl-titel" value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="Bijv. Kip vacumeren" />
          </div>
          <div className="space-y-2">
            <Label>Dag</Label>
            <Select value={weekdag} onValueChange={setWeekdag}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dagelijks">Elke open dag</SelectItem>
                {DAGEN.map((d, i) => (
                  <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Handeling</Label>
            <Select value={handeling} onValueChange={setHandeling}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="geen">Geen</SelectItem>
                {handelingen.map((h) => (
                  <SelectItem key={h.id} value={h.naam}>{h.naam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-aantal">Aantal</Label>
            <Input id="tpl-aantal" type="number" min="1" value={aantal} onChange={(e) => setAantal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tpl-eenheid">Eenheid</Label>
            <Input id="tpl-eenheid" value={eenheid} onChange={(e) => setEenheid(e.target.value)} placeholder="bakken" />
          </div>
          <div className="space-y-2">
            <Label>Prioriteit</Label>
            <Select value={prioriteit} onValueChange={setPrioriteit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIOS.map((p) => (
                  <SelectItem key={p.waarde} value={String(p.waarde)}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tpl-notitie">Notitie</Label>
          <Input id="tpl-notitie" value={notitie} onChange={(e) => setNotitie(e.target.value)} placeholder="Bijv. dubbele portie in het weekend" />
        </div>
        <Button onClick={toevoegen} disabled={!titel.trim()} className="h-11">
          <Plus className="h-4 w-4 mr-2" /> Toevoegen
        </Button>
      </Card>

      {groepen
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <Card key={g.key} className="p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">{g.label}</p>
            {g.items.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{t.titel}</span>
                    {t.handeling && <Badge variant="outline" className="text-[11px]">{t.handeling}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {t.aantal ?? 1} {t.eenheid ?? ''}
                    </span>
                  </div>
                  {t.notitie && <p className="text-xs text-muted-foreground truncate">{t.notitie}</p>}
                </div>
                <Switch
                  checked={t.actief}
                  onCheckedChange={(v) => opslaan.mutate({ id: t.id, titel: t.titel, actief: v })}
                  aria-label="Actief"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() =>
                    verwijderen.mutate(t.id, { onSuccess: () => toast.success('Template verwijderd') })
                  }
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </Card>
        ))}
    </div>
  );
}

function HandelingenTab({ location }: { location: string }) {
  const { handelingen, opslaan } = useMepHandelingenBeheer(location);
  const [naam, setNaam] = useState('');

  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-2">
        <Input value={naam} onChange={(e) => setNaam(e.target.value)} placeholder="Nieuwe handeling" />
        <Button
          className="h-10"
          disabled={!naam.trim()}
          onClick={() =>
            opslaan.mutate(
              { naam: naam.trim() },
              { onSuccess: () => { toast.success('Toegevoegd'); setNaam(''); }, onError: () => toast.error('Bestaat al') },
            )
          }
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {handelingen.map((h) => (
        <div key={h.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <span className="text-sm text-foreground">{h.naam}</span>
          <Switch
            checked={h.actief}
            onCheckedChange={(v) => opslaan.mutate({ id: h.id, naam: h.naam, actief: v })}
            aria-label="Actief"
          />
        </div>
      ))}
    </Card>
  );
}

function OpendagenTab({ location }: { location: string }) {
  const { dagen, datums, zetWeekdag, zetDatum, verwijderDatum, zetTerug } = useMepOpendagenBeheer(location);
  const [datum, setDatum] = useState('');
  const [reden, setReden] = useState('');
  const [openUitzondering, setOpenUitzondering] = useState(false);

  const isOpen = (i: number) => dagen.find((d) => d.weekdag === i)?.is_open ?? true;

  const opslaan = () => {
    if (!datum) return;
    zetDatum.mutate(
      { datum, reden: reden.trim() || null, isOpenUitzondering: openUitzondering },
      {
        onSuccess: (r) => {
          if (r.verplaatst > 0 && r.naar) {
            toast.success(`${r.verplaatst} regels verplaatst naar ${r.naar}`, {
              action: {
                label: 'Ongedaan maken',
                onClick: () => zetTerug.mutate({ ids: r.ids, datum }),
              },
              duration: 10000,
            });
          } else {
            toast.success('Opgeslagen');
          }
          setDatum('');
          setReden('');
          setOpenUitzondering(false);
        },
        onError: () => toast.error('Opslaan mislukt'),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Open per weekdag</p>
        {DAGEN.map((d, i) => (
          <div key={d} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-foreground">{d}</span>
            <Switch
              checked={isOpen(i)}
              onCheckedChange={(v) => zetWeekdag.mutate({ weekdag: i, isOpen: v })}
              aria-label={`${d} open`}
            />
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Losse dagen</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="sluit-datum">Datum</Label>
            <Input id="sluit-datum" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sluit-reden">Reden</Label>
            <Input id="sluit-reden" value={reden} onChange={(e) => setReden(e.target.value)} placeholder="Besloten feest" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground">Juist open op deze dag</span>
          <Switch checked={openUitzondering} onCheckedChange={setOpenUitzondering} aria-label="Open-uitzondering" />
        </div>
        <Button className="h-11" disabled={!datum} onClick={opslaan}>Opslaan</Button>

        {datums.map((d) => (
          <div key={d.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div>
              <p className="text-sm text-foreground">{d.datum}</p>
              <p className="text-xs text-muted-foreground">
                {d.is_open_uitzondering ? 'Juist open' : 'Gesloten'}{d.reden ? ` · ${d.reden}` : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => verwijderDatum.mutate(d.datum, { onSuccess: () => toast.success('Verwijderd') })}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function MepBeheer() {
  const { userLocation } = useUserLocation();

  return (
    <KitchenLayout title="Mise-en-place beheren" subtitle={userLocation} backTo="/kitchen/mep" backLabel="Mise-en-place">
      <Tabs defaultValue="templates">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="handelingen">Handelingen</TabsTrigger>
          <TabsTrigger value="dagen">Openingsdagen</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-4"><TemplatesTab location={userLocation} /></TabsContent>
        <TabsContent value="handelingen" className="mt-4"><HandelingenTab location={userLocation} /></TabsContent>
        <TabsContent value="dagen" className="mt-4"><OpendagenTab location={userLocation} /></TabsContent>
      </Tabs>
    </KitchenLayout>
  );
}
