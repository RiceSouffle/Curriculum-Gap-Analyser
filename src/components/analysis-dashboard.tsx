"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { SkillGapChart } from "./skill-gap-chart";
import { SkillList } from "./skill-list";
import { LearningRoadmap } from "./learning-roadmap";
import { AnalysisResult } from "@/types";
import { toMarkdownReport } from "@/lib/report";
import {
  CheckCircle,
  XCircle,
  Sparkles,
  BarChart3,
  RotateCcw,
  Lightbulb,
  FileJson,
  FileText,
  TrendingUp,
  TrendingDown,
  Target,
  Route,
  FlaskConical,
  Bot,
  Cpu,
} from "lucide-react";

interface AnalysisDashboardProps {
  result: AnalysisResult;
  onReset: () => void;
}

function getScoreColor(score: number) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
}

function getScoreLabel(score: number) {
  if (score >= 75) return "Strong Coverage";
  if (score >= 50) return "Moderate Coverage";
  return "Significant Gaps";
}

function getScoreBg(score: number) {
  if (score >= 75) return "bg-emerald-500/10";
  if (score >= 50) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalysisDashboard({ result, onReset }: AnalysisDashboardProps) {
  const meta = result.meta;

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="outline" onClick={onReset} className="rounded-xl gap-2">
          <RotateCcw className="h-4 w-4" />
          New Analysis
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() =>
              download(
                "gap-analysis-report.md",
                toMarkdownReport(result),
                "text/markdown",
              )
            }
          >
            <FileText className="h-4 w-4" />
            Report
          </Button>
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() =>
              download(
                "gap-analysis.json",
                JSON.stringify(result, null, 2),
                "application/json",
              )
            }
          >
            <FileJson className="h-4 w-4" />
            JSON
          </Button>
        </div>
      </div>

      {/* Provenance strip — never misrepresent demo data as live */}
      {meta && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {meta.mode === "demo" ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-1 font-medium">
              <FlaskConical className="h-3 w-3" />
              Sample job data
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-1 font-medium">
              Live job data
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-md bg-muted text-muted-foreground border border-border/50 px-2 py-1">
            {meta.extractor === "llm" ? (
              <>
                <Bot className="h-3 w-3" />
                AI skill extraction
              </>
            ) : (
              <>
                <Cpu className="h-3 w-3" />
                Rule-based extraction
              </>
            )}
          </span>
          <span className="text-muted-foreground">
            Scoring is deterministic — every number traces to the demand chart below.
          </span>
        </div>
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${getScoreBg(result.coverageScore)}`}>
                <Target className={`h-4 w-4 ${getScoreColor(result.coverageScore)}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold tracking-tight ${getScoreColor(result.coverageScore)}`}>
              {Math.round(result.coverageScore)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(result.coverageScore)}</p>
            <Progress value={result.coverageScore} className="mt-3 h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight text-emerald-500">
              {result.coveredSkills.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Skills Covered</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-red-500/10">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight text-red-500">
              {result.missingSkills.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Skills Missing</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {result.totalJobsAnalyzed}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Jobs Analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Roadmap — the actionable centerpiece */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Route className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Learning Roadmap</CardTitle>
              <CardDescription className="text-xs">
                Missing skills sequenced by employer demand — close the top gaps first
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <LearningRoadmap result={result} />
        </CardContent>
      </Card>

      {/* Gap Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Skill Demand vs. Coverage</CardTitle>
              <CardDescription className="text-xs">
                Top skills sorted by employer demand frequency
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <SkillGapChart result={result} />
        </CardContent>
      </Card>

      {/* Skill Lists */}
      <Card className="border-border/50">
        <CardContent className="p-6 sm:p-8">
          <Tabs defaultValue="missing">
            <TabsList className="grid w-full grid-cols-3 rounded-xl h-11 bg-muted/50">
              <TabsTrigger value="missing" className="gap-1.5 rounded-lg text-xs data-[state=active]:shadow-sm">
                <XCircle className="h-3.5 w-3.5" />
                Missing ({result.missingSkills.length})
              </TabsTrigger>
              <TabsTrigger value="covered" className="gap-1.5 rounded-lg text-xs data-[state=active]:shadow-sm">
                <CheckCircle className="h-3.5 w-3.5" />
                Covered ({result.coveredSkills.length})
              </TabsTrigger>
              <TabsTrigger value="bonus" className="gap-1.5 rounded-lg text-xs data-[state=active]:shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Bonus ({result.bonusSkills.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="missing" className="mt-6">
              <SkillList
                skills={result.missingSkills}
                showFrequency
                emptyMessage="No skill gaps found -- your curriculum covers everything!"
              />
            </TabsContent>
            <TabsContent value="covered" className="mt-6">
              <SkillList
                skills={result.coveredSkills}
                showFrequency
                emptyMessage="No overlapping skills found"
              />
            </TabsContent>
            <TabsContent value="bonus" className="mt-6">
              <SkillList
                skills={result.bonusSkills}
                emptyMessage="No bonus skills -- everything you teach is in demand"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-base">Recommendations</CardTitle>
              <CardDescription className="text-xs">
                Derived from the gap above — reproducible, not guessed
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {result.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
