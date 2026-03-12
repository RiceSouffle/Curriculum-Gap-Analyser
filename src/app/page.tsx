"use client";

import { useState } from "react";
import { CurriculumInput } from "@/components/curriculum-input";
import { JobSearchForm } from "@/components/job-search-form";
import { AnalysisDashboard } from "@/components/analysis-dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnalysisResult, AppStep, JobPosting } from "@/types";
import { Loader2, GraduationCap, Check } from "lucide-react";

const STEPS = [
  { key: "input" as const, label: "Curriculum", num: 1 },
  { key: "search" as const, label: "Job Search", num: 2 },
  { key: "analyzing" as const, label: "Analysis", num: 3 },
  { key: "results" as const, label: "Results", num: 4 },
];

const STEP_ORDER: AppStep[] = ["input", "search", "analyzing", "results"];

export default function Home() {
  const [step, setStep] = useState<AppStep>("input");
  const [curriculumText, setCurriculumText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCurriculumSubmit(text: string) {
    setCurriculumText(text);
    setStep("search");
  }

  async function handleJobResults(jobs: JobPosting[]) {
    setStep("analyzing");
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curriculumText, jobPostings: jobs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysisResult(data);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("search");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleReset() {
    setStep("input");
    setCurriculumText("");
    setAnalysisResult(null);
    setError(null);
  }

  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">Curriculum Gap Analyzer</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Syllabus vs. job market demands
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map(({ key, label, num }, i) => {
            const thisIdx = STEP_ORDER.indexOf(key);
            const isActive = step === key;
            const isComplete = thisIdx < currentIdx;

            return (
              <div key={key} className="flex items-center">
                {i > 0 && (
                  <div
                    className={`w-12 sm:w-20 h-px mx-1 transition-colors duration-300 ${
                      isComplete ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : isComplete
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : num}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block transition-colors duration-300 ${
                      isActive
                        ? "text-foreground"
                        : isComplete
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            {error}
          </div>
        )}

        {step === "input" && (
          <CurriculumInput onSubmit={handleCurriculumSubmit} />
        )}

        {step === "search" && (
          <JobSearchForm
            onResults={handleJobResults}
            onBack={() => setStep("input")}
          />
        )}

        {step === "analyzing" && analyzing && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Analyzing curriculum gaps...</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Extracting skills and comparing your curriculum against job market demands
              </p>
            </div>
          </div>
        )}

        {step === "results" && analysisResult && (
          <AnalysisDashboard result={analysisResult} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
