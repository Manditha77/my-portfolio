import { skillGroups } from "@/content/skills";
import { Section } from "@/components/ui/section";
import { StaggerItem, StaggerList } from "@/components/ui/stagger";
import { TagList } from "@/components/ui/tag";

export function Skills() {
  return (
    <Section id="skills">
      <StaggerList data-build-end role="list" className="mt-10 grid gap-6 md:grid-cols-2">
        {skillGroups.map((group, index) => {
          const headingId = `skills-group-${index}`;
          return (
            <StaggerItem
              key={group.label}
              aria-labelledby={headingId}
              className="rounded-lg border border-border bg-surface p-5 light:shadow-card"
            >
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
