import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ReservationWidget from "@/components/reservations/ReservationWidget";

const ReservationsDemo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold font-heading text-foreground mb-2">
            Reservations Demo
          </h1>
          <p className="text-muted-foreground">
            Book your table at Pura Vida - Formitable-style experience
          </p>
        </div>

        <ReservationWidget />
      </div>
    </div>
  );
};

export default ReservationsDemo;
