import { useNavigate, useParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Users, ImageIcon } from 'lucide-react';
import { useRecipe } from '@/hooks/useRecipes';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useRecipe(id);

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="text-center py-12 text-muted-foreground">Laden…</div>
      </SidebarLayout>
    );
  }

  if (!data?.recipe) {
    return (
      <SidebarLayout>
        <div className="text-center py-12 text-muted-foreground">Recept niet gevonden</div>
      </SidebarLayout>
    );
  }

  const { recipe, ingredients } = data;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card className="overflow-hidden bg-white shadow-sm">
          <div className="aspect-[21/9] bg-muted flex items-center justify-center overflow-hidden">
            {recipe.foto_url ? (
              <img src={recipe.foto_url} alt={recipe.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            )}
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-3">
                  {recipe.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {recipe.category && <Badge variant="secondary" className="text-sm">{recipe.category}</Badge>}
                  {recipe.type === 'halffabricaat' && (
                    <Badge variant="outline" className="text-sm">Halffabricaat</Badge>
                  )}
                  {recipe.porties != null && (
                    <span className="inline-flex items-center gap-1.5 text-base text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {recipe.porties} porties
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(`/kitchen/recipes/${recipe.id}/bewerken`)}
                className="min-h-[48px]"
              >
                <Edit className="w-5 h-5 mr-2" />
                Bewerken
              </Button>
            </div>
          </div>
        </Card>

        {/* Ingredients */}
        <Card className="p-6 sm:p-8 bg-white shadow-sm">
          <h2 className="font-heading font-bold text-2xl mb-5 text-foreground">Ingrediënten</h2>
          {ingredients.length === 0 ? (
            <p className="text-muted-foreground">Nog geen ingrediënten toegevoegd.</p>
          ) : (
            <ul className="divide-y divide-border">
              {ingredients.map((ing) => (
                <li key={ing.id} className="flex items-baseline justify-between gap-6 py-3">
                  <span className="text-lg sm:text-xl text-foreground">{ing.naam}</span>
                  <span className="text-lg sm:text-xl text-muted-foreground font-medium text-right">
                    {ing.hoeveelheid}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Bereiding */}
        <Card className="p-6 sm:p-8 bg-white shadow-sm">
          <h2 className="font-heading font-bold text-2xl mb-5 text-foreground">Bereiding</h2>
          {recipe.bereiding ? (
            <div className="text-lg sm:text-xl leading-relaxed whitespace-pre-wrap text-foreground">
              {recipe.bereiding}
            </div>
          ) : (
            <p className="text-muted-foreground">Nog geen bereiding toegevoegd.</p>
          )}
        </Card>

        <div className="flex justify-end">
          <Button size="lg" variant="ghost" onClick={() => navigate('/kitchen/recipes')} className="min-h-[48px]">
            Terug naar overzicht
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
}
