import type { Choice } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

/* A lightweight keyboard-friendly reorderable list used by PBQ ordering tasks.
   Avoids HTML5 drag-and-drop for accessibility (which is finicky). Users move
   items with up/down buttons; the component reports the current order. */

interface Props {
  ids: string[];
  choices: Choice[];
  onChange: (next: string[]) => void;
  review?: boolean;
  correctOrder?: string[];
}

export function OrderingList({ ids, choices, onChange, review, correctOrder }: Props) {
  const map: Record<string, Choice> = Object.fromEntries(choices.map((c) => [c.id, c]));

  function move(idx: number, delta: number) {
    const next = ids.slice();
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <ol className="flex flex-col gap-2">
      {ids.map((id, i) => {
        const isCorrectPos = review && correctOrder && correctOrder[i] === id;
        const isWrongPos = review && correctOrder && correctOrder[i] !== id;
        return (
          <li
            key={id}
            className={cn(
              "flex items-start gap-3 px-3 py-2.5 rounded-md border",
              isCorrectPos && "border-success/60 bg-success/10",
              isWrongPos && "border-destructive/60 bg-destructive/10",
              !review && "border-card-border bg-card/50 hover-elevate",
            )}
            data-testid={`order-item-${id}`}
          >
            <div className="flex flex-col gap-0.5 pt-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                disabled={i === 0 || review}
                onClick={() => move(i, -1)}
                data-testid={`button-move-up-${id}`}
                aria-label="Move up"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5"
                disabled={i === ids.length - 1 || review}
                onClick={() => move(i, 1)}
                data-testid={`button-move-down-${id}`}
                aria-label="Move down"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>
            <span className="tabular-nums text-xs text-muted-foreground font-mono mt-1 w-4">{i + 1}</span>
            <span className="font-mono text-xs text-muted-foreground mt-1 uppercase w-4">{id}</span>
            <span className="flex-1 text-sm leading-snug">{map[id]?.text}</span>
          </li>
        );
      })}
    </ol>
  );
}
