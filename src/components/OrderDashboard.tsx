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
    <div className="min-h-screen bg-background">
      <WaveBackground />
      
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-3xl relative">
        {/* Header - Clean & Simple */}
        <div className="text-center mb-8 md:mb-10">
          <div className="flex justify-center mb-5">
            <img 
              src={logoSunset} 
              alt="Pura Vida Foodbar" 
              className="h-16 md:h-20 w-auto"
            />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-2 uppercase tracking-wider">
            Interne Bestelling
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            Pura Vida West • Week {currentWeek}
          </p>
        </div>

        {/* Instructions - Minimaal */}
        <div className="mb-6 md:mb-8">
          <p className="text-sm md:text-base text-center text-muted-foreground">
            Tel de voorraad en vul de aantallen in
          </p>
        </div>

        {/* Products - Clean List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
          <div className="hidden md:grid grid-cols-4 gap-4 mb-4 pb-3 border-b border-border/30 text-xs font-mono text-muted-foreground uppercase">
            <div>Product</div>
            <div className="text-center">Ijzer</div>
            <div className="text-center">Huidig</div>
            <div className="text-center">Vullen</div>
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

          {/* Total - Clean */}
          <div className="mt-6 pt-5 border-t border-border/30">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm md:text-base text-foreground uppercase">
                Totaal aan te vullen
              </span>
              <span className="font-heading text-3xl md:text-2xl font-bold text-secondary">
                {totalToRefill}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button - Clean */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="secondary"
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Verzenden...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Versturen naar Midsland
            </span>
          )}
        </Button>

        {/* Last Submitted - Subtle */}
        {lastSubmitted && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <Check className="h-3 w-3 inline mr-1 text-primary" />
            Laatst verzonden: {lastSubmitted}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;
