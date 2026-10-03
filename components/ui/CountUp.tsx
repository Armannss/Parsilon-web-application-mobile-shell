"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to `value` the first time it becomes visible. */
export default function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let settle: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      const start = performance.now();
      const duration = 1100;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        // ease-out
        setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };

      setShown(0);
      frame = requestAnimationFrame(tick);
      // Animation frames pause in background tabs; never leave a wrong number.
      settle = setTimeout(() => setShown(value), duration + 300);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(settle);
    };
  }, [value]);

  return (
    <span ref={ref}>
      {shown.toLocaleString("fa-IR")}
      {suffix}
    </span>
  );
}
