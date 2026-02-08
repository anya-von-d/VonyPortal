import React, { useState, useEffect } from "react";
import { Loan, User, PublicProfile, LoanAgreement } from "@/entities/all";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

import MyLoanOffers from "../components/dashboard/MyLoanOffers";

export default function MyLoanOffersPage() {
  const [loans, setLoans] = useState([]);
  const [user, setUser] = useState(null);
  const [publicProfiles, setPublicProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      console.log('Current user:', currentUser?.id);

      const [allLoans, profiles] = await Promise.all([
        Loan.list('-created_at').catch((e) => { console.error('Error loading loans:', e); return []; }),
        PublicProfile.list().catch((e) => { console.error('Error loading profiles:', e); return []; })
      ]);

      console.log('All loans loaded:', allLoans?.length, allLoans);
      console.log('User loans (lender or borrower):', allLoans?.filter(loan =>
        loan.lender_id === currentUser?.id || loan.borrower_id === currentUser?.id
      ));

      setLoans(allLoans || []);
      setPublicProfiles(profiles || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteOffer = async (loanId) => {
    try {
      await Loan.delete(loanId);
      loadData();
    } catch (error) {
      console.error("Error deleting loan offer:", error);
    }
  };

  const handleSignOffer = async (loanId, signature) => {
    try {
      // Update loan status to active when borrower signs
      await Loan.update(loanId, { status: 'active' });

      // Find the existing loan agreement and update it with borrower's signature
      const agreements = await LoanAgreement.list();
      const agreement = agreements.find(a => a.loan_id === loanId);

      if (agreement) {
        await LoanAgreement.update(agreement.id, {
          borrower_name: signature,
          borrower_signed_date: new Date().toISOString(),
          is_fully_signed: true
        });
      } else {
        console.warn('No loan agreement found for loan:', loanId);
      }

      loadData();
    } catch (error) {
      console.error("Error signing loan offer:", error);
    }
  };

  const handleDeclineOffer = async (loanId) => {
    try {
      // Update loan status to declined
      await Loan.update(loanId, { status: 'declined' });
      loadData();
    } catch (error) {
      console.error("Error declining loan offer:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6" style={{background: `linear-gradient(to bottom right, rgb(var(--theme-bg-from)), rgb(var(--theme-bg-to)))`}}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 p-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading your loan offers...</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const allOffers = user ? loans.filter(loan => loan.lender_id === user.id || loan.borrower_id === user.id) : [];

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
            My Loan Offers
          </h1>
          <p className="text-lg text-slate-600 text-center">
            Manage all your pending offers
          </p>
        </motion.div>

        {/* Pending Offers Section - only show offers that haven't been signed by both parties */}
        {allOffers.filter(offer => offer.status === 'pending' || !offer.status).length > 0 ? (
          <MyLoanOffers
            offers={allOffers.filter(offer => offer.status === 'pending' || !offer.status)}
            users={publicProfiles}
            currentUser={user}
            onDelete={handleDeleteOffer}
            onSign={handleSignOffer}
            onDecline={handleDeclineOffer}
          />
        ) : (
          <Card className="bg-white border-slate-200">
            <CardContent className="p-8 text-center text-slate-500">
              No pending loan offers
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
