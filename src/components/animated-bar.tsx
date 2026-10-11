"use client";

import { useEffect, useRef } from "react";
import { useAnimate } from "motion/react-mini";

/** Native Motion animations keep the dashboard's initial JavaScript small. */
export default function AnimatedBar({
  width,
  className,
  color,
  children,
}: {
  width: string;
  className: string;
  color: string;
  children?: React.ReactNode;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const previous = useRef(width);
  useEffect(() => {
    const from = previous.current;
    previous.current = width;
    if (from === width || !scope.current) return;
    const animation = animate(
      scope.current,
      { width: [from, width] },
      {
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 0.45,
        ease: "easeOut",
      },
    );
    return () => animation.stop();
  }, [width, animate, scope]);
  return (
    <div ref={scope} className={className} style={{ width, background: color }}>
      {children}
    </div>
  );
}
