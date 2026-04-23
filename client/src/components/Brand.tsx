import { cn } from "@/lib/utils";

/* Sentry — a custom inline SVG logo. A shield with a checkmark and an
   orbiting scan ring. Monochrome (currentColor) so it adapts to dark/light. */

interface Props {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 28, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("mark-glow", className)}
    >
      <path
        d="M16 3.5 L27 8 V16 C27 22.5 22.4 27 16 29 C9.6 27 5 22.5 5 16 V8 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 16 L14.5 20 L22 11.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="13.4" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 3" strokeWidth="0.8" />
    </svg>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="text-primary">
        <BrandMark size={26} />
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">Sentry</span>
        <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mt-0.5">
          CySA+ CS0-003
        </span>
      </div>
    </div>
  );
}
