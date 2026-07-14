"use client";

import { AnalysisResult, JobSkill, SkillEvidence } from "@/types";
import { priorityFor, Priority } from "@/lib/skills/engine";
import { AlertTriangle, ArrowUpRight, CircleDot } from "lucide-react";

interface LearningRoadmapProps {
  result: AnalysisResult;
}

const TIERS: {
  key: Priority;
  label: string;
  desc: string;
  accent: string;
  chip: string;
  icon: typeof AlertTriangle;
}[] = [
  {
    key: "critical",
    label: "Critical",
    desc: "High demand and often required — close these first",
    accent: "text-red-500",
    chip: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: AlertTriangle,
  },
  {
    key: "important",
    label: "Important",
    desc: "Frequently requested across postings",
    accent: "text-amber-500",
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: ArrowUpRight,
  },
  {
    key: "recommended",
    label: "Recommended",
    desc: "Nice-to-have signals that round out the program",
    accent: "text-sky-500",
    chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    icon: CircleDot,
  },
];

function EvidenceRow({ evidence }: { evidence?: SkillEvidence[] }) {
  if (!evidence || evidence.length === 0) return null;
  const distinct = [...new Set(evidence.map((e) => e.company))];
  const shown = distinct.slice(0, 3);
  return (
    <p className="text-xs text-muted-foreground mt-1">
      Asked for by {shown.join(", ")}
      {distinct.length > shown.length ? " and others" : ""}
    </p>
  );
}

export function LearningRoadmap({ result }: LearningRoadmapProps) {
  if (result.missingSkills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No gaps to sequence — your curriculum covers every in-demand skill in these postings.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {TIERS.map((tier) => {
        const skills = result.missingSkills.filter(
          (s) => priorityFor(s) === tier.key,
        );
        if (skills.length === 0) return null;
        const Icon = tier.icon;
        return (
          <div key={tier.key}>
            <div className="flex items-center gap-2.5 mb-3">
              <Icon className={`h-4 w-4 ${tier.accent}`} />
              <h4 className="text-sm font-semibold">{tier.label}</h4>
              <span className="text-xs text-muted-foreground">— {tier.desc}</span>
            </div>
            <div className="space-y-2">
              {skills.map((s: JobSkill) => (
                <div
                  key={s.name}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border/40 bg-muted/20 p-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{s.name}</span>
                      {s.isRequired && (
                        <span className="rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5 text-[10px] font-medium">
                          required
                        </span>
                      )}
                    </div>
                    <EvidenceRow evidence={result.evidence?.[s.name]} />
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-sm font-semibold tabular-nums ${tier.accent}`}>
                      {Math.round(s.frequency * 100)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">demand</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
