import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Vote, Users, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/voting-hero.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <img 
          src={heroImage} 
          alt="Secure Electronic Voting Platform"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left: Text Content */}
          <div className="space-y-8 animate-fade-in">
            <Badge variant="outline" className="inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Powered Democracy
            </Badge>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
                  AI-Powered Elections.
                </span>
                <br />
                <span className="text-foreground">
                  Transparent. Secure. Accessible.
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                From candidate evaluation to vote counting, experience democracy reimagined with cutting-edge AI and blockchain technology.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6 h-auto bg-gradient-to-r from-primary to-primary-glow hover:shadow-primary group" onClick={() => navigate('/auth')}>
                Start Election
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-2 hover:bg-primary/5">
                View Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border/50">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">98%</div>
                <div className="text-sm text-muted-foreground">Voter Satisfaction</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-success mb-1">100%</div>
                <div className="text-sm text-muted-foreground">Secure</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
          
          {/* Right: Visual Element */}
          <div className="relative animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50" />
              <img 
                src={heroImage} 
                alt="Voting Dashboard Preview"
                className="w-full h-auto relative z-10"
              />
              
              {/* Floating Cards */}
              <div className="absolute top-6 right-6 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Shield className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Encrypted Votes</div>
                    <div className="text-xs text-muted-foreground">100% Secure</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-xl animate-float delay-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Real-time Results</div>
                    <div className="text-xs text-muted-foreground">Live Analytics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;