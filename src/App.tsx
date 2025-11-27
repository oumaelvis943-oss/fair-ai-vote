import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
import AdminSMTP from "./pages/admin/AdminSMTP";
import AdminInterviews from "./pages/admin/AdminInterviews";
import AdminRoles from "./pages/admin/AdminRoles";
import VoterApplication from "./pages/VoterApplication";
import VoterDashboard from "./pages/VoterDashboard";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultsPage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Log app initialization for monitoring
    console.log('Uchaguzi MFA initialized', {
      version: '1.0.0',
      environment: import.meta.env.MODE,
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin-setup" element={<InitialAdminSetup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/apply" element={<VoterApplication />} />
                <Route path="/voter" element={<VoterDashboard />} />
                <Route path="/vote/:electionId" element={<VotingPage />} />
                <Route path="/results/:electionId" element={<ResultsPage />} />
                
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="overview" element={<AdminOverview />} />
                  <Route path="elections" element={<AdminElections />} />
                  <Route path="create" element={<AdminCreate />} />
                  <Route path="candidates" element={<AdminCandidates />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route path="upload" element={<AdminUpload />} />
                  <Route path="audit" element={<AdminAudit />} />
                  <Route path="smtp" element={<AdminSMTP />} />
                  <Route path="interviews" element={<AdminInterviews />} />
                  <Route path="roles" element={<AdminRoles />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
