import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ZoekVeld } from '@/components/pura/lijst';
import { LegeStaatBlok } from '@/components/pura/canoniek';
import { VestigingToggles } from '@/components/kitchen/VestigingKoppeling';
import { useMijnVestiging, useVestigingKoppelingen, type Vestiging } from '@/hooks/useVestigingKoppeling';
import { useRole } from '@/hooks/useRole';
import { useRecipes, type Recipe } from '@/hooks/useRecipes';
import { cn } from '@/lib/utils';
import {
  categorieKeuzes,
  icoonVoorCategorie,
  resultaatTekst,
  pastBijZoekterm,
  sorteerOpNaam,
  toonNaam,
  type CategorieKeuze,
} from '@/lib/receptCategorieen';

const LEEG = new Set<string>();
const KOLOMMEN = 'lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_6.5rem_3rem_4.5rem]';

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
    <button
      type="button"
      aria-current={actief ? 'true' : undefined}
      onClick={onKies}
      className={cn(
        'flex min-h-11 w-full items-center gap-2 rounded-polar-sm border-l-2 px-2 py-2 text-left text-sm',
        actief ? 'border-primary bg-primary/10 text-primary' : 'border-transparent text-foreground hover:bg-muted',
      )}
    >
      <Icoon className={cn('h-4 w-4 shrink-0', actief ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
      <span className="min-w-0 flex-1 whitespace-normal">{keuze.label}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{keuze.aantal}</span>
    </button>
  );
}

function CategorieIcoon({ category }: { category: string }) {
  const Icoon = icoonVoorCategorie(category);
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-polar-sm bg-muted">
      <Icoon className="h-4 w-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">{category}</span>
    </span>
  );
}

function IngredientenCel({ aantal }: { aantal: number }) {
  if (aantal <= 0) return <span className="text-sm text-muted-foreground">Geen ingrediënten</span>;
  return <span className="text-sm tabular-nums text-foreground">{aantal}</span>;
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
  const open = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };
  const naam = toonNaam(recipe.name);
  const toggles = <VestigingToggles soort="recept" id={recipe.id} actieve={vestigingen} disabled={togglesUit} />;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={open}
        className={cn('hidden min-h-12 cursor-pointer items-center gap-2 border-b border-border px-4 py-2 last:border-b-0 hover:bg-muted lg:grid lg:px-6', KOLOMMEN)}
      >
        <span className="min-w-0 break-words text-sm font-medium text-foreground">{naam}</span>
        <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
          <CategorieIcoon category={recipe.category} />
          <span className="min-w-0 break-words">{recipe.category}</span>
        </span>
        <IngredientenCel aantal={recipe.ingredient_count ?? 0} />
        <span className="text-sm tabular-nums text-foreground">{recipe.tht_dagen} d</span>
        {toggles}
      </div>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 last:border-b-0 lg:hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={open}
          className="flex min-h-12 min-w-0 flex-1 items-center gap-2 text-left"
        >
          <CategorieIcoon category={recipe.category} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">{naam}</span>
            <span className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{recipe.category}</span>
              <span>{(recipe.ingredient_count ?? 0) <= 0 ? 'Geen ingrediënten' : `${recipe.ingredient_count} ingrediënten`}</span>
              <span className="tabular-nums">THT {recipe.tht_dagen} d</span>
            </span>
          </span>
        </div>
        {toggles}
      </div>
    </>
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
        <nav aria-label="Categorieën" className="sticky top-3 hidden max-h-[calc(100dvh-5.5rem)] w-80 shrink-0 flex-col lg:flex">
          <p className="px-2 py-2 text-sm font-semibold text-foreground">Categorieën</p>
          <Card className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 py-2">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <ZoekVeld waarde={search} onChange={setSearch} placeholder="Zoek recept of ingrediënt…" />
              </div>
              <div role="group" aria-label="Vestiging" className="flex h-11 shrink-0 items-center rounded-polar-lg bg-muted p-1">
                {VESTIGING_KEUZES.map((optie) => {
                  const actief = vestiging === optie.value;
                  return (
                    <button
                      key={optie.label}
                      type="button"
                      aria-pressed={actief}
                      onClick={() => setVestiging(optie.value)}
                      className={cn(
                        'h-full rounded-polar-md px-3 text-sm font-medium',
                        actief ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {optie.label}
                    </button>
                  );
                })}
              </div>
              <Button type="button" size="touch" className="shrink-0" onClick={() => navigate('/kitchen/recipes/nieuw')}>
                <Plus aria-hidden />
                <span className="max-sm:sr-only">Nieuw recept</span>
              </Button>
            </div>

            <Sheet open={categorieOpen} onOpenChange={setCategorieOpen}>
              <Button
                type="button"
                variant="outline"
                size="touch"
                className="h-auto min-h-11 w-full justify-between whitespace-normal py-2 lg:hidden"
                onClick={() => setCategorieOpen(true)}
              >
                <span className="flex min-w-0 items-center gap-2 text-left">
                  <GekozenIcoon aria-hidden />
                  <span className="whitespace-normal">{gekozen.label}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">{gekozen.aantal}</span>
                  <ChevronDown aria-hidden />
                </span>
              </Button>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Categorieën</SheetTitle>
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

            <p className="text-sm text-muted-foreground">{resultaatTekst(recipes.length, category)}</p>
          </div>

          {isLoading || wachtOpVestiging ? (
            <p className="py-2 text-center text-sm text-muted-foreground">Laden…</p>
          ) : recipes.length === 0 ? (
            <LegeStaatBlok tekst={search.trim() || category ? 'Geen recepten voor deze keuze.' : 'Nog geen recepten.'} />
          ) : (
            <Card className="overflow-hidden">
              <div className={cn('hidden min-h-12 items-center gap-2 border-b border-border px-4 text-xs text-muted-foreground lg:grid lg:px-6', KOLOMMEN)}>
                <span>Naam</span>
                <span>Categorie</span>
                <span>Ingrediënten</span>
                <span>THT</span>
                <span>Vestigingen</span>
              </div>
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
