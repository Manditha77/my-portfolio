import type { Todo } from "./types";

export type Article = {
  title: string;
  date: string;
  summary: string;
  url: string;
  todos: readonly Todo[];
};

export const articles: readonly Article[] = [
  {
    title: "I Turned My Laptop's Gaming GPU Into an AI Image Studio",
    date: "Aug 2026",
    summary:
      "Running Stable Diffusion locally on an NVIDIA RTX 4060, including the errors and fixes.",
    url: "https://medium.com/@manditha/i-turned-my-laptops-gaming-gpu-into-an-ai-image-studio",
    todos: ["TODO: verify"],
  },
  {
    title: "Building My Own VPN on Microsoft Azure as a University Student",
    date: "Jun 2026",
    summary: "WireGuard on Azure, including debugging iptables rules.",
    url: "https://medium.com/@manditha/building-my-own-vpn-on-microsoft-azure-as-a-university-student",
    todos: ["TODO: verify"],
  },
];
