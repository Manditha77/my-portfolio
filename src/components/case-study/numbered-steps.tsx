import type { NumberedStep } from "@/content/xr";

type NumberedStepsProps = {
  steps: readonly NumberedStep[];
};

function stepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** An ordered list of titled steps, numbered 01, 02… in the mono accent. */
export function NumberedSteps({ steps }: NumberedStepsProps) {
  return (
    <ol role="list" className="mt-6 grid gap-5 sm:grid-cols-2">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span aria-hidden="true" className="shrink-0 pt-0.5 font-mono text-sm text-accent">
            {stepNumber(index)}
          </span>
          <div className="min-w-0">
            <p className="font-medium">{step.title}</p>
            <p className="mt-1 text-sm text-text-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

type SimpleStepsProps = {
  steps: readonly string[];
};

/** Short one-line instructions, numbered the same way. */
export function SimpleSteps({ steps }: SimpleStepsProps) {
  return (
    <ol role="list" className="mt-5 max-w-prose space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-4">
          <span aria-hidden="true" className="shrink-0 pt-0.5 font-mono text-sm text-accent">
            {stepNumber(index)}
          </span>
          <span className="min-w-0">{step}</span>
        </li>
      ))}
    </ol>
  );
}
