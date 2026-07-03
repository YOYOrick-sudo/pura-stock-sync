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
import { useCreateCandidate } from '@/hooks/hr/useCandidates';
import { useCreateApplication } from '@/hooks/hr/useApplications';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';
import { devError } from "@/lib/devLog";

const POSITIONS = [
  'Bediening',
  'Keuken',
  'Afwas',
  'Manager',
  'Allround',
];

const LOCATIONS = ['West', 'Midsland'];

const SOURCES = [
  'Website',
  'Indeed',
  'Referral',
  'Social Media',
  'Email',
  'Anders',
];

export default function ApplicantForm() {
  const navigate = useNavigate();
  const createCandidate = useCreateCandidate();
  const createApplication = useCreateApplication();

  const [formData, setFormData] = useState({
    // Candidate fields
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nationality: '',
    notes: '',
    // Application fields
    position: '',
    target_location: '',
    source: '',
    season: new Date().getFullYear().toString(),
    // Workflow fields
    next_action_type: 'Bellen',
    next_action_days: 3,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user for owner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Create candidate first
      const candidate = await createCandidate.mutateAsync({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        nationality: formData.nationality || undefined,
        notes: formData.notes || undefined,
      });

      // Calculate next action date
      const nextActionAt = addDays(new Date(), formData.next_action_days);
      nextActionAt.setHours(10, 0, 0, 0);

      // Create application
      await createApplication.mutateAsync({
        candidate_id: candidate.id,
        position: formData.position,
        target_location: formData.target_location || undefined,
        source: formData.source || undefined,
        season: formData.season || undefined,
        owner_user_id: user.id,
        next_action_type: formData.next_action_type,
        next_action_at: nextActionAt.toISOString(),
      });

      navigate('/hr');
    } catch (error) {
      devError('Error creating applicant:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.first_name && formData.last_name && formData.position;

  return (
    <SidebarLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate('/hr')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>

        <h1 className="text-2xl font-heading font-bold text-foreground mb-6">
          Nieuwe Kandidaat
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <Card className="p-4">
            <h2 className="font-semibold text-foreground mb-4">Persoonlijke Gegevens</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Voornaam *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Achternaam *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="nationality">Nationaliteit</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
              />
            </div>
          </Card>

          {/* Application Info */}
          <Card className="p-4">
            <h2 className="font-semibold text-foreground mb-4">Sollicitatie</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Functie *</Label>
                <Select value={formData.position} onValueChange={(v) => handleChange('position', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer functie" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_location">Locatie</Label>
                <Select value={formData.target_location} onValueChange={(v) => handleChange('target_location', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer locatie" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="source">Bron</Label>
                <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hoe gevonden?" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="season">Seizoen</Label>
                <Input
                  id="season"
                  value={formData.season}
                  onChange={(e) => handleChange('season', e.target.value)}
                  placeholder="bijv. 2026 of Zomer 2026"
                />
              </div>
            </div>
          </Card>

          {/* Workflow */}
          <Card className="p-4">
            <h2 className="font-semibold text-foreground mb-4">Eerste Actie</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="next_action_type">Volgende actie</Label>
                <Select value={formData.next_action_type} onValueChange={(v) => handleChange('next_action_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bellen">Bellen</SelectItem>
                    <SelectItem value="WhatsApp sturen">WhatsApp sturen</SelectItem>
                    <SelectItem value="E-mail sturen">E-mail sturen</SelectItem>
                    <SelectItem value="CV bekijken">CV bekijken</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_action_days">Binnen (dagen)</Label>
                <Select 
                  value={formData.next_action_days.toString()} 
                  onValueChange={(v) => handleChange('next_action_days', parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dag</SelectItem>
                    <SelectItem value="2">2 dagen</SelectItem>
                    <SelectItem value="3">3 dagen</SelectItem>
                    <SelectItem value="5">5 dagen</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-4">
            <h2 className="font-semibold text-foreground mb-4">Notities</h2>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Eventuele opmerkingen..."
              rows={3}
            />
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/hr')}>
              Annuleren
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Bezig...' : 'Kandidaat Toevoegen'}
            </Button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
