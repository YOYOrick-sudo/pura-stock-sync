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
import { Edit, Users, ChevronLeft, Printer, Trash2 } from 'lucide-react';
import { useRecipe, useDeleteRecipe } from '@/hooks/useRecipes';
import { useCreatePrintJob } from '@/hooks/usePrintJobs';
import { toast } from 'sonner';

function formatIngredient(hoeveelheid?: string | null, eenheid?: string | null, naam?: string) {
  return `${hoeveelheid ?? ''} ${eenheid ?? ''} ${naam ?? ''}`.replace(/\s+/g, ' ').trim();
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useRecipe(id);
  const createPrintJob = useCreatePrintJob();
  const deleteMut = useDeleteRecipe();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const recipeType = (data?.recipe?.type as 'gerecht' | 'halffabricaat' | undefined) ?? 'gerecht';

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="text-center py-12 text-muted-foreground text-sm">Laden…</div>
      </SidebarLayout>
    );
  }

  if (!data?.recipe) {
    return (
      <SidebarLayout>
        <div className="text-center py-12 text-muted-foreground text-sm">Recept niet gevonden</div>
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
      <div className="space-y-4 max-w-3xl">
        <button
          type="button"
          onClick={() => navigate('/kitchen/recipes')}
          className="inline-flex items-center gap-1 -mx-1 px-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Recepten
        </button>

        {/* Header */}
        <Card className="bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="font-heading font-semibold text-2xl tracking-tight text-foreground mb-2">
                  {recipe.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {recipe.category && (
                    <Badge variant="secondary" className="text-xs rounded-full font-normal">
                      {recipe.category}
                    </Badge>
                  )}
                  {recipe.type === 'halffabricaat' && (
                    <Badge variant="outline" className="text-xs rounded-full font-normal">
                      Halffabricaat
                    </Badge>
                  )}
                  {recipe.porties != null && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {recipe.porties} porties
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/kitchen/recipes/${recipe.id}/bewerken`)}
                  className="h-12"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Bewerken
                </Button>
                <Button
                  size="sm"
                  onClick={() => createPrintJob.mutate({ id: recipe.id, name: recipe.name, type: recipeType })}
                  disabled={createPrintJob.isPending}
                  className="h-12"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print sticker
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setConfirmOpen(true)}
                  title="Verwijderen"
                  className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Ingredients */}
        <Card className="p-5 sm:p-6 bg-white shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground pb-3 mb-1 border-b border-border/60">
            Ingrediënten
          </h2>
          {ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground pt-3">Nog geen ingrediënten toegevoegd.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {ingredients.map((ing) => {
                const qty = [ing.hoeveelheid, ing.eenheid]
                  .filter((v) => v && v.toString().trim().length > 0)
                  .join(' ')
                  .trim();
                return (
                  <li
                    key={ing.id}
                    className="flex items-baseline justify-between gap-6 py-2.5"
                  >
                    <span className="text-[15px] text-foreground">{ing.naam}</span>
                    {qty && (
                      <span className="text-[15px] text-muted-foreground tabular-nums text-right shrink-0">
                        {qty}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Bereiding */}
        <Card className="p-5 sm:p-6 bg-white shadow-sm">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground pb-3 mb-3 border-b border-border/60">
            Bereiding
          </h2>
          {recipe.bereiding ? (
            <div className="text-[15px] leading-7 whitespace-pre-wrap text-foreground/90 max-w-prose">
              {recipe.bereiding}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen bereiding toegevoegd.</p>
          )}
        </Card>
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
