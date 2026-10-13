import type { ExternalLink, Todo } from "./types";

export type TeamMember = {
  name: string;
  area: string;
};

export type AssetSource = {
  name: string;
  license?: string;
};

export type TechnicalChallenge = {
  title: string;
  body: string;
};

export type XrVideo = {
  provider: "youtube";
  title: string;
  /** Unlisted YouTube video. Absent until provided. */
  youtubeId?: string;
};

export type XrProject = {
  slug: string;
  title: string;
  fullTitle: string;
  context: string;
  repo: string;
  stack: readonly string[];
  roleSummary: string;
  spotlightBlurb: string;
  video: XrVideo;
  team: readonly TeamMember[];
  caseStudy: {
    problem: string;
    features: readonly string[];
    role: string;
    /** Do not write these until Manditha provides real ones. */
    technicalChallenges?: readonly TechnicalChallenge[];
    outcome: string;
    credits: {
      assetSources: readonly AssetSource[];
      creditsFile: ExternalLink;
    };
  };
  todos: readonly Todo[];
};

const repo = "https://github.com/Manditha77/ElectricalSafetyVR";

export const electricalSafetyVr: XrProject = {
  slug: "electrical-safety-vr",
  title: "ElectricalSafetyVR",
  fullTitle: "Electrical Workshop Safety Training Simulator",
  context:
    "University group project, INTE 42312 Virtual & Augmented Reality, University of Kelaniya, 2026",
  repo,
  stack: [
    "Unity 6 (URP)",
    "XR Interaction Toolkit 3",
    "OpenXR",
    "XR Device Simulator",
    "C#",
  ],
  roleSummary:
    "Environment design (the workshop room, outdoor yard, props, signage and placement hints), plus the final integration of every team member's work into one working build.",
  spotlightBlurb:
    "A VR training simulator where trainees learn electrical workshop safety by doing: they spot and fix hazards, put on the right PPE, replace a fuse and put out an electrical fire, all without real-world risk. I designed the environment and integrated the team's work into the final build.",
  video: {
    provider: "youtube",
    title: "Electrical Workshop Safety Training Simulator",
  },
  team: [],
  caseStudy: {
    problem:
      "Electrical workshop safety is best learned through practice, but practising with live hazards such as damaged leads, faulty fuses and electrical fires is dangerous. We built a VR workshop where trainees can make mistakes safely.",
    features: [
      "Spot and fix hazards around the workshop",
      "Gear up at a PPE station (goggles, gloves, ear defenders, safety boots)",
      "Replace a fuse, with a snap-fit interaction",
      "Dispose of the damaged fuse correctly",
      "Tackle an electrical fire with a CO₂ extinguisher",
      "Follow 3D spatial audio and voice guidance",
      "Read real-world safety signage, including a Safe Isolation poster",
      "Explore an outdoor yard as well as the workshop interior",
    ],
    role: "Environment design for the workshop and yard (layout, props, signs, boards and placement hints) and final integration, which meant bringing each teammate's scenes, scripts and interactions into a single build that runs end-to-end.",
    outcome:
      "Our lecturer recognised it as an excellent, fully working VR simulation compared with the other teams' projects.",
    credits: {
      assetSources: [
        { name: "Poly Haven", license: "CC0" },
        { name: "Poly Pizza" },
        { name: "Sketchfab", license: "CC BY 4.0" },
        { name: "CGTrader" },
        { name: "Unity Asset Store" },
      ],
      creditsFile: {
        label: "CREDITS.md",
        href: `${repo}/blob/HEAD/CREDITS.md`,
      },
    },
  },
  todos: [
    "TODO: video ID",
    "TODO: names and each person's area (all have agreed to be named).",
    "TODO: Manditha to confirm this framing.",
    "TODO: 2–3 real technical challenges from Manditha.",
  ],
};
