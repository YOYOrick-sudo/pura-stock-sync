import { useState } from 'react';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Eye } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';
import { addDays, startOfWeek, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { devLog } from "@/lib/devLog";

export default function MepPlanning() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate week days
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // TODO: Replace with actual data from useMepPlanning hook
  const mepItems: any[] = [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'in_progress':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <KitchenLayout title="Mise-en-place" subtitle="Plan je voorbereidingen">
      <div className="space-y-6">
        {/* Week Selector */}
        <Card className="p-1 bg-card shadow-sm">
          <Tabs value={format(selectedDate, 'yyyy-MM-dd')} onValueChange={(value) => setSelectedDate(new Date(value))}>
            <TabsList className="w-full grid grid-cols-7 bg-background/50">
              {weekDays.map((day) => (
                <TabsTrigger
                  key={day.toISOString()}
                  value={format(day, 'yyyy-MM-dd')}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm"
                >
                  <div className="flex flex-col items-center">
                    <span className="font-bold">{format(day, 'EEE', { locale: nl })}</span>
                    <span className="text-xs opacity-70">{format(day, 'd')}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </Card>

        {/* Day Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              {format(selectedDate, 'EEEE d MMMM', { locale: nl })}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mepItems.length} {mepItems.length === 1 ? 'item' : 'items'} gepland
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Toevoegen
          </Button>
        </div>

        {/* MEP Items */}
        {mepItems.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Geen items voor deze dag"
            description="Voeg mise-en-place items toe voor deze dag"
            action={{
              label: 'Item toevoegen',
              onClick: () => devLog('Add MEP item'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {mepItems.map((item: any) => (
              <Card key={item.id} className="p-4 bg-card shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{item.recipe.name}</h3>
                      <Badge variant="outline">{item.quantity}x</Badge>
                    </div>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mb-2">{item.notes}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status === 'completed' && 'Klaar'}
                    {item.status === 'in_progress' && 'Bezig'}
                    {item.status === 'planned' && 'Gepland'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.recipe.prep_time_minutes} min
                    </span>
                    {item.assigned_to && (
                      <span>Toegewezen aan: {item.assigned_to.email}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Recept
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </KitchenLayout>
  );
}
