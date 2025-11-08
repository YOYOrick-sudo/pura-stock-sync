import { useParams } from 'react-router-dom';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Clock, MapPin } from 'lucide-react';

export default function RecipeDetail() {
  const { id } = useParams();

  // TODO: Replace with actual data from useRecipe hook
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
        {/* Header Card */}
        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary">{recipe.category}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {recipe.location}
                </Badge>
              </div>
              <p className="text-muted-foreground">{recipe.description}</p>
            </div>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{recipe.prep_time_minutes} minuten bereidingstijd</span>
          </div>
        </Card>

        {/* Steps Card */}
        <Card className="p-6 bg-white shadow-sm">
          <h2 className="font-heading font-bold text-lg mb-4 text-foreground">Stappenplan</h2>
          <div className="space-y-3">
            {recipe.steps.map((step) => (
              <div
                key={step.step_number}
                className="flex gap-4 p-4 border-l-4 border-primary bg-background/30 rounded-r-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {step.step_number}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-foreground">{step.instruction}</p>
                  {step.duration_minutes && (
                    <p className="text-xs text-muted-foreground mt-1">⏱️ {step.duration_minutes} min</p>
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
