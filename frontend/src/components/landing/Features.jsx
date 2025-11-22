"use client";
import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/BentoGrid";
import { TracingBeam } from "@/components/ui/TracingBeam";
import { Shield, Fingerprint, Lock, Globe, Zap, Smartphone } from 'lucide-react';
import { 
    GlowingShield, 
    BiometricScan, 
    ZeroKnowledgeLock, 
    SpeedMeter, 
    PlatformGlobe, 
    MobileMock 
} from "@/components/landing/GridGraphics";

export default function Features() {
  return (
    <section id="features" className="py-20 relative z-10 bg-slate-950">
        <TracingBeam className="px-6">
            <div className="max-w-4xl mx-auto text-center mb-20 pt-10">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                    Security Reimagined
                </h2>
                <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                    FastKey combines enterprise-grade security with consumer-grade user experience.
                </p>
            </div>
            <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
                {items.map((item, i) => (
                <BentoGridItem
                    key={i}
                    title={item.title}
                    description={item.description}
                    header={item.header}
                    className={i === 3 || i === 6 ? "md:col-span-2" : ""}
                    icon={item.icon} />
                ))}
            </BentoGrid>
        </TracingBeam>
    </section>
  );
}

const items = [
  {
    title: "FIDO2 Certified",
    description: "Built on the latest WebAuthn standards for maximum compatibility.",
    header: <GlowingShield />,
    icon: <Shield className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Biometric First",
    description: "Use FaceID, TouchID, or Windows Hello.",
    header: <BiometricScan />,
    icon: <Fingerprint className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Zero Knowledge",
    description: "Your biometric data never leaves your device.",
    header: <ZeroKnowledgeLock />,
    icon: <Lock className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Cross Platform",
    description:
      "Works seamlessly across iOS, Android, Windows, macOS, and Linux.",
    header: <PlatformGlobe />,
    icon: <Globe className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Lightning Fast",
    description: "Authentication in milliseconds. No more waiting.",
    header: <SpeedMeter />,
    icon: <Zap className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Mobile Integration",
    description: "Use your phone as a security key for any device.",
    header: <MobileMock />,
    icon: <Smartphone className="h-4 w-4 text-neutral-500" />,
  },
];
