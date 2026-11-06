import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, Search, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { VestigingToggles } from '@/components/kitchen/VestigingKoppeling';
import { useMijnVestiging, useVestigingKoppelingen, type Vestiging } from '@/hooks/useVestigingKoppeling';
import { useRole } from '@/hooks/useRole';
import { useRecipes, type Recipe } from '@/hooks/useRecipes';
import { cn } from '@/lib/utils';
import {
  categorieKeuzes,
  icoonVoorCategorie,
  ingredientenLabel,
  pastBijZoekterm,
  sorteerOpNaam,
  type CategorieKeuze,
} from '@/lib/receptCategorieen';

const LEEG = new Set<string>();

const VESTIGING_KEUZES: { label: string; value: Vestiging | null }[] = [
  { label: 'Alle', value: null },
  { label: 'West', value: 'West' },
  { label: 'Midsland', value: 'Midsland' },
];

function CategorieKnop({
  keuze,
  actief,
  onKies,
}: {
  keuze: CategorieKeuze;
  actief: boolean;
  onKies: () => void;
}) {
  const Icoon = keuze.icoon;
  return (
    <Button
      type="button"
      variant={actief ? 'secondary' : 'ghost'}
      size="touch"
      aria-current={actief ? 'true' : undefined}
      title={keuze.label}
      onClick={onKies}
      className="w-full justify-between font-normal"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icoon aria-hidden />
        <span className="truncate">{keuze.label}</span>
      </span>
      <span className={cn('tabular-nums', actief ? 'text-secondary-foreground' : 'text-muted-foreground')}>
        {keuze.aantal}
      </span>
    </Button>
  );
}

function ReceptRij({
  recipe,
  vestigingen,
  togglesUit,
  onOpen,
}: {
  recipe: Recipe;
  vestigingen: Set<string>;
  togglesUit: boolean;
  onOpen: () => void;
}) {
  const Icoon = icoonVoorCategorie(recipe.category);
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2 last:border-b-0 lg:px-6">
      <button type="button" onClick={onOpen} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
        <Icoon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">{recipe.category}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{recipe.name}</span>
          <span className="flex gap-2 text-sm text-muted-foreground">
            <span className="tabular-nums">{ingredientenLabel(recipe.ingredient_count ?? 0)}</span>
            <span className="tabular-nums">THT {recipe.tht_dagen} d</span>
          </span>
        </span>
      </button>
      <VestigingToggles soort="recept" id={recipe.id} actieve={vestigingen} disabled={togglesUit} />
    </div>
  );
}

export default function Recipes() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [vestiging, setVestiging] = useState<Vestiging | null>(null);
  const [categorieOpen, setCategorieOpen] = useState(false);

  const { data: alleRecipes = [], isLoading } = useRecipes('', null);
  const { data: mijnVestiging } = useMijnVestiging();
  const { data: koppelingen, isLoading: koppelingenLaden } = useVestigingKoppelingen('recept');
  const { isManager } = useRole();

  useEffect(() => {
    if (mijnVestiging === 'West' || mijnVestiging === 'Midsland') {
      setVestiging(mijnVestiging);
    }
  }, [mijnVestiging]);

  const naVestiging = useMemo(() => {
    if (!vestiging) return alleRecipes;
    return alleRecipes.filter((recept) => koppelingen?.get(recept.id)?.has(vestiging));
  }, [alleRecipes, vestiging, koppelingen]);

  const naZoeken = useMemo(
    () => naVestiging.filter((recept) => pastBijZoekterm(recept, search)),
    [naVestiging, search],
  );

  const keuzes = useMemo(() => categorieKeuzes(naZoeken, category), [naZoeken, category]);
  const gekozen = keuzes.find((keuze) => keuze.naam === category) ?? keuzes[0];

  const recipes = useMemo(() => {
    const binnen = category
      ? naZoeken.filter((recept) => (recept.category ?? '').trim() === category)
      : naZoeken;
    return sorteerOpNaam(binnen);
  }, [naZoeken, category]);

  const kiesCategorie = (naam: string | null) => {
    setCategory(naam);
    setCategorieOpen(false);
  };

  const wachtOpVestiging = !!vestiging && koppelingenLaden;
  const GekozenIcoon = gekozen.icoon;

  return (
    <SidebarLayout>
      <div className="flex items-start gap-2">
        <nav aria-label="Categorieën" className="sticky top-3 hidden max-h-[calc(100dvh-6rem)] w-64 shrink-0 overflow-y-auto lg:block">
          <Card className="flex flex-col gap-2 px-4 py-2 lg:px-6">
            {keuzes.map((keuze) => (
              <CategorieKnop
                key={keuze.naam ?? 'alle'}
                keuze={keuze}
                actief={keuze.naam === category}
                onKies={() => kiesCategorie(keuze.naam)}
              />
            ))}
          </Card>
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  placeholder="Zoek recept of ingrediënt…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 pl-10"
                  aria-label="Zoek recept of ingrediënt"
                />
              </div>
              <Button type="button" size="touch" onClick={() => navigate('/kitchen/recipes/nieuw')}>
                <Plus aria-hidden />
                Nieuw recept
              </Button>
            </div>

            <div className="flex gap-2" role="group" aria-label="Vestiging">
              {VESTIGING_KEUZES.map((optie) => (
                <Button
                  key={optie.label}
                  type="button"
                  size="touch"
                  variant={vestiging === optie.value ? 'default' : 'outline'}
                  aria-pressed={vestiging === optie.value}
                  onClick={() => setVestiging(optie.value)}
                >
                  {optie.label}
                </Button>
              ))}
            </div>

            <Sheet open={categorieOpen} onOpenChange={setCategorieOpen}>
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="w-full justify-between lg:hidden"
                onClick={() => setCategorieOpen(true)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <GekozenIcoon aria-hidden />
                  <span className="truncate">{gekozen.label}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{gekozen.aantal}</span>
                  <ChevronDown aria-hidden />
                </span>
              </Button>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Categorie</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                  {keuzes.map((keuze) => (
                    <CategorieKnop
                      key={keuze.naam ?? 'alle'}
                      keuze={keuze}
                      actief={keuze.naam === category}
                      onKies={() => kiesCategorie(keuze.naam)}
                    />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {isLoading || wachtOpVestiging ? (
            <p className="py-2 text-center text-sm text-muted-foreground">Laden…</p>
          ) : recipes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Geen recepten gevonden"
              description={
                search.trim() || category
                  ? 'Pas je zoekopdracht of categorie aan'
                  : 'Voeg je eerste recept toe om te beginnen'
              }
              action={{ label: 'Nieuw recept', onClick: () => navigate('/kitchen/recipes/nieuw') }}
            />
          ) : (
            <Card className="overflow-hidden">
              {recipes.map((recipe) => (
                <ReceptRij
                  key={recipe.id}
                  recipe={recipe}
                  vestigingen={koppelingen?.get(recipe.id) ?? LEEG}
                  togglesUit={!isManager}
                  onOpen={() => navigate(`/kitchen/recipes/${recipe.id}`)}
                />
              ))}
            </Card>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
