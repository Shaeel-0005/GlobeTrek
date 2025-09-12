import heroImage from "../assets/hero-bg.jpg";
import {Navbar} from "../components/index";

const Hero = () => {
  // Mock traveler avatars data
  const travelers = [
    {
      id: 1,
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 2,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 3,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 4,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 5,
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    },
    {
      id: 6,
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
    },
  ];

  return (
    <>
  <Navbar/>
    <div className="relative min-h-screen flex items-center">
      
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <h1
            className="text-[12rem] md:text-[16rem] lg:text-[20rem] font-bold tracking-tight select-none pointer-events-none"
            style={{
              color: "rgba(255,255,255,0.05)", // very low fill opacity
              WebkitTextStroke: "2px rgba(255,255,255,0.5)", // visible white outline
            }}
          >
            GLOBETREK
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Hero Content */}
        <div className="text-white space-y-8">
          <div className="space-y-2">
            <p className="text-adventure-tan text-sm font-medium tracking-wider uppercase">
              Adventure Made Easy
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Book, Pack, Go
            </h1>
          </div>

          {/* Email Signup
          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <Input
              type="email"
              placeholder="Enter email address"
              className="flex-1 bg-white/90 border-white/20 text-adventure-brown placeholder:text-adventure-brown/60 focus:bg-white"
            />
            <Button variant="adventure" size="lg" className="bg-adventure-green text-primary-foreground hover:bg-adventure-green/90 shadow-adventure whitespace-nowrap">
              Sign Up
            </Button>
          </div> */}
        </div>

        {/* Right Side - Community Section */}
        <div className="bg-adventure-green/95 backdrop-blur-sm p-8 rounded-2xl text-white shadow-adventure">
          {/* Traveler Avatars */}
          <div className="flex -space-x-3 mb-6">
            {travelers.map((traveler) => (
              <img
                key={traveler.id}
                src={traveler.avatar}
                alt="Traveler"
                className="w-12 h-12 rounded-full border-3 border-white object-cover"
              />
            ))}
          </div>

          <h3 className="text-xl font-semibold mb-4">
            Join 10,000+ travelers who've discovered smarter getaways
          </h3>

          <p className="text-white/90 mb-6">
            A modern travel platform that helps solo travelers and small groups
            plan spontaneous getaways with low effort.
          </p>

          <p className="text-white/80 text-sm leading-relaxed">
            Curated itineraries, local experiences, budgeting tools, and social
            features to connect with other travelers on the go.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
