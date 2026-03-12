"use client";

import { Badge } from "@/components/ui/badge";
import { Skill, JobSkill, SkillCategory } from "@/types";

const categoryLabels: Record<SkillCategory, string> = {
  languages: "Languages",
  frameworks: "Frameworks & Libraries",
  tools: "Tools & Platforms",
  concepts: "Concepts & Methods",
  soft_skills: "Soft Skills",
  databases: "Databases",
  cloud: "Cloud & DevOps",
  other: "Other",
};

const categoryColors: Record<SkillCategory, string> = {
  languages: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  frameworks: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  tools: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  concepts: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  soft_skills: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  databases: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  cloud: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  other: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

function groupByCategory<T extends Skill>(skills: T[]) {
  const groups: Partial<Record<SkillCategory, T[]>> = {};
  for (const skill of skills) {
    const cat = skill.category as SkillCategory;
    if (!groups[cat]) groups[cat] = [];
    groups[cat]!.push(skill);
  }
  return groups;
}

interface SkillListProps {
  skills: Skill[] | JobSkill[];
  showFrequency?: boolean;
  emptyMessage?: string;
}

export function SkillList({ skills, showFrequency, emptyMessage }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        {emptyMessage || "No skills found"}
      </p>
    );
  }

  const groups = groupByCategory(skills);

  return (
    <div className="space-y-5">
      {(Object.entries(groups) as [SkillCategory, (Skill | JobSkill)[]][]).map(
        ([category, items]) => (
          <div key={category}>
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2.5">
              {categoryLabels[category] || category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {items.map((skill) => (
                <Badge
                  key={skill.name}
                  variant="outline"
                  className={`${categoryColors[category]} rounded-lg text-xs font-medium px-2.5 py-1`}
                >
                  {skill.name}
                  {showFrequency && "frequency" in skill && (
                    <span className="ml-1 opacity-60">
                      {Math.round((skill as JobSkill).frequency * 100)}%
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
