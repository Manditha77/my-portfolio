import { arElementalArena as project, xrCopy } from "@/content/xr";
import { caseStudyShareImage, shareImageSize } from "@/components/og/case-study-share";

const screenshot = project.images.share ?? project.images.overview;

export const alt = `${project.title}: ${screenshot.alt}`;
export const size = shareImageSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return caseStudyShareImage({
    eyebrow: xrCopy.heading,
    title: project.title,
    subtitle: project.fullTitle,
    screenshot,
  });
}
