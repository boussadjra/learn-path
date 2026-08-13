import type { CanonicalSkill } from "../skills/registry.js";

export function renderSkillList(skills: CanonicalSkill[]): string {
  const lines = ["Learn Path skills", ""];
  for (const skill of skills) {
    const summary = skill.description.replace(/\s+Use when[\s\S]*$/i, "").trim();
    lines.push(skill.name, `  ${summary}`, "");
  }
  return lines.join("\n").trimEnd();
}
