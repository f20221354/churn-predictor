"use client";

import { useMemo, useState } from "react";
import metrics from "@/public/data/metrics.json";
import predictions from "@/public/data/predictions.json";

type Metrics = {
  accuracy: number;
  roc_auc: number;
  confusion_matrix: number[][];
  n_train: number;
  n_test: number;
  n_total: number;
  churn_rate: number;
};

type Prediction = {
  customerID: string;
  actualChurn: number;
  predictedChurn: number;
  churnProbability: number;
};

const typedMetrics = metrics as Metrics;
const typedPredictions = predictions as Prediction[];

const PAGE_SIZE = 15;

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums text-[var(--text-primary)]">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

function riskLevel(p: number): "Low" | "Medium" | "High" {
  if (p >= 0.66) return "High";
  if (p >= 0.33) return "Medium";
  return "Low";
}

const RISK_DOT: Record<string, string> = {
  Low: "bg-[var(--status-good)]",
  Medium: "bg-[var(--status-warning)]",
  High: "bg-[var(--status-critical)]",
};

export default function OverallTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "churn" | "stay">("all");
  const [page, setPage] = useState(0);

  const [[tn, fp], [fn, tp]] = typedMetrics.confusion_matrix;

  const filtered = useMemo(() => {
    return typedPredictions.filter((row) => {
      if (search && !row.customerID.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "churn" && row.predictedChurn !== 1) return false;
      if (filter === "stay" && row.predictedChurn !== 0) return false;
      return true;
    });
  }, [search, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const predictedChurnCount = typedPredictions.filter((r) => r.predictedChurn === 1).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Accuracy" value={`${(typedMetrics.accuracy * 100).toFixed(1)}%`} />
        <StatTile label="ROC-AUC" value={typedMetrics.roc_auc.toFixed(3)} />
        <StatTile
          label="Customers scored"
          value={typedMetrics.n_total.toLocaleString()}
          sub={`${typedMetrics.n_train.toLocaleString()} train / ${typedMetrics.n_test.toLocaleString()} test`}
        />
        <StatTile
          label="Predicted to churn"
          value={predictedChurnCount.toLocaleString()}
          sub={`${((predictedChurnCount / typedMetrics.n_total) * 100).toFixed(1)}% of customers`}
        />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
          Confusion matrix (held-out test set)
        </h3>
        <div className="grid max-w-md grid-cols-3 gap-2 text-center text-sm">
          <div />
          <div className="text-xs font-medium text-[var(--text-muted)]">Predicted: Stay</div>
          <div className="text-xs font-medium text-[var(--text-muted)]">Predicted: Churn</div>

          <div className="flex items-center justify-end pr-2 text-xs font-medium text-[var(--text-muted)]">
            Actual: Stay
          </div>
          <div className="rounded-lg bg-[var(--status-good-bg)] py-3 font-semibold text-[var(--status-good)]">
            {tn}
          </div>
          <div className="rounded-lg bg-[var(--status-warning-bg)] py-3 font-semibold text-[var(--status-warning)]">
            {fp}
          </div>

          <div className="flex items-center justify-end pr-2 text-xs font-medium text-[var(--text-muted)]">
            Actual: Churn
          </div>
          <div className="rounded-lg bg-[var(--status-warning-bg)] py-3 font-semibold text-[var(--status-warning)]">
            {fn}
          </div>
          <div className="rounded-lg bg-[var(--status-good-bg)] py-3 font-semibold text-[var(--status-good)]">
            {tp}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">Per-customer predictions</h3>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search customer ID…"
            className="ml-auto rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as typeof filter);
              setPage(0);
            }}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All customers</option>
            <option value="churn">Predicted churn</option>
            <option value="stay">Predicted stay</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--text-muted)]">
                <th className="py-2 pr-4 font-medium">Customer ID</th>
                <th className="py-2 pr-4 font-medium">Actual</th>
                <th className="py-2 pr-4 font-medium">Predicted</th>
                <th className="py-2 pr-4 font-medium">Probability</th>
                <th className="py-2 pr-4 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const risk = riskLevel(row.churnProbability);
                return (
                  <tr key={row.customerID} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-[var(--text-primary)]">
                      {row.customerID}
                    </td>
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">
                      {row.actualChurn ? "Churn" : "Stay"}
                    </td>
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">
                      {row.predictedChurn ? "Churn" : "Stay"}
                    </td>
                    <td className="py-2 pr-4 tabular-nums text-[var(--text-primary)]">
                      {(row.churnProbability * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${RISK_DOT[risk]}`} />
                        {risk}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
          <span>
            {filtered.length.toLocaleString()} customers · page {page + 1} of {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="rounded-md border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
