import { useState, useMemo, useEffect } from 'react';
import { AllergenenBadges } from '@/components/kitchen/AllergenenBadges';
import { useAlleReceptAllergenen } from '@/hooks/useAllergenen';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BookOpen, ChefHat } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useRecipes, useRecipeCategories } from '@/hooks/useRecipes';
import { VestigingFilter, VestigingToggles } from '@/components/kitchen/VestigingKoppeling';
import { useMijnVestiging, useVestigingKoppelingen, type Vestiging } from '@/hooks/useVestigingKoppeling';
import { useRole } from '@/hooks/useRole';
import { useAlleMethodes } from '@/hooks/useHalffabricaatMethodes';
import { MethodeDialog } from '@/components/keten/MethodeDialog';
import { cn } from '@/lib/utils';

const LEEG = new Set<string>();


export default function Recipes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [vestiging, setVestiging] = useState<Vestiging | null>(null);

  const { data: alleRecipes = [], isLoading } = useRecipes(search, category);
  const { data: categories = [] } = useRecipeCategories();
  const { data: allergenenMap } = useAlleReceptAllergenen();
  const { data: mijnVestiging } = useMijnVestiging();
  const { data: koppelingen } = useVestigingKoppelingen('recept');
  const { isManager } = useRole();

  // Standaard: alleen wat aan staat voor mijn eigen keuken.
  useEffect(() => {
    if (mijnVestiging === 'West' || mijnVestiging === 'Midsland') {
      setVestiging(mijnVestiging as Vestiging);
    }
  }, [mijnVestiging]);

  const recipes = useMemo(() => {
    if (!vestiging) return alleRecipes;
    return alleRecipes.filter((r) => koppelingen?.get(r.id)?.has(vestiging));
  }, [alleRecipes, vestiging, koppelingen]);

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

          <VestigingFilter waarde={vestiging} onChange={setVestiging} className="mt-4" />



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
              <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_auto] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b bg-muted/30">
                <div>Naam</div>
                <div>Categorie</div>
                <div>Type</div>
                <div>Allergenen</div>
                <div className="w-[76px]">Aan bij</div>
              </div>
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => navigate(`/kitchen/recipes/${recipe.id}`)}
                  className="grid grid-cols-[2fr_1fr_1fr_1.5fr_auto] gap-4 px-5 py-4 items-center border-b last:border-b-0 cursor-pointer hover:bg-muted/40 transition-colors"
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
                  <div>
                    <AllergenenBadges
                      size="sm"
                      allergenen={allergenenMap?.get(recipe.id)?.allergenen ?? []}
                      onbekend={allergenenMap?.get(recipe.id)?.onbekende_ingredienten ?? 0}
                    />
                  </div>
                  <VestigingToggles
                    soort="recept"
                    id={recipe.id}
                    actieve={koppelingen?.get(recipe.id) ?? LEEG}
                    disabled={!isManager}
                  />
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
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <AllergenenBadges
                      size="sm"
                      allergenen={allergenenMap?.get(recipe.id)?.allergenen ?? []}
                      onbekend={allergenenMap?.get(recipe.id)?.onbekende_ingredienten ?? 0}
                    />
                    <VestigingToggles
                      soort="recept"
                      id={recipe.id}
                      actieve={koppelingen?.get(recipe.id) ?? LEEG}
                      disabled={!isManager}
                    />
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
