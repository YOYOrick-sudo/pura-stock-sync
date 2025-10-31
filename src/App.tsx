import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import KitchenMenu from "./pages/kitchen/KitchenMenu";
import Recipes from "./pages/kitchen/Recipes";
import RecipeDetail from "./pages/kitchen/RecipeDetail";
import MepPlanning from "./pages/kitchen/MepPlanning";
import InternalOrders from "./pages/kitchen/InternalOrders";
import KitchenTasks from "./pages/kitchen/KitchenTasks";
import ReservationsDemo from "./pages/ReservationsDemo";
import ReservationsPublic from "./pages/ReservationsPublic";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reservations-demo" element={<ReservationsDemo />} />
            <Route path="/reserveren" element={<ReservationsPublic />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
          <Route 
            path="/kitchen" 
            element={
              <ProtectedRoute>
                <KitchenMenu />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen/recipes" 
            element={
              <ProtectedRoute>
                <Recipes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen/recipes/:id" 
            element={
              <ProtectedRoute>
                <RecipeDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen/mep" 
            element={
              <ProtectedRoute>
                <MepPlanning />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen/orders" 
            element={
              <ProtectedRoute>
                <InternalOrders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/kitchen/tasks" 
            element={
              <ProtectedRoute>
                <KitchenTasks />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
