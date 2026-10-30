import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, ArrowLeft, MapPin, Users } from 'lucide-react';
import { useAccommodationOccupancy, useAccommodationAssignments } from '@/hooks/hr/useAccommodations';
import { Skeleton } from '@/components/ui/skeleton';
import { OccupancyTimeline } from '@/components/hr/OccupancyTimeline';
import { useIsMobile } from '@/hooks/use-mobile';

export default function HousingPlanner() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { data: occupancy, isLoading: occupancyLoading } = useAccommodationOccupancy();
  const { data: assignments, isLoading: assignmentsLoading } = useAccommodationAssignments();

  const totalCapacity = occupancy?.reduce((sum, a) => sum + a.capacity, 0) ?? 0;
  const totalOccupied = occupancy?.reduce((sum, a) => sum + a.current_occupancy, 0) ?? 0;
  const totalAvailable = totalCapacity - totalOccupied;

  const isLoading = occupancyLoading || assignmentsLoading;

  return (
    <SidebarLayout>
      <div className={isMobile ? 'page-stack min-w-0 [&_button]:min-h-11 [&_button]:min-w-11' : 'p-6 space-y-6'}>
        {/* Header */}
        <div className={isMobile ? 'flex flex-wrap items-center justify-between gap-3 [&>button]:w-full' : 'flex items-center justify-between'}>
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-2 -ml-2"
              onClick={() => navigate('/hr')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar inbox
            </Button>
            <p className="text-muted-foreground">Beheer woonruimtes en bezetting</p>
          </div>
          <Button onClick={() => navigate('/hr/housing/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Woonruimte
          </Button>
        </div>

        {/* Summary */}
        <Card className="p-4">
          <div className={isMobile ? 'flex flex-col gap-3' : 'flex items-center justify-between'}>
            <div className={isMobile ? 'flex flex-wrap items-center gap-3' : 'flex items-center gap-6'}>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">{totalCapacity}</span>
                <span className="text-muted-foreground">totaal</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-lg font-semibold text-primary">{totalOccupied}</span>
                <span className="text-muted-foreground ml-1">bezet</span>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <span className="text-lg font-semibold text-emerald-600">{totalAvailable}</span>
                <span className="text-muted-foreground ml-1">vrij</span>
              </div>
            </div>
            
            <div className={isMobile ? 'w-full h-3 bg-muted rounded-full overflow-hidden' : 'w-48 h-3 bg-muted rounded-full overflow-hidden'}>
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Accommodations List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : occupancy && occupancy.length > 0 ? (
          <div className="space-y-4">
            {occupancy.map((accommodation) => {
              const accommodationAssignments = assignments?.filter(
                a => a.accommodation_id === accommodation.id && a.status === 'active'
              ) || [];

              return (
                <Card key={accommodation.id} className="p-4">
                  <div className={isMobile ? 'flex items-start justify-between gap-2 mb-3 min-w-0' : 'flex items-start justify-between mb-4'}>
                    <div className={isMobile ? 'min-w-0 flex-1' : undefined}>
                      <h3 className={isMobile ? 'font-semibold truncate' : 'font-semibold text-lg'}>{accommodation.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className={isMobile ? 'h-4 w-4 shrink-0' : 'h-4 w-4'} />
                        <span className={isMobile ? 'truncate' : undefined}>{accommodation.location || 'Geen locatie'}</span>
                      </div>
                    </div>
                    
                    <div className={isMobile ? 'text-right shrink-0 whitespace-nowrap' : 'text-right'}>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-semibold ${
                          accommodation.available_spots === 0 ? 'text-destructive' : 'text-emerald-600'
                        }`}>
                          {accommodation.available_spots}
                        </span>
                        <span className="text-muted-foreground">/ {accommodation.capacity} vrij</span>
                      </div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full transition-all ${
                            accommodation.available_spots === 0 ? 'bg-destructive' : 'bg-primary'
                          }`}
                          style={{ width: `${(accommodation.current_occupancy / accommodation.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={isMobile ? 'min-w-0 max-w-full overflow-x-auto [&>div.space-y-2]:min-w-[32rem] [&>div.space-y-2>div>div:first-child]:sticky [&>div.space-y-2>div>div:first-child]:left-0 [&>div.space-y-2>div>div:first-child]:z-10 [&>div.space-y-2>div>div:first-child]:bg-card' : undefined}>
                  <OccupancyTimeline 
                    assignments={accommodationAssignments}
                    capacity={accommodation.capacity}
                  />
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/hr/housing/${accommodation.id}`)}
                    >
                      Details bekijken
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Nog geen woonruimtes toegevoegd</p>
            <Button variant={isMobile ? 'outline' : 'default'} className={isMobile ? 'max-w-full whitespace-normal' : undefined} onClick={() => navigate('/hr/housing/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Eerste woonruimte toevoegen
            </Button>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}
