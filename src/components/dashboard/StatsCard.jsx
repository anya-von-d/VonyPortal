import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

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

export default function StatsCard({ title, value, icon: Icon, color, change, isLoading }) {
  const colors = colorClasses[color] || colorClasses.green;

  if (isLoading) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm hover:shadow-lg transition-all duration-300 group h-full">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <div className={`p-2.5 rounded-xl ${colors.bg} ring-4 ${colors.ring} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>
            {change && (
              <p className="text-xs text-slate-500 font-medium">{change}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}