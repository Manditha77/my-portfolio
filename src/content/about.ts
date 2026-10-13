export type About = {
  paragraphs: readonly string[];
  /** Shown only if the file exists under public/. */
  photo: { src: string; alt: string };
  links: { downloadCv: string; getInTouch: string };
};

export const about: About = {
  paragraphs: [
    "I'm Manditha, a final-year Management and Information Technology undergraduate at the University of Kelaniya, Sri Lanka.",
    "My internship at Information Systems Associates put me inside a live airline system, where I learned to trace a problem across microservices, Kafka topics and gRPC calls, and to leave code cleaner than I found it. That interest in code quality became my dissertation.",
    "On the side, I build in VR and AR with Unity and WebXR, and I write about hands-on experiments, like running Stable Diffusion on my laptop's GPU or setting up my own VPN on Azure. At university I've helped run hackX 9.0 and the SCSE 2025 research conference.",
    "I'm looking for an Associate Software Engineer role where I can keep building reliable systems with a good team.",
  ],
  photo: { src: "/images/manditha.jpg", alt: "Manditha Madushanka" },
  links: { downloadCv: "Download CV", getInTouch: "Get in touch" },
};
