import { Shield, Lock, Eye, Hash } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "End-to-End Security",
    description: "Every vote is protected with military-grade encryption and secure authentication protocols"
  },
  {
    icon: Lock,
    title: "Anonymous Voting",
    description: "Complete voter privacy with no linkage between ballot ID and voter identity"
  },
  {
    icon: Hash,
    title: "Hash Chain Integrity",
    description: "Blockchain-inspired vote storage ensures immutable and verifiable election records"
  },
  {
    icon: Eye,
    title: "Full Transparency", 
    description: "Real-time audit logs and transparent counting process for complete election visibility"
  }
];

const SecurityFeatures = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/5 via-background to-success/5">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Uncompromising Security
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built with enterprise-grade security features to ensure every vote counts and every election is trustworthy
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center group">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-institutional rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center w-full h-full bg-gradient-institutional rounded-full text-white group-hover:shadow-glow transition-all duration-300">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-success/10 text-success rounded-full">
            <Shield className="h-5 w-5" />
            <span className="font-medium">ISO 27001 Compliant Security Standards</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityFeatures;