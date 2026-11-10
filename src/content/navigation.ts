export type SectionId =
  | "top"
  | "work"
  | "vr-ar"
  | "experience"
  | "writing"
  | "skills"
  | "about"
  | "contact";

export type HomeSection = {
  id: SectionId;
  label: string;
  inNav: boolean;
  /** Small mono label shown above the section heading (numbered automatically); none for the hero. */
  eyebrow?: string;
};

/** Home page sections, in page order. Ids double as anchor targets. */
export const homeSections = [
  { id: "top", label: "Intro", inNav: false },
  { id: "work", label: "Work", inNav: true, eyebrow: "Work" },
  { id: "vr-ar", label: "VR/AR", inNav: true, eyebrow: "VR / AR" },
  { id: "experience", label: "Experience", inNav: true, eyebrow: "Experience" },
  { id: "writing", label: "Writing", inNav: false, eyebrow: "Writing" },
  { id: "skills", label: "Skills", inNav: false, eyebrow: "Skills" },
  { id: "about", label: "About", inNav: true, eyebrow: "About" },
  { id: "contact", label: "Contact", inNav: true, eyebrow: "Contact" },
] as const satisfies readonly HomeSection[];

export const homeSectionIds: readonly SectionId[] = homeSections.map((section) => section.id);

export type NavItem = { id: SectionId; label: string; href: string };

export const primaryNav: NavItem[] = homeSections
  .filter((section) => section.inNav)
  .map((section) => ({ id: section.id, label: section.label, href: `/#${section.id}` }));

export function sectionLabel(id: SectionId): string {
  return homeSections.find((section) => section.id === id)?.label ?? id;
}

/** "01 / Work", numbered by position among the labelled sections, so reordering keeps numbers right. */
export function sectionEyebrow(id: SectionId): string | undefined {
  const labelled = (homeSections as readonly HomeSection[]).filter((section) => section.eyebrow);
  const index = labelled.findIndex((section) => section.id === id);
  if (index === -1) return undefined;
  return `${String(index + 1).padStart(2, "0")} / ${labelled[index].eyebrow}`;
}

/** Interface strings used by the layout shell. */
export const shellCopy = {
  skipLink: "Skip to content",
  primaryNavLabel: "Primary",
  cv: "CV",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  switchToLight: "Switch to light theme",
  switchToDark: "Switch to dark theme",
  backToTop: "Back to top",
  tagsMore: (count: number) => `+${count} more`,
  tagsShowMore: (count: number) => `Show ${count} more technologies`,
  tagsShowLess: "Show less",
};
