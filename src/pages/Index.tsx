import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import RoleCards from "@/components/RoleCards";
import SecurityFeatures from "@/components/SecurityFeatures";
import AIFeatures from "@/components/AIFeatures";
import Footer from "@/components/Footer";

const Index = () => {
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
