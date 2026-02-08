import React, { useState, useEffect } from "react";
import { Loan, Payment, User, PublicProfile } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowUpRight, ArrowDownRight, DollarSign, Send, Check, X, Ban } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  defaulted: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
  declined: "bg-red-100 text-red-800 border-red-200"
};

export default function RecentActivityPage() {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [user, setUser] = useState(null);
  const [publicProfiles, setPublicProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const safeEntityCall = async (entityCall, fallback = []) => {
    try {
      const result = await entityCall();
      return Array.isArray(result) ? result : (result ? [result] : fallback);
    } catch (error) {
      console.error("Entity call failed:", error);
      return fallback;
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const [allLoans, allPayments, allProfiles] = await Promise.all([
        safeEntityCall(() => Loan.list('-created_at')),
        safeEntityCall(() => Payment.list('-created_at')),
        safeEntityCall(() => PublicProfile.list()),
      ]);
      
      setLoans(allLoans);
      setPayments(allPayments);
      setPublicProfiles(allProfiles);
    } catch (error) {
      console.error("User not authenticated or data load error:", error);
      setUser(null);
      setLoans([]);
      setPayments([]);
      setPublicProfiles([]);
    }
    setIsLoading(false);
  };

  const getUserById = (userId) => {
    const foundUser = publicProfiles.find(u => u && u.user_id === userId);
    if (foundUser) {
      return foundUser;
    }
    return {
      id: userId,
      username: 'user',
      full_name: 'Unknown User',
      profile_picture_url: null
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-96">
          <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm p-8">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor: `rgb(var(--theme-primary))`}}></div>
              <p className="text-slate-600">Loading activity...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-96">
          <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm p-8">
            <div className="text-center">
              <p className="text-slate-600">Please log in to view activity</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const safeLoans = Array.isArray(loans) ? loans : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  
  const myLoans = safeLoans.filter(loan => loan && (loan.lender_id === user.id || loan.borrower_id === user.id));
  const myLoanIds = myLoans.map(l => l && l.id).filter(Boolean);
  const myPayments = safePayments.filter(p => p && myLoanIds.includes(p.loan_id));
  
  const loanActivities = myLoans.map(loan => ({
    type: 'loan',
    ...loan,
    date: loan.created_at
  }));

  const paymentActivities = myPayments.map(payment => ({
    type: 'payment',
    ...payment,
    date: payment.payment_date || payment.created_at
  }));

  let allActivities = [...loanActivities, ...paymentActivities]
    .filter(activity => activity && activity.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply filters
  if (filterType !== "all") {
    allActivities = allActivities.filter(a => a.type === filterType);
  }
  
  if (filterStatus !== "all") {
    allActivities = allActivities.filter(a => a.status === filterStatus);
  }

  if (filterPayment !== "all") {
    allActivities = allActivities.filter(a => {
      if (a.type === 'payment') {
        const associatedLoan = safeLoans.find(l => l && l.id === a.loan_id);
        if (!associatedLoan) return false;
        const isBorrower = associatedLoan.borrower_id === user.id;
        if (filterPayment === "sent") return isBorrower;
        if (filterPayment === "received") return !isBorrower;
      }
      return true;
    });
  }

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
        // Loan offer sent or received
        if (isLender) {
          title = `Sent ${amount} loan offer to ${username}`;
          icon = <Send className="w-5 h-5 text-green-600" />;
          iconBg = 'bg-green-100';
        } else {
          title = `Received ${amount} loan offer from ${username}`;
          icon = <ArrowDownRight className="w-5 h-5 text-blue-600" />;
          iconBg = 'bg-blue-100';
        }
      } else if (activity.status === 'active') {
        // Loan accepted
        if (isLender) {
          title = `${username} accepted your ${amount} loan offer`;
          icon = <Check className="w-5 h-5 text-green-600" />;
          iconBg = 'bg-green-100';
        } else {
          title = `You accepted ${amount} loan from ${username}`;
          icon = <Check className="w-5 h-5 text-green-600" />;
          iconBg = 'bg-green-100';
        }
      } else if (activity.status === 'declined') {
        // Loan declined
        if (isLender) {
          title = `${username} declined your ${amount} loan offer`;
          icon = <X className="w-5 h-5 text-red-600" />;
          iconBg = 'bg-red-100';
        } else {
          title = `You declined ${amount} loan from ${username}`;
          icon = <X className="w-5 h-5 text-red-600" />;
          iconBg = 'bg-red-100';
        }
      } else if (activity.status === 'cancelled') {
        // Loan cancelled by lender
        if (isLender) {
          title = `You cancelled ${amount} loan offer to ${username}`;
          icon = <Ban className="w-5 h-5 text-gray-600" />;
          iconBg = 'bg-gray-100';
        } else {
          title = `${username} cancelled their ${amount} loan offer`;
          icon = <Ban className="w-5 h-5 text-gray-600" />;
          iconBg = 'bg-gray-100';
        }
      } else if (activity.status === 'completed') {
        // Loan fully paid off
        if (isLender) {
          title = `${username} fully repaid your ${amount} loan`;
          icon = <Check className="w-5 h-5 text-blue-600" />;
          iconBg = 'bg-blue-100';
        } else {
          title = `You fully repaid ${amount} loan to ${username}`;
          icon = <Check className="w-5 h-5 text-blue-600" />;
          iconBg = 'bg-blue-100';
        }
      } else {
        // Fallback for any other status
        title = isLender
          ? `${amount} loan to ${username}`
          : `${amount} loan from ${username}`;
        icon = <Activity className="w-5 h-5 text-slate-600" />;
        iconBg = 'bg-slate-100';
      }

      description = activity.date ? format(new Date(activity.date), 'MMM d, yyyy • h:mm a') : 'N/A';
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
        title = `You made a ${amount} payment to ${username}`;
        icon = <ArrowUpRight className="w-5 h-5 text-purple-600" />;
      } else {
        title = `Received ${amount} payment from ${username}`;
        icon = <ArrowDownRight className="w-5 h-5 text-purple-600" />;
      }
      description = activity.date ? format(new Date(activity.date), 'MMM d, yyyy • h:mm a') : 'N/A';
      iconBg = 'bg-purple-100';
      status = 'completed';
    }

    return (
      <motion.div
        key={`${activity.type}-${activity.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-5 rounded-xl border hover:shadow-md transition-all duration-200 group"
        style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${iconBg}`}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-slate-900">
              {title}
            </p>
            <p className="text-sm text-slate-500 mt-1">
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
    <div className="min-h-screen p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight text-center">
            Recent Activity
          </h1>
          <p className="text-lg text-slate-600 text-center">
            Track all your loan offers and payments
          </p>
        </motion.div>

        <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <span className="text-sm font-medium text-slate-700">Filters:</span>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Categories</SelectItem>
                  <SelectItem value="loan">Loan Update</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filterStatus} 
                onValueChange={(value) => {
                  setFilterStatus(value);
                  if (value !== "all") {
                    setFilterType("loan");
                    setFilterPayment("all");
                  }
                }} 
                disabled={filterType === "payment"}
              >
                <SelectTrigger className="w-full md:w-48 disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Loan Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Loan Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filterPayment} 
                onValueChange={(value) => {
                  setFilterPayment(value);
                  if (value !== "all") {
                    setFilterType("payment");
                    setFilterStatus("all");
                  }
                }} 
                disabled={filterType === "loan"}
              >
                <SelectTrigger className="w-full md:w-48 disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Payment Type</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {allActivities.length === 0 ? (
          <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{backgroundColor: `rgb(var(--theme-primary-light))`}}>
                <Activity className="w-10 h-10" style={{color: `rgb(var(--theme-primary))`}} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No activity found</h3>
              <p className="text-slate-600">Try adjusting your filters or start creating loans</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allActivities.map((activity, index) => (
              <motion.div
                key={`${activity.type}-${activity.id}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {renderActivityItem(activity)}
              </motion.div>
            ))}
          </div>
        )}

        {allActivities.length > 0 && (
          <div className="text-center text-sm text-slate-500">
            Showing {allActivities.length} {allActivities.length === 1 ? 'activity' : 'activities'}
          </div>
        )}
      </div>
    </div>
  );
}