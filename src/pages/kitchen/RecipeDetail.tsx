import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, Minus, Plus, Printer, SquarePen, Trash2 } from 'lucide-react';
import { useRecipe, useDeleteRecipe } from '@/hooks/useRecipes';
import { useCreatePrintJob } from '@/hooks/usePrintJobs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { AllergenenBadges } from '@/components/kitchen/AllergenenBadges';
import { useReceptAllergenen } from '@/hooks/useAllergenen';
import { MethodesKaart } from '@/components/kitchen/MethodesKaart';
import { VestigingToggles } from '@/components/kitchen/VestigingKoppeling';
import { useVestigingKoppelingen } from '@/hooks/useVestigingKoppeling';
import { useRole } from '@/hooks/useRole';
import { Sectiekop } from '@/components/pura/canoniek';
import { toonNaam } from '@/lib/receptCategorieen';

const LEEG = new Set<string>();

function formatIngredient(hoeveelheid?: string | null, eenheid?: string | null, naam?: string) {
  return `${hoeveelheid ?? ''} ${eenheid ?? ''} ${naam ?? ''}`.replace(/\s+/g, ' ').trim();
}

function Kenmerk({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-2 border-b border-border px-4 py-2 last:border-b-0 lg:px-6">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="min-w-0 text-right text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useRecipe(id);
  const createPrintJob = useCreatePrintJob();
  const deleteMut = useDeleteRecipe();
  const { data: allergenen } = useReceptAllergenen(id);
  const { data: koppelingen } = useVestigingKoppelingen('recept');
  const { isManager } = useRole();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printAantal, setPrintAantal] = useState(1);

  if (isLoading) {
    return (
      <SidebarLayout>
        <p className="py-2 text-center text-sm text-muted-foreground">Laden…</p>
      </SidebarLayout>
    );
  }

  if (!data?.recipe) {
    return (
      <SidebarLayout>
        <p className="py-2 text-center text-sm text-muted-foreground">Recept niet gevonden.</p>
      </SidebarLayout>
    );
  }

  const { recipe, ingredients } = data;

  const onDelete = async () => {
    try {
      await deleteMut.mutateAsync(recipe.id);
      toast.success('Recept verwijderd');
      navigate('/kitchen/recipes');
    } catch (e: any) {
      toast.error('Verwijderen mislukt: ' + (e?.message ?? 'onbekende fout'));
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/kitchen/recipes')}
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Recepten
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{toonNaam(recipe.name)}</p>
            {recipe.category && <Badge variant="secondary">{recipe.category}</Badge>}
            <Badge variant="outline">{recipe.type === 'halffabricaat' ? 'Halffabricaat' : 'Recept'}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="touch" onClick={() => navigate(`/kitchen/recipes/${recipe.id}/bewerken`)}>
              <SquarePen aria-hidden />
              Bewerken
            </Button>
            <Popover open={printOpen} onOpenChange={setPrintOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="touch" disabled={createPrintJob.isPending}>
                  <Printer aria-hidden />
                  Printen
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 space-y-4 p-4">
                <p className="text-sm font-semibold text-foreground">Aantal stickers</p>
                <div className="flex items-center justify-center gap-2">
                  <Button type="button" variant="outline" size="touch-icon" aria-label="Minder" disabled={printAantal <= 1} onClick={() => setPrintAantal((n) => Math.max(1, n - 1))}>
                    <Minus aria-hidden />
                  </Button>
                  <span className="w-12 text-center text-sm font-semibold tabular-nums">{printAantal}</span>
                  <Button type="button" variant="outline" size="touch-icon" aria-label="Meer" disabled={printAantal >= 20} onClick={() => setPrintAantal((n) => Math.min(20, n + 1))}>
                    <Plus aria-hidden />
                  </Button>
                </div>
                <Button
                  type="button"
                  size="touch"
                  className="w-full"
                  disabled={createPrintJob.isPending}
                  onClick={() => {
                    createPrintJob.mutate({
                      id: recipe.id,
                      name: recipe.name,
                      tht_dagen: recipe.tht_dagen,
                      aantal: printAantal,
                    });
                    setPrintOpen(false);
                    setPrintAantal(1);
                  }}
                >
                  <Printer aria-hidden />
                  {printAantal > 1 ? `Print ${printAantal}` : 'Print'}
                </Button>
              </PopoverContent>
            </Popover>
            <Button type="button" variant="ghost" size="touch" className="text-destructive hover:text-destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 aria-hidden />
              Verwijderen
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <Card>
              <Sectiekop titel="Ingrediënten" teller={ingredients.length || undefined} />
              {ingredients.length === 0 ? (
                <p className="px-4 py-2 text-sm text-muted-foreground lg:px-6">Geen ingrediënten.</p>
              ) : (
                <ul>
                  {ingredients.map((ing) => {
                    const qty = [ing.hoeveelheid, ing.eenheid].filter((v) => v && v.toString().trim().length > 0).join(' ').trim();
                    return (
                      <li key={ing.id} className="flex min-h-12 items-center justify-between gap-2 border-b border-border px-4 py-2 last:border-b-0 lg:px-6">
                        <span className="text-sm text-foreground">{ing.naam}</span>
                        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{qty || '—'}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <Sectiekop titel="Bereiding" />
              {recipe.bereiding ? (
                <p className="whitespace-pre-wrap px-4 py-2 text-sm text-foreground lg:px-6">{recipe.bereiding}</p>
              ) : (
                <p className="px-4 py-2 text-sm text-muted-foreground lg:px-6">Geen bereiding.</p>
              )}
            </Card>
          </div>

          <div className="space-y-4 lg:sticky lg:top-3">
            <Card>
              <Sectiekop titel="Kenmerken" />
              <Kenmerk label="Categorie">{recipe.category || '—'}</Kenmerk>
              <Kenmerk label="Type">{recipe.type === 'halffabricaat' ? 'Halffabricaat' : 'Recept'}</Kenmerk>
              <Kenmerk label="THT"><span className="tabular-nums">{recipe.tht_dagen} d</span></Kenmerk>
              {recipe.porties != null && <Kenmerk label="Porties"><span className="tabular-nums">{recipe.porties}</span></Kenmerk>}
              {recipe.arbeid_minuten != null && <Kenmerk label="Arbeid"><span className="tabular-nums">{recipe.arbeid_minuten} min</span></Kenmerk>}
              <Kenmerk label="Vestigingen">
                <VestigingToggles
                  soort="recept"
                  id={recipe.id}
                  actieve={koppelingen?.get(recipe.id) ?? LEEG}
                  disabled={!isManager}
                />
              </Kenmerk>
              <div className="space-y-2 px-4 py-2 lg:px-6">
                <p className="text-sm text-muted-foreground">Allergenen</p>
                <AllergenenBadges
                  allergenen={allergenen?.allergenen ?? []}
                  sporen={allergenen?.sporen ?? []}
                  onbekend={allergenen?.onbekende_ingredienten ?? 0}
                />
                {allergenen?.allergenen_notitie && (
                  <p className="text-sm text-muted-foreground">{allergenen.allergenen_notitie}</p>
                )}
              </div>
            </Card>

            <MethodesKaart receptId={recipe.id} kanBeheren={isManager} />
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recept verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              "{recipe.name}" wordt uit de lijst verwijderd. Deze actie kan niet vanuit de app ongedaan gemaakt worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? 'Verwijderen…' : 'Verwijderen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarLayout>
  );
}

export { formatIngredient };
