/** A visible placeholder for content Manditha still has to provide. */
export type Todo = `TODO: ${string}`;

export type ExternalLink = {
  label: string;
  href: string;
};

/** A titled step in a numbered list ("What trainees do", "How it plays", "How it works"). */
export type NumberedStep = {
  title: string;
  body: string;
};

/** Screenshots and diagrams, rendered with next/image. */
export type ContentImage = {
  src: string;
  alt: string;
  /** A short visible title for a gallery tile, so it doesn't repeat the alt text. Falls back to `alt`. */
  caption?: string;
  width: number;
  height: number;
};
