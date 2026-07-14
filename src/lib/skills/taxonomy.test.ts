import { describe, it, expect } from "vitest";
import { TAXONOMY, ALIAS_INDEX, lookupCanonical } from "./taxonomy";

describe("taxonomy integrity", () => {
  it("has no duplicate canonical names", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const e of TAXONOMY) {
      const key = e.canonical.toLowerCase();
      if (seen.has(key)) dupes.push(e.canonical);
      seen.add(key);
    }
    expect(dupes).toEqual([]);
  });

  it("has no alias colliding across two different entries", () => {
    const owner = new Map<string, string>();
    const collisions: string[] = [];
    for (const e of TAXONOMY) {
      for (const surface of [e.canonical, ...(e.aliases ?? [])]) {
        const key = surface.toLowerCase();
        const existing = owner.get(key);
        if (existing && existing !== e.canonical) {
          collisions.push(`"${surface}" claimed by ${existing} and ${e.canonical}`);
        }
        owner.set(key, e.canonical);
      }
    }
    expect(collisions).toEqual([]);
  });

  it("never lists a canonical name inside its own aliases", () => {
    for (const e of TAXONOMY) {
      const aliases = (e.aliases ?? []).map((a) => a.toLowerCase());
      expect(aliases).not.toContain(e.canonical.toLowerCase());
    }
  });

  it("sorts the alias index longest-surface-first (so multi-word wins)", () => {
    for (let i = 1; i < ALIAS_INDEX.length; i++) {
      expect(ALIAS_INDEX[i - 1].surface.length).toBeGreaterThanOrEqual(
        ALIAS_INDEX[i].surface.length,
      );
    }
  });

  it("resolves canonical names and aliases case-insensitively", () => {
    expect(lookupCanonical("javascript")?.canonical).toBe("JavaScript");
    expect(lookupCanonical("JS")?.canonical).toBe("JavaScript");
    expect(lookupCanonical("postgres")?.canonical).toBe("PostgreSQL");
    expect(lookupCanonical("totally-unknown-skill")).toBeUndefined();
  });
});
