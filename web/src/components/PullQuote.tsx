import { Callout } from "@/components/Handoff";

/**
 * A question posed to the reader, set apart from the running prose. It wears the
 * same Manilla card as each page's closing box, titled "Open question", so the
 * questions a page raises and the hand-off it ends on read as one family.
 */
export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <Callout title="Open question">
      <p>{children}</p>
    </Callout>
  );
}
