import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Home, Coffee, Clock, CheckCircle, ChevronRight, Palmtree } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');
const weekStart = startOfWeek(today, { weekStartsOn: 1 });
const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
const weekStartStr = format(weekStart, 'yyyy-MM-dd');
const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

const SHIFT_COLORS: Record<string, string> = {
  ochtend: '#3B82F6',
  middag: '#F59E0B',
  avond: '#E27726',
};

const SHIFT_BG: Record<string, string> = {
  ochtend: '#DBEAFE',
  middag: '#FEF3C7',
  avond: '#FFF7ED',
};

function shiftLabel(type: string | null) {
  if (!type) return 'Dienst';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function calcHours(start: string, end: string, breakMin: number | null) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm) - (breakMin || 0);
  return Math.max(0, mins / 60);
}

// ── Skeleton ─────────────────────────────────────────────

function Skeleton({ w = '100%', h = 12 }: { w?: string | number; h?: number }) {
  return (
    <div
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: `${h}px`,
        backgroundColor: '#EAECF0',
        borderRadius: 14,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

function SkeletonCard({ height = 160 }: { height?: number }) {
  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #D5D8E0',
        borderRadius: 20,
        padding: 20,
        height,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Skeleton w="40%" h={14} />
      <Skeleton w="70%" h={10} />
      <Skeleton w="55%" h={10} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────

const MijnDashboard = () => {
  const queryClient = useQueryClient();

  // ── Data queries ──
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const userId = session?.user?.id;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', userId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['my-role', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('location, role')
        .eq('user_id', userId!)
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
  });

  const { data: todaySchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['my-schedule-today', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId!)
        .eq('date', todayStr)
        .maybeSingle();
      return data;
    },
  });

  const { data: weekSchedules } = useQuery({
    queryKey: ['my-schedule-week', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('schedules')
        .select('date, start_time, end_time, shift_type, break_minutes')
        .eq('user_id', userId!)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr);
      return data || [];
    },
  });

  const { data: timeReg } = useQuery({
    queryKey: ['my-timereg-today', userId],
    enabled: !!userId,
    queryFn: async () => {
      const startOfDay = `${todayStr}T00:00:00`;
      const endOfDay = `${todayStr}T23:59:59`;
      const { data } = await supabase
        .from('time_registrations')
        .select('*')
        .eq('user_id', userId!)
        .gte('clock_in', startOfDay)
        .lte('clock_in', endOfDay)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: openTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['my-open-tasks', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('foh_tasks')
        .select('id, title, category, priority')
        .eq('completed', false)
        .eq('archived', false)
        .order('priority', { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  const { data: leaveRequests } = useQuery({
    queryKey: ['my-leave', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('start_date, end_date')
        .eq('user_id', userId!)
        .eq('status', 'approved')
        .eq('type', 'vakantie');
      return data || [];
    },
  });

  // ── Mutations ──
  const clockIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('time_registrations').insert({
        user_id: userId!,
        clock_in: new Date().toISOString(),
        location: userRole?.location || '',
        schedule_id: todaySchedule?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-timereg-today'] });
      toast.success('Ingeklokt!');
    },
    onError: () => toast.error('Kon niet inklokken'),
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('time_registrations')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', timeReg!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-timereg-today'] });
      toast.success('Uitgeklokt!');
    },
    onError: () => toast.error('Kon niet uitklokken'),
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('foh_tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-open-tasks'] });
      toast.success('Taak afgerond!');
    },
  });

  // ── Computed ──
  const weekTotalHours = (weekSchedules || []).reduce((sum, s) => {
    return sum + calcHours(s.start_time, s.end_time, s.break_minutes);
  }, 0);

  const leaveDaysUsed = leaveRequests?.reduce((sum, lr) => {
    const start = parseISO(lr.start_date);
    const end = parseISO(lr.end_date);
    return sum + differenceInCalendarDays(end, start) + 1;
  }, 0) || 0;

  const isLoading = profileLoading || roleLoading || scheduleLoading;

  // ── Render ──
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* WELKOMST HEADER */}
      <div style={{ marginBottom: 32 }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton w="50%" h={24} />
            <Skeleton w="35%" h={14} />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#FFF7ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Home size={18} color="#E27726" />
              </div>
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
                {getGreeting()}, {profile?.first_name || 'medewerker'}
              </h1>
            </div>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                color: '#636878',
                margin: 0,
                paddingLeft: 48,
              }}
            >
              {userRole?.location || ''} · {format(today, 'EEEE d MMMM yyyy', { locale: nl })}
            </p>
          </>
        )}
      </div>

      {/* GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* DIENST VANDAAG */}
          {scheduleLoading ? (
            <SkeletonCard height={180} />
          ) : (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D5D8E0',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#303542',
                  margin: '0 0 16px',
                }}
              >
                Mijn dienst vandaag
              </p>

              {todaySchedule ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: SHIFT_BG[todaySchedule.shift_type || ''] || '#F1F3F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock
                        size={20}
                        color={SHIFT_COLORS[todaySchedule.shift_type || ''] || '#8D93A0'}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#1A1F28',
                          margin: 0,
                        }}
                      >
                        {todaySchedule.start_time?.slice(0, 5)} – {todaySchedule.end_time?.slice(0, 5)}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 500,
                            fontFamily: 'Inter, sans-serif',
                            backgroundColor: SHIFT_BG[todaySchedule.shift_type || ''] || '#F1F3F5',
                            color: SHIFT_COLORS[todaySchedule.shift_type || ''] || '#636878',
                          }}
                        >
                          {shiftLabel(todaySchedule.shift_type)}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: 'Inter, sans-serif',
                            color: '#8D93A0',
                          }}
                        >
                          {todaySchedule.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clock in/out */}
                  {!timeReg ? (
                    <button
                      onClick={() => clockIn.mutate()}
                      disabled={clockIn.isPending}
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 14,
                        border: 'none',
                        backgroundColor: '#E27726',
                        color: '#FFFFFF',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        opacity: clockIn.isPending ? 0.8 : 1,
                      }}
                      onMouseDown={(e) => ((e.target as HTMLElement).style.transform = 'scale(0.97)')}
                      onMouseUp={(e) => ((e.target as HTMLElement).style.transform = 'scale(1)')}
                    >
                      {clockIn.isPending ? 'Bezig...' : 'Klok in'}
                    </button>
                  ) : !timeReg.clock_out ? (
                    <button
                      onClick={() => clockOut.mutate()}
                      disabled={clockOut.isPending}
                      style={{
                        width: '100%',
                        height: 36,
                        borderRadius: 14,
                        border: '1px solid #C1C5CF',
                        backgroundColor: '#FFFFFF',
                        color: '#303542',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseDown={(e) => ((e.target as HTMLElement).style.transform = 'scale(0.97)')}
                      onMouseUp={(e) => ((e.target as HTMLElement).style.transform = 'scale(1)')}
                    >
                      {clockOut.isPending ? 'Bezig...' : 'Klok uit'}
                    </button>
                  ) : (
                    <p
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: 12,
                        color: '#8D93A0',
                        margin: 0,
                      }}
                    >
                      Ingeklokt {new Date(timeReg.clock_in).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })} – {new Date(timeReg.clock_out!).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: '#F1F3F5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <Coffee size={22} color="#8D93A0" />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#303542', margin: 0 }}>
                    Je hebt vandaag geen dienst
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#636878', marginTop: 4 }}>
                    Geniet van je vrije dag!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DEZE WEEK */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D5D8E0',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: '#303542',
                margin: '0 0 16px',
              }}
            >
              Deze week
            </p>

            <div style={{ display: 'flex', gap: 4 }}>
              {DAY_NAMES.map((name, i) => {
                const day = addDays(weekStart, i);
                const dayStr = format(day, 'yyyy-MM-dd');
                const schedule = weekSchedules?.find((s) => s.date === dayStr);
                const isToday = dayStr === todayStr;
                const dotColor = schedule
                  ? SHIFT_COLORS[schedule.shift_type || ''] || '#8D93A0'
                  : '#EAECF0';

                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px 4px',
                      borderRadius: 12,
                      border: isToday ? '2px solid #E27726' : '2px solid transparent',
                      backgroundColor: isToday ? '#FFF7ED' : 'transparent',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#8D93A0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: 0,
                      }}
                    >
                      {name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#303542',
                        margin: '4px 0',
                      }}
                    >
                      {format(day, 'd')}
                    </p>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: dotColor,
                        margin: '0 auto',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #EAECF0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: '#636878',
                }}
              >
                Totaal uren deze week
              </span>
              <span
                style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#1A1F28',
                  letterSpacing: '-0.03em',
                }}
              >
                {weekTotalHours.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* OPEN TAKEN */}
          {tasksLoading ? (
            <SkeletonCard height={220} />
          ) : (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D5D8E0',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#303542',
                  margin: '0 0 16px',
                }}
              >
                Open taken
              </p>

              {openTasks && openTasks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {openTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        borderBottom: '1px solid #EAECF0',
                      }}
                    >
                      <button
                        onClick={() => completeTask.mutate(task.id)}
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          border: '2px solid #C1C5CF',
                          backgroundColor: '#FFFFFF',
                          cursor: 'pointer',
                          flexShrink: 0,
                          padding: 0,
                          transition: 'border-color 0.15s',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 13,
                          color: '#303542',
                          flex: 1,
                        }}
                      >
                        {task.title}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          fontFamily: 'Inter, sans-serif',
                          backgroundColor: '#F1F3F5',
                          color: '#636878',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {task.category}
                      </span>
                    </div>
                  ))}

                  <Link
                    to="/mijn/taken"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#E27726',
                      textDecoration: 'none',
                      marginTop: 8,
                    }}
                  >
                    Bekijk alle taken <ChevronRight size={14} />
                  </Link>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: '#DCFCE8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <CheckCircle size={22} color="#22C55E" />
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500, color: '#303542', margin: 0 }}>
                    Geen open taken
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#636878', marginTop: 4 }}>
                    Alles is afgerond. Goed bezig!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* VERLOFSALDO */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #D5D8E0',
              borderRadius: 20,
              padding: 20,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: '#303542',
                margin: '0 0 16px',
              }}
            >
              Verlofsaldo
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#FFF7ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Palmtree size={18} color="#E27726" />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1A1F28',
                    margin: 0,
                  }}
                >
                  {leaveDaysUsed}
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#8D93A0' }}> / 25 dagen</span>
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 4,
                backgroundColor: '#D5D8E0',
                borderRadius: 9999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, (leaveDaysUsed / 25) * 100)}%`,
                  height: '100%',
                  backgroundColor: '#E27726',
                  borderRadius: 9999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#636878',
                marginTop: 8,
              }}
            >
              {leaveDaysUsed} van 25 dagen opgenomen
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MijnDashboard;
