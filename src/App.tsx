import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LocationGuard } from "@/components/LocationGuard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import FohModule from "./pages/foh/FohModule";
import Kassatelling from "./pages/Kassatelling";
import Voorraad from "./pages/Voorraad";
import Settings from "./pages/Settings";
import InternalOrders from "./pages/kitchen/InternalOrders";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<Auth />} />
          <Route path="/home" element={<Auth />} />
          
          {/* Main module routes - all with sidebar */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          /> 
          <Route
            path="/taken-bediening" 
            element={
              <ProtectedRoute>
                <FohModule />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kassatelling" 
            element={
              <ProtectedRoute>
                <Kassatelling />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voorraad" 
            element={
              <ProtectedRoute>
                <LocationGuard allowedLocations={['West']}>
                  <Voorraad />
                </LocationGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen-internal-orders" 
            element={
              <ProtectedRoute>
                <LocationGuard allowedLocations={['Oost', 'Mids']}>
                  <InternalOrders />
                </LocationGuard>
              </ProtectedRoute>
            } 
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
