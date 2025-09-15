import { Button } from "@/components/ui/button";
import { Shield, Vote, Users, BarChart3 } from "lucide-react";
import heroImage from "@/assets/voting-hero.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-accent/30 to-primary/10">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Secure Electronic Voting Platform"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
            SecureVote
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
            AI-Powered Electronic Voting Platform
          </p>
          
          {/* Description */}
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform institutional elections with our secure, transparent, and intelligent voting system. 
            From candidate evaluation to vote counting, experience democracy reimagined.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" variant="hero" className="text-lg px-8 py-4 h-auto">
              Start Election
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View Demo
            </Button>
          </div>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-full bg-success/10 text-success">
                <Shield className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-foreground">Secure</span>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Vote className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-foreground">Democratic</span>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-full bg-warning/10 text-warning">
                <Users className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-foreground">Accessible</span>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <BarChart3 className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-foreground">Transparent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;