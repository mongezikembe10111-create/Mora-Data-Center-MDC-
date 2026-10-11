"use client";
import { useState } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { calculateScenario, SCENARIO_BASELINE } from "@/lib/scenarios";
import { formatNumber } from "@/lib/utils";
export default function ScenarioLab() {
  const [eligible, setEligible] = useState(10);
  const [registration, setRegistration] = useState(60);
  const [turnout, setTurnout] = useState(55);
  const [overall, setOverall] = useState(60);
  const youth = eligible * 1_000_000;
  const { registered, participants } = calculateScenario({
    eligibleYouth: youth,
    registrationRate: registration,
    youthTurnoutRate: turnout,
    overallTurnoutRate: overall,
  });
  const baseline = SCENARIO_BASELINE;
  return (
    <section className="section panel" id="scenario-lab">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            <FlaskConical
              size={12}
              style={{
                display: "inline",
                verticalAlign: "middle",
                marginRight: 7,
              }}
            />{" "}
            SCENARIO LABORATORY
          </p>
          <h2>What could participation look like?</h2>
          <p>
            Explore assumptions. These outputs are hypothetical, not forecasts.
          </p>
        </div>
        <span className="badge badge-amber">
          HYPOTHETICAL · NOT ELECTION DATA
        </span>
      </div>
      <div className="scenario-grid">
        <div>
          {[
            {
              id: "eligible-youth",
              label: "Assumed eligible youth population",
              value: eligible,
              set: setEligible,
              min: 1,
              max: 20,
              suffix: "m",
              left: "1 million",
              right: "20 million",
            },
            {
              id: "youth-registration",
              label: "Assumed youth registration rate",
              value: registration,
              set: setRegistration,
              min: 0,
              max: 100,
              suffix: "%",
              left: "0%",
              right: "100%",
            },
            {
              id: "youth-turnout",
              label: "Assumed turnout of registered youth",
              value: turnout,
              set: setTurnout,
              min: 0,
              max: 100,
              suffix: "%",
              left: "0%",
              right: "100%",
            },
            {
              id: "overall-turnout",
              label: "Comparison overall turnout assumption",
              value: overall,
              set: setOverall,
              min: 0,
              max: 100,
              suffix: "%",
              left: "0%",
              right: "100%",
            },
          ].map((r) => (
            <div className="range-field" key={r.id}>
              <label htmlFor={r.id}>
                {r.label}
                <strong>
                  {r.value}
                  {r.suffix}
                </strong>
              </label>
              <input
                id={r.id}
                type="range"
                min={r.min}
                max={r.max}
                value={r.value}
                onChange={(e) => r.set(Number(e.target.value))}
              />
              <div className="range-labels">
                <span>{r.left}</span>
                <span>{r.right}</span>
              </div>
            </div>
          ))}
          <button
            className="button button-outline button-sm"
            onClick={() => {
              setEligible(10);
              setRegistration(60);
              setTurnout(55);
              setOverall(60);
            }}
          >
            <RotateCcw size={13} /> Reset assumptions
          </button>
        </div>
        <div className="scenario-output" aria-live="polite">
          <p className="eyebrow">HYPOTHETICAL YOUTH PARTICIPANTS</p>
          <div className="metric-number">{formatNumber(participants)}</div>
          <p>
            {registration}% registered × {turnout}% turnout × {eligible}m
            assumed eligible youth.
          </p>
          <div className="scenario-stats">
            <div>
              <strong>{formatNumber(registered, true)}</strong>
              <span>Hypothetically registered</span>
            </div>
            <div>
              <strong>
                {participants >= baseline ? "+" : ""}
                {formatNumber(participants - baseline, true)}
              </strong>
              <span>Change from illustrative baseline</span>
            </div>
            <div>
              <strong>{((registration * turnout) / 100).toFixed(1)}%</strong>
              <span>Of assumed eligible youth</span>
            </div>
            <div>
              <strong>
                {formatNumber(Math.round((registered * overall) / 100), true)}
              </strong>
              <span>At comparison turnout assumption</span>
            </div>
          </div>
          <div className="data-notice">
            The 10m population, 60% registration, and 55% turnout baseline are
            illustrative inputs, not measured South African statistics. No
            older-population denominator is assumed.
          </div>
        </div>
      </div>
    </section>
  );
}
