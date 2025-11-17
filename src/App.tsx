import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
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
            <Route path="/apply" element={<VoterApplication />} />
            <Route path="/voter" element={<VoterDashboard />} />
            <Route path="/vote/:electionId" element={<VotingPage />} />
            <Route path="/results/:electionId" element={<ResultsPage />} />
            
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
              <Route path="smtp" element={<AdminSMTP />} />
              <Route path="interviews" element={<AdminInterviews />} />
              <Route path="roles" element={<AdminRoles />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
