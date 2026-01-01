import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-md bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: [
          "dark:bg-input/30 border-input border shadow-xs",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        ].join(" "),
        premium: [
          "[background-clip:padding-box]",
          "bg-background dark:bg-input/20",
          // Light mode: inset/pressed effect
          "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(0,0,0,0.06)]",
          // Dark mode: subtle inset with border highlight
          "dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_2px_4px_rgba(0,0,0,0.2)]",
          // Focus state: glow effect
          "focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--ring)),0_0_0_3px_hsl(var(--ring)/0.2)]",
          "dark:focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--ring)),0_0_0_3px_hsl(var(--ring)/0.25)]",
          // Invalid state
          "aria-invalid:shadow-[inset_0_0_0_1px_hsl(var(--destructive)),inset_0_2px_4px_rgba(0,0,0,0.06)]",
          "dark:aria-invalid:shadow-[inset_0_0_0_1px_hsl(var(--destructive)),inset_0_2px_4px_rgba(0,0,0,0.2)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
