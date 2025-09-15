import { Brain, Target, TrendingUp, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AIFeatures = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-accent/20 to-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            AI-Powered Evaluation
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Advanced artificial intelligence ensures fair, objective, and efficient candidate evaluation
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Features */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg flex-shrink-0">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Natural Language Processing</h3>
                <p className="text-muted-foreground">
                  Advanced NLP algorithms analyze written responses, essays, and open-ended questions to evaluate communication skills and depth of thought.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-success/10 text-success rounded-lg flex-shrink-0">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Weighted Criteria Scoring</h3>
                <p className="text-muted-foreground">
                  Customizable evaluation criteria with admin-defined weights ensure candidates are assessed based on your institution's specific values and requirements.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-warning/10 text-warning rounded-lg flex-shrink-0">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Objective Ranking</h3>
                <p className="text-muted-foreground">
                  Eliminate bias with data-driven candidate rankings based on comprehensive analysis of applications, achievements, and qualifications.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 text-primary rounded-lg flex-shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Admin Override Control</h3>
                <p className="text-muted-foreground">
                  Final authority remains with administrators who can review, adjust, and approve AI recommendations before finalizing candidate selections.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Visual */}
          <Card className="card-shadow border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-primary" />
                <span>AI Evaluation Dashboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                  <span className="font-medium">Leadership Assessment</span>
                  <span className="text-success font-semibold">92%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <span className="font-medium">Academic Standing</span>
                  <span className="text-primary font-semibold">88%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg border border-warning/20">
                  <span className="font-medium">Communication Skills</span>
                  <span className="text-warning font-semibold">85%</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                  <span className="font-medium">Community Service</span>
                  <span className="text-muted-foreground font-semibold">78%</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Overall Score</span>
                  <span className="text-2xl font-bold text-primary">87%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recommended for approval
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIFeatures;