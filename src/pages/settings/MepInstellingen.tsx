import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Search } from 'lucide-react';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useHalffabricaatOverzicht } from '@/hooks/useMepTaken';
import { useVestigingKoppelingen } from '@/hooks/useVestigingKoppeling';
import { VestigingToggles } from '@/components/kitchen/VestigingKoppeling';
import { OpendagenTab } from '@/pages/kitchen/MepBeheer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMepHandelingenBeheer } from '@/hooks/useMepPlanning';
import { toast } from 'sonner';

function HandelingenTab({ location }: { location: string }) {
  const { handelingen, loading, opslaan } = useMepHandelingenBeheer(location);
  const [nieuw, setNieuw] = useState('');

  const voegToe = async () => {
    const naam = nieuw.trim();
    if (naam.length < 2) return;
    try {
      await opslaan.mutateAsync({ naam });
      setNieuw('');
      toast.success(`${naam} toegevoegd`);
    } catch (e: any) {
      toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  const wissel = async (h: { id: string; naam: string; actief: boolean }) => {
    try {
      await opslaan.mutateAsync({ id: h.id, naam: h.naam, actief: !h.actief });
    } catch (e: any) {
      toast.error('Opslaan mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Handelingen gelden voor élk item op de MEP-lijst: recepten én vrije items zoals lente-ui
          of zout. Je kiest de handeling bij het toevoegen of achteraf op de taak.
        </p>
        <div className="flex gap-2">
          <Input
            value={nieuw}
            onChange={(e) => setNieuw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                voegToe();
              }
            }}
            placeholder="Nieuwe handeling, bijv. Marineren"
            className="h-11"
          />
          <Button className="h-11" onClick={voegToe} disabled={opslaan.isPending}>
            Toevoegen
          </Button>
        </div>
      </Card>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
      ) : (
        <Card className="divide-y divide-border/60 overflow-hidden">
          {handelingen.map((h: any) => (
            <div key={h.id} className="flex items-center gap-3 p-4 min-h-[60px]">
              <span className="flex-1 text-[15px] font-medium">{h.naam}</span>
              <Label htmlFor={`h-${h.id}`} className="text-sm text-muted-foreground">
                {h.actief ? 'Actief' : 'Uit'}
              </Label>
              <Switch
                id={`h-${h.id}`}
                checked={h.actief}
                onCheckedChange={() => wissel(h)}
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function HalffabricatenTab() {
  const { data: methodes = [], isLoading } = useHalffabricaatOverzicht();
  const { data: koppelingen } = useVestigingKoppelingen('recept');
  const [zoek, setZoek] = useState('');

  const perRecept = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    const map = new Map<string, { naam: string; categorie: string; rijen: typeof methodes }>();
    for (const m of methodes) {
      if (q && !m.recept_naam.toLowerCase().includes(q) && !m.type.toLowerCase().includes(q)) continue;
      if (!map.has(m.recept_id)) {
        map.set(m.recept_id, { naam: m.recept_naam, categorie: m.categorie, rijen: [] });
      }
      map.get(m.recept_id)!.rijen.push(m);
    }
    return [...map.entries()].sort((a, b) => a[1].naam.localeCompare(b[1].naam, 'nl'));
  }, [methodes, zoek]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder="Zoek halffabricaat of handeling"
            className="pl-9 h-11"
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Halffabricaten zijn bedrijfsbreed. Met de schakelaars bepaal je per keuken of ze in de
          MEP-bibliotheek verschijnen. Handelingen zelf beheer je op het recept.
        </p>
      </Card>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
      ) : perRecept.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nog geen halffabricaten. Voeg een handeling toe op een recept om hem hier te zien.
        </Card>
      ) : (
        <Card className="divide-y divide-border/60 overflow-hidden">
          {perRecept.map(([receptId, r]) => (
            <div key={receptId} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/kitchen/recipes/${receptId}`}
                    className="inline-flex items-center gap-1 text-[15px] font-medium hover:text-primary"
                  >
                    {r.naam}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                  <p className="text-xs text-muted-foreground">{r.categorie}</p>
                </div>
                <VestigingToggles
                  soort="recept"
                  id={receptId}
                  actieve={koppelingen?.get(receptId) ?? new Set<string>()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {r.rijen.map((m) => (
                  <Badge key={m.id} variant="secondary" className="font-normal">
                    {m.type} · 1 {m.visuele_eenheid} = {m.output_hoeveelheid} {m.output_eenheid}
                    {m.houdbaarheid ? ` · ${m.houdbaarheid} dg` : ''}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export default function MepInstellingen() {
  const { userLocation } = useUserLocation();

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mise-en-place</h1>
          <p className="text-sm text-muted-foreground">
            Halffabricaten en keukendagen voor {userLocation}
          </p>
        </div>

        <Tabs defaultValue="halffabricaten">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="halffabricaten">Halffabricaten</TabsTrigger>
            <TabsTrigger value="handelingen">Handelingen</TabsTrigger>
            <TabsTrigger value="dagen">Openingsdagen</TabsTrigger>
          </TabsList>
          <TabsContent value="halffabricaten" className="mt-4">
            <HalffabricatenTab />
          </TabsContent>
          <TabsContent value="handelingen" className="mt-4">
            <HandelingenTab location={userLocation ?? ''} />
          </TabsContent>
          <TabsContent value="dagen" className="mt-4">
            <OpendagenTab location={userLocation} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
