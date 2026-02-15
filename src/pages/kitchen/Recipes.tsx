import { useState } from 'react';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, BookOpen, Clock, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { useNavigate } from 'react-router-dom';

export default function Recipes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const recipes: any[] = [];

  return (
    <KitchenLayout title="Recepten" subtitle="Stappenplannen & bereidingen">
      <div className="space-y-6">
        {/* Search & Filter */}
        <Card className="p-4" style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1" style={{ maxWidth: '320px' }}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#8D93A0' }} />
              <Input
                placeholder="Zoek recepten..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nieuw recept
            </Button>
          </div>
        </Card>

        {recipes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Geen recepten gevonden"
            description="Voeg je eerste recept toe om te beginnen"
            action={{ label: 'Nieuw recept', onClick: () => console.log('Add recipe') }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all duration-150"
                style={{ borderRadius: '20px', border: '1px solid #D5D8E0' }}
                onClick={() => navigate(`/kitchen/recipes/${recipe.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#303542' }}>{recipe.name}</h3>
                  <Badge variant="secondary" className="text-xs">{recipe.category}</Badge>
                </div>
                <p style={{ fontSize: '13px', color: '#636878', marginBottom: '12px' }}>{recipe.description}</p>
                <div className="flex items-center gap-4" style={{ fontSize: '12px', color: '#636878' }}>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recipe.prep_time_minutes} min</span>
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {recipe.step_count} stappen</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </KitchenLayout>
  );
}
