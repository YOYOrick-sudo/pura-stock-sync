import { CheckCircle, Calendar, Users, Clock, Mail, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { ReservationData } from "./ReservationWidget";
import { toast } from "sonner";

interface ConfirmationStepProps {
  reservation: ReservationData;
  onNewReservation: () => void;
}

const ConfirmationStep = ({ reservation, onNewReservation }: ConfirmationStepProps) => {
  const handleDownloadICS = () => {
    const { date, timeSlot, partySize, name } = reservation;
    if (!date || !timeSlot) return;

    const [hours, minutes] = timeSlot.split(":");
    const startDate = new Date(date);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 2);

    const formatICSDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Pura Vida//Reservations//EN
BEGIN:VEVENT
UID:${Date.now()}@puravida.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:Pura Vida Reservation - ${name}
DESCRIPTION:Table for ${partySize} at Pura Vida
LOCATION:Pura Vida Restaurant
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pura-vida-reservation-${format(date, "yyyy-MM-dd")}.ics`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Calendar event downloaded!");
  };

  const handleEmailConfirmation = () => {
    toast.success("Confirmation email sent to " + reservation.email);
  };

  return (
    <div className="animate-fade-in text-center max-w-md mx-auto">
      <div className="mb-6 flex justify-center">
        <div className="bg-primary/10 rounded-full p-4">
          <CheckCircle className="h-16 w-16 text-primary" />
        </div>
      </div>

      <h2 className="text-3xl font-bold font-heading mb-2">
        Reservation Confirmed!
      </h2>
      <p className="text-muted-foreground mb-8">
        We look forward to welcoming you
      </p>

      {/* Reservation Details */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4 mb-6 text-left">
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">Date</p>
            <p className="text-muted-foreground">
              {reservation.date && format(reservation.date, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">Time</p>
            <p className="text-muted-foreground">{reservation.timeSlot}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">Party Size</p>
            <p className="text-muted-foreground">
              {reservation.partySize} {reservation.partySize === 1 ? "person" : "people"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-semibold">Contact</p>
            <p className="text-muted-foreground">{reservation.name}</p>
            <p className="text-muted-foreground text-sm">{reservation.email}</p>
            <p className="text-muted-foreground text-sm">{reservation.phone}</p>
          </div>
        </div>

        {reservation.notes && (
          <div className="pt-4 border-t border-border">
            <p className="font-semibold mb-1">Special Requests</p>
            <p className="text-muted-foreground text-sm">{reservation.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={handleDownloadICS} variant="outline" className="w-full gap-2">
          <Download className="h-4 w-4" />
          Add to Calendar
        </Button>
        
        <Button onClick={handleEmailConfirmation} variant="outline" className="w-full gap-2">
          <Mail className="h-4 w-4" />
          Resend Confirmation Email
        </Button>

        <Button onClick={onNewReservation} className="w-full">
          Make Another Reservation
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Need to modify your reservation? Contact us at reservations@puravida.com
      </p>
    </div>
  );
};

export default ConfirmationStep;
