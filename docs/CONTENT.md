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
- **Medium:** https://medium.com/@manditha77madushanka
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

**Section intro:** Two full-stack Java and Spring Boot systems, and the research from my final-year dissertation.

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
- **Year:** 2026 · **Type:** Final-year dissertation · **Status:** Completed
- **Repo:** https://github.com/Manditha77/ppch-framework
- **Stack:** Python, scikit-learn, XGBoost, GitHub REST API, SonarQube (SonarScanner), GitHub Actions, Java (Apache Commons)
- **Card blurb:** My final-year research: a Sense–Analyze–Act framework that predicts when a Java pull request will increase code complexity, and proposes verified refactorings before it merges. Trained on 334 real Apache Commons pull requests and deployed as a working GitHub Action.
- **How it works:**
  - **Sense:** mines PR history through the GitHub REST API and runs SonarScanner on before/after snapshots to build a leakage-safe dataset of 334 PRs
  - **Analyze:** compares four models with 1,000-iteration bootstrap validation; the best, Logistic Regression, reached 0.78 AUC
  - **Act:** an ILP-based Extract Method engine proposes refactorings behind four safety checks; every applied suggestion was re-verified safe by a real SonarQube scan
  - **Deployed:** a GitHub Action (Random Forest + XGBoost) that comments on real PRs at submission. A reactive scanner took a mean 82 hours (median 13) to flag complexity-increasing PRs; the Action caught 42% of them (22 of 52) before merge
- **Connection:** Grew out of refactoring and SonarQube work during my internship.

**More on GitHub:** link to https://github.com/Manditha77?tab=repositories

---

## VR / AR Projects: ElectricalSafetyVR

- **Nav label:** VR/AR (anchor `#xr`)
- **Subtitle:** Side work in virtual and augmented reality, built with Unity and OpenXR.
- **Full title:** Electrical Workshop Safety Training Simulator
- **Context:** University group project, INTE 42312 Virtual & Augmented Reality, University of Kelaniya. Team of 5, completed October 2026.
- **Repo:** https://github.com/Manditha77/ElectricalSafetyVR
- **Video:** YouTube (unlisted). TODO: video ID (to be uploaded). Until it exists, show the overview screenshot with a "Demo video coming soon" label; no fake play button.
- **Stack:** Unity 6 (URP), XR Interaction Toolkit 3, OpenXR, XR Device Simulator, C#
- **Platform:** Windows build (OpenXR); developed and demonstrated with the XR Device Simulator. (If tested on a real headset later, update this line.)

### Images (public/images/xr/electrical-safety-vr/)
| File | Shows | Alt text |
|---|---|---|
| overview.png | Workshop entrance: welcome board, PPE station, workbench | VR electrical workshop with a welcome board, a PPE station and a workbench |
| ppe.png | Putting on PPE at the PPE station (PPE 1 / 6) | Trainee picking up an insulated glove at the PPE station, with a PPE progress counter |
| hazard.png | Wet-floor hazard with its risk panel and the Safe Isolation poster | Wet-floor hazard beside Workstation 2 with a risk panel and the Safe Isolation steps poster |
| fuse-snap.png | Fitting the new fuse ("Release to fit") next to the damaged-parts bin | Fitting a new fuse into Workstation 2, with the damaged-parts bin beside it |
| results.png | Training results: PASS – EXCELLENT | Training results screen showing a pass, 6 of 6 job steps, 4 of 4 hazards and zero unsafe actions |

### Home page spotlight blurb
A VR training simulator where trainees learn electrical workshop safety by doing. They put on the right PPE, find and make safe hazards against the clock, then isolate, prove dead and replace a blown fuse in the correct order, and get a scored result at the end. I built the indoor workshop and integrated our five-person team's work into the final build.

### Case study (`/work/electrical-safety-vr`)

**The problem**
Electrical workshop safety is best learned through practice, but practising with live hazards is dangerous. For our Virtual & Augmented Reality module, we built a VR workshop where trainees put on the right PPE, spot and fix hazards, and replace a blown fuse in the correct, safe order, and where a mistake costs nothing.

**What trainees do**
1. **Pre-work check:** put on all six PPE items at the PPE station before starting.
2. **Hazard check against the clock:** two minutes to find and make safe four hazards: a loose metal tool, an overloaded power strip, a wet floor and a live damaged lead. Missed hazards flash red and explain the risk and what should have been done.
3. **The job, by the Safe Isolation procedure:** isolate the correct workstation (W2), lock off with a DANGER tag, prove the tester, test for dead at the test point (0 V), replace the blown fuse, dispose of the damaged fuse, and restore power.
4. **Results:** a pass grade with the job score, time, unsafe actions and specific feedback, such as "Wrong isolator! W1 feeds Workstation 1."

Also in the simulator: an electrical fire task with a CO₂ extinguisher, a power cut with an emergency torch, 3D spatial audio and voice guidance, real-world safety signage including a Safe Isolation poster, and an outdoor yard.

**My role**
- Built the indoor workshop environment.
- Integrated the team's work: merged five members' branches into one working build and fixed the integration bugs (fuse snap-fit, PPE grabbing, build setup).
- Added two finishing touches: a disposal bin for the damaged fuse, and a 3D spatial sound for opening and closing the fuse cover, generated in code.

**Technical challenges**

*1. Merging five branches into one build.*
Each teammate worked on their own Git branch, with their own scenes, prefabs and references. I merged everything into one main scene and wrote small Unity editor tools (menu commands) that applied each of my changes with a matching revert, so I could try integration fixes without risking anyone else's work. The first build opened to an empty scene; the cause was the wrong scene in Build Profiles, fixed by setting the main scene at index 0.

*2. PPE that couldn't be grabbed.*
After the PPE shelf was moved, the gloves, goggles and ear defenders stopped responding to the controller ray. The shelf's solid box collider now enclosed the items, so the ray hit the shelf first. I wrote an editor tool that finds furniture colliders enclosing grabbable items and switches them to triggers, which XR rays ignore, leaving everything else unchanged.

*3. A fuse snap-fit that is forgiving but still safe.*
Lining a small fuse up with its holder in VR was fiddly and often failed. I added a snap-assist: if the new fuse is released within about 20 cm of the holder, with the cover open and the blown fuse already removed, it snaps into place, locks and completes the task once. It's easy for the trainee, but it still enforces the correct safety order.

**Outcome**
Our lecturer recognised it as an excellent, fully working VR simulation compared with the other teams' projects.

**Team**
- Manditha Madushanka: environment design and integration
- Dulmi: interactions
- Sanduni: electrical safety hazards
- Dinan: game flow
- Ridmi: workshop scene

**Credits**
Third-party 3D models, textures and audio from Poly Haven (CC0), Poly Pizza, Sketchfab (CC BY 4.0), CGTrader, the Unity Asset Store and Pixabay; voice-guidance clips made with AI text-to-speech. Full list in the repo's CREDITS.md.

**Still optional (don't block on these):** each teammate's exact area in more detail; real-headset testing; project length in weeks; one environment detail Manditha is proudest of.

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
- BSc (Hons) Management and Information Technology (IT specialisation), University of Kelaniya, 2023 – present

---

## Writing (Medium)
- **I Turned My Laptop's Gaming GPU Into an AI Image Studio** (Aug 2026): Running Stable Diffusion locally on an NVIDIA RTX 4060, including the errors and fixes. URL: https://medium.com/@manditha77madushanka/i-turned-my-laptops-gaming-gpu-into-an-ai-image-studio-ee851474d6eb
- **Building My Own VPN on Microsoft Azure as a University Student** (Jun 2026): WireGuard on Azure, including debugging iptables rules. URL: https://medium.com/@manditha77madushanka/building-my-own-vpn-on-microsoft-azure-as-a-university-student-9f8fd0577aea

---

## Skills (grouped; no percentages)
- **Languages:** Java, JavaScript, TypeScript, Python, C#, C++, SQL
- **Backend:** Spring Boot, REST APIs, gRPC, Apache Kafka, Microservices, Event-Driven Architecture
- **Frontend & Mobile:** React.js, Next.js, HTML, CSS, Bootstrap, Android (Java), Flutter, Firebase
- **Databases:** PostgreSQL, MySQL
- **DevOps & Tools:** Git, GitHub, Bitbucket, Docker, Microsoft Azure, SonarQube, Postman
- **XR:** Unity 6 (URP), XR Interaction Toolkit, OpenXR, WebXR
- **Practices:** OOP, Unit testing, Refactoring, Agile/Scrum

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
