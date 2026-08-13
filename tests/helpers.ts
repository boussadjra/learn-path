import { requiredHeadings } from "../scripts/validate-skills.js";

export function validSkill(name: string, description = "Guides a useful learning behavior for real technical work."): string {
  const sections = requiredHeadings.map((heading) => `## ${heading}\n\nContent for ${heading.toLowerCase()}.`).join("\n\n");
  return `---\nname: ${name}\ndescription: >\n  ${description}\nlicense: MIT\nmetadata:\n  learn-path-version: "0.1.0"\n  learn-path-skill: "true"\n  category: learning\n---\n\n# ${name}\n\n${sections}\n`;
}
