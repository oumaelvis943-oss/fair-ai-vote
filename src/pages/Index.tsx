import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ValuePropositionStrip from "@/components/landing/ValuePropositionStrip";
import RoleCards from "@/components/RoleCards";
import AIFeatures from "@/components/AIFeatures";
import SecurityFeatures from "@/components/SecurityFeatures";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import Footer from "@/components/Footer";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ValuePropositionStrip />
      <RoleCards />
      <AIFeatures />
      <SecurityFeatures />
      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default Index;
