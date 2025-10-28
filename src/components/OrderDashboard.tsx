import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductRow from "./ProductRow";
import WaveBackground from "./WaveBackground";
import { Send, Check } from "lucide-react";
import logoSunset from "@/assets/pura-vida-logo.png";

interface Product {
  name: string;
  ironStock: number;
  currentStock: number;
}

const WEBHOOK_URL = "https://n8n.puravidafoodbar.nl/webhook/voorraad-west";

const OrderDashboard = () => {
  const [products, setProducts] = useState<Product[]>([
    { name: "Bananenbrood (tray)", ironStock: 4, currentStock: 0 },
    { name: "Energy balls (doos)", ironStock: 3, currentStock: 0 },
    { name: "Curry basis (bak)", ironStock: 2, currentStock: 0 },
    { name: "Soep basis", ironStock: 2, currentStock: 0 },
    { name: "Falafel (bak)", ironStock: 3, currentStock: 0 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);

  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };
  
  const currentWeek = `${getWeekNumber(new Date())} (${new Date().getFullYear()})`;

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("puraVidaStock");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setProducts(data.products);
        setLastSubmitted(data.lastSubmitted);
      } catch (e) {
        console.error("Error loading saved data:", e);
      }
    }
  }, []);

  // Save to localStorage whenever products change
  useEffect(() => {
    const data = {
      products,
      lastSubmitted,
    };
    localStorage.setItem("puraVidaStock", JSON.stringify(data));
  }, [products, lastSubmitted]);

  const updateStock = (index: number, value: number) => {
    const newProducts = [...products];
    newProducts[index].currentStock = value;
    setProducts(newProducts);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const orderData = {
      locatie: "West",
      datum: new Date().toISOString(),
      week: currentWeek,
      producten: products.map((p) => ({
        naam: p.name,
        ijzerenVoorraad: p.ironStock,
        huidigeVoorraad: p.currentStock,
        aanTeVullen: Math.max(p.ironStock - p.currentStock, 0),
      })),
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const timestamp = new Date().toLocaleString("nl-NL");
        setLastSubmitted(timestamp);
        toast.success("Yes! Bestelling is onderweg naar Midsland ✨", {
          description: "Je bestelling wordt direct verwerkt.",
          icon: <Check className="h-5 w-5" />,
        });
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      toast.error("Oeps! Er ging iets mis 🌴", {
        description: "Probeer het opnieuw of neem contact op.",
      });
      console.error("Error submitting order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalToRefill = products.reduce(
    (sum, p) => sum + Math.max(p.ironStock - p.currentStock, 0),
    0
  );

  return (
    <div className="min-h-screen bg-background relative">
      <WaveBackground />
      
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Header with Logo */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <img 
              src={logoSunset} 
              alt="Pura Vida Foodbar" 
              className="h-20 md:h-24 w-auto"
            />
          </div>
          <h1 className="font-heading text-3xl md:text-5xl tracking-widest text-foreground mb-4 uppercase">
            Interne Bestelling
          </h1>
          <p className="font-heading text-xl md:text-2xl text-secondary font-bold mb-3 uppercase tracking-wide">
            Pura Vida West
          </p>
          <p className="font-mono text-sm text-muted-foreground">Week {currentWeek}</p>
        </div>

        {/* Instructions Card */}
        <div className="bg-card rounded-3xl p-6 md:p-8 mb-8 animate-slide-up shadow-soft border border-border/50">
          <p className="font-mono text-foreground leading-relaxed text-center md:text-left">
            Tel de voorraad en vul de aantallen in – wij berekenen de rest! 🌴
          </p>
        </div>

        {/* Products Table */}
        <div className="bg-card rounded-3xl p-4 md:p-8 mb-8 animate-slide-up shadow-medium border border-border/50">
          <div className="hidden md:grid grid-cols-4 gap-6 mb-6 text-xs font-mono uppercase tracking-wide text-muted-foreground px-5">
            <div>Product</div>
            <div className="text-center">Ijzeren voorraad</div>
            <div className="text-center">Huidige voorraad</div>
            <div className="text-center">Aan te vullen</div>
          </div>

          <div className="space-y-3">
            {products.map((product, index) => (
              <ProductRow
                key={product.name}
                name={product.name}
                ironStock={product.ironStock}
                currentStock={product.currentStock}
                onStockChange={(value) => updateStock(index, value)}
              />
            ))}
          </div>

          {/* Total Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-4 md:px-5">
              <span className="font-heading text-lg md:text-xl text-foreground uppercase tracking-wide">
                Totaal aan te vullen:
              </span>
              <span className="font-heading text-4xl md:text-3xl font-bold text-secondary">
                {totalToRefill}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="secondary"
          className="w-full shadow-medium hover:shadow-hover"
          size="lg"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Verzenden...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <Send className="h-5 w-5" />
              Versturen naar Midsland
            </span>
          )}
        </Button>

        {/* Last Submitted Info */}
        {lastSubmitted && (
          <div className="mt-6 text-center font-mono text-sm text-muted-foreground animate-fade-in">
            <Check className="h-4 w-4 inline mr-2 text-primary" />
            Laatst verzonden op {lastSubmitted}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;
