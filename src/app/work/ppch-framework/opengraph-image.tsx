import { ppchFramework as project } from "@/content/projects";
import { sectionHeading } from "@/content/navigation";
import { caseStudyShareImage, shareImageSize } from "@/components/og/case-study-share";

const screenshot = project.caseStudy.share;

export const alt = `${project.title}: ${screenshot.alt}`;
export const size = shareImageSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return caseStudyShareImage({
    eyebrow: sectionHeading("work"),
    title: project.title,
    subtitle: project.subtitle,
    screenshot,
    shape: "landscape",
  });
}
