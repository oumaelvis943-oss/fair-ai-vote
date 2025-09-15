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
    <section className="py-20 bg-gradient-to-b from-background to-accent/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Built for Every Role
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our platform serves administrators, candidates, and voters with tailored experiences
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((role, index) => {
            const Icon = role.icon;
            return (
              <Card key={index} className="relative group hover:shadow-institutional transition-all duration-300 border-0 card-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${role.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {role.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold">{role.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full group-hover:shadow-card-hover transition-all duration-300" 
                    variant="outline"
                  >
                    Access Dashboard
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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