import React, { useState, useEffect } from "react";
import { Loan, User, PublicProfile, LoanAgreement } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Send, Inbox } from "lucide-react";

import MyLoanOffers from "../components/dashboard/MyLoanOffers";

export default function MyLoanOffersPage() {
  const [loans, setLoans] = useState([]);
  const [user, setUser] = useState(null);
  const [publicProfiles, setPublicProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [allLoans, profiles] = await Promise.all([
        Loan.list('-created_at').catch((e) => { console.error('Error loading loans:', e); return []; }),
        PublicProfile.list().catch((e) => { console.error('Error loading profiles:', e); return []; })
      ]);

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

  // Split offers into sent (user is lender) and received (user is borrower)
  const pendingOffers = user ? loans.filter(loan =>
    (loan.lender_id === user.id || loan.borrower_id === user.id) && loan.status === 'pending'
  ) : [];

  const sentOffers = pendingOffers.filter(offer => offer.lender_id === user?.id);
  const receivedOffers = pendingOffers.filter(offer => offer.borrower_id === user?.id);

  const hasNoOffers = sentOffers.length === 0 && receivedOffers.length === 0;

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

          {/* Toggle Buttons */}
          <div className="flex justify-center gap-3 mt-6">
            <Button
              onClick={() => setActiveTab('received')}
              variant={activeTab === 'received' ? 'default' : 'outline'}
              className={`flex items-center gap-2 ${
                activeTab === 'received'
                  ? 'bg-[#35B276] hover:bg-[#2d9a65] text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Offers Received ({receivedOffers.length})
            </Button>
            <Button
              onClick={() => setActiveTab('sent')}
              variant={activeTab === 'sent' ? 'default' : 'outline'}
              className={`flex items-center gap-2 ${
                activeTab === 'sent'
                  ? 'bg-[#35B276] hover:bg-[#2d9a65] text-white'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Send className="w-4 h-4" />
              Offers Sent ({sentOffers.length})
            </Button>
          </div>
        </motion.div>

        {/* Content based on active tab */}
        {activeTab === 'received' ? (
          <motion.div
            key="received"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-slate-200">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-blue-600" />
                  </div>
                  Offers Received
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Loan offers from your friends waiting for your response</p>
              </CardHeader>
              <CardContent className="p-6">
                {receivedOffers.length > 0 ? (
                  <MyLoanOffers
                    offers={receivedOffers}
                    users={publicProfiles}
                    currentUser={user}
                    onDelete={handleDeleteOffer}
                    onSign={handleSignOffer}
                    onDecline={handleDeclineOffer}
                    hideHeader={true}
                  />
                ) : (
                  <p className="text-slate-500 text-center py-4">No offers received</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card style={{backgroundColor: `rgb(var(--theme-card-bg))`, borderColor: `rgb(var(--theme-border))`}} className="backdrop-blur-sm">
              <CardHeader className="pb-4 border-b border-slate-200">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Send className="w-4 h-4 text-green-600" />
                  </div>
                  Offers Sent
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">Loan offers you've sent waiting for acceptance</p>
              </CardHeader>
              <CardContent className="p-6">
                {sentOffers.length > 0 ? (
                  <MyLoanOffers
                    offers={sentOffers}
                    users={publicProfiles}
                    currentUser={user}
                    onDelete={handleDeleteOffer}
                    onSign={handleSignOffer}
                    onDecline={handleDeclineOffer}
                    hideHeader={true}
                  />
                ) : (
                  <p className="text-slate-500 text-center py-4">No offers sent</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
