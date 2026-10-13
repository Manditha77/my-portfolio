# CONTENT.md: Source of truth for all site copy

Everything on the site must come from this file. Items marked **TODO** must be filled in by Manditha before that section ships.
Sources: CV (Oct 2026), GitHub repos, and Manditha's own notes.

---

## Identity & links

- **Name:** Manditha Madushanka (full: Manditha Madushanka Athukorala)
- **Headline:** Software Engineer · building VR/AR on the side
- **Status:** Open to Associate Software Engineer roles
- **Location (city level only):** Colombo, Sri Lanka
- **Email:** manditha77madushanka@gmail.com
- **GitHub:** https://github.com/Manditha77
- **LinkedIn:** https://www.linkedin.com/in/manditha-madushanka-455145281
- **Medium:** https://medium.com/@manditha (TODO: confirm the full profile URL)
- **CV file:** `public/Manditha-Madushanka-CV.pdf`
- Do NOT publish: phone number, street address.

---

## Hero copy (draft)

**H1:** Manditha Madushanka
**Tagline:** Software Engineer · building VR/AR on the side
**Intro:** Final-year IT undergraduate at the University of Kelaniya. I build full-stack systems with Java, Spring Boot and React, most recently as a Software Engineer Intern on aeroPORT, a Departure Control System used by Air Arabia.
**Status pill:** Open to Associate Software Engineer roles
**CTAs:** View my work · Download CV · GitHub · LinkedIn

---

## Selected Work (SE)

**Section intro:** Two full-stack Java and Spring Boot systems, and the research I'm doing for my final-year dissertation.

### 1. GroceryEase: Web-based grocery management system
- **Year:** 2024–2025 · **Type:** Solo project
- **Repo:** https://github.com/Manditha77/groceryease_sdp
- **Stack:** Java, Spring Boot, React.js, JavaScript, MySQL
- **Card blurb:** A full-stack grocery management system I built solo for Samantha Store, with inventory tracking, credit-sales management, supplier coordination and an online storefront for customer pre-orders.
- **Highlights:**
  - Spring Boot backend with a MySQL database
  - Two React frontends: a store-management app and a customer e-commerce site
  - Inventory tracking, credit sales and supplier coordination
- **Status note:** Planned for Microsoft Azure deployment with security enhancements (do not claim it is deployed).
- **Media:** TODO: 2–3 screenshots (admin dashboard, storefront, inventory), plus an architecture diagram from `diagrams/`.

### 2. Employee Management System
- **Year:** 2025 · **Type:** Team project
- **Repo:** https://github.com/SenudaJK/Employee-Management
- **Stack:** Java, Spring Boot, JavaScript, HTML, Docker, Microsoft Azure
- **Card blurb:** A full-stack employee records system with full CRUD, containerised with Docker and deployed on Microsoft Azure.
- **My role:** Handled the Docker containerisation and Azure deployment, and contributed to parts of the Spring Boot backend.
- **Media:** TODO: screenshot(s); optional deployment diagram.

### 3. PPCH Framework: Predictive and Proactive Code Health (dissertation)
- **Year:** 2026 · **Type:** Final-year dissertation · **Status:** In progress
- **Repo:** https://github.com/Manditha77/ppch-framework
- **Stack:** Python, GitHub REST API, SonarQube (SonarScanner), Java codebases (Apache Commons)
- **Card blurb:** My final-year research: a Sense–Analyze–Act framework for Java pull requests that mines project history, measures code health and aims to flag risky changes before they merge.
- **Approach so far (factual):**
  - **Sense:** a resumable, rate-limit-aware pipeline that collects every historical pull request (open, closed, merged) from Apache Commons repositories through the GitHub REST API
  - **Next:** run SonarScanner on base and head commits per PR, then engineer features with a leakage-safe train/test split
- **Connection:** Grew out of refactoring and SonarQube work during my internship.
- **Do not claim:** results, accuracy figures or conclusions (none exist yet).
- **Optional:** One-line research question (TODO, optional).

**More on GitHub:** link to https://github.com/Manditha77?tab=repositories

---

## XR Spotlight: ElectricalSafetyVR

- **Full title:** Electrical Workshop Safety Training Simulator
- **Context:** University group project, INTE 42312 Virtual & Augmented Reality, University of Kelaniya, 2026
- **Repo:** https://github.com/Manditha77/ElectricalSafetyVR
- **Video:** YouTube (unlisted). TODO: video ID
- **Stack:** Unity 6 (URP), XR Interaction Toolkit 3, OpenXR, XR Device Simulator, C#
- **My role:** Environment design (the workshop room, outdoor yard, props, signage and placement hints), plus the final integration of every team member's work into one working build.
- **Team:** TODO: names and each person's area (all have agreed to be named).

**Spotlight blurb (home page):**
A VR training simulator where trainees learn electrical workshop safety by doing: they spot and fix hazards, put on the right PPE, replace a fuse and put out an electrical fire, all without real-world risk. I designed the environment and integrated the team's work into the final build.

**Case study (`/work/electrical-safety-vr`):**

*The problem:* Electrical workshop safety is best learned through practice, but practising with live hazards such as damaged leads, faulty fuses and electrical fires is dangerous. We built a VR workshop where trainees can make mistakes safely. (TODO: Manditha to confirm this framing.)

*What trainees do (features):*
- Spot and fix hazards around the workshop
- Gear up at a PPE station (goggles, gloves, ear defenders, safety boots)
- Replace a fuse, with a snap-fit interaction
- Dispose of the damaged fuse correctly
- Tackle an electrical fire with a CO₂ extinguisher
- Follow 3D spatial audio and voice guidance
- Read real-world safety signage, including a Safe Isolation poster
- Explore an outdoor yard as well as the workshop interior

*My role:* Environment design for the workshop and yard (layout, props, signs, boards and placement hints) and final integration, which meant bringing each teammate's scenes, scripts and interactions into a single build that runs end-to-end.

*Technical challenges:* TODO, 2–3 real ones from Manditha. For example: what broke when merging everyone's work, how the snap-fit fuse was made reliable, and keeping URP lighting performant in VR. Do not write this section until he provides them.

*Outcome (keep modest):* Our lecturer recognised it as an excellent, fully working VR simulation compared with the other teams' projects.

*Credits:* Team (TODO). Third-party assets from Poly Haven (CC0), Poly Pizza, Sketchfab (CC BY 4.0), CGTrader and the Unity Asset Store, as listed in the repo's `CREDITS.md`. Link to it.

---

## Experience

### Software Engineer Intern: Information Systems Associates (Pvt) Ltd
- **Dates:** Jul 2025 – Jan 2026 · Colombo, Sri Lanka
- **Product:** aeroPORT, a microservices-based Departure Control System (DCS) used by Air Arabia for check-in, boarding, baggage and passenger operations
- **Bullets:**
  - Built Java and Spring Boot backend flows that process Passenger Name Lists (PNL) for check-in, seat assignment and boarding
  - Shipped enhancements across core DCS modules, on both backend services and React.js / Next.js frontend components
  - Debugged data flows spanning multiple microservices, Apache Kafka topics and gRPC calls
  - Refactored backend services for readability and maintainability
  - Raised frontend unit-test coverage to meet SonarQube quality standards
  - Worked in an Agile/Scrum team (sprint planning, stand-ups, reviews, retrospectives)
- **Tech:** Java, Spring Boot, React.js, Next.js, PostgreSQL, Apache Kafka, gRPC, REST, Microservices, SonarQube, Git, Bitbucket

### Leadership & activities
- Technical Team Member, International Research Conference on Smart Computing and Systems Engineering (SCSE), Dept. of Industrial Management, University of Kelaniya, 2025
- Technical and Organizing Team Member, hackX 9.0, Industrial Management Science Students' Association, 2024
- Main Coordinator, IM Auwrudu, Industrial Management Science Students' Association, 2024

### Education
- BSc (Hons) Management and Information Technology (IT specialisation), University of Kelaniya, 2023 – present (GPA 3.36 / 4.00)

---

## Writing (Medium)
- **I Turned My Laptop's Gaming GPU Into an AI Image Studio** (Aug 2026): Running Stable Diffusion locally on an NVIDIA RTX 4060, including the errors and fixes. URL: https://medium.com/@manditha/i-turned-my-laptops-gaming-gpu-into-an-ai-image-studio (TODO: verify)
- **Building My Own VPN on Microsoft Azure as a University Student** (Jun 2026): WireGuard on Azure, including debugging iptables rules. URL: https://medium.com/@manditha/building-my-own-vpn-on-microsoft-azure-as-a-university-student (TODO: verify)

---

## Skills (grouped; no percentages)
- **Languages:** Java, JavaScript, TypeScript, Python, C#, C++, SQL
- **Backend:** Spring Boot, REST APIs, gRPC, Apache Kafka, Microservices, Event-Driven Architecture
- **Frontend & Mobile:** React.js, Next.js, HTML, CSS, Bootstrap, Android (Java), Flutter, Firebase
- **Databases:** PostgreSQL, MySQL
- **DevOps & Tools:** Git, GitHub, Bitbucket, Docker, Microsoft Azure, SonarQube, Postman
- **XR:** Unity 6 (URP), XR Interaction Toolkit, OpenXR, WebXR
- **Practices:** OOP, unit testing, refactoring, Agile/Scrum

---

## About (draft)

I'm Manditha, a final-year Management and Information Technology undergraduate at the University of Kelaniya, Sri Lanka.

My internship at Information Systems Associates put me inside a live airline system, where I learned to trace a problem across microservices, Kafka topics and gRPC calls, and to leave code cleaner than I found it. That interest in code quality became my dissertation.

On the side, I build in VR and AR with Unity and WebXR, and I write about hands-on experiments, like running Stable Diffusion on my laptop's GPU or setting up my own VPN on Azure. At university I've helped run hackX 9.0 and the SCSE 2025 research conference.

I'm looking for an Associate Software Engineer role where I can keep building reliable systems with a good team.

---

## Contact copy
**Heading:** Let's talk
**Line:** I'm open to Associate Software Engineer roles, and to XR collaborations. The fastest way to reach me is by email.
