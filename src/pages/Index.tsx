import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import RoleCards from "@/components/RoleCards";
import SecurityFeatures from "@/components/SecurityFeatures";
import AIFeatures from "@/components/AIFeatures";
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
      <RoleCards />
      <AIFeatures />
      <SecurityFeatures />
      <Footer />
    </div>
  );
};

export default Index;
