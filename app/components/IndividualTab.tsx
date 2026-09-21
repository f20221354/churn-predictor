"use client";

import { useState } from "react";
import schema from "@/public/data/schema.json";

type Schema = {
  numeric: string[];
  categorical: Record<string, string[]>;
};

const typedSchema = schema as Schema;

const NUMERIC_DEFAULTS: Record<string, number> = {
  tenure: 12,
  MonthlyCharges: 70,
  TotalCharges: 840,
};

const FIELD_LABELS: Record<string, string> = {
  gender: "Gender",
  SeniorCitizen: "Senior Citizen",
  Partner: "Has Partner",
  Dependents: "Has Dependents",
  PhoneService: "Phone Service",
  PaperlessBilling: "Paperless Billing",
  MultipleLines: "Multiple Lines",
  InternetService: "Internet Service",
  OnlineSecurity: "Online Security",
  OnlineBackup: "Online Backup",
  DeviceProtection: "Device Protection",
  TechSupport: "Tech Support",
  StreamingTV: "Streaming TV",
  StreamingMovies: "Streaming Movies",
  Contract: "Contract",
  PaymentMethod: "Payment Method",
  tenure: "Tenure (months)",
  MonthlyCharges: "Monthly Charges ($)",
  TotalCharges: "Total Charges ($)",
};

type PredictResult = {
  churnProbability: number;
  predictedChurn: number;
  riskLevel: "Low" | "Medium" | "High";
};

function buildInitialForm(): Record<string, string | number> {
  const form: Record<string, string | number> = {};
  for (const key of typedSchema.numeric) {
    form[key] = NUMERIC_DEFAULTS[key] ?? 0;
  }
  for (const [key, values] of Object.entries(typedSchema.categorical)) {
    form[key] = values[0];
  }
  return form;
}

const RISK_STYLES: Record<PredictResult["riskLevel"], string> = {
  Low: "border-[var(--status-good)] bg-[var(--status-good-bg)] text-[var(--status-good)]",
  Medium: "border-[var(--status-warning)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  High: "border-[var(--status-critical)] bg-[var(--status-critical-bg)] text-[var(--status-critical)]",
};

export default function IndividualTab() {
  const [form, setForm] = useState<Record<string, string | number>>(buildInitialForm);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(key: string, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as PredictResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:grid-cols-2"
      >
        {typedSchema.numeric.map((key) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--text-secondary)]">{FIELD_LABELS[key] ?? key}</span>
            <input
              type="number"
              value={form[key]}
              onChange={(e) => updateField(key, Number(e.target.value))}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              min={0}
              step="0.01"
            />
          </label>
        ))}

        {Object.entries(typedSchema.categorical).map(([key, values]) => (
          <label key={key} className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--text-secondary)]">{FIELD_LABELS[key] ?? key}</span>
            <select
              value={form[key]}
              onChange={(e) => updateField(key, e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              {values.map((v) => (
                <option key={v} value={v}>
                  {key === "SeniorCitizen" ? (v === "1" ? "Yes" : "No") : v}
                </option>
              ))}
            </select>
          </label>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="col-span-full mt-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Predicting…" : "Predict churn risk"}
        </button>
        {error && <p className="col-span-full text-sm text-[var(--status-critical)]">{error}</p>}
      </form>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">Prediction</h3>
        {!result && !loading && (
          <p className="text-sm text-[var(--text-muted)]">
            Fill in the customer&apos;s details and submit to see their churn risk.
          </p>
        )}
        {loading && <p className="text-sm text-[var(--text-muted)]">Scoring customer…</p>}
        {result && (
          <div className="flex flex-col gap-4">
            <div className={`rounded-lg border px-4 py-3 ${RISK_STYLES[result.riskLevel]}`}>
              <div className="text-xs font-medium uppercase tracking-wide">Risk level</div>
              <div className="text-2xl font-semibold">{result.riskLevel}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">Churn probability</div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--track)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${Math.round(result.churnProbability * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {(result.churnProbability * 100).toFixed(1)}%
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {result.predictedChurn === 1
                ? "This customer is predicted to churn."
                : "This customer is predicted to stay."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
