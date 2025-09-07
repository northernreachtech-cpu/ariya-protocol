import { motion } from "framer-motion";

const FloatingElements = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Lightweight Background */}
      <div className="absolute inset-0 bg-gradient-to-br dark:from-slate-900 dark:via-slate-800/20 dark:to-slate-900 from-slate-50 via-slate-100/20 to-slate-50">
        <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Simple gradients */}
            <radialGradient id="node1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#264653" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F4A896" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="node2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F4A896" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#C48E88" stopOpacity="0.05" />
            </radialGradient>
          </defs>
          
          {/* Only 3 static nodes for minimal performance impact */}
          <circle cx="300" cy="200" r="6" fill="url(#node1)" opacity="0.4" />
          <circle cx="1200" cy="300" r="8" fill="url(#node2)" opacity="0.3" />
          <circle cx="800" cy="600" r="5" fill="url(#node1)" opacity="0.2" />
          
          {/* Only 2 subtle animated elements */}
          <motion.circle
            cx="600" cy="400" r="3"
            fill="#F4A896"
            opacity="0.4"
            animate={{ 
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="1000" cy="500" r="2"
            fill="#264653"
            opacity="0.3"
            animate={{ 
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.3, 1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </svg>
      </div>
    </div>
  );
};

export default FloatingElements;
