import { education, experience, experienceCopy, leadership } from "@/content/experience";
import { DateRange } from "@/components/ui/date-range";
import { Section } from "@/components/ui/section";
import { TagList } from "@/components/ui/tag";

export function Experience() {
  return (
    <Section id="experience">
      <ol role="list" className="mt-10 space-y-6">
        {experience.map((job, index) => {
          const headingId = `job-${index}`;
          return (
            <li key={`${job.company}-${job.start}`}>
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

                <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm marker:text-accent">
                  {job.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>

                <TagList tags={job.tech} label={experienceCopy.techLabel} className="mt-5" />
              </article>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{experienceCopy.leadershipHeading}</h3>
          <ol role="list" className="mt-4 divide-y divide-border border-y border-border">
            {leadership.map((item) => (
              <li key={`${item.event}-${item.role}`} className="flex gap-4 py-4">
                <time dateTime={item.year} className="shrink-0 pt-0.5 font-mono text-xs text-text-muted">
                  {item.year}
                </time>
                <div className="min-w-0">
                  <p className="font-medium">{item.role}</p>
                  <p className="mt-0.5 text-sm text-text-muted">
                    {item.event}, {item.organisation}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
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
      </div>
    </Section>
  );
}
