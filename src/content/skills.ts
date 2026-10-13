export type SkillGroup = {
  label: string;
  items: readonly string[];
  /** "accent" tints the tags, a quiet link to the XR section. */
  tone?: "accent";
};

/** Grouped skills. No levels or percentages. */
export const skillGroups: readonly SkillGroup[] = [
  {
    label: "Languages",
    items: ["Java", "JavaScript", "TypeScript", "Python", "C#", "C++", "SQL"],
  },
  {
    label: "Backend",
    items: [
      "Spring Boot",
      "REST APIs",
      "gRPC",
      "Apache Kafka",
      "Microservices",
      "Event-Driven Architecture",
    ],
  },
  {
    label: "Frontend & Mobile",
    items: [
      "React.js",
      "Next.js",
      "HTML",
      "CSS",
      "Bootstrap",
      "Android (Java)",
      "Flutter",
      "Firebase",
    ],
  },
  {
    label: "Databases",
    items: ["PostgreSQL", "MySQL"],
  },
  {
    label: "DevOps & Tools",
    items: [
      "Git",
      "GitHub",
      "Bitbucket",
      "Docker",
      "Microsoft Azure",
      "SonarQube",
      "Postman",
    ],
  },
  {
    label: "XR",
    items: ["Unity 6 (URP)", "XR Interaction Toolkit", "OpenXR", "WebXR"],
    tone: "accent",
  },
  {
    label: "Practices",
    items: ["OOP", "Unit testing", "Refactoring", "Agile/Scrum"],
  },
];
