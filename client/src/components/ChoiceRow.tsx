import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface Props {
  id: string;
  label: string;
  selected: boolean;
  multi: boolean;
  onToggle: () => void;
  /* review-mode props */
  review?: boolean;
  correct?: boolean;
  disabled?: boolean;
  testId?: string;
}

export function ChoiceRow({ id, label, selected, multi, onToggle, review, correct, disabled, testId }: Props) {
  const shade =
    review && correct ? "border-success/60 bg-success/10"
    : review && selected && !correct ? "border-destructive/60 bg-destructive/10"
    : selected ? "border-primary bg-accent"
    : "border-card-border";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      data-testid={testId}
      className={cn(
        "w-full text-left flex items-start gap-3 px-3.5 py-3 rounded-md border transition-colors group",
        "hover-elevate disabled:opacity-70 disabled:cursor-default",
        shade,
      )}
    >
      <span
        className={cn(
          "mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center border",
          multi ? "rounded-sm" : "rounded-full",
          review && correct ? "bg-success border-success text-success-foreground"
            : review && selected && !correct ? "bg-destructive border-destructive text-destructive-foreground"
            : selected ? "bg-primary border-primary text-primary-foreground"
            : "border-input",
        )}
      >
        {(selected || (review && correct)) && (
          review && selected && !correct
            ? <X className="w-3 h-3" strokeWidth={3} />
            : <Check className="w-3 h-3" strokeWidth={3} />
        )}
      </span>
      <span className="flex-1 flex gap-2 items-baseline">
        <span className="font-mono text-xs text-muted-foreground mt-0.5 uppercase">{id}</span>
        <span className="text-sm text-foreground leading-snug">{label}</span>
      </span>
    </button>
  );
}
