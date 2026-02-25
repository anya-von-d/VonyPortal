import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen, GraduationCap, Lightbulb, PlayCircle,
  FileText, Shield, TrendingUp, Users, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function Learn() {
  const topics = [
    {
      icon: Shield,
      title: "Safe Lending Practices",
      description: "Learn how to protect yourself when lending money to friends",
      color: "bg-blue-100 text-blue-600",
      comingSoon: true
    },
    {
      icon: FileText,
      title: "Understanding Loan Agreements",
      description: "What to include in a loan agreement and why it matters",
      color: "bg-green-100 text-green-600",
      comingSoon: true
    },
    {
      icon: TrendingUp,
      title: "Interest Rates Explained",
      description: "How interest works and what's fair for peer lending",
      color: "bg-purple-100 text-purple-600",
      comingSoon: true
    },
    {
      icon: Users,
      title: "Maintaining Friendships",
      description: "How to keep money from ruining your relationships",
      color: "bg-orange-100 text-orange-600",
      comingSoon: true
    },
    {
      icon: Lightbulb,
      title: "When to Say No",
      description: "Setting healthy boundaries with money and friends",
      color: "bg-pink-100 text-pink-600",
      comingSoon: true
    },
    {
      icon: GraduationCap,
      title: "Financial Literacy Basics",
      description: "Build a strong foundation for your financial future",
      color: "bg-teal-100 text-teal-600",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen p-3 md:p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-[#35B276]/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-[#35B276]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">
            Learn
          </h1>
          <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto">
            Master the art of peer-to-peer lending with guides, tips, and best practices
          </p>
        </motion.div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-[#35B276] to-[#2d9561] text-white border-0">
            <CardContent className="p-6 text-center">
              <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <h2 className="text-xl font-bold mb-2">Educational Content Coming Soon!</h2>
              <p className="opacity-90 max-w-md mx-auto">
                We're working on helpful guides, videos, and resources to help you become a confident peer lender.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Topics Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${topic.color} flex items-center justify-center flex-shrink-0`}>
                      <topic.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">{topic.title}</h3>
                        {topic.comingSoon && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{topic.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold text-slate-800 mb-2">Get notified when we launch</h3>
              <p className="text-sm text-slate-500 mb-4">
                Be the first to know when our educational content is ready
              </p>
              <Button className="bg-[#35B276] hover:bg-[#2d9a65]">
                Notify Me
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
