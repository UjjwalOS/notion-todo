import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col gap-6 rounded-xl py-6",
  {
    variants: {
      variant: {
        default: "border shadow-sm",
        premium: [
          "[background-clip:padding-box]",
          // Light mode: 5-layer cascading shadow system
          "shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_1px_-0.5px_rgba(0,0,0,0.05),0_3px_3px_-1.5px_rgba(0,0,0,0.05),0_6px_6px_-3px_rgba(0,0,0,0.05),0_12px_12px_-6px_rgba(0,0,0,0.05)]",
          // Dark mode: inner highlight + depth shadows
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05),inset_0_1px_0_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.2),0_8px_16px_rgba(0,0,0,0.15)]",
        ].join(" "),
        "premium-elevated": [
          "[background-clip:padding-box]",
          // Light mode: more pronounced elevation
          "shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.06),0_8px_8px_-4px_rgba(0,0,0,0.06),0_16px_16px_-8px_rgba(0,0,0,0.06)]",
          // Dark mode: stronger depth
          "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_6px_rgba(0,0,0,0.35),0_8px_12px_rgba(0,0,0,0.25),0_16px_24px_rgba(0,0,0,0.18)]",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
}
