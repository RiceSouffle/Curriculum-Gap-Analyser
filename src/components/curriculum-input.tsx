"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X, Loader2, ArrowRight, Sparkles } from "lucide-react";

interface CurriculumInputProps {
  onSubmit: (text: string, suggestedRole?: string) => void;
}

interface Sample {
  id: string;
  name: string;
  track: string;
  blurb: string;
  text: string;
  suggestedRole: string;
}

export function CurriculumInput({ onSubmit }: CurriculumInputProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [activeSample, setActiveSample] = useState<string | null>(null);
  const [suggestedRole, setSuggestedRole] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/samples")
      .then((r) => r.json())
      .then((d) => setSamples(d.samples ?? []))
      .catch(() => setSamples([]));
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setText(data.text);
      setFileName(file.name);
      setActiveSample(null);
      setSuggestedRole("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function loadSample(sample: Sample) {
    setText(sample.text);
    setActiveSample(sample.id);
    setSuggestedRole(sample.suggestedRole);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function clearFile() {
    setText("");
    setFileName(null);
    setActiveSample(null);
    setSuggestedRole("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Upload your curriculum
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Paste your syllabus or upload a file. We&apos;ll compare it against real job postings to find what&apos;s missing.
        </p>
      </div>

      {/* Sample scenarios — lets anyone run the full flow with zero setup */}
      {samples.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Try a sample curriculum</p>
            <span className="text-xs text-muted-foreground">— no upload needed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSample(s)}
                className={`text-left rounded-xl border p-3 transition-all duration-200 ${
                  activeSample === s.id
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <p className="text-sm font-medium leading-tight">{s.track}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.blurb}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Upload zone with drag-and-drop */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragging(false);
            }}
            className={`group relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
              dragging
                ? "border-primary bg-primary/10"
                : "border-border/70 hover:border-primary/50 bg-muted/30 hover:bg-primary/5"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.csv,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className={`flex items-center justify-center h-12 w-12 rounded-2xl transition-colors ${
              dragging ? "bg-primary/20" : "bg-primary/10 group-hover:bg-primary/15"
            }`}>
              {uploading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Upload className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {uploading
                  ? "Parsing file..."
                  : dragging
                    ? "Drop your file here"
                    : "Drop your syllabus here or click to upload"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, CSV, or TXT
              </p>
            </div>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm w-fit">
              <FileText className="h-3.5 w-3.5" />
              {fileName}
              <button onClick={clearFile} className="hover:text-primary/70 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">or paste below</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Text input */}
          <Textarea
            id="curriculum-text"
            placeholder={"Paste your curriculum, syllabus, or course topics here...\n\nExample:\nWeek 1: HTML & CSS Fundamentals\nWeek 2: JavaScript Basics\nWeek 3: React & Component Architecture\n..."}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setActiveSample(null);
            }}
            rows={14}
            className="font-mono text-sm resize-none rounded-xl bg-muted/30 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
          />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {wordCount > 0 ? `${wordCount} words` : "No content yet"}
            </p>
            <Button
              onClick={() => onSubmit(text, suggestedRole)}
              disabled={!text.trim()}
              size="lg"
              className="rounded-xl gap-2 px-6"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
