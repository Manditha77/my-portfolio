import type { IsoMonth } from "@/lib/dates";
import { formatMonth } from "@/lib/dates";

type DateRangeProps = {
  start: IsoMonth;
  /** Omitted for an ongoing range. */
  end?: IsoMonth;
  /** Label shown when there is no end date, e.g. "present". */
  presentLabel: string;
};

export function DateRange({ start, end, presentLabel }: DateRangeProps) {
  return (
    <>
      <time dateTime={start}>{formatMonth(start)}</time>
      {" – "}
      {end ? <time dateTime={end}>{formatMonth(end)}</time> : presentLabel}
    </>
  );
}
