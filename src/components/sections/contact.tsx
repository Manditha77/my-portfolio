import { site } from "@/content/site";
import { ButtonLink } from "@/components/ui/button-link";
import { CopyEmailButton } from "@/components/ui/copy-email-button";
import { MailIcon } from "@/components/ui/icons";
import { Section } from "@/components/ui/section";
import { SocialLinks } from "@/components/ui/social-links";

export function Contact() {
  const { contact, email } = site;

  return (
    <Section id="contact" heading={contact.heading}>
      <p className="mt-4 max-w-prose text-text-muted sm:text-lg">{contact.line}</p>

      <div className="mt-7 flex flex-wrap gap-3">
        <ButtonLink href={`mailto:${email}`}>
          <MailIcon />
          {contact.emailCta}
        </ButtonLink>
        <CopyEmailButton
          email={email}
          label={contact.copyCta}
          copiedLabel={contact.copied}
          failedLabel={contact.copyFailed}
        />
      </div>

      <p className="mt-5 text-sm text-text-muted">
        {contact.emailLabel}:{" "}
        <span className="font-mono break-all text-text select-all">{email}</span>
      </p>

      <SocialLinks variant="text" className="mt-6 -ml-0.5" />
    </Section>
  );
}
