"use client";

import { useEffect, useRef, useState } from "react";

/** Load expensive visualizations when the reader approaches them. */
export default function ViewportContent({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "150px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref}>
      {visible ? (
        children
      ) : (
        <div className="loading-skeleton" style={{ minHeight: 480 }}>
          {label}
        </div>
      )}
    </div>
  );
}
