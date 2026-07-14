"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Briefcase, ArrowLeft, ArrowRight, MapPin, FlaskConical } from "lucide-react";
import { JobPosting } from "@/types";

interface JobSearchFormProps {
  onResults: (jobs: JobPosting[]) => void;
  onBack: () => void;
  onSearchStart?: () => void;
  initialQuery?: string;
  initialJobs?: JobPosting[];
}

export function JobSearchForm({
  onResults,
  onBack,
  onSearchStart,
  initialQuery = "",
  initialJobs = [],
}: JobSearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Seed from any previously fetched jobs so a bounced-back analysis keeps the list.
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs);
  const [source, setSource] = useState<"jsearch" | "demo">("demo");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    onSearchStart?.(); // clear any stale page-level error banner
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJobs(data.jobs);
      setSource(data.source === "jsearch" ? "jsearch" : "demo");
      if (data.jobs.length === 0) {
        setError("No jobs found. Try broader keywords (e.g. \"Software Developer\") or leave location empty for global results.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search jobs");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Search job postings
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Find real job listings to compare against your curriculum. We&apos;ll analyze what employers are looking for.
        </p>
      </div>

      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="query" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Target Role / Field
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="query"
                    placeholder='e.g. "Frontend Developer"'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                    className="pl-10 rounded-xl h-11 bg-muted/30 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Location (optional)
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder='e.g. "New York", "Remote"'
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 rounded-xl h-11 bg-muted/30 border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onBack} className="rounded-xl gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button type="submit" disabled={loading || !query.trim()} className="rounded-xl gap-2 px-6">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Searching..." : "Search Jobs"}
              </Button>
            </div>
          </form>

          {error && <p className="text-sm text-destructive mt-4">{error}</p>}
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">Found {jobs.length} job postings</p>
                    {source === "demo" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium">
                        <FlaskConical className="h-2.5 w-2.5" />
                        Sample data
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {source === "demo"
                      ? "Bundled corpus — add a RapidAPI key for live listings"
                      : "Live from LinkedIn, Indeed, Glassdoor & more"}
                  </p>
                </div>
              </div>
              <Button onClick={() => onResults(jobs)} size="lg" className="rounded-xl gap-2 px-6">
                Analyze Gap
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {jobs.map((job, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-border/60 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.company} &middot; {job.location}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2 leading-relaxed">
                      {job.description.slice(0, 180)}...
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-3 shrink-0 rounded-lg text-[10px]">
                    #{i + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
