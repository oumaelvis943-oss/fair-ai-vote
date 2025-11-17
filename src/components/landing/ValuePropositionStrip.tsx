import { Lock, Scale, Eye, Smartphone } from "lucide-react";

const values = [
  {
    icon: Lock,
    title: "Secure",
    description: "Military-grade encryption"
  },
  {
    icon: Scale,
    title: "Fair",
    description: "AI-powered objectivity"
  },
  {
    icon: Eye,
    title: "Transparent",
    description: "Real-time audit trails"
  },
  {
    icon: Smartphone,
    title: "Accessible",
    description: "Vote from anywhere"
  }
];

const ValuePropositionStrip = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background border-y border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all duration-300" />
                  <div className="relative p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionStrip;
