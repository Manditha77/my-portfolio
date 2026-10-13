export type Job = {
  role: string;
  company: string;
  period: string;
  location: string;
  /** aeroPORT is proprietary: describe only what CONTENT.md says. */
  product: string;
  bullets: readonly string[];
  tech: readonly string[];
};

export type LeadershipRole = {
  role: string;
  event: string;
  organisation: string;
  year: string;
};

export type Education = {
  degree: string;
  institution: string;
  period: string;
  gpa: string;
};

export const experience: readonly Job[] = [
  {
    role: "Software Engineer Intern",
    company: "Information Systems Associates (Pvt) Ltd",
    period: "Jul 2025 – Jan 2026",
    location: "Colombo, Sri Lanka",
    product:
      "aeroPORT, a microservices-based Departure Control System (DCS) used by Air Arabia for check-in, boarding, baggage and passenger operations",
    bullets: [
      "Built Java and Spring Boot backend flows that process Passenger Name Lists (PNL) for check-in, seat assignment and boarding",
      "Shipped enhancements across core DCS modules, on both backend services and React.js / Next.js frontend components",
      "Debugged data flows spanning multiple microservices, Apache Kafka topics and gRPC calls",
      "Refactored backend services for readability and maintainability",
      "Raised frontend unit-test coverage to meet SonarQube quality standards",
      "Worked in an Agile/Scrum team (sprint planning, stand-ups, reviews, retrospectives)",
    ],
    tech: [
      "Java",
      "Spring Boot",
      "React.js",
      "Next.js",
      "PostgreSQL",
      "Apache Kafka",
      "gRPC",
      "REST",
      "Microservices",
      "SonarQube",
      "Git",
      "Bitbucket",
    ],
  },
];

export const leadership: readonly LeadershipRole[] = [
  {
    role: "Technical Team Member",
    event:
      "International Research Conference on Smart Computing and Systems Engineering (SCSE)",
    organisation: "Dept. of Industrial Management, University of Kelaniya",
    year: "2025",
  },
  {
    role: "Technical and Organizing Team Member",
    event: "hackX 9.0",
    organisation: "Industrial Management Science Students' Association",
    year: "2024",
  },
  {
    role: "Main Coordinator",
    event: "IM Auwrudu",
    organisation: "Industrial Management Science Students' Association",
    year: "2024",
  },
];

export const education: readonly Education[] = [
  {
    degree:
      "BSc (Hons) Management and Information Technology (IT specialisation)",
    institution: "University of Kelaniya",
    period: "2023 – present",
    gpa: "3.36 / 4.00",
  },
];
