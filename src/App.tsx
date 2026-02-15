import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleGuard } from "@/components/RoleGuard";
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
import MijnDashboard from "./pages/mijn/MijnDashboard";
import MijnPlaceholder from "./pages/mijn/MijnPlaceholder";
import EmployeeProfile from "./pages/mijn/EmployeeProfile";
import EmployeeSchedule from "./pages/mijn/EmployeeSchedule";
// HR Module
import { HrInbox, ApplicantDetail, ApplicantForm, HousingPlanner, HousingForm } from "./pages/hr";
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
          
          {/* Management routes - owner/manager/admin only */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <Dashboard />
                </RoleGuard>
              </ProtectedRoute>
            } 
          /> 
          <Route
            path="/taken-bediening" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <FohModule />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route
            path="/taken-analyse" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <FohAnalytics />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kassatelling"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <Kassatelling />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voorraad" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <LocationGuard allowedLocations={['West']}>
                    <Voorraad />
                  </LocationGuard>
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <Settings />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/internal-orders" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <LocationGuard allowedLocations={['West']}>
                    <InternalOrders />
                  </LocationGuard>
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/midsland-bestellingen" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin']}>
                  <LocationGuard allowedLocations={['Midsland']}>
                    <MidslandOrders />
                  </LocationGuard>
                </RoleGuard>
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
          {/* Public Design System route */}
          <Route path="/design-system" element={<DesignSystem />} />
          
          {/* HR Module Routes - owner/manager/admin/hr */}
          <Route 
            path="/hr" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin', 'hr']}>
                  <HrInbox />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/applicants/new" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin', 'hr']}>
                  <ApplicantForm />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/applicants/:id" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin', 'hr']}>
                  <ApplicantDetail />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/housing" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin', 'hr']}>
                  <HousingPlanner />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/housing/new" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['owner', 'manager', 'admin', 'hr']}>
                  <HousingForm />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />

          {/* Personeelsapp routes - all authenticated roles */}
          <Route 
            path="/mijn/dashboard" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['employee', 'team_lead', 'manager', 'owner', 'admin', 'kitchen_staff', 'hr']} fallbackPath="/">
                  <MijnDashboard />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mijn/rooster" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['employee', 'team_lead', 'manager', 'owner', 'admin', 'kitchen_staff', 'hr']} fallbackPath="/">
                  <EmployeeSchedule />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mijn/taken" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['employee', 'team_lead', 'manager', 'owner', 'admin', 'kitchen_staff', 'hr']} fallbackPath="/">
                  <MijnPlaceholder title="Mijn Taken" description="Bekijk en beheer je toegewezen taken." />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mijn/profiel" 
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['employee', 'team_lead', 'manager', 'owner', 'admin', 'kitchen_staff', 'hr']} fallbackPath="/">
                  <EmployeeProfile />
                </RoleGuard>
              </ProtectedRoute>
            } 
          />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </UserLocationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
