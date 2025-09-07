import { motion } from "framer-motion";

const FloatingElements = () => {

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Ethereal Data Flow Background */}
      <div className="absolute inset-0 bg-gradient-to-br dark:from-slate-900 dark:via-slate-800/20 dark:to-slate-900 from-slate-50 via-slate-100/20 to-slate-50">
        <svg className="w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Ethereal node gradients using brand colors */}
            <radialGradient id="etherealNode1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#264653" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#C48E88" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F4A896" stopOpacity="0.1" />
            </radialGradient>
            <radialGradient id="etherealNode2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F4A896" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#264653" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#C48E88" stopOpacity="0.05" />
            </radialGradient>
            
            {/* Flowing data line gradients using brand colors */}
            <linearGradient id="dataFlow1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#264653" stopOpacity="0.6" />
              <stop offset="30%" stopColor="#C48E88" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#F4A896" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#264653" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="dataFlow2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F4A896" stopOpacity="0.5" />
              <stop offset="30%" stopColor="#264653" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#C48E88" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F4A896" stopOpacity="0.2" />
            </linearGradient>
            
            {/* Soft glow filters */}
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="etherealGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Animated data particles */}
            <circle id="dataParticle" r="1" fill="#F4A896" opacity="0.8">
              <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
            </circle>
          </defs>
          
          {/* Ethereal Network Nodes */}
          <motion.circle
            cx="300" cy="200" r="8"
            fill="url(#etherealNode1)"
            filter="url(#etherealGlow)"
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.3, 1],
              r: [8, 12, 8]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="800" cy="150" r="6"
            fill="url(#etherealNode2)"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.2, 1],
              r: [6, 10, 6]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.circle
            cx="1200" cy="300" r="10"
            fill="url(#etherealNode1)"
            filter="url(#etherealGlow)"
            animate={{ 
              opacity: [0.4, 0.9, 0.4],
              scale: [1, 1.4, 1],
              r: [10, 15, 10]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.circle
            cx="200" cy="600" r="5"
            fill="url(#etherealNode2)"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.1, 0.6, 0.1],
              scale: [1, 1.1, 1],
              r: [5, 8, 5]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.circle
            cx="1600" cy="700" r="7"
            fill="url(#etherealNode1)"
            filter="url(#etherealGlow)"
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.3, 1],
              r: [7, 11, 7]
            }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          <motion.circle
            cx="500" cy="800" r="6"
            fill="url(#etherealNode2)"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.2, 1],
              r: [6, 9, 6]
            }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
          <motion.circle
            cx="1400" cy="500" r="8"
            fill="url(#etherealNode1)"
            filter="url(#etherealGlow)"
            animate={{ 
              opacity: [0.3, 0.9, 0.3],
              scale: [1, 1.3, 1],
              r: [8, 12, 8]
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          />
          <motion.circle
            cx="100" cy="400" r="4"
            fill="url(#etherealNode2)"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.1, 0.5, 0.1],
              scale: [1, 1.1, 1],
              r: [4, 7, 4]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
          
          {/* Floating Data Particles */}
          <motion.circle
            cx="400" cy="300" r="2"
            fill="#F4A896"
            opacity="0.6"
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
              y: [0, -20, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
          />
          <motion.circle
            cx="900" cy="400" r="1.5"
            fill="#264653"
            opacity="0.7"
            animate={{ 
              opacity: [0.3, 0.9, 0.3],
              scale: [1, 1.3, 1],
              y: [0, -15, 0]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.circle
            cx="1100" cy="600" r="2"
            fill="#C48E88"
            opacity="0.5"
            animate={{ 
              opacity: [0.1, 0.7, 0.1],
              scale: [1, 1.4, 1],
              y: [0, -25, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.circle
            cx="600" cy="700" r="1.5"
            fill="#F4A896"
            opacity="0.6"
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
              y: [0, -18, 0]
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          
          {/* Flowing Data Streams */}
          <motion.path
            d="M 300 200 Q 550 175 800 150"
            stroke="url(#dataFlow1)"
            strokeWidth="3"
            fill="none"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              strokeDasharray: ["0,1000", "1000,0", "0,1000"]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M 800 150 Q 1000 225 1200 300"
            stroke="url(#dataFlow2)"
            strokeWidth="2.5"
            fill="none"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.1, 0.7, 0.1],
              strokeDasharray: ["0,800", "800,0", "0,800"]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.path
            d="M 300 200 Q 250 400 200 600"
            stroke="url(#dataFlow1)"
            strokeWidth="2"
            fill="none"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.2, 0.6, 0.2],
              strokeDasharray: ["0,600", "600,0", "0,600"]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.path
            d="M 1200 300 Q 1400 500 1600 700"
            stroke="url(#dataFlow2)"
            strokeWidth="3"
            fill="none"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.1, 0.8, 0.1],
              strokeDasharray: ["0,1200", "1200,0", "0,1200"]
            }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
          <motion.path
            d="M 200 600 Q 350 700 500 800"
            stroke="url(#dataFlow1)"
            strokeWidth="2"
            fill="none"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.2, 0.5, 0.2],
              strokeDasharray: ["0,500", "500,0", "0,500"]
            }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.path
            d="M 500 800 Q 950 650 1400 500"
            stroke="url(#dataFlow2)"
            strokeWidth="2.5"
            fill="none"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.1, 0.7, 0.1],
              strokeDasharray: ["0,1000", "1000,0", "0,1000"]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          />
          <motion.path
            d="M 100 400 Q 200 300 300 200"
            stroke="url(#dataFlow1)"
            strokeWidth="1.5"
            fill="none"
            filter="url(#softGlow)"
            animate={{ 
              opacity: [0.1, 0.5, 0.1],
              strokeDasharray: ["0,400", "400,0", "0,400"]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
          
          {/* Subtle Connection Lines */}
          <motion.line
            x1="400" y1="300" x2="800" y2="150"
            stroke="url(#dataFlow2)"
            strokeWidth="1"
            opacity="0.3"
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
          />
          <motion.line
            x1="900" y1="400" x2="1200" y2="300"
            stroke="url(#dataFlow1)"
            strokeWidth="1"
            opacity="0.3"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2.3 }}
          />
          <motion.line
            x1="1100" y1="600" x2="1400" y2="500"
            stroke="url(#dataFlow2)"
            strokeWidth="1"
            opacity="0.3"
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
          />
          <motion.line
            x1="600" y1="700" x2="500" y2="800"
            stroke="url(#dataFlow1)"
            strokeWidth="1"
            opacity="0.3"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
          />
        </svg>
      </div>
    </div>
  );
};

export default FloatingElements;
