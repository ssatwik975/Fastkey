"use client";
import React from "react";
import { motion } from "framer-motion";

export const SparklesCore = ({
  id,
  background,
  minSize,
  maxSize,
  particleDensity,
  className,
  particleColor,
}) => {
  const [init, setInit] = React.useState(false);
  React.useEffect(() => {
    setInit(true);
  }, []);
  const particlesLoaded = (container) => {
    console.log(container);
  };

  return (
    (<motion.div
      animate={{
        opacity: 1,
      }}
      initial={{
        opacity: 0,
      }}
      className={className}>
      {/* Placeholder for sparkles if we were using tsparticles, but for now we will use a simple CSS animation or just a div to avoid heavy dependencies */}
      <div className="w-full h-full relative overflow-hidden">
        {Array.from({ length: particleDensity || 50 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              width: Math.random() * (maxSize || 3) + (minSize || 1) + "px",
              height: Math.random() * (maxSize || 3) + (minSize || 1) + "px",
              backgroundColor: particleColor || "#FFFFFF",
              animationDuration: Math.random() * 2 + 1 + "s",
              animationDelay: Math.random() * 2 + "s",
            }}
          />
        ))}
      </div>
    </motion.div>)
  );
};
