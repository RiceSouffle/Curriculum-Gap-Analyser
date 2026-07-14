"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, FileText, ScanSearch, GitCompareArrows, Gauge } from "lucide-react";

interface AnalyzingViewProps {
  jobCount: number;
}

/**
 * Staged progress for the analysis pass. The pipeline really does run these steps
 * server-side (parse → extract → match → score); here we surface them so the wait
 * reads as a process rather than a blank spinner. Stages advance on a timer and the
 * final one holds until the response lands and the parent swaps in the dashboard.
 */
export function AnalyzingView({ jobCount }: AnalyzingViewProps) {
  const stages = [
    { icon: FileText, label: "Reading curriculum", sub: "Parsing topics and learning outcomes" },
    { icon: ScanSearch, label: "Extracting skills", sub: `Mining ${jobCount} job postings for demand` },
    { icon: GitCompareArrows, label: "Matching against demand", sub: "Reconciling skills to a canonical taxonomy" },
    { icon: Gauge, label: "Scoring & ranking gaps", sub: "Weighting by employer demand frequency" },
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    // Walk through the first stages, then hold on the last until results arrive.
    const timers = [700, 1400, 2200].map((ms, i) =>
      setTimeout(() => setActive(i + 1), ms),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="max-w-md mx-auto py-20">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary/10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-lg font-semibold">Analyzing curriculum gaps</p>
        <p className="text-sm text-muted-foreground mt-1">
          Comparing your syllabus against real hiring demand
        </p>
      </div>

      <ol className="space-y-3">
        {stages.map((stage, i) => {
          const done = i < active;
          const current = i === active;
          const Icon = stage.icon;
          return (
            <li
              key={stage.label}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                current
                  ? "border-primary/40 bg-primary/5"
                  : done
                    ? "border-border/40 bg-muted/20"
                    : "border-border/30 bg-transparent opacity-50"
              }`}
            >
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-lg shrink-0 transition-colors ${
                  done
                    ? "bg-primary/15 text-primary"
                    : current
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : current ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-medium leading-tight">{stage.label}</p>
                <p className="text-xs text-muted-foreground truncate">{stage.sub}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
