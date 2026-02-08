import React, { useState, useEffect } from "react";
import { Loan, Payment, User, LoanAgreement } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";

import LoanCard from "../components/loans/LoanCard";
import SendMoneyModal from "../components/loans/SendMoneyModal";
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

    const allLoans = await safeEntityCall(() => Loan.list('-created_at'));
    const userLoans = allLoans.filter(loan => 
      loan.lender_id === currentUser.id || loan.borrower_id === currentUser.id
    );
    
    setLoans(userLoans);
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
          onMakePayment={type === 'borrowed' ? () => handleMakePayment(loan) : undefined}
          onDetails={() => handleViewDetails(loan, type)}
        />
      </motion.div>
    ));
  };

  const totalLentActive = lentLoans.filter(l => l.status === 'active').reduce((sum, loan) => sum + (loan.amount || 0), 0);
  const totalBorrowedActive = borrowedLoans.filter(l => l.status === 'active').reduce((sum, loan) => sum + (loan.amount || 0), 0);

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

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="text-white" style={{backgroundColor: '#35B276'}}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5" />
                Active Lending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                ${totalLentActive.toLocaleString()}
              </div>
              <p className="opacity-80">{lentLoans.filter(l => l.status === 'active').length} active loans</p>
            </CardContent>
          </Card>

          <Card className="text-white" style={{backgroundColor: '#35B276'}}>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5" />
                Active Borrowing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                ${totalBorrowedActive.toLocaleString()}
              </div>
              <p className="opacity-80">{borrowedLoans.filter(l => l.status === 'active').length} active loans</p>
            </CardContent>
          </Card>
        </div>

        {/* Loan Progress */}
        {user && loans.length > 0 && (
          <LoanProgress loans={loans} userId={user.id} />
        )}

        {/* Loans Tabs */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60">
          <Tabs defaultValue="borrowed" className="w-full">
            <CardHeader className="border-b border-slate-200/40">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                <TabsTrigger value="borrowed" className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4" />
                  Borrowed ({borrowedLoans.length})
                </TabsTrigger>
                <TabsTrigger value="lent" className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Lent ({lentLoans.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="p-6">
              <TabsContent value="borrowed" className="space-y-6">
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
                  <>
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-3">Active</h3>
                      <div className="space-y-4">
                        {renderLoanSection(borrowedLoans.filter(l => l.status === 'active'), 'borrowed', 'active')}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200/40">
                      <h3 className="font-semibold text-slate-700 mb-3">Inactive</h3>
                      <div className="space-y-4">
                        {/* Only show completed or cancelled loans in inactive section */}
                        {renderLoanSection(borrowedLoans.filter(l => l.status === 'completed' || l.status === 'cancelled'), 'borrowed', 'inactive')}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="lent" className="space-y-6">
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
                  <>
                    <div>
                      <h3 className="font-semibold text-slate-700 mb-3">Active</h3>
                      <div className="space-y-4">
                        {renderLoanSection(lentLoans.filter(l => l.status === 'active'), 'lent', 'active')}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200/40">
                      <h3 className="font-semibold text-slate-700 mb-3">Inactive</h3>
                      <div className="space-y-4">
                        {/* Only show completed or cancelled loans in inactive section */}
                        {renderLoanSection(lentLoans.filter(l => l.status === 'completed' || l.status === 'cancelled'), 'lent', 'inactive')}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Modals */}
        {showPaymentModal && selectedLoan && (
          <SendMoneyModal
            loan={selectedLoan}
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={handlePaymentComplete}
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