import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard, Wallet, Percent, ChevronRight,
  Check, DollarSign, Zap, Clock, Award, TrendingUp,
  BookOpen, GraduationCap, Lightbulb,
  FileText, Shield, Users
} from "lucide-react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useAuth } from "@/lib/AuthContext";

const STAR_CIRCLES = [
  {cx:82,cy:45,o:0.7},{cx:195,cy:112,o:0.5},{cx:310,cy:28,o:0.8},{cx:420,cy:198,o:0.4},
  {cx:530,cy:67,o:0.65},{cx:640,cy:245,o:0.55},{cx:755,cy:88,o:0.75},{cx:860,cy:156,o:0.45},
  {cx:970,cy:34,o:0.7},{cx:1085,cy:201,o:0.6},{cx:1190,cy:78,o:0.5},{cx:1300,cy:267,o:0.7},
  {cx:1410,cy:45,o:0.55},{cx:1520,cy:134,o:0.65},{cx:48,cy:189,o:0.4},{cx:158,cy:278,o:0.6},
  {cx:268,cy:156,o:0.5},{cx:378,cy:89,o:0.7},{cx:488,cy:234,o:0.45},{cx:598,cy:145,o:0.6},
  {cx:708,cy:312,o:0.35},{cx:818,cy:56,o:0.75},{cx:928,cy:223,o:0.5},{cx:1038,cy:98,o:0.65},
  {cx:1148,cy:289,o:0.4},{cx:1258,cy:167,o:0.7},{cx:1368,cy:234,o:0.55},{cx:1478,cy:78,o:0.6},
  {cx:1560,cy:256,o:0.45},{cx:125,cy:312,o:0.5},{cx:345,cy:267,o:0.6},{cx:565,cy:34,o:0.75},
];

export default function ComingSoon() {
  const { user: authUser, userProfile } = useAuth();
  const user = userProfile ? { ...userProfile, id: authUser?.id } : null;
  const [activeTab, setActiveTab] = useState('shop');

  const creditCards = [
    {
      name: "Vony Starter Card",
      issuer: "Vony Financial",
      apr: "19.99% - 24.99%",
      annualFee: "$0",
      creditLimit: "$500 - $2,000",
      rewards: "1% cash back on all purchases",
      badge: "Best for Building Credit",
      features: ["No annual fee", "Free credit score monitoring", "Auto credit limit increases", "Mobile app access"]
    },
    {
      name: "Vony Rewards Card",
      issuer: "Vony Financial",
      apr: "15.99% - 21.99%",
      annualFee: "$95",
      creditLimit: "$2,000 - $10,000",
      rewards: "3% dining, 2% groceries, 1% all else",
      badge: "Most Popular",
      features: ["Welcome bonus: $200", "No foreign transaction fees", "Extended warranty protection", "Travel insurance included"]
    },
    {
      name: "Vony Premium Card",
      issuer: "Vony Financial",
      apr: "14.99% - 19.99%",
      annualFee: "$250",
      creditLimit: "$10,000 - $50,000",
      rewards: "5% travel, 3% dining, 2% all else",
      badge: "Premium",
      features: ["Welcome bonus: $500", "Airport lounge access", "Concierge service", "Premium travel insurance"]
    }
  ];

  const loans = [
    {
      name: "Personal Loan", type: "Unsecured", apr: "6.99% - 24.99%", amount: "$1,000 - $50,000", term: "12 - 60 months", badge: "Most Flexible", icon: Wallet,
      description: "Flexible funding for any purpose - debt consolidation, home improvement, or major purchases.",
      features: ["No collateral required", "Fixed monthly payments", "Funds in 1-3 business days", "No prepayment penalties"]
    },
    {
      name: "Auto Loan", type: "Secured", apr: "4.99% - 14.99%", amount: "$5,000 - $100,000", term: "24 - 84 months", badge: "Lowest Rates", icon: TrendingUp,
      description: "Finance your next vehicle with competitive rates and flexible terms.",
      features: ["New and used vehicles", "Refinancing available", "GAP coverage options", "Pre-approval in minutes"]
    },
    {
      name: "Emergency Loan", type: "Unsecured", apr: "9.99% - 29.99%", amount: "$500 - $10,000", term: "3 - 24 months", badge: "Fast Approval", icon: Zap,
      description: "Quick funding for unexpected expenses when you need it most.",
      features: ["Same-day approval", "Funds within 24 hours", "Minimal documentation", "Flexible repayment"]
    },
    {
      name: "Student Loan", type: "Unsecured", apr: "4.49% - 12.99%", amount: "$1,000 - $150,000", term: "60 - 180 months", badge: "Education", icon: Award,
      description: "Invest in your future with affordable education financing.",
      features: ["Deferred payments while in school", "No origination fees", "Cosigner release available", "Income-driven repayment"]
    }
  ];

  const subBoxColors = ['#AAFFA3', '#30FFA8', '#96FFD0', '#6EE8B5', '#6EE8A2'];
  const loanSubBoxColors = ['#6EE8A2', '#96FFD0', '#6EE8B5'];

  const topics = [
    { icon: Shield, title: "Safe Lending Practices", description: "Learn how to protect yourself when lending money to friends" },
    { icon: FileText, title: "Understanding Loan Agreements", description: "What to include in a loan agreement and why it matters" },
    { icon: TrendingUp, title: "Interest Rates Explained", description: "How interest works and what's fair for peer lending" },
    { icon: Users, title: "Maintaining Friendships", description: "How to keep money from ruining your relationships" },
    { icon: Lightbulb, title: "When to Say No", description: "Setting healthy boundaries with money and friends" },
    { icon: GraduationCap, title: "Financial Literacy Basics", description: "Build a strong foundation for your financial future" }
  ];

  const topicColors = ['#AAFFA3', '#30FFA8', '#96FFD0', '#6EE8B5', '#83F384', '#6EE8A2'];

  return (
    <div className="home-with-sidebar" style={{ minHeight: '100vh', position: 'relative', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", fontSize: 14, lineHeight: 1.5, color: '#1A1918', WebkitFontSmoothing: 'antialiased', paddingLeft: 240, background: '#F5F4F0' }}>
      <DashboardSidebar activePage="ComingSoon" user={user} />

      {/* Content box with galaxy background */}
      <div style={{ position: 'relative', margin: '12px 12px 12px 0', borderRadius: 20, overflow: 'hidden', minHeight: 'calc(100vh - 24px)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', bottom: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
          <div style={{
            position: 'absolute', top: 0, left: '-10%', width: '120%', height: '100%', zIndex: 0,
            background: 'linear-gradient(180deg, #5881FE 0%, #6688F8 20%, #7490F5 40%, #8296F0 60%, #8C9AEC 80%, #9196EC 100%)'
          }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 420, zIndex: 1, overflow: 'hidden' }}>
            <svg width="100%" height="100%" viewBox="0 0 1617 329" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="csStarGlow">
                  <stop offset="0%" stopColor="#EAF9F3"/>
                  <stop offset="100%" stopColor="#9FEBFB"/>
                </radialGradient>
              </defs>
              {STAR_CIRCLES.map((s, i) => (
                <circle key={i} cx={s.cx} cy={s.cy} r="1.75" fill="url(#csStarGlow)" opacity={s.o}/>
              ))}
            </svg>
          </div>
          <div className="twinkle-star" />
          <div className="twinkle-star" />
          <div className="twinkle-star" />
          <div className="twinkle-star" />
          <div className="twinkle-star" />
        </div>

        <div style={{ background: 'transparent', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px' }}>
            {/* Hero */}
            <div style={{ paddingTop: 80, paddingBottom: 20, textAlign: 'center' }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '3.2rem', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'white', margin: 0 }}>
                Coming Soon
              </h1>
            </div>

            {/* Glass tab selector */}
            <div className="glass-nav" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, padding: '6px 24px', height: 48, margin: '0 auto 36px', maxWidth: 320, zIndex: 10 }}>
              {[{key:'shop',label:'Shop'},{key:'learn',label:'Learn'}].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 500, color: activeTab === tab.key ? '#1A1918' : '#787776', background: activeTab === tab.key ? 'rgba(0,0,0,0.06)' : 'transparent', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Page content */}
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px 64px' }}>

            {/* Shop Tab */}
            {activeTab === 'shop' && (
              <div className="space-y-4">
                {/* Coming Soon Banner */}
                <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#787776', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace", margin: 0 }}>
                    Loan and Credit Card Offers Coming Soon
                  </p>
                </div>

                {/* Credit Cards */}
                {creditCards.map((card, index) => (
                  <motion.div
                    key={card.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="rounded-2xl p-5"
                    style={{ backgroundColor: '#DBFFEB' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-[#0A1A10]" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{card.name}</p>
                          <p className="text-xs text-slate-500">{card.issuer}</p>
                        </div>
                      </div>
                      <Badge className="bg-[#00A86B]/10 text-[#00A86B] border-0 text-xs">{card.badge}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'APR', value: card.apr },
                        { label: 'Annual Fee', value: card.annualFee },
                        { label: 'Credit Limit', value: card.creditLimit },
                        { label: 'Rewards', value: card.rewards }
                      ].map((stat, statIdx) => (
                        <div key={stat.label} className="rounded-xl p-3" style={{ backgroundColor: subBoxColors[(index + statIdx + 1) % 5] }}>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{stat.label}</p>
                          <p className="font-semibold text-slate-800 text-sm">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {card.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2 py-1 rounded-lg">
                          <Check className="w-3 h-3 text-[#00A86B]" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <Button className="bg-[#00A86B] hover:bg-[#0D9B76] text-white rounded-xl">
                      Apply Now
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                ))}

                {/* Loans */}
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {loans.map((loan, index) => (
                    <motion.div
                      key={loan.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      className="rounded-2xl p-5"
                      style={{ backgroundColor: '#DBFFEB' }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                            <loan.icon className="w-5 h-5 text-[#0A1A10]" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{loan.name}</p>
                            <p className="text-xs text-slate-500">{loan.type} Loan</p>
                          </div>
                        </div>
                        <Badge className="bg-[#00A86B]/10 text-[#00A86B] border-0 text-xs">{loan.badge}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{loan.description}</p>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: 'APR', value: loan.apr },
                          { label: 'Amount', value: loan.amount },
                          { label: 'Term', value: loan.term }
                        ].map((stat, statIdx) => (
                          <div key={stat.label} className="rounded-xl p-2 text-center" style={{ backgroundColor: loanSubBoxColors[(index + statIdx + 1) % 3] }}>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{stat.label}</p>
                            <p className="font-semibold text-slate-800 text-xs">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {loan.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 bg-white px-2 py-1 rounded-lg">
                            <Check className="w-3 h-3 text-[#00A86B]" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <Button className="w-full bg-[#00A86B] hover:bg-[#0D9B76] text-white rounded-xl">
                        Check Your Rate
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center text-xs text-[#DBEEE3] px-4 mt-6">
                  <p>
                    All rates and terms are subject to credit approval. APRs shown are estimates and may vary based on creditworthiness.
                    This is for demonstration purposes only. Vony Portal does not issue credit cards or loans directly.
                  </p>
                </div>
              </div>
            )}

            {/* Learn Tab */}
            {activeTab === 'learn' && (
              <div className="space-y-4">
                {/* Coming Soon Banner */}
                <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: '#787776', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace", margin: 0 }}>
                    Educational Content Coming Soon
                  </p>
                </div>

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
                        transition={{ delay: 0.1 + index * 0.08 }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      >
                        <div
                          className="rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                          style={{ backgroundColor: topicColors[index % 6] }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                              <topic.icon className="w-4 h-4 text-[#0A1A10]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[#0A1A10] text-sm">{topic.title}</h3>
                                <span className="text-[10px] bg-white/60 text-slate-600 px-2 py-0.5 rounded-full font-medium">Soon</span>
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
              </div>
            )}

          </div>
        </div>
      </div>{/* end content box */}

      {/* Footer */}
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
