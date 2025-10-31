import { useState } from "react";
import { Calendar, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReservationWidget from "./ReservationWidget";
import { cn } from "@/lib/utils";

const ReservationStickyBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-primary text-primary-foreground shadow-hover border-t border-primary-hover animate-slide-in">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              <div className="hidden sm:block">
                <p className="font-bold text-sm">Reserveer een tafel</p>
                <p className="text-xs opacity-80">Beschikbaar vandaag</p>
              </div>
              <p className="sm:hidden font-bold text-sm">Reserveer tafel</p>
            </div>
            
            <Button
              onClick={() => setIsOpen(true)}
              variant="secondary"
              size="sm"
              className="font-bold"
            >
              <Users className="h-4 w-4 mr-2" />
              Reserveer
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-in Panel Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel - Desktop: slide from right, Mobile: slide from bottom */}
          <div
            className={cn(
              "fixed z-50 bg-card",
              "sm:right-0 sm:top-0 sm:bottom-0 sm:w-full sm:max-w-2xl sm:animate-slide-in-right sm:shadow-2xl",
              "max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:max-h-[90vh] max-sm:rounded-t-3xl max-sm:animate-slide-up"
            )}
          >
            {/* Close Button */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold font-heading text-foreground">
                Reserveer je Tafel
              </h2>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Widget Content - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-80px)]">
              <div className="p-6">
                <ReservationWidget />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ReservationStickyBar;
