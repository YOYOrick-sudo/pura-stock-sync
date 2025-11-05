import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Calculator } from "lucide-react";

const HomeHub = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-heading font-bold text-foreground">
          Pura Vida — Kies module
        </h1>
        
        <div className="flex flex-col gap-4 w-full max-w-md">
          <Button
            size="lg"
            className="h-16 text-lg"
            onClick={() => navigate('/')}
          >
            <Package className="mr-2 h-5 w-5" />
            Voorraadregistratie
          </Button>
          
          <Button
            size="lg"
            variant="secondary"
            className="h-16 text-lg"
            onClick={() => navigate('/kassa')}
          >
            <Calculator className="mr-2 h-5 w-5" />
            Kassatelling
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeHub;
