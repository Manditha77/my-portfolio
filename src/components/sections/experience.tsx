import { education, experience, experienceCopy, leadership } from "@/content/experience";
import { cardHover } from "@/components/ui/card";
import { CollapsibleTagList } from "@/components/ui/collapsible-tag-list";
import { DateRange } from "@/components/ui/date-range";
import { ExpandableList } from "@/components/ui/expandable-list";
import { ScanFrame } from "@/components/ui/scan-frame";
import { Section } from "@/components/ui/section";
import { StaggerItem, StaggerList } from "@/components/ui/stagger";
import { cx } from "@/lib/cx";

/*
 * Timeline: one thin line on the left (the wrapper's ::before, centred 6px in) with a dot per entry.
 * Dots are positioned against each li, offset back by the wrapper's padding so they sit on the line.
 */
const dot = "absolute rounded-full";
/** Shared by the Leadership and Education sub-headings. */
const subheading = "text-lg font-semibold tracking-tight";

export function Experience() {
  return (
    <Section id="experience">
      <div data-build-end className="relative mt-10 pl-6 before:absolute before:top-6 before:bottom-0 before:left-1.5 before:w-px before:-translate-x-1/2 before:bg-linear-to-b before:from-border before:from-90% before:to-transparent sm:pl-8">
        <StaggerList as="ol" role="list" className="space-y-6">
          {experience.map((job, index) => {
            const headingId = `job-${index}`;
            return (
              <StaggerItem key={`${job.company}-${job.start}`} className="relative">
                {/* Centred on the card's date line (border + padding + half a line of text-xs). */}
                <span
                  aria-hidden="true"
                  className={`${dot} top-5.75 -left-6 size-3 bg-accent ring-4 ring-bg sm:top-6.75 sm:-left-8`}
                />
                <article
                  aria-labelledby={headingId}
                  data-scan={headingId}
                  className={cx("relative rounded-lg border border-border bg-surface p-5 sm:p-6", cardHover)}
                >
                  <p className="font-mono text-xs text-text-muted">
                    <DateRange start={job.start} end={job.end} presentLabel={experienceCopy.present} />
                    {job.location ? <> · {job.location}</> : null}
                  </p>

                  <h3 id={headingId} className="mt-3 text-xl font-semibold tracking-tight">
                    {job.role}
                  </h3>
                  <p className="mt-1 font-medium">{job.company}</p>
                  <p className="mt-3 max-w-measure text-text-muted">{job.product}</p>

                  <ExpandableList
                    items={job.bullets}
                    shown={job.bulletsShown ?? job.bullets.length}
                    showAllLabel={experienceCopy.showAll(job.bullets.length)}
                    showFewerLabel={experienceCopy.showFewer}
                    className="mt-5"
                  />

                  <CollapsibleTagList tags={job.tech} label={experienceCopy.techLabel} className="mt-5" />

                  <ScanFrame />
                </article>
              </StaggerItem>
            );
          })}
        </StaggerList>

        <h3 data-build-clear className={`mt-10 ${subheading}`}>
          {experienceCopy.leadershipHeading}
        </h3>
        <StaggerList as="ol" role="list" className="mt-4 space-y-6">
          {leadership.map((item) => (
            <StaggerItem key={`${item.event}-${item.role}`} data-build-clear className="relative">
              {/* Centred on the year line. */}
              <span
                aria-hidden="true"
                className={`${dot} top-1 -left-5.5 size-2 border border-accent bg-bg sm:-left-7.5`}
              />
              <time dateTime={item.year} className="block font-mono text-xs text-text-muted">
                {item.year}
              </time>
              <p className="mt-1 font-medium">{item.role}</p>
              <p className="mt-0.5 max-w-measure text-sm text-text-muted">
                {item.event}, {item.organisation}
              </p>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>

      {/* Off the timeline (no dot), but indented to the same content column as the entries above. */}
      <div data-build-clear className="mt-12 pl-6 sm:pl-8 lg:w-1/2 lg:pr-5">
        <h3 className={subheading}>{experienceCopy.educationHeading}</h3>
        <ul role="list" className="mt-4 divide-y divide-border border-y border-border">
          {education.map((entry) => (
            <li key={entry.degree} className="py-4">
              <p className="font-medium">{entry.degree}</p>
              <p className="mt-0.5 text-sm text-text-muted">{entry.institution}</p>
              <p className="mt-2 font-mono text-xs text-text-muted">
                <DateRange start={entry.start} end={entry.end} presentLabel={experienceCopy.present} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
