import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DRUK } from './aanvulMotion';
import { cn } from '@/lib/utils';

/** Klein potlood, alleen voor de eigenaar. 44 px, dezelfde druk als de andere knoppen. */
export function TaakBewerkKnop({ naam, onClick }: { naam: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="touch-icon"
      className={cn('h-11 w-11 shrink-0 text-muted-foreground', DRUK)}
      aria-label={`Instellen: ${naam}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Pencil className="h-4 w-4" aria-hidden />
    </Button>
  );
}
