import { useState } from 'react';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckSquare } from 'lucide-react';
import { EmptyState } from '@/components/kitchen/EmptyState';

export default function KitchenTasks() {
  // TODO: Replace with actual data from useKitchenTasks hook
  const todayTasks: any[] = [];
  const weekTasks: any[] = [];
  const cleaningTasks: any[] = [];
  const maintenanceTasks: any[] = [];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cleaning':
        return 'bg-blue-100 text-blue-600';
      case 'maintenance':
        return 'bg-purple-100 text-purple-600';
      case 'prep':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const renderTaskList = (tasks: any[]) => {
    if (tasks.length === 0) {
      return (
        <EmptyState
          icon={CheckSquare}
          title="Geen taken"
          description="Alle taken zijn voltooid of er zijn nog geen taken toegevoegd"
        />
      );
    }

    return (
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`p-4 bg-white shadow-sm ${task.completed ? 'opacity-50' : ''} ${
              task.due_date && new Date(task.due_date) < new Date() && !task.completed
                ? 'border-l-4 border-red-500'
                : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={task.completed}
                className="mt-1"
                onCheckedChange={() => console.log('Toggle task', task.id)}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className={`font-semibold text-foreground ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </h3>
                  <Badge className={getCategoryColor(task.category)}>
                    {task.category === 'cleaning' && 'Schoonmaak'}
                    {task.category === 'maintenance' && 'Onderhoud'}
                    {task.category === 'prep' && 'Voorbereiden'}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.due_date && (
                    <span>
                      📅 {new Date(task.due_date).toLocaleDateString('nl-NL')}
                    </span>
                  )}
                  {task.assigned_to && <span>👤 {task.assigned_to.email}</span>}
                  <span className="capitalize">{task.frequency}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <KitchenLayout title="Taken" subtitle="Schoonmaak & onderhoud">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button className="bg-primary hover:bg-primary-hover">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe taak
          </Button>
        </div>

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white">
            <TabsTrigger value="today">Vandaag</TabsTrigger>
            <TabsTrigger value="week">Deze week</TabsTrigger>
            <TabsTrigger value="cleaning">Schoonmaak</TabsTrigger>
            <TabsTrigger value="maintenance">Onderhoud</TabsTrigger>
          </TabsList>

          <TabsContent value="today">{renderTaskList(todayTasks)}</TabsContent>
          <TabsContent value="week">{renderTaskList(weekTasks)}</TabsContent>
          <TabsContent value="cleaning">{renderTaskList(cleaningTasks)}</TabsContent>
          <TabsContent value="maintenance">{renderTaskList(maintenanceTasks)}</TabsContent>
        </Tabs>
      </div>
    </KitchenLayout>
  );
}
