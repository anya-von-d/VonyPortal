import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion } from "framer-motion";
import { formatMoney } from "@/components/utils/formatMoney";
import { format } from "date-fns";

export default function BorrowerSignatureModal({
  isOpen,
  onClose,
  onSign,
  onDecline,
  loanDetails,
  lenderName,
  borrowerFullName
}) {
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleSign = async () => {
    if (!signature.trim()) {
      setError("Please type your full name to sign");
      return;
    }
    if (signature.trim().toLowerCase() !== borrowerFullName.toLowerCase()) {
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

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      await onDecline();
    } catch (error) {
      console.error("Error declining:", error);
      setError("Failed to decline offer. Please try again.");
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header with solid green */}
        <div className="bg-[#35B276] p-6 rounded-t-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-3 text-2xl text-[#F3F0EC]">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#F3F0EC]" />
              </div>
              Loan Agreement
            </DialogTitle>
            <p className="text-sm mt-1" style={{ color: '#F3F0EC' }}>
              Review the loan terms carefully before signing
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Lender Info */}
          <div className="bg-[#35B276]/10 border border-[#35B276]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-[#35B276]" />
              <span className="font-semibold text-[#35B276]">Lender has signed</span>
            </div>
            <p className="text-sm text-slate-700">
              {lenderName} has reviewed and signed this loan agreement.
            </p>
          </div>

          {/* Loan Terms */}
          <div className="bg-slate-50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg text-slate-800 mb-4">Loan Terms</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Loan Amount</p>
                <p className="font-semibold text-slate-900">{formatMoney(loanDetails.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Interest Rate</p>
                <p className="font-semibold text-slate-900">{loanDetails.interest_rate}% APR</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Repayment Period</p>
                <p className="font-semibold text-slate-900">{loanDetails.repayment_period} months</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Payment Frequency</p>
                <p className="font-semibold text-slate-900 capitalize">{loanDetails.payment_frequency || 'Monthly'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Amount Due</p>
                <p className="font-semibold text-slate-900">{formatMoney(loanDetails.total_amount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Payment Amount</p>
                <p className="font-semibold text-slate-900">{formatMoney(loanDetails.payment_amount)}</p>
              </div>
              {loanDetails.due_date && (
                <div>
                  <p className="text-sm text-slate-600">Due Date</p>
                  <p className="font-semibold text-slate-900">
                    {format(new Date(loanDetails.due_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {loanDetails.purpose && (
              <div className="pt-3 border-t border-slate-200">
                <p className="text-sm text-slate-600">Purpose</p>
                <p className="font-semibold text-slate-900">{loanDetails.purpose}</p>
              </div>
            )}
          </div>

          {/* Agreement Text */}
          <div className="bg-[#35B276]/10 border border-[#35B276]/30 rounded-lg p-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              By signing below, you acknowledge and agree to the loan terms stated above as the{' '}
              <span className="font-semibold text-[#35B276]">Borrower</span>.
              You commit to fulfilling all obligations outlined in this agreement.
            </p>
          </div>

          {/* Signature Input */}
          <div className="space-y-2">
            <Label htmlFor="signature" className="text-base">
              Type your full name to sign <span className="text-red-500">*</span>
            </Label>
            <Input
              id="signature"
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                setError("");
              }}
              placeholder="Enter your full name"
              className="text-lg font-serif"
            />
            <p className="text-sm text-slate-500">
              Please type: <strong>{borrowerFullName}</strong>
            </p>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-12"
              disabled={isSigning || isDeclining}
            >
              <X className="w-4 h-4 mr-1" />
              {isDeclining ? 'Declining...' : 'Decline Offer'}
            </Button>
            <Button
              onClick={handleSign}
              className="flex-1 bg-[#35B276] hover:bg-[#2d9a65] h-12 shadow-lg shadow-green-600/25"
              disabled={isSigning || isDeclining}
            >
              {isSigning ? 'Signing...' : 'Sign & Accept'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
