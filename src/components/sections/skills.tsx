import { skillGroups } from "@/content/skills";
import { Section } from "@/components/ui/section";
import { StaggerItem, StaggerList } from "@/components/ui/stagger";
import { TagList } from "@/components/ui/tag";

export function Skills() {
  return (
    <Section id="skills">
      <StaggerList role="list" className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {skillGroups.map((group, index) => {
          const headingId = `skills-group-${index}`;
          return (
            <StaggerItem key={group.label} aria-labelledby={headingId}>
              <h3 id={headingId} className="font-mono text-xs uppercase tracking-wide text-text-muted">
                {group.label}
              </h3>
              <TagList tags={group.items} tone={group.tone} className="mt-3" />
            </StaggerItem>
          );
        })}
      </StaggerList>
    </Section>
  );
}
