export type SkillCategory =
  | "languages"
  | "frameworks"
  | "tools"
  | "concepts"
  | "soft_skills"
  | "databases"
  | "cloud"
  | "other";

export interface Skill {
  name: string;
  category: SkillCategory;
}

export interface JobSkill extends Skill {
  frequency: number; // share of postings mentioning it, 0–1
  isRequired: boolean; // listed as required (vs. preferred/nice-to-have) in most postings
}

export interface JobPosting {
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
  seniority?: "junior" | "mid" | "senior";
}

/** A posting cited as evidence that a given skill is in demand. */
export interface SkillEvidence {
  title: string;
  company: string;
  location: string;
  url?: string;
}

/** Where a result came from — surfaced in the UI so demo data is never misrepresented as live. */
export interface AnalysisMeta {
  mode: "live" | "demo";
  extractor: "llm" | "deterministic";
  jobSource: "jsearch" | "demo";
}

export interface AnalysisResult {
  curriculumSkills: Skill[];
  jobSkills: JobSkill[];
  coveredSkills: JobSkill[]; // in both curriculum and jobs
  missingSkills: JobSkill[]; // in jobs but not curriculum
  bonusSkills: Skill[]; // in curriculum but not jobs
  coverageScore: number; // 0-100
  recommendations: string[];
  totalJobsAnalyzed: number;
  /** Up to a few postings per skill that mention it, keyed by canonical skill name. */
  evidence?: Record<string, SkillEvidence[]>;
  meta?: AnalysisMeta;
}

export interface AnalysisRequest {
  curriculumText: string;
  jobPostings: JobPosting[];
}

export interface JobSearchParams {
  query: string;
  location: string;
  numPages?: number;
}

export type AppStep = "input" | "search" | "analyzing" | "results";
