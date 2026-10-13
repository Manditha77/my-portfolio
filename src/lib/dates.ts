/** An ISO year ("2023") or year-month ("2025-07"); valid as a `<time dateTime>` value. */
export type IsoMonth = `${number}-${number}` | `${number}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "2025-07" → "Jul 2025", "2023" → "2023". No Date/Intl, so output never depends on time zone or locale. */
export function formatMonth(value: IsoMonth): string {
  const [year, month] = value.split("-");
  const name = month ? MONTHS[Number(month) - 1] : undefined;
  return name ? `${name} ${year}` : year;
}
