import type { ExternalLink, Todo } from "./types";

export type Site = {
  name: string;
  fullName: string;
  role: string;
  headline: string;
  status: string;
  /** City level only. Never add a street address or phone number. */
  location: string;
  email: string;
  cvHref: string;
  links: {
    github: ExternalLink;
    linkedin: ExternalLink;
    medium: ExternalLink;
    githubRepos: ExternalLink;
  };
  hero: {
    intro: string;
    statusPill: string;
    ctas: {
      viewWork: string;
      downloadCv: string;
      github: string;
      linkedin: string;
    };
  };
  contact: {
    heading: string;
    line: string;
  };
  todos: readonly Todo[];
};

export const site: Site = {
  name: "Manditha Madushanka",
  fullName: "Manditha Madushanka Athukorala",
  role: "Software Engineer",
  headline: "Software Engineer · building VR/AR on the side",
  status: "Open to Associate Software Engineer roles",
  location: "Colombo, Sri Lanka",
  email: "manditha77madushanka@gmail.com",
  cvHref: "/Manditha-Madushanka-CV.pdf",
  links: {
    github: { label: "GitHub", href: "https://github.com/Manditha77" },
    linkedin: {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/manditha-madushanka-455145281",
    },
    medium: { label: "Medium", href: "https://medium.com/@manditha77madushanka" },
    githubRepos: {
      label: "More on GitHub",
      href: "https://github.com/Manditha77?tab=repositories",
    },
  },
  hero: {
    intro:
      "Final-year IT undergraduate at the University of Kelaniya. I build full-stack systems with Java, Spring Boot and React, most recently as a Software Engineer Intern on aeroPORT, a Departure Control System used by Air Arabia.",
    statusPill: "Open to Associate Software Engineer roles",
    ctas: {
      viewWork: "View my work",
      downloadCv: "Download CV",
      github: "GitHub",
      linkedin: "LinkedIn",
    },
  },
  contact: {
    heading: "Let's talk",
    line: "I'm open to Associate Software Engineer roles, and to XR collaborations. The fastest way to reach me is by email.",
  },
  todos: [],
};
