import type { ContentImage, ExternalLink, Todo } from "./types";
import { articles } from "./writing";

export type TeamMember = {
  name: string;
  area: string;
  /** Manditha himself; left out of the "Built with" line. */
  isMe?: boolean;
};

/** A titled step in a numbered list ("What trainees do", "How it plays"). */
export type NumberedStep = {
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

export type CreditItem = {
  text: string;
  link?: ExternalLink;
};

/** What every VR / AR project shares: the home card, the case study header, video and gallery. */
export type XrProjectBase = {
  slug: string;
  title: string;
  /** The subtitle under the title. */
  fullTitle: string;
  context: string;
  repo: string;
  stack: readonly string[];
  spotlightBlurb: string;
  video: XrVideo;
  /** Landscape desktop captures, or portrait phone screenshots shown in a phone-shaped frame. */
  screenshotShape: ScreenshotShape;
  images: {
    /** The home card visual and the video placeholder. */
    overview: ContentImage;
    /** Screenshots in story order. */
    gallery: readonly ContentImage[];
    /** The screenshot in the generated share image, when the page has one. */
    share?: ContentImage;
  };
  todos: readonly Todo[];
};

export type ScreenshotShape = "landscape" | "phone";

export type ElectricalSafetyVrProject = XrProjectBase & {
  platform: string;
  team: readonly TeamMember[];
  caseStudy: {
    problem: string;
    traineeSteps: readonly NumberedStep[];
    alsoIncluded: string;
    role: readonly string[];
    technicalChallenges: readonly TechnicalChallenge[];
    outcome: string;
    credits: {
      assets: string;
      creditsFile: ExternalLink;
    };
  };
};

export type ArElementalArenaProject = XrProjectBase & {
  liveDemoUrl: string;
  /** Where the live demo runs. */
  runsOn: string;
  /** Markers for the summon (image tracking) mode, to scan from the screen or print. */
  summonCards: readonly ContentImage[];
  caseStudy: {
    idea: string;
    howItPlays: readonly NumberedStep[];
    tryItYourself: {
      requirement: string;
      steps: readonly string[];
    };
    built: string;
    technicalChallenges: readonly TechnicalChallenge[];
    learned: string;
    credits: readonly CreditItem[];
  };
};

export type XrProject = ElectricalSafetyVrProject | ArElementalArenaProject;

const repo = "https://github.com/Manditha77/ElectricalSafetyVR";
const imageDir = "/images/xr/electrical-safety-vr";

const overview: ContentImage = {
  src: `${imageDir}/overview.png`,
  alt: "VR electrical workshop with a welcome board, a PPE station and a workbench",
  width: 1910,
  height: 1070,
};

export const electricalSafetyVr: ElectricalSafetyVrProject = {
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
  screenshotShape: "landscape",
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

const arRepo = "https://github.com/Manditha77/ar-elemental-arena";
const arImageDir = "/images/xr/ar-elemental-arena";

/** Portrait Android screenshots, all 720×1600. */
function phoneShot(file: string, alt: string): ContentImage {
  return { src: `${arImageDir}/${file}`, alt, width: 720, height: 1600 };
}

function summonCard(element: string): ContentImage {
  return {
    src: `${arImageDir}/cards/${element.toLowerCase()}-summon-card.png`,
    alt: `${element} summon card`,
    width: 912,
    height: 1264,
  };
}

const summonWater = phoneShot(
  "summon-water.jpeg",
  "The Tide Serpent creature waving on top of the scanned water summon card, with the roster at 1 of 4",
);

const battle = phoneShot(
  "battle.jpeg",
  "Stone Golem facing an Ember Drake in the AR arena on a real desk, with health bars, an “Air buff: Overcast” weather banner and Attack and Defend buttons",
);

// Left out: battle-low-health.jpeg, whose camera scene is rotated sideways.
const arGallery: readonly ContentImage[] = [
  phoneShot(
    "menu.jpeg",
    "Game menu in Chrome on Android with two options: scan a summon card (marker-based AR) or deploy the battle arena (markerless AR)",
  ),
  summonWater,
  phoneShot(
    "summon-earth.jpeg",
    "The Stone Golem creature walking on the scanned earth summon card, with the roster at 2 of 4",
  ),
  battle,
];

// The summon card art was generated with the setup from this article.
const gpuArticle = articles[0];

export const arElementalArena: ArElementalArenaProject = {
  slug: "ar-elemental-arena",
  title: "AR Elemental Arena",
  fullTitle: "Mobile web AR creature battler",
  context:
    "Individual assignment, INTE 42312 Virtual & Augmented Reality, University of Kelaniya. Solo, September 2026.",
  repo: arRepo,
  liveDemoUrl: "https://manditha77.github.io/ar-elemental-arena/",
  runsOn: "Runs in Chrome on Android (ARCore). Not yet supported on iPhone. No app install; it runs in the browser.",
  stack: [
    "A-Frame 1.5",
    "MindAR 1.2.5 (image tracking)",
    "WebXR Device API (immersive-ar, hit-test)",
    "three.js",
    "aframe-extras",
    "JavaScript",
    "Open-Meteo API",
    "GitHub Pages",
  ],
  spotlightBlurb:
    "A mobile web AR game. Scan physical summon cards to collect four elemental creatures, then place a battle arena on a real table or floor and fight a real-time battle against an AI opponent. The local live weather gives one element a damage buff. Built solo; it runs in Chrome on Android, with no app to install.",
  video: {
    provider: "youtube",
    title: "AR Elemental Arena demo",
  },
  screenshotShape: "phone",
  images: {
    overview: summonWater,
    gallery: arGallery,
    share: battle,
  },
  summonCards: ["Fire", "Water", "Earth", "Air"].map(summonCard),
  caseStudy: {
    idea: "The assignment required both marker-based and markerless AR, plus a data-driven feature and complex interaction. Rather than build two separate demos, I made them one game: image tracking collects creatures from physical cards, surface detection hosts the battle, both share the same roster, and live weather changes the outcome of a fight rather than being a cosmetic label.",
    howItPlays: [
      {
        title: "Summon (marker-based AR)",
        body: "Point the camera at a summon card and its creature appears on the card. Drag to rotate, pinch to resize, and tap to cycle its animations, each with matching sound effects. Every card scanned adds that creature to your roster.",
      },
      {
        title: "Choose your creature",
        body: "Pick from the ones you've scanned. The enemy is picked at random.",
      },
      {
        title: "Deploy the arena (markerless AR)",
        body: "A reticle finds a real floor or table; tap to place the arena, and both creatures appear facing each other.",
      },
      {
        title: "Weather buff",
        body: "With your permission, the game reads the current weather at your location and gives one element ×1.5 damage for that match (for example “AIR BUFF — Overcast”).",
      },
      {
        title: "Fight in real time",
        body: "Tap to move within the arena, attack when in range, and defend to halve the next hit. The enemy AI acts on its own timer: it approaches, winds up attacks you can react to, defends, retreats when low and taunts. Hits show floating damage numbers and vibrate the phone.",
      },
      {
        title: "Win or lose",
        body: "Then play again.",
      },
    ],
    tryItYourself: {
      requirement: "You need Chrome on an Android phone with ARCore support (iPhone isn't supported yet).",
      steps: [
        "Open the live demo on your phone.",
        "Choose “Scan a summon card” and point your camera at one of the cards below, shown on this screen or printed.",
        "Once at least one creature is in your roster, go back and choose “Deploy the battle arena”, then aim at a floor or table.",
      ],
    },
    built:
      "Everything, solo: the game design, both AR modes, creature setup and animation handling, sound, the combat system and enemy AI, the weather integration, the UI, the summon card art (generated on my own GPU with ComfyUI), testing on a real Android device, and deployment to GitHub Pages.",
    technicalChallenges: [
      {
        title: "Getting camera-passthrough AR to show anything",
        body: "Tapping “Start AR” first did nothing, because the code asked for a VR headset session; switching to an AR session fixed that, but the screen was then solid black. Two separate causes hid the camera feed: the renderer wasn't transparent, and the page's own background sat opaque behind the canvas. Fixing both, and rewriting surface detection as a proper A-Frame component so it actually ran every frame, got the reticle working on real surfaces.",
      },
      {
        title: "Animations that played once, then never again",
        body: "Attack, hit and death animations worked the first time, then silently refused to repeat. The animation library caches one action per clip and doesn't restart a finished one. Separately, clips referenced by plain names like “Walk” never played, because each model stored them with an armature prefix (“CharacterArmature|Walk”). I read the real clip names from each model's glTF data and forced a reset on every clip switch, so every move replays reliably.",
      },
      {
        title: "Making combat feel real-time",
        body: "The first battle loop used a single shared turn flag, so the enemy only ever reacted after the player, like a turn-based game. I replaced it with independent state per creature and a self-scheduling enemy AI (acting every 1.4–2.6 s) that moves, attacks, defends and retreats on its own clock, with a telegraphed wind-up so the player can react in time.",
      },
    ],
    learned:
      "AR bugs rarely show up as errors: a black screen, a silently ignored animation or a gesture swallowed by the browser all fail quietly. Since a phone can't easily stay connected to desktop DevTools during an AR session, I built an on-screen debug log into both scenes, and it became the most useful tool in the whole project. Every fix was confirmed on a real device, not just by the absence of console errors.",
    credits: [
      {
        text: "3D creature models by Quaternius: Dragon Evolved (fire), Fish (water), Mushroom King (earth), Bat (air).",
      },
      { text: "Sound effects: Kenney.nl RPG Audio, Impact Sounds and UI Audio (CC0)." },
      {
        text: "Summon card art: generated by me with ComfyUI (Z-Image Turbo) on my own GPU.",
        link: { label: gpuArticle.title, href: gpuArticle.url },
      },
      { text: "Libraries: A-Frame, MindAR and aframe-extras (MIT). Weather data: Open-Meteo." },
      { text: "Fonts: Inter and Rajdhani (Google Fonts)." },
    ],
  },
  todos: ["TODO: demo video ID (to be uploaded)"],
};

/** Case studies in the order they appear in the VR / AR Projects section. */
export const xrProjects: readonly XrProject[] = [electricalSafetyVr, arElementalArena];

/** Interface strings for the VR / AR Projects section and the case study page. */
export const xrCopy = {
  heading: "VR / AR Projects",
  subtitle: "Side work in virtual and augmented reality, built with Unity, OpenXR and WebXR.",
  caseStudyCta: "Read the case study",
  repoCta: "View code on GitHub",
  liveDemoCta: "Try it live",
  liveDemoHint: "Android Chrome",
  opensNewTab: "(opens in new tab)",
  openFullSize: "Open full size",
  articleCredit: "How I set it up:",
  stackLabel: "Tech stack",
  videoComingSoon: "Demo video coming soon",
  playVideo: "Play video:",
  backToHome: "Back to home",
  backToSection: "Back to VR / AR Projects",
  nextSection: "Next: Experience",
  pageNavLabel: "More from the portfolio",
  caseStudyNavLabel: "Case studies",
  previousCaseStudy: "Previous case study",
  nextCaseStudy: "Next case study",
  builtWith: "Built with",
  headings: {
    problem: "The problem",
    traineeSteps: "What trainees do",
    role: "My role",
    challenges: "Technical challenges",
    outcome: "Outcome",
    gallery: "Screenshots",
    credits: "Credits",
    idea: "The idea",
    howItPlays: "How it plays",
    tryIt: "Try it yourself",
    built: "What I built",
    learned: "What I learned",
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
