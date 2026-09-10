import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const TRAAG_NA_MS = 10_000;

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [traag, setTraag] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const poging = useRef(0);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setTraag(false);
    const mijnPoging = ++poging.current;
    const timer = setTimeout(() => {
      if (poging.current === mijnPoging) setTraag(true);
    }, TRAAG_NA_MS);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (poging.current !== mijnPoging) return;
      setIsAuthenticated(!!session);
      setLoading(false);
    } catch {
      if (poging.current !== mijnPoging) return;
      setIsAuthenticated(false);
      setLoading(false);
    } finally {
      clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    void checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
      setTraag(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Laden...</p>
          {traag && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                Het duurt langer dan normaal.
              </p>
              <Button variant="outline" className="min-h-[44px]" onClick={() => window.location.reload()}>
                Opnieuw proberen
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
