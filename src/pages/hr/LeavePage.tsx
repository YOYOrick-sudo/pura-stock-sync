import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, CalendarDays, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

type StatusFilter = 'all' | 'pending' | 'approved' | 'denied';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Alle',
  pending: 'Openstaand',
  approved: 'Goedgekeurd',
  denied: 'Afgewezen',
};

const TYPE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  vakantie: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Vakantie' },
  ziek: { bg: '#FEE2E2', text: '#B91C1C', label: 'Ziek' },
  bijzonder: { bg: '#FEF3C7', text: '#B45309', label: 'Bijzonder' },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: '#FEF3C7', text: '#B45309', label: 'Openstaand' },
  approved: { bg: '#DCFCE8', text: '#15803D', label: 'Goedgekeurd' },
  denied: { bg: '#FEE2E2', text: '#B91C1C', label: 'Afgewezen' },
};

const PAGE_SIZE = 10;

export default function LeavePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const queryClient = useQueryClient();

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, profiles!inner(first_name, last_name, user_id)')
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'denied' }) => {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status, decided_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast({
        title: status === 'approved' ? 'Verlofaanvraag goedgekeurd' : 'Verlofaanvraag afgewezen',
      });
    },
    onError: () => {
      toast({ title: 'Er ging iets mis', variant: 'destructive' });
    },
  });

  // Filter & search
  const filtered = (leaveRequests || [])
    .filter((r) => statusFilter === 'all' || r.status === statusFilter)
    .filter((r) => {
      if (!search) return true;
      const name = `${r.profiles.first_name} ${r.profiles.last_name}`.toLowerCase();
      return name.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const diff = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      return sortAsc ? diff : -diff;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  const getInitials = (first: string, last: string) =>
    `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;

  const formatDate = (d: string) => format(parseISO(d), 'dd-MM-yyyy');

  const getDays = (start: string, end: string) =>
    differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              color: '#1A1F28',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Verlofaanvragen
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 14,
              color: '#636878',
              margin: '4px 0 0',
            }}
          >
            Beheer verlofaanvragen van medewerkers.
          </p>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 320, flex: '1 1 200px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8D93A0',
              }}
            />
            <Input
              placeholder="Zoek medewerker..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
              style={{ borderRadius: 16, height: 40 }}
            />
          </div>

          {/* Segmented Control */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F8F9FA',
              border: '1px solid #EAECF0',
              borderRadius: 16,
              padding: 3,
              gap: 2,
            }}
          >
            {(['all', 'pending', 'approved', 'denied'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(0);
                }}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  fontWeight: statusFilter === s ? 500 : 400,
                  color: statusFilter === s ? '#303542' : '#636878',
                  backgroundColor: statusFilter === s ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: 14,
                  padding: '6px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: statusFilter === s ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D5D8E0',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.5fr 1.2fr 0.9fr 1fr',
              gap: 8,
              padding: '12px 20px',
              backgroundColor: '#F8F9FA',
              borderBottom: '1px solid #D5D8E0',
            }}
          >
            {['Medewerker', 'Type', 'Van', 'Tot', 'Dagen', 'Reden', 'Status', 'Acties'].map(
              (col, i) => (
                <div
                  key={col}
                  onClick={col === 'Van' ? () => setSortAsc(!sortAsc) : undefined}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#636878',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: col === 'Van' ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    userSelect: 'none',
                  }}
                >
                  {col}
                  {col === 'Van' && (
                    <span style={{ fontSize: 10, color: '#8D93A0' }}>
                      {sortAsc ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              )
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.5fr 1.2fr 0.9fr 1fr',
                    gap: 8,
                    padding: '14px 20px',
                    borderBottom: i < 4 ? '1px solid #EAECF0' : 'none',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: '#EAECF0',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                    <div
                      style={{
                        width: `${50 + Math.random() * 30}%`,
                        height: 8,
                        borderRadius: 14,
                        backgroundColor: '#EAECF0',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  </div>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div
                      key={j}
                      style={{
                        width: `${40 + Math.random() * 40}%`,
                        height: 8,
                        borderRadius: 14,
                        backgroundColor: '#EAECF0',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  ))}
                </div>
              ))}
              <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filtered.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 24px',
                maxWidth: 320,
                margin: '0 auto',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: '#F1F3F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <CalendarDays size={22} color="#8D93A0" />
              </div>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#303542',
                  margin: '0 0 4px',
                }}
              >
                Geen verlofaanvragen
              </p>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: '#636878',
                  margin: 0,
                }}
              >
                Er zijn nog geen verlofaanvragen ingediend.
              </p>
            </div>
          )}

          {/* Table Rows */}
          {!isLoading &&
            paginated.map((req, i) => {
              const typeConf = TYPE_CONFIG[req.type] || TYPE_CONFIG.vakantie;
              const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const profile = req.profiles;

              return (
                <div
                  key={req.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 0.8fr 0.8fr 0.8fr 0.5fr 1.2fr 0.9fr 1fr',
                    gap: 8,
                    padding: '14px 20px',
                    borderBottom: i < paginated.length - 1 ? '1px solid #EAECF0' : 'none',
                    alignItems: 'center',
                    transition: 'background-color 0.08s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#FCFCFD')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  {/* Medewerker */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: '#E27726',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(profile.first_name, profile.last_name)}
                    </div>
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: 400,
                        color: '#303542',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {profile.first_name} {profile.last_name}
                    </span>
                  </div>

                  {/* Type Badge */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: typeConf.bg,
                        color: typeConf.text,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {typeConf.label}
                    </span>
                  </div>

                  {/* Van */}
                  <div
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#303542',
                    }}
                  >
                    {formatDate(req.start_date)}
                  </div>

                  {/* Tot */}
                  <div
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#303542',
                    }}
                  >
                    {formatDate(req.end_date)}
                  </div>

                  {/* Dagen */}
                  <div
                    style={{
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      color: '#303542',
                    }}
                  >
                    {getDays(req.start_date, req.end_date)}
                  </div>

                  {/* Reden */}
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      color: '#4A4F5E',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {req.reason || '—'}
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: statusConf.bg,
                        color: statusConf.text,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {statusConf.label}
                    </span>
                  </div>

                  {/* Acties */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {req.status === 'pending' ? (
                      <>
                        <Button
                          variant="soft"
                          size="xs"
                          onClick={() =>
                            updateMutation.mutate({ id: req.id, status: 'approved' })
                          }
                          disabled={updateMutation.isPending}
                        >
                          <Check size={14} />
                          Goedkeuren
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            updateMutation.mutate({ id: req.id, status: 'denied' })
                          }
                          disabled={updateMutation.isPending}
                          style={{ color: '#B91C1C' }}
                        >
                          <X size={14} />
                          Afwijzen
                        </Button>
                      </>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 12,
                          color: '#8D93A0',
                        }}
                      >
                        —
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              padding: '0 4px',
            }}
          >
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#636878',
              }}
            >
              {rangeStart}–{rangeEnd} van {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
