"use client";

import { useEffect } from "react";

/** Small progressive enhancements; content remains visible without JavaScript. */
export default function SiteExperience() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const sections = document.querySelectorAll<HTMLElement>(".square-section");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("square-in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px 70px 0px", threshold: 0.03 },
    );
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top > window.innerHeight) {
        section.classList.add("square-motion-ready");
        observer.observe(section);
      }
    });
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height =
          document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty(
          "--square-scroll-progress",
          String(height > 0 ? window.scrollY / height : 0),
        );
      });
    };
    const hero = document.querySelector<HTMLElement>(".square-hero");
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !hero) return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty(
        "--hero-x",
        `${((event.clientX - rect.left) / rect.width - 0.5) * 14}px`,
      );
      hero.style.setProperty(
        "--hero-y",
        `${((event.clientY - rect.top) / rect.height - 0.5) * 14}px`,
      );
    };
    const reset = () => {
      hero?.style.setProperty("--hero-x", "0px");
      hero?.style.setProperty("--hero-y", "0px");
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    hero?.addEventListener("pointermove", move, { passive: true });
    hero?.addEventListener("pointerleave", reset);
    updateProgress();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
      hero?.removeEventListener("pointermove", move);
      hero?.removeEventListener("pointerleave", reset);
      sections.forEach((section) =>
        section.classList.remove("square-motion-ready", "square-in-view"),
      );
      document.documentElement.style.removeProperty("--square-scroll-progress");
    };
  }, []);
  return <div className="square-scroll-progress" aria-hidden="true" />;
}
