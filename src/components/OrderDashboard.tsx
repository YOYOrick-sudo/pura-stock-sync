import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductRow from "./ProductRow";
import WaveBackground from "./WaveBackground";
import { Package, Send, Check } from "lucide-react";

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
        toast.success("Bestelling verzonden!", {
          description: "Midsland ontvangt deze direct.",
          icon: <Check className="h-5 w-5" />,
        });
      } else {
        throw new Error("Failed to submit");
      }
    } catch (error) {
      toast.error("Fout bij verzenden", {
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Interne Bestelling
          </h1>
          <p className="text-xl text-secondary font-semibold mb-2">
            Pura Vida West
          </p>
          <p className="text-sm text-muted-foreground">Week {currentWeek}</p>
        </div>

        <div className="bg-muted/30 rounded-2xl p-6 mb-6 animate-slide-up">
          <p className="text-foreground leading-relaxed">
            Tel de voorraad in de vriezer en vul hieronder de aantallen in. Het
            systeem berekent automatisch wat Midsland moet aanvullen zodat de
            ijzeren voorraad weer compleet is.
          </p>
        </div>

        <div className="bg-card/50 rounded-2xl p-6 mb-6 animate-slide-up backdrop-blur-sm">
          <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-semibold text-muted-foreground px-4">
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

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-between items-center px-4">
              <span className="text-lg font-semibold text-foreground">
                Totaal aan te vullen:
              </span>
              <span className="text-2xl font-bold text-primary">
                {totalToRefill}
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-semibold rounded-xl shadow-medium hover:shadow-lg transition-all"
          size="lg"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Bestelling wordt verzonden...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Versturen naar Midsland
            </span>
          )}
        </Button>

        {lastSubmitted && (
          <div className="mt-6 text-center text-sm text-muted-foreground animate-fade-in">
            <Check className="h-4 w-4 inline mr-1 text-primary" />
            Laatst verzonden op {lastSubmitted}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;
