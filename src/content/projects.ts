import { site } from "./site";
import type { ContentImage, ExternalLink, NumberedStep, Todo } from "./types";

/** One stage of a dataset funnel ("1,767 PRs scraped"). */
export type FunnelStep = {
  count: string;
  label: string;
};

/** One row of a model comparison table. */
export type ModelResult = {
  model: string;
  /** Mean AUC, as written in the results. */
  auc: string;
  /** 95% confidence interval, when reported. */
  interval?: string;
  best?: boolean;
};

/** A project's own case study page (`/work/<slug>`), for SE projects that have one. */
export type ProjectCaseStudy = {
  /** A short line under the context, e.g. where the project came from. */
  note: string;
  problem: string;
  howItWorks: readonly NumberedStep[];
  results: {
    dataset: { heading: string; funnel: readonly FunnelStep[] };
    models: { heading: string; caption: string; rows: readonly ModelResult[] };
    actEngine: { heading: string; intro: string; checks: readonly string[]; outcomes: readonly string[] };
    deployed: { heading: string; body: readonly string[] };
  };
  limitations: string;
  /** Screenshots in story order, shown after the results. */
  gallery: readonly ContentImage[];
  /** The screenshot in the generated share image. */
  share: ContentImage;
};

export type Project = {
  slug: string;
  title: string;
  subtitle?: string;
  year: string;
  type: string;
  status?: string;
  repo: string;
  stack: readonly string[];
  /** One sentence: the detail lives in the case study, when there is one. */
  blurb: string;
  /** At most three short bullets. */
  highlights?: readonly string[];
  /** Short measured stats shown as chips under the blurb. */
  chips?: readonly string[];
  /** Kept for the record, not shown on the card. */
  statusNote?: string;
  media?: readonly ContentImage[];
  /** Measured values in this card's copy that count up once on view (exact text, e.g. "0.78", "42%"). */
  countUp?: readonly string[];
  caseStudy?: ProjectCaseStudy;
  todos: readonly Todo[];
};

const ppchImageDir = "/images/projects/ppch";

const prComment: ContentImage = {
  src: `${ppchImageDir}/pr-comment.png`,
  alt: "PPCH bot comment on a pull request explaining why it was flagged, with model scores and a scope caveat",
  caption: "The PR comment",
  width: 1138,
  height: 863,
};

export const ppchFramework = {
  slug: "ppch-framework",
  title: "PPCH Framework",
  subtitle: "Predictive and Proactive Code Health",
  year: "2026",
  type: "Final-year dissertation",
  status: "Completed",
  repo: "https://github.com/Manditha77/ppch-framework",
  stack: [
    "Python",
    "scikit-learn",
    "XGBoost",
    "GitHub REST API",
    "SonarQube (SonarScanner)",
    "GitHub Actions",
    "Java (Apache Commons)",
  ],
  blurb:
    "My final-year research: a framework that predicts when a Java pull request will increase code complexity, and proposes verified refactorings before it merges.",
  chips: ["334 PRs", "0.78 AUC", "42% caught before merge"],
  countUp: ["334", "0.78", "42%"],
  caseStudy: {
    note: "Grew out of refactoring and SonarQube work during my internship.",
    problem:
      "Code-quality issues are usually found after a pull request merges. Can complexity risk be predicted when a pull request is submitted, and fixed before it merges?",
    howItWorks: [
      {
        title: "Sense",
        body: "Mines PR history through the GitHub REST API and runs SonarScanner on before/after snapshots to build a leakage-safe dataset of 334 PRs.",
      },
      {
        title: "Analyze",
        body: "Compares four models with 1,000-iteration bootstrap validation; the best, Logistic Regression, reached 0.78 AUC.",
      },
      {
        title: "Act",
        body: "An ILP-based Extract Method engine proposes refactorings behind four safety checks; every applied suggestion was re-verified safe by a real SonarQube scan.",
      },
    ],
    results: {
      dataset: {
        heading: "Dataset",
        funnel: [
          { count: "1,767", label: "PRs scraped" },
          { count: "500", label: "sampled" },
          { count: "497", label: "scanned" },
          { count: "334", label: "usable" },
        ],
      },
      models: {
        heading: "Model comparison",
        caption: "Mean AUC, 1,000-iteration bootstrap validation",
        rows: [
          { model: "Logistic Regression", auc: "0.780", interval: "0.709–0.847", best: true },
          { model: "XGBoost", auc: "0.750" },
          { model: "Random Forest", auc: "0.746" },
          { model: "Naive Bayes", auc: "0.660" },
        ],
      },
      actEngine: {
        heading: "Act engine",
        intro: "ILP-based Extract Method with four safety checks:",
        checks: ["Return-forwarding", "Break/continue", "Independent-variable mutation", "Non-productive extraction"],
        outcomes: [
          "10 suggestions applied, each re-verified safe by a real SonarQube scan",
          "4 correctly declined",
          "0 unsafe",
        ],
      },
      deployed: {
        heading: "Deployed GitHub Action",
        body: [
          "A reactive scanner took a mean 82.4 h (median 12.9 h) to flag complexity-increasing PRs.",
          "The Action caught 22 of 52 (42.3%) before merge.",
        ],
      },
    },
    limitations:
      "The deployed Action runs Random Forest + XGBoost; Logistic Regression was found best later, in the four-model comparison.",
    gallery: [
      prComment,
      {
        src: `${ppchImageDir}/refactor-diff.png`,
        alt: "Suggested Extract Method refactoring diff, with all methods now under the complexity threshold",
        caption: "Verified refactoring",
        width: 1150,
        height: 870,
      },
      {
        src: `${ppchImageDir}/multi-file-summary.png`,
        alt: "Analysis summary across two changed files listing each extracted method",
        caption: "Across every changed file",
        width: 1410,
        height: 858,
      },
      {
        src: `${ppchImageDir}/workflow-setup.png`,
        alt: "GitHub Actions workflow file using the PPCH Action",
        caption: "Install in a few lines",
        width: 1155,
        height: 611,
      },
      {
        src: `${ppchImageDir}/action-run.png`,
        alt: "Successful PPCH guard run in GitHub Actions",
        caption: "Running in GitHub Actions",
        width: 1919,
        height: 1079,
      },
    ],
    share: prComment,
  },
  todos: [],
} satisfies Project;

/** Home page order: the research first, then the full-stack systems. */
export const projects: readonly Project[] = [
  ppchFramework,
  {
    slug: "groceryease",
    title: "GroceryEase",
    subtitle: "Web-based grocery management system",
    year: "2024–2025",
    type: "Solo project",
    repo: "https://github.com/Manditha77/groceryease_sdp",
    stack: ["Java", "Spring Boot", "React.js", "JavaScript", "MySQL"],
    blurb: "A full-stack grocery management system I built solo for Samantha Store.",
    highlights: [
      "Spring Boot backend with a MySQL database",
      "Two React frontends: a store-management app and a customer storefront for pre-orders",
      "Inventory tracking, credit sales and supplier coordination",
    ],
    // Not deployed yet. Never describe it as deployed.
    statusNote:
      "Planned for Microsoft Azure deployment with security enhancements",
    todos: [
      "TODO: 2–3 screenshots (admin dashboard, storefront, inventory), plus an architecture diagram from `diagrams/`.",
    ],
  },
  {
    slug: "employee-management-system",
    title: "Employee Management System",
    year: "2025",
    type: "Team project",
    repo: "https://github.com/SenudaJK/Employee-Management",
    stack: [
      "Java",
      "Spring Boot",
      "JavaScript",
      "HTML",
      "Docker",
      "Microsoft Azure",
    ],
    blurb:
      "A full-stack employee records system with full CRUD, containerised with Docker and deployed on Microsoft Azure.",
    highlights: [
      "My part: the Docker containerisation and the Azure deployment",
      "Also contributed to parts of the Spring Boot backend",
    ],
    todos: ["TODO: screenshot(s); optional deployment diagram."],
  },
];

/** A smaller entry shown after the main cards. Kept separate so it never changes `Project`. */
export type CompactProject = {
  slug: string;
  title: string;
  year: string;
  type: string;
  status: string;
  blurb: string;
  chips: readonly string[];
  stack: readonly string[];
  link: ExternalLink;
  /** Measured values in the chips that count up once on view. */
  countUp?: readonly string[];
};

export const thisPortfolio: CompactProject = {
  slug: "this-portfolio",
  title: "This portfolio",
  year: "2026",
  type: "Personal project",
  status: "Live",
  blurb: "The site you're reading: fast, accessible, and built from one typed content file.",
  // Lighthouse mobile Accessibility (Nov 2026: 100 in 5 of 5 runs); re-run before changing it.
  chips: ["Accessibility 100", "WCAG AA", "3D lazy-loaded"],
  stack: ["Next.js", "TypeScript", "Tailwind CSS", "React Three Fiber", "three.js", "Motion", "Vercel"],
  link: { label: "View source on GitHub", href: site.links.portfolioRepo.href },
  countUp: ["100"],
};

export const moreOnGitHub: ExternalLink = site.links.githubRepos;

/** Interface strings for the Selected Work section and the SE case study pages. */
export const workCopy = {
  intro:
    "The research from my final-year dissertation, and two full-stack Java and Spring Boot systems.",
  repoLink: "View code",
  repoLinkSuffix: "on GitHub",
  caseStudyCta: "Read the case study",
  repoCta: "View code on GitHub",
  chipsLabel: "Highlights",
  backToSection: "Back to Selected projects",
  nextSection: "Next: VR / AR Projects",
  modelColumn: "Model",
  aucColumn: "Mean AUC",
  intervalColumn: "95% CI",
  best: "best",
  headings: {
    problem: "The problem",
    howItWorks: "How it works",
    results: "Results",
    screenshots: "Screenshots",
    limitations: "Limitations",
  },
};
