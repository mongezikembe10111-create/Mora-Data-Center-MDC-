"use client";
import { useEffect, useRef } from "react";
import type { EChartsOption } from "echarts";
export default function AnalyticsChart({
  option,
  label,
  height = 290,
}: {
  option: EChartsOption;
  label: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    let chart: import("echarts").ECharts | undefined;
    const render = () =>
      import("@/lib/chart-engine").then((echarts) => {
        if (disposed || !ref.current) return;
        chart = echarts.init(ref.current, undefined, { renderer: "svg" });
        chart.setOption({
          backgroundColor: "transparent",
          animation: !window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
          textStyle: {
            fontFamily: getComputedStyle(ref.current).fontFamily,
            color: "#94A3B8",
          },
          ...option,
        });
        resize = new ResizeObserver(() => chart?.resize());
        resize.observe(ref.current);
      });
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        visibility.disconnect();
        void render();
      },
      { rootMargin: "150px" },
    );
    if (ref.current) visibility.observe(ref.current);
    return () => {
      disposed = true;
      visibility.disconnect();
      resize?.disconnect();
      chart?.dispose();
    };
  }, [option]);
  return (
    <div
      ref={ref}
      className="chart-space"
      style={{ height }}
      role="img"
      aria-label={label}
    />
  );
}
