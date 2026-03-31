import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen, GraduationCap, Lightbulb,
  FileText, Shield, TrendingUp, Users, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useAuth } from "@/lib/AuthContext";

export default function Learn() {
  const { user: authUser, userProfile } = useAuth();
  const user = userProfile ? { ...userProfile, id: authUser?.id } : null;

  const topics = [
    {
      icon: Shield,
      title: "Safe Lending Practices",
      description: "Learn how to protect yourself when lending money to friends",
      comingSoon: true
    },
    {
      icon: FileText,
      title: "Understanding Loan Agreements",
      description: "What to include in a loan agreement and why it matters",
      comingSoon: true
    },
    {
      icon: TrendingUp,
      title: "Interest Rates Explained",
      description: "How interest works and what's fair for peer lending",
      comingSoon: true
    },
    {
      icon: Users,
      title: "Maintaining Friendships",
      description: "How to keep money from ruining your relationships",
      comingSoon: true
    },
    {
      icon: Lightbulb,
      title: "When to Say No",
      description: "Setting healthy boundaries with money and friends",
      comingSoon: true
    },
    {
      icon: GraduationCap,
      title: "Financial Literacy Basics",
      description: "Build a strong foundation for your financial future",
      comingSoon: true
    }
  ];

  const bgColors = ['#AAFFA3', '#30FFA8', '#96FFD0', '#6EE8B5', '#83F384', '#6EE8A2'];

  return (
    <div className="home-with-sidebar" style={{ minHeight: '100vh', position: 'relative', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", fontSize: 14, lineHeight: 1.5, color: '#1A1918', WebkitFontSmoothing: 'antialiased', paddingLeft: 240, background: '#F5F4F0' }}>
      <DashboardSidebar activePage="Learn" user={user} />
      <div style={{ position: 'relative', margin: '12px 12px 12px 0', borderRadius: 20, overflow: 'hidden', minHeight: 'calc(100vh - 24px)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', bottom: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: 0, left: '-10%', width: '120%', height: '100%', zIndex: 0,
            background: 'linear-gradient(180deg, #5881FE 0%, #6688F8 20%, #7490F5 40%, #8296F0 60%, #8C9AEC 80%, #9196EC 100%)'
          }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="p-3 md:p-6">
            <div className="max-w-4xl mx-auto space-y-7">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-5"
              >
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight text-left">
                  Learn
                </h1>
              </motion.div>

              {/* Coming Soon Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#83F384' }}>
                  <p className="text-[11px] text-[#0A1A10] uppercase tracking-[0.12em] font-medium" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Educational Content Coming Soon
                  </p>
                </div>
              </motion.div>

              {/* Topics Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-[#DBFFEB] rounded-2xl p-5">
                  <p className="text-[11px] text-slate-600 uppercase tracking-[0.12em] font-medium mb-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Topics
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {topics.map((topic, index) => (
                      <motion.div
                        key={topic.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      >
                        <div
                          className="rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                          style={{ backgroundColor: bgColors[index % 6] }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                              <topic.icon className="w-4 h-4 text-[#0A1A10]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[#0A1A10] text-sm">{topic.title}</h3>
                                {topic.comingSoon && (
                                  <span className="text-[10px] bg-white/60 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                    Soon
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#0A1A10]/60 mt-0.5">{topic.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#0A1A10]/30 group-hover:text-[#0A1A10]/60 transition-colors flex-shrink-0" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>{/* end content box */}
      <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#787776' }}>2026 Vony, Inc. All rights reserved.</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 11, color: '#787776' }}>Terms of Service</span>
          <span style={{ fontSize: 11, color: '#787776' }}>Privacy Center</span>
          <span style={{ fontSize: 11, color: '#787776' }}>Do not sell or share my personal information</span>
        </div>
      </div>
    </div>
  );
}
