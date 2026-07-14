import {
  AnalysisMeta,
  AnalysisResult,
  JobPosting,
  JobSkill,
  Skill,
  SkillEvidence,
} from "@/types";
import { extractSkills, ExtractedSkill } from "./extract";

/**
 * The deterministic analysis engine.
 *
 * This is the defensible core of the app: given a set of curriculum skills and a set
 * of per-posting skill lists, it computes demand frequency, requiredness, coverage,
 * and a prioritized roadmap using plain, testable arithmetic — *no* AI in the loop.
 * The only fuzzy step (turning messy text into skills) happens upstream in an
 * extractor; this function is pure and its output is fully determined by its input.
 */

/** A skill extracted from a single job posting, plus whether it read as required. */
export interface PostingSkills {
  skills: ExtractedSkill[];
  requiredNames: Set<string>;
}

/**
 * Heuristic split of a posting into its "required" region and the rest. Anything
 * mentioned before a "nice to have / preferred / bonus" heading is treated as
 * required; anything after is preferred.
 *
 * These are anchored phrase patterns, not bare substrings: an incidental "annual
 * bonus" in a compensation blurb must NOT be mistaken for a "bonus points" heading and
 * yank the split earlier than the real preferred section. Deterministic and good
 * enough to give the requiredness signal real meaning without another AI call.
 */
const PREFERRED_MARKERS: RegExp[] = [
  /\bnice[ -]to[ -]haves?\b/i,
  /\bpreferred\s+(?:qualifications?|skills|experience)\b/i,
  /\bpreferred\s*:/i,
  /\bbonus\s+(?:points|skills)\b/i,
  /\bbonus\s*:/i,
  /\bgood\s+to\s+have\b/i,
  /\bgreat\s+to\s+have\b/i,
  /\b(?:would\s+be\s+|is\s+)?a\s+plus\b/i,
  /\bpluses\b/i,
  /\bdesirable\b/i,
  /\bwe['’]?d\s+love\b/i,
];

export function analyzePosting(posting: JobPosting): PostingSkills {
  const text = posting.description || "";

  let splitAt = text.length;
  for (const marker of PREFERRED_MARKERS) {
    const m = marker.exec(text);
    if (m && m.index < splitAt) splitAt = m.index;
  }

  const requiredNames = new Set(
    extractSkills(text.slice(0, splitAt)).map((s) => s.name),
  );
  return { skills: extractSkills(text), requiredNames };
}

interface Aggregate {
  name: string;
  category: Skill["category"];
  postingsMentioning: number;
  requiredCount: number;
}

export interface AnalyzeOptions {
  /** Pre-extracted curriculum skills (e.g. from the LLM extractor). If omitted, the
   *  deterministic extractor is run over `curriculumText`. */
  curriculumSkills?: Skill[];
  curriculumText: string;
  jobPostings: JobPosting[];
  /** Provenance stamped onto the result so the UI can label demo vs. live data. */
  meta?: AnalysisMeta;
  /** Max postings cited per skill in the evidence map (default 4). */
  evidenceLimit?: number;
}

/** Round to 2 decimals to keep frequencies stable and JSON tidy. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Job aggregators frequently return the same posting cross-posted (often under
 * different URLs); count each once. Keyed on content — title, company, location, and
 * description — so identical listings collapse regardless of URL, while two genuinely
 * different roles that merely share a title/company are kept separate.
 */
function dedupePostings(postings: JobPosting[]): JobPosting[] {
  const seen = new Set<string>();
  const out: JobPosting[] = [];
  for (const p of postings) {
    const key =
      `${p.title}|${p.company}|${p.location}|${p.description}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export function analyze(options: AnalyzeOptions): AnalysisResult {
  const { curriculumText } = options;
  const jobPostings = dedupePostings(options.jobPostings);
  const totalJobs = jobPostings.length;

  // 1. Curriculum skills — either provided (LLM) or extracted deterministically.
  const curriculumSkills: Skill[] =
    options.curriculumSkills && options.curriculumSkills.length > 0
      ? dedupeSkills(options.curriculumSkills)
      : extractSkills(curriculumText).map((s) => ({
          name: s.name,
          category: s.category,
        }));
  const curriculumNames = new Set(curriculumSkills.map((s) => s.name));

  // 2. Aggregate demand across every posting, collecting evidence as we go.
  const evidenceLimit = options.evidenceLimit ?? 4;
  const agg = new Map<string, Aggregate>();
  const evidence: Record<string, SkillEvidence[]> = {};
  for (const posting of jobPostings) {
    const { skills, requiredNames } = analyzePosting(posting);
    for (const skill of skills) {
      const a = agg.get(skill.name) ?? {
        name: skill.name,
        category: skill.category,
        postingsMentioning: 0,
        requiredCount: 0,
      };
      a.postingsMentioning += 1;
      if (requiredNames.has(skill.name)) a.requiredCount += 1;
      agg.set(skill.name, a);

      const cites = (evidence[skill.name] ??= []);
      if (cites.length < evidenceLimit) {
        cites.push({
          title: posting.title,
          company: posting.company,
          location: posting.location,
          url: posting.url,
        });
      }
    }
  }

  // 3. Turn aggregates into demand-weighted JobSkills.
  const jobSkills: JobSkill[] = [...agg.values()]
    .map((a) => ({
      name: a.name,
      category: a.category,
      frequency: totalJobs > 0 ? round2(a.postingsMentioning / totalJobs) : 0,
      // "Required" if a majority of the postings that mention it list it as required.
      isRequired: a.requiredCount * 2 >= a.postingsMentioning && a.postingsMentioning > 0,
    }))
    .sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name));

  // 4. Classify.
  const coveredSkills = jobSkills.filter((s) => curriculumNames.has(s.name));
  const missingSkills = jobSkills.filter((s) => !curriculumNames.has(s.name));
  const jobNames = new Set(jobSkills.map((s) => s.name));
  const bonusSkills = curriculumSkills.filter((s) => !jobNames.has(s.name));

  // 5. Weighted coverage score: how much of the *demand* (∑ frequency) is covered.
  const totalWeight = jobSkills.reduce((sum, s) => sum + s.frequency, 0);
  const coveredWeight = coveredSkills.reduce((sum, s) => sum + s.frequency, 0);
  const coverageScore =
    totalWeight > 0 ? Math.round((coveredWeight / totalWeight) * 100) : 0;

  // 6. Deterministic, prioritized recommendations from the actual gap.
  const recommendations = buildRecommendations(
    missingSkills,
    coveredSkills,
    bonusSkills,
    totalJobs,
  );

  return {
    curriculumSkills,
    jobSkills,
    coveredSkills,
    missingSkills,
    bonusSkills,
    coverageScore,
    recommendations,
    totalJobsAnalyzed: totalJobs,
    evidence,
    meta: options.meta,
  };
}

function dedupeSkills(skills: Skill[]): Skill[] {
  const seen = new Map<string, Skill>();
  for (const s of skills) {
    const key = s.name.toLowerCase();
    if (!seen.has(key)) seen.set(key, s);
  }
  return [...seen.values()];
}

/** Priority tiers used by the roadmap. Exported for the UI. */
export type Priority = "critical" | "important" | "recommended";

export function priorityFor(skill: JobSkill): Priority {
  if (skill.frequency >= 0.6 || (skill.isRequired && skill.frequency >= 0.4)) {
    return "critical";
  }
  if (skill.frequency >= 0.3) return "important";
  return "recommended";
}

const CATEGORY_LABELS: Record<Skill["category"], string> = {
  languages: "language",
  frameworks: "framework",
  tools: "tool",
  concepts: "concept",
  soft_skills: "soft skill",
  databases: "database",
  cloud: "cloud/DevOps skill",
  other: "skill",
};

/**
 * Build human-readable recommendations straight from the computed gap. No LLM — the
 * ordering (by demand) and phrasing are derived, so results are reproducible and
 * every claim traces back to a number the user can see in the chart.
 */
function buildRecommendations(
  missing: JobSkill[],
  covered: JobSkill[],
  bonus: Skill[],
  totalJobs: number,
): string[] {
  if (totalJobs === 0) {
    return [
      "No job postings were analyzed, so there's nothing to compare against yet. Search for a target role to generate a gap report.",
    ];
  }

  const recs: string[] = [];
  const pct = (f: number) => Math.round(f * 100);

  const critical = missing.filter((s) => priorityFor(s) === "critical");
  const important = missing.filter((s) => priorityFor(s) === "important");

  if (critical.length > 0) {
    const top = critical[0];
    recs.push(
      `Prioritize ${top.name}: it appears in ${pct(top.frequency)}% of the ${totalJobs} postings analyzed${
        top.isRequired ? " and is typically listed as a hard requirement" : ""
      }, yet your curriculum doesn't cover it. This is your single highest-impact gap.`,
    );
  }

  if (critical.length > 1) {
    const names = critical.slice(1, 4).map((s) => s.name);
    if (names.length > 0) {
      recs.push(
        `Add a dedicated module for ${listPhrase(names)} — ${
          names.length > 1 ? "each is" : "it is"
        } in high demand (≥40% of postings) and currently absent from your program.`,
      );
    }
  }

  // Group remaining important gaps by category for a focused suggestion.
  const byCategory = new Map<Skill["category"], JobSkill[]>();
  for (const s of important) {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  }
  const biggestCategory = [...byCategory.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )[0];
  if (biggestCategory && biggestCategory[1].length >= 2) {
    const [cat, skills] = biggestCategory;
    recs.push(
      `Strengthen your ${CATEGORY_LABELS[cat]} coverage: employers frequently ask for ${listPhrase(
        skills.slice(0, 3).map((s) => s.name),
      )}, none of which are in the current syllabus.`,
    );
  }

  if (bonus.length >= 3) {
    recs.push(
      `You teach ${bonus.length} skills that rarely appear in these postings (${listPhrase(
        bonus.slice(0, 3).map((s) => s.name),
      )}). Keep what has pedagogical value, but consider reallocating time from the least market-relevant toward the critical gaps above.`,
    );
  }

  if (covered.length > 0) {
    const strong = covered.filter((s) => s.frequency >= 0.5).slice(0, 3);
    if (strong.length > 0) {
      recs.push(
        `Lead with your strengths: ${listPhrase(
          strong.map((s) => s.name),
        )} are both in high demand and well covered — market these as the backbone of the program.`,
      );
    }
  }

  if (missing.length === 0) {
    recs.push(
      "Excellent alignment — every in-demand skill from these postings is already covered. Focus on depth and hands-on projects rather than adding breadth.",
    );
  } else {
    recs.push(
      `Overall, closing the ${Math.min(missing.length, 5)} highest-demand gaps would move the largest share of employer requirements into "covered." Sequence them by the demand percentages shown in the chart.`,
    );
  }

  return recs;
}

function listPhrase(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}
