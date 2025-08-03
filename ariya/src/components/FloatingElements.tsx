import { motion } from "framer-motion";
import tradpiano from "../assets/tradpiano.png";
import sekere from "../assets/sekere.png";
import gangan from "../assets/gangan.png";
import djembe from "../assets/djembe.png";

interface FloatingElement {
  id: number;
  x: number;
  y: number;
  type: "tradpiano" | "sekere" | "gangan" | "djembe";
  size: number;
  duration: number;
  delay: number;
  movement: "float" | "swim" | "orbit" | "pulse";
  opacity: number;
}

const FloatingElements = () => {
  const elements: FloatingElement[] = [
    {
      id: 1,
      x: 10,
      y: 20,
      type: "djembe",
      size: 80,
      duration: 6,
      delay: 0,
      movement: "float",
      opacity: 0.3,
    },
    {
      id: 2,
      x: 85,
      y: 15,
      type: "gangan",
      size: 100,
      duration: 8,
      delay: 2,
      movement: "swim",
      opacity: 0.25,
    },
    {
      id: 3,
      x: 70,
      y: 80,
      type: "sekere",
      size: 70,
      duration: 7,
      delay: 1,
      movement: "orbit",
      opacity: 0.2,
    },
    {
      id: 4,
      x: 20,
      y: 70,
      type: "tradpiano",
      size: 90,
      duration: 9,
      delay: 3,
      movement: "float",
      opacity: 0.3,
    },
    {
      id: 5,
      x: 90,
      y: 60,
      type: "djembe",
      size: 60,
      duration: 5,
      delay: 0.5,
      movement: "pulse",
      opacity: 0.25,
    },
    {
      id: 6,
      x: 50,
      y: 10,
      type: "gangan",
      size: 100,
      duration: 10,
      delay: 1.5,
      movement: "swim",
      opacity: 0.2,
    },
    {
      id: 7,
      x: 15,
      y: 40,
      type: "sekere",
      size: 80,
      duration: 7,
      delay: 2.5,
      movement: "orbit",
      opacity: 0.3,
    },
    {
      id: 8,
      x: 80,
      y: 30,
      type: "tradpiano",
      size: 110,
      duration: 8,
      delay: 1,
      movement: "float",
      opacity: 0.25,
    },
  ];

  const getAnimationProps = (element: FloatingElement) => {
    const baseProps = {
      animate: {},
      transition: {
        duration: element.duration,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: element.delay,
      },
    };

    switch (element.movement) {
      case "float":
        baseProps.animate = {
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        };
        break;
      case "swim":
        baseProps.animate = {
          y: [0, -15, -10, -20, 0],
          x: [0, 10, -5, 15, 0],
          rotate: [0, 90, 180, 270, 360],
        };
        break;
      case "orbit":
        baseProps.animate = {
          y: [0, -25, 0, 25, 0],
          x: [0, 25, 0, -25, 0],
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.1, 1, 0.9, 1],
        };
        break;
      case "pulse":
        baseProps.animate = {
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [element.opacity, element.opacity * 1.5, element.opacity],
        };
        break;
    }

    return baseProps;
  };

  const getImageSrc = (type: string) => {
    switch (type) {
      case "tradpiano":
        return tradpiano;
      case "sekere":
        return sekere;
      case "gangan":
        return gangan;
      case "djembe":
        return djembe;
      default:
        return tradpiano;
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
          }}
          {...getAnimationProps(element)}
        >
          <img
            src={getImageSrc(element.type)}
            alt={element.type}
            className="object-contain"
            style={{
              width: element.size,
              height: element.size,
              opacity: element.opacity,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default FloatingElements;
