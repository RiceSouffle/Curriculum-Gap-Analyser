import { describe, it, expect } from "vitest";
import { analyze } from "./engine";
import { searchDemoJobs, getSampleCurriculum } from "@/lib/demo";

/**
 * End-to-end check on the bundled demo data: the deterministic pipeline should turn a
 * real sample curriculum + real sample postings into a sane, useful gap report. This
 * doubles as a guard on the generated data files — if the corpus loses its skill
 * density or a curriculum drifts, these expectations break.
 */
describe("demo pipeline (zero-key path)", () => {
  it("analyzes the full-stack bootcamp against full-stack roles", () => {
    const curriculum = getSampleCurriculum("fullstack-bootcamp");
    expect(curriculum).toBeDefined();
    const jobs = searchDemoJobs("Full-Stack Developer");
    expect(jobs.length).toBeGreaterThan(5);

    const result = analyze({
      curriculumText: curriculum!.text,
      jobPostings: jobs,
    });

    // Coverage should be partial — the curriculum is real but has deliberate gaps.
    expect(result.coverageScore).toBeGreaterThan(20);
    expect(result.coverageScore).toBeLessThan(100);

    // Things the bootcamp teaches should be recognized as covered.
    const covered = result.coveredSkills.map((s) => s.name);
    expect(covered).toContain("React");

    // The bootcamp intentionally omits TypeScript — it should surface as a gap.
    const missing = result.missingSkills.map((s) => s.name);
    expect(missing).toContain("TypeScript");

    // The engine should produce a real, non-empty roadmap and recommendations.
    expect(result.recommendations.length).toBeGreaterThan(2);
    expect(result.jobSkills.length).toBeGreaterThan(10);
  });

  it("routes a data-science query to data postings and finds ML demand", () => {
    const jobs = searchDemoJobs("Data Scientist");
    const result = analyze({
      curriculumText: "We teach Python and pandas.",
      jobPostings: jobs,
    });
    const demanded = result.jobSkills.map((s) => s.name);
    expect(demanded).toContain("Python");
    // At least one ML-adjacent skill should show up in the demand.
    expect(
      demanded.some((n) =>
        ["Machine Learning", "scikit-learn", "TensorFlow", "PyTorch", "SQL"].includes(n),
      ),
    ).toBe(true);
  });

  it("never dead-ends: an off-topic query still returns analyzable jobs", () => {
    const jobs = searchDemoJobs("underwater basket weaving");
    expect(jobs.length).toBeGreaterThan(0);
  });
});
