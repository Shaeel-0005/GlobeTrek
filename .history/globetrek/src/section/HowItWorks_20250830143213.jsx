import { FaRegCalendarAlt, FaSuitcaseRolling, FaPlaneDeparture } from "react-icons/fa";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Plan",
      description:
        "Browse curated itineraries or let us suggest the perfect adventure based on your preferences and budget.",
      icon: <FaRegCalendarAlt size={40} className="text-[#1447E6]" />,
    },
    {
      number: "02",
      title: "Pack",
      description:
        "Get personalized packing lists and local tips from experienced travelers who've been there before.",
      icon: <FaSuitcaseRolling size={40} className="text-[#1447E6]" />,
    },
    {
      number: "03",
      title: "Go",
      description:
        "Connect with fellow adventurers, share experiences, and discover hidden gems with our travel community.",
      icon: <FaPlaneDeparture size={40} className="text-[#1447E6]" />,
    },
  ];

  return (
    <section className="py-24 bg-[#020F13]">
  <div className="max-w-7xl mx-auto px-6">
    {/* Header */}
    <div className="text-center mb-16">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
        How It Works
      </h2>
      <p className="text-xl text-gray-400 max-w-2xl mx-auto">
        Three simple steps to your next unforgettable adventure
      </p>
    </div>

    {/* Steps Grid */}
    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
      {steps.map((step, index) => (
        <div key={step.number} className="relative group">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="hidden md:block absolute top-24 left-1/2 w-full h-0.5 bg-[#1447E6]/20 z-0">
              <div className="w-1/2 h-full bg-[#1447E6]"></div>
            </div>
          )}

          {/* Card */}
          <div className="relative bg-[#1B1B1B] rounded-3xl p-8 shadow-md hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-3 border border-[#1447E6]/30">
            {/* Step Number */}
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1447E6] text-white font-bold rounded-full mb-6 shadow-md">
              {step.number}
            </div>

            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-xl bg-[#1447E6]/10 p-3 text-[#1447E6] text-3xl">
              {step.icon}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-4 text-center">
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-gray-300 text-center leading-relaxed">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


  );
};

export default HowItWorks;
