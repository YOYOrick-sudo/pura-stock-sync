import { useHousing, usePeople } from "@/hooks/personeel";
import { HousingCard } from "@/components/personeel/HousingCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Wonen() {
  const { data: housing = [], isLoading } = useHousing();
  const { data: people = [] } = usePeople();

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {housing.map(h => <HousingCard key={h.id} housing={h} people={people} />)}
    </div>
  );
}
