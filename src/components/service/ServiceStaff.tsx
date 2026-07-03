import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserX, Users } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { devError } from "@/lib/devLog";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
  created_at: string;
}

export function ServiceStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('location', 'Midsland')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      devError('Error fetching staff:', error);
      toast.error('Kon medewerkers niet laden');
    } finally {
      setLoading(false);
    }
  };

  const staffSchema = z.object({
    name: z.string().trim().min(1, 'Naam is verplicht').max(100, 'Naam mag maximaal 100 tekens zijn'),
  });

  const addStaff = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validation = staffSchema.safeParse({ name: newStaffName });
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const { error } = await supabase
        .from('staff_members')
        .insert({
          name: validation.data.name,
          location: 'Midsland',
          role: 'service',
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Medewerker toegevoegd!');
      setDialogOpen(false);
      setNewStaffName('');
      fetchStaff();
    } catch (error) {
      devError('Error adding staff:', error);
      toast.error('Kon medewerker niet toevoegen');
    }
  };

  const removeStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Weet je zeker dat je ${staffName} wilt verwijderen?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ active: false })
        .eq('id', staffId);

      if (error) throw error;

      toast.success('Medewerker verwijderd');
      fetchStaff();
    } catch (error) {
      devError('Error removing staff:', error);
      toast.error('Kon medewerker niet verwijderen');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">
            {staff.length} {staff.length === 1 ? 'medewerker' : 'medewerkers'}
          </span>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe medewerker toevoegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Naam</Label>
                <Input
                  id="name"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Volledige naam"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addStaff();
                    }
                  }}
                />
              </div>
              <Button onClick={addStaff} className="w-full">
                Toevoegen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Geen medewerkers"
          description="Voeg je eerste medewerker toe om te beginnen"
        />
      ) : (
        <div className="grid gap-3">
          {staff.map((member) => (
            <Card key={member.id} className="p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{member.name}</h3>
                    <Badge className="bg-green-100 text-green-600 text-xs mt-1">
                      Bediening
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStaff(member.id, member.name)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}