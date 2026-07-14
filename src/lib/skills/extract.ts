import { SkillCategory } from "@/types";
import { ALIAS_INDEX, CompiledAlias } from "./taxonomy";

export interface ExtractedSkill {
  /** Canonical skill name. */
  name: string;
  category: SkillCategory;
  /** How many times the skill was mentioned in the analyzed text. */
  occurrences: number;
}

/**
 * Characters that count as part of a "technical token". A match must not be flanked
 * by any of these. We deliberately exclude `.` and `/`: a skill at the end of a
 * sentence ("…in Golang.") must still match, and the `node`-inside-`node.js` case is
 * handled by longest-surface-first span masking, not by the boundary. `+`/`#` stay so
 * `C` never fires inside `C++`/`C#`.
 */
const TOKEN_CHAR = "a-z0-9+#";

/**
 * Punctuation that signals a delimited list of technologies. Used to accept the
 * genuinely ambiguous one/two-letter languages (C, R, Go) only when they sit in a
 * list — e.g. "Python, R, SQL" or "C/C++" — instead of in ordinary prose. Parentheses
 * are deliberately excluded: "(C)" (copyright) and "(R)" (trademark) are far more
 * common than a parenthesized language.
 */
const LIST_DELIMS = new Set([",", "/", "|", ";", "•", "·", "\n", "\t"]);

/** A cache of compiled matchers keyed by surface form — built lazily, once. */
const matcherCache = new Map<string, RegExp>();

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matcherFor(surface: string): RegExp {
  let re = matcherCache.get(surface);
  if (!re) {
    // A space in a multi-word skill matches any whitespace run, so line-wrapped,
    // double-spaced, tab- or NBSP-separated forms ("React  Native", "Machine\nLearning")
    // are still recognized.
    const body = escapeRegExp(surface).replace(/ /g, "\\s+");
    // Fixed-width lookbehind/lookahead reject matches embedded in a larger token.
    re = new RegExp(`(?<![${TOKEN_CHAR}])${body}(?![${TOKEN_CHAR}])`, "gi");
    matcherCache.set(surface, re);
  }
  re.lastIndex = 0;
  return re;
}

// Sentinel for a true string edge — NOT a list delimiter, so a bare ambiguous token at
// the very start/end of the text (e.g. "Go to the store") is not mistaken for a list item.
const EDGE = "\x00";

/** True when a bare ambiguous token (C/R/Go) is flanked by list punctuation. */
function inListContext(text: string, start: number, end: number): boolean {
  let l = start - 1;
  while (l >= 0 && text[l] === " ") l--;
  let r = end;
  while (r < text.length && text[r] === " ") r++;
  const left = l >= 0 ? text[l] : EDGE;
  const right = r < text.length ? text[r] : EDGE;
  return LIST_DELIMS.has(left) || LIST_DELIMS.has(right);
}

interface Span {
  start: number;
  end: number;
}

function overlaps(spans: Span[], start: number, end: number): boolean {
  for (const s of spans) {
    if (start < s.end && end > s.start) return true;
  }
  return false;
}

/**
 * Extract the canonical skills mentioned in a block of text.
 *
 * Single deterministic pass over the alias index (already sorted longest-surface-first),
 * masking consumed spans so the longest name wins: "React Native" is recognized as
 * itself, not as "React" + "Native". Ambiguous short languages are gated behind a
 * list-context check to keep precision high.
 *
 * Fully deterministic and dependency-free — the same input always yields the same
 * output, which is what makes the engine unit-testable.
 */
export function extractSkills(text: string): ExtractedSkill[] {
  const consumed: Span[] = [];
  const counts = new Map<string, { alias: CompiledAlias; count: number }>();

  for (const alias of ALIAS_INDEX) {
    const isBareAmbiguous = alias.entry.ambiguous && alias.surface.length <= 2;
    const re = matcherFor(alias.surface);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (overlaps(consumed, start, end)) continue;
      if (isBareAmbiguous && !inListContext(text, start, end)) continue;
      consumed.push({ start, end });
      const key = alias.entry.canonical;
      const existing = counts.get(key);
      if (existing) existing.count += 1;
      else counts.set(key, { alias, count: 1 });
    }
  }

  return [...counts.values()]
    .map(({ alias, count }) => ({
      name: alias.entry.canonical,
      category: alias.entry.category,
      occurrences: count,
    }))
    .sort((a, b) => b.occurrences - a.occurrences || a.name.localeCompare(b.name));
}

/** Convenience: just the set of canonical skill names present in the text. */
export function extractSkillNames(text: string): Set<string> {
  return new Set(extractSkills(text).map((s) => s.name));
}
