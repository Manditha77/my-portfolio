export type SkillGroup = {
  label: string;
  items: readonly string[];
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
  },
  {
    label: "Practices",
    items: ["OOP", "unit testing", "refactoring", "Agile/Scrum"],
  },
];
