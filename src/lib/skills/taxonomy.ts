import { SkillCategory } from "@/types";

/**
 * A single canonical skill and every surface form we know how to recognize it by.
 *
 * The taxonomy is the backbone of the deterministic engine: extraction, matching,
 * and de-duplication all resolve raw text to one of these canonical entries. Adding
 * a skill here is the *only* place you need to teach the whole pipeline a new term.
 */
export interface TaxonomyEntry {
  /** The display name. Also matched as an alias automatically. */
  canonical: string;
  category: SkillCategory;
  /** Alternate surface forms (case-insensitive). Do not repeat `canonical`. */
  aliases?: string[];
  /**
   * Precision guard for genuinely ambiguous, short, dictionary-word skills
   * (the languages C, R, Go). When true, a bare mention is only accepted when it
   * sits inside a list of other technologies — see {@link extract}. We deliberately
   * trade recall for precision here rather than flag every "go to the store" as Go.
   */
  ambiguous?: boolean;
}

/** Terse constructor to keep the table below readable. */
function t(
  canonical: string,
  category: SkillCategory,
  aliases: string[] = [],
  ambiguous = false,
): TaxonomyEntry {
  return { canonical, category, aliases, ambiguous };
}

/**
 * The canonical skill table. Curated rather than exhaustive: it covers the common
 * software / data / cloud vocabulary that shows up in real curricula and postings.
 * Aliases capture the spelling drift you see in the wild (js, react.js, postgres, k8s).
 */
export const TAXONOMY: TaxonomyEntry[] = [
  // ── Languages ──────────────────────────────────────────────────────────────
  t("JavaScript", "languages", ["js", "ecmascript", "es6", "es2015", "vanilla js"]),
  t("TypeScript", "languages", ["ts"]),
  t("Python", "languages", ["py", "python3"]),
  t("Java", "languages"),
  t("C++", "languages", ["cpp", "cplusplus", "c++11", "c++14", "c++17", "c++20", "c++23"]),
  t("C#", "languages", ["c-sharp", "csharp", "dotnet c#"]),
  t("C", "languages", ["c programming", "c language", "ansi c"], true),
  t("Go", "languages", ["golang", "go programming", "go lang"], true),
  t("Rust", "languages", ["rustlang"]),
  t("Ruby", "languages"),
  t("PHP", "languages"),
  t("Swift", "languages"),
  t("Kotlin", "languages"),
  t("Scala", "languages"),
  t("R", "languages", ["r programming", "r language", "rlang", "rstudio"], true),
  t("SQL", "languages", ["structured query language"]),
  t("Bash", "languages", ["shell scripting", "shell script", "bash scripting", "zsh"]),
  t("HTML", "languages", ["html5"]),
  t("CSS", "languages", ["css3"]),
  t("Objective-C", "languages", ["objc"]),
  t("Dart", "languages"),
  t("Elixir", "languages"),
  t("Perl", "languages"),
  t("MATLAB", "languages"),
  t("Solidity", "languages"),

  // ── Frameworks & Libraries ──────────────────────────────────────────────────
  t("React", "frameworks", ["react.js", "reactjs"]),
  t("Next.js", "frameworks", ["nextjs", "next js"]),
  t("Vue.js", "frameworks", ["vue", "vuejs"]),
  t("Angular", "frameworks", ["angular.js", "angularjs"]),
  t("Svelte", "frameworks", ["sveltekit"]),
  t("Redux", "frameworks", ["redux toolkit", "rtk"]),
  t("Node.js", "frameworks", ["node", "nodejs", "node js"]),
  t("Express", "frameworks", ["express.js", "expressjs"]),
  t("NestJS", "frameworks", ["nest.js"]),
  t("Django", "frameworks"),
  t("Flask", "frameworks"),
  t("FastAPI", "frameworks", ["fast api"]),
  t("Spring", "frameworks", ["spring boot", "springboot"]),
  t("Ruby on Rails", "frameworks", ["rails", "ror"]),
  t("Laravel", "frameworks"),
  t(".NET", "frameworks", ["dotnet", "asp.net", "aspnet", ".net core"]),
  t("jQuery", "frameworks"),
  t("Tailwind CSS", "frameworks", ["tailwind", "tailwindcss"]),
  t("Bootstrap", "frameworks"),
  t("Sass", "frameworks", ["scss"]),
  t("Material UI", "frameworks", ["mui", "material-ui"]),
  t("React Native", "frameworks", ["react-native"]),
  t("Flutter", "frameworks"),
  t("Electron", "frameworks"),
  t("Three.js", "frameworks", ["threejs"]),
  t("pandas", "frameworks"),
  t("NumPy", "frameworks"),
  t("scikit-learn", "frameworks", ["sklearn", "scikit learn"]),
  t("TensorFlow", "frameworks", ["tensor flow"]),
  t("PyTorch", "frameworks", ["py torch"]),
  t("Keras", "frameworks"),
  t("Matplotlib", "frameworks"),
  t("Seaborn", "frameworks"),
  t("Spark", "frameworks", ["apache spark", "pyspark"]),
  t("Hadoop", "frameworks"),
  t("Prisma", "frameworks"),
  t("GraphQL", "frameworks", ["graph ql"]),
  t("gRPC", "frameworks"),

  // ── Databases ───────────────────────────────────────────────────────────────
  t("PostgreSQL", "databases", ["postgres", "psql", "postgre"]),
  t("MySQL", "databases", ["my sql"]),
  t("MongoDB", "databases", ["mongo", "mongoose"]),
  t("Redis", "databases"),
  t("SQLite", "databases"),
  t("Microsoft SQL Server", "databases", ["sql server", "mssql", "t-sql", "tsql"]),
  t("Oracle", "databases", ["oracle db", "pl/sql", "plsql"]),
  t("Cassandra", "databases", ["apache cassandra"]),
  t("DynamoDB", "databases", ["dynamo db"]),
  t("Elasticsearch", "databases", ["elastic search"]),
  t("Firebase", "databases", ["firestore"]),
  t("Supabase", "databases"),
  t("Snowflake", "databases"),
  t("BigQuery", "databases", ["big query"]),
  t("Neo4j", "databases"),

  // ── Cloud & DevOps ──────────────────────────────────────────────────────────
  t("AWS", "cloud", ["amazon web services", "ec2", "s3", "lambda", "cloudfront", "rds"]),
  t("Azure", "cloud", ["microsoft azure"]),
  t("Google Cloud", "cloud", ["gcp", "google cloud platform"]),
  t("Docker", "cloud", ["containerization", "containers"]),
  t("Kubernetes", "cloud", ["k8s", "kube"]),
  t("Terraform", "cloud", ["terraform iac"]),
  t("Ansible", "cloud"),
  t("Jenkins", "cloud"),
  t("GitHub Actions", "cloud", ["github action"]),
  t("GitLab CI", "cloud", ["gitlab ci/cd"]),
  t("CircleCI", "cloud", ["circle ci"]),
  t("CI/CD", "cloud", ["ci cd", "continuous integration", "continuous delivery", "continuous deployment"]),
  t("Nginx", "cloud"),
  t("Linux", "cloud", ["unix"]),
  t("Prometheus", "cloud"),
  t("Grafana", "cloud"),
  t("Kafka", "cloud", ["apache kafka"]),
  t("RabbitMQ", "cloud", ["rabbit mq"]),
  t("Serverless", "cloud", ["serverless framework"]),
  t("Vercel", "cloud"),
  t("Netlify", "cloud"),
  t("Heroku", "cloud"),
  t("Cloudflare", "cloud"),
  t("SageMaker", "cloud", ["aws sagemaker", "amazon sagemaker"]),
  t("Airflow", "cloud", ["apache airflow"]),
  t("dbt", "cloud", ["data build tool"]),

  // ── Tools & Platforms ───────────────────────────────────────────────────────
  t("Git", "tools", ["github", "gitlab", "version control"]),
  t("Vite", "tools"),
  t("Webpack", "tools"),
  t("Babel", "tools"),
  t("ESLint", "tools", ["es lint"]),
  t("Prettier", "tools"),
  t("npm", "tools", ["node package manager"]),
  t("Jest", "tools"),
  t("Vitest", "tools"),
  t("Cypress", "tools"),
  t("Playwright", "tools"),
  t("Selenium", "tools"),
  t("React Testing Library", "tools", ["testing library", "rtl testing"]),
  t("Storybook", "tools"),
  t("Postman", "tools"),
  t("Figma", "tools"),
  t("Jira", "tools"),
  t("Jupyter", "tools", ["jupyter notebook", "jupyter notebooks"]),
  t("Tableau", "tools"),
  t("Power BI", "tools", ["powerbi", "power-bi"]),
  t("Looker", "tools"),
  t("Excel", "tools", ["microsoft excel", "spreadsheets"]),
  t("Google Analytics", "tools", ["ga4"]),
  t("Sentry", "tools"),
  t("Datadog", "tools", ["data dog"]),

  // ── Concepts & Methods ──────────────────────────────────────────────────────
  t("REST APIs", "concepts", ["rest api", "restful", "rest", "restful api", "restful apis"]),
  t("Microservices", "concepts", ["micro-services", "microservice architecture"]),
  t("Data Structures", "concepts", ["data structures & algorithms", "dsa"]),
  t("Algorithms", "concepts", ["algorithm design"]),
  t("Object-Oriented Programming", "concepts", ["oop", "object oriented", "object-oriented design"]),
  t("Functional Programming", "concepts", ["fp"]),
  t("System Design", "concepts", ["systems design", "distributed systems"]),
  t("Machine Learning", "concepts", ["ml", "supervised learning", "unsupervised learning"]),
  t("Deep Learning", "concepts", ["neural networks", "dl"]),
  t("Natural Language Processing", "concepts", ["nlp"]),
  t("Computer Vision", "concepts", ["cv (computer vision)"]),
  t("Statistics", "concepts", ["statistical analysis", "stats"]),
  t("Data Visualization", "concepts", ["data viz", "dataviz"]),
  t("Data Modeling", "concepts", ["data modelling"]),
  t("ETL", "concepts", ["etl pipelines", "elt", "data pipelines"]),
  t("A/B Testing", "concepts", ["ab testing", "split testing", "experimentation"]),
  t("Feature Engineering", "concepts"),
  t("MLOps", "concepts", ["ml ops"]),
  t("Responsive Design", "concepts", ["responsive web design", "mobile-first"]),
  t("Accessibility", "concepts", ["a11y", "wcag", "web accessibility"]),
  t("Web Security", "concepts", ["owasp", "application security", "secure coding"]),
  t("Authentication", "concepts", ["auth", "jwt", "oauth", "oauth2", "sso", "authorization"]),
  t("Testing", "concepts", ["unit testing", "integration testing", "e2e testing", "test-driven development", "tdd", "automated testing"]),
  t("Agile", "concepts", ["agile/scrum", "scrum", "kanban", "agile methodologies"]),
  t("Design Patterns", "concepts"),
  t("Observability", "concepts", ["monitoring", "logging & monitoring"]),
  t("Infrastructure as Code", "concepts", ["iac"]),
  t("Web Performance", "concepts", ["performance optimization", "core web vitals"]),
  t("SEO", "concepts", ["search engine optimization"]),
  t("Networking", "concepts", ["tcp/ip", "computer networks", "dns"]),
  t("Operating Systems", "concepts", ["os fundamentals"]),
  t("Databases", "concepts", ["database design", "relational databases", "normalization"]),
  t("State Management", "concepts"),
  t("Prompt Engineering", "concepts", ["llm", "large language models", "generative ai", "rag"]),

  // ── Soft Skills ─────────────────────────────────────────────────────────────
  t("Communication", "soft_skills", ["written communication", "verbal communication"]),
  t("Collaboration", "soft_skills", ["teamwork", "cross-functional collaboration", "team player"]),
  t("Problem Solving", "soft_skills", ["problem-solving", "analytical thinking", "critical thinking"]),
  t("Leadership", "soft_skills", ["mentoring", "mentorship", "team leadership"]),
  t("Time Management", "soft_skills", ["prioritization"]),
  t("Stakeholder Management", "soft_skills", ["stakeholder communication"]),
  t("Attention to Detail", "soft_skills", ["detail-oriented"]),
  t("Adaptability", "soft_skills", ["flexibility"]),
  t("Storytelling with Data", "soft_skills", ["data storytelling"]),
];

/**
 * Build the alias → canonical lookup once at module load. Every alias (and the
 * canonical form itself) maps to its entry so extraction is a single pass.
 */
export interface CompiledAlias {
  surface: string;
  entry: TaxonomyEntry;
}

function buildAliasIndex(): CompiledAlias[] {
  const index: CompiledAlias[] = [];
  const seen = new Set<string>();
  for (const entry of TAXONOMY) {
    const surfaces = [entry.canonical, ...(entry.aliases ?? [])];
    for (const surface of surfaces) {
      const key = surface.toLowerCase();
      if (seen.has(key)) {
        // A duplicate alias across two entries is a data bug; keep the first and
        // let the taxonomy test surface it loudly rather than silently mis-map.
        continue;
      }
      seen.add(key);
      index.push({ surface, entry });
    }
  }
  // Longest surface first so multi-word forms win over their substrings
  // ("react native" is matched before "react"; "rest api" before "rest").
  return index.sort((a, b) => b.surface.length - a.surface.length);
}

export const ALIAS_INDEX = buildAliasIndex();

/** All canonical skill names, handy for tests and UI hints. */
export const CANONICAL_SKILLS = TAXONOMY.map((e) => e.canonical);

// Every surface form (canonical + aliases) → entry, so a lookup resolves aliases too
// ("JS" → JavaScript), not just exact canonical names.
const ENTRY_BY_SURFACE = new Map(
  ALIAS_INDEX.map(({ surface, entry }) => [surface.toLowerCase(), entry]),
);

export function lookupCanonical(name: string): TaxonomyEntry | undefined {
  return ENTRY_BY_SURFACE.get(name.toLowerCase());
}
