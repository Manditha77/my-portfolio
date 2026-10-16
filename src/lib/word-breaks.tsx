import { Fragment, type ReactNode } from "react";

/**
 * Adds <wbr> break opportunities at camel-case boundaries ("ElectricalSafetyVR" → Electrical·Safety·VR),
 * so a long single-word title can wrap on narrow screens. The text itself is unchanged.
 */
export function camelCaseBreaks(text: string): ReactNode {
  const parts = text.split(/(?<=[a-z])(?=[A-Z])/);
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <wbr />}
      {part}
    </Fragment>
  ));
}
