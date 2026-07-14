import { describe, it, expect } from "vitest";
import { analyze, analyzePosting, priorityFor } from "./engine";
import { JobPosting } from "@/types";

function job(description: string, title = "Engineer"): JobPosting {
  return { title, company: "Acme", location: "Remote", description };
}

describe("analyzePosting", () => {
  it("splits required vs. preferred at the 'nice to have' boundary", () => {
    const { requiredNames } = analyzePosting(
      job(
        "Requirements: React and TypeScript. Nice to have: GraphQL and Docker.",
      ),
    );
    expect(requiredNames.has("React")).toBe(true);
    expect(requiredNames.has("TypeScript")).toBe(true);
    // GraphQL/Docker appear only after the marker → not required.
    expect(requiredNames.has("GraphQL")).toBe(false);
    expect(requiredNames.has("Docker")).toBe(false);
  });

  it("does not treat an incidental 'annual bonus' as the preferred boundary", () => {
    // The compensation blurb comes before the real requirements — a naive substring
    // match on "bonus" would wrongly cut TypeScript/Kubernetes out of the required set.
    const { requiredNames } = analyzePosting(
      job(
        "We need React, AWS, Docker. Competitive salary and annual bonus. Requirements: TypeScript, Kubernetes.",
      ),
    );
    expect(requiredNames.has("TypeScript")).toBe(true);
    expect(requiredNames.has("Kubernetes")).toBe(true);
  });
});

describe("analyze — classification", () => {
  const jobs = [
    job("Requirements: React, TypeScript, PostgreSQL, Docker."),
    job("Requirements: React, TypeScript, AWS. Nice to have: Docker."),
    job("Requirements: React, JavaScript, PostgreSQL."),
  ];
  const curriculum = "We teach React, JavaScript, and HTML/CSS.";
  const result = analyze({ curriculumText: curriculum, jobPostings: jobs });

  it("marks curriculum-and-job skills as covered", () => {
    const covered = result.coveredSkills.map((s) => s.name);
    expect(covered).toContain("React");
    expect(covered).toContain("JavaScript");
  });

  it("marks in-demand-but-untaught skills as missing", () => {
    const missing = result.missingSkills.map((s) => s.name);
    expect(missing).toContain("TypeScript");
    expect(missing).toContain("PostgreSQL");
    expect(missing).toContain("Docker");
  });

  it("computes demand frequency as share of postings", () => {
    const react = result.jobSkills.find((s) => s.name === "React");
    expect(react?.frequency).toBe(1); // all 3 postings
    const ts = result.jobSkills.find((s) => s.name === "TypeScript");
    expect(ts?.frequency).toBeCloseTo(0.67, 1); // 2 of 3
  });

  it("flags a skill required by the majority of its postings", () => {
    const react = result.jobSkills.find((s) => s.name === "React");
    expect(react?.isRequired).toBe(true);
  });

  it("produces a coverage score between 0 and 100", () => {
    expect(result.coverageScore).toBeGreaterThanOrEqual(0);
    expect(result.coverageScore).toBeLessThanOrEqual(100);
  });

  it("attaches evidence postings for each demanded skill", () => {
    expect(result.evidence?.["React"]?.length).toBeGreaterThan(0);
    expect(result.evidence?.["React"]?.[0]).toHaveProperty("company", "Acme");
  });

  it("stamps the provided provenance meta onto the result", () => {
    const withMeta = analyze({
      curriculumText: curriculum,
      jobPostings: jobs,
      meta: { mode: "demo", extractor: "deterministic", jobSource: "demo" },
    });
    expect(withMeta.meta?.mode).toBe("demo");
  });
});

describe("analyze — score boundaries", () => {
  it("scores 100 when the curriculum covers all demand", () => {
    const jobs = [job("Requirements: React and TypeScript.")];
    const r = analyze({
      curriculumText: "We teach React and TypeScript.",
      jobPostings: jobs,
    });
    expect(r.coverageScore).toBe(100);
    expect(r.missingSkills).toEqual([]);
  });

  it("scores 0 when the curriculum covers none of the demand", () => {
    const jobs = [job("Requirements: Rust and Kubernetes.")];
    const r = analyze({
      curriculumText: "We teach basket weaving and calligraphy.",
      jobPostings: jobs,
    });
    expect(r.coverageScore).toBe(0);
  });

  it("prefers curriculum skills passed in explicitly (LLM path)", () => {
    const r = analyze({
      curriculumText: "irrelevant text",
      curriculumSkills: [{ name: "React", category: "frameworks" }],
      jobPostings: [job("Requirements: React and Vue.")],
    });
    expect(r.coveredSkills.map((s) => s.name)).toContain("React");
    expect(r.missingSkills.map((s) => s.name)).toContain("Vue.js");
  });

  it("handles an empty job set without dividing by zero or contradicting itself", () => {
    const r = analyze({ curriculumText: "React", jobPostings: [] });
    expect(r.coverageScore).toBe(0);
    expect(r.totalJobsAnalyzed).toBe(0);
    // Must NOT claim "excellent alignment" when there was nothing to compare against.
    expect(r.recommendations.join(" ")).not.toMatch(/excellent alignment/i);
    expect(r.recommendations.join(" ")).toMatch(/no job postings/i);
  });

  it("de-duplicates cross-posted listings (demand + evidence counted once)", () => {
    const p = job("Requirements: React and TypeScript.", "Frontend Dev");
    const r = analyze({
      curriculumText: "We teach React.",
      jobPostings: [p, { ...p }, { ...p }], // same posting three times
    });
    expect(r.totalJobsAnalyzed).toBe(1);
    const react = r.jobSkills.find((s) => s.name === "React");
    expect(react?.frequency).toBe(1);
    expect(r.evidence?.["React"]?.length).toBe(1);
  });
});

describe("priorityFor", () => {
  it("ranks high-frequency required skills as critical", () => {
    expect(
      priorityFor({ name: "X", category: "other", frequency: 0.8, isRequired: true }),
    ).toBe("critical");
  });
  it("ranks mid-frequency skills as important", () => {
    expect(
      priorityFor({ name: "X", category: "other", frequency: 0.4, isRequired: false }),
    ).toBe("important");
  });
  it("ranks low-frequency skills as recommended", () => {
    expect(
      priorityFor({ name: "X", category: "other", frequency: 0.1, isRequired: false }),
    ).toBe("recommended");
  });
});
