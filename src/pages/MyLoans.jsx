import React, { useState, useEffect } from "react";
import { Loan, Payment, User, LoanAgreement, PublicProfile } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, ArrowUpRight, ArrowDownRight, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";

import LoanCard from "../components/loans/LoanCard";
import RecordPaymentModal from "../components/loans/RecordPaymentModal";
import LoanDetailsModal from "../components/loans/LoanDetailsModal";
import LoanProgress from "../components/dashboard/LoanProgress";

export default function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loanToCancel, setLoanToCancel] = useState(null);
  const [activeTab, setActiveTab] = useState('borrowing');
  const [publicProfiles, setPublicProfiles] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const safeEntityCall = async (entityCall, fallback = []) => {
    try {
      const result = await entityCall();
      // Ensure result is an array if it's not already, or use fallback
      return Array.isArray(result) ? result : (result ? [result] : fallback);
    } catch (error) {
      console.error("Entity call failed:", error);
      return fallback;
    }
  };

  const loadData = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    let currentUser = null;
    try {
      currentUser = await User.me();
      setUser(currentUser);
    } catch (userError) {
      console.log("User not authenticated");
      setIsLoading(false);
      return;
    }

    const [allLoans, allProfiles] = await Promise.all([
      safeEntityCall(() => Loan.list('-created_at')),
      safeEntityCall(() => PublicProfile.list())
    ]);
    const userLoans = allLoans.filter(loan =>
      loan.lender_id === currentUser.id || loan.borrower_id === currentUser.id
    );

    setLoans(userLoans);
    setPublicProfiles(allProfiles);
    setIsLoading(false);
  };

  const handleMakePayment = (loan) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
  };

  const handleViewDetails = (loan, type) => {
    setSelectedLoanDetails({ loan, type });
    setShowDetailsModal(true);
  };

  const handlePaymentComplete = async () => {
    setShowPaymentModal(false);
    setSelectedLoan(null);
    await loadData();
  };

  const handleCancelLoan = (loan) => {
    setLoanToCancel(loan);
    setShowCancelDialog(true);
  };

  const confirmCancelLoan = async () => {
    if (!loanToCancel) return;

    try {
      // Update loan status to cancelled
      await Loan.update(loanToCancel.id, { status: 'cancelled' });

      // Find and update the corresponding loan agreement
      const agreements = await LoanAgreement.list();
      const agreement = agreements.find(a => a.loan_id === loanToCancel.id);
      
      if (agreement) {
         const cancellationText = `Loan Cancelled by ${user.full_name} (${user.username})`;
         await LoanAgreement.update(agreement.id, {
           cancelled_by: user.full_name,
           cancelled_date: new Date().toISOString(),
           cancellation_note: cancellationText
         });
       }

      setShowCancelDialog(false);
      setLoanToCancel(null);
      await loadData();
    } catch (error) {
      console.error("Error cancelling loan:", error);
    }
  };



  // Only show loans that are active, completed, or cancelled (not pending or declined)
  const validStatuses = ['active', 'completed', 'cancelled'];
  const lentLoans = loans.filter(loan => loan.lender_id === user?.id && validStatuses.includes(loan.status));
  const borrowedLoans = loans.filter(loan => loan.borrower_id === user?.id && validStatuses.includes(loan.status));

  const renderLoanSection = (loanList, type, status) => {
    if (loanList.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-slate-500 text-sm">No {status} loans</p>
        </div>
      );
    }
    return loanList.map((loan, index) => (
      <motion.div
        key={loan.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
      >
        <LoanCard
          loan={loan}
          type={type}
          onMakePayment={() => handleMakePayment(loan)}
          onDetails={() => handleViewDetails(loan, type)}
        />
      </motion.div>
    ));
  };

  const totalLentActive = lentLoans.filter(l => l.status === 'active').reduce((sum, loan) => sum + (loan.amount || 0), 0);
  const totalBorrowedActive = borrowedLoans.filter(l => l.status === 'active').reduce((sum, loan) => sum + (loan.amount || 0), 0);

  // Find next payment due (as borrower)
  const nextPaymentLoan = borrowedLoans
    .filter(loan => loan.status === 'active' && loan.next_payment_date)
    .map(loan => ({ ...loan, date: new Date(loan.next_payment_date) }))
    .sort((a, b) => a.date - b.date)[0];

  const getNextPaymentDays = () => {
    if (!nextPaymentLoan) return null;
    const today = new Date();
    const paymentDate = new Date(nextPaymentLoan.date);
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nextPaymentDays = getNextPaymentDays();
  const nextPaymentAmount = nextPaymentLoan?.payment_amount || 0;
  const nextPaymentLenderUsername = nextPaymentLoan
    ? publicProfiles.find(p => p.user_id === nextPaymentLoan.lender_id)?.username || 'user'
    : null;

  return (
    <div className="min-h-screen p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight text-center">
            My Loans
          </h1>
          <p className="text-lg text-slate-600 text-center">
            Manage your lending and borrowing activity
          </p>
        </motion.div>

        {/* Next Payment Cards - Top Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="text-white" style={{backgroundColor: '#35B276'}}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Next Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-1">
                {nextPaymentLoan ? `$${nextPaymentAmount.toLocaleString()}` : '-'}
              </div>
              <p className="opacity-80">
                {nextPaymentLoan
                  ? `to @${nextPaymentLenderUsername}`
                  : 'No payments due'}
              </p>
            </CardContent>
          </Card>

          <Card className="text-white" style={{backgroundColor: '#35B276'}}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Next Payment Due
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-1">
                {nextPaymentLoan
                  ? (nextPaymentDays < 0
                      ? 'Overdue'
                      : `${nextPaymentDays} day${nextPaymentDays !== 1 ? 's' : ''}`)
                  : '-'}
              </div>
              <p className="opacity-80">
                {nextPaymentLoan
                  ? format(new Date(nextPaymentLoan.next_payment_date), 'MMM d, yyyy')
                  : 'No due date'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'borrowing' ? (
          <motion.div
            key="borrowing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <ArrowDownRight className="w-4 h-4 text-blue-600" />
                    </div>
                    Borrowing
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setActiveTab('borrowing')}
                      variant={activeTab === 'borrowing' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex items-center gap-1 ${
                        activeTab === 'borrowing'
                          ? 'bg-[#35B276] hover:bg-[#2d9a65] text-white'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      Borrowing ({borrowedLoans.length})
                    </Button>
                    <Button
                      onClick={() => setActiveTab('lending')}
                      variant={activeTab === 'lending' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex items-center gap-1 ${
                        activeTab === 'lending'
                          ? 'bg-[#35B276] hover:bg-[#2d9a65] text-white'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Lending ({lentLoans.length})
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-1">Loans you've received from others</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="bg-white/70 backdrop-blur-sm border-slate-200/60 animate-pulse p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="space-y-4">
                    {renderLoanSection(borrowedLoans.filter(l => l.status === 'active'), 'borrowed', 'active')}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="lending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    </div>
                    Lending
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setActiveTab('borrowing')}
                      variant={activeTab === 'borrowing' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex items-center gap-1 ${
                        activeTab === 'borrowing'
                          ? 'bg-[#35B276] hover:bg-[#2d9a65] text-white'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      Borrowing ({borrowedLoans.length})
                    </Button>
                    <Button
                      onClick={() => setActiveTab('lending')}
                      variant={activeTab === 'lending' ? 'default' : 'outline'}
                      size="sm"
                      className={`flex items-center gap-1 ${
                        activeTab === 'lending'
                          ? 'bg-[#35B276] hover:bg-[#2d9a65] text-white'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Lending ({lentLoans.length})
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-1">Loans you've given to others</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="bg-white/70 backdrop-blur-sm border-slate-200/60 animate-pulse p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="space-y-4">
                    {renderLoanSection(lentLoans.filter(l => l.status === 'active'), 'lent', 'active')}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Bottom Section - Active Lending, Active Borrowing, and Loan Progress */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left side - Active Lending and Active Borrowing stacked */}
          <div className="lg:col-span-1 space-y-4">
            <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-600 mb-4">Active Lending</p>
                <p className="text-2xl font-bold text-slate-800 mb-1">
                  ${totalLentActive.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 font-medium">{lentLoans.filter(l => l.status === 'active').length} active loans</p>
              </CardContent>
            </Card>

            <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-600 mb-4">Active Borrowing</p>
                <p className="text-2xl font-bold text-slate-800 mb-1">
                  ${totalBorrowedActive.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500 font-medium">{borrowedLoans.filter(l => l.status === 'active').length} active loans</p>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Loan Progress */}
          <div className="lg:col-span-2">
            {user && loans.length > 0 && (
              <LoanProgress loans={loans} userId={user.id} />
            )}
          </div>
        </div>

        {/* Modals */}
        {showPaymentModal && selectedLoan && (
          <RecordPaymentModal
            loan={selectedLoan}
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={handlePaymentComplete}
            isLender={selectedLoan.lender_id === user?.id}
          />
        )}

        {showDetailsModal && selectedLoanDetails && (
          <LoanDetailsModal
            loan={selectedLoanDetails.loan}
            type={selectedLoanDetails.type}
            isOpen={showDetailsModal}
            user={user}
            onCancel={() => handleCancelLoan(selectedLoanDetails.loan)}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedLoanDetails(null);
            }}
          />
        )}

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Loan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this loan? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Loan</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmCancelLoan}
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel Loan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}