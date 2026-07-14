import { JobPosting } from "@/types";
import corpus from "@/data/job-corpus.json";
import curriculaData from "@/data/curricula.json";

/**
 * Zero-key demo data.
 *
 * The whole point: a reviewer can clone the repo and run the entire flow — upload a
 * curriculum, "search" jobs, get a real analysis — without an Anthropic or RapidAPI
 * key. The bundled postings are real prose that the deterministic engine genuinely
 * analyzes; nothing here is a canned result.
 */

export interface RoleBatch {
  role: string;
  keywords: string[];
  postings: DemoPosting[];
}

export interface DemoPosting {
  title: string;
  company: string;
  location: string;
  seniority: "junior" | "mid" | "senior";
  description: string;
}

export interface SampleCurriculum {
  id: string;
  name: string;
  track: string;
  blurb: string;
  text: string;
}

const ROLES = (corpus as { roles: RoleBatch[] }).roles;
export const SAMPLE_CURRICULA = curriculaData as SampleCurriculum[];

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function hasRapidApiKey(): boolean {
  return Boolean(process.env.RAPIDAPI_KEY);
}

export function getSampleCurriculum(id: string): SampleCurriculum | undefined {
  return SAMPLE_CURRICULA.find((c) => c.id === id);
}

function toPosting(p: DemoPosting): JobPosting {
  return {
    title: p.title,
    company: p.company,
    location: p.location,
    description: p.description,
    seniority: p.seniority,
  };
}

/**
 * Score a role against the search query by keyword overlap, so "react dev" lands on
 * Frontend and "ml engineer" on Data Scientist. Falls back to a sensible default set
 * when the query matches nothing, so the demo never dead-ends on "no results".
 */
export function searchDemoJobs(query: string, location = ""): JobPosting[] {
  const q = `${query} ${location}`.toLowerCase().trim();
  if (!q) return ROLES.flatMap((r) => r.postings.map(toPosting));

  const scored = ROLES.map((role) => {
    let score = 0;
    for (const kw of role.keywords) {
      if (q.includes(kw)) score += kw.length; // longer keyword = stronger signal
    }
    // Also reward the role name appearing in the query.
    if (q.includes(role.role.toLowerCase())) score += 20;
    return { role, score };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score === 0) {
    // No clear match — return a broad full-stack-flavored sample so the user still
    // sees a realistic, analyzable set rather than an empty screen.
    const fallback =
      ROLES.find((r) => r.role === "Full-Stack Developer") ?? ROLES[0];
    return fallback.postings.map(toPosting);
  }

  // Primary role, plus adjacent roles that also scored, capped for a realistic set.
  const picked: JobPosting[] = [...best.role.postings.map(toPosting)];
  for (const { role, score } of scored.slice(1)) {
    if (score > 0 && picked.length < 24) {
      picked.push(...role.postings.slice(0, 3).map(toPosting));
    }
  }
  return picked;
}
