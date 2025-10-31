import ReservationWidget from "@/components/reservations/ReservationWidget";
import logoGreen from "@/assets/pura-vida-logo-official.png";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReservationsPublic = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            <img
              src={logoGreen}
              alt="Pura Vida Foodbar"
              className="h-12 w-auto"
            />
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            Reserveer je Tafel
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Ontdek onze verse, gezonde gerechten in een relaxte sfeer. 
            Maak je reservering in slechts een paar stappen.
          </p>
        </div>
      </section>

      {/* Reservation Widget - Inline */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <ReservationWidget />
      </section>

      {/* Info Section */}
      <section className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-heading font-bold text-lg mb-2">Openingstijden</h3>
              <p className="text-muted-foreground text-sm">
                Di-Zo: 12:00 - 22:00<br />
                Maandag gesloten
              </p>
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg mb-2">Locatie</h3>
              <p className="text-muted-foreground text-sm">
                Pura Vida Foodbar West<br />
                Amsterdam
              </p>
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg mb-2">Contact</h3>
              <p className="text-muted-foreground text-sm">
                Tel: 020-1234567<br />
                info@puravidafoodbar.nl
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReservationsPublic;
