import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import logoGreen from '@/assets/pura-vida-logo-official.png';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b px-4 bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <img src={logoGreen} alt="Pura Vida" className="h-10" />
            </div>
            <h1 className="text-xl font-heading font-bold text-foreground">
              nesto
            </h1>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
