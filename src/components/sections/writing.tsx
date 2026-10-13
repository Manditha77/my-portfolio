import { articles, writingCopy } from "@/content/writing";
import { Section } from "@/components/ui/section";
import { formatMonth } from "@/lib/dates";

export function Writing() {
  return (
    <Section id="writing" compact>
      <ol role="list" className="mt-6 grid gap-4 md:grid-cols-2">
        {articles.map((article, index) => {
          const headingId = `article-${index}`;
          const splitAt = article.title.lastIndexOf(" ") + 1;
          const leading = article.title.slice(0, splitAt);
          const lastWord = article.title.slice(splitAt);
          return (
            <li key={article.url}>
              <article
                aria-labelledby={headingId}
                className="h-full rounded-lg border border-border p-5 transition-colors duration-150 focus-within:border-accent hover:border-accent"
              >
                <p className="font-mono text-xs text-text-muted">
                  <time dateTime={article.published}>{formatMonth(article.published)}</time>
                </p>
                <h3 id={headingId} className="mt-2 text-base font-semibold tracking-tight">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="-mx-1 inline-block rounded-sm px-1 py-1.5 hover:text-accent"
                  >
                    {leading}
                    {/* Keep the arrow on the same line as the last word. */}
                    <span className="whitespace-nowrap">
                      {lastWord}{" "}
                      <span aria-hidden="true" className="text-accent">
                        ↗
                      </span>
                    </span>
                    <span className="sr-only"> {writingCopy.opensMedium}</span>
                  </a>
                </h3>
                <p className="mt-1 text-sm text-text-muted">{article.summary}</p>
              </article>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
