import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, FileText, Vote, ChevronRight } from "lucide-react";

const roles = [
  {
    title: "Administrator",
    description: "Manage elections, set criteria, and oversee the entire voting process",
    icon: Settings,
    features: [
      "Create evaluation criteria",
      "Setup election parameters", 
      "AI-assisted candidate ranking",
      "Results validation",
      "Audit trail management"
    ],
    color: "bg-primary",
    badge: "Control Center"
  },
  {
    title: "Candidate",
    description: "Apply for positions and track your application status",
    icon: FileText,
    features: [
      "Submit applications",
      "Upload documents",
      "Track evaluation progress",
      "View feedback",
      "Real-time status updates"
    ],
    color: "bg-warning",
    badge: "Apply Now"
  },
  {
    title: "Voter",
    description: "Cast your vote securely and view transparent results",
    icon: Vote,
    features: [
      "Secure ballot access",
      "Anonymous voting",
      "Real-time results",
      "Vote verification",
      "Transparent process"
    ],
    color: "bg-success",
    badge: "Vote Securely"
  }
];

const RoleCards = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            Tailored Experiences
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Built for Every Role
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed for administrators, candidates, and voters
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <Card 
                key={index} 
                className="relative group hover:shadow-2xl transition-all duration-500 border-0 card-shadow overflow-hidden hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <CardHeader className="pb-4 relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                      <div className={`relative p-4 rounded-xl ${role.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs font-medium px-3 py-1">
                      {role.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">{role.title}</CardTitle>
                  <CardDescription className="text-muted-foreground text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <ul className="space-y-3 mb-6">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3 text-sm text-muted-foreground group/item">
                        <div className="mt-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 group-hover/item:scale-125 transition-transform">
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          </div>
                        </div>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full group-hover:shadow-lg transition-all duration-300 group/btn" 
                    variant="outline"
                    size="lg"
                  >
                    Access Dashboard
                    <ChevronRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RoleCards;