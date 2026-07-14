import { AnalysisResult, JobPosting, Skill } from "@/types";
import { analyze } from "@/lib/skills/engine";
import { extractCurriculumSkillsLLM } from "@/lib/skills/llm-extract";
import { hasAnthropicKey, hasRapidApiKey } from "@/lib/demo";

export interface AnalyzeGapOptions {
  curriculumText: string;
  jobPostings: JobPosting[];
}

/**
 * Top-level analysis orchestrator — the hybrid pipeline in one place.
 *
 * Curriculum skills come from Claude when a key is configured (better recall on messy,
 * prose-heavy syllabi) and from the deterministic taxonomy extractor otherwise. Either
 * way, demand aggregation, matching, scoring, and the roadmap are computed by the
 * deterministic {@link analyze} engine — so the numbers are reproducible and every
 * result carries provenance the UI can surface.
 */
export async function analyzeGap(
  options: AnalyzeGapOptions,
): Promise<AnalysisResult> {
  const { curriculumText, jobPostings } = options;

  let curriculumSkills: Skill[] | undefined;
  let extractor: "llm" | "deterministic" = "deterministic";

  if (hasAnthropicKey()) {
    try {
      const llmSkills = await extractCurriculumSkillsLLM(curriculumText);
      // Only claim the "llm" label if the model actually produced skills — an empty
      // result means analyze() will fall back to the deterministic extractor, so the
      // provenance must reflect that.
      if (llmSkills.length > 0) {
        curriculumSkills = llmSkills;
        extractor = "llm";
      }
    } catch {
      // The LLM is an enhancement, never a hard dependency: on any failure we
      // fall through to the deterministic extractor inside analyze().
      curriculumSkills = undefined;
      extractor = "deterministic";
    }
  }

  // Derive the job source from server-side key presence rather than trusting the
  // client-supplied value — a keyless deployment can never legitimately serve "live"
  // data, so demo data can't be relabeled as live by a crafted request.
  const jobSource: "jsearch" | "demo" = hasRapidApiKey() ? "jsearch" : "demo";

  return analyze({
    curriculumText,
    curriculumSkills,
    jobPostings,
    meta: {
      mode: jobSource === "jsearch" ? "live" : "demo",
      extractor,
      jobSource,
    },
  });
}
