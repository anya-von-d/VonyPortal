import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { SkeletonShimmer } from "@/components/ui/animations";

const colorClasses = {
  green: {
    bg: "bg-[#35B276] opacity-100",
    text: "text-[#F3F0EC] opacity-90",
    ring: "ring-[#35B276]/20"
  },
  blue: {
    bg: "bg-[#35B276] opacity-100",
    text: "text-[#F3F0EC] opacity-90",
    ring: "ring-[#35B276]/20"
  },
  purple: {
    bg: "bg-[#35B276] opacity-100",
    text: "text-[#F3F0EC] opacity-90",
    ring: "ring-[#35B276]/20"
  },
  orange: {
    bg: "bg-[#35B276] opacity-100",
    text: "text-[#F3F0EC] opacity-90",
    ring: "ring-[#35B276]/20"
  }
};

export default function StatsCard({ title, value, icon: Icon, color, change, isLoading, index = 0 }) {
  const colors = colorClasses[color] || colorClasses.green;

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
        <CardContent className="p-6">
          <div className="mb-2">
            <SkeletonShimmer className="h-4 w-24" />
          </div>
          <SkeletonShimmer className="h-8 w-20 mb-2" />
          <SkeletonShimmer className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className="bg-white backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-full cursor-default border-0"
      >
        <CardContent className="p-5 flex flex-col justify-between h-full">
          <div className="mb-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
          </div>
          <div className="flex items-end justify-between">
            <motion.p
              className="text-2xl font-bold text-slate-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              {value}
            </motion.p>
            {change && (
              <motion.p
                className="text-xs text-slate-500 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                {change}
              </motion.p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}