import { education, experience, experienceCopy, leadership } from "@/content/experience";
import { CollapsibleTagList } from "@/components/ui/collapsible-tag-list";
import { DateRange } from "@/components/ui/date-range";
import { Section } from "@/components/ui/section";

/*
 * Timeline: one thin line on the left (the wrapper's ::before, centred 6px in) with a dot per entry.
 * Dots are positioned against each li, offset back by the wrapper's padding so they sit on the line.
 */
const dot = "absolute rounded-full";

export function Experience() {
  return (
    <Section id="experience">
      <div className="relative mt-10 pl-6 before:absolute before:top-6 before:bottom-0 before:left-1.5 before:w-px before:-translate-x-1/2 before:bg-linear-to-b before:from-border before:from-90% before:to-transparent sm:pl-8">
        <ol role="list" className="space-y-6">
          {experience.map((job, index) => {
            const headingId = `job-${index}`;
            return (
              <li key={`${job.company}-${job.start}`} className="relative">
                {/* Centred on the card's date line (border + padding + half a line of text-xs). */}
                <span
                  aria-hidden="true"
                  className={`${dot} top-5.75 -left-6 size-3 bg-accent ring-4 ring-bg sm:top-6.75 sm:-left-8`}
                />
                <article
                  aria-labelledby={headingId}
                  className="rounded-lg border border-border bg-surface p-5 transition-colors duration-200 ease-out focus-within:border-accent hover:border-accent/60 sm:p-6"
                >
                  <p className="font-mono text-xs text-text-muted">
                    <DateRange start={job.start} end={job.end} presentLabel={experienceCopy.present} />
                    {job.location ? <> · {job.location}</> : null}
                  </p>

                  <h3 id={headingId} className="mt-3 text-xl font-semibold tracking-tight">
                    {job.role}
                  </h3>
                  <p className="mt-1 font-medium">{job.company}</p>
                  <p className="mt-3 max-w-prose text-text-muted">{job.product}</p>

                  <ul className="mt-5 max-w-measure list-disc space-y-1.5 pl-5 text-sm marker:text-accent">
                    {job.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>

                  <CollapsibleTagList tags={job.tech} label={experienceCopy.techLabel} className="mt-5" />
                </article>
              </li>
            );
          })}
        </ol>

        <h3 className="mt-10 font-mono text-xs text-text-muted">{experienceCopy.leadershipHeading}</h3>
        <ol role="list" className="mt-4 space-y-6">
          {leadership.map((item) => (
            <li key={`${item.event}-${item.role}`} className="relative">
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
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 lg:w-1/2 lg:pr-5">
        <h3 className="text-lg font-semibold tracking-tight">{experienceCopy.educationHeading}</h3>
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
