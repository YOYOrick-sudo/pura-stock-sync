import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { devError } from "@/lib/devLog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const NotFound = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    devError("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-[calc(1rem+var(--safe-top))]">
      <div className="max-w-sm text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Deze pagina bestaat niet.</p>
        <Button asChild className={isMobile ? 'min-h-11 min-w-11' : undefined}><a href="/">Terug naar start</a></Button>
      </div>
    </div>
  );
};

export default NotFound;
