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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Loader2, Plus, Check, ChevronsUpDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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

  // Employee autocomplete state
  const [employeeInput, setEmployeeInput] = useState('');
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);

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

  // Filter employees based on input
  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(employeeInput.toLowerCase())
  );

  // Check if input matches existing employee exactly
  const exactMatch = employees.find(
    emp => emp.name.toLowerCase() === employeeInput.trim().toLowerCase()
  );

  // Check if we should show "add new" CTA
  const shouldShowAddNew = employeeInput.trim().length > 0 && !exactMatch;

  // Create new employee inline
  const createEmployeeInline = async (name: string) => {
    if (!name.trim()) {
      toast.error('Vul een naam in');
      return null;
    }

    setIsCreatingEmployee(true);

    const { data, error } = await supabase
      .from('foh_employees')
      .insert({ name: name.trim() })
      .select()
      .single();

    setIsCreatingEmployee(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('Deze naam bestaat al');
      } else {
        toast.error('Kon medewerker niet toevoegen');
        console.error(error);
      }
      return null;
    }

    toast.success(`${name} toegevoegd als medewerker`);
    
    // Refresh employee list
    await fetchEmployees();
    
    return data;
  };

  // Handle employee selection
  const handleEmployeeSelect = (employeeId: string, employeeName: string) => {
    setNewTask({ ...newTask, assigned_employee_id: employeeId });
    setEmployeeInput(employeeName);
    setEmployeeOpen(false);
  };

  // Handle "Add new employee" action
  const handleAddNewEmployee = async () => {
    const newEmployee = await createEmployeeInline(employeeInput);
    
    if (newEmployee) {
      setNewTask({ ...newTask, assigned_employee_id: newEmployee.id });
      setEmployeeOpen(false);
    }
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
    setEmployeeInput('');
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
    <div className="space-y-6">
      {/* Horizontal row: Tabs left, Button right */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'open' | 'done')} className="flex-shrink-0">
          <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-muted/50 p-1">
            <TabsTrigger 
              value="open"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Open
            </TabsTrigger>
            <TabsTrigger 
              value="done"
              className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Afgerond
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Dialog 
          open={dialogOpen} 
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEmployeeInput('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe Taak
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
                
                <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeOpen}
                      className="w-full justify-between"
                    >
                      {newTask.assigned_employee_id
                        ? employees.find(emp => emp.id === newTask.assigned_employee_id)?.name
                        : "Selecteer of typ een naam..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Zoek of typ nieuwe naam..."
                        value={employeeInput}
                        onValueChange={setEmployeeInput}
                      />
                      <CommandList>
                        {filteredEmployees.length === 0 && !shouldShowAddNew && (
                          <CommandEmpty>Geen medewerkers gevonden</CommandEmpty>
                        )}
                        
                        {filteredEmployees.length > 0 && (
                          <CommandGroup heading="Bestaande medewerkers">
                            {filteredEmployees.map((emp) => (
                              <CommandItem
                                key={emp.id}
                                value={emp.id}
                                onSelect={() => handleEmployeeSelect(emp.id, emp.name)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newTask.assigned_employee_id === emp.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {emp.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        
                        {shouldShowAddNew && (
                          <>
                            {filteredEmployees.length > 0 && <CommandSeparator />}
                            <CommandGroup>
                              <CommandItem
                                onSelect={handleAddNewEmployee}
                                className="bg-green-50 text-green-700"
                                disabled={isCreatingEmployee}
                              >
                                {isCreatingEmployee ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Medewerker toevoegen...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Voeg "{employeeInput.trim()}" toe als nieuwe medewerker
                                  </>
                                )}
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                        
                        {/* Option to clear selection */}
                        {newTask.assigned_employee_id && (
                          <>
                            <CommandSeparator />
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  setNewTask({ ...newTask, assigned_employee_id: null });
                                  setEmployeeInput('');
                                  setEmployeeOpen(false);
                                }}
                                className="text-muted-foreground"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Geen medewerker toewijzen
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

      {/* Task list - outside the horizontal row */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'open' | 'done')}>
        <TabsContent value={filter} className="mt-0 space-y-3">
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
