import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useCreateAccommodation } from '@/hooks/hr/useAccommodations';
import { devError } from "@/lib/devLog";

const LOCATIONS = ['West', 'Midsland'];

export default function HousingForm() {
  const navigate = useNavigate();
  const createAccommodation = useCreateAccommodation();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: '',
    capacity: 1,
    description: '',
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createAccommodation.mutateAsync({
        name: formData.name,
        address: formData.address || undefined,
        location: formData.location || undefined,
        capacity: formData.capacity,
        description: formData.description || undefined,
      });

      navigate('/hr/housing');
    } catch (error) {
      devError('Error creating accommodation:', error);
    }
  };

  const isValid = formData.name && formData.capacity > 0;

  return (
    <SidebarLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate('/hr/housing')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>

        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">
          Nieuwe Woonruimte
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-4">
            <h2 className="font-semibold text-foreground mb-4">Details</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="bijv. Appartement 1 of Kamer 2B"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Straatnaam en huisnummer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Locatie</Label>
                  <Select value={formData.location} onValueChange={(v) => handleChange('location', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capaciteit (slaapplaatsen) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Omschrijving</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Extra informatie over de woonruimte..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/hr/housing')}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!isValid || createAccommodation.isPending}>
              {createAccommodation.isPending ? 'Bezig...' : 'Woonruimte Toevoegen'}
            </Button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
