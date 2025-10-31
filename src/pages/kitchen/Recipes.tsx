import { useState } from 'react';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { useNavigate } from 'react-router-dom';

export default function Recipes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  // TODO: Replace with actual data from useRecipes hook
  const recipes: any[] = [];

  return (
    <KitchenLayout title="Recepten" subtitle="Stappenplannen & bereidingen">
      <div className="space-y-6">
        {/* Search & Filter */}
        <Card className="p-4 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek recepten..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
            <Button className="bg-primary hover:bg-primary-hover">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw recept
            </Button>
          </div>
        </Card>

        {/* Recipes Grid */}
        {recipes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Geen recepten gevonden"
            description="Voeg je eerste recept toe om te beginnen"
            action={{
              label: 'Nieuw recept',
              onClick: () => console.log('Add recipe'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/kitchen/recipes/${recipe.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{recipe.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {recipe.category}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>⏱️ {recipe.prep_time_minutes} min</span>
                  <span>📝 {recipe.step_count} stappen</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </KitchenLayout>
  );
}
