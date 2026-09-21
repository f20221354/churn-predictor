"use client";

import { useState } from "react";
import IndividualTab from "./components/IndividualTab";
import OverallTab from "./components/OverallTab";

const TABS = [
  { id: "individual", label: "Individual" },
  { id: "overall", label: "Overall" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [tab, setTab] = useState<TabId>("individual");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Customer Churn Predictor
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Score an individual customer&apos;s churn risk, or review how the model performs overall.
        </p>
      </header>

      <div className="flex gap-1 border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.id
                ? "border-[var(--accent)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "individual" ? <IndividualTab /> : <OverallTab />}
    </main>
  );
}
