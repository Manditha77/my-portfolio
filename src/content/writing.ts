import type { IsoMonth } from "@/lib/dates";
import type { Todo } from "./types";

export type Article = {
  title: string;
  published: IsoMonth;
  summary: string;
  url: string;
  todos: readonly Todo[];
};

export const articles: readonly Article[] = [
  {
    title: "I Turned My Laptop's Gaming GPU Into an AI Image Studio",
    published: "2026-08",
    summary:
      "Running Stable Diffusion locally on an NVIDIA RTX 4060, including the errors and fixes.",
    url: "https://medium.com/@manditha77madushanka/i-turned-my-laptops-gaming-gpu-into-an-ai-image-studio-ee851474d6eb",
    todos: [],
  },
  {
    title: "Building My Own VPN on Microsoft Azure as a University Student",
    published: "2026-06",
    summary: "WireGuard on Azure, including debugging iptables rules.",
    url: "https://medium.com/@manditha77madushanka/building-my-own-vpn-on-microsoft-azure-as-a-university-student-9f8fd0577aea",
    todos: [],
  },
];

/** Interface strings for the Writing strip. */
export const writingCopy = {
  opensMedium: "(opens Medium)",
};
