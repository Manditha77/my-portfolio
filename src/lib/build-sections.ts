import type { ShapeKey } from "./build-shapes";

/*
 * "The Build": which shape each home section gets (CLAUDE.md §6). Its own module so the header mark can
 * use it without pulling in the voxel data. Sections not listed get no shape.
 */
export const SHAPE_BY_SECTION: Readonly<Record<string, ShapeKey>> = {
  top: "cube",
  work: "stack",
  "vr-ar": "headset",
  experience: "plane",
  writing: "book",
  skills: "tiles",
  about: "person",
  contact: "envelope",
};
