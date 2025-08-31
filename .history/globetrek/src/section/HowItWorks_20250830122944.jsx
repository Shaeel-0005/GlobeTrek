import { FaRegCalendarAlt, FaSuitcaseRolling, FaPlaneDeparture } from "react-icons/fa";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Plan",
      description:
        "Browse curated itineraries or let us suggest the perfect adventure based on your preferences and budget.",
      icon: <FaRegCalendarAlt size={40} className="text-green-600" />,
    },
    {
      number: "02",
      title: "Pack",
      description:
        "Get personalized packing lists and local tips from experienced travelers who've been there before.",
      icon: <FaSuitcaseRolling size={40} className="text-green-600" />,
    },
    {
      number: "03",
      title: "Go",
      description:
        "Connect with fellow adventurers, share experiences, and discover hidden gems with our travel community.",
      icon: <FaPlaneDeparture size={40} className="text-green-600" />,
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-green-100/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to your next unforgettable adventure
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-1/2 w-full h-0.5 bg-green-200/50 z-0">
                  <div className="w-1/2 h-full bg-green-600"></div>
                </div>
              )}

              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-green-100">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white font-bold rounded-full mb-6">
                  {step.number}
                </div>

                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-xl overflow-hidden bg-green-100 p-2">
                  {step.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Your Adventure?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of travelers who have discovered smarter ways to explore the world.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-md">
                Get Started Today
              </button>
              <button className="text-green-600 font-medium hover:text-green-700 transition-colors">
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
