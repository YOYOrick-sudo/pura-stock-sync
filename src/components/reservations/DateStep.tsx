import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateStepProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

const DateStep = ({ selectedDate, onSelectDate }: DateStepProps) => {
  const [date, setDate] = useState<Date | undefined>(selectedDate || undefined);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      onSelectDate(newDate);
    }
  };

  // Disable past dates and Mondays (restaurant closed)
  const disabledDays = [
    { before: new Date() },
    { dayOfWeek: [1] }, // Monday = 1
  ];

  return (
    <div className="animate-slide-up">
      <h2 className="text-2xl font-bold font-heading text-center mb-2">
        Choose a Date
      </h2>
      <p className="text-center text-muted-foreground mb-8">
        We're closed on Mondays
      </p>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={disabledDays}
          className={cn("pointer-events-auto border rounded-lg")}
          initialFocus
        />
      </div>
    </div>
  );
};

export default DateStep;
