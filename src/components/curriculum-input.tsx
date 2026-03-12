"use client";

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X, Loader2, ArrowRight } from "lucide-react";

interface CurriculumInputProps {
  onSubmit: (text: string) => void;
}

export function CurriculumInput({ onSubmit }: CurriculumInputProps) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function clearFile() {
    setText("");
    setFileName(null);
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

      <Card className="overflow-hidden border-border/50">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Upload zone with drag-and-drop */}
          <div
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
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
            onChange={(e) => setText(e.target.value)}
            rows={14}
            className="font-mono text-sm resize-none rounded-xl bg-muted/30 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
          />

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {wordCount > 0 ? `${wordCount} words` : "No content yet"}
            </p>
            <Button
              onClick={() => onSubmit(text)}
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
