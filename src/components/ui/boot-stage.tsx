/**
 * The cube boot's stage (src/lib/boot.ts): a faint glow on the horizon, behind everything, shown only while
 * the boot plays. It also carries the boot's clock, a no-op animation that lasts the whole intro; when it
 * ends, the init script marks the boot finished. All CSS (.boot-stage in globals.css).
 */
export function BootStage() {
  return <div aria-hidden="true" className="boot-stage" />;
}
