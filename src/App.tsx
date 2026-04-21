import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireManager } from "@/components/RequireManager";
import { LocationGuard } from "@/components/LocationGuard";
import { UserLocationProvider } from "@/contexts/UserLocationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
// HR Module
import { HrInbox, ApplicantDetail, ApplicantForm, HousingPlanner, HousingForm } from "./pages/hr";
// Maintenance Module
import Onderhoud from "./pages/maintenance/Onderhoud";
import Unsubscribe from "./pages/Unsubscribe";
// Personeel Module
import PersoneelLayout from "./pages/personeel/PersoneelLayout";
import MijnPlanning from "./pages/personeel/MijnPlanning";
import Vandaag from "./pages/personeel/Vandaag";
import Tijdlijn from "./pages/personeel/Tijdlijn";
import Wonen from "./pages/personeel/Wonen";
import Collegas from "./pages/personeel/Collegas";
import PersoneelSettings from "./pages/personeel/PersoneelSettings";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
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
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            
            
            {/* Maintenance Module */}
            <Route
              path="/onderhoud"
              element={
                <ProtectedRoute>
                  <Onderhoud />
                </ProtectedRoute>
              }
            />

            {/* HR Module Routes */}
            <Route 
              path="/hr" 
              element={
                <ProtectedRoute>
                  <HrInbox />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/applicants/new" 
              element={
                <ProtectedRoute>
                  <ApplicantForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/applicants/:id" 
              element={
                <ProtectedRoute>
                  <ApplicantDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/housing" 
              element={
                <ProtectedRoute>
                  <HousingPlanner />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/hr/housing/new" 
              element={
                <ProtectedRoute>
                  <HousingForm />
                </ProtectedRoute>
              } 
            />
            
            {/* Personeel Module — manager-only */}
            <Route
              path="/personeel"
              element={
                <ProtectedRoute>
                  <RequireManager>
                    <PersoneelLayout />
                  </RequireManager>
                </ProtectedRoute>
              }
            >
              <Route index element={<Tijdlijn />} />
              <Route path="vandaag" element={<Vandaag />} />
              <Route path="mijn" element={<MijnPlanning />} />
              <Route path="wonen" element={<Wonen />} />
              <Route path="collegas" element={<Collegas />} />
              <Route path="settings" element={<PersoneelSettings />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </UserLocationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
