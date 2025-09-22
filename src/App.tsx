import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import InitialAdminSetup from "./components/InitialAdminSetup";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminElections from "./pages/admin/AdminElections";
import AdminCreate from "./pages/admin/AdminCreate";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCandidates from "./pages/admin/AdminCandidates";
import AdminUpload from "./pages/admin/AdminUpload";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminSettingsPage from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin-setup" element={<InitialAdminSetup />} />
            
            {/* Admin Routes with Sidebar Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="elections" element={<AdminElections />} />
              <Route path="create" element={<AdminCreate />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="candidates" element={<AdminCandidates />} />
              <Route path="upload" element={<AdminUpload />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
