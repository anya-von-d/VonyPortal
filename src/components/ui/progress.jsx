"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, showLabel = false, color = "bg-[#35B276]", animated = true, ...props }, ref) => (
  <div className={cn("space-y-1", className)}>
    {showLabel && (
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Progress</span>
        <span className="font-medium text-slate-800">{Math.round(value || 0)}%</span>
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-200"
      )}
      {...props}>
      {animated ? (
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      ) : (
        <ProgressPrimitive.Indicator
          className={cn("h-full w-full flex-1 transition-all", color)}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
