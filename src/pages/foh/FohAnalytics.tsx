import { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useStatisticsTimeout } from '@/hooks/useStatisticsTimeout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FohTaskWithEmployee, PhaseType } from '@/types/foh';
import { format, subDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, TrendingUp, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function FohAnalytics() {
  const { userLocation } = useUserLocation();
  const [dateRange, setDateRange] = useState(30);
  
  useStatisticsTimeout();

  // Fetch tasks with history
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['foh-analytics', userLocation, dateRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('foh_tasks')
        .select(`*, foh_employees(*)`)
        .eq('location', userLocation)
        .gte('due_date', startDate)
        .order('due_date', { ascending: false });
      if (error) throw error;
      return data as FohTaskWithEmployee[];
    },
    enabled: !!userLocation,
  });

  // Group tasks by date to identify active days (days with at least 1 completed task)
  const activeDays = useMemo(() => {
    const daysWithActivity = new Set<string>();
    tasks.forEach(t => { if (t.completed) daysWithActivity.add(t.due_date); });
    return daysWithActivity;
  }, [tasks]);

  // Calculate statistics - only count tasks from active days
  const stats = useMemo(() => {
    const activeDayTasks = tasks.filter(t => activeDays.has(t.due_date));
    const total = activeDayTasks.length;
    const completed = activeDayTasks.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const problematic = activeDayTasks.filter(t => !t.completed && new Date(t.due_date) < new Date()).length;
    const employeeStats = tasks.filter(t => t.completed && t.completed_by).reduce((acc, task) => {
      const empId = task.completed_by!;
      const empName = task.foh_employees?.name || 'Onbekend';
      if (!acc[empId]) acc[empId] = { name: empName, count: 0 };
      acc[empId].count++;
      return acc;
    }, {} as Record<string, { name: string; count: number }>);
    const topPerformer = Object.values(employeeStats).sort((a, b) => b.count - a.count)[0];
    return { total, completed, completionRate, problematic, topPerformer, activeDaysCount: activeDays.size };
  }, [tasks, activeDays]);

  // Tasks per phase
  const phaseData = useMemo(() => {
    const phases: PhaseType[] = ['open', 'tussen', 'sluit'];
    return phases.map(phase => ({
      phase: phase.toUpperCase(),
      Voltooid: tasks.filter(t => t.phase === phase && t.completed).length,
      'Niet voltooid': tasks.filter(t => t.phase === phase && !t.completed).length,
    }));
  }, [tasks]);

  // Completion rate over time (per week) - only show weeks with activity
  const timelineData = useMemo(() => {
    const weeks = Math.ceil(dateRange / 7);
    const data = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = subDays(new Date(), i * 7);
      const weekStart = subDays(weekEnd, 7);
      const weekTasks = tasks.filter(t => { const d = new Date(t.due_date); return d >= weekStart && d < weekEnd; });
      const completed = weekTasks.filter(t => t.completed).length;
      const total = weekTasks.length;
      if (completed > 0) data.push({ week: format(weekStart, 'dd MMM', { locale: nl }), rate: Math.round((completed / total) * 100) });
    }
    return data;
  }, [tasks, dateRange]);

  // Most problematic tasks - only count from active days
  const problematicTasks = useMemo(() => {
    const taskStats = tasks.filter(t => !t.completed && activeDays.has(t.due_date)).reduce((acc, task) => {
      const title = task.title;
      if (!acc[title]) acc[title] = { title, count: 0, phase: task.phase, priority: task.priority };
      acc[title].count++;
      return acc;
    }, {} as Record<string, { title: string; count: number; phase: string | null; priority: number }>);
    return Object.values(taskStats).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [tasks, activeDays]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Datum', 'Fase', 'Taak', 'Prioriteit', 'Status', 'Toegewezen aan', 'Voltooid door', 'Voltooid op'];
    const rows = tasks.map(task => [
      format(new Date(task.due_date), 'dd-MM-yyyy'), task.phase?.toUpperCase() || '-', task.title, task.priority,
      task.completed ? 'Voltooid' : 'Open', task.foh_employees?.name || '-', task.completed_by || '-',
      task.completed_at ? format(new Date(task.completed_at), 'dd-MM-yyyy HH:mm') : '-',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taken-analyse-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Export gelukt!');
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px' }}>
          <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1A1F28' }}>Laden...</h1>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 32px' }} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '24px', fontWeight: 700, color: '#1A1F28', letterSpacing: '-0.02em' }}>Taken Analyse</h1>
            <p style={{ fontSize: '14px', color: '#636878' }}>{userLocation}</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Date Range - Pill buttons */}
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDateRange(d)} style={{
              padding: '4px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: dateRange === d ? '#FFF7ED' : 'transparent',
              color: dateRange === d ? '#A5500D' : '#4A4F5E',
            }}>
              {d}D
            </button>
          ))}
        </div>

        {/* Stat Cards */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Totaal Taken', value: stats.total, sub: `Laatste ${dateRange} dagen`, icon: CheckCircle2, accent: '#E27726' },
            { label: 'Voltooiingspercentage', value: `${stats.completionRate}%`, sub: `${stats.completed} van ${stats.total}`, icon: TrendingUp, accent: '#22C55E' },
            { label: 'Achterstallig', value: stats.problematic, sub: 'Niet voltooid & verlopen', icon: AlertCircle, accent: '#EF4444' },
            { label: 'Top Performer', value: stats.topPerformer?.name || '-', sub: `${stats.topPerformer?.count || 0} taken`, icon: Trophy, accent: '#3B82F6' },
          ].map((card, i) => (
            <Card key={i} style={{ borderRadius: '20px', border: '1px solid #D5D8E0', overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '3px', backgroundColor: card.accent, width: '100%' }} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{card.label}</span>
                  <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: `${card.accent}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <card.icon style={{ width: '18px', height: '18px', color: card.accent }} />
                  </div>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1F28', fontFamily: "'Instrument Sans', sans-serif", letterSpacing: '-0.03em' }}>{card.value}</div>
                <p style={{ fontSize: '12px', color: '#636878' }}>{card.sub}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
            <CardHeader style={{ borderBottom: '1px solid #EAECF0' }}>
              <CardTitle style={{ fontSize: '14px', fontWeight: 600, color: '#1A1F28' }}>Taken per Fase</CardTitle>
              <CardDescription style={{ fontSize: '12px', color: '#636878' }}>Verdeling over de fases</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={phaseData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#EAECF0" />
                  <XAxis dataKey="phase" tick={{ fontSize: 11, fill: '#636878' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#636878' }} />
                  <Tooltip />
                  <Bar dataKey="Voltooid" fill="#E27726" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Niet voltooid" fill="#8D93A0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
            <CardHeader style={{ borderBottom: '1px solid #EAECF0' }}>
              <CardTitle style={{ fontSize: '14px', fontWeight: 600, color: '#1A1F28' }}>Voltooiing over Tijd</CardTitle>
              <CardDescription style={{ fontSize: '12px', color: '#636878' }}>Trend per week</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#EAECF0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#636878' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#636878' }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="rate" stroke="#E27726" strokeWidth={2} dot={{ fill: '#E27726', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Problematic Tasks Table */}
        <Card style={{ borderRadius: '20px', border: '1px solid #D5D8E0', overflow: 'hidden' }}>
          <CardHeader style={{ borderBottom: '1px solid #EAECF0' }}>
            <CardTitle style={{ fontSize: '14px', fontWeight: 600, color: '#1A1F28' }}>Probleemtaken</CardTitle>
            <CardDescription style={{ fontSize: '12px', color: '#636878' }}>Taken die vaak onvoltooid blijven</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#F8F9FA' }}>
                  <TableHead style={{ fontSize: '11px', fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taak</TableHead>
                  <TableHead style={{ fontSize: '11px', fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fase</TableHead>
                  <TableHead style={{ fontSize: '11px', fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prioriteit</TableHead>
                  <TableHead className="text-right" style={{ fontSize: '11px', fontWeight: 500, color: '#636878', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Onvoltooid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problematicTasks.map((task, idx) => (
                  <TableRow key={idx}>
                    <TableCell style={{ fontSize: '13px', fontWeight: 500, color: '#303542' }}>{task.title}</TableCell>
                    <TableCell><Badge variant="outline" style={{ borderRadius: '9999px' }}>{task.phase?.toUpperCase() || '-'}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={task.priority === 1 ? 'destructive' : 'secondary'} style={{ borderRadius: '9999px' }}>P{task.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-right" style={{ fontFamily: "'Geist Mono', monospace", fontSize: '12px', fontWeight: 500 }}>{task.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
