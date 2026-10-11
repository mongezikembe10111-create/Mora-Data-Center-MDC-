"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "@/lib/chart-engine";
import type { ECharts, EChartsOption } from "echarts";

type ElectionChartProps = {
  option: EChartsOption;
  title: string;
  filename?: string;
  sourceNote: string;
  definition?: string;
  height?: number;
  unavailable?: boolean;
  emptyMessage?: string;
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wrapText(text: string, limit: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && line.length + word.length > limit) {
      lines.push(line);
      line = word;
    } else line += `${line ? " " : ""}${word}`;
  }
  if (line) lines.push(line);
  return lines;
}

/** Exports include the chart title, definitions and source information. */
export default function ElectionChart({
  option,
  title,
  filename = "mora-chart",
  sourceNote,
  definition,
  height = 350,
  unavailable = false,
  emptyMessage,
}: ElectionChartProps) {
  const element = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const chart = useRef<ECharts | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (unavailable || !element.current) return;
    const instance = echarts.init(element.current, undefined, {
      renderer: "svg",
    });
    chart.current = instance;
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      instance.dispose();
      chart.current = null;
    };
  }, [unavailable]);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    chart.current?.setOption(
      { ...option, animation: !reducedMotion, aria: { enabled: true } },
      { notMerge: true },
    );
  }, [option, unavailable]);

  useEffect(() => {
    if (!expanded) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    frame.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "Tab") {
        const focusable = frame.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [expanded]);

  function exportSvg() {
    const instance = chart.current;
    if (!instance) return null;
    const width = instance.getWidth();
    const originalHeight = instance.getHeight();
    const lines = [
      title,
      ...(definition
        ? wrapText(
            `Definition: ${definition}`,
            Math.max(40, Math.floor(width / 7)),
          )
        : []),
      ...wrapText(sourceNote, Math.max(40, Math.floor(width / 7))),
    ];
    const fullHeight = originalHeight + lines.length * 19 + 32;
    const doc = new DOMParser().parseFromString(
      instance.renderToSVGString(),
      "image/svg+xml",
    );
    const svg = doc.documentElement;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(fullHeight));
    svg.setAttribute("viewBox", `0 0 ${width} ${fullHeight}`);
    const background = doc.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    background.setAttribute("width", String(width));
    background.setAttribute("height", String(fullHeight));
    background.setAttribute("fill", "#101827");
    svg.insertBefore(background, svg.firstChild);
    lines.forEach((line, index) => {
      const text = doc.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", "16");
      text.setAttribute("y", String(originalHeight + 22 + index * 19));
      text.setAttribute("fill", index === 0 ? "#F5F7FB" : "#94A3B8");
      text.setAttribute("font-family", "Arial, sans-serif");
      text.setAttribute("font-size", index === 0 ? "13" : "11");
      text.textContent = line;
      svg.appendChild(text);
    });
    return {
      blob: new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml;charset=utf-8",
      }),
      width,
      height: fullHeight,
    };
  }

  async function exportImage(format: "svg" | "png") {
    const output = exportSvg();
    if (!output) return;
    if (format === "svg") {
      downloadBlob(output.blob, `${filename}.svg`);
      setFeedback("SVG downloaded with source information.");
      return;
    }
    const objectUrl = URL.createObjectURL(output.blob);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image export failed"));
        image.src = objectUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = output.width * 2;
      canvas.height = output.height * 2;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.scale(2, 2);
      context.drawImage(image, 0, 0, output.width, output.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("Image export failed")),
          "image/png",
        ),
      );
      downloadBlob(blob, `${filename}.png`);
      setFeedback("PNG downloaded with source information.");
    } catch {
      setFeedback(
        "PNG export is unavailable in this browser. Download the SVG instead.",
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  return (
    <div
      ref={frame}
      className="election-chart"
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? `${title}, expanded chart` : undefined}
      style={
        expanded
          ? {
              position: "fixed",
              inset: 16,
              zIndex: 100,
              background: "var(--surface, #101827)",
              border: "1px solid var(--border, #29374C)",
              borderRadius: 16,
              padding: 24,
              overflow: "auto",
              boxShadow: "0 0 0 100vmax #080d16dd",
            }
          : undefined
      }
    >
      <div
        className="toolbar"
        style={{ justifyContent: "flex-end", marginBottom: 10 }}
      >
        <button
          type="button"
          className="button button-secondary"
          disabled={unavailable}
          onClick={() => void exportImage("svg")}
          aria-label={`Download ${title} as SVG`}
        >
          SVG ↓
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={unavailable}
          onClick={() => void exportImage("png")}
          aria-label={`Download ${title} as PNG`}
        >
          PNG ↓
        </button>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Close expanded chart" : `Expand ${title}`}
          aria-expanded={expanded}
        >
          {expanded ? "Close ×" : "Expand ↗"}
        </button>
      </div>
      {/* ECharts owns the host's descendants. Keep that host separate and stable
          so disposal can never remove React's empty-state children. */}
      <div
        key="chart-host"
        ref={element}
        hidden={unavailable}
        role="img"
        aria-label={`${title}. Values are provided in the underlying data table.`}
        style={{
          display: unavailable ? "none" : "block",
          width: "100%",
          height: expanded ? "min(68vh, 650px)" : height,
        }}
      />
      <div
        key="chart-empty-state"
        hidden={!unavailable}
        className="empty-state"
        style={{
          minHeight: height,
          display: unavailable ? "grid" : "none",
          placeContent: "center",
          textAlign: "center",
          padding: 24,
        }}
      >
        <p className="eyebrow">Data availability</p>
        <h3>Official comparable data unavailable</h3>
        <p className="muted">
          {emptyMessage ||
            "No verified observations match these filters. Change the metric or reset the filters."}
        </p>
      </div>
      <p
        className="chart-source muted"
        style={{ fontSize: 11, lineHeight: 1.65, margin: "12px 0 0" }}
      >
        {sourceNote}
      </p>
      <span
        role="status"
        aria-live="polite"
        className="muted"
        style={{ fontSize: 12 }}
      >
        {feedback}
      </span>
    </div>
  );
}
