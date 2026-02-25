import React, { useState, useEffect } from "react";
import { Loan, Payment, User, LoanAgreement, PublicProfile } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import {
  ArrowDownRight, Clock, Calendar, DollarSign, Inbox, TrendingDown,
  CheckCircle, AlertCircle, CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import LoanCard from "@/components/loans/LoanCard";
import RecordPaymentModal from "@/components/loans/RecordPaymentModal";
import LoanDetailsModal from "@/components/loans/LoanDetailsModal";
import MyLoanOffers from "@/components/dashboard/MyLoanOffers";
import BorrowerSignatureModal from "@/components/loans/BorrowerSignatureModal";

export default function Borrowing() {
  const [loans, setLoans] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loanToCancel, setLoanToCancel] = useState(null);
  const [publicProfiles, setPublicProfiles] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

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

    try {
      const [allLoans, allProfiles] = await Promise.all([
        Loan.list('-created_at').catch(() => []),
        PublicProfile.list().catch(() => [])
      ]);

      const userLoans = (allLoans || []).filter(loan =>
        loan.borrower_id === currentUser.id
      );

      setLoans(userLoans);
      setPublicProfiles(allProfiles || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleMakePayment = (loan) => {
    setSelectedLoan(loan);
    setShowPaymentModal(true);
  };

  const handleViewDetails = (loan) => {
    setSelectedLoanDetails({ loan, type: 'borrowed' });
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
      await Loan.update(loanToCancel.id, { status: 'cancelled' });
      const agreements = await LoanAgreement.list();
      const agreement = agreements.find(a => a.loan_id === loanToCancel.id);

      if (agreement) {
        await LoanAgreement.update(agreement.id, {
          cancelled_by: user.full_name,
          cancelled_date: new Date().toISOString(),
          cancellation_note: `Loan Cancelled by ${user.full_name}`
        });
      }

      setShowCancelDialog(false);
      setLoanToCancel(null);
      await loadData();
    } catch (error) {
      console.error("Error cancelling loan:", error);
    }
  };

  const handleSignOffer = async (loanId, signature) => {
    try {
      await Loan.update(loanId, { status: 'active' });

      const agreements = await LoanAgreement.list();
      const agreement = agreements.find(a => a.loan_id === loanId);

      if (agreement) {
        await LoanAgreement.update(agreement.id, {
          borrower_name: signature,
          borrower_signed_date: new Date().toISOString(),
          is_fully_signed: true
        });
      }

      setShowSignModal(false);
      setSelectedOffer(null);
      loadData();
    } catch (error) {
      console.error("Error signing loan offer:", error);
    }
  };

  const handleDeclineOffer = async (loanId) => {
    try {
      await Loan.update(loanId, { status: 'declined' });
      loadData();
    } catch (error) {
      console.error("Error declining loan offer:", error);
    }
  };

  const openSignModal = (offer) => {
    setSelectedOffer(offer);
    setShowSignModal(true);
  };

  // Filter loans by status
  const activeLoans = loans.filter(loan => loan.status === 'active');
  const pendingOffers = loans.filter(loan => loan.status === 'pending');
  const completedLoans = loans.filter(loan => loan.status === 'completed' || loan.status === 'cancelled');

  const totalBorrowed = activeLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
  const totalOwed = activeLoans.reduce((sum, loan) => sum + (loan.total_amount || loan.amount || 0), 0);

  // Calculate total paid across all loans
  const calculateTotalPaid = () => {
    let totalPaid = 0;
    activeLoans.forEach(loan => {
      const paidAmount = loan.amount_paid || 0;
      totalPaid += paidAmount;
    });
    return totalPaid;
  };

  const totalPaid = calculateTotalPaid();
  const remainingBalance = totalOwed - totalPaid;

  // Find next payment due
  const nextPaymentLoan = activeLoans
    .filter(loan => loan.next_payment_date)
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

  // Overall repayment progress
  const overallProgress = totalOwed > 0 ? (totalPaid / totalOwed) * 100 : 0;

  const tabs = [
    { id: 'overview', label: 'All', icon: ArrowDownRight, count: null },
    { id: 'active', label: 'Active Loans', icon: TrendingDown, count: activeLoans.length },
    { id: 'offers', label: 'Loan Offers', icon: Inbox, count: pendingOffers.length },
    { id: 'history', label: 'History', icon: Clock, count: completedLoans.length },
  ];

  return (
    <>
      <div className="min-h-screen p-3 md:p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-4"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight text-center">
              Borrowing
            </h1>
            <p className="text-base md:text-lg text-slate-600 text-center">
              Track your loans, make payments, and manage offers
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                variant={activeSection === tab.id ? 'default' : 'outline'}
                className={`whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-[#35B276] hover:bg-[#2d9a65] text-white'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Pie Chart + Stats Cards Row */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  {/* Pie Chart - Left Side */}
                  <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 md:w-1/3">
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                      <p className="text-sm font-medium text-slate-600 mb-3">Repayment Progress</p>
                      {(() => {
                        const percentPaid = totalOwed > 0 ? Math.round((totalPaid / totalOwed) * 100) : 0;
                        const circumference = 2 * Math.PI * 45;
                        const strokeDashoffset = circumference - (percentPaid / 100) * circumference;

                        return (
                          <div className="relative w-36 h-36">
                            <svg className="w-full h-full transform -rotate-90">
                              {/* Background circle */}
                              <circle
                                cx="72"
                                cy="72"
                                r="45"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="12"
                              />
                              {/* Progress circle */}
                              <circle
                                cx="72"
                                cy="72"
                                r="45"
                                fill="none"
                                stroke="#35B276"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-slate-800">{percentPaid}%</span>
                              <span className="text-xs text-slate-500">Repaid</span>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="mt-3 text-center">
                        <p className="text-xs text-slate-500">
                          ${totalPaid.toLocaleString()} of ${totalOwed.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Cards - Right Side (2x2 Grid) */}
                  <div className="flex-1 grid grid-cols-2 gap-3 md:gap-4">
                    <Card className="text-white" style={{backgroundColor: '#35B276'}}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs md:text-sm opacity-90">Total Borrowed</p>
                          <ArrowDownRight className="w-4 h-4 opacity-75" />
                        </div>
                        <p className="text-xl md:text-2xl font-bold">${totalBorrowed.toLocaleString()}</p>
                        <p className="text-xs opacity-75">{activeLoans.length} active loans</p>
                      </CardContent>
                    </Card>

                    <Card className="text-white" style={{backgroundColor: '#35B276'}}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs md:text-sm opacity-90">Remaining</p>
                          <TrendingDown className="w-4 h-4 opacity-75" />
                        </div>
                        <p className="text-xl md:text-2xl font-bold">${remainingBalance.toLocaleString()}</p>
                        <p className="text-xs opacity-75">${totalPaid.toLocaleString()} paid</p>
                      </CardContent>
                    </Card>

                    <Card className="text-white" style={{backgroundColor: '#35B276'}}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs md:text-sm opacity-90">Pending Offers</p>
                          <Inbox className="w-4 h-4 opacity-75" />
                        </div>
                        <p className="text-xl md:text-2xl font-bold">{pendingOffers.length}</p>
                        <p className="text-xs opacity-75">Awaiting response</p>
                      </CardContent>
                    </Card>

                    <Card className="text-white" style={{backgroundColor: '#35B276'}}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs md:text-sm opacity-90">Next Payment</p>
                          <Calendar className="w-4 h-4 opacity-75" />
                        </div>
                        <p className="text-xl md:text-2xl font-bold">
                          {nextPaymentLoan ? format(new Date(nextPaymentLoan.next_payment_date), 'MMM d') : '-'}
                        </p>
                        <p className="text-xs opacity-75">
                          {nextPaymentLoan ? `$${nextPaymentAmount.toLocaleString()}` : 'No payments due'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Upcoming Payments + Individual Loan Progress */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Upcoming Payments - Left */}
                  <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        Upcoming Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeLoans.filter(l => l.next_payment_date).length === 0 ? (
                        <p className="text-slate-500 text-sm">No upcoming payments</p>
                      ) : (
                        <div className="space-y-3">
                          {activeLoans
                            .filter(l => l.next_payment_date)
                            .sort((a, b) => new Date(a.next_payment_date) - new Date(b.next_payment_date))
                            .slice(0, 3)
                            .map(loan => {
                              const lender = publicProfiles.find(p => p.user_id === loan.lender_id);
                              return (
                                <div key={loan.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                                  <div>
                                    <p className="font-medium text-sm text-slate-800">
                                      ${loan.payment_amount?.toLocaleString() || 0} to @{lender?.username || 'user'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Due {format(new Date(loan.next_payment_date), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.ceil((new Date(loan.next_payment_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                                  </Badge>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Individual Loan Progress - Right */}
                  <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-green-600" />
                        </div>
                        Individual Loan Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeLoans.length === 0 ? (
                        <p className="text-slate-500 text-sm">No active loans to track</p>
                      ) : (
                        <div className="space-y-4">
                          {activeLoans.slice(0, 5).map(loan => {
                            const lender = publicProfiles.find(p => p.user_id === loan.lender_id);
                            const loanTotalOwed = loan.total_amount || loan.amount || 0;
                            const amountPaid = loan.amount_paid || 0;
                            const percentPaid = loanTotalOwed > 0 ? Math.round((amountPaid / loanTotalOwed) * 100) : 0;

                            return (
                              <div key={loan.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#35B276]/20 flex items-center justify-center">
                                      <span className="text-xs font-medium text-[#35B276]">
                                        {lender?.full_name?.charAt(0) || '?'}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">@{lender?.username || 'user'}</span>
                                  </div>
                                  <span className="text-xs text-slate-500">{percentPaid}%</span>
                                </div>
                                <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="absolute top-0 left-0 h-full bg-[#35B276] rounded-full transition-all duration-500"
                                    style={{ width: `${percentPaid}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                  <span>${amountPaid.toLocaleString()} paid</span>
                                  <span>${loanTotalOwed.toLocaleString()} total</span>
                                </div>
                              </div>
                            );
                          })}
                          {activeLoans.length > 5 && (
                            <Button
                              variant="ghost"
                              className="w-full text-[#35B276]"
                              onClick={() => setActiveSection('active')}
                            >
                              View all {activeLoans.length} loans
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Offers Alert */}
                {pendingOffers.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Inbox className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-blue-900">
                            You have {pendingOffers.length} pending loan offer{pendingOffers.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-sm text-blue-700">Review and respond to loan offers from friends</p>
                        </div>
                        <Button
                          onClick={() => setActiveSection('offers')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          View Offers
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {activeSection === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <ArrowDownRight className="w-4 h-4 text-blue-600" />
                      </div>
                      Active Loans
                    </CardTitle>
                    <p className="text-sm text-slate-500">Loans you're currently repaying</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
                      </div>
                    ) : activeLoans.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                        <p>No active loans</p>
                        <p className="text-sm">You're all caught up!</p>
                      </div>
                    ) : (
                      activeLoans.map((loan, index) => (
                        <motion.div
                          key={loan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <LoanCard
                            loan={loan}
                            type="borrowed"
                            onMakePayment={() => handleMakePayment(loan)}
                            onDetails={() => handleViewDetails(loan)}
                          />
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'offers' && (
              <motion.div
                key="offers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Inbox className="w-4 h-4 text-blue-600" />
                      </div>
                      Loan Offers Received
                    </CardTitle>
                    <p className="text-sm text-slate-500">Loan offers from friends waiting for your response</p>
                  </CardHeader>
                  <CardContent>
                    {pendingOffers.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No pending offers</p>
                      </div>
                    ) : (
                      <MyLoanOffers
                        offers={pendingOffers}
                        users={publicProfiles}
                        currentUser={user}
                        onSign={(loanId) => {
                          const offer = pendingOffers.find(o => o.id === loanId);
                          if (offer) openSignModal(offer);
                        }}
                        onDecline={handleDeclineOffer}
                        hideHeader={true}
                        showAcceptButton={true}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeSection === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-slate-600" />
                      </div>
                      Loan History
                    </CardTitle>
                    <p className="text-sm text-slate-500">Completed and cancelled loans</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {completedLoans.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No loan history yet</p>
                      </div>
                    ) : (
                      completedLoans.map((loan, index) => (
                        <motion.div
                          key={loan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <LoanCard
                            loan={loan}
                            type="borrowed"
                            onDetails={() => handleViewDetails(loan)}
                          />
                        </motion.div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      {showPaymentModal && selectedLoan && (
        <RecordPaymentModal
          loan={selectedLoan}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          isLender={false}
        />
      )}

      {showDetailsModal && selectedLoanDetails && (
        <LoanDetailsModal
          loan={selectedLoanDetails.loan}
          type="borrowed"
          isOpen={showDetailsModal}
          user={user}
          onCancel={() => handleCancelLoan(selectedLoanDetails.loan)}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLoanDetails(null);
          }}
        />
      )}

      {showSignModal && selectedOffer && (
        <BorrowerSignatureModal
          isOpen={showSignModal}
          onClose={() => {
            setShowSignModal(false);
            setSelectedOffer(null);
          }}
          onSign={(signature) => handleSignOffer(selectedOffer.id, signature)}
          loanDetails={selectedOffer}
          userFullName={user?.full_name || ''}
          lenderName={publicProfiles.find(p => p.user_id === selectedOffer.lender_id)?.full_name || 'Lender'}
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
    </>
  );
}
