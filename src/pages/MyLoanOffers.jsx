import React, { useState, useEffect } from "react";
import { Loan, User, PublicProfile } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

import MyLoanOffers from "../components/dashboard/MyLoanOffers";

export default function MyLoanOffersPage() {
  const [loans, setLoans] = useState([]);
  const [user, setUser] = useState(null);
  const [publicProfiles, setPublicProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadData();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [allLoans, profiles] = await Promise.all([
        Loan.list('-updated_date').catch(() => []),
        PublicProfile.list().catch(() => [])
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

  const getUserById = (userId) => {
    const profile = publicProfiles.find(p => p.user_id === userId);
    return profile || { username: 'user', full_name: 'Unknown User' };
  };

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
         {allOffers.filter(offer => offer.status === 'pending').length > 0 ? (
           <MyLoanOffers
             offers={allOffers.filter(offer => offer.status === 'pending')}
             users={publicProfiles}
             currentUser={user}
             onDelete={handleDeleteOffer}
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