import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Download, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { SidebarLayout } from '@/components/SidebarLayout';

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

const DENOM_ORDER = ['500', '200', '100', '50', '20', '10', '5', '2', '1', '0.50', '0.20', '0.10', '0.05'];

const fmtEuro = (n: number) =>
  `€${Number(n ?? 0).toFixed(2).replace('.', ',')}`;

const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('nl-NL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

export const KasControleContent = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<KassaAfdracht[]>([]);
  const [locationFilter, setLocationFilter] = useState<'all' | 'West' | 'Midsland'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'open' | 'sluit'>('all');

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);

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
    if (typeFilter !== 'all') query = query.eq('type', typeFilter);

    const { data, error } = await query;
    if (error) {
      console.error(error);
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
  }, [locationFilter, typeFilter, fromDate, toDate]);

  const totalsByLocation = useMemo(() => {
    const out: Record<string, number> = {};
    for (const r of rows) {
      out[r.location] = (out[r.location] ?? 0) + Number(r.total);
    }
    return out;
  }, [rows]);

  const exportCsv = () => {
    const header = [
      'Datum', 'Tijd', 'Week', 'Locatie', 'Type', 'Naam',
      'Totaal kassa-lade', 'Totaal wisselkas', 'Totaal',
      'Cash omzet (Lightspeed)', 'Doelsaldo', 'Afdracht', 'Kasverschil',
      'Opmerkingen',
    ];
    const lines = [header.join(';')];
    for (const r of rows) {
      const extra = r.extra ?? {};
      lines.push([
        r.date,
        fmtTime(r.created_at),
        r.week_number,
        r.location,
        r.type === 'open' ? 'Open (dag)' : 'Sluit (avond)',
        `"${(r.naam ?? '').replace(/"/g, '""')}"`,
        Number(r.kassa_lade_total).toFixed(2).replace('.', ','),
        Number(r.wisselkas_total).toFixed(2).replace('.', ','),
        Number(r.total).toFixed(2).replace('.', ','),
        extra.cashOmzetLightspeed != null ? Number(extra.cashOmzetLightspeed).toFixed(2).replace('.', ',') : '',
        extra.doelsaldo != null ? Number(extra.doelsaldo).toFixed(2).replace('.', ',') : '',
        extra.afdracht != null ? Number(extra.afdracht).toFixed(2).replace('.', ',') : '',
        extra.kasverschil != null ? Number(extra.kasverschil).toFixed(2).replace('.', ',') : '',
        `"${(r.opmerkingen ?? '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
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

  const inner = (
      <div style={{ padding: embedded ? '0' : '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'hsl(var(--primary) / 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wallet className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Kas-controle</h1>
              <p style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>
                Overzicht van alle kassa-afdrachten per locatie en periode.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verversen
            </Button>
            <Button onClick={exportCsv} disabled={rows.length === 0}>
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
                width: '100%', marginTop: 4, padding: '8px 10px',
                border: '1px solid hsl(var(--border))', borderRadius: 14,
                background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 14,
              }}
            >
              <option value="all">Alle locaties</option>
              <option value="West">West</option>
              <option value="Midsland">Midsland</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              style={{
                width: '100%', marginTop: 4, padding: '8px 10px',
                border: '1px solid hsl(var(--border))', borderRadius: 14,
                background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', fontSize: 14,
              }}
            >
              <option value="all">Alle</option>
              <option value="open">Open (dag)</option>
              <option value="sluit">Sluit (avond)</option>
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
        </div>

        {/* Totals summary */}
        {Object.keys(totalsByLocation).length > 0 && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {Object.entries(totalsByLocation).map(([loc, sum]) => (
              <div key={loc} style={{
                background: 'hsl(var(--primary) / 0.08)',
                border: '1px solid hsl(var(--primary) / 0.2)',
                borderRadius: 14, padding: '10px 16px',
              }}>
                <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontWeight: 600 }}>{loc}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--primary))' }}>{fmtEuro(sum)}</div>
              </div>
            ))}
            <div style={{
              background: 'hsl(var(--muted))',
              borderRadius: 14, padding: '10px 16px',
            }}>
              <div style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', fontWeight: 600 }}>Aantal tellingen</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--foreground))' }}>{rows.length}</div>
            </div>
          </div>
        )}

        {/* Table */}
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
          ) : rows.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              Geen tellingen gevonden in deze periode.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--muted))', borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Datum', 'Tijd', 'Wk', 'Locatie', 'Type', 'Naam', 'Totaal', 'Opmerkingen'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.id}
                      onClick={() => setDetail(r)}
                      style={{
                        borderBottom: '1px solid hsl(var(--border) / 0.5)',
                        background: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted) / 0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--foreground))' }}>{fmtDate(r.date)}</td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}>{fmtTime(r.created_at)}</td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--muted-foreground))' }}>{r.week_number}</td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--foreground))', fontWeight: 500 }}>{r.location}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          background: r.type === 'open' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--muted))',
                          color: r.type === 'open' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                        }}>
                          {r.type === 'open' ? 'Open' : 'Sluit'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--foreground))' }}>{r.naam}</td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--primary))', fontWeight: 700, fontFamily: 'monospace' }}>{fmtEuro(Number(r.total))}</td>
                      <td style={{ padding: '10px 12px', color: 'hsl(var(--muted-foreground))', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.opmerkingen ?? '—'}</td>
                    </tr>
                  ))}
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
                        value={fmtEuro(detail.extra.kasverschil)}
                        valueColor={detail.extra.kasverschil < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))'}
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
