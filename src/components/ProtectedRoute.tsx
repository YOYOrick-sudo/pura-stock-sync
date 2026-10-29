import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStatus } from '@/contexts/AuthContext';
import { StartScherm } from '@/components/auth/StartScherm';
import { useHeeftRol } from '@/hooks/useHeeftRol';
import { useIsMtLid } from '@/hooks/useIsMtLid';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const Laden = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const GeenToegang = () => {
  const queryClient = useQueryClient();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-card border border-border/60 rounded-[20px] p-8 shadow-sm text-center space-y-4">
        <h1 className="text-lg font-semibold">Geen toegang</h1>
        <p className="text-sm text-muted-foreground">
          Dit account heeft nog geen toegang tot de app. Vraag een leidinggevende om je toe te voegen.
        </p>
        <Button
          variant="outline"
          className="min-h-[44px]"
          onClick={async () => {
            await supabase.auth.signOut();
            queryClient.clear();
            window.location.href = '/';
          }}
        >
          <LogOut className="h-4 w-4" />
          Uitloggen
        </Button>
      </div>
    </div>
  );
};

/** Stuurt ingelogde accounts zonder actieve rol door: MT-leden naar /mt-punt, anderen naar "Geen toegang". */
const RolPoort = ({ children }: ProtectedRouteProps) => {
  const { pathname } = useLocation();
  const { heeftRol, loading } = useHeeftRol();
  const { isMtLid, loading: mtLoading } = useIsMtLid();
  const isMtPagina = pathname === '/mt-punt';

  if (isMtPagina) return <>{children}</>;
  if (loading) return <Laden />;
  // Rol aanwezig of (nog) onbekend door een fout: gedrag ongewijzigd.
  if (heeftRol !== false) return <>{children}</>;
  if (mtLoading) return <Laden />;
  if (isMtLid) return <Navigate to="/mt-punt" replace />;
  return <GeenToegang />;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { status, offline, opnieuw } = useAuthStatus();

  // Zolang niet vaststaat of er een sessie is: rustig startscherm, geen
  // doorverwijzing naar het inlogscherm.
  if (status === 'onbekend') {
    return <StartScherm offline={offline} opnieuw={opnieuw} />;
  }

  if (status === 'uitgelogd') {
    return <Navigate to="/" replace />;
  }

  return <RolPoort>{children}</RolPoort>;
};
