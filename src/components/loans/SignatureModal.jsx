import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle, DollarSign, Percent, Calendar, CreditCard, CheckCircle, PenLine } from "lucide-react";
import { motion } from "framer-motion";
import { formatMoney } from "@/components/utils/formatMoney";

export default function SignatureModal({ isOpen, onClose, onSign, loanDetails, userFullName, signingAs }) {
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    if (!signature.trim()) {
      setError("Please type your full name to sign");
      return;
    }
    if (signature.trim().toLowerCase() !== userFullName.toLowerCase()) {
      setError("Signature must match your full name");
      return;
    }

    setIsSigning(true);
    try {
      await onSign(signature.trim());
      setSignature("");
      setError("");
    } catch (error) {
      console.error("Error signing:", error);
      setError("Failed to sign agreement. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  const isSignatureValid = signature.trim().toLowerCase() === userFullName?.toLowerCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header with solid green */}
        <div className="bg-[#35B276] p-6 rounded-t-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-2xl text-[#F3F0EC]">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#F3F0EC]" />
              </div>
              Loan Agreement
            </DialogTitle>
            <DialogDescription className="text-[#F3F0EC]/90">
              Review the terms and sign to {signingAs === 'Lender' ? 'create this loan offer' : 'accept this loan'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Loan Terms Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-600" />
              Loan Terms
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatMoney(loanDetails.amount)}</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Interest</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{loanDetails.interest_rate}%</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Term</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{loanDetails.repayment_period} <span className="text-sm font-normal text-slate-500">months</span></p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment</p>
                </div>
                <p className="text-xl font-bold text-slate-800">{formatMoney(loanDetails.payment_amount)}</p>
                <p className="text-xs text-slate-500 capitalize">{loanDetails.payment_frequency}</p>
              </div>
            </div>

            {/* Total Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">Total Amount Due</span>
              <span className="text-2xl font-bold text-green-600">{formatMoney(loanDetails.total_amount)}</span>
            </div>
          </div>

          {/* Agreement Notice */}
          <div className="bg-[#35B276]/10 border border-[#35B276]/30 rounded-xl p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              By signing below, you acknowledge and agree to the loan terms stated above as the{' '}
              <span className="font-semibold text-[#35B276]">{signingAs}</span>.
              You commit to fulfilling all obligations outlined in this agreement.
            </p>
          </div>

          {/* Signature Section */}
          <div className="space-y-3">
            <Label htmlFor="signature" className="text-base font-medium text-slate-700 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-green-600" />
              Type your full name to sign
            </Label>
            <div className="relative">
              <Input
                id="signature"
                value={signature}
                onChange={(e) => {
                  setSignature(e.target.value);
                  setError("");
                }}
                placeholder={userFullName}
                className={`text-lg h-14 font-serif italic border-2 transition-all ${
                  signature && isSignatureValid
                    ? 'border-green-500 bg-green-50/50 focus:ring-green-500'
                    : signature && !isSignatureValid
                    ? 'border-amber-400 bg-amber-50/30'
                    : 'border-slate-200 focus:border-green-500'
                }`}
              />
              {signature && isSignatureValid && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </motion.div>
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <span className="text-slate-400">Please type:</span>
              <span className="font-medium text-slate-700">{userFullName}</span>
            </p>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-lg"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 text-base border-slate-300"
              disabled={isSigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSign}
              className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25"
              disabled={isSigning || !isSignatureValid}
            >
              {isSigning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Signing...
                </>
              ) : (
                <>
                  <PenLine className="w-5 h-5 mr-2" />
                  Sign Agreement
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
