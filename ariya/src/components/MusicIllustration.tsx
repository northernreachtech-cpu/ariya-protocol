import { motion } from "framer-motion";

const MusicIllustration = () => {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      {/* Background Music Notes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/20 text-4xl"
            initial={{
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: Math.random() * 200 - 100,
              y: Math.random() * 200 - 100,
              opacity: [0, 0.3, 0],
              scale: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
          >
            {["♪", "♫", "♬", "♩", "♭", "♯", "♮", "♯"][i % 8]}
          </motion.div>
        ))}
      </div>

      {/* Main Drum */}
      <motion.div
        className="relative z-10"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <motion.div
          className="w-32 h-32 rounded-full bg-gradient-to-br from-secondary via-accent to-primary border-4 border-foreground/20 relative"
          animate={{
            boxShadow: [
              "0 0 20px rgba(196, 142, 136, 0.3)",
              "0 0 40px rgba(196, 142, 136, 0.6)",
              "0 0 20px rgba(196, 142, 136, 0.3)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Drum Beater */}
          <motion.div
            className="absolute -top-8 -right-4 w-4 h-16 bg-foreground/80 rounded-full origin-bottom"
            animate={{ rotate: [0, 15, 0, -15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute -top-2 -left-1 w-6 h-6 bg-accent rounded-full" />
          </motion.div>

          {/* Drum Pattern */}
          <div className="absolute inset-4 rounded-full border-2 border-foreground/30" />
          <div className="absolute inset-8 rounded-full border border-foreground/20" />
        </motion.div>
      </motion.div>

      {/* Guitar */}
      <motion.div
        className="absolute top-8 left-8 z-20"
        initial={{ x: -100, opacity: 0, rotate: -45 }}
        animate={{ x: 0, opacity: 1, rotate: -15 }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="w-24 h-32 bg-gradient-to-br from-primary/80 to-secondary/80 rounded-lg relative"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Guitar Neck */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-2 h-12 bg-foreground/60 rounded-full" />
          {/* Guitar Strings */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-2 right-2 h-px bg-foreground/40"
              style={{ top: `${8 + i * 4}px` }}
              animate={{ scaleX: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Flute */}
      <motion.div
        className="absolute bottom-12 right-12 z-20"
        initial={{ x: 100, opacity: 0, rotate: 45 }}
        animate={{ x: 0, opacity: 1, rotate: 15 }}
        transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className="w-32 h-4 bg-gradient-to-r from-accent/80 to-primary/80 rounded-full relative"
          animate={{ y: [0, 3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Flute Holes */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-foreground/60 rounded-full"
              style={{ left: `${8 + i * 16}px`, top: "1px" }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Tambourine */}
      <motion.div
        className="absolute top-16 right-8 z-20"
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
      >
        <motion.div
          className="w-20 h-20 rounded-full bg-gradient-to-br from-success/80 to-accent/80 border-2 border-foreground/30 relative"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          {/* Tambourine Jingles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-foreground/50 rounded-full"
              style={{
                left: `${50 + 35 * Math.cos((i * 30 * Math.PI) / 180)}%`,
                top: `${50 + 35 * Math.sin((i * 30 * Math.PI) / 180)}%`,
              }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Maracas */}
      <motion.div
        className="absolute bottom-8 left-16 z-20"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
      >
        <motion.div
          className="flex space-x-2"
          animate={{ rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-6 h-16 bg-gradient-to-b from-secondary/80 to-primary/80 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="w-6 h-16 bg-gradient-to-b from-accent/80 to-secondary/80 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
          />
        </motion.div>
      </motion.div>

      {/* Piano Keys */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 1.5, ease: "easeOut" }}
      >
        <div className="flex">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-4 h-12 bg-foreground/90 rounded-sm mx-px"
              animate={{ scaleY: [1, 0.8, 1] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.1 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Sound Waves */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 border border-primary/20 rounded-full"
            style={{ margin: `${i * 20}px` }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-accent rounded-full"
          initial={{
            x: Math.random() * 300 - 150,
            y: Math.random() * 300 - 150,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
            opacity: [0, 0.8, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default MusicIllustration;
