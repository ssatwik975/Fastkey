"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/ContainerScroll";
import { TextGenerateEffect } from "@/components/ui/TextGenerateEffect";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { Button } from "@/components/ui/MovingBorder";
import AuthWidget from "@/components/landing/AuthWidget";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <div className="text-3xl md:text-7xl font-bold dark:text-white text-center">
          Authentication <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500">
            Reimagined
          </span>
        </div>
        <div className="font-extralight text-base md:text-4xl dark:text-neutral-200 py-4">
           Secure, private, and fast biometric authentication.
        </div>
        
        <Button
            borderRadius="1.75rem"
            className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800 font-semibold"
        >
            Get Started
        </Button>

        <div className="w-full h-full mt-10">
            <ContainerScroll
                titleComponent={
                    <div className="flex items-center justify-center flex-col">
                        <h1 className="text-5xl md:text-8xl font-bold text-black dark:text-white mb-4">
                            Try it out <br />
                            <span className="text-2xl md:text-[6rem] font-bold mt-1 leading-none text-blue-500">
                                Live Demo
                            </span>
                        </h1>
                    </div>
                }
            >
                <div className="h-full w-full bg-[#0F172A] flex items-center justify-center p-4 md:p-10 rounded-2xl overflow-hidden">
                    <AuthWidget />
                </div>
            </ContainerScroll>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
