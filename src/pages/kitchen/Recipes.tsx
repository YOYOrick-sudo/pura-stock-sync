import { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BookOpen, ImageIcon } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useRecipes, useRecipeCategories } from '@/hooks/useRecipes';
import { cn } from '@/lib/utils';

export default function Recipes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const { data: recipes = [], isLoading } = useRecipes(search, category);
  const { data: categories = [] } = useRecipeCategories();

  const chips = useMemo(() => ['Alle', ...categories], [categories]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Search & add */}
        <Card className="p-4 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Zoek recepten..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 text-base bg-white"
              />
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/kitchen/recipes/nieuw')}
              className="min-h-[48px]"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nieuw recept
            </Button>
          </div>

          {chips.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {chips.map((c) => {
                const active = c === 'Alle' ? category === null : category === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c === 'Alle' ? null : c)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px]',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80',
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laden…</div>
        ) : recipes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Geen recepten gevonden"
            description={search || category ? 'Pas je zoekopdracht aan' : 'Voeg je eerste recept toe om te beginnen'}
            action={{
              label: 'Nieuw recept',
              onClick: () => navigate('/kitchen/recipes/nieuw'),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                onClick={() => navigate(`/kitchen/recipes/${recipe.id}`)}
                className="overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="aspect-[16/9] bg-muted flex items-center justify-center overflow-hidden">
                  {recipe.foto_url ? (
                    <img src={recipe.foto_url} alt={recipe.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-heading font-bold text-lg text-foreground leading-tight">
                      {recipe.name}
                    </h3>
                    {recipe.type === 'halffabricaat' && (
                      <Badge variant="outline" className="text-xs shrink-0">Halffabricaat</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {recipe.category && <Badge variant="secondary" className="text-xs">{recipe.category}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {recipe.ingredient_count ?? 0} ingrediënten
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
