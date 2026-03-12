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
  frequency: number; // how many postings mention it (out of total)
  isRequired: boolean; // required vs preferred/nice-to-have
}

export interface JobPosting {
  title: string;
  company: string;
  location: string;
  description: string;
  url?: string;
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
