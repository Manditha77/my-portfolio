import { site } from "./site";
import type { ContentImage, ExternalLink, Todo } from "./types";

export type ProjectApproachStep = {
  label: string;
  text: string;
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
  blurb: string;
  highlights?: readonly string[];
  role?: string;
  approach?: readonly ProjectApproachStep[];
  connection?: string;
  statusNote?: string;
  media?: readonly ContentImage[];
  todos: readonly Todo[];
};

export const projects: readonly Project[] = [
  {
    slug: "groceryease",
    title: "GroceryEase",
    subtitle: "Web-based grocery management system",
    year: "2024–2025",
    type: "Solo project",
    repo: "https://github.com/Manditha77/groceryease_sdp",
    stack: ["Java", "Spring Boot", "React.js", "JavaScript", "MySQL"],
    blurb:
      "A full-stack grocery management system I built solo for Samantha Store, with inventory tracking, credit-sales management, supplier coordination and an online storefront for customer pre-orders.",
    highlights: [
      "Spring Boot backend with a MySQL database",
      "Two React frontends: a store-management app and a customer e-commerce site",
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
    role: "Handled the Docker containerisation and Azure deployment, and contributed to parts of the Spring Boot backend.",
    todos: ["TODO: screenshot(s); optional deployment diagram."],
  },
  {
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
      "My final-year research: a Sense–Analyze–Act framework that predicts when a Java pull request will increase code complexity, and proposes verified refactorings before it merges. Trained on 334 real Apache Commons pull requests and deployed as a working GitHub Action.",
    approach: [
      {
        label: "Sense",
        text: "mines PR history through the GitHub REST API and runs SonarScanner on before/after snapshots to build a leakage-safe dataset of 334 PRs",
      },
      {
        label: "Analyze",
        text: "compares four models with 1,000-iteration bootstrap validation; the best, Logistic Regression, reached 0.78 AUC",
      },
      {
        label: "Act",
        text: "an ILP-based Extract Method engine proposes refactorings behind four safety checks; every applied suggestion was re-verified safe by a real SonarQube scan",
      },
      {
        label: "Deployed",
        text: "a GitHub Action (Random Forest + XGBoost) that comments on real PRs at submission. A reactive scanner took a mean 82 hours (median 13) to flag complexity-increasing PRs; the Action caught 42% of them (22 of 52) before merge",
      },
    ],
    connection:
      "Grew out of refactoring and SonarQube work during my internship.",
    todos: [],
  },
];

export const moreOnGitHub: ExternalLink = site.links.githubRepos;

/** Interface strings for the Selected Work section. */
export const workCopy = {
  intro:
    "Two full-stack Java and Spring Boot systems, and the research from my final-year dissertation.",
  roleLabel: "My role:",
  approachHeading: "How it works",
  repoLink: "View code",
  repoLinkSuffix: "on GitHub",
};
