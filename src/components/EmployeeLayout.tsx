import { EmployeeSidebar } from '@/components/EmployeeSidebar';
import { PolarHeader } from '@/components/polar';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useState } from 'react';

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/mijn/dashboard': 'Mijn Dashboard',
  '/mijn/rooster': 'Mijn Rooster',
  '/mijn/taken': 'Mijn Taken',
  '/mijn/documenten': 'Documenten',
  '/mijn/profiel': 'Mijn Profiel',
};

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const title = pageTitles[location.pathname] || 'Mijn Pura Vida';

  return (
    <div className="flex min-h-screen w-full" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div style={{ backgroundColor: '#FFFFFF' }}>
          <EmployeeSidebar />
        </div>
      )}

      {/* Mobile Menu Sheet */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0" style={{ backgroundColor: '#FFFFFF' }}>
            <EmployeeSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-col flex-1">
        <PolarHeader
          title={title}
          showStatusIndicator={false}
          onMenuClick={isMobile ? () => setMobileMenuOpen(true) : undefined}
        />

        <main className="p-4 md:p-6 lg:px-12 lg:py-8" style={{ backgroundColor: '#F8F9FA' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
