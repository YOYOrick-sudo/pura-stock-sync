import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductRow from "./ProductRow";
import WaveBackground from "./WaveBackground";
import { Check } from "lucide-react";
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
        {/* Header - Compact */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <img 
              src={logoSunset} 
              alt="Pura Vida" 
              className="h-10 md:h-11 w-auto opacity-90"
            />
            <div className="text-right">
              <p className="font-mono text-xs text-muted-foreground/70">Week {currentWeek}</p>
            </div>
          </div>
          <h1 className="font-heading text-base md:text-lg text-foreground/80 uppercase tracking-wide font-medium">
            Interne Bestelling West
          </h1>
        </div>

        {/* Products - Professional Table */}
        <div className="bg-white rounded-lg border border-border/50 mb-6 overflow-hidden">
          <div className="hidden md:grid grid-cols-4 gap-3 px-4 py-3 bg-muted/10 border-b border-border/40">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Product</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Ijzer</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Huidig</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-right">Vullen</div>
          </div>

          <div>
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
        </div>

        {/* Total - Professional */}
        <div className="bg-primary/5 rounded-lg border border-primary/10 p-5 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Totaal aan te vullen
            </span>
            <span className="font-mono text-5xl md:text-6xl font-semibold text-primary tabular-nums">
              {totalToRefill}
            </span>
          </div>
        </div>

        {/* Submit Button - Professional */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Verzenden..." : "Versturen naar Midsland"}
        </Button>

        {/* Last Submitted */}
        {lastSubmitted && (
          <div className="mt-3 text-center text-xs text-muted-foreground font-mono">
            Laatst verzonden: {lastSubmitted}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;
