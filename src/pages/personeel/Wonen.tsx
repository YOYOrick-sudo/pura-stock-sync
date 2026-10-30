import { useHousing, usePeople } from "@/hooks/personeel";
import { HousingCard } from "@/components/personeel/HousingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from '@/hooks/use-mobile';

export default function Wonen() {
  const isMobile = useIsMobile();
  const { data: housing = [], isLoading } = useHousing();
  const { data: people = [] } = usePeople();

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className={isMobile ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 min-w-0 [&>a]:min-w-0' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
      {housing.map(h => <HousingCard key={h.id} housing={h} people={people} />)}
    </div>
  );
}
