import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Loader2, Check, Eye, AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ProductRow } from './ProductRow';
import { OrderPreview } from './OrderPreview';
import logoGreen from '@/assets/pura-vida-logo.png';
interface Product {
  name: string;
  targetStock: number;
  currentStock: number;
  isCustom?: boolean;
  id?: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { name: 'Wortelwalnoot cake', targetStock: 9, currentStock: 0 },
  { name: 'Cheesecake', targetStock: 9, currentStock: 0 },
  { name: 'Boterkoek', targetStock: 4, currentStock: 0 },
  { name: 'Brownie', targetStock: 4, currentStock: 0 },
  { name: 'Notenbar', targetStock: 4, currentStock: 0 },
  { name: 'Wortel haveel muffin', targetStock: 5, currentStock: 0 },
  { name: 'Arabische sinaasappel cake', targetStock: 4, currentStock: 0 },
  { name: 'Vissoep', targetStock: 9, currentStock: 0 },
  { name: 'Kip (15 kg)', targetStock: 10, currentStock: 0 },
  { name: 'Kaas', targetStock: 8, currentStock: 0 },
  { name: 'Tempeh', targetStock: 6, currentStock: 0 },
  { name: 'Rode kool', targetStock: 6, currentStock: 0 },
];
function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}
export default function OrderDashboard() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductTarget, setNewProductTarget] = useState('');
  const currentWeek = getCurrentWeek();

  // Load saved data from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('pura-vida-products');
    const savedCustomProducts = localStorage.getItem('pura-vida-custom-products');
    const savedTimestamp = localStorage.getItem('pura-vida-last-submitted');
    
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error('Failed to parse saved products', e);
      }
    }
    
    if (savedCustomProducts) {
      try {
        setCustomProducts(JSON.parse(savedCustomProducts));
      } catch (e) {
        console.error('Failed to parse saved custom products', e);
      }
    }
    
    if (savedTimestamp) {
      setLastSubmitted(savedTimestamp);
    }
  }, []);

  // Save to localStorage when products change
  useEffect(() => {
    localStorage.setItem('pura-vida-products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pura-vida-custom-products', JSON.stringify(customProducts));
  }, [customProducts]);
  const updateProductStock = (index: number, value: number) => {
    const newProducts = [...products];
    newProducts[index].currentStock = value;
    setProducts(newProducts);
  };

  const updateCustomProductStock = (index: number, value: number) => {
    const newCustomProducts = [...customProducts];
    newCustomProducts[index].currentStock = value;
    setCustomProducts(newCustomProducts);
  };

  const addCustomProduct = () => {
    const trimmedName = newProductName.trim();
    const targetStock = parseInt(newProductTarget);

    if (!trimmedName || trimmedName.length > 100) {
      toast.error('Product naam moet tussen 1 en 100 karakters zijn');
      return;
    }

    if (isNaN(targetStock) || targetStock < 1 || targetStock > 999) {
      toast.error('Ijzeren voorraad moet tussen 1 en 999 zijn');
      return;
    }

    const newProduct: Product = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      targetStock: targetStock,
      currentStock: 0,
      isCustom: true,
    };

    setCustomProducts([...customProducts, newProduct]);
    setNewProductName('');
    setNewProductTarget('');
    toast.success('Product toegevoegd');
  };

  const removeCustomProduct = (index: number) => {
    const newCustomProducts = customProducts.filter((_, i) => i !== index);
    setCustomProducts(newCustomProducts);
    toast.success('Product verwijderd');
  };
  const focusNextInput = (currentIndex: number, isCustom: boolean = false) => {
    const nextIndex = currentIndex + 1;
    const totalStandardProducts = products.length;
    
    if (isCustom) {
      if (nextIndex < customProducts.length) {
        const nextInput = document.querySelector(`input[data-custom-index="${nextIndex}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    } else {
      if (nextIndex < totalStandardProducts) {
        const nextInput = document.querySelector(`input[data-index="${nextIndex}"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      } else if (customProducts.length > 0) {
        // Jump to first custom product
        const nextInput = document.querySelector(`input[data-custom-index="0"]`) as HTMLInputElement;
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };
  const calculateRefill = (targetStock: number, currentStock: number): number => {
    return Math.max(targetStock - currentStock, 0);
  };
  const getOrderData = () => {
    const allProducts = [...products, ...customProducts];
    
    return {
      locatie: 'West',
      datum: new Date().toISOString(),
      week: currentWeek,
      producten: allProducts.map(p => ({
        naam: p.name,
        ijzerenVoorraad: p.targetStock,
        huidigeVoorraad: p.currentStock,
        aanTeVullen: calculateRefill(p.targetStock, p.currentStock),
        isCustom: p.isCustom || false,
      })),
    };
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const orderData = getOrderData();

    // Save order locally
    const timestamp = new Date().toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    if (demoMode) {
      // Demo mode - simulate success without calling webhook
      setTimeout(() => {
        setLastSubmitted(timestamp);
        localStorage.setItem('pura-vida-last-submitted', timestamp);
        localStorage.setItem('pura-vida-last-order', JSON.stringify(orderData));
        toast.success('🌴 Demo: Bestelling gesimuleerd', {
          description: 'In productie wordt deze naar Midsland gestuurd.'
        });
        setIsSubmitting(false);
      }, 1500);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://n8n.puravidafoodbar.nl/webhook/voorraad-west', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        setLastSubmitted(timestamp);
        localStorage.setItem('pura-vida-last-submitted', timestamp);
        localStorage.setItem('pura-vida-last-order', JSON.stringify(orderData));
        toast.success('🌴 Bestelling verzonden!', {
          description: 'Midsland ontvangt deze direct.'
        });
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting order:', error);

      // Save failed order for later retry
      localStorage.setItem('pura-vida-failed-order', JSON.stringify({
        data: orderData,
        timestamp: timestamp,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('⏱️ Verbinding verbroken', {
          description: 'De webhook reageert niet. Schakel over naar demo-modus?',
          duration: 6000,
          action: {
            label: 'Demo-modus',
            onClick: () => setDemoMode(true)
          }
        });
      } else {
        toast.error('🔌 Kan webhook niet bereiken', {
          description: 'Controleer of de n8n webhook actief is, of gebruik demo-modus.',
          duration: 6000,
          action: {
            label: 'Demo-modus',
            onClick: () => setDemoMode(true)
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const allProducts = [...products, ...customProducts];
  const hasAnyStock = allProducts.some(p => p.currentStock > 0);
  const totalRefill = allProducts.reduce((sum, p) => sum + calculateRefill(p.targetStock, p.currentStock), 0);
  return <div className="min-h-screen bg-[#F5F7DD]">
      {/* Header */}
      <div className="bg-[#F5F7DD] border-b-2 border-[#1B7867]/20">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-5">
            <img src={logoGreen} alt="Pura Vida Foodbar" className="h-20 sm:h-24 lg:h-28 w-auto" />
          </div>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-[#282E3A] text-[20px]">
                Voorraadregistratie
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#1B7867] text-white text-sm">
                West
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B7867]"></div>
              <p className="text-center text-[#1B7867] text-sm">
                Week {currentWeek} • {new Date().toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B7867]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:px-6 pb-10">
        {/* Instruction Card */}
        <Card className="p-4 sm:p-5 mb-6 bg-white border-[#1B7867]/20 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-[#1B7867] flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-[#282E3A]/90 leading-relaxed flex-1 text-sm sm:text-base">
              Tel de voorraad in de vriezer en vul hieronder de aantallen in. Het systeem berekent automatisch wat Midsland moet aanvullen zodat de ijzeren voorraad weer compleet is.
            </p>
          </div>
        </Card>

        {/* Products Table - All Screen Sizes */}
        <Card className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1B7867]/10">
                  <th className="px-4 py-4 sm:px-6 sm:py-5 text-left uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Product</th>
                  <th className="px-3 py-4 sm:px-5 sm:py-5 text-center uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Ijzer</th>
                  <th className="px-3 py-4 sm:px-5 sm:py-5 text-center uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Huidig</th>
                  <th className="px-3 py-4 sm:px-5 sm:py-5 text-center uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Vullen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B7867]/5">
                {products.map((product, index) => <ProductRow key={product.name} product={product} onUpdateStock={value => updateProductStock(index, value)} refillAmount={calculateRefill(product.targetStock, product.currentStock)} isFirst={index === 0} onEnter={() => focusNextInput(index)} index={index} />)}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Custom Products Section */}
        {customProducts.length > 0 && (
          <Card className="overflow-hidden shadow-sm border-[#E27726]/20 bg-white mb-6">
            <div className="bg-gradient-to-r from-[#E27726]/5 to-[#E27726]/10 px-4 py-3 border-b border-[#E27726]/20">
              <h3 className="text-sm font-bold text-[#282E3A] uppercase tracking-wider">Extra Producten</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B7867]/10">
                    <th className="px-4 py-4 sm:px-6 sm:py-5 text-left uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Product</th>
                    <th className="px-3 py-4 sm:px-5 sm:py-5 text-center uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Ijzer</th>
                    <th className="px-3 py-4 sm:px-5 sm:py-5 text-center uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Huidig</th>
                    <th className="px-3 py-4 sm:px-5 sm:py-5 text-center uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Vullen</th>
                    <th className="px-3 py-4 sm:px-5 sm:py-5 text-center uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B7867]/5">
                  {customProducts.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onUpdateStock={value => updateCustomProductStock(index, value)}
                      refillAmount={calculateRefill(product.targetStock, product.currentStock)}
                      isFirst={false}
                      onEnter={() => focusNextInput(index, true)}
                      index={index}
                      isCustom={true}
                      onRemove={() => removeCustomProduct(index)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Add Custom Product Card */}
        <Card className="p-4 sm:p-5 mb-6 bg-white border-[#1B7867]/20 shadow-sm">
          <h3 className="text-sm font-bold text-[#282E3A] uppercase tracking-wider mb-4">Nieuw Product Toevoegen</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Product naam"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value.slice(0, 100))}
                maxLength={100}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-32">
              <Input
                type="number"
                placeholder="Ijzer"
                value={newProductTarget}
                onChange={(e) => setNewProductTarget(e.target.value)}
                min={1}
                max={999}
                className="w-full"
              />
            </div>
            <Button
              onClick={addCustomProduct}
              disabled={!newProductName.trim() || !newProductTarget}
              className="w-full sm:w-auto bg-[#1B7867] hover:bg-[#0d5a4c]"
            >
              Toevoegen
            </Button>
          </div>
        </Card>

        {/* Submit Section */}
        <div className="space-y-4">
          {demoMode && <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white border-l-4 border-[#E27726] rounded-2xl shadow-sm">
              <AlertCircle className="w-5 h-5 text-[#E27726] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[#282E3A]">
                  <span className="font-semibold">Demo-modus</span> – Bestellingen worden gesimuleerd
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDemoMode(false)} className="text-[#282E3A]/70 hover:text-[#1B7867] hover:bg-white/80 self-end sm:self-auto">
                Uitschakelen
              </Button>
            </div>}

          {/* Summary Badge */}
          {hasAnyStock && <div className="bg-gradient-to-br from-[#1B7867]/5 to-[#1B7867]/10 rounded-2xl p-5 border-2 border-[#1B7867]/30 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1B7867] rounded-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm sm:text-base text-[#282E3A] font-semibold">Totaal aan te vullen</span>
                </div>
                <span className="text-3xl sm:text-4xl font-bold text-[#1B7867]">
                  {totalRefill}
                </span>
              </div>
            </div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => setShowPreview(true)} disabled={!hasAnyStock} variant="outline" className="w-full sm:flex-1 h-12 sm:h-auto sm:py-5 border-2 border-[#1B7867] text-[#1B7867] hover:bg-[#1B7867]/5 rounded-2xl font-semibold transition-all touch-manipulation">
              <Eye className="mr-2 h-5 w-5" />
              Voorbeeld
            </Button>

            <Button onClick={handleSubmit} disabled={isSubmitting || !hasAnyStock} className="w-full sm:flex-[2] h-12 sm:h-auto sm:py-5 bg-gradient-to-r from-[#1B7867] to-[#0d5a4c] hover:from-[#0d5a4c] hover:to-[#1B7867] text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-semibold touch-manipulation active:scale-[0.98]">
              {isSubmitting ? <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Bezig met verzenden...
                </> : <>
                  <Check className="mr-2 h-5 w-5" />
                  Verstuur naar Midsland
                </>}
            </Button>
          </div>

          {lastSubmitted && <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#282E3A]/50 py-2">
              <div className="w-1 h-1 rounded-full bg-[#1B7867]/30"></div>
              <p>Laatst verzonden op {lastSubmitted}</p>
              <div className="w-1 h-1 rounded-full bg-[#1B7867]/30"></div>
            </div>}
        </div>

        {/* Order Preview Dialog */}
        <OrderPreview open={showPreview} onClose={() => setShowPreview(false)} orderData={getOrderData()} />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-[#282E3A]/50">
          <p>🌴 Pura Vida Foodbar – Fresh & Tropical</p>
        </div>
      </div>
    </div>;
}