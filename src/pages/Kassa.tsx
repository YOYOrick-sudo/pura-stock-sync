import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, ChefHat, CalendarCheck } from 'lucide-react';
import logoGreen from '@/assets/pura-vida-logo-official.png';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
}

const Kassa = () => {
  const navigate = useNavigate();
  const currentWeek = getCurrentWeek();

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

  return (
    <div className="min-h-screen bg-[#F5F7DD]">
      {/* Header */}
      <div className="bg-[#F5F7DD] border-b border-[#1B7867]/10">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:py-5 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            {/* Left: Week & Page */}
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
                <span>Kassatelling</span>
                <span className="mx-2">•</span>
                <span>Pura Vida - West</span>
              </div>
            </div>
            
            {/* Center: Logo */}
            <div className="flex-shrink-0">
              <img src={logoGreen} alt="Pura Vida Foodbar" className="h-16 sm:h-20 w-auto" />
            </div>
            
            {/* Right: Navigation & Logout */}
            <div className="flex-1 flex justify-end gap-2">
              <Button onClick={() => navigate('/kitchen')} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <ChefHat className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('/reservations-demo')} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <CalendarCheck className="h-4 w-4" />
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden flex items-center justify-between gap-3">
            {/* Left: Week & Page */}
            <div className="flex-1 text-left">
              <div className="text-xs text-[#282E3A]/50 mb-1">
                Week {currentWeek} • {new Date().toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'numeric'
                })}
              </div>
              <div className="text-xs text-[#282E3A]/60">
                Kassatelling - West
              </div>
            </div>
            
            {/* Center: Logo */}
            <div className="flex-shrink-0">
              <img src={logoGreen} alt="Pura Vida Foodbar" className="h-14 w-auto" />
            </div>
            
            {/* Right: Navigation & Logout */}
            <div className="flex-1 flex justify-end gap-2">
              <Button onClick={() => navigate('/kitchen')} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <ChefHat className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('/reservations-demo')} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <CalendarCheck className="h-4 w-4" />
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-[#282E3A]/50 hover:text-[#282E3A] hover:bg-transparent">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:px-6 pb-10">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-[#282E3A] mb-6">
          Kassatelling — invoer
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Denominatie</th>
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B7867]/5">
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€500</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€200</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€100</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€50</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€20</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€10</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€5</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="overflow-hidden shadow-sm border-[#1B7867]/10 bg-white rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B7867]/10 bg-[#F5F7DD]/20">
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-left font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Denominatie</th>
                    <th className="px-3 py-3 sm:px-4 sm:py-3 text-center font-heading font-bold text-[#282E3A]/70 text-xs sm:text-sm uppercase tracking-wide">Aantal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B7867]/5">
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€2</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€1</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,50</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,20</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,10</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-3 sm:px-4 text-[#282E3A] font-mono">€0,05</td>
                    <td className="px-3 py-3 sm:px-4 text-center">
                      <input type="number" defaultValue={0} min={0} className="w-20 sm:w-24 px-2 py-1 text-center border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-[#1B7867]/10 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-heading font-bold text-[#282E3A]">
              Totaal
            </span>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-[#1B7867]">
              €0,00
            </span>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-xl shadow-sm border border-[#1B7867]/10 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-lg sm:text-xl font-heading font-bold text-[#282E3A]">
              Cash omzet (Lightspeed)
            </span>
            <input 
              type="number" 
              defaultValue={0} 
              min={0} 
              className="w-32 sm:w-40 px-3 py-2 text-right text-xl sm:text-2xl font-heading font-bold text-[#282E3A] border border-[#1B7867]/20 rounded-md focus:outline-none focus:border-[#1B7867] font-mono" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Kassa;
