import React, { useState } from "react";
import {
  Sparkles, Shield, Zap, BarChart3, FileCheck, Users,
  BookOpen, Scale, Heart, Receipt, Brain, Landmark,
  ChevronRight, Lock
} from "lucide-react";

const LEARN_CATEGORIES = [
  { id: 'lending', label: 'Lending with Friends' },
  { id: 'basics', label: 'The Basics' },
  { id: 'saving', label: 'Saving & Budgeting' },
  { id: 'traditional', label: 'Traditional Loans' },
  { id: 'debt', label: 'Managing Debt' },
];

const LEARN_ARTICLES = {
  lending: [
    { title: 'How to Lend Money Without Damaging a Relationship', body: 'Setting expectations, using agreements, and protecting the friendship above all else.' },
    { title: 'Tax implications of peer lending', body: 'What the IRS expects when you lend or borrow over $10k, how gift rules apply, and when interest income matters.' },
    { title: 'Setting Fair Loan Terms Between Friends', body: 'How to agree on interest, timelines, and what happens if things go sideways.' },
    { title: "What to Do When a Friend Can't Pay You Back", body: 'Practical steps for having the conversation without burning the bridge.' },
    { title: 'The Case for a Written Agreement', body: 'Why putting it in writing protects both sides, and what to include.' },
    { title: 'How to Ask to Borrow Money Gracefully', body: 'Framing the ask, being specific, and making it easy for the other person to say yes or no.' },
  ],
  basics: [
    { title: 'What Is Interest, and How Does It Work?', body: 'A plain-language breakdown of how lenders make money and what it means for you.' },
    { title: "Gross vs. Net Income: What's the Difference?", body: 'Understanding what you actually take home, and why it matters for budgeting.' },
    { title: 'How to Read a Bank Statement', body: 'Demystifying the numbers, codes, and fees hiding in your monthly statement.' },
    { title: 'What Is a Credit Score?', body: 'How your score is calculated, what affects it, and why it matters.' },
    { title: 'APR vs. Interest Rate: Which One Should You Care About?', body: 'The often-confused pair that determines how much a loan truly costs.' },
    { title: 'How Compound Interest Can Work For (or Against) You', body: 'The eighth wonder of the world, and how to make it your ally.' },
  ],
  saving: [
    { title: 'The 50/30/20 Rule, Explained', body: 'A simple framework for splitting your income into needs, wants, and savings.' },
    { title: 'Building an Emergency Fund from Scratch', body: 'How to start saving when money is tight, and why 3–6 months of expenses is the target.' },
    { title: 'The Psychology of Saving', body: 'Why saving feels hard even when we know we should, and how to rewire that instinct.' },
    { title: 'High-Yield Savings Accounts, Explained', body: 'What they are, how they work, and whether you should move your money there.' },
    { title: 'Setting Financial Goals That Actually Stick', body: 'How to make goals specific, time-bound, and woven into your everyday habits.' },
    { title: 'Zero-Based Budgeting: Give Every Dollar a Job', body: 'A method that assigns a purpose to every dollar before the month begins.' },
  ],
  traditional: [
    { title: 'How Personal Loans Work', body: 'What banks look for, how repayment schedules are structured, and what to watch out for.' },
    { title: 'What Happens When You Miss a Loan Payment?', body: 'Late fees, credit impact, and how to communicate with your lender before things escalate.' },
    { title: 'Secured vs. Unsecured Loans: What\'s the Risk?', body: 'Why collateral changes everything, and when each type makes sense.' },
    { title: 'How Banks Calculate Loan Eligibility', body: 'The debt-to-income ratios, credit checks, and underwriting criteria that determine your approval.' },
    { title: 'The True Cost of a Payday Loan', body: 'Short-term convenience, long-term trap. The math behind one of the most expensive products in finance.' },
    { title: 'Understanding Your Credit Report', body: 'How to read it, dispute errors, and use it to your advantage.' },
  ],
  debt: [
    { title: 'Debt Snowball vs. Debt Avalanche: Which Is Right for You?', body: 'Two proven strategies for paying off debt, and how to pick the one that fits your mindset.' },
    { title: 'How to Prioritise Which Debt to Pay First', body: 'Interest rates, balances, and psychological factors: how to rank what you owe.' },
    { title: 'When Does Debt Consolidation Make Sense?', body: 'Combining multiple debts into one. The benefits, the risks, and who it\'s right for.' },
    { title: 'Understanding Your Debt-to-Income Ratio', body: 'The metric lenders use to size you up, and how to improve it over time.' },
    { title: 'Negotiating with Creditors: What You Can Actually Do', body: 'Settlement offers, hardship plans, and scripts for having uncomfortable conversations.' },
    { title: 'How Debt Affects Your Credit Score Over Time', body: 'The relationship between what you owe and how lenders perceive your risk.' },
  ],
};
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

const products = [
  {
    icon: Sparkles,
    name: "Vony+",
    tagline: "Premium",
    description: "Detailed loan analytics, priority support, and higher lending limits for power users.",
    highlights: ["Advanced repayment insights", "Priority dispute resolution", "Up to $25k lending limit"],
    color: '#2563EB',
  },
  {
    icon: BarChart3,
    name: "Credit Builder",
    tagline: "Track Record",
    description: "Build a verified lending history on Vony that shows you're trustworthy with money.",
    highlights: ["Verified lending score", "Shareable trust profile", "Repayment history export"],
    color: '#82F0B9',
  },
  {
    icon: Zap,
    name: "Instant Transfer",
    tagline: "Speed",
    description: "Send and receive loan payments instantly instead of waiting for bank transfers.",
    highlights: ["Real-time payments", "No transfer delays", "Works with any bank"],
    color: '#2563EB',
  },
  {
    icon: FileCheck,
    name: "Smart Agreements",
    tagline: "AI-Powered",
    description: "Auto-generated loan agreements tailored to your terms, ready to sign and share.",
    highlights: ["Custom clauses", "Digital signatures", "Legal templates"],
    color: '#82F0B9',
  },
  {
    icon: Users,
    name: "Group Pools",
    tagline: "Community",
    description: "Pool money with friends for shared goals: trips, gifts, or emergency funds.",
    highlights: ["Transparent contributions", "Automatic splits", "Group dashboard"],
    color: '#2563EB',
  },
  {
    icon: Shield,
    name: "Payment Protection",
    tagline: "Safety Net",
    description: "Optional coverage that protects lenders if a borrower misses payments.",
    highlights: ["Missed payment coverage", "Flexible plans", "Automated claims"],
    color: '#82F0B9',
  },
];

const guides = [
  {
    icon: Scale,
    title: "Setting Fair Interest Rates",
    description: "What's reasonable when lending to friends? Learn how to set rates that are fair to both sides without making things awkward.",
    readTime: "4 min read",
    color: '#82F0B9',
  },
  {
    icon: FileCheck,
    title: "Writing a Loan Agreement That Works",
    description: "The key terms every peer loan should include: amount, schedule, what happens if things change, and how to bring it up naturally.",
    readTime: "5 min read",
    color: '#2563EB',
  },
  {
    icon: Heart,
    title: "When a Friend Can't Pay You Back",
    description: "How to have the conversation, renegotiate terms, and protect the relationship when repayment stalls.",
    readTime: "6 min read",
    color: '#82F0B9',
  },
  {
    icon: Receipt,
    title: "Tax Implications of Peer Lending",
    description: "What the IRS expects when you lend or borrow over $10k, how gift rules apply, and when interest income matters.",
    readTime: "5 min read",
    color: '#2563EB',
  },
  {
    icon: Brain,
    title: "The Psychology of Lending to Friends",
    description: "Why money changes relationships, how to set boundaries without guilt, and when it's okay to say no.",
    readTime: "4 min read",
    color: '#82F0B9',
  },
  {
    icon: Landmark,
    title: "Building Your Lending Track Record",
    description: "How consistent, on-time payments and responsible lending on Vony build trust with your network over time.",
    readTime: "3 min read",
    color: '#2563EB',
  },
];

export default function ComingSoon() {
  const { user: authUser, userProfile } = useAuth();
  const user = userProfile ? { ...userProfile, id: authUser?.id } : null;
  const [activeTab, setActiveTab] = useState('shop');
  const [learnCategory, setLearnCategory] = useState('lending');

  return (
    <div className="home-with-sidebar" style={{ minHeight: '100vh', fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", fontSize: 14, lineHeight: 1.5, color: '#1A1918', WebkitFontSmoothing: 'antialiased', paddingTop: 88, background: 'transparent' }}>
      <DashboardSidebar activePage="ComingSoon" user={user} tabs={[{key:'shop',label:'Shop'},{key:'learn',label:'Learn'}]} activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 40px', background: 'transparent', position: 'relative', zIndex: 2 }}>

          {/* Page content */}
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 40px 64px' }}>

            {/* Tab switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', gap: 2, background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: 3, backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)' }}>
                {[{key:'shop',label:'Shop'},{key:'learn',label:'Learn'}].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    padding: '7px 20px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    fontWeight: activeTab === tab.key ? 600 : 500,
                    color: activeTab === tab.key ? '#1A1918' : 'rgba(255,255,255,0.88)',
                    background: activeTab === tab.key ? 'white' : 'transparent',
                    boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}>{tab.label}</button>
                ))}
              </div>
            </div>

            {/* ═══ Shop Tab ═══ */}
            {activeTab === 'shop' && (
              <div>
                {/* Intro card */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{ padding: '24px 28px', marginBottom: 20 }}
                >
                  <span style={{ fontSize: 11, color: '#787776', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 500, fontFamily: "'IBM Plex Mono', monospace" }}>
                    What We're Building
                  </span>
                  <p style={{ fontSize: 14, color: '#5C5B5A', margin: '10px 0 0', lineHeight: 1.6 }}>
                    New tools to make lending between friends simpler, safer, and smarter. These features are in development. We'll notify you when they launch.
                  </p>
                </motion.div>

                {/* Products grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {products.map((product, index) => (
                    <motion.div
                      key={product.name}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + index * 0.06 }}
                      className="glass-card"
                      style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${product.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <product.icon size={20} style={{ color: product.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#9B9A98', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{product.name}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: product.color, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono', monospace" }}>{product.tagline}</span>
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: 13, color: '#5C5B5A', lineHeight: 1.55, margin: '0 0 16px' }}>
                        {product.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                        {product.highlights.map((h, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: product.color, flexShrink: 0, opacity: 0.6 }} />
                            <span style={{ fontSize: 12, color: '#787776' }}>{h}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: 'auto' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 14px', borderRadius: 10,
                          background: 'rgba(0,0,0,0.03)', fontSize: 11, fontWeight: 600,
                          color: '#787776', fontFamily: "'DM Sans', sans-serif",
                        }}>
                          <Lock size={12} />
                          Coming Soon
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ Learn Tab ═══ */}
            {activeTab === 'learn' && (
              <div>
                {/* Category bar */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                  <div style={{ display: 'inline-flex', gap: 2, background: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: 4, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    {LEARN_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setLearnCategory(cat.id)}
                        style={{
                          padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                          fontWeight: learnCategory === cat.id ? 700 : 400,
                          color: learnCategory === cat.id ? '#1A1918' : '#5C5B5A',
                          background: learnCategory === cat.id ? 'white' : 'transparent',
                          boxShadow: learnCategory === cat.id ? '0 1px 6px rgba(0,0,0,0.1)' : 'none',
                          transition: 'all 0.15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Articles grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  {(LEARN_ARTICLES[learnCategory] || []).map((article, index) => (
                    <motion.div
                      key={article.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        background: 'white', borderRadius: 18, padding: '24px 22px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', cursor: 'default',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{
                        display: 'inline-block', fontSize: 10, fontWeight: 600, color: '#9B9A98',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        background: 'rgba(0,0,0,0.05)', borderRadius: 6, padding: '3px 8px', marginBottom: 14,
                      }}>
                        Coming Soon
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1918', lineHeight: 1.35, marginBottom: 12 }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#787776', lineHeight: 1.6 }}>
                        {article.body}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </div>

        {/* Footer */}
        <div style={{ padding: '12px 28px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#787776' }}>2026 Vony, Inc. All rights reserved.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <a href="https://www.vony-lending.com/terms" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#787776', textDecoration: 'none' }}>Terms of Service</a>
            <a href="https://www.vony-lending.com/privacy" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#787776', textDecoration: 'none' }}>Privacy Center</a>
            <a href="https://www.vony-lending.com/do-not-sell" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#787776', textDecoration: 'none' }}>Do not sell or share my personal information</a>
          </div>
        </div>
        </div>
    </div>
  );
}
