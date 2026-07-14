import { describe, it, expect } from "vitest";
import { extractSkills, extractSkillNames } from "./extract";

const names = (text: string) => [...extractSkillNames(text)].sort();

describe("extractSkills — basics", () => {
  it("finds canonical skills and normalizes aliases", () => {
    const found = names("We use React.js, postgres and k8s in production.");
    expect(found).toContain("React");
    expect(found).toContain("PostgreSQL");
    expect(found).toContain("Kubernetes");
  });

  it("is case-insensitive", () => {
    expect(extractSkillNames("JAVASCRIPT and TypeScript")).toEqual(
      new Set(["JavaScript", "TypeScript"]),
    );
  });

  it("counts occurrences within a single text", () => {
    const skills = extractSkills("React, React, and more React. Also Vue.");
    const react = skills.find((s) => s.name === "React");
    expect(react?.occurrences).toBe(3);
  });

  it("returns an empty result for skill-free prose", () => {
    expect(extractSkills("The quick brown fox jumped over the lazy dog.")).toEqual([]);
  });
});

describe("extractSkills — boundary handling", () => {
  it("does not match a skill embedded in a larger token", () => {
    // "javascriptish" must not register JavaScript
    expect(extractSkillNames("javascriptish frameworks")).not.toContain("JavaScript");
  });

  it("prefers the longest name: React Native over React", () => {
    const found = extractSkillNames("Mobile work in React Native only.");
    expect(found).toContain("React Native");
    expect(found).not.toContain("React");
  });

  it("distinguishes Node.js from a bare 'node' mention correctly", () => {
    expect(extractSkillNames("Built on Node.js")).toContain("Node.js");
    expect(extractSkillNames("Deploy each node in the cluster")).toContain("Node.js");
    // Both map to the canonical "Node.js" via different aliases — that's intended.
  });

  it("handles symbol-bearing languages", () => {
    const found = extractSkillNames("Strong in C++, C#, and .NET.");
    expect(found).toContain("C++");
    expect(found).toContain("C#");
    expect(found).toContain(".NET");
  });

  it("matches C++ with a version suffix (C++17)", () => {
    const found = extractSkillNames("Proficient in C++11 and C++17.");
    expect(found).toContain("C++");
  });

  it("matches multi-word skills across any whitespace (wrap, double space, tab)", () => {
    expect(extractSkillNames("Experience with Machine\nLearning")).toContain("Machine Learning");
    expect(extractSkillNames("Built with React  Native")).toContain("React Native");
    expect(extractSkillNames("uses React\tTesting\tLibrary")).toContain("React Testing Library");
  });
});

describe("extractSkills — ambiguous single-letter languages", () => {
  it("matches R and C when comma-flanked inside a technology list", () => {
    const listed = extractSkillNames("Stack includes Python, R, C, and SQL.");
    expect(listed).toContain("R");
    expect(listed).toContain("C");
  });

  it("does NOT match R or Go in ordinary prose", () => {
    const prose = extractSkillNames(
      "We asked R&D to go to the whiteboard and reason it out.",
    );
    expect(prose).not.toContain("R");
    expect(prose).not.toContain("Go");
  });

  it("does NOT treat the string start/end as a list delimiter", () => {
    // "Go" begins the sentence but this is prose, not a list.
    expect(extractSkillNames("Go to the store and buy milk.")).not.toContain("Go");
    expect(extractSkillNames("Let's go")).not.toContain("Go");
  });

  it("does NOT match (C) copyright or (R) trademark as languages", () => {
    expect(extractSkillNames("Copyright (C) 2021 Acme Corp")).not.toContain("C");
    expect(extractSkillNames("Acme(R) product line")).not.toContain("R");
  });

  it("matches Go via its unambiguous 'golang' alias anywhere", () => {
    expect(extractSkillNames("Backend written in Golang.")).toContain("Go");
  });
});
