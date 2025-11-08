import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
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

  const createTask = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!newTask.title.trim()) {
        toast.error('Titel is verplicht');
        return;
      }

      const { error } = await supabase
        .from('kitchen_tasks')
        .insert({
          ...newTask,
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

  const getCategoryColor = (category: string) => {
    return 'bg-green-100 text-green-600';
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  const todayTasks = tasks.filter(
    (task) => task.due_date === new Date().toISOString().split('T')[0]
  );

  const allTasks = tasks;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe taak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe taak aanmaken</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Bijv. Tafels dekken"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Extra details..."
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequentie</Label>
                <Select
                  value={newTask.frequency}
                  onValueChange={(value) =>
                    setNewTask({ ...newTask, frequency: value })
                  }
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
                <Label htmlFor="due_date">Datum</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) =>
                    setNewTask({ ...newTask, due_date: e.target.value })
                  }
                />
              </div>
              <Button onClick={createTask} className="w-full">
                Taak aanmaken
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white">
          <TabsTrigger value="today">Vandaag</TabsTrigger>
          <TabsTrigger value="all">Alle taken</TabsTrigger>
        </TabsList>

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
                <Card
                  key={task.id}
                  className={`p-4 bg-white shadow-sm ${
                    task.completed ? 'opacity-50' : ''
                  }`}
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
                          className={`font-semibold text-foreground ${
                            task.completed ? 'line-through' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        <Badge className={getCategoryColor(task.category)}>
                          Bediening
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{task.frequency}</span>
                      </div>
                    </div>
                  </div>
                </Card>
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
                <Card
                  key={task.id}
                  className={`p-4 bg-white shadow-sm ${
                    task.completed ? 'opacity-50' : ''
                  }`}
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
                          className={`font-semibold text-foreground ${
                            task.completed ? 'line-through' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        <Badge className={getCategoryColor(task.category)}>
                          Bediening
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.due_date && (
                          <span>
                            📅 {new Date(task.due_date).toLocaleDateString('nl-NL')}
                          </span>
                        )}
                        <span className="capitalize">{task.frequency}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}