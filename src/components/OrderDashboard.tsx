import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Loader2, Check, Eye, AlertCircle, Package, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { ProductRow } from './ProductRow';
import { OrderPreview } from './OrderPreview';
import logoGreen from '@/assets/pura-vida-logo-official.png';

interface Product {
  name: string;
  targetStock: number;
  currentStock: number;
  isTemporary?: boolean;
}

const INITIAL_PRODUCTS: Product[] = [
  { name: 'Bananenbrood (tray)', targetStock: 4, currentStock: 0 },
  { name: 'Energy balls (doos)', targetStock: 3, currentStock: 0 },
  { name: 'Curry basis (bak)', targetStock: 2, currentStock: 0 },
  { name: 'Soep basis', targetStock: 2, currentStock: 0 },
  { name: 'Falafel (bak)', targetStock: 3, currentStock: 0 },
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
  const [newProductName, setNewProductName] = useState('');
  const [newProductAmount, setNewProductAmount] = useState('');
  const currentWeek = getCurrentWeek();

  // Load saved data from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem('pura-vida-products');
    const savedTempProducts = localStorage.getItem('pura-vida-temp-products');
    const savedTimestamp = localStorage.getItem('pura-vida-last-submitted');
    
    let allProducts = [...INITIAL_PRODUCTS];
    
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        // Merge saved stock levels with initial products
        allProducts = INITIAL_PRODUCTS.map(initial => {
          const saved = parsed.find((p: Product) => p.name === initial.name);
          return saved ? { ...initial, currentStock: saved.currentStock } : initial;
        });
      } catch (e) {
        console.error('Failed to parse saved products', e);
      }
    }
    
    // Add back temporary products if they exist
    if (savedTempProducts) {
      try {
        const tempProducts = JSON.parse(savedTempProducts);
        allProducts = [...allProducts, ...tempProducts];
      } catch (e) {
        console.error('Failed to parse temporary products', e);
      }
    }
    
    setProducts(allProducts);
    
    if (savedTimestamp) {
      setLastSubmitted(savedTimestamp);
    }
  }, []);

  // Save to localStorage when products change (excluding temporary products)
  useEffect(() => {
    // Only save permanent products to localStorage
    const permanentProducts = products.filter(p => !p.isTemporary);
    // If we have temporary products, save them separately for recovery
    const temporaryProducts = products.filter(p => p.isTemporary);
    
    localStorage.setItem('pura-vida-products', JSON.stringify(permanentProducts));
    if (temporaryProducts.length > 0) {
      localStorage.setItem('pura-vida-temp-products', JSON.stringify(temporaryProducts));
    } else {
      localStorage.removeItem('pura-vida-temp-products');
    }
  }, [products]);

  const updateProductStock = (index: number, value: number) => {
    const newProducts = [...products];
    newProducts[index].currentStock = value;
    setProducts(newProducts);
  };

  const addTemporaryProduct = () => {
    if (!newProductName.trim() || !newProductAmount || parseInt(newProductAmount) <= 0) {
      toast.error('Vul alle velden correct in');
      return;
    }

    const amount = parseInt(newProductAmount);
    const newProduct: Product = {
      name: newProductName.trim(),
      targetStock: amount,
      currentStock: 0,
      isTemporary: true,
    };

    setProducts([...products, newProduct]);
    setNewProductName('');
    setNewProductAmount('');
    toast.success('✅ Extra product toegevoegd');
  };

  const removeTemporaryProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
    toast.success('Product verwijderd');
  };

  const focusNextInput = (currentIndex: number) => {
    // Focus next input field when Enter is pressed
    const nextIndex = currentIndex + 1;
    if (nextIndex < products.length) {
      const nextInput = document.querySelector(`input[data-index="${nextIndex}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const calculateRefill = (targetStock: number, currentStock: number): number => {
    return Math.max(targetStock - currentStock, 0);
  };

  const getOrderData = () => ({
    locatie: 'West',
    datum: new Date().toISOString(),
    week: currentWeek,
    producten: products.map(p => ({
      naam: p.name,
      ijzerenVoorraad: p.targetStock,
      huidigeVoorraad: p.currentStock,
      aanTeVullen: calculateRefill(p.targetStock, p.currentStock),
    })),
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const orderData = getOrderData();

    // Save order locally
    const timestamp = new Date().toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (demoMode) {
      // Demo mode - simulate success without calling webhook
      setTimeout(() => {
        setLastSubmitted(timestamp);
        localStorage.setItem('pura-vida-last-submitted', timestamp);
        localStorage.setItem('pura-vida-last-order', JSON.stringify(orderData));
        
        // Remove temporary products after successful submission
        const permanentProducts = products.filter(p => !p.isTemporary);
        setProducts(permanentProducts);
        
        toast.success('🌴 Demo: Bestelling gesimuleerd', {
          description: 'In productie wordt deze naar Midsland gestuurd.',
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setLastSubmitted(timestamp);
        localStorage.setItem('pura-vida-last-submitted', timestamp);
        localStorage.setItem('pura-vida-last-order', JSON.stringify(orderData));
        
        // Remove temporary products after successful submission
        const permanentProducts = products.filter(p => !p.isTemporary);
        setProducts(permanentProducts);
        
        toast.success('🌴 Bestelling verzonden!', {
          description: 'Midsland ontvangt deze direct.',
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
        error: error instanceof Error ? error.message : 'Unknown error',
      }));

      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('⏱️ Verbinding verbroken', {
          description: 'De webhook reageert niet. Schakel over naar demo-modus?',
          duration: 6000,
          action: {
            label: 'Demo-modus',
            onClick: () => setDemoMode(true),
          },
        });
      } else {
        toast.error('🔌 Kan webhook niet bereiken', {
          description: 'Controleer of de n8n webhook actief is, of gebruik demo-modus.',
          duration: 6000,
          action: {
            label: 'Demo-modus',
            onClick: () => setDemoMode(true),
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyStock = products.some(p => p.currentStock > 0);
  const totalRefill = products.reduce((sum, p) => sum + calculateRefill(p.targetStock, p.currentStock), 0);

  return (
    <div className="min-h-screen bg-[#F5F7DD]">
      {/* Header */}
      <div className="bg-[#F5F7DD] border-b-2 border-[#1B7867]/20">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center mb-5">
            <img 
              src={logoGreen} 
              alt="Pura Vida Foodbar" 
              className="h-20 sm:h-24 lg:h-28 w-auto"
            />
          </div>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-[#282E3A] font-heading text-[20px]">
                Voorraadregistratie
              </h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#1B7867] text-white text-sm">
                West
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B7867]"></div>
              <p className="text-center text-[#1B7867] text-sm">
                Week {currentWeek} • {new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
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
              Vul de huidige voorraad in. Het systeem berekent wat Midsland moet bereiden.
            </p>
          </div>
        </Card>

        {/* Products Table - All Screen Sizes */}
        <Card className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white mb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1B7867]/10 bg-[#F5F7DD]/30">
                  <th className="px-6 py-5 text-left font-heading font-bold text-[#282E3A]/70 text-sm uppercase tracking-widest">Product</th>
                  <th className="px-6 py-5 text-center font-heading font-bold text-[#282E3A]/70 text-sm uppercase tracking-widest">Ijzer</th>
                  <th className="px-6 py-5 text-center font-heading font-bold text-[#282E3A]/70 text-sm uppercase tracking-widest">Huidig</th>
                  <th className="px-6 py-5 text-center font-heading font-bold text-[#282E3A]/70 text-sm uppercase tracking-widest">Vullen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B7867]/5">
                {products.map((product, index) => (
                  <ProductRow
                    key={`${product.name}-${index}`}
                    product={product}
                    onUpdateStock={(value) => updateProductStock(index, value)}
                    refillAmount={calculateRefill(product.targetStock, product.currentStock)}
                    isFirst={index === 0}
                    onEnter={() => focusNextInput(index)}
                    index={index}
                    onRemove={product.isTemporary ? () => removeTemporaryProduct(index) : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Extra Product - Inline Form */}
        <Card className="p-4 mb-6 bg-white border-2 border-[#E27726]/30 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-[#282E3A]/60 mb-1 block uppercase tracking-wider text-[rgba(40,46,58,0.88)] text-[13px] font-bold">Extra product</label>
              <Input
                placeholder="Bijv. Smoothie basis (bak)"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                className="border-[#E27726]/20 focus:border-[#E27726] bg-white h-11"
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="text-xs text-[#282E3A]/60 mb-1 block uppercase tracking-wider text-[13px] text-[rgba(40,46,58,0.88)] font-bold">Aantal</label>
              <Input
                type="number"
                min="1"
                placeholder="3"
                value={newProductAmount}
                onChange={(e) => setNewProductAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTemporaryProduct();
                  }
                }}
                className="border-[#E27726]/20 focus:border-[#E27726] bg-white h-11"
              />
            </div>
            <Button
              onClick={addTemporaryProduct}
              className="w-full sm:w-auto bg-[#E27726] hover:bg-[#E27726]/90 text-white h-11 px-6 rounded-xl touch-manipulation"
            >
              <Plus className="mr-2 h-4 w-4" />
              Toevoegen
            </Button>
          </div>
        </Card>

        {/* Submit Section */}
        <div className="space-y-4">
          {demoMode && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white border-l-4 border-[#E27726] rounded-2xl shadow-sm">
              <AlertCircle className="w-5 h-5 text-[#E27726] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-[#282E3A]">
                  <span className="font-semibold">Demo-modus</span> – Bestellingen worden gesimuleerd
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDemoMode(false)}
                className="text-[#282E3A]/70 hover:text-[#1B7867] hover:bg-white/80 self-end sm:self-auto"
              >
                Uitschakelen
              </Button>
            </div>
          )}

          {/* Summary Badge */}
          {hasAnyStock && (
            <div className="bg-gradient-to-br from-[#1B7867]/5 to-[#1B7867]/10 rounded-2xl p-5 border-2 border-[#1B7867]/30 shadow-sm">
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
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowPreview(true)}
              disabled={!hasAnyStock}
              variant="outline"
              className="w-full sm:flex-1 h-12 sm:h-auto sm:py-5 border-2 border-[#1B7867] text-[#1B7867] hover:bg-[#1B7867]/5 rounded-2xl font-semibold transition-all touch-manipulation"
            >
              <Eye className="mr-2 h-5 w-5" />
              Voorbeeld
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasAnyStock}
              className="w-full sm:flex-[2] h-12 sm:h-auto sm:py-5 bg-gradient-to-r from-[#1B7867] to-[#0d5a4c] hover:from-[#0d5a4c] hover:to-[#1B7867] text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-semibold touch-manipulation active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Bezig met verzenden...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Verstuur naar Midsland
                </>
              )}
            </Button>
          </div>

          {lastSubmitted && (
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#282E3A]/50 py-2">
              <div className="w-1 h-1 rounded-full bg-[#1B7867]/30"></div>
              <p>Laatst verzonden op {lastSubmitted}</p>
              <div className="w-1 h-1 rounded-full bg-[#1B7867]/30"></div>
            </div>
          )}
        </div>

        {/* Order Preview Dialog */}
        <OrderPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          orderData={getOrderData()}
        />

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-[#282E3A]/50">
          <p>🌴 Pura Vida Foodbar – Fresh & Tropical</p>
        </div>
      </div>
    </div>
  );
}
