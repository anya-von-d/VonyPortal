import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Activity, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200", 
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  defaulted: "bg-red-100 text-red-800 border-red-200"
};

export default function RecentActivity({ loans, payments, isLoading, user, allUsers }) {
  // Always ensure we have arrays to work with
  const safeLoans = Array.isArray(loans) ? loans : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeAllUsers = Array.isArray(allUsers) ? allUsers : [];

  if (isLoading || !user) {
    return (
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
        <CardHeader className="border-b border-slate-200/40 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-200/40">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUserById = (userId) => {
    // The allUsers prop is now a list of Public Profiles, so we find by user_id
    const foundUser = safeAllUsers.find(u => u && u.user_id === userId);
    if (foundUser) {
      return foundUser;
    }
    
    // If not found, return a placeholder object
    return {
      id: userId,
      username: 'user',
      full_name: 'Unknown User',
      profile_picture_url: null
    };
  };

  const myLoanIds = safeLoans.map(l => l && l.id).filter(Boolean);
  const myPayments = safePayments.filter(p => p && myLoanIds.includes(p.loan_id));
  
  const loanActivities = safeLoans.map(loan => ({ type: 'loan', ...loan, date: loan.updated_date || loan.created_date }));
  const paymentActivities = myPayments.map(payment => ({ type: 'payment', ...payment, date: payment.payment_date || payment.created_date }));

  const recentActivity = [...loanActivities, ...paymentActivities]
    .filter(activity => activity && activity.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const renderActivityItem = (activity) => {
    if (!activity) return null;
    
    let title = "Activity";
    let description = "";
    let icon = <Activity className="w-5 h-5 text-slate-500" />;
    let iconBg = "bg-slate-100";
    let status = activity.status;

    if (activity.type === 'loan') {
      const isLender = activity.lender_id === user.id;
      const otherPartyId = isLender ? activity.borrower_id : activity.lender_id;
      const otherParty = getUserById(otherPartyId);

      title = isLender 
        ? `Sent $${activity.amount?.toLocaleString() || '0'} Loan Offer to @${otherParty?.username || 'user'}`
        : `Received $${activity.amount?.toLocaleString() || '0'} Loan Offer from @${otherParty?.username || 'user'}`;
      
      description = `${format(new Date(activity.date), 'MMM d, yyyy')}`;
      icon = isLender ? <ArrowUpRight className="w-5 h-5 text-[#F3F0EC] opacity-90" /> : <ArrowDownRight className="w-5 h-5 text-[#F3F0EC] opacity-90" />;
      iconBg = 'bg-[#35B276] opacity-100';
    }

    if (activity.type === 'payment') {
      const associatedLoan = safeLoans.find(l => l && l.id === activity.loan_id);
      if (!associatedLoan) return null;
      
      const isBorrower = associatedLoan.borrower_id === user.id;
      const otherPartyId = isBorrower ? associatedLoan.lender_id : associatedLoan.borrower_id;
      const otherParty = getUserById(otherPartyId);

      title = isBorrower 
        ? `You Paid $${activity.amount?.toLocaleString() || '0'} to @${otherParty?.username || 'user'}` 
        : `Received $${activity.amount?.toLocaleString() || '0'} Payment from @${otherParty?.username || 'user'}`;
      description = `${format(new Date(activity.date), 'MMM d, yyyy')}`;
      icon = <DollarSign className="w-5 h-5 text-[#F3F0EC] opacity-90" />;
      iconBg = 'bg-[#35B276] opacity-100';
      status = 'completed'; // Payments are always completed here
    }

    return (
      <motion.div
        key={`${activity.type}-${activity.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 rounded-xl border border-slate-200/40 hover:bg-slate-50/50 transition-colors duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            {icon}
          </div>
          <div>
            <p className="font-medium text-slate-800 group-hover:text-slate-900 text-sm">
              {title}
            </p>
            <p className="text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
        {status && (
          <Badge className={`${statusColors[status]} border font-medium capitalize`}>
            {status}
          </Badge>
        )}
      </motion.div>
    );
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
      <CardHeader className="border-b border-slate-200/40 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Activity className="w-5 h-5 text-green-600" />
            Recent Activity
          </CardTitle>
          <Link to={createPageUrl("RecentActivity")}>
            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-4">No recent activity</p>
            <Link to={createPageUrl("CreateLoan")}>
              <Button className="bg-green-600 hover:bg-green-700">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => 
              <motion.div
                key={`${activity.type}-${activity.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {renderActivityItem(activity)}
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}