"use client";
import React from "react";
import { motion } from "framer-motion";
import { Shield, Fingerprint, Lock, Globe, Zap, Smartphone, Check } from 'lucide-react';

export const GlowingShield = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all duration-500" />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10"
      >
        <Shield className="w-16 h-16 text-blue-400" />
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
    </div>
  );
};

export const BiometricScan = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-neutral-900 items-center justify-center relative overflow-hidden">
      <Fingerprint className="w-20 h-20 text-neutral-700" />
      <motion.div
        className="absolute w-full h-2 bg-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
        animate={{
          top: ["0%", "100%", "0%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

export const ZeroKnowledgeLock = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-neutral-900 items-center justify-center relative overflow-hidden">
      <div className="relative">
        <Lock className="w-12 h-12 text-purple-400 relative z-10" />
        <motion.div
          className="absolute inset-0 bg-purple-500 blur-xl"
          animate={{
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </div>
      {/* Particles hitting the lock */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ x: -100, y: Math.random() * 100, opacity: 0 }}
          animate={{ x: "50%", opacity: [0, 1, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeIn",
          }}
          style={{ top: `${20 + Math.random() * 60}%`, left: 0 }}
        />
      ))}
    </div>
  );
};

export const SpeedMeter = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-neutral-900 items-center justify-center relative overflow-hidden">
      <Zap className="w-16 h-16 text-yellow-400" />
      <motion.div
        className="absolute inset-0 bg-yellow-500/10"
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 0.2,
          repeat: Infinity,
        }}
      />
    </div>
  );
};

export const PlatformGlobe = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-neutral-900 items-center justify-center relative overflow-hidden">
      <Globe className="w-16 h-16 text-cyan-400" />
      <motion.div
        className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"
        animate={{
          scale: [1, 1.5],
          opacity: [1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
    </div>
  );
};

export const MobileMock = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-neutral-900 items-center justify-center relative overflow-hidden">
      <div className="w-24 h-40 border-4 border-neutral-700 rounded-2xl flex items-center justify-center bg-black relative">
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-blue-500" />
            </div>
            <div className="w-12 h-2 bg-neutral-800 rounded-full" />
        </div>
        <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
        />
      </div>
    </div>
  );
};
