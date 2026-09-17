import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { KoelcelCheckItem } from '@/hooks/useKoelcelCheck';

/**
 * Beheer van de voorraad-check op de sluitlijst: welke producten standaard in
 * de koelcel moeten liggen (of uit de vriezer gehaald moeten worden), met
 * doelaantal. Per vestiging.
 */
export function VoorraadCheckBeheer({ location }: { location: string }) {
  const qc = useQueryClient();
  const [naam, setNaam] = useState('');
  const [aantal, setAantal] = useState('1');
  const [type, setType] = useState<'koelcel' | 'vriezer'>('koelcel');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['koelcel-check-beheer', location],
    enabled: !!location,
    queryFn: async (): Promise<KoelcelCheckItem[]> => {
      const { data, error } = await supabase
        .from('koelcel_check_items')
        .select('*')
        .eq('vestiging', location)
        .order('type')
        .order('volgorde');
      if (error) throw error;
      return (data ?? []) as KoelcelCheckItem[];
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
        .filter((i) => i.type === type)
        .reduce((m, i) => Math.max(m, Number(i.volgorde ?? 0)), 0);
      const { error } = await supabase.from('koelcel_check_items').insert({
        vestiging: location,
        naam: n,
        doel_aantal: doel,
        eenheid: 'stuks',
        type,
        volgorde: maxVolgorde + 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNaam('');
      setAantal('1');
      toast.success('Item toegevoegd');
      ververs();
    },
    onError: (e: any) => toast.error('Toevoegen mislukt: ' + (e?.message ?? 'onbekende fout')),
  });

  const wisselActief = useMutation({
    mutationFn: async (item: KoelcelCheckItem) => {
      const { error } = await supabase
        .from('koelcel_check_items')
        .update({ actief: !item.actief })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: ververs,
    onError: (e: any) => toast.error('Opslaan mislukt: ' + (e?.message ?? 'onbekende fout')),
  });

  const opslaanAantal = useMutation({
    mutationFn: async ({ id, doel }: { id: string; doel: number }) => {
      const { error } = await supabase
        .from('koelcel_check_items')
        .update({ doel_aantal: Math.max(1, Math.min(99, doel || 1)) })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: ververs,
    onError: (e: any) => toast.error('Opslaan mislukt: ' + (e?.message ?? 'onbekende fout')),
  });

  const groepen: { type: 'koelcel' | 'vriezer'; titel: string; hint: string }[] = [
    { type: 'koelcel', titel: 'Voorraad koelcel', hint: 'Standaard backup die in de koelcel moet liggen.' },
    { type: 'vriezer', titel: 'Uit de vriezer (ontdooien)', hint: 'Wordt bij het afvinken naar de koelcel verplaatst; er print een "Ontdooid"-sticker.' },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          Deze lijst verschijnt op de sluitlijst van {location}. Wat ontbreekt stuurt het team met
          één tik naar de mise-en-place.
        </p>
        <div className="flex gap-2">
          <Input
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Bijv. Gesneden bloemkool"
            className="flex-1"
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
            className="w-16 text-center"
            aria-label="Aantal"
          />
          <Select value={type} onValueChange={(v) => setType(v as 'koelcel' | 'vriezer')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="koelcel">Koelcel</SelectItem>
              <SelectItem value="vriezer">Vriezer</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => toevoegen.mutate()} disabled={toevoegen.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Toevoegen
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laden…</p>
      ) : (
        groepen.map(({ type: t, titel, hint }) => {
          const groep = items.filter((i) => i.type === t);
          return (
            <Card key={t} className="p-4 space-y-2">
              <div>
                <h3 className="font-semibold text-sm">{titel}</h3>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
              {groep.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nog geen items</p>
              ) : (
                <div className="divide-y divide-border">
                  {groep.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2">
                      <span
                        className={
                          item.actief ? 'text-sm font-medium' : 'text-sm text-muted-foreground line-through'
                        }
                      >
                        {item.naam}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {Number(item.doel_aantal)}x
                      </Badge>
                      <Input
                        key={`${item.id}-${item.doel_aantal}`}
                        defaultValue={String(Number(item.doel_aantal))}
                        inputMode="numeric"
                        className="w-16 h-8 text-center ml-auto"
                        aria-label={`Aantal ${item.naam}`}
                        onBlur={(e) => {
                          const v = Number(e.target.value.replace(/[^0-9]/g, ''));
                          if (v && v !== Number(item.doel_aantal)) {
                            opslaanAantal.mutate({ id: item.id, doel: v });
                          }
                        }}
                      />
                      <Switch
                        checked={item.actief}
                        onCheckedChange={() => wisselActief.mutate(item)}
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
