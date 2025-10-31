import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TimeSlotStepProps {
  selectedDate: Date;
  partySize: number;
  selectedTimeSlot: string | null;
  onSelectTimeSlot: (slot: string) => void;
  onBack: () => void;
}

interface TimeSlot {
  time: string;
  available: number;
  total: number;
}

const TimeSlotStep = ({
  selectedDate,
  partySize,
  selectedTimeSlot,
  onSelectTimeSlot,
  onBack,
}: TimeSlotStepProps) => {
  // Mock availability data
  const generateSlots = (): TimeSlot[] => {
    const lunchSlots = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
    const dinnerSlots = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

    return [...lunchSlots, ...dinnerSlots].map((time) => ({
      time,
      available: Math.floor(Math.random() * 5),
      total: 4,
    }));
  };

  const slots = generateSlots();

  const getSlotStatus = (slot: TimeSlot) => {
    const percentage = (slot.available / slot.total) * 100;
    if (percentage === 0) return { color: "bg-muted text-muted-foreground", label: "Full", disabled: true };
    if (percentage < 50) return { color: "bg-secondary text-secondary-foreground", label: `${slot.available} left`, disabled: false };
    return { color: "bg-primary text-primary-foreground", label: "Available", disabled: false };
  };

  return (
    <div className="animate-slide-up">
      <h2 className="text-2xl font-bold font-heading text-center mb-2">
        Choose a Time
      </h2>
      <p className="text-center text-muted-foreground mb-8">
        {format(selectedDate, "EEEE, MMMM d, yyyy")} • {partySize} {partySize === 1 ? "person" : "people"}
      </p>

      <div className="space-y-6 max-w-md mx-auto mb-8">
        {/* Lunch Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Lunch
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {slots.slice(0, 6).map((slot) => {
              const status = getSlotStatus(slot);
              return (
                <button
                  key={slot.time}
                  onClick={() => !status.disabled && onSelectTimeSlot(slot.time)}
                  disabled={status.disabled}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2",
                    status.disabled && "opacity-50 cursor-not-allowed",
                    !status.disabled && "hover:border-primary hover:shadow-md",
                    selectedTimeSlot === slot.time && "border-primary bg-primary/5"
                  )}
                >
                  <span className="font-bold text-lg">{slot.time}</span>
                  <Badge variant="secondary" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dinner Section */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Dinner
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {slots.slice(6).map((slot) => {
              const status = getSlotStatus(slot);
              return (
                <button
                  key={slot.time}
                  onClick={() => !status.disabled && onSelectTimeSlot(slot.time)}
                  disabled={status.disabled}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2",
                    status.disabled && "opacity-50 cursor-not-allowed",
                    !status.disabled && "hover:border-primary hover:shadow-md",
                    selectedTimeSlot === slot.time && "border-primary bg-primary/5"
                  )}
                >
                  <span className="font-bold text-lg">{slot.time}</span>
                  <Badge variant="secondary" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default TimeSlotStep;
