import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  useInterneLeverdagen,
  useKetenInstellingen,
  useLeverdagMutatie,
  useUpdateKetenInstelling,
  VESTIGINGEN,
} from '@/hooks/useKeten';

const DAGEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

export function LeverdagenTab() {
  const { data: dagen = [], isLoading } = useInterneLeverdagen();
  const mut = useLeverdagMutatie();
  const { data: instellingen = [] } = useKetenInstellingen();
  const updateInstelling = useUpdateKetenInstelling();

  const [van, setVan] = useState('West');
  const [naar, setNaar] = useState('Midsland');
  const [weekdag, setWeekdag] = useState('4');
  const [deadline, setDeadline] = useState('12:00');

  const toevoegen = async () => {
    try {
      await mut.mutateAsync({
        van_vestiging: van,
        naar_vestiging: naar,
        weekdag: Number(weekdag),
        deadline_tijd: deadline || null,
        actief: true,
      });
      toast.success('Leverdag toegevoegd');
    } catch (e: any) {
      toast.error(e?.message ?? 'Toevoegen mislukt');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <h3 className="font-semibold mb-3">Interne leverdagen</h3>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Laden…</div>
        ) : dagen.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-3">Nog geen interne leverdagen vastgelegd.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {dagen.map((d) => (
              <div key={d.id} className="flex items-center justify-between bg-muted/40 rounded-polar-sm px-3 py-2 text-sm">
                <span>
                  {d.van_vestiging} → {d.naar_vestiging} · {DAGEN[d.weekdag]}
                  {d.deadline_tijd ? ` · deadline ${String(d.deadline_tijd).slice(0, 5)}` : ''}
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
        )}

        <div className="flex flex-wrap gap-2 items-end">
          <div className="w-36">
            <label className="text-xs text-muted-foreground">Van (vraagt)</label>
            <Select value={van} onValueChange={setVan}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{VESTIGINGEN.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <label className="text-xs text-muted-foreground">Naar (levert)</label>
            <Select value={naar} onValueChange={setNaar}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{VESTIGINGEN.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground">Weekdag</label>
            <Select value={weekdag} onValueChange={setWeekdag}>
              <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAGEN.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <label className="text-xs text-muted-foreground">Deadline</label>
            <Input type="time" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11 mt-1" />
          </div>
          <Button className="h-11" onClick={toevoegen}><Plus className="h-4 w-4 mr-1" /> Toevoegen</Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <h3 className="font-semibold mb-1">Kalibratie per bestelronde</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Aantal artikelen dat het systeem later per bestelronde laat natellen (0 = uit).
        </p>
        <div className="flex flex-wrap gap-4">
          {instellingen.map((i) => (
            <div key={i.id} className="w-40">
              <label className="text-xs text-muted-foreground">{i.vestiging}</label>
              <Input
                type="number"
                min={0}
                defaultValue={i.cycle_count_aantal}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n >= 0 && n !== i.cycle_count_aantal) {
                    updateInstelling.mutate({ id: i.id, cycle_count_aantal: n });
                  }
                }}
                className="h-11 mt-1"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
