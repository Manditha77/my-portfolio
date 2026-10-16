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
};

/** Home page sections, in page order. Ids double as anchor targets. */
export const homeSections = [
  { id: "top", label: "Intro", inNav: false },
  { id: "work", label: "Work", inNav: true },
  { id: "vr-ar", label: "VR/AR", inNav: true },
  { id: "experience", label: "Experience", inNav: true },
  { id: "writing", label: "Writing", inNav: false },
  { id: "skills", label: "Skills", inNav: false },
  { id: "about", label: "About", inNav: true },
  { id: "contact", label: "Contact", inNav: true },
] as const satisfies readonly HomeSection[];

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = homeSections
  .filter((section) => section.inNav)
  .map((section) => ({ label: section.label, href: `/#${section.id}` }));

export function sectionLabel(id: SectionId): string {
  return homeSections.find((section) => section.id === id)?.label ?? id;
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
};
