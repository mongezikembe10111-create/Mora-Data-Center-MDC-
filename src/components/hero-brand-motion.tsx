"use client";

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { publicPath } from "@/lib/public-path";

/** The logo moves independently of the text, with a persistent pause control. */
export default function HeroBrandMotion() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  return (
    <div
      className="square-brand-stage"
      data-motion={paused || reducedMotion ? "paused" : "playing"}
    >
      <div className="square-brand-art" aria-hidden="true">
        <div className="square-brand-halo" />
        <div className="square-brand-orbit">
          <i />
        </div>
        <div className="square-brand-float">
          <img
            className="square-brand-spin"
            src={publicPath("/brand/public-square-mark.svg")}
            width="128"
            height="128"
            alt=""
          />
        </div>
      </div>
      <div className="square-brand-wordmark">
        <span>The</span>
        <strong>
          Public<span className="square-brand-dot">.</span>
          <br />
          Square
        </strong>
        <span className="square-brand-caption">A SPACE TO QUESTION POWER</span>
      </div>
      <button
        type="button"
        className="square-motion-control"
        aria-label={
          reducedMotion
            ? "Logo motion is off with your reduced motion preference"
            : paused
              ? "Play logo motion"
              : "Pause logo motion"
        }
        aria-pressed={paused || reducedMotion}
        disabled={reducedMotion}
        onClick={() => setPaused((value) => !value)}
      >
        {paused || reducedMotion ? <Play size={12} /> : <Pause size={12} />}
        <span>
          {reducedMotion
            ? "Motion off"
            : paused
              ? "Play motion"
              : "Pause motion"}
        </span>
      </button>
    </div>
  );
}
