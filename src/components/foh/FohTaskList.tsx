import React, { memo } from 'react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { FohTaskWithEmployee } from '@/types/foh';
import { groupTasksByCategory, getCategoryProgress } from './hooks/useFohPhase';
import { FohTaskItem } from './FohTaskItem';
import { useIsTablet } from '@/hooks/use-mobile';

interface FohTaskListProps {
  tasks: FohTaskWithEmployee[];
  isEditMode: boolean;
  editedTasks: FohTaskWithEmployee[];
  deletedTaskIds: string[];
  onToggleTask: (id: string, completed: boolean) => void;
  onTitleChange: (id: string, title: string) => void;
  onDescriptionChange: (id: string, description: string) => void;
  onEstimatedMinutesChange: (id: string, minutes: number | null) => void;
  onDeleteTask: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export const FohTaskList = memo(function FohTaskList({
  tasks, isEditMode, editedTasks, deletedTaskIds,
  onToggleTask, onTitleChange, onDescriptionChange, onEstimatedMinutesChange,
  onDeleteTask, onDragEnd,
}: FohTaskListProps) {
  const isTablet = useIsTablet();
  const taskPadding = isTablet ? '18px 0' : '14px 0';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const currentTasks = isEditMode ? editedTasks : tasks;
  const groupedTasks = groupTasksByCategory(currentTasks);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div>
        {Object.entries(groupedTasks).map(([category, categoryTasks]) => {
          const progress = getCategoryProgress(categoryTasks);
          return (
            <div key={category} className="mb-6">
              {/* Sticky category header */}
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 sticky top-0 bg-card/80 backdrop-blur-sm py-2 -mx-1 px-1 z-10 rounded-md"
                style={{ color: progress.allDone ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
              >
                {category}
                <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                  progress.allDone
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground bg-muted'
                }`}>
                  {progress.completed}/{progress.total}
                </span>
              </h3>

              <div className="border-b border-border/30 pb-4">
                {progress.allDone ? (
                  <div className="py-5 text-center text-primary text-sm font-medium animate-in">
                    🎉 Alle taken voltooid!
                  </div>
                ) : (
                  <SortableContext items={categoryTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {categoryTasks.map(task => (
                      <FohTaskItem
                        key={task.id}
                        task={task}
                        isEditMode={isEditMode}
                        onTitleChange={onTitleChange}
                        onDescriptionChange={onDescriptionChange}
                        onEstimatedMinutesChange={onEstimatedMinutesChange}
                        onDelete={onDeleteTask}
                        toggleTask={!isEditMode ? onToggleTask : undefined}
                        isDeleted={deletedTaskIds.includes(task.id)}
                        showAdminTools={false}
                        taskPadding={taskPadding}
                      />
                    ))}
                  </SortableContext>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
});
