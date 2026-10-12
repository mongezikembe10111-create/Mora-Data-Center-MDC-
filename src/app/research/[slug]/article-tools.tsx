"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export default function ArticleTools({
  title,
  highlight,
}: {
  title: string;
  highlight: string;
}) {
  const [status, setStatus] = useState("");

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard.");
    } catch {
      setStatus(
        "Clipboard access is unavailable. Copy this page’s address from your browser.",
      );
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: highlight,
          url: window.location.href,
        });
        setStatus("Share dialog opened.");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setStatus("Sharing is unavailable. Use Copy link instead.");
      }
    } else await copy(window.location.href);
  }

  return (
    <div style={{ margin: "26px 0" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="button" type="button" onClick={share}>
          <Share2 size={15} aria-hidden="true" />
          Share article
        </button>
        <button
          className="button"
          type="button"
          onClick={() => copy(window.location.href)}
        >
          <Copy size={15} aria-hidden="true" />
          Copy link
        </button>
        <button
          className="button"
          type="button"
          onClick={() =>
            copy(`${highlight}\n— The Public Square, ${title}\n${window.location.href}`)
          }
        >
          <Copy size={15} aria-hidden="true" />
          Copy insight
        </button>
      </div>
      <p
        role="status"
        className="muted"
        style={{ minHeight: 20, fontSize: 12, marginTop: 8 }}
      >
        {status && (
          <>
            <Check
              size={12}
              aria-hidden="true"
              style={{ display: "inline", marginRight: 6 }}
            />
            {status}
          </>
        )}
      </p>
    </div>
  );
}
