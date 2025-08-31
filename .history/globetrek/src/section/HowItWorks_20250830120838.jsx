import iconPlan from "@/assets/icon-plan.jpg";
import iconPack from "@/assets/icon-pack.jpg";
import iconGo from "@/assets/icon-go.jpg";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Plan",
      description: "Browse curated itineraries or let us suggest the perfect adventure based on your preferences and budget.",
      icon: iconPlan,
    },
    {
      number: "02",
      title: "Pack",
      description: "Get personalized packing lists and local tips from experienced travelers who've been there before.",
      icon: iconPack,
    },
    {
      number: "03",
      title: "Go",
      description: "Connect with fellow adventurers, share experiences, and discover hidden gems with our travel community.",
      icon: iconGo,
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-adventure-green-light/20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-adventure-brown mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to your next unforgettable adventure
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-1/2 w-full h-0.5 bg-adventure-green/20 z-0">
                  <div className="w-1/2 h-full bg-adventure-green"></div>
                </div>
              )}

              {/* Card */}
              <div className="relative bg-white rounded-2xl p-8 shadow-card hover:shadow-adventure transition-all duration-300 group-hover:-translate-y-2 border border-adventure-green/10">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-adventure-green text-white font-bold rounded-full mb-6">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl overflow-hidden bg-adventure-green-light/50 p-3">
                  <img
                    src={step.icon}
                    alt={step.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-adventure-brown mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-card border border-adventure-green/10 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-adventure-brown mb-4">
              Ready to Start Your Adventure?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of travelers who have discovered smarter ways to explore the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-adventure-green text-white px-8 py-3 rounded-lg font-medium hover:bg-adventure-green/90 transition-colors shadow-adventure">
                Get Started Today
              </button>
              <button className="text-adventure-green font-medium hover:text-adventure-green/80 transition-colors">
                Learn More →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;