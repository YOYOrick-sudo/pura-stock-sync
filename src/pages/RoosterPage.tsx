import { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { format, startOfWeek, addDays, addWeeks, subWeeks, getISOWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

type ShiftType = 'ochtend' | 'middag' | 'avond' | 'dubbel';

const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string }> = {
  ochtend: { bg: '#DBEAFE', text: '#1D4ED8' },
  middag: { bg: '#FEF3C7', text: '#B45309' },
  avond: { bg: '#FFF7ED', text: '#A5500D' },
  dubbel: { bg: '#DCFCE8', text: '#15803D' },
};

const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

interface ScheduleRow {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number | null;
  shift_type: string | null;
  notes: string | null;
  location: string;
  status: string;
}

interface EmployeeRow {
  user_id: string;
  first_name: string;
  last_name: string;
}

interface ModalState {
  open: boolean;
  editId?: string;
  prefillUserId?: string;
  prefillDate?: string;
}

export default function RoosterPage() {
  const { userLocation } = useUserLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedLocation, setSelectedLocation] = useState(userLocation || 'West');
  const [modal, setModal] = useState<ModalState>({ open: false });

  // Form state
  const [formUserId, setFormUserId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formBreak, setFormBreak] = useState('0');
  const [formType, setFormType] = useState<ShiftType>('ochtend');
  const [formNotes, setFormNotes] = useState('');

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const weekNumber = getISOWeek(currentWeekStart);
  const weekRange = `${format(weekDates[0], 'd MMM', { locale: nl })} – ${format(weekDates[6], 'd MMM yyyy', { locale: nl })}`;

  // Fetch employees (profiles joined via user_roles for this location)
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['rooster-employees', selectedLocation],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('location', selectedLocation)
        .eq('is_active', true);
      if (error) throw error;
      if (!data?.length) return [];

      const userIds = data.map((r) => r.user_id);
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);
      if (pErr) throw pErr;
      return (profiles || []) as EmployeeRow[];
    },
  });

  // Fetch schedules for the week
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['rooster-schedules', selectedLocation, currentWeekStart.toISOString()],
    queryFn: async () => {
      const from = format(weekDates[0], 'yyyy-MM-dd');
      const to = format(weekDates[6], 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('location', selectedLocation)
        .gte('date', from)
        .lte('date', to);
      if (error) throw error;
      return (data || []) as ScheduleRow[];
    },
  });

  // Fetch available locations for the current user
  const { data: locations = [] } = useQuery({
    queryKey: ['rooster-locations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select('location')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return [...new Set((data || []).map((r) => r.location))];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const payload = {
        user_id: formUserId,
        date: formDate,
        start_time: formStartTime,
        end_time: formEndTime,
        break_minutes: parseInt(formBreak) || 0,
        shift_type: formType,
        notes: formNotes || null,
        location: selectedLocation,
        created_by: user.id,
      };

      if (modal.editId) {
        const { error } = await supabase
          .from('schedules')
          .update(payload)
          .eq('id', modal.editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('schedules').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: modal.editId ? 'Dienst bijgewerkt' : 'Dienst toegevoegd' });
      queryClient.invalidateQueries({ queryKey: ['rooster-schedules'] });
      closeModal();
    },
    onError: (err: Error) => {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    },
  });

  const openModal = (opts?: { editId?: string; userId?: string; date?: string }) => {
    if (opts?.editId) {
      const s = schedules.find((x) => x.id === opts.editId);
      if (s) {
        setFormUserId(s.user_id);
        setFormDate(s.date);
        setFormStartTime(s.start_time?.slice(0, 5) || '');
        setFormEndTime(s.end_time?.slice(0, 5) || '');
        setFormBreak(String(s.break_minutes || 0));
        setFormType((s.shift_type as ShiftType) || 'ochtend');
        setFormNotes(s.notes || '');
      }
    } else {
      setFormUserId(opts?.userId || '');
      setFormDate(opts?.date || format(new Date(), 'yyyy-MM-dd'));
      setFormStartTime('');
      setFormEndTime('');
      setFormBreak('0');
      setFormType('ochtend');
      setFormNotes('');
    }
    setModal({ open: true, editId: opts?.editId });
  };

  const closeModal = () => setModal({ open: false });

  const isLoading = loadingEmployees || loadingSchedules;

  // Build lookup: userId+date -> schedule[]
  const scheduleMap = useMemo(() => {
    const map: Record<string, ScheduleRow[]> = {};
    schedules.forEach((s) => {
      const key = `${s.user_id}_${s.date}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [schedules]);

  const getInitials = (first: string, last: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: 24, fontWeight: 700, color: '#1A1F28', marginBottom: 4 }}>
            Rooster
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#636878' }}>
            Plan en beheer diensten per week.
          </p>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {/* Left: week nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
              style={{ width: 32, height: 32, borderRadius: 14, border: '1px solid #C1C5CF', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronLeft size={16} color="#4A4F5E" />
            </button>
            <button
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              style={{ height: 32, padding: '0 12px', borderRadius: 16, border: '1px solid #C1C5CF', background: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#303542', cursor: 'pointer' }}
            >
              Deze week
            </button>
            <button
              onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
              style={{ width: 32, height: 32, borderRadius: 14, border: '1px solid #C1C5CF', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronRight size={16} color="#4A4F5E" />
            </button>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#636878', marginLeft: 8 }}>
              Week {weekNumber} · {weekRange}
            </span>
          </div>

          {/* Right: location + add */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{ height: 36, borderRadius: 14, border: '1px solid #C1C5CF', padding: '0 32px 0 12px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#282E3A', background: '#fff', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%238D93A0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
            >
              {(locations.length ? locations : [selectedLocation]).map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <button
              onClick={() => openModal()}
              style={{ height: 36, padding: '0 14px', borderRadius: 16, background: '#E27726', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#C9630E')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#E27726')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Plus size={16} /> Dienst toevoegen
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ background: '#fff', border: '1px solid #D5D8E0', borderRadius: 20, overflow: 'hidden' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', padding: '12px 16px', gap: 12, borderBottom: '1px solid #EAECF0' }}>
                <Skeleton className="w-7 h-7 rounded-full" />
                <Skeleton className="h-4 w-24" style={{ borderRadius: 14 }} />
                {Array.from({ length: 7 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 flex-1" style={{ borderRadius: 14 }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && employees.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <CalendarDays size={22} color="#8D93A0" />
            </div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#303542', marginBottom: 4 }}>
              Geen diensten ingepland
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#636878', maxWidth: 300, marginBottom: 16 }}>
              Voeg diensten toe om het rooster te vullen.
            </p>
            <button
              onClick={() => openModal()}
              style={{ height: 36, padding: '0 14px', borderRadius: 16, background: '#E27726', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Dienst toevoegen
            </button>
          </div>
        )}

        {/* Week grid */}
        {!isLoading && employees.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #D5D8E0', borderRadius: 20, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '180px repeat(7, 1fr)', background: '#F8F9FA', borderBottom: '1px solid #D5D8E0' }}>
              <div style={{ padding: '10px 16px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Medewerker
              </div>
              {weekDates.map((d, i) => {
                const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <div key={i} style={{ padding: '10px 8px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 500, color: isToday ? '#E27726' : '#636878', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                    {DAY_LABELS[i]} {format(d, 'd')}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {employees.map((emp) => (
              <div
                key={emp.user_id}
                style={{ display: 'grid', gridTemplateColumns: '180px repeat(7, 1fr)', borderBottom: '1px solid #EAECF0', minHeight: 56, transition: 'background 0.08s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#FCFCFD')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E27726', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                    {getInitials(emp.first_name, emp.last_name)}
                  </div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#303542', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {emp.first_name} {emp.last_name}
                  </span>
                </div>

                {/* Day cells */}
                {weekDates.map((d, di) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const daySchedules = scheduleMap[`${emp.user_id}_${dateStr}`] || [];

                  return (
                    <div key={di} style={{ padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center', minHeight: 48 }}>
                      {daySchedules.length > 0 ? (
                        daySchedules.map((s) => {
                          const colors = SHIFT_COLORS[(s.shift_type as ShiftType) || 'ochtend'] || SHIFT_COLORS.ochtend;
                          return (
                            <button
                              key={s.id}
                              onClick={() => openModal({ editId: s.id })}
                              style={{ background: colors.bg, color: colors.text, border: 'none', borderRadius: 9999, padding: '3px 10px', fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'opacity 0.15s', width: '100%', maxWidth: 100, textAlign: 'center' }}
                            >
                              {s.start_time?.slice(0, 5)}–{s.end_time?.slice(0, 5)}
                            </button>
                          );
                        })
                      ) : (
                        <button
                          onClick={() => openModal({ userId: emp.user_id, date: dateStr })}
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.08s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F9FA')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Plus size={14} color="#8D93A0" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(15,19,24,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #D5D8E0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#282E3A' }}>
                {modal.editId ? 'Dienst bewerken' : 'Dienst toevoegen'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={18} color="#8D93A0" />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Medewerker */}
              <div style={{ gridColumn: '1 / -1' }}>
                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#282E3A', marginBottom: 6, display: 'block' }}>
                  Medewerker
                </Label>
                <select
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  style={{ width: '100%', height: 36, borderRadius: 14, border: '1px solid #C1C5CF', padding: '0 12px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#282E3A', background: '#fff' }}
                >
                  <option value="">Selecteer medewerker</option>
                  {employees.map((e) => (
                    <option key={e.user_id} value={e.user_id}>
                      {e.first_name} {e.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datum */}
              <div>
                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#282E3A', marginBottom: 6, display: 'block' }}>Datum</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} style={{ height: 36 }} />
              </div>

              {/* Type */}
              <div>
                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#282E3A', marginBottom: 6, display: 'block' }}>Type</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as ShiftType)}
                  style={{ width: '100%', height: 36, borderRadius: 14, border: '1px solid #C1C5CF', padding: '0 12px', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#282E3A', background: '#fff' }}
                >
                  <option value="ochtend">Ochtend</option>
                  <option value="middag">Middag</option>
                  <option value="avond">Avond</option>
                  <option value="dubbel">Dubbel</option>
                </select>
              </div>

              {/* Starttijd */}
              <div>
                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#282E3A', marginBottom: 6, display: 'block' }}>Starttijd</Label>
                <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} style={{ height: 36 }} />
              </div>

              {/* Eindtijd */}
              <div>
                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#282E3A', marginBottom: 6, display: 'block' }}>Eindtijd</Label>
                <Input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} style={{ height: 36 }} />
              </div>

              {/* Pauze */}
              <div>
                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#282E3A', marginBottom: 6, display: 'block' }}>Pauze (min)</Label>
                <Input type="number" value={formBreak} onChange={(e) => setFormBreak(e.target.value)} min="0" style={{ height: 36 }} />
              </div>

              {/* Notities */}
              <div style={{ gridColumn: '1 / -1' }}>
                <Label style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#282E3A', marginBottom: 6, display: 'block' }}>Notities</Label>
                <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Optionele notities..." rows={3} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #D5D8E0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={closeModal}
                style={{ height: 36, padding: '0 14px', borderRadius: 16, border: '1px solid #C1C5CF', background: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: '#303542', cursor: 'pointer' }}
              >
                Annuleren
              </button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !formUserId || !formDate || !formStartTime || !formEndTime}
                style={{ height: 36, padding: '0 14px', borderRadius: 16, background: '#E27726', color: '#fff', border: 'none', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: saveMutation.isPending ? 0.8 : 1, transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#C9630E')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#E27726')}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {saveMutation.isPending ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
