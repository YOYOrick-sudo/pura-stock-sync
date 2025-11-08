import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { FohTask, FohEmployee, FohTaskWithEmployee } from '@/types/foh';

export function FohTasks() {
  const [tasks, setTasks] = useState<FohTaskWithEmployee[]>([]);
  const [employees, setEmployees] = useState<FohEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'open' | 'done'>('open');
  
  const [newTask, setNewTask] = useState({
    title: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 2 as 1 | 2 | 3,
    assigned_employee_id: null as string | null,
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [filter]);

  const fetchTasks = async () => {
    setLoading(true);
    
    let query = supabase
      .from('foh_tasks')
      .select(`
        *,
        foh_employees (
          id,
          name,
          location
        )
      `);

    // Server-side filtering
    if (filter === 'open') {
      query = query.eq('completed', false).eq('archived', false);
    } else {
      query = query.or('completed.eq.true,archived.eq.true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Kon taken niet laden');
    } else {
      setTasks(data || []);
    }
    
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('foh_employees')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data || []);
    }
  };

  // Bucket-based sorting
  const sortTasks = (tasksToSort: FohTaskWithEmployee[]) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    return [...tasksToSort].sort((a, b) => {
      const aIsLate = a.due_date < today;
      const bIsLate = b.due_date < today;
      const aIsToday = a.due_date === today;
      const bIsToday = b.due_date === today;
      const aIsTomorrow = a.due_date === tomorrow;
      const bIsTomorrow = b.due_date === tomorrow;
      
      // Bucket 1: Te laat
      if (aIsLate && !bIsLate) return -1;
      if (!aIsLate && bIsLate) return 1;
      
      // Bucket 2: Vandaag
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      
      // Bucket 3: Morgen
      if (aIsTomorrow && !bIsTomorrow) return -1;
      if (!aIsTomorrow && bIsTomorrow) return 1;
      
      // Bucket 4: Overig (datum oplopend)
      if (a.due_date !== b.due_date) {
        return a.due_date.localeCompare(b.due_date);
      }
      
      // Binnen bucket: priority oplopend (1 voor 2 voor 3)
      return a.priority - b.priority;
    });
  };

  const getDateLabel = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (dueDate < today) return 'Te laat';
    if (dueDate === today) return 'Vandaag';
    if (dueDate === tomorrow) return 'Morgen';
    
    return new Date(dueDate).toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getDateLabelColor = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (dueDate < today) return 'bg-red-100 text-red-700';
    if (dueDate === today) return 'bg-green-100 text-green-700';
    if (dueDate === tomorrow) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getPriorityConfig = (priority: number) => {
    switch(priority) {
      case 1: return { label: 'Hoog', color: 'bg-red-100 text-red-700' };
      case 2: return { label: 'Midden', color: 'bg-yellow-100 text-yellow-700' };
      case 3: return { label: 'Laag', color: 'bg-blue-100 text-blue-700' };
      default: return { label: 'Midden', color: 'bg-yellow-100 text-yellow-700' };
    }
  };

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (currentCompleted) {
      // MVP: uncheck uitgeschakeld
      toast.info('Afgeronde taken kunnen niet worden teruggezet');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('foh_tasks')
      .update({
        completed: true,
        archived: true,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      })
      .eq('id', taskId);

    if (error) {
      toast.error('Kon taak niet afvinken');
      console.error(error);
      return;
    }

    toast.success('Taak afgerond!');
    fetchTasks();
  };

  const createTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Vul een titel in');
      return;
    }

    // BELANGRIJK: location wordt NIET meegegeven, wordt automatisch gezet door trigger
    const { error } = await supabase
      .from('foh_tasks')
      .insert({
        title: newTask.title.trim(),
        due_date: newTask.due_date,
        priority: newTask.priority,
        assigned_employee_id: newTask.assigned_employee_id,
      });

    if (error) {
      toast.error('Kon taak niet aanmaken');
      console.error(error);
      return;
    }

    toast.success('Taak aangemaakt!');
    setDialogOpen(false);
    setNewTask({
      title: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 2,
      assigned_employee_id: null,
    });
    fetchTasks();
  };

  const sortedTasks = sortTasks(tasks);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B7867]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            FOH Taken
          </h3>
          <p className="text-sm text-muted-foreground">
            {sortedTasks.length} {sortedTasks.length === 1 ? 'taak' : 'taken'}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe taak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Taak Aanmaken</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Bijv. 'Tafels dekken'"
                />
              </div>

              <div>
                <Label htmlFor="due_date">Datum *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="priority">Prioriteit</Label>
                <Select
                  value={newTask.priority.toString()}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, priority: parseInt(value) as 1 | 2 | 3 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🔴 Hoog</SelectItem>
                    <SelectItem value="2">🟡 Midden</SelectItem>
                    <SelectItem value="3">🔵 Laag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee">Medewerker (optioneel)</Label>
                <Select
                  value={newTask.assigned_employee_id || 'none'}
                  onValueChange={(value) =>
                    setNewTask({ 
                      ...newTask, 
                      assigned_employee_id: value === 'none' ? null : value 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Niet toegewezen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Niet toegewezen</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={createTask}>Aanmaken</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'open' | 'done')}>
        <TabsList className="grid w-full grid-cols-2 bg-white">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="done">Afgerond</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-3">
          {sortedTasks.length === 0 ? (
            <Card className="p-12 border-dashed border-2 border-muted text-center">
              <p className="text-muted-foreground">
                {filter === 'open' ? "Geen open taken" : "Geen afgeronde taken"}
              </p>
            </Card>
          ) : (
            sortedTasks.map((task) => (
              <Card key={task.id} className={`p-4 bg-white shadow-sm ${task.completed ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id, task.completed)}
                    disabled={task.completed}
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge className={getDateLabelColor(task.due_date)}>
                            {getDateLabel(task.due_date)}
                          </Badge>
                          <Badge className={getPriorityConfig(task.priority).color}>
                            {getPriorityConfig(task.priority).label}
                          </Badge>
                          {task.foh_employees && (
                            <Badge variant="outline">
                              👤 {task.foh_employees.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
