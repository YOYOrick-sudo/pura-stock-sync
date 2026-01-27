import { AccommodationAssignment } from '@/types/hr';
import { format, differenceInDays, startOfMonth, endOfMonth, addMonths, isSameMonth, isWithinInterval, startOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';

interface OccupancyTimelineProps {
  assignments: AccommodationAssignment[];
  capacity: number;
}

export function OccupancyTimeline({ assignments, capacity }: OccupancyTimelineProps) {
  // Show 6 months starting from current month
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, i) => addMonths(startOfMonth(today), i));

  if (assignments.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        Geen huidige bewoners
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Month headers */}
      <div className="flex gap-1">
        <div className="w-32 flex-shrink-0" /> {/* Spacer for name column */}
        {months.map((month) => (
          <div 
            key={month.toISOString()} 
            className="flex-1 text-xs text-muted-foreground text-center"
          >
            {format(month, 'MMM', { locale: nl })}
          </div>
        ))}
      </div>

      {/* Assignment rows */}
      {assignments.map((assignment) => {
        const candidate = assignment.candidate;
        const candidateName = candidate 
          ? `${candidate.first_name} ${candidate.last_name.charAt(0)}.`
          : 'Onbekend';

        const startDate = startOfDay(new Date(assignment.start_date));
        const endDate = assignment.end_date 
          ? startOfDay(new Date(assignment.end_date))
          : null;

        return (
          <div key={assignment.id} className="flex gap-1 items-center">
            <div className="w-32 flex-shrink-0 text-sm truncate" title={candidateName}>
              {candidateName}
            </div>
            {months.map((month) => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              
              // Check if assignment overlaps with this month
              const assignmentStartsBeforeMonthEnds = startDate <= monthEnd;
              const assignmentEndsAfterMonthStarts = !endDate || endDate >= monthStart;
              const isActive = assignmentStartsBeforeMonthEnds && assignmentEndsAfterMonthStarts;
              
              if (!isActive) {
                return (
                  <div 
                    key={month.toISOString()} 
                    className="flex-1 h-6 bg-muted/50 rounded"
                  />
                );
              }

              // Calculate position within month
              const startsThisMonth = startDate >= monthStart && startDate <= monthEnd;
              const endsThisMonth = endDate && endDate >= monthStart && endDate <= monthEnd;

              let leftPercent = 0;
              let rightPercent = 100;

              if (startsThisMonth) {
                const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                const dayOfMonth = differenceInDays(startDate, monthStart);
                leftPercent = (dayOfMonth / daysInMonth) * 100;
              }

              if (endsThisMonth && endDate) {
                const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                const dayOfMonth = differenceInDays(endDate, monthStart) + 1;
                rightPercent = (dayOfMonth / daysInMonth) * 100;
              }

              return (
                <div 
                  key={month.toISOString()} 
                  className="flex-1 h-6 bg-muted/50 rounded relative"
                >
                  <div 
                    className="absolute top-0 bottom-0 bg-primary/80 rounded"
                    style={{ 
                      left: `${leftPercent}%`, 
                      right: `${100 - rightPercent}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Empty slots indicator */}
      {assignments.length < capacity && (
        <div className="flex gap-1 items-center">
          <div className="w-32 flex-shrink-0 text-sm text-muted-foreground italic">
            +{capacity - assignments.length} vrij
          </div>
          {months.map((month) => (
            <div 
              key={month.toISOString()} 
              className="flex-1 h-6 bg-emerald-100 border border-dashed border-emerald-300 rounded"
            />
          ))}
        </div>
      )}
    </div>
  );
}
