import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LocationGuard } from "@/components/LocationGuard";
import { UserLocationProvider } from "@/contexts/UserLocationContext";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import FohModule from "./pages/foh/FohModule";
import FohAnalytics from "./pages/foh/FohAnalytics";
import Kassatelling from "./pages/Kassatelling";
import Voorraad from "./pages/Voorraad";
import Settings from "./pages/Settings";
import InternalOrders from "./pages/kitchen/InternalOrders";
import MidslandOrders from "./pages/MidslandOrders";
import StyleGuide from "./pages/StyleGuide";
import DesignPreview from "./pages/DesignPreview";
import DesignSystem from "./pages/DesignSystem";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserLocationProvider>
          <Routes>
          {/* Auth routes */}
          <Route path="/" element={<Auth />} />
          
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
            path="/taken-analyse" 
            element={
              <ProtectedRoute>
                <FohAnalytics />
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
            path="/internal-orders" 
            element={
              <ProtectedRoute>
                <LocationGuard allowedLocations={['West']}>
                  <InternalOrders />
                </LocationGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/midsland-bestellingen" 
            element={
              <ProtectedRoute>
                <LocationGuard allowedLocations={['Midsland']}>
                  <MidslandOrders />
                </LocationGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/style-guide" 
            element={
              <ProtectedRoute>
                <StyleGuide />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/design-preview" 
            element={
              <ProtectedRoute>
                <DesignPreview />
              </ProtectedRoute>
            } 
          />
          {/* Public Design System route - no login needed */}
          <Route path="/design-system" element={<DesignSystem />} />
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </UserLocationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
