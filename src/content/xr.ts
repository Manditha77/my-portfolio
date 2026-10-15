import type { ContentImage, ExternalLink, Todo } from "./types";

export type TeamMember = {
  name: string;
  area: string;
  /** Manditha himself; left out of the "Built with" line. */
  isMe?: boolean;
};

export type TraineeStep = {
  title: string;
  body: string;
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
  platform: string;
  repo: string;
  stack: readonly string[];
  spotlightBlurb: string;
  video: XrVideo;
  images: {
    overview: ContentImage;
    /** All screenshots, in story order. */
    gallery: readonly ContentImage[];
  };
  team: readonly TeamMember[];
  caseStudy: {
    problem: string;
    traineeSteps: readonly TraineeStep[];
    alsoIncluded: string;
    role: readonly string[];
    technicalChallenges: readonly TechnicalChallenge[];
    outcome: string;
    credits: {
      assets: string;
      creditsFile: ExternalLink;
    };
  };
  todos: readonly Todo[];
};

const repo = "https://github.com/Manditha77/ElectricalSafetyVR";
const imageDir = "/images/xr/electrical-safety-vr";

const overview: ContentImage = {
  src: `${imageDir}/overview.png`,
  alt: "VR electrical workshop with a welcome board, a PPE station and a workbench",
  width: 1910,
  height: 1070,
};

export const electricalSafetyVr: XrProject = {
  slug: "electrical-safety-vr",
  title: "ElectricalSafetyVR",
  fullTitle: "Electrical Workshop Safety Training Simulator",
  context:
    "University group project, INTE 42312 Virtual & Augmented Reality, University of Kelaniya. Team of 5, completed October 2026.",
  platform: "Windows build (OpenXR); developed and demonstrated with the XR Device Simulator.",
  repo,
  stack: ["Unity 6 (URP)", "XR Interaction Toolkit 3", "OpenXR", "XR Device Simulator", "C#"],
  spotlightBlurb:
    "A VR training simulator where trainees learn electrical workshop safety by doing. They put on the right PPE, find and make safe hazards against the clock, then isolate, prove dead and replace a blown fuse in the correct order, and get a scored result at the end. I built the indoor workshop and integrated our five-person team's work into the final build.",
  video: {
    provider: "youtube",
    title: "Electrical Workshop Safety Training Simulator demo",
  },
  images: {
    overview,
    gallery: [
      overview,
      {
        src: `${imageDir}/ppe.png`,
        alt: "Trainee picking up an insulated glove at the PPE station, with a PPE progress counter",
        width: 1898,
        height: 1069,
      },
      {
        src: `${imageDir}/hazard.png`,
        alt: "Wet-floor hazard beside Workstation 2 with a risk panel and the Safe Isolation steps poster",
        width: 1910,
        height: 1073,
      },
      {
        src: `${imageDir}/fuse-snap.png`,
        alt: "Fitting a new fuse into Workstation 2, with the damaged-parts bin beside it",
        width: 1877,
        height: 1057,
      },
      {
        src: `${imageDir}/results.png`,
        alt: "Training results screen showing a pass, 6 of 6 job steps, 4 of 4 hazards and zero unsafe actions",
        width: 1911,
        height: 1076,
      },
    ],
  },
  team: [
    { name: "Manditha Madushanka", area: "environment design and integration", isMe: true },
    { name: "Dulmi", area: "interactions" },
    { name: "Sanduni", area: "electrical safety hazards" },
    { name: "Dinan", area: "game flow" },
    { name: "Ridmi", area: "workshop scene" },
  ],
  caseStudy: {
    problem:
      "Electrical workshop safety is best learned through practice, but practising with live hazards is dangerous. For our Virtual & Augmented Reality module, we built a VR workshop where trainees put on the right PPE, spot and fix hazards, and replace a blown fuse in the correct, safe order, and where a mistake costs nothing.",
    traineeSteps: [
      {
        title: "Pre-work check",
        body: "Put on all six PPE items at the PPE station before starting.",
      },
      {
        title: "Hazard check against the clock",
        body: "Two minutes to find and make safe four hazards: a loose metal tool, an overloaded power strip, a wet floor and a live damaged lead. Missed hazards flash red and explain the risk and what should have been done.",
      },
      {
        title: "The job, by the Safe Isolation procedure",
        body: "Isolate the correct workstation (W2), lock off with a DANGER tag, prove the tester, test for dead at the test point (0 V), replace the blown fuse, dispose of the damaged fuse, and restore power.",
      },
      {
        title: "Results",
        body: "A pass grade with the job score, time, unsafe actions and specific feedback, such as “Wrong isolator! W1 feeds Workstation 1.”",
      },
    ],
    alsoIncluded:
      "Also in the simulator: an electrical fire task with a CO₂ extinguisher, a power cut with an emergency torch, 3D spatial audio and voice guidance, real-world safety signage including a Safe Isolation poster, and an outdoor yard.",
    role: [
      "Built the indoor workshop environment.",
      "Integrated the team's work: merged five members' branches into one working build and fixed the integration bugs (fuse snap-fit, PPE grabbing, build setup).",
      "Added two finishing touches: a disposal bin for the damaged fuse, and a 3D spatial sound for opening and closing the fuse cover, generated in code.",
    ],
    technicalChallenges: [
      {
        title: "Merging five branches into one build",
        body: "Each teammate worked on their own Git branch, with their own scenes, prefabs and references. I merged everything into one main scene and wrote small Unity editor tools (menu commands) that applied each of my changes with a matching revert, so I could try integration fixes without risking anyone else's work. The first build opened to an empty scene; the cause was the wrong scene in Build Profiles, fixed by setting the main scene at index 0.",
      },
      {
        title: "PPE that couldn't be grabbed",
        body: "After the PPE shelf was moved, the gloves, goggles and ear defenders stopped responding to the controller ray. The shelf's solid box collider now enclosed the items, so the ray hit the shelf first. I wrote an editor tool that finds furniture colliders enclosing grabbable items and switches them to triggers, which XR rays ignore, leaving everything else unchanged.",
      },
      {
        title: "A fuse snap-fit that is forgiving but still safe",
        body: "Lining a small fuse up with its holder in VR was fiddly and often failed. I added a snap-assist: if the new fuse is released within about 20 cm of the holder, with the cover open and the blown fuse already removed, it snaps into place, locks and completes the task once. It's easy for the trainee, but it still enforces the correct safety order.",
      },
    ],
    outcome:
      "Our lecturer recognised it as an excellent, fully working VR simulation compared with the other teams' projects.",
    credits: {
      assets:
        "Third-party 3D models, textures and audio from Poly Haven (CC0), Poly Pizza, Sketchfab (CC BY 4.0), CGTrader, the Unity Asset Store and Pixabay; voice-guidance clips made with AI text-to-speech.",
      creditsFile: {
        label: "Full list in the repo's CREDITS.md",
        href: `${repo}/blob/HEAD/CREDITS.md`,
      },
    },
  },
  todos: ["TODO: video ID (to be uploaded)"],
};

/** Interface strings for the VR / AR Projects section and the case study page. */
export const xrCopy = {
  heading: "VR / AR Projects",
  subtitle: "Side work in virtual and augmented reality, built with Unity and OpenXR.",
  caseStudyCta: "Read the case study",
  repoCta: "View code on GitHub",
  stackLabel: "Tech stack",
  videoComingSoon: "Demo video coming soon",
  playVideo: "Play video:",
  backToHome: "Back to home",
  backToSection: "Back to VR / AR Projects",
  nextSection: "Next: Experience",
  pageNavLabel: "More from the portfolio",
  builtWith: "Built with",
  pageTitleSuffix: "Manditha Madushanka",
  headings: {
    problem: "The problem",
    traineeSteps: "What trainees do",
    role: "My role",
    challenges: "Technical challenges",
    outcome: "Outcome",
    gallery: "Screenshots",
    credits: "Credits",
  },
};

export function caseStudyHref(project: Pick<XrProject, "slug">): string {
  return `/work/${project.slug}`;
}

/** "Dulmi (interactions), Sanduni (…) and Ridmi (…)", without an Oxford comma. */
export function teamLine(team: readonly TeamMember[]): string {
  const parts = team.filter((member) => !member.isMe).map((member) => `${member.name} (${member.area})`);
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
