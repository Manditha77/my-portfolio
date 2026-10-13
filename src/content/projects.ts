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
  researchQuestion?: string;
  media?: readonly ContentImage[];
  todos: readonly Todo[];
};

export const projects: readonly Project[] = [
  {
    slug: "groceryease",
    title: "GroceryEase",
    subtitle: "web-based grocery management system",
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
    status: "In progress",
    repo: "https://github.com/Manditha77/ppch-framework",
    stack: [
      "Python",
      "GitHub REST API",
      "SonarQube (SonarScanner)",
      "Java codebases (Apache Commons)",
    ],
    blurb:
      "My final-year research: a Sense–Analyze–Act framework for Java pull requests that mines project history, measures code health and aims to flag risky changes before they merge.",
    // Work in progress: no results, accuracy figures or conclusions exist yet. Never claim any.
    approach: [
      {
        label: "Sense",
        text: "a resumable, rate-limit-aware pipeline that collects every historical pull request (open, closed, merged) from Apache Commons repositories through the GitHub REST API",
      },
      {
        label: "Next",
        text: "run SonarScanner on base and head commits per PR, then engineer features with a leakage-safe train/test split",
      },
    ],
    connection:
      "Grew out of refactoring and SonarQube work during my internship.",
    todos: ["TODO: (optional) one-line research question"],
  },
];

export const moreOnGitHub: ExternalLink = site.links.githubRepos;
