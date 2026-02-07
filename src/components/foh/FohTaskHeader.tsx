import React, { memo } from 'react';
import { Settings, Plus } from 'lucide-react';
import type { PhaseType, FohTaskWithEmployee } from '@/types/foh';
import { groupTasksByPhase, sortTasksInPhase, sortExtraTasks } from './hooks/useFohPhase';

interface FohTaskHeaderProps {
  mainCategory: 'dagelijks' | 'periodiek';
  activePhase: PhaseType;
  dailyTasks: FohTaskWithEmployee[];
  extraTasks: FohTaskWithEmployee[];
  onPhaseChange: (phase: PhaseType) => void;
  onCategoryChange: (cat: 'dagelijks' | 'periodiek') => void;
  onAdminClick: () => void;
  onNewTaskClick?: () => void;
}

export const FohTaskHeader = memo(function FohTaskHeader({
  mainCategory, activePhase, dailyTasks, extraTasks,
  onPhaseChange, onCategoryChange, onAdminClick, onNewTaskClick,
}: FohTaskHeaderProps) {
  const groupedDailyTasks = (() => {
    const grouped = groupTasksByPhase(dailyTasks);
    (['open', 'tussen', 'sluit'] as PhaseType[]).forEach(phase => {
      grouped[phase] = sortTasksInPhase(grouped[phase]);
    });
    return grouped;
  })();

  const getDailyListStats = (phase: PhaseType) => {
    const listTasks = groupedDailyTasks[phase];
    const completed = listTasks.filter(t => t.completed).length;
    const total = listTasks.length;
    return { completed, total };
  };

  const getCurrentStats = () => {
    let tasks: FohTaskWithEmployee[];
    if (mainCategory === 'dagelijks') {
      tasks = groupedDailyTasks[activePhase];
    } else {
      tasks = sortExtraTasks(extraTasks);
    }
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage, isComplete: percentage === 100 };
  };

  const stats = getCurrentStats();
  const phaseLabels: Record<PhaseType, string> = { open: 'Open', tussen: 'Tussen', sluit: 'Sluit' };

  return (
    <div className="flex flex-col gap-5">
      {/* Phase buttons row */}
      <div className="flex gap-3 items-center">
        {(['open', 'tussen', 'sluit'] as PhaseType[]).map((phase) => {
          const phaseStats = getDailyListStats(phase);
          const isActive = mainCategory === 'dagelijks' && activePhase === phase;
          return (
            <button
              key={phase}
              onClick={() => { onCategoryChange('dagelijks'); onPhaseChange(phase); }}
              className={`flex-1 flex items-center justify-center gap-2 text-[15px] font-medium py-3.5 px-5 rounded-[20px] cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground border-none shadow-sm'
                  : 'bg-card text-foreground border border-border hover:bg-muted hover:shadow-sm'
              }`}
            >
              <span>{phaseLabels[phase]}</span>
              <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-md min-w-[40px] ${
                isActive ? 'bg-white/25 text-primary-foreground' : 'bg-black/[0.04] text-muted-foreground'
              }`}>
                {phaseStats.completed}/{phaseStats.total}
              </span>
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-px h-8 bg-border mx-5" />

        {/* Periodiek button */}
        {(() => {
          const completed = extraTasks.filter(t => t.completed).length;
          const total = extraTasks.length;
          const isActive = mainCategory === 'periodiek';
          return (
            <button
              onClick={() => onCategoryChange('periodiek')}
              className={`flex-1 flex items-center justify-center gap-2 text-[15px] font-medium py-3.5 px-5 rounded-[20px] cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground border-none shadow-sm'
                  : 'bg-card text-foreground border border-border hover:bg-muted hover:shadow-sm'
              }`}
            >
              <span>Periodiek</span>
              <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-md min-w-[40px] ${
                isActive ? 'bg-white/25 text-primary-foreground' : 'bg-black/[0.04] text-muted-foreground'
              }`}>
                {completed}/{total}
              </span>
            </button>
          );
        })()}
      </div>

      <hr className="border-t border-border m-0" />

      {/* Progress bar + actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${stats.percentage}%`,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] text-muted-foreground">
              {stats.completed}/{stats.total}
            </span>
            <span className={`font-semibold text-[17px] ${stats.isComplete ? 'text-primary' : 'text-foreground'}`}>
              {stats.percentage}%
            </span>
          </div>

          {/* Admin Button */}
          <button
            onClick={onAdminClick}
            className="flex items-center gap-2 py-3 px-5 bg-card text-primary border border-border rounded-[20px] text-[15px] font-medium cursor-pointer transition-all duration-200 hover:bg-muted hover:border-border"
          >
            <Settings size={18} />
            Admin
          </button>

          {/* New Task Button - periodiek only */}
          {mainCategory === 'periodiek' && onNewTaskClick && (
            <button
              onClick={onNewTaskClick}
              className="w-12 h-12 flex items-center justify-center bg-primary text-primary-foreground border border-white/20 rounded-xl cursor-pointer shadow-sm transition-all duration-200 hover:brightness-110 active:scale-95"
            >
              <Plus size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
