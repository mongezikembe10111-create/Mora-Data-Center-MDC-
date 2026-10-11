"use client";

import { useState } from "react";

type Denominator = "eligible" | "registered";

export default function ParticipationExplainer() {
  const [registered, setRegistered] = useState(70);
  const [voted, setVoted] = useState(35);
  const [denominator, setDenominator] = useState<Denominator>("eligible");
  const base = denominator === "eligible" ? 100 : registered;
  const turnout = base ? (voted / base) * 100 : 0;
  const rows = [
    { name: "Eligible citizens", count: 100, colour: "#94A3B8" },
    { name: "Registered voters", count: registered, colour: "#62A7F8" },
    { name: "Participating voters", count: voted, colour: "#B9F56A" },
  ];

  return (
    <figure className="panel research-visual" style={{ margin: "28px 0" }}>
      <figcaption>
        <p className="eyebrow">Interactive methodological example</p>
        <h3>One population. Two participation rates.</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          Hypothetical population of 100 eligible citizens. This is not South
          African election data.
        </p>
      </figcaption>
      <fieldset style={{ border: 0, padding: 0, margin: "20px 0" }}>
        <legend style={{ marginBottom: 10, fontSize: 13 }}>
          Express participation as a percentage of
        </legend>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {(["eligible", "registered"] as const).map((option) => (
            <label
              key={option}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <input
                type="radio"
                name="article-denominator"
                value={option}
                checked={denominator === option}
                onChange={() => setDenominator(option)}
              />
              {option === "eligible"
                ? "Eligible citizens"
                : "Registered voters"}
            </label>
          ))}
        </div>
      </fieldset>
      <div aria-hidden="true" style={{ display: "grid", gap: 15 }}>
        {rows.map((row) => (
          <div key={row.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              <span>{row.name}</span>
              <strong>{row.count}</strong>
            </div>
            <div style={{ background: "#080D16", borderRadius: 4, height: 14 }}>
              <div
                style={{
                  width: `${row.count}%`,
                  height: 14,
                  background: row.colour,
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 18, marginTop: 24 }}>
        <label htmlFor="article-registered" style={{ fontSize: 13 }}>
          Registered citizens: <strong>{registered}</strong>
          <input
            id="article-registered"
            type="range"
            min="1"
            max="100"
            value={registered}
            onChange={(event) => {
              const next = Number(event.target.value);
              setRegistered(next);
              setVoted((previous) => Math.min(previous, next));
            }}
            style={{
              width: "100%",
              accentColor: "#62A7F8",
              display: "block",
              marginTop: 8,
            }}
          />
        </label>
        <label htmlFor="article-voted" style={{ fontSize: 13 }}>
          Participating voters: <strong>{voted}</strong>
          <input
            id="article-voted"
            type="range"
            min="0"
            max={registered}
            value={voted}
            onChange={(event) => setVoted(Number(event.target.value))}
            style={{
              width: "100%",
              accentColor: "#B9F56A",
              display: "block",
              marginTop: 8,
            }}
          />
        </label>
      </div>
      <p role="status" style={{ fontSize: 15, marginTop: 20 }}>
        <strong
          style={{ color: "#B9F56A", fontVariantNumeric: "tabular-nums" }}
        >
          {turnout.toFixed(1)}%
        </strong>{" "}
        of{" "}
        {denominator === "eligible" ? "eligible citizens" : "registered voters"}{" "}
        participate. {voted} ÷ {base} × 100.
      </p>
      <details style={{ marginTop: 16 }}>
        <summary style={{ cursor: "pointer", fontSize: 13 }}>
          View the accessible example table
        </summary>
        <table className="data-table" style={{ width: "100%", marginTop: 12 }}>
          <caption className="muted">
            Hypothetical counts, not observed election results
          </caption>
          <thead>
            <tr>
              <th scope="col">Population</th>
              <th scope="col">Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
