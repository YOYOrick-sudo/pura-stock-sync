import { useState, useMemo } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BookOpen } from 'lucide-react';
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
        <Card className="p-4 bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek recepten…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-10"
              />
            </div>
            <Button
              onClick={() => navigate('/kitchen/recipes/nieuw')}
              className="min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
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
          <Card className="bg-card shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b bg-muted/30">
                <div>Naam</div>
                <div>Categorie</div>
                <div>Type</div>
                <div>Ingrediënten</div>
              </div>
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => navigate(`/kitchen/recipes/${recipe.id}`)}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center border-b last:border-b-0 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <div className="font-semibold text-foreground">{recipe.name}</div>
                  <div>
                    {recipe.category ? (
                      <Badge variant="secondary" className="text-xs">{recipe.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="text-sm text-foreground">
                    {recipe.type === 'halffabricaat' ? 'Halffabricaat' : 'Recept'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {recipe.ingredient_count ?? 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile list */}
            <div className="sm:hidden divide-y">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => navigate(`/kitchen/recipes/${recipe.id}`)}
                  className="px-4 py-3 cursor-pointer active:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{recipe.name}</h3>
                    {recipe.type === 'halffabricaat' && (
                      <Badge variant="outline" className="text-xs shrink-0">Halffabricaat</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {recipe.category && <Badge variant="secondary" className="text-xs">{recipe.category}</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {recipe.ingredient_count ?? 0} ingrediënten
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}
