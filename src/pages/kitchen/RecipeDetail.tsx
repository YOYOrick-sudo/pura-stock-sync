import { useParams } from 'react-router-dom';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Clock, MapPin } from 'lucide-react';

export default function RecipeDetail() {
  const { id } = useParams();

  const recipe = {
    id,
    name: 'Bananenbrood',
    category: 'Bakwerk',
    description: 'Heerlijk bananenbrood voor in de vitrine',
    prep_time_minutes: 60,
    location: 'West',
    steps: [
      { step_number: 1, instruction: 'Verwarm de oven voor op 180°C', duration_minutes: 5 },
      { step_number: 2, instruction: 'Meng de droge ingrediënten', duration_minutes: 10 },
      { step_number: 3, instruction: 'Voeg de natte ingrediënten toe', duration_minutes: 5 },
      { step_number: 4, instruction: 'Giet in de vorm en bak 45 minuten', duration_minutes: 45 },
    ],
  };

  return (
    <KitchenLayout title={recipe.name} subtitle={recipe.category} backTo="/kitchen/recipes" backLabel="Recepten">
      <div className="space-y-6">
        <Card className="p-6" style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary" style={{ borderRadius: '9999px' }}>{recipe.category}</Badge>
                <Badge variant="outline" className="flex items-center gap-1" style={{ borderRadius: '9999px' }}>
                  <MapPin className="h-3 w-3" />{recipe.location}
                </Badge>
              </div>
              <p style={{ fontSize: '13px', color: '#636878' }}>{recipe.description}</p>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />Bewerken
            </Button>
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: '13px', color: '#636878' }}>
            <Clock className="h-4 w-4" />
            <span>{recipe.prep_time_minutes} minuten bereidingstijd</span>
          </div>
        </Card>

        <Card className="p-6" style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
          <h2 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '18px', fontWeight: 600, color: '#1A1F28', letterSpacing: '-0.02em', marginBottom: '16px' }}>Stappenplan</h2>
          <div className="space-y-3">
            {recipe.steps.map((step) => (
              <div key={step.step_number} className="flex gap-4 p-4 rounded-r-[14px]" style={{ borderLeft: '3px solid #E27726', backgroundColor: '#F8F9FA' }}>
                <div className="flex-shrink-0">
                  <div style={{ width: '32px', height: '32px', borderRadius: '12px', backgroundColor: '#E27726', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>
                    {step.step_number}
                  </div>
                </div>
                <div className="flex-1">
                  <p style={{ fontSize: '13px', color: '#303542' }}>{step.instruction}</p>
                  {step.duration_minutes && (
                    <p style={{ fontSize: '12px', color: '#636878', marginTop: '4px' }} className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {step.duration_minutes} min
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </KitchenLayout>
  );
}
