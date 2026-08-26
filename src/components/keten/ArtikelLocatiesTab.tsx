import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AANVUL_BRONNEN,
  useArtikelLocaties,
  useArtikelen,
  useUpdateArtikelLocatie,
  VESTIGINGEN,
  type ArtikelLocatie,
} from '@/hooks/useKeten';

const GEEN = '__geen__';

function NumCel({ rij, veld }: { rij: ArtikelLocatie; veld: 'min_voorraad' | 'max_voorraad' | 'tel_volgorde' }) {
  const update = useUpdateArtikelLocatie();
  return (
    <Input
      defaultValue={rij[veld] ?? ''}
      inputMode="decimal"
      className="h-10 w-24"
      onBlur={(e) => {
        const raw = e.target.value.trim();
        const val = raw === '' ? null : Number(raw.replace(',', '.'));
        if (val !== null && !Number.isFinite(val)) return;
        if (val === (rij[veld] ?? null)) return;
        update.mutate({ id: rij.id, [veld]: val } as any);
      }}
    />
  );
}

export function ArtikelLocatiesTab() {
  const [vestiging, setVestiging] = useState<string>('West');
  const [zoek, setZoek] = useState('');
  const { data: artikelen = [] } = useArtikelen();
  const { data: locaties = [], isLoading } = useArtikelLocaties(vestiging);
  const update = useUpdateArtikelLocatie();

  const naamVan = useMemo(() => new Map(artikelen.map((a) => [a.id, a.naam])), [artikelen]);

  const rijen = useMemo(() => {
    const q = zoek.trim().toLowerCase();
    return [...locaties]
      .filter((l) => (q ? (naamVan.get(l.artikel_id) ?? '').toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const ta = a.tel_volgorde ?? 9999;
        const tb = b.tel_volgorde ?? 9999;
        if (ta !== tb) return ta - tb;
        return (naamVan.get(a.artikel_id) ?? '').localeCompare(naamVan.get(b.artikel_id) ?? '', 'nl');
      });
  }, [locaties, zoek, naamVan]);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={vestiging} onValueChange={setVestiging}>
          <SelectTrigger className="h-11 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{VESTIGINGEN.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Input
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="Zoek artikel…"
          className="h-11 max-w-sm"
        />
        <span className="text-xs text-muted-foreground">{rijen.length} artikelen</span>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Laden…</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artikel</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Aanvul-bron</TableHead>
                <TableHead>Bron-vestiging</TableHead>
                <TableHead>Opslag</TableHead>
                <TableHead>Telvolgorde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rijen.map((rij) => (
                <TableRow key={rij.id} className="h-[56px]">
                  <TableCell className="font-medium">{naamVan.get(rij.artikel_id) ?? '—'}</TableCell>
                  <TableCell><NumCel rij={rij} veld="min_voorraad" /></TableCell>
                  <TableCell><NumCel rij={rij} veld="max_voorraad" /></TableCell>
                  <TableCell>
                    <Select
                      value={rij.aanvul_bron ?? GEEN}
                      onValueChange={(v) => update.mutate({ id: rij.id, aanvul_bron: v === GEEN ? null : v })}
                    >
                      <SelectTrigger className="h-10 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GEEN}>Onbekend</SelectItem>
                        {AANVUL_BRONNEN.map((b) => <SelectItem key={b} value={b}>{b.replace('_', ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={rij.bron_vestiging ?? GEEN}
                      onValueChange={(v) => update.mutate({ id: rij.id, bron_vestiging: v === GEEN ? null : v })}
                    >
                      <SelectTrigger className="h-10 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GEEN}>—</SelectItem>
                        {VESTIGINGEN.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      defaultValue={rij.opslag_locatie ?? ''}
                      className="h-10 w-36"
                      onBlur={(e) => {
                        const v = e.target.value.trim() || null;
                        if (v !== (rij.opslag_locatie ?? null)) update.mutate({ id: rij.id, opslag_locatie: v });
                      }}
                    />
                  </TableCell>
                  <TableCell><NumCel rij={rij} veld="tel_volgorde" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
