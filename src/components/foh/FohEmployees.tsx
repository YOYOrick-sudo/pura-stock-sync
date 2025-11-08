import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FohEmployee } from '@/types/foh';

export function FohEmployees() {
  const [employees, setEmployees] = useState<FohEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('foh_employees')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching employees:', error);
      toast.error('Kon medewerkers niet laden');
    } else {
      setEmployees(data || []);
    }
    
    setLoading(false);
  };

  const addEmployee = async () => {
    const trimmedName = newEmployeeName.trim();
    
    if (!trimmedName) {
      toast.error('Vul een naam in');
      return;
    }

    // BELANGRIJK: location wordt NIET meegegeven, wordt automatisch gezet door trigger
    const { error } = await supabase
      .from('foh_employees')
      .insert({
        name: trimmedName,
      });

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        toast.error('Deze naam bestaat al voor deze locatie');
      } else {
        toast.error('Kon medewerker niet toevoegen');
        console.error(error);
      }
      return;
    }

    toast.success('Medewerker toegevoegd!');
    setDialogOpen(false);
    setNewEmployeeName('');
    fetchEmployees();
  };

  const deleteEmployee = async (employeeId: string, employeeName: string) => {
    const confirmed = window.confirm(
      `Weet je zeker dat je ${employeeName} wilt verwijderen?`
    );
    
    if (!confirmed) return;

    const { error } = await supabase
      .from('foh_employees')
      .delete()
      .eq('id', employeeId);

    if (error) {
      toast.error('Kon medewerker niet verwijderen');
      console.error(error);
      return;
    }

    toast.success('Medewerker verwijderd');
    fetchEmployees();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
            Medewerkers
          </h3>
          <p className="text-sm text-muted-foreground">
            {employees.length} {employees.length === 1 ? 'medewerker' : 'medewerkers'}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nieuwe medewerker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe Medewerker Toevoegen</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Naam *</Label>
                <Input
                  id="name"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  placeholder="Bijv. 'Jan Jansen'"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmployee();
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={addEmployee}>Toevoegen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {employees.length === 0 ? (
        <Card className="p-12 border-dashed border-2 border-muted text-center">
          <p className="text-muted-foreground">Nog geen medewerkers toegevoegd</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {employees.map((employee) => (
            <Card key={employee.id} className="p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#1B7867] text-white">
                      {getInitials(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{employee.name}</h4>
                    <Badge variant="secondary" className="mt-1">
                      Bediening
                    </Badge>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => deleteEmployee(employee.id, employee.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
