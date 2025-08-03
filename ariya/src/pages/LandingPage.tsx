import { motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Calendar, Users, Shield, Award, QrCode, Coins } from "lucide-react";
import Button from "../components/Button";
import Card from "../components/Card";
import FloatingElements from "../components/FloatingElements";
import heroImage from "../assets/hero-image.png";
import useScrollToTop from "../hooks/useScrollToTop";

const LandingPage = () => {
  useScrollToTop();

  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Create Events",
      description:
        "Set up decentralized events with wallet-based check-ins and NFT rewards.",
    },
    {
      icon: <QrCode className="h-8 w-8 text-secondary" />,
      title: "QR Check-ins",
      description:
        "Seamless attendance tracking with QR codes and blockchain verification.",
    },
    {
      icon: <Shield className="h-8 w-8 text-accent" />,
      title: "Anonymous Identity",
      description:
        "Maintain privacy while building your on-chain event reputation.",
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "NFT Completion",
      description: "Mint proof-of-attendance NFTs for completed events.",
    },
    {
      icon: <Users className="h-8 w-8 text-secondary" />,
      title: "Convener Discovery",
      description: "Find trusted event organizers with on-chain reputation.",
    },
    {
      icon: <Coins className="h-8 w-8 text-accent" />,
      title: "Sponsor Dashboard",
      description:
        "Track KPIs and manage event sponsorships with escrow protection.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Connect Wallet",
      description:
        "Link your Web3 wallet to get started with decentralized events.",
    },
    {
      step: "02",
      title: "Create or Join",
      description: "Create your own event or discover events in your area.",
    },
    {
      step: "03",
      title: "Check-in & Participate",
      description:
        "Use QR codes for seamless check-ins and event participation.",
    },
    {
      step: "04",
      title: "Earn NFT Rewards",
      description:
        "Complete events to mint exclusive NFTs and build your reputation.",
    },
  ];

  // 3D Card Component with Mouse Tracking
  const Card3D = ({ feature, index }: { feature: any; index: number }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [30, -30]);
    const rotateY = useTransform(x, [-100, 100], [-30, 30]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = event.clientX - centerX;
      const mouseY = event.clientY - centerY;

      x.set(mouseX);
      y.set(mouseY);
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: -15 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        viewport={{ once: true }}
        whileHover={{
          scale: 1.05,
          z: 50,
          transition: { duration: 0.3 },
        }}
        className="flex perspective-1000"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div style={{ rotateX, rotateY }} className="w-full">
          <Card
            hover
            className="text-center h-full p-6 sm:p-8 flex-1 transform-gpu transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 group relative overflow-hidden"
          >
            {/* 3D Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>

            {/* Animated Border */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary via-secondary to-accent p-[1px]">
                <div className="absolute inset-0 rounded-lg bg-background"></div>
              </div>
            </div>

            <motion.div
              className="mb-6 flex justify-center relative z-10"
              whileHover={{
                scale: 1.1,
                rotateY: 10,
                transition: { duration: 0.3 },
              }}
            >
              <div className="p-3 rounded-xl bg-card-secondary group-hover:bg-gradient-to-br group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300 transform-gpu relative overflow-hidden">
                {/* Icon Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-sm"></div>

                <motion.div
                  className="relative z-10"
                  whileHover={{
                    rotate: 360,
                    transition: { duration: 0.6, ease: "easeInOut" },
                  }}
                  animate={{
                    y: [0, -5, 0],
                    transition: {
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.2,
                    },
                  }}
                >
                  {feature.icon}
                </motion.div>
              </div>
            </motion.div>

            <motion.h3
              className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 text-foreground relative z-10"
              whileHover={{
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
            >
              {feature.title}
            </motion.h3>

            <motion.p
              className="text-foreground-muted text-sm sm:text-base lg:text-lg leading-relaxed relative z-10"
              whileHover={{
                color: "hsl(var(--foreground))",
                transition: { duration: 0.3 },
              }}
            >
              {feature.description}
            </motion.p>

            {/* Floating Particles */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-primary rounded-full"
                  initial={{
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    opacity: 0,
                  }}
                  animate={{
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    },
                  }}
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Floating Background Elements */}
      <FloatingElements />

      {/* Hero Section - Flex layout with content left and illustration right */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex-1 text-center lg:text-left"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-livvic font-bold mb-4 sm:mb-6 leading-tight">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent text-transparent bg-clip-text">
                    Decentralized
                  </span>
                  <br />
                  <span className="text-foreground">Event Protocol</span>
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-foreground-secondary mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Create, manage, and attend events with blockchain-powered
                  check-ins, anonymous identity management, and NFT
                  proof-of-attendance.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start px-4 lg:px-0 max-w-lg mx-auto lg:mx-0">
                  <Link to="/event/create" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Calendar className="mr-2 h-5 w-5" />
                      Create Event
                    </Button>
                  </Link>
                  <Link to="/events" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Browse Events
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Right Illustration */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex-1 w-full max-w-md mx-auto lg:mx-0 flex justify-center lg:justify-end"
              >
                <img
                  src={heroImage}
                  alt="Hero Illustration"
                  className="w-3/4 lg:w-2/3 h-auto transform scale-x-[-1]"
                  style={{
                    filter: "drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))",
                  }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Better desktop grid layout */}
      <section className="py-12 sm:py-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-livvic font-bold mb-3 sm:mb-4 text-foreground">
                Powerful Features
              </h2>
              <p className="text-foreground-secondary text-base sm:text-lg lg:text-xl max-w-3xl mx-auto px-4 leading-relaxed">
                Everything you need to create, manage, and participate in
                decentralized events
              </p>
            </motion.div>

            {/* Improved grid layout for better desktop appearance */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <Card3D key={feature.title} feature={feature} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Better desktop step layout */}
      <section className="py-12 sm:py-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-livvic font-bold mb-3 sm:mb-4 text-foreground">
                How It Works
              </h2>
              <p className="text-foreground-secondary text-base sm:text-lg lg:text-xl max-w-3xl mx-auto px-4 leading-relaxed">
                Get started with decentralized events in four simple steps
              </p>
            </motion.div>

            {/* Improved layout for desktop - single row with better spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="text-center flex flex-col"
                >
                  <div className="mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                      {step.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3 text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-foreground-muted text-sm sm:text-base lg:text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Better desktop centering and spacing */}
      <section className="py-12 sm:py-20 relative z-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 sm:p-12 lg:p-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-livvic font-bold mb-4 sm:mb-6 text-foreground">
                  Ready to Get Started?
                </h2>
                <p className="text-foreground-secondary text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join the future of event management with blockchain technology
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-lg mx-auto">
                  <Link to="/event/create" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/events" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Explore Events
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer - Better desktop layout */}
      <footer className="py-12 sm:py-16 border-t border-border relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
              <div className="text-center md:text-left">
                <h3 className="text-xl sm:text-2xl font-livvic font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                  Ariya
                </h3>
                <p className="text-foreground-muted text-sm sm:text-base mt-1">
                  Decentralized Event Management
                </p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-6 sm:gap-8 text-sm sm:text-base text-foreground-muted">
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Docs
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
