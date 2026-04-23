/** Renders a stem with qualifier words (FIRST, BEST, NEXT, MOST, LEAST, TWO, THREE)
 *  visually emphasized, as CompTIA logic demands. */
import { highlightQualifiers } from "@/lib/exam-logic";

export function StemText({ children }: { children: string }) {
  return (
    <p
      className="text-foreground leading-relaxed text-base"
      dangerouslySetInnerHTML={{ __html: highlightQualifiers(children) }}
    />
  );
}
