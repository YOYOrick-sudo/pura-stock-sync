import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckSquare, Calendar } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: string;
  completed: boolean;
  due_date: string;
  assigned_to: any;
}

export function ServiceTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'service',
    frequency: 'daily',
    due_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('kitchen_tasks')
        .select('*')
        .eq('location', 'Midsland')
        .eq('category', 'service')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Kon taken niet laden');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('kitchen_tasks')
        .update({
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
          completed_by: !currentStatus ? user.id : null,
        })
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success(!currentStatus ? 'Taak voltooid!' : 'Taak heropend');
      fetchTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Kon taak niet updaten');
    }
  };

  const taskSchema = z.object({
    title: z.string().trim().min(1, 'Titel is verplicht').max(200, 'Titel mag maximaal 200 tekens zijn'),
    description: z.string().max(500, 'Beschrijving mag maximaal 500 tekens zijn').optional(),
  });

  const createTask = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validation = taskSchema.safeParse({ 
        title: newTask.title,
        description: newTask.description 
      });
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const { error } = await supabase
        .from('kitchen_tasks')
        .insert({
          ...newTask,
          title: validation.data.title,
          description: validation.data.description || '',
          location: 'Midsland',
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Taak aangemaakt!');
      setDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        category: 'service',
        frequency: 'daily',
        due_date: new Date().toISOString().split('T')[0],
      });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Kon taak niet aanmaken');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #D5D8E0',
            borderRadius: '20px',
            padding: '20px',
          }}>
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 mt-1 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const todayTasks = tasks.filter(
    (task) => task.due_date === new Date().toISOString().split('T')[0]
  );

  const allTasks = tasks;

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      style={{
        backgroundColor: task.completed ? '#FCFCFD' : '#FFFFFF',
        border: '1.5px solid #D5D8E0',
        borderRadius: '20px',
        padding: '20px',
        opacity: task.completed ? 0.6 : 1,
        transition: 'background-color 0.15s',
      }}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          className="mt-1"
          onCheckedChange={() => toggleTask(task.id, task.completed)}
        />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#282E3A',
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#16A34A',
              }}
            >
              Bediening
            </span>
          </div>
          {task.description && (
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#636878',
              marginBottom: '8px',
            }}>
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-4" style={{ fontSize: '12px', color: '#8D93A0' }}>
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(task.due_date).toLocaleDateString('nl-NL')}
              </span>
            )}
            <span className="capitalize">{task.frequency}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 18px',
                height: '40px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#E27726',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C9630E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E27726'}
            >
              <Plus className="h-4 w-4" />
              Nieuwe taak
            </button>
          </DialogTrigger>
          <DialogContent style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #D5D8E0',
            padding: '32px',
            maxWidth: '480px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <DialogHeader>
              <DialogTitle style={{
                fontFamily: 'Instrument Sans, Inter, sans-serif',
                fontSize: '18px',
                fontWeight: 600,
                color: '#282E3A',
                letterSpacing: '-0.02em',
              }}>
                Nieuwe taak aanmaken
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#282E3A' }}>Titel</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Bijv. Tafels dekken"
                  style={{ borderRadius: '14px', border: '1px solid #C1C5CF' }}
                />
              </div>
              <div>
                <Label htmlFor="description" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#282E3A' }}>Beschrijving</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Extra details..."
                  style={{ borderRadius: '14px', border: '1px solid #C1C5CF' }}
                />
              </div>
              <div>
                <Label htmlFor="frequency" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#282E3A' }}>Frequentie</Label>
                <Select
                  value={newTask.frequency}
                  onValueChange={(value) => setNewTask({ ...newTask, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Dagelijks</SelectItem>
                    <SelectItem value="weekly">Wekelijks</SelectItem>
                    <SelectItem value="monthly">Maandelijks</SelectItem>
                    <SelectItem value="once">Eenmalig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="due_date" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500, color: '#282E3A' }}>Datum</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  style={{ borderRadius: '14px', border: '1px solid #C1C5CF' }}
                />
              </div>
              <button
                onClick={createTask}
                style={{
                  width: '100%',
                  height: '40px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: '#E27726',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#C9630E'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E27726'}
              >
                Taak aanmaken
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <div
          style={{
            display: 'inline-flex',
            padding: '4px',
            backgroundColor: '#F1F3F5',
            borderRadius: '14px',
            gap: '4px',
          }}
        >
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger
              value="today"
              style={{ borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500 }}
            >
              Vandaag
            </TabsTrigger>
            <TabsTrigger
              value="all"
              style={{ borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 500 }}
            >
              Alle taken
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today">
          {todayTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Geen taken vandaag"
              description="Alle taken zijn voltooid of er zijn geen taken voor vandaag"
            />
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {allTasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Geen taken"
              description="Er zijn nog geen taken toegevoegd"
            />
          ) : (
            <div className="space-y-3">
              {allTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
