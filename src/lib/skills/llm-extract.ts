import Anthropic from "@anthropic-ai/sdk";
import { Skill, SkillCategory } from "@/types";
import { lookupCanonical } from "./taxonomy";
import { extractSkills } from "./extract";

/**
 * LLM-backed curriculum skill extraction.
 *
 * This is the "use AI only where it earns its keep" half of the hybrid engine. A
 * deterministic keyword matcher can only find skills that are literally named; a real
 * uploaded syllabus often *describes* skills in prose ("students build a single-page
 * app with a component framework"). Claude reads that intent and returns a normalized
 * skill list, which we then reconcile against the canonical taxonomy so the downstream
 * matcher — which is fully deterministic — compares like-for-like against the jobs.
 *
 * Two things make this robust rather than the fragile `JSON.parse(freeform)` it replaces:
 *   1. A forced tool call with a strict JSON Schema, so the model's output is validated
 *      to the shape we expect before it ever reaches our code.
 *   2. Reconciliation through the taxonomy, so LLM spelling drift ("React.js") collapses
 *      onto the same canonical name the deterministic side uses ("React").
 */

const CATEGORIES: SkillCategory[] = [
  "languages",
  "frameworks",
  "tools",
  "concepts",
  "soft_skills",
  "databases",
  "cloud",
  "other",
];

const SKILL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    skills: {
      type: "array",
      description:
        "Every distinct technical or professional skill the curriculum teaches.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            description:
              "The skill's common industry name (e.g. 'React', 'PostgreSQL', 'REST APIs'). Prefer the canonical spelling employers use.",
          },
          category: { type: "string", enum: CATEGORIES },
        },
        required: ["name", "category"],
      },
    },
  },
  required: ["skills"],
} as const;

const SYSTEM_PROMPT = `You are a curriculum analyst. Extract the concrete, resume-worthy skills an educational curriculum teaches.

Rules:
- Include a skill if the curriculum teaches it, even when it is only described in prose rather than named outright (e.g. "students build REST endpoints" implies "REST APIs").
- Use the common industry name employers would recognize; normalize spelling ("react.js" -> "React", "postgres" -> "PostgreSQL").
- Do NOT invent skills the text gives no evidence for. Precision matters more than volume.
- Categorize each skill into exactly one of: languages, frameworks, tools, concepts, databases, cloud, soft_skills, other.
- Report each distinct skill once.`;

/** The model used for extraction. Overridable so the app isn't pinned to one tier. */
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

interface RawSkill {
  name: string;
  category: string;
}

/**
 * Collapse an LLM-reported skill onto the canonical taxonomy where possible so it
 * matches the deterministic job-side extraction. Names the taxonomy doesn't know are
 * kept as-is (title-cased category preserved) — the LLM is allowed to surface skills
 * beyond our table; they simply can't be "covered" by a deterministic job match.
 */
function canonicalize(raw: RawSkill[]): Skill[] {
  const out = new Map<string, Skill>();
  for (const item of raw) {
    const name = item.name?.trim();
    if (!name) continue;

    // First, try a direct canonical/alias hit.
    const direct = lookupCanonical(name);
    if (direct) {
      out.set(direct.canonical, { name: direct.canonical, category: direct.category });
      continue;
    }

    // Then, let the deterministic extractor resolve embedded aliases
    // ("React.js", "Node JS") that lookupCanonical's exact match misses.
    const resolved = extractSkills(name);
    if (resolved.length > 0) {
      for (const r of resolved) out.set(r.name, { name: r.name, category: r.category });
      continue;
    }

    // Unknown to the taxonomy — keep the LLM's own name/category.
    const category = CATEGORIES.includes(item.category as SkillCategory)
      ? (item.category as SkillCategory)
      : "other";
    if (!out.has(name)) out.set(name, { name, category });
  }
  return [...out.values()];
}

/**
 * Extract curriculum skills via Claude. Throws on API/parse failure so the caller can
 * fall back to the deterministic extractor — the app never hard-depends on the LLM.
 */
export async function extractCurriculumSkillsLLM(
  curriculumText: string,
): Promise<Skill[]> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "report_skills",
        description: "Report the skills extracted from the curriculum.",
        input_schema: SKILL_SCHEMA as unknown as Anthropic.Tool.InputSchema,
        // Guarantees the model's tool input validates against the schema above.
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: "report_skills" },
    messages: [
      {
        role: "user",
        content: `Extract the skills taught by this curriculum:\n\n${curriculumText.slice(0, 40000)}`,
      },
    ],
  });

  // A truncated tool call would silently drop skills off the end of the list. Treat it
  // as a failure so the caller falls back to the (complete) deterministic extractor
  // rather than analyzing a partial skill set.
  if (response.stop_reason === "max_tokens") {
    throw new Error("LLM skill extraction was truncated (max_tokens)");
  }

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("LLM did not return a structured skill list");
  }
  const input = toolUse.input as { skills?: RawSkill[] };
  return canonicalize(input.skills ?? []);
}
