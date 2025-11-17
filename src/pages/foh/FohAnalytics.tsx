import { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useStatisticsTimeout } from '@/hooks/useStatisticsTimeout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FohTaskWithEmployee, PhaseType } from '@/types/foh';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Download, TrendingUp, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function FohAnalytics() {
  const { userLocation } = useUserLocation();
  const [dateRange, setDateRange] = useState(30); // Last 30 days
  
  useStatisticsTimeout();

  // Fetch tasks with history
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['foh-analytics', userLocation, dateRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('foh_tasks')
        .select(`
          *,
          foh_employees(*)
        `)
        .eq('location', userLocation)
        .gte('due_date', startDate)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data as FohTaskWithEmployee[];
    },
    enabled: !!userLocation,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Tasks that are incomplete and past due date
    const problematic = tasks.filter(t => 
      !t.completed && 
      new Date(t.due_date) < new Date()
    ).length;

    // Find employee with most completions
    const employeeStats = tasks
      .filter(t => t.completed && t.completed_by)
      .reduce((acc, task) => {
        const empId = task.completed_by!;
        const empName = task.foh_employees?.name || 'Onbekend';
        if (!acc[empId]) {
          acc[empId] = { name: empName, count: 0 };
        }
        acc[empId].count++;
        return acc;
      }, {} as Record<string, { name: string; count: number }>);

    const topPerformer = Object.values(employeeStats).sort((a, b) => b.count - a.count)[0];

    return { total, completed, completionRate, problematic, topPerformer };
  }, [tasks]);

  // Tasks per phase
  const phaseData = useMemo(() => {
    const phases: PhaseType[] = ['open', 'tussen', 'sluit'];
    return phases.map(phase => ({
      phase: phase.toUpperCase(),
      Totaal: tasks.filter(t => t.phase === phase).length,
      Voltooid: tasks.filter(t => t.phase === phase && t.completed).length,
      'Niet voltooid': tasks.filter(t => t.phase === phase && !t.completed).length,
    }));
  }, [tasks]);

  // Completion rate over time (per week)
  const timelineData = useMemo(() => {
    const weeks = Math.ceil(dateRange / 7);
    const data = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = subDays(new Date(), i * 7);
      const weekStart = subDays(weekEnd, 7);
      
      const weekTasks = tasks.filter(t => {
        const dueDate = new Date(t.due_date);
        return dueDate >= weekStart && dueDate < weekEnd;
      });

      const completed = weekTasks.filter(t => t.completed).length;
      const total = weekTasks.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      data.push({
        week: format(weekStart, 'dd MMM', { locale: nl }),
        rate,
      });
    }

    return data;
  }, [tasks, dateRange]);

  // Most problematic tasks (templates that often remain incomplete)
  const problematicTasks = useMemo(() => {
    const taskStats = tasks
      .filter(t => !t.completed)
      .reduce((acc, task) => {
        const title = task.title;
        if (!acc[title]) {
          acc[title] = { title, count: 0, phase: task.phase, priority: task.priority };
        }
        acc[title].count++;
        return acc;
      }, {} as Record<string, { title: string; count: number; phase: string | null; priority: number }>);

    return Object.values(taskStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [tasks]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Datum', 'Fase', 'Taak', 'Prioriteit', 'Status', 'Toegewezen aan', 'Voltooid door', 'Voltooid op'];
    const rows = tasks.map(task => [
      format(new Date(task.due_date), 'dd-MM-yyyy'),
      task.phase?.toUpperCase() || '-',
      task.title,
      task.priority,
      task.completed ? 'Voltooid' : 'Open',
      task.foh_employees?.name || '-',
      task.completed_by || '-',
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
        <div className="max-w-7xl mx-auto px-6 space-y-10 pt-12">
          <h1 className="text-3xl font-heading font-bold text-foreground">Laden...</h1>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Taken Analyse</h1>
            <p className="text-sm text-muted-foreground">{userLocation}</p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2">
          <Button
            variant={dateRange === 7 ? 'default' : 'outline'}
            onClick={() => setDateRange(7)}
            size="sm"
          >
            7 dagen
          </Button>
          <Button
            variant={dateRange === 30 ? 'default' : 'outline'}
            onClick={() => setDateRange(30)}
            size="sm"
          >
            30 dagen
          </Button>
          <Button
            variant={dateRange === 90 ? 'default' : 'outline'}
            onClick={() => setDateRange(90)}
            size="sm"
          >
            90 dagen
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Taken</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Laatste {dateRange} dagen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Voltooiingspercentage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed} van {stats.total} voltooid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achterstallig</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.problematic}</div>
              <p className="text-xs text-muted-foreground">
                Niet voltooid & verlopen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <Trophy className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">
                {stats.topPerformer?.name || '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.topPerformer?.count || 0} taken voltooid
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Taken per Fase</CardTitle>
              <CardDescription>Verdeling van taken over de verschillende fases</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={phaseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="phase" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Voltooid" fill="hsl(var(--primary))" />
                  <Bar dataKey="Niet voltooid" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voltooiingspercentage over Tijd</CardTitle>
              <CardDescription>Trend van voltooide taken per week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Problematic Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Probleemtaken</CardTitle>
            <CardDescription>Taken die vaak onvoltooid blijven</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taak</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Prioriteit</TableHead>
                  <TableHead className="text-right">Aantal keer onvoltooid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problematicTasks.map((task, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{task.phase?.toUpperCase() || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={task.priority === 1 ? 'destructive' : task.priority === 2 ? 'default' : 'secondary'}
                      >
                        P{task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{task.count}</TableCell>
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
