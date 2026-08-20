import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

const sizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-8 w-8" };

export function RatingStars({ value, onChange, size = "md", className, disabled }: Props) {
  const interactive = Boolean(onChange);
  return (
    <div className={cn("flex items-center gap-0.5", className)} role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const star = (
          <Star
            className={cn(
              sizes[size],
              "transition-transform",
              filled ? "fill-star text-star" : "text-muted-foreground/40",
              interactive && !disabled && "hover:scale-115",
            )}
          />
        );
        return interactive ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => onChange?.(n)}
            className="rounded-sm p-0.5 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {star}
          </button>
        ) : (
          <span key={n} aria-hidden>
            {star}
          </span>
        );
      })}
    </div>
  );
}
