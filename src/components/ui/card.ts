/*
 * Shared hover and focus states, so every card behaves the same in both themes:
 * - Cards: the border warms to the accent on hover (60%) and goes full accent while anything inside has
 *   keyboard focus (a card that is itself a link uses focus-visible instead).
 * - Buttons (button-link.ts): primary dims slightly, secondary takes the accent border and text.
 * - Links: content links turn accent on hover; site chrome (nav, footer, header toggles) goes muted to text.
 * - Tags are static labels, with no hover.
 * Every one shows the global accent focus ring (globals.css) and takes its timing from the motion tokens.
 */
export const cardHover = "transition-colors duration-base ease-out hover:border-accent/60 focus-within:border-accent";

/** For a card that is itself the link. */
export const linkCardHover = "transition-colors duration-base ease-out hover:border-accent/60 focus-visible:border-accent";
