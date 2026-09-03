import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RequireManager } from "@/components/RequireManager";
import { RequireOwner } from "@/components/RequireOwner";
import { UserLocationProvider } from "@/contexts/UserLocationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import FohModule from "./pages/foh/FohModule";
import FohAnalytics from "./pages/foh/FohAnalytics";
import TakenBeheer from "./pages/TakenBeheer";
import TakenAdmin from "./pages/TakenAdmin";
import Kassatelling from "./pages/Kassatelling";
import VoorraadBestellen from "./pages/voorraad/Bestellen";
import VoorraadOnderweg from "./pages/voorraad/Onderweg";
import VoorraadStand from "./pages/voorraad/Stand";
import Settings from "./pages/Settings";
import StyleGuide from "./pages/StyleGuide";
import DesignPreview from "./pages/DesignPreview";
import DesignSystem from "./pages/DesignSystem";
import KasControle from "./pages/KasControle";
import Recipes from "./pages/kitchen/Recipes";
import Gerechten from "./pages/kitchen/Gerechten";
import RecipeDetail from "./pages/kitchen/RecipeDetail";
import RecipeForm from "./pages/kitchen/RecipeForm";
import Ingredienten from "./pages/kitchen/Ingredienten";
import SnelPrinten from "./pages/kitchen/SnelPrinten";
import MepPlanning from "./pages/kitchen/MepPlanning";
import MepDag from "./pages/kitchen/MepDag";
import MepWeek from "./pages/kitchen/MepWeek";
import MepInstellingen from "./pages/settings/MepInstellingen";
import KetenBeheer from "./pages/settings/KetenBeheer";

import MepBeheer from "./pages/kitchen/MepBeheer";
// HR Module
import { HrInbox, ApplicantDetail, ApplicantForm, HousingPlanner, HousingForm } from "./pages/hr";
// Maintenance Module
import Onderhoud from "./pages/maintenance/Onderhoud";
import Unsubscribe from "./pages/Unsubscribe";
// Personeel Module
import PersoneelLayout from "./pages/personeel/PersoneelLayout";
import Tijdlijn from "./pages/personeel/Tijdlijn";
import Wonen from "./pages/personeel/Wonen";
import WonenDetail from "./pages/personeel/WonenDetail";
import Collegas from "./pages/personeel/Collegas";
import PersoneelSettings from "./pages/personeel/PersoneelSettings";
import SetPassword from "./pages/auth/SetPassword";
import Team from "./pages/settings/Team";
import Bronnen from "./pages/settings/Bronnen";
import Cijfers from "./pages/Cijfers";
import LightspeedCallback from "./pages/LightspeedCallback";
const queryClient = new QueryClient();

/** MEP is alleen actief voor West (Daily); Midsland-gebruikers worden teruggestuurd. */
const RequireWest = ({ children }: { children: React.ReactNode }) => {
  const { userLocation, loading } = useUserLocation();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }
  if (userLocation !== 'West') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

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
            <Route path="/auth/callback" element={<SetPassword />} />
            <Route path="/auth/set-password" element={<SetPassword />} />
            
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
              path="/taken/beheer"
              element={<TakenBeheer />}
            />
            <Route
              path="/taken/admin"
              element={<TakenAdmin />}
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
                  <VoorraadBestellen />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/voorraad/onderweg"
              element={
                <ProtectedRoute>
                  <VoorraadOnderweg />
                </ProtectedRoute>
              }
            />
            <Route
              path="/voorraad/stand"
              element={
                <ProtectedRoute>
                  <VoorraadStand />
                </ProtectedRoute>
              }
            />
            <Route path="/bestelronde" element={<Navigate to="/voorraad" replace />} />
            <Route path="/inkooporders" element={<Navigate to="/voorraad/onderweg" replace />} />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <RequireOwner>
                    <Settings />
                  </RequireOwner>
                </ProtectedRoute>
              } 
            />
            <Route
              path="/settings/team"
              element={
                <ProtectedRoute>
                  <RequireOwner>
                    <Team />
                  </RequireOwner>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/bronnen"
              element={
                <ProtectedRoute>
                  <RequireOwner>
                    <Bronnen />
                  </RequireOwner>
                </ProtectedRoute>
              }
            />
            <Route path="/internal-orders" element={<Navigate to="/voorraad" replace />} />
            <Route path="/midsland-bestellingen" element={<Navigate to="/voorraad/onderweg" replace />} />
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

            {/* Kas-controle — alleen managers/owners/admins */}
            <Route
              path="/kas-controle"
              element={
                <ProtectedRoute>
                  <RequireManager>
                    <KasControle />
                  </RequireManager>
                </ProtectedRoute>
              }
            />

            {/* Cijfers — owner-only (embryo: alleen koppelingen; dashboard volgt) */}
            <Route
              path="/cijfers"
              element={
                <ProtectedRoute>
                  <RequireOwner>
                    <Cijfers />
                  </RequireOwner>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lightspeed/callback"
              element={
                <ProtectedRoute>
                  <RequireOwner>
                    <LightspeedCallback />
                  </RequireOwner>
                </ProtectedRoute>
              }
            />

            {/* Receptenmodule */}
            <Route path="/kitchen/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
            <Route path="/kitchen/recipes/nieuw" element={<ProtectedRoute><RecipeForm /></ProtectedRoute>} />
            <Route path="/kitchen/recipes/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
            <Route path="/kitchen/recipes/:id/bewerken" element={<ProtectedRoute><RecipeForm /></ProtectedRoute>} />
            <Route path="/kitchen/ingredienten" element={<ProtectedRoute><Ingredienten /></ProtectedRoute>} />
            <Route path="/kitchen/gerechten" element={<ProtectedRoute><Gerechten /></ProtectedRoute>} />
            <Route path="/kitchen/mep" element={<ProtectedRoute><MepDag /></ProtectedRoute>} />
            <Route path="/kitchen/mep/week" element={<ProtectedRoute><MepWeek /></ProtectedRoute>} />
            <Route path="/kitchen/mep/oud" element={<ProtectedRoute><MepPlanning /></ProtectedRoute>} />
            <Route path="/kitchen/mep/beheer" element={<ProtectedRoute><MepBeheer /></ProtectedRoute>} />
            <Route path="/settings/mep" element={<ProtectedRoute><MepInstellingen /></ProtectedRoute>} />
            <Route path="/settings/keten" element={<ProtectedRoute><RequireManager><KetenBeheer /></RequireManager></ProtectedRoute>} />

            <Route path="/kitchen/snel-printen" element={<ProtectedRoute><SnelPrinten /></ProtectedRoute>} />


            
            
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
              <Route path="wonen" element={<Wonen />} />
              <Route path="wonen/:id" element={<WonenDetail />} />
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
