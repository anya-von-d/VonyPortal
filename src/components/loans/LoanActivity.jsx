import React, { useState, useEffect } from "react";
import { Payment, PublicProfile } from "@/entities/all";
import { format } from "date-fns";
import { ArrowDownLeft, XCircle, CreditCard, CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/components/utils/formatMoney";

export default function LoanActivity({ agreement, loan, user }) {
  const [payments, setPayments] = useState([]);
  const [lenderName, setLenderName] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allPayments, profiles] = await Promise.all([
          Payment.list(),
          PublicProfile.list()
        ]);
        
        const loanPayments = (allPayments || []).filter(p => p.loan_id === agreement.loan_id);
        setPayments(loanPayments);
        
        const lenderProfile = (profiles || []).find(p => p.user_id === agreement.lender_id);
        const borrowerProfile = (profiles || []).find(p => p.user_id === agreement.borrower_id);
        
        setLenderName(lenderProfile?.full_name || "Lender");
        setBorrowerName(borrowerProfile?.full_name || "Borrower");
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [agreement.loan_id, agreement.lender_id, agreement.borrower_id]);

  const buildActivityLog = () => {
    const activities = [];

    // Add borrower signature
    if (agreement.borrower_signed_date) {
      activities.push({
        timestamp: new Date(agreement.borrower_signed_date),
        type: 'signature',
        person: borrowerName,
        description: 'signed the loan agreement'
      });
    }

    // Add lender signature
    if (agreement.lender_signed_date) {
      activities.push({
        timestamp: new Date(agreement.lender_signed_date),
        type: 'signature',
        person: lenderName,
        description: 'signed the loan agreement'
      });
    }

    // Add payments
    payments.forEach(payment => {
      activities.push({
        timestamp: new Date(payment.payment_date),
        type: 'payment',
        person: borrowerName,
        amount: payment.amount,
        description: `made a payment of`
      });
    });

    // Add cancellation
    if (agreement.cancelled_by) {
      activities.push({
        timestamp: new Date(agreement.cancelled_date),
        type: 'cancellation',
        person: agreement.cancelled_by,
        description: 'cancelled the loan'
      });
    }

    // Add completion
    if (loan?.status === 'completed') {
      activities.push({
        timestamp: new Date(loan.updated_date),
        type: 'completion',
        person: 'System',
        description: 'loan repaid in full'
      });
    }

    // Sort by timestamp
    return activities.sort((a, b) => a.timestamp - b.timestamp);
  };

  const activities = buildActivityLog();

  const getActivityIcon = (type) => {
    switch(type) {
      case 'payment':
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case 'cancellation':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'completion':
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case 'signature':
        return <CreditCard className="w-5 h-5 text-slate-600" />;
      default:
        return null;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'payment':
        return 'bg-green-50 border-green-200';
      case 'cancellation':
        return 'bg-red-50 border-red-200';
      case 'completion':
        return 'bg-blue-50 border-blue-200';
      case 'signature':
        return 'bg-slate-50 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  if (isLoading) {
    return <div className="text-center text-slate-500 py-8">Loading activity...</div>;
  }

  return (
    <div className="mt-8 pt-6 border-t border-slate-200/40">
      <h4 className="font-semibold text-slate-800 mb-4">Loan Activity</h4>
      {activities.length === 0 ? (
        <p className="text-slate-500 text-sm">No activity recorded</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className={`border rounded-lg p-3 flex gap-3 items-center justify-between ${getActivityColor(activity.type)}`}>
              <div className="flex gap-3 items-center flex-grow">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-semibold text-slate-800">{activity.person}</span>
                  <span className="text-slate-700">{activity.description}</span>
                  {activity.amount && (
                     <span className="font-bold text-green-600">{formatMoney(activity.amount)}</span>
                   )}
                </div>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap ml-4">{format(activity.timestamp, 'MMM d, yyyy h:mm a')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}