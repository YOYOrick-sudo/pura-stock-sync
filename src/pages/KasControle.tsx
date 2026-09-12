import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Copy, Download, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarLayout } from '@/components/SidebarLayout';
import { devError } from "@/lib/devLog";
import { WisselkassaAanvraagButton } from '@/components/kassa/WisselkassaAanvraagButton';

interface KassaAfdracht {
  id: string;
  created_at: string;
  created_by: string | null;
  location: string;
  type: 'open' | 'sluit';
  week_number: number;
  date: string;
  naam: string;
  kassa_lade_denominations: Record<string, number | string>;
  kassa_lade_total: number;
  wisselkas_denominations: Record<string, number | string>;
  wisselkas_total: number;
  total: number;
  opmerkingen: string | null;
  extra: Record<string, any>;
}

/** Dagregel: één dag × één vestiging, met openen en sluiten naast elkaar. */
interface DagRegel {
  key: string;
  date: string;
  location: string;
  week_number: number;
  open: KassaAfdracht | null;
  sluit: KassaAfdracht | null;
  openDubbel: number;
  sluitDubbel: number;
  cashOmzet: number | null;
  afdracht: number | null;
  kasverschil: number | null;
}

const DENOM_ORDER = ['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'];

/** Drempels voor het kasverschil (in euro). Hier aanpassen als de norm verandert. */
const KASVERSCHIL_OK = 2;
const KASVERSCHIL_LET_OP = 10;

type Niveau = 'ok' | 'letop' | 'hoog';

const niveauVanVerschil = (v: number | null): Niveau | null => {
  if (v == null) return null;
  const abs = Math.abs(v);
  if (abs <= KASVERSCHIL_OK) return 'ok';
  if (abs <= KASVERSCHIL_LET_OP) return 'letop';
  return 'hoog';
};

const NIVEAU_KLEUR: Record<Niveau, string> = {
  ok: 'hsl(var(--primary))',
  letop: 'hsl(var(--warning))',
  hoog: 'hsl(var(--destructive))',
};

const NIVEAU_ACHTERGROND: Record<Niveau, string> = {
  ok: 'hsl(var(--primary) / 0.1)',
  letop: 'hsl(var(--warning) / 0.12)',
  hoog: 'hsl(var(--destructive) / 0.12)',
};

const fmtEuro = (n: number) =>
  `€${Number(n ?? 0).toFixed(2).replace('.', ',')}`;

const fmtEuroSigned = (n: number) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}€${Math.abs(Number(n ?? 0)).toFixed(2).replace('.', ',')}`;

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return d;
  }
};

const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const isoDag = (d: Date) => d.toISOString().slice(0, 10);

/** Maandag van de week waarin `d` valt. */
const maandagVan = (d: Date) => {
  const kopie = new Date(d);
  const dag = (kopie.getDay() + 6) % 7; // maandag = 0
  kopie.setDate(kopie.getDate() - dag);
  return kopie;
};

const getNum = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Twee tellingen zijn "dubbel" als type, totaal en naam gelijk zijn op dezelfde dag. */
const bouwDagRegels = (rows: KassaAfdracht[]): DagRegel[] => {
  const map = new Map<string, DagRegel & { opens: KassaAfdracht[]; sluiten: KassaAfdracht[] }>();

  for (const r of rows) {
    const key = `${r.date}__${r.location}`;
    let regel = map.get(key);
    if (!regel) {
      regel = {
        key,
        date: r.date,
        location: r.location,
        week_number: r.week_number,
        open: null,
        sluit: null,
        openDubbel: 0,
        sluitDubbel: 0,
        cashOmzet: null,
        afdracht: null,
        kasverschil: null,
        opens: [],
        sluiten: [],
      };
      map.set(key, regel);
    }
    if (r.type === 'open') regel.opens.push(r);
    else regel.sluiten.push(r);
  }

  const out: DagRegel[] = [];
  for (const regel of map.values()) {
    // Nieuwste telling is leidend; oudere gelijke tellingen tellen als dubbel.
    const sorteer = (a: KassaAfdracht, b: KassaAfdracht) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    regel.opens.sort(sorteer);
    regel.sluiten.sort(sorteer);

    regel.open = regel.opens[0] ?? null;
    regel.sluit = regel.sluiten[0] ?? null;
    regel.openDubbel = Math.max(0, regel.opens.length - 1);
    regel.sluitDubbel = Math.max(0, regel.sluiten.length - 1);

    const extra = regel.sluit?.extra ?? {};
    regel.cashOmzet = getNum(extra.cashOmzetLightspeed);
    regel.afdracht = getNum(extra.afdracht);
    regel.kasverschil = getNum(extra.kasverschil);

    const { opens, sluiten, ...rest } = regel;
    out.push(rest);
  }

  out.sort((a, b) =>
    a.date === b.date ? a.location.localeCompare(b.location) : (a.date < b.date ? 1 : -1),
  );
  return out;
};

export const KasControleContent = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KassaAfdracht[]>([]);
  const [locationFilter, setLocationFilter] = useState<'all' | 'West' | 'Midsland'>('all');

  const today = new Date();
  const monthAgo = new Date(Date.now() - 30 * 86400000);
  const [fromDate, setFromDate] = useState(isoDag(monthAgo));
  const [toDate, setToDate] = useState(isoDag(today));

  const [detail, setDetail] = useState<KassaAfdracht | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from('kassa_afdrachten')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (locationFilter !== 'all') query = query.eq('location', locationFilter);

    const { data, error } = await query;
    if (error) {
      devError(error);
      toast.error(`Laden mislukt: ${error.message}`);
      setRows([]);
    } else {
      setRows((data ?? []) as KassaAfdracht[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationFilter, fromDate, toDate]);

  const dagen = useMemo(() => bouwDagRegels(rows), [rows]);

  /** Samenvatting per vestiging. */
  const samenvatting = useMemo(() => {
    const out: Record<string, { dagen: number; afdracht: number; kasverschil: number; metVerschil: number }> = {};
    for (const d of dagen) {
      const s = out[d.location] ?? { dagen: 0, afdracht: 0, kasverschil: 0, metVerschil: 0 };
      s.dagen += 1;
      s.afdracht += d.afdracht ?? 0;
      s.kasverschil += d.kasverschil ?? 0;
      if (d.kasverschil != null && Math.abs(d.kasverschil) > KASVERSCHIL_OK) s.metVerschil += 1;
      out[d.location] = s;
    }
    return out;
  }, [dagen]);

  /** Signalen: wat vraagt aandacht in deze periode. */
  const signalen = useMemo(() => {
    const uit: { soort: 'geen-sluit' | 'geen-open' | 'dubbel' | 'verschil'; tekst: string }[] = [];
    for (const d of dagen) {
      const label = `${fmtDate(d.date)} · ${d.location}`;
      if (!d.sluit) uit.push({ soort: 'geen-sluit', tekst: `${label} — geen sluittelling` });
      if (!d.open) uit.push({ soort: 'geen-open', tekst: `${label} — geen opentelling` });
      const dubbel = d.openDubbel + d.sluitDubbel;
      if (dubbel > 0) uit.push({ soort: 'dubbel', tekst: `${label} — ${dubbel === 1 ? 'telling dubbel ingediend' : `${dubbel} dubbele tellingen`}` });
      const niveau = niveauVanVerschil(d.kasverschil);
      if (niveau === 'letop' || niveau === 'hoog') {
        uit.push({ soort: 'verschil', tekst: `${label} — kasverschil ${fmtEuroSigned(d.kasverschil as number)}` });
      }
    }
    return uit;
  }, [dagen]);

  const zetPeriode = (soort: 'deze-week' | 'vorige-week' | 'deze-maand') => {
    const nu = new Date();
    if (soort === 'deze-week') {
      const ma = maandagVan(nu);
      setFromDate(isoDag(ma));
      setToDate(isoDag(nu));
    } else if (soort === 'vorige-week') {
      const ma = maandagVan(nu);
      const vorigeMa = new Date(ma);
      vorigeMa.setDate(vorigeMa.getDate() - 7);
      const vorigeZo = new Date(ma);
      vorigeZo.setDate(vorigeZo.getDate() - 1);
      setFromDate(isoDag(vorigeMa));
      setToDate(isoDag(vorigeZo));
    } else {
      setFromDate(isoDag(new Date(nu.getFullYear(), nu.getMonth(), 1)));
      setToDate(isoDag(nu));
    }
  };

  const exportCsv = () => {
    const header = [
      'Datum', 'Week', 'Locatie',
      'Open door', 'Open tijd', 'Open totaal',
      'Sluit door', 'Sluit tijd', 'Sluit totaal',
      'Cash omzet', 'Afdracht', 'Kasverschil',
      'Dubbele tellingen', 'Opmerkingen',
    ];
    const lines = [header.join(';')];
    const nl = (n: number | null | undefined) =>
      n == null ? '' : Number(n).toFixed(2).replace('.', ',');
    for (const d of dagen) {
      const opmerkingen = [d.open?.opmerkingen, d.sluit?.opmerkingen]
        .filter(Boolean)
        .join(' | ')
        .replace(/"/g, '""')
        .replace(/\n/g, ' ');
      lines.push([
        d.date,
        d.week_number,
        d.location,
        `"${(d.open?.naam ?? '').replace(/"/g, '""')}"`,
        d.open ? fmtTime(d.open.created_at) : '',
        nl(d.open?.total as number | undefined),
        `"${(d.sluit?.naam ?? '').replace(/"/g, '""')}"`,
        d.sluit ? fmtTime(d.sluit.created_at) : '',
        nl(d.sluit?.total as number | undefined),
        nl(d.cashOmzet),
        nl(d.afdracht),
        nl(d.kasverschil),
        d.openDubbel + d.sluitDubbel,
        `"${opmerkingen}"`,
      ].join(';'));
    }
    const csv = '\uFEFF' + lines.join('\n'); // BOM voor Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kas-controle_${fromDate}_tot_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const periodeKnop = (label: string, soort: 'deze-week' | 'vorige-week' | 'deze-maand') => (
    <button
      key={soort}
      type="button"
      onClick={() => zetPeriode(soort)}
      style={{
        minHeight: 36, padding: '6px 12px', borderRadius: 14, fontSize: 13, fontWeight: 500,
        border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  const inner = (
      <div style={{ padding: embedded ? '0' : '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'hsl(var(--primary) / 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wallet className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                Per dag en vestiging: openen, sluiten en het kasverschil.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <WisselkassaAanvraagButton />
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verversen
            </Button>
            <Button onClick={exportCsv} disabled={dagen.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exporteer CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          padding: 16,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 20,
          marginBottom: 16,
        }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Locatie</label>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value as any)}
              style={{
                width: '100%', marginTop: 4, padding: '8px 10px', minHeight: 40,
                border: '1px solid hsl(var(--border))', borderRadius: 14,
                background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 14,
              }}
            >
              <option value="all">Alle locaties</option>
              <option value="West">Daily</option>
              <option value="Midsland">Foodbar</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Vanaf</label>
            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>T/m</label>
            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ marginTop: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Snel kiezen</label>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              {periodeKnop('Deze week', 'deze-week')}
              {periodeKnop('Vorige week', 'vorige-week')}
              {periodeKnop('Deze maand', 'deze-maand')}
            </div>
          </div>
        </div>

        {/* Samenvatting per vestiging */}
        {Object.keys(samenvatting).length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(samenvatting).map(([loc, s]) => {
              const niveau = niveauVanVerschil(s.kasverschil) ?? 'ok';
              return (
                <div key={loc} style={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 20, padding: '12px 16px', minWidth: 220,
                }}>
                  <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
                    {loc} · {s.dagen} {s.dagen === 1 ? 'dag' : 'dagen'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Afdracht</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{fmtEuro(s.afdracht)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Kasverschil</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: NIVEAU_KLEUR[niveau] }}>
                      {fmtEuroSigned(s.kasverschil)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'hsl(var(--muted-foreground))' }}>Dagen met verschil</span>
                    <span style={{ fontWeight: 600 }}>{s.metVerschil}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Signalen */}
        {!loading && signalen.length > 0 && (
          <div style={{
            background: 'hsl(var(--warning) / 0.1)',
            border: '1px solid hsl(var(--warning) / 0.35)',
            borderRadius: 20, padding: 16, marginBottom: 16,
          }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--foreground))', marginBottom: 8 }}>
              <AlertTriangle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />
              Vraagt aandacht ({signalen.length})
            </p>
            <ul style={{ display: 'grid', gap: 4 }}>
              {signalen.map((s, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'hsl(var(--foreground))' }}>
                  {s.soort === 'dubbel'
                    ? <Copy className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                    : <span style={{ width: 6, height: 6, borderRadius: 999, background: 'hsl(var(--warning))', flexShrink: 0 }} />}
                  {s.tekst}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dagoverzicht */}
        <div style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 20,
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Loader2 className="h-6 w-6 animate-spin inline" style={{ color: 'hsl(var(--primary))' }} />
            </div>
          ) : dagen.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              Geen tellingen gevonden in deze periode.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Dag', 'Locatie', 'Openen', 'Sluiten', 'Cash omzet', 'Afdracht', 'Kasverschil', 'Opmerkingen'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid hsl(var(--border) / 0.6)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dagen.map((d, i) => {
                    const niveau = niveauVanVerschil(d.kasverschil);
                    const opmerkingen = [d.open?.opmerkingen, d.sluit?.opmerkingen].filter(Boolean).join(' · ');
                    const cel: React.CSSProperties = {
                      padding: '10px 12px',
                      borderRight: '1px solid hsl(var(--border) / 0.5)',
                      verticalAlign: 'middle',
                    };
                    return (
                      <tr
                        key={d.key}
                        style={{
                          borderBottom: '1px solid hsl(var(--border) / 0.5)',
                          background: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted) / 0.3)',
                        }}
                      >
                        <td style={{ ...cel, color: 'hsl(var(--foreground))', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {fmtDate(d.date)}
                          <span style={{ marginLeft: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>wk {d.week_number}</span>
                        </td>
                        <td style={{ ...cel, color: 'hsl(var(--foreground))' }}>{d.location}</td>

                        <td style={cel}>
                          <TellingCel
                            telling={d.open}
                            dubbel={d.openDubbel}
                            ontbreektTekst="Geen opentelling"
                            onClick={() => d.open && setDetail(d.open)}
                          />
                        </td>
                        <td style={cel}>
                          <TellingCel
                            telling={d.sluit}
                            dubbel={d.sluitDubbel}
                            ontbreektTekst="Geen sluittelling"
                            onClick={() => d.sluit && setDetail(d.sluit)}
                          />
                        </td>

                        <td style={{ ...cel, fontFamily: 'monospace', color: 'hsl(var(--foreground))' }}>
                          {d.cashOmzet != null ? fmtEuro(d.cashOmzet) : '—'}
                        </td>
                        <td style={{ ...cel, fontFamily: 'monospace', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                          {d.afdracht != null ? fmtEuro(d.afdracht) : '—'}
                        </td>
                        <td style={cel}>
                          {niveau ? (
                            <span style={{
                              display: 'inline-block', padding: '4px 10px', borderRadius: 999,
                              fontFamily: 'monospace', fontSize: 14, fontWeight: 700,
                              background: NIVEAU_ACHTERGROND[niveau], color: NIVEAU_KLEUR[niveau],
                            }}>
                              {fmtEuroSigned(d.kasverschil as number)}
                            </span>
                          ) : (
                            <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'hsl(var(--muted-foreground))', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opmerkingen || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Detail dialog */}
        <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent style={{ maxWidth: 650 }}>
            <DialogHeader>
              <DialogTitle>
                Telling {detail && fmtDate(detail.date)} · {detail?.location} · {detail?.type === 'open' ? 'Open' : 'Sluit'}
              </DialogTitle>
            </DialogHeader>
            {detail && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Door:</span> <strong>{detail.naam}</strong></div>
                  <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Ingediend:</span> {fmtTime(detail.created_at)}</div>
                  <div><span style={{ color: 'hsl(var(--muted-foreground))' }}>Week:</span> {detail.week_number}</div>
                </div>

                <div>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: 8 }}>
                    {detail.type === 'sluit' ? 'Coupures' : 'Kassa-lade'}
                  </h3>
                  <DenomTable denominations={detail.kassa_lade_denominations} total={Number(detail.kassa_lade_total)} />
                </div>

                {detail.type === 'open' && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: 8 }}>Wisselkas</h3>
                    <DenomTable denominations={detail.wisselkas_denominations} total={Number(detail.wisselkas_total)} />
                  </div>
                )}

                <div style={{
                  background: 'hsl(var(--primary) / 0.08)',
                  borderRadius: 14, padding: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Eindtotaal</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--primary))', fontFamily: 'monospace' }}>{fmtEuro(Number(detail.total))}</span>
                </div>

                {detail.type === 'sluit' && detail.extra && Object.keys(detail.extra).length > 0 && (
                  <div style={{ background: 'hsl(var(--muted) / 0.5)', borderRadius: 14, padding: 12, fontSize: 14, display: 'grid', gap: 6 }}>
                    {detail.extra.cashOmzetLightspeed != null && <Row label="Cash omzet (Lightspeed)" value={fmtEuro(detail.extra.cashOmzetLightspeed)} />}
                    {detail.extra.doelsaldo != null && <Row label="Doelsaldo" value={fmtEuro(detail.extra.doelsaldo)} />}
                    {detail.extra.afdracht != null && <Row label="Afdracht" value={fmtEuro(detail.extra.afdracht)} />}
                    {detail.extra.kasverschil != null && (
                      <Row
                        label="Kasverschil"
                        value={fmtEuroSigned(Number(detail.extra.kasverschil))}
                        valueColor={NIVEAU_KLEUR[niveauVanVerschil(Number(detail.extra.kasverschil)) ?? 'ok']}
                      />
                    )}
                  </div>
                )}

                {detail.opmerkingen && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', marginBottom: 6 }}>Opmerkingen</h3>
                    <p style={{ fontSize: 14, color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap' }}>{detail.opmerkingen}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
  return embedded ? inner : <SidebarLayout>{inner}</SidebarLayout>;
};

const KasControle = () => <KasControleContent />;

/** Openen/sluiten-cel: wie, hoe laat, totaal — of een duidelijke lege staat. */
const TellingCel = ({
  telling,
  dubbel,
  ontbreektTekst,
  onClick,
}: {
  telling: KassaAfdracht | null;
  dubbel: number;
  ontbreektTekst: string;
  onClick: () => void;
}) => {
  if (!telling) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'hsl(var(--warning))', fontWeight: 500 }}>
        <AlertTriangle className="h-3.5 w-3.5" />
        {ontbreektTekst}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
        minHeight: 44, padding: '4px 8px', borderRadius: 14, border: '1px solid transparent',
        background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      <span style={{ fontSize: 14, color: 'hsl(var(--foreground))', fontWeight: 500 }}>
        {telling.naam}
        <span style={{ marginLeft: 6, fontSize: 12, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}>
          {fmtTime(telling.created_at)}
        </span>
      </span>
      <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}>
        {fmtEuro(Number(telling.total))}
        {dubbel > 0 && (
          <span style={{ marginLeft: 6, color: 'hsl(var(--warning))', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
            · {dubbel + 1}× ingediend
          </span>
        )}
      </span>
    </button>
  );
};

const Row = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: valueColor ?? 'hsl(var(--foreground))' }}>{value}</span>
  </div>
);

const DenomTable = ({ denominations, total }: { denominations: Record<string, number | string>; total: number }) => {
  const entries = DENOM_ORDER
    .map(d => ({ denom: d, count: Number(denominations?.[d] ?? 0) }))
    .filter(e => e.count > 0);
  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 14, overflow: 'hidden' }}>
      <table style={{ width: '100%', fontSize: 13 }}>
        <tbody>
          {entries.length === 0 ? (
            <tr><td style={{ padding: 12, color: 'hsl(var(--muted-foreground))', textAlign: 'center' }}>Geen coupures</td></tr>
          ) : entries.map(({ denom, count }) => (
            <tr key={denom} style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
              <td style={{ padding: '6px 12px', fontFamily: 'monospace' }}>€{denom.replace('.', ',')}</td>
              <td style={{ padding: '6px 12px', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>× {count}</td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{fmtEuro(parseFloat(denom) * count)}</td>
            </tr>
          ))}
          <tr style={{ background: 'hsl(var(--muted) / 0.5)' }}>
            <td colSpan={2} style={{ padding: '8px 12px', fontWeight: 600 }}>Totaal</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: 'hsl(var(--primary))' }}>{fmtEuro(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default KasControle;
