import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        // Premium variants with @PixelJanitor shadow system
        premium: [
          "bg-primary text-primary-foreground",
          "[background-clip:padding-box]",
          // Light mode: shadow border + layered depth shadows
          "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_1px_-0.5px_rgba(0,0,0,0.1),0_2px_2px_-1px_rgba(0,0,0,0.1),0_3px_3px_-1.5px_rgba(0,0,0,0.08)]",
          "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_-1px_rgba(0,0,0,0.1),0_4px_4px_-2px_rgba(0,0,0,0.1),0_6px_6px_-3px_rgba(0,0,0,0.08)]",
          "active:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.1)]",
          "active:translate-y-px",
          // Dark mode: 6-layer system with inner highlights
          "dark:bg-gradient-to-b dark:from-primary dark:to-primary/95",
          "dark:shadow-[0_0.5px_0_0_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_1px_rgba(0,0,0,0.3),0_2px_2px_rgba(0,0,0,0.2),0_4px_4px_rgba(0,0,0,0.15)]",
          "dark:hover:shadow-[0_0.5px_0_0_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_0_rgba(255,255,255,0.12),0_2px_2px_rgba(0,0,0,0.35),0_4px_4px_rgba(0,0,0,0.25),0_6px_6px_rgba(0,0,0,0.18)]",
          "dark:active:shadow-[0_0.5px_0_0_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_1px_rgba(0,0,0,0.3)]",
        ].join(" "),
        "premium-secondary": [
          "bg-secondary text-secondary-foreground",
          "[background-clip:padding-box]",
          // Light mode
          "shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_1px_-0.5px_rgba(0,0,0,0.08),0_2px_2px_-1px_rgba(0,0,0,0.08),0_3px_3px_-1.5px_rgba(0,0,0,0.06)]",
          "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_2px_-1px_rgba(0,0,0,0.08),0_4px_4px_-2px_rgba(0,0,0,0.08),0_6px_6px_-3px_rgba(0,0,0,0.06)]",
          "hover:bg-secondary/90",
          "active:shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_1px_rgba(0,0,0,0.08)]",
          "active:translate-y-px",
          // Dark mode
          "dark:bg-gradient-to-b dark:from-secondary dark:to-secondary/95",
          "dark:shadow-[0_0.5px_0_0_rgba(0,0,0,0.7),inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_0_rgba(255,255,255,0.08),0_1px_1px_rgba(0,0,0,0.25),0_2px_2px_rgba(0,0,0,0.18),0_4px_4px_rgba(0,0,0,0.12)]",
          "dark:hover:shadow-[0_0.5px_0_0_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.07),inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_2px_rgba(0,0,0,0.3),0_4px_4px_rgba(0,0,0,0.22),0_6px_6px_rgba(0,0,0,0.15)]",
          "dark:active:shadow-[0_0.5px_0_0_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.03),inset_0_1px_0_0_rgba(255,255,255,0.05),0_1px_1px_rgba(0,0,0,0.25)]",
        ].join(" "),
        "premium-ghost": [
          "text-foreground",
          "[background-clip:padding-box]",
          // Light mode - subtle on hover
          "hover:bg-accent/80",
          "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_1px_-0.5px_rgba(0,0,0,0.06),0_2px_2px_-1px_rgba(0,0,0,0.06)]",
          "active:bg-accent",
          "active:shadow-[0_0_0_1px_rgba(0,0,0,0.06)]",
          // Dark mode
          "dark:hover:bg-accent/60",
          "dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_0_rgba(255,255,255,0.06),0_1px_1px_rgba(0,0,0,0.2)]",
          "dark:active:bg-accent/70",
          "dark:active:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]",
        ].join(" "),
        "premium-destructive": [
          "bg-destructive text-white",
          "[background-clip:padding-box]",
          // Light mode
          "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_1px_1px_-0.5px_rgba(185,28,28,0.2),0_2px_2px_-1px_rgba(185,28,28,0.15),0_3px_3px_-1.5px_rgba(185,28,28,0.1)]",
          "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_2px_2px_-1px_rgba(185,28,28,0.2),0_4px_4px_-2px_rgba(185,28,28,0.15),0_6px_6px_-3px_rgba(185,28,28,0.1)]",
          "hover:bg-destructive/95",
          "active:shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_1px_1px_rgba(185,28,28,0.15)]",
          "active:translate-y-px",
          // Dark mode
          "dark:bg-gradient-to-b dark:from-destructive dark:to-destructive/90",
          "dark:shadow-[0_0.5px_0_0_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_0_rgba(255,255,255,0.12),0_1px_1px_rgba(0,0,0,0.3),0_2px_2px_rgba(0,0,0,0.2),0_4px_4px_rgba(0,0,0,0.15)]",
          "dark:hover:shadow-[0_0.5px_0_0_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_2px_rgba(0,0,0,0.35),0_4px_4px_rgba(0,0,0,0.25),0_6px_6px_rgba(0,0,0,0.18)]",
          "dark:active:shadow-[0_0.5px_0_0_rgba(0,0,0,0.9),inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_0_rgba(255,255,255,0.08),0_1px_1px_rgba(0,0,0,0.3)]",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
