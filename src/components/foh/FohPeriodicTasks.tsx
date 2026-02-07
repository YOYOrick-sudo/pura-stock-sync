import React, { useState, memo } from 'react';
import { Trash2 } from 'lucide-react';
import type { FohTaskWithEmployee } from '@/types/foh';
import { groupTasksByDay, formatDayHeader, getDateLabelColor, getPriorityConfig } from './hooks/useFohPhase';
import { useIsTablet } from '@/hooks/use-mobile';

interface FohPeriodicTasksProps {
  tasks: FohTaskWithEmployee[];
  onToggleTask: (id: string, completed: boolean) => void;
  onDeleteTask: (taskId: string) => void;
}

export const FohPeriodicTasks = memo(function FohPeriodicTasks({
  tasks, onToggleTask, onDeleteTask,
}: FohPeriodicTasksProps) {
  const isTablet = useIsTablet();
  const taskPadding = isTablet ? '18px 0' : '14px 0';
  const checkboxSize = isTablet ? 28 : 20;
  const checkmarkScale = isTablet ? 1.4 : 1;
  const actionBtnSize = isTablet ? 32 : 24;

  // Swipe state
  const [swipedTaskId, setSwipedTaskId] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent, taskId: string) => {
    const diff = touchStart - e.targetTouches[0].clientX;
    if (Math.abs(diff) > 10) e.preventDefault();
    setSwipeOffset(Math.min(Math.max(diff, 0), 80));
    if (diff > 30) setSwipedTaskId(taskId);
    else if (diff < -10) { setSwipedTaskId(null); setSwipeOffset(0); }
  };

  const handleTouchEnd = () => {
    setTouchStart(0);
    if (!swipedTaskId) setSwipeOffset(0);
  };

  const groupedDays = groupTasksByDay(tasks);

  return (
    <div>
      {groupedDays.map(([dateKey, tasksForDay]) => (
        <div key={dateKey} className="mb-5">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2 mt-4"
            style={{ color: getDateLabelColor(dateKey) }}
          >
            {formatDayHeader(dateKey)}
          </h3>

          {tasksForDay.map(task => (
            <div key={task.id}>
              <div
                style={{
                  position: 'relative',
                  transform: swipedTaskId === task.id ? `translateX(-${swipeOffset}px)` : 'none',
                  transition: touchStart === 0 ? 'transform 0.3s ease' : 'none',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={(e) => handleTouchMove(e, task.id)}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  onClick={() => onToggleTask(task.id, task.completed)}
                  style={{
                    padding: taskPadding,
                    borderLeft: `4px solid ${getPriorityConfig(task.priority).borderColor}`,
                    marginLeft: '-4px',
                    paddingLeft: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: task.completed ? 0.7 : 1,
                  }}
                  className={`border-b border-border/30 ${task.completed ? 'bg-primary/[0.04]' : ''} hover:bg-primary/[0.06]`}
                >
                  <div className="flex gap-3 items-center">
                    {/* Checkbox */}
                    <div style={{
                      width: `${checkboxSize}px`, height: `${checkboxSize}px`, minWidth: `${checkboxSize}px`,
                      borderRadius: '6px',
                      border: `2px solid ${task.completed ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                      backgroundColor: task.completed ? 'hsl(var(--primary))' : 'hsl(var(--background))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      pointerEvents: 'none',
                    }}>
                      {task.completed && (
                        <svg width={12 * checkmarkScale} height={10 * checkmarkScale} viewBox="0 0 12 10" fill="none">
                          <path d="M1 5L4.5 8.5L11 1.5" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1">
                      <span className={`flex-1 font-medium text-[15px] transition-all duration-200 ${
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        style={{ width: `${actionBtnSize}px`, height: `${actionBtnSize}px`, minWidth: `${actionBtnSize}px` }}
                        className="rounded-md border border-border bg-card flex items-center justify-center cursor-pointer hover:bg-destructive/10 hover:border-destructive transition-colors"
                        title="Verwijder taak"
                      >
                        <Trash2 size={isTablet ? 16 : 14} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>

                {swipedTaskId === task.id && (
                  <div className="absolute right-0 top-0 h-full w-20 flex items-center justify-center">
                    <button
                      onClick={() => { onDeleteTask(task.id); setSwipedTaskId(null); }}
                      className="bg-destructive text-destructive-foreground border-none py-2 px-4 rounded-lg cursor-pointer text-[13px] font-medium"
                    >
                      Verwijder
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
