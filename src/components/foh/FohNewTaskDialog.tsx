import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Check, ChevronsUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FohEmployee } from '@/types/foh';
import { getAvailableCategoriesForPhase } from './hooks/useFohPhase';

interface FohNewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: FohEmployee[];
  userLocation: string;
  onCreateTask: (taskData: {
    title: string;
    due_date: string;
    priority: 1 | 2 | 3;
    assigned_employee_id: string | null;
    category: string;
    estimated_minutes: number | null;
  }) => Promise<boolean>;
  onCreateEmployee: (name: string) => Promise<any>;
}

export const FohNewTaskDialog = memo(function FohNewTaskDialog({
  open, onOpenChange, employees, userLocation, onCreateTask, onCreateEmployee,
}: FohNewTaskDialogProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [employeeInput, setEmployeeInput] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 2 as 1 | 2 | 3,
    assigned_employee_id: null as string | null,
    category: 'Algemeen',
    estimated_minutes: null as number | null,
  });

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(employeeInput.toLowerCase())
  );
  const exactMatch = employees.find(e => e.name.toLowerCase() === employeeInput.toLowerCase());
  const shouldShowAddNew = employeeInput.trim().length > 0 && !exactMatch;

  const handleSubmit = async () => {
    const success = await onCreateTask(newTask);
    if (success) {
      onOpenChange(false);
      setNewTask({
        title: '', due_date: new Date().toISOString().split('T')[0],
        priority: 2, assigned_employee_id: null, category: 'Algemeen', estimated_minutes: null,
      });
      setEmployeeInput('');
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setNewTask({
      title: '', due_date: new Date().toISOString().split('T')[0],
      priority: 2, assigned_employee_id: null, category: 'Algemeen', estimated_minutes: null,
    });
    setEmployeeInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Nieuwe Periodieke Taak</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div>
            <Label className="text-[13px] font-medium text-foreground">Titel *</Label>
            <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Bijv. Voorraad tellen" className="mt-1.5 rounded-2xl" />
          </div>
          <div>
            <Label className="text-[13px] font-medium text-foreground">Vervaldatum *</Label>
            <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} className="mt-1.5 rounded-2xl" />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-transparent border border-border rounded-xl cursor-pointer text-[13px] font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            {showAdvanced ? <><ChevronUp size={16} /> Minder opties</> : <><ChevronDown size={16} /> Meer opties</>}
          </button>

          {showAdvanced && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[13px] font-medium text-foreground">Prioriteit</Label>
                  <div className="flex gap-2 mt-1.5">
                    {([
                      { value: 1, label: 'Hoog', cls: 'border-destructive bg-destructive/5' },
                      { value: 2, label: 'Normaal', cls: 'border-accent bg-accent/5' },
                      { value: 3, label: 'Laag', cls: 'border-primary bg-primary/5' },
                    ] as const).map(({ value, label, cls }) => (
                      <button
                        key={value}
                        onClick={() => setNewTask({ ...newTask, priority: value })}
                        className={`flex-1 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all ${
                          newTask.priority === value ? `border-2 ${cls}` : 'border border-border bg-card'
                        } text-foreground`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-[13px] font-medium text-foreground">Categorie</Label>
                  <Select value={newTask.category} onValueChange={(val) => setNewTask({ ...newTask, category: val })}>
                    <SelectTrigger className="mt-1.5 rounded-2xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {getAvailableCategoriesForPhase(userLocation, 'periodiek').map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[13px] font-medium text-foreground">Geschatte tijd</Label>
                <Select
                  value={newTask.estimated_minutes?.toString() || ''}
                  onValueChange={(val) => setNewTask({ ...newTask, estimated_minutes: val ? parseInt(val) : null })}
                >
                  <SelectTrigger className="mt-1.5 rounded-2xl"><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 30, 45, 60].map(m => (
                      <SelectItem key={m} value={m.toString()}>{m} min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[13px] font-medium text-foreground">Medewerker</Label>
                <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={employeeOpen} className="w-full justify-between mt-1.5 rounded-2xl">
                      {newTask.assigned_employee_id
                        ? employees.find((e) => e.id === newTask.assigned_employee_id)?.name
                        : "Selecteer medewerker..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Zoek medewerker..." value={employeeInput} onValueChange={setEmployeeInput} />
                      <CommandList>
                        <CommandEmpty>Geen medewerkers gevonden</CommandEmpty>
                        <CommandGroup>
                          {filteredEmployees.map((employee) => (
                            <CommandItem key={employee.id} value={employee.name} onSelect={() => {
                              setNewTask({ ...newTask, assigned_employee_id: employee.id });
                              setEmployeeOpen(false);
                            }}>
                              <Check className={cn("mr-2 h-4 w-4", newTask.assigned_employee_id === employee.id ? "opacity-100" : "opacity-0")} />
                              {employee.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        {shouldShowAddNew && (
                          <>
                            <CommandSeparator />
                            <CommandGroup>
                              <CommandItem onSelect={async () => {
                                const newEmp = await onCreateEmployee(employeeInput.trim());
                                if (newEmp) { setNewTask({ ...newTask, assigned_employee_id: newEmp.id }); setEmployeeOpen(false); }
                              }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Voeg "{employeeInput}" toe
                              </CommandItem>
                            </CommandGroup>
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} className="rounded-[20px]">Annuleren</Button>
          <Button onClick={handleSubmit} className="rounded-[20px] bg-primary text-primary-foreground">Toevoegen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
