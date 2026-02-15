import { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, Coffee, PlaneTakeoff, ArrowLeftRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isToday, getISOWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Schedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: string | null;
  location: string;
  break_minutes: number | null;
  status: string;
  notes: string | null;
}

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  reason: string | null;
}

const EmployeeSchedule = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'vakantie', start_date: '', end_date: '', reason: '' });
  const queryClient = useQueryClient();

  const currentWeekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const currentWeekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);
  const days = useMemo(() => eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd }), [currentWeekStart, currentWeekEnd]);

  const startStr = format(currentWeekStart, 'yyyy-MM-dd');
  const endStr = format(currentWeekEnd, 'yyyy-MM-dd');

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['my-schedules', startStr, endStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date');
      if (error) throw error;
      return (data || []) as Schedule[];
    },
  });

  const { data: leaveRequests = [], isLoading: leaveLoading } = useQuery({
    queryKey: ['my-leave', startStr, endStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .lte('start_date', endStr)
        .gte('end_date', startStr);
      if (error) throw error;
      return (data || []) as LeaveRequest[];
    },
  });

  const submitLeave = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user.id,
        type: leaveForm.type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        reason: leaveForm.reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Verlofaanvraag ingediend', description: 'Je aanvraag wordt beoordeeld.' });
      setShowLeaveModal(false);
      setLeaveForm({ type: 'vakantie', start_date: '', end_date: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['my-leave'] });
    },
    onError: (err: any) => {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    },
  });

  const getScheduleForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return schedules.find(s => s.date === dateStr);
  };

  const getLeaveForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return leaveRequests.find(l => l.start_date <= dateStr && l.end_date >= dateStr);
  };

  const shiftTypeBadge = (type: string | null) => {
    switch (type) {
      case 'ochtend': return { bg: '#DBEAFE', text: '#1D4ED8', label: 'Ochtend' };
      case 'middag': return { bg: '#FEF3C7', text: '#B45309', label: 'Middag' };
      case 'avond': return { bg: '#E9D5FF', text: '#7C3AED', label: 'Avond' };
      default: return { bg: '#F1F3F5', text: '#4A4F5E', label: type || 'Dienst' };
    }
  };

  const leaveTypeBadge = (type: string) => {
    switch (type) {
      case 'vakantie': return { bg: '#DCFCE8', text: '#15803D', label: 'Vakantie' };
      case 'ziek': return { bg: '#FEE2E2', text: '#B91C1C', label: 'Ziek' };
      default: return { bg: '#FEF3C7', text: '#B45309', label: 'Bijzonder verlof' };
    }
  };

  const leaveStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return { bg: '#DCFCE8', text: '#15803D' };
      case 'rejected': return { bg: '#FEE2E2', text: '#B91C1C' };
      default: return { bg: '#FEF3C7', text: '#B45309' };
    }
  };

  const loading = schedulesLoading || leaveLoading;

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{
              fontFamily: "'Instrument Sans', sans-serif",
              fontSize: '24px',
              fontWeight: 700,
              color: '#1A1F28',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}>
              Mijn Rooster
            </h1>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#636878' }}>
              Week {getISOWeek(currentWeekStart)} · {format(currentWeekStart, 'd MMM', { locale: nl })} – {format(currentWeekEnd, 'd MMM yyyy', { locale: nl })}
            </p>
          </div>
          <Button
            onClick={() => setShowLeaveModal(true)}
            style={{ borderRadius: '16px' }}
          >
            <PlaneTakeoff size={14} />
            Verlof aanvragen
          </Button>
        </div>

        {/* Week Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
        }}>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)} style={{ borderRadius: '16px' }}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} style={{ borderRadius: '16px', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
            Deze week
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)} style={{ borderRadius: '16px' }}>
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Day Cards */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-[20px]" />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {days.map((day) => {
              const schedule = getScheduleForDay(day);
              const leave = getLeaveForDay(day);
              const today = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `1px solid ${today ? '#E27726' : '#D5D8E0'}`,
                    borderRadius: '20px',
                    padding: '16px 20px',
                    transition: 'background-color 0.08s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      {/* Day name & date */}
                      <div style={{ minWidth: '140px' }}>
                        <span style={{
                          fontFamily: "'Instrument Sans', sans-serif",
                          fontSize: '14px',
                          fontWeight: today ? 700 : 600,
                          color: today ? '#E27726' : '#1A1F28',
                        }}>
                          {format(day, 'EEEE', { locale: nl })}
                        </span>
                        <span style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '12px',
                          color: '#8D93A0',
                          marginLeft: '8px',
                        }}>
                          {format(day, 'd MMM', { locale: nl })}
                        </span>
                      </div>

                      {/* Content */}
                      {leave ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {(() => {
                            const lb = leaveTypeBadge(leave.type);
                            const sb = leaveStatusBadge(leave.status);
                            return (
                              <>
                                <span style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  color: lb.text,
                                  backgroundColor: lb.bg,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                }}>
                                  {lb.label}
                                </span>
                                <span style={{
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: sb.text,
                                  backgroundColor: sb.bg,
                                  padding: '2px 6px',
                                  borderRadius: '9999px',
                                }}>
                                  {leave.status}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      ) : schedule ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} color="#8D93A0" />
                            <span style={{
                              fontFamily: "'Geist Mono', monospace",
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#1A1F28',
                            }}>
                              {schedule.start_time.slice(0, 5)} – {schedule.end_time.slice(0, 5)}
                            </span>
                          </div>
                          {(() => {
                            const badge = shiftTypeBadge(schedule.shift_type);
                            return (
                              <span style={{
                                fontFamily: 'Inter, sans-serif',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: badge.text,
                                backgroundColor: badge.bg,
                                padding: '2px 8px',
                                borderRadius: '9999px',
                              }}>
                                {badge.label}
                              </span>
                            );
                          })()}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#8D93A0" />
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#636878' }}>
                              {schedule.location}
                            </span>
                          </div>
                          {schedule.break_minutes && schedule.break_minutes > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Coffee size={12} color="#8D93A0" />
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8D93A0' }}>
                                {schedule.break_minutes} min
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#C1C5CF' }}>
                          Vrij
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,19,24,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowLeaveModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '480px',
              margin: '0 16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              zIndex: 310,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #D5D8E0',
            }}>
              <h2 style={{
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: '#1A1F28',
              }}>
                Verlof aanvragen
              </h2>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Type verlof <span style={{ color: '#EF4444' }}>*</span></label>
                <select
                  value={leaveForm.type}
                  onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '36px',
                    borderRadius: '14px',
                    border: '1px solid #C1C5CF',
                    padding: '0 12px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#282E3A',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                  }}
                >
                  <option value="vakantie">Vakantie</option>
                  <option value="ziek">Ziek</option>
                  <option value="bijzonder">Bijzonder verlof</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Van <span style={{ color: '#EF4444' }}>*</span></label>
                  <Input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))}
                    style={{ height: '36px' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tot <span style={{ color: '#EF4444' }}>*</span></label>
                  <Input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))}
                    style={{ height: '36px' }}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Reden</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Optioneel..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    borderRadius: '14px',
                    border: '1px solid #C1C5CF',
                    padding: '10px 12px',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '13px',
                    color: '#282E3A',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #D5D8E0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}>
              <Button variant="outline" onClick={() => setShowLeaveModal(false)} style={{ borderRadius: '16px' }}>
                Annuleren
              </Button>
              <Button
                onClick={() => submitLeave.mutate()}
                disabled={!leaveForm.start_date || !leaveForm.end_date || submitLeave.isPending}
                style={{ borderRadius: '16px' }}
              >
                {submitLeave.isPending ? 'Indienen...' : 'Indienen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '13px',
  fontWeight: 500,
  color: '#303542',
  display: 'block',
  marginBottom: '6px',
};

export default EmployeeSchedule;
