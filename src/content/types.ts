/** A visible placeholder for content Manditha still has to provide. */
export type Todo = `TODO: ${string}`;

export type ExternalLink = {
  label: string;
  href: string;
};

/** Screenshots and diagrams, rendered with next/image. */
export type ContentImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};
