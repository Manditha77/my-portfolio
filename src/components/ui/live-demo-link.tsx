import { xrCopy } from "@/content/xr";
import { ButtonLink } from "./button-link";

type LiveDemoLinkProps = {
  href: string;
};

/** "Try it live" for a browser-based XR demo: opens in a new tab and says where it runs. */
export function LiveDemoLink({ href }: LiveDemoLinkProps) {
  return (
    <ButtonLink href={href} target="_blank" rel="noopener noreferrer">
      {xrCopy.liveDemoCta}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">,</span>
      <span className="rounded-sm border border-accent-contrast/40 px-1.5 font-mono text-xs leading-5">
        {xrCopy.liveDemoHint}
      </span>
      <span className="sr-only"> {xrCopy.opensNewTab}</span>
    </ButtonLink>
  );
}
