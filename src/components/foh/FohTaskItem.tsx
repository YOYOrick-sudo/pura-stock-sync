import React, { useState, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GripVertical, Trash2, Info, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FohTaskWithEmployee } from '@/types/foh';
import { useIsTablet } from '@/hooks/use-mobile';

interface FohTaskItemProps {
  task: FohTaskWithEmployee;
  isEditMode: boolean;
  onTitleChange: (id: string, title: string) => void;
  onDescriptionChange?: (id: string, description: string) => void;
  onEstimatedMinutesChange?: (id: string, minutes: number | null) => void;
  onDelete: (id: string) => void;
  toggleTask?: (id: string, completed: boolean) => void;
  isDeleted: boolean;
  showAdminTools?: boolean;
  taskPadding?: string;
}

export const FohTaskItem = memo(function FohTaskItem({
  task, isEditMode, onTitleChange, onDescriptionChange, onEstimatedMinutesChange,
  onDelete, toggleTask, isDeleted, showAdminTools = false, taskPadding = '14px 0',
}: FohTaskItemProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id });

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(task.description || '');
  const isTablet = useIsTablet();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (isDeleted ? 0.3 : 1),
  };

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea')) return;
    if (!isEditMode && toggleTask && !isDeleted) {
      toggleTask(task.id, task.completed);
    }
  };

  // Checkbox sizes: tablet=28px, desktop=20px
  const checkboxSize = isTablet ? 28 : 20;
  const checkmarkScale = isTablet ? 1.4 : 1;
  // Action button sizes
  const actionBtnSize = isTablet ? 32 : 24;
  const actionIconSize = isTablet ? 16 : 14;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={handleRowClick}
        className="group"
        style={{
          padding: taskPadding,
          opacity: isDeleted ? 0.3 : (task.completed ? 0.7 : 1),
          borderBottom: '1px solid hsl(var(--border) / 0.4)',
          cursor: !isEditMode && toggleTask ? 'pointer' : 'default',
          transition: 'background-color 0.15s ease, opacity 0.2s ease',
          position: 'relative',
          backgroundColor: task.completed ? 'hsl(var(--primary) / 0.04)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isEditMode && toggleTask) e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = task.completed ? 'hsl(var(--primary) / 0.04)' : 'transparent';
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Drag Handle */}
          {isEditMode && !isDeleted && (
            <div {...attributes} {...listeners} style={{
              cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isTablet ? '32px' : '24px', height: isTablet ? '32px' : '24px',
              minWidth: isTablet ? '32px' : '24px',
            }}>
              <GripVertical size={isTablet ? 20 : 18} className="text-muted-foreground opacity-50" />
            </div>
          )}

          {/* Checkbox */}
          {!isEditMode && toggleTask && (
            <div style={{
              width: `${checkboxSize}px`, height: `${checkboxSize}px`, minWidth: `${checkboxSize}px`,
              borderRadius: '6px',
              border: `2px solid ${task.completed ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
              backgroundColor: task.completed ? 'hsl(var(--primary))' : 'hsl(var(--background))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: task.completed ? 'scale(1)' : 'scale(1)',
              pointerEvents: 'none',
            }}>
              {task.completed && (
                <svg width={12 * checkmarkScale} height={10 * checkmarkScale} viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )}

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {isEditMode ? (
              <Input
                value={task.title}
                onChange={(e) => onTitleChange(task.id, e.target.value)}
                disabled={isDeleted}
                className="flex-1 rounded-2xl text-[15px] font-medium h-9"
                style={{ textDecoration: isDeleted ? 'line-through' : 'none' }}
              />
            ) : (
              <span style={{
                flex: 1,
                textDecoration: toggleTask && task.completed ? 'line-through' : 'none',
                transition: 'color 0.2s ease, text-decoration-color 0.3s ease',
              }} className={`font-medium text-[15px] ${toggleTask && task.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Time indicator */}
            {isEditMode ? (
              <Select
                value={task.estimated_minutes?.toString() || 'null'}
                onValueChange={(value) => onEstimatedMinutesChange?.(task.id, value === 'null' ? null : parseInt(value))}
                disabled={isDeleted}
              >
                <SelectTrigger className="w-20 h-7 text-xs rounded-xl">
                  <SelectValue placeholder="Tijd" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Geen</SelectItem>
                  {[5, 10, 15, 20, 30, 45, 60].map(m => (
                    <SelectItem key={m} value={m.toString()}>~{m}min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              task.estimated_minutes && (
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  ~{task.estimated_minutes}min
                </span>
              )
            )}

            {/* Info button */}
            {!isEditMode && task.description && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditingDescription(true); }}
                style={{ width: `${actionBtnSize}px`, height: `${actionBtnSize}px`, minWidth: `${actionBtnSize}px` }}
                className="rounded-md border border-border bg-card flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                title="Bekijk info"
              >
                <Info size={actionIconSize} className="text-primary" />
              </button>
            )}

            {/* Edit description */}
            {showAdminTools && !isDeleted && (
              <button
                onClick={(e) => { e.stopPropagation(); setDescriptionValue(task.description || ''); setIsEditingDescription(true); }}
                style={{ width: `${actionBtnSize}px`, height: `${actionBtnSize}px`, minWidth: `${actionBtnSize}px` }}
                className="rounded-md border border-border bg-card flex items-center justify-center cursor-pointer hover:bg-muted transition-colors"
                title="Bewerk omschrijving"
              >
                <Pencil size={actionIconSize} className="text-muted-foreground" />
              </button>
            )}

            {/* Delete button */}
            {isEditMode && !isDeleted && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                style={{ width: `${actionBtnSize}px`, height: `${actionBtnSize}px`, minWidth: `${actionBtnSize}px` }}
                className="rounded-md border border-border bg-card flex items-center justify-center cursor-pointer hover:bg-destructive/10 hover:border-destructive transition-colors"
                title="Verwijder taak"
              >
                <Trash2 size={actionIconSize} className="text-destructive" />
              </button>
            )}
          </div>
        </div>

        {/* Description dialog */}
        {isEditingDescription && (
          <Dialog open={isEditingDescription} onOpenChange={setIsEditingDescription}>
            <DialogContent className="bg-card border border-border rounded-[20px]">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {showAdminTools ? 'Bewerk Omschrijving' : 'Taak Informatie'}
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {showAdminTools && onDescriptionChange ? (
                  <Textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="Omschrijving (optioneel)"
                    rows={6}
                    className="rounded-2xl whitespace-pre-wrap"
                  />
                ) : (
                  <div className="text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">
                    {task.description || 'Geen omschrijving beschikbaar'}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditingDescription(false)} className="rounded-[20px]">
                  {showAdminTools ? 'Annuleren' : 'Sluiten'}
                </Button>
                {showAdminTools && onDescriptionChange && (
                  <Button
                    onClick={() => {
                      onDescriptionChange(task.id, descriptionValue);
                      setIsEditingDescription(false);
                      toast.success('Omschrijving bijgewerkt');
                    }}
                    className="rounded-[20px] bg-primary text-primary-foreground"
                  >
                    Opslaan
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
});
