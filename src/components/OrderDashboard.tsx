import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Loader2, Check, Eye, AlertCircle, Package, Plus, X, CheckCircle2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ProductRow } from './ProductRow';
import { OrderPreview } from './OrderPreview';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from './ui/alert-dialog';
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/lib/supabase';
interface Product {
  name: string;
  targetStock: number;
  currentStock: number;
  isTemporary?: boolean;
}
const INITIAL_PRODUCTS: Product[] = [{
  name: 'Bananenbrood (tray)',
  targetStock: 4,
  currentStock: 0
}, {
  name: 'Energy balls (doos)',
  targetStock: 3,
  currentStock: 0
}, {
  name: 'Curry basis (bak)',
  targetStock: 2,
  currentStock: 0
}, {
  name: 'Soep basis',
  targetStock: 2,
  currentStock: 0
}, {
  name: 'Falafel (bak)',
  targetStock: 3,
  currentStock: 0
}];
function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}
export default function OrderDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
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
          return saved ? {
            ...initial,
            currentStock: saved.currentStock
          } : initial;
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
      isTemporary: true
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
      aanTeVullen: calculateRefill(p.targetStock, p.currentStock)
    }))
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
      minute: '2-digit'
    });
    if (demoMode) {
      // Demo mode - simulate success without calling webhook
      setTimeout(() => {
        setLastSubmitted(timestamp);
        localStorage.setItem('pura-vida-last-submitted', timestamp);
        localStorage.setItem('pura-vida-last-order', JSON.stringify(orderData));

        // Reset all products to 0 and remove temporary products
        const resetProducts = products.filter(p => !p.isTemporary).map(p => ({
          ...p,
          currentStock: 0
        }));
        setProducts(resetProducts);
        localStorage.setItem('pura-vida-products', JSON.stringify(resetProducts));
        localStorage.removeItem('pura-vida-temp-products');

        // Show success dialog
        setShowSuccessDialog(true);
        setIsSubmitting(false);
      }, 1500);
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://jaapies.app.n8n.cloud/webhook-test/deecbeab-7823-4b18-8bd8-b56bef5927da', {
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

        // Reset all products to 0 and remove temporary products
        const resetProducts = products.filter(p => !p.isTemporary).map(p => ({
          ...p,
          currentStock: 0
        }));
        setProducts(resetProducts);
        localStorage.setItem('pura-vida-products', JSON.stringify(resetProducts));
        localStorage.removeItem('pura-vida-temp-products');

        // Show success dialog
        setShowSuccessDialog(true);
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
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Uitgelogd');
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Uitloggen mislukt');
    }
  };

  const hasAnyStock = products.some(p => p.currentStock > 0);
  const totalRefill = products.reduce((sum, p) => sum + calculateRefill(p.targetStock, p.currentStock), 0);
  
  return <div className="min-h-screen bg-[#F5F7DD]">
      {/* Header */}
      <div className="bg-[#F5F7DD] border-b border-[#1B7867]/10">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-5 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            {/* Left: Week & Voorraad */}
            <div className="flex-1">
              <div className="text-xs text-[#282E3A]/50 mb-1">
                <span>Week {currentWeek}</span>
                <span className="mx-2">•</span>
                <span>{new Date().toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </div>
              <div className="text-sm text-[#282E3A]/70">
                <span>Voorraad</span>
                <span className="mx-2">•</span>
                <span>Pura Vida - West</span>
              </div>
            </div>
            
            {/* Center: Logo */}
            <div className="flex-shrink-0">
              <img src={logoGreen} alt="Pura Vida Foodbar" className="h-16 sm:h-20 w-auto" />
            </div>
            
            {/* Right: Logout */}
            <div className="flex-1 flex justify-end">
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[#282E3A]/50">
                Week {currentWeek} • {new Date().toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent -mr-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-center mb-2">
              <img src={logoGreen} alt="Pura Vida Foodbar" className="h-14 w-auto" />
            </div>
            <div className="text-center text-xs text-[#282E3A]/60">
              Voorraad - West
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
              Noteer de huidige voorraad. Het systeem rekent uit wat Midsland aanvult.
            </p>
          </div>
        </Card>

        {/* Products Table - All Screen Sizes */}
        <Card className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white mb-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                  <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Product</th>
                  <th className="px-2 py-3 sm:px-3 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Ijzer</th>
                  <th className="px-2 py-3 sm:px-3 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Huidig</th>
                  <th className="px-2 py-3 sm:px-3 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Vullen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B7867]/5">
                {products.map((product, index) => <ProductRow key={`${product.name}-${index}`} product={product} onUpdateStock={value => updateProductStock(index, value)} refillAmount={calculateRefill(product.targetStock, product.currentStock)} isFirst={index === 0} onEnter={() => focusNextInput(index)} index={index} onRemove={product.isTemporary ? () => removeTemporaryProduct(index) : undefined} />)}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Extra Product - Inline Form */}
        <Card className="p-4 sm:p-5 mb-6 bg-white border-[#E27726]/20 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm mb-1 block uppercase tracking-wide">Extra product</label>
              <Input placeholder="Bijv. Smoothie basis (bak)" value={newProductName} onChange={e => setNewProductName(e.target.value)} className="border-[#E27726]/20 focus:border-[#E27726] bg-white h-11" />
            </div>
            <div className="w-full sm:w-32">
              <label className="font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm mb-1 block uppercase tracking-wide">Aantal</label>
              <Input type="number" min="1" placeholder="3" value={newProductAmount} onChange={e => setNewProductAmount(e.target.value)} onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTemporaryProduct();
              }
            }} className="border-[#E27726]/20 focus:border-[#E27726] bg-white h-11" />
            </div>
            <Button onClick={addTemporaryProduct} className="w-full sm:w-auto bg-[#E27726] hover:bg-[#E27726]/90 text-white h-11 px-6 rounded-xl touch-manipulation">
              <Plus className="mr-2 h-4 w-4" />
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

          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#282E3A]/50 py-2 min-h-[2rem]">
            {lastSubmitted ? <>
                <div className="w-1 h-1 rounded-full bg-[#1B7867]/30"></div>
                <p>Laatst verzonden op {lastSubmitted}</p>
                <div className="w-1 h-1 rounded-full bg-[#1B7867]/30"></div>
              </> : <p className="text-[#282E3A]/30">Nog niet verzonden</p>}
          </div>
        </div>

        {/* Order Preview Dialog */}
        <OrderPreview open={showPreview} onClose={() => setShowPreview(false)} orderData={getOrderData()} />

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md mx-4 bg-white border-2 border-[#1B7867]/30 rounded-3xl shadow-2xl">
            <AlertDialogHeader className="space-y-3 sm:space-y-4 pt-2">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#1B7867] to-[#0d5a4c] rounded-full flex items-center justify-center animate-scale-in shadow-lg">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <AlertDialogTitle className="text-xl sm:text-2xl font-heading text-center text-[#282E3A] px-2">
                Bestelling verzonden!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-[#282E3A]/70 text-sm sm:text-base space-y-2 px-2">
                <p className="font-medium leading-relaxed">Je bestelling is succesvol naar Midsland gestuurd.</p>
                {totalRefill > 0 && <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-[#F5F7DD] rounded-xl">
                    <p className="text-sm sm:text-base">
                      <span className="font-semibold text-[#1B7867]">{totalRefill} {totalRefill === 1 ? 'product' : 'producten'}</span> worden aangevuld
                    </p>
                  </div>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2">
              <Button onClick={() => setShowSuccessDialog(false)} className="w-full bg-gradient-to-r from-[#1B7867] to-[#0d5a4c] hover:from-[#0d5a4c] hover:to-[#1B7867] text-white h-11 sm:h-12 rounded-2xl font-semibold transition-all duration-200 active:scale-[0.98] touch-manipulation">
                Sluiten
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md mx-4 bg-white border-2 border-[#E27726]/30 rounded-3xl shadow-2xl">
            <AlertDialogHeader className="space-y-3 sm:space-y-4 pt-2">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#E27726] to-[#d16615] rounded-full flex items-center justify-center shadow-lg">
                <LogOut className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <AlertDialogTitle className="text-xl sm:text-2xl font-heading text-center text-[#282E3A] px-2">
                Uitloggen?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-[#282E3A]/70 text-sm sm:text-base px-2">
                Weet je zeker dat je wilt uitloggen?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2 flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto border-2 border-[#1B7867]/20 hover:bg-[#1B7867]/5 rounded-xl">
                Annuleren
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLogout}
                className="w-full sm:w-auto bg-gradient-to-r from-[#E27726] to-[#d16615] hover:from-[#d16615] hover:to-[#E27726] text-white rounded-xl"
              >
                Uitloggen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#282E3A]/60 italic max-w-md mx-auto px-4">
            *Pro tip: Alles netjes invullen = happy Midsland, happy gasten, happy jullie 🎉
          </p>
        </div>
      </div>
    </div>;
}