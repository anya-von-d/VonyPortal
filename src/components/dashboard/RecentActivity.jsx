import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Activity, ArrowUpRight, ArrowDownRight, DollarSign, Send, Check, X, Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  defaulted: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  declined: "bg-red-100 text-red-800 border-red-200"
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
  
  const loanActivities = safeLoans.map(loan => ({ type: 'loan', ...loan, date: loan.created_at }));
  const paymentActivities = myPayments.map(payment => ({ type: 'payment', ...payment, date: payment.payment_date || payment.created_at }));

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
      const amount = `$${activity.amount?.toLocaleString() || '0'}`;
      const username = `@${otherParty?.username || 'user'}`;

      // Determine the activity description based on status and role
      if (activity.status === 'pending' || !activity.status) {
        if (isLender) {
          title = `Sent ${amount} loan offer to ${username}`;
          icon = <Send className="w-5 h-5 text-[#F3F0EC]" />;
          iconBg = 'bg-[#35B276]';
        } else {
          title = `Received ${amount} loan offer from ${username}`;
          icon = <ArrowDownRight className="w-5 h-5 text-[#F3F0EC]" />;
          iconBg = 'bg-blue-500';
        }
      } else if (activity.status === 'active') {
        if (isLender) {
          title = `${username} accepted your ${amount} loan`;
          icon = <Check className="w-5 h-5 text-[#F3F0EC]" />;
          iconBg = 'bg-[#35B276]';
        } else {
          title = `You accepted ${amount} loan from ${username}`;
          icon = <Check className="w-5 h-5 text-[#F3F0EC]" />;
          iconBg = 'bg-[#35B276]';
        }
      } else if (activity.status === 'declined') {
        if (isLender) {
          title = `${username} declined your ${amount} loan`;
          icon = <X className="w-5 h-5 text-white" />;
          iconBg = 'bg-red-500';
        } else {
          title = `You declined ${amount} loan from ${username}`;
          icon = <X className="w-5 h-5 text-white" />;
          iconBg = 'bg-red-500';
        }
      } else if (activity.status === 'cancelled') {
        if (isLender) {
          title = `You cancelled ${amount} loan offer to ${username}`;
          icon = <Ban className="w-5 h-5 text-white" />;
          iconBg = 'bg-gray-500';
        } else {
          title = `${username} cancelled their ${amount} loan offer`;
          icon = <Ban className="w-5 h-5 text-white" />;
          iconBg = 'bg-gray-500';
        }
      } else if (activity.status === 'completed') {
        if (isLender) {
          title = `${username} fully repaid your ${amount} loan`;
          icon = <Check className="w-5 h-5 text-white" />;
          iconBg = 'bg-blue-500';
        } else {
          title = `You fully repaid ${amount} loan to ${username}`;
          icon = <Check className="w-5 h-5 text-white" />;
          iconBg = 'bg-blue-500';
        }
      } else {
        title = isLender ? `${amount} loan to ${username}` : `${amount} loan from ${username}`;
        icon = <Activity className="w-5 h-5 text-[#F3F0EC]" />;
        iconBg = 'bg-[#35B276]';
      }

      description = activity.date ? format(new Date(activity.date), 'MMM d, yyyy') : 'N/A';
    }

    if (activity.type === 'payment') {
      const associatedLoan = safeLoans.find(l => l && l.id === activity.loan_id);
      if (!associatedLoan) return null;

      const isBorrower = associatedLoan.borrower_id === user.id;
      const otherPartyId = isBorrower ? associatedLoan.lender_id : associatedLoan.borrower_id;
      const otherParty = getUserById(otherPartyId);
      const amount = `$${activity.amount?.toLocaleString() || '0'}`;
      const username = `@${otherParty?.username || 'user'}`;

      if (isBorrower) {
        title = `Made ${amount} payment to ${username}`;
        icon = <ArrowUpRight className="w-5 h-5 text-white" />;
      } else {
        title = `Received ${amount} payment from ${username}`;
        icon = <ArrowDownRight className="w-5 h-5 text-white" />;
      }
      description = activity.date ? format(new Date(activity.date), 'MMM d, yyyy') : 'N/A';
      iconBg = 'bg-purple-500';
      status = 'completed';
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