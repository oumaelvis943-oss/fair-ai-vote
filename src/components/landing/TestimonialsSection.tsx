import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, TrendingUp } from "lucide-react";

const testimonials = [
  {
    institution: "Mpesa Foundation Academy",
    role: "Electoral Commission Chair",
    quote: "Uchaguzi MFA transformed our election process. The AI evaluation reduced bias and the voting was seamlessly secure.",
    metric: "98% voter satisfaction",
    metricIcon: TrendingUp
  },
  {
    institution: "East African University",
    role: "Student Council President",
    quote: "The transparency and real-time results built unprecedented trust in our student elections.",
    metric: "92% voter turnout",
    metricIcon: TrendingUp
  },
  {
    institution: "Tech Innovation Institute",
    role: "Dean of Students",
    quote: "From candidate applications to final results, every step was secure and verifiable. Outstanding platform.",
    metric: "Zero security incidents",
    metricIcon: TrendingUp
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background via-accent/10 to-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5">
            Trusted By Institutions
          </Badge>
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Empowering Democratic Processes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the institutions revolutionizing their elections with AI-powered transparency
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => {
            const MetricIcon = testimonial.metricIcon;
            return (
              <Card key={index} className="card-shadow border-0 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full transform translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-500" />
                
                <CardContent className="pt-8 pb-6 relative">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.institution}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <MetricIcon className="h-4 w-4 text-success" />
                      </div>
                      <span className="text-sm font-medium text-success">
                        {testimonial.metric}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
