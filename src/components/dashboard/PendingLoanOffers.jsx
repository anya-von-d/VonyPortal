import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, XCircle, DollarSign, Calendar, Percent, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PendingLoanOffers({ offers, users, onAccept, onDecline }) {
  const getUserById = (userId) => {
    const safeUsers = Array.isArray(users) ? users : [];
    // The users prop is now a list of Public Profiles, so we find by user_id
    const foundUser = safeUsers.find(u => u && u.user_id === userId);
    return foundUser || {
      user_id: userId,
      username: 'user',
      full_name: 'Unknown User',
      profile_picture_url: null
    };
  };

  const safeOffers = Array.isArray(offers) ? offers : [];

  if (safeOffers.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card style={{backgroundColor: '#dcfce7', borderColor: '#86efac'}} className="backdrop-blur-sm border-2">
        <CardHeader className="pb-4" style={{borderBottomColor: 'rgb(var(--theme-border))'}}>
          <CardTitle className="flex items-center gap-2" style={{color: 'rgb(var(--theme-primary))'}}>
            <Bell className="w-5 h-5" style={{color: 'rgb(var(--theme-primary))'}} />
            Pending Loan Offers ({safeOffers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {safeOffers.map((offer, index) => {
              if (!offer) return null;
              
              const lender = getUserById(offer.lender_id);
              
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-green-300"
                   style={{backgroundColor: 'rgba(255, 255, 255, 0.7)'}}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={lender.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((lender?.full_name || 'User').charAt(0))}&background=22c55e&color=fff&size=128`}
                          alt={lender.full_name || 'User'} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {lender?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-slate-500">
                            @{lender?.username || 'unknown'} • {offer.created_at ? format(new Date(offer.created_at), 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">${offer.amount?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-blue-600" />
                          <span>{offer.interest_rate || 0}% APR</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>{offer.repayment_period || 0}m term</span>
                        </div>
                        <div className="text-slate-600">
                          <span>${offer.payment_amount?.toFixed(2) || '0.00'} {offer.payment_frequency || 'monthly'}</span>
                        </div>
                      </div>
                      
                      {offer.purpose && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-slate-700 mb-1">Purpose</p>
                          <p className="text-sm text-slate-600">{offer.purpose}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-3 md:flex-col">
                      <Button
                        onClick={() => onAccept(offer.id)}
                        className="bg-green-600 hover:bg-green-700 font-semibold flex-1 md:flex-none"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => onDecline(offer.id)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 font-semibold flex-1 md:flex-none"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}