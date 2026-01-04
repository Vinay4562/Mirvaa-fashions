import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export default function IntroSplash({ onFinish }) {
  const [closing, setClosing] = useState(false);
  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    const total = reduceMotion ? 600 : 2400;
    const fadeBefore = reduceMotion ? 300 : 1900;
    const t1 = setTimeout(() => setClosing(true), fadeBefore);
    const t2 = setTimeout(() => onFinish?.(), total);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduceMotion, onFinish]);

  const handleSkip = () => {
    try {
      sessionStorage.setItem("mirvaa_skip_intro", "1");
    } catch {}
    setClosing(true);
    setTimeout(() => onFinish?.(), reduceMotion ? 150 : 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-gradient-to-br from-black via-neutral-900 to-black ${closing ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.06)_0%,_rgba(0,0,0,0.1)_50%,_rgba(0,0,0,0.6)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.05),_rgba(0,0,0,0.15))]" />
      </div>

      <div className="relative px-6 text-center">
        <h1 className="text-white tracking-wide font-bold animate-fade-in"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <span className="block text-4xl sm:text-5xl md:text-6xl gradient-text">Mirvaa Fashions</span>
        </h1>
        <p className="mt-3 text-sm sm:text-base md:text-lg text-neutral-300 animate-fade-in"
           style={{ animationDelay: "120ms", animationFillMode: "backwards" }}>
          Elevate everyday style with premium designs and comfort
        </p>

        <div className="mx-auto mt-8 h-px w-24 sm:w-32 bg-gradient-to-r from-transparent via-neutral-400 to-transparent animate-fade-in"
             style={{ animationDelay: "220ms", animationFillMode: "backwards" }} />
      </div>

      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-neutral-300 hover:text-white hover:bg-neutral-800/40"
          onClick={handleSkip}
          aria-label="Skip intro"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
