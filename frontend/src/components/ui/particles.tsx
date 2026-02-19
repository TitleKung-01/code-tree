"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: 60,
      particles: {
        number: {
          value: 60,
          density: { enable: true, width: 1920, height: 1080 },
        },
        color: { value: ["#22c55e", "#10b981", "#059669", "#34d399"] },
        shape: { type: "circle" },
        opacity: {
          value: { min: 0.15, max: 0.5 },
          animation: {
            enable: true,
            speed: 0.8,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 3 },
          animation: {
            enable: true,
            speed: 1.5,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: { min: 0.3, max: 1 },
          direction: "none",
          outModes: { default: "out" },
          random: true,
        },
        links: {
          enable: true,
          distance: 130,
          color: "#22c55e",
          opacity: 0.12,
          width: 1,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          grab: { distance: 160, links: { opacity: 0.3 } },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (!init) return null;

  return (
    <Particles
      className="fixed inset-0 z-0"
      options={options}
    />
  );
}
