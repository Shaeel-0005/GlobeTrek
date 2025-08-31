import { FaUserPlus, FaCamera, FaMapMarkedAlt } from "react-icons/fa";

const steps = [
  {
    number: "01",
    title: "Sign Up",
    description: "Create your account in seconds and join our travel community.",
    icon: <FaUserPlus size={40} />,
  },
  {
    number: "02",
    title: "Add Memories",
    description: "Upload photos, stories, and experiences from your trips.",
    icon: <FaCamera size={40} />,
  },
  {
    number: "03",
    title: "Visualize Map",
    description: "See all your travels plotted on a beautiful interactive map.",
    icon: <FaMapMarkedAlt size={40} />,
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-[#020F13]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Three simple steps to start sharing and visualizing your travels
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-10 lg:gap-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-gradient-to-br from-[#111820] to-[#1C2730] rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-transform transform hover:-translate-y-3 border border-[#1447E6]/20"
            >
              {/* Step Number */}
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#1447E6] text-white font-bold rounded-full mb-6 shadow-lg">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-[#1447E6]/10 text-[#1447E6] text-4xl">
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
